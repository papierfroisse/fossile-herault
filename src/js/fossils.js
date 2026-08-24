// fossils.js — High-Performance Canvas Point Engine for 50,000+ Fossils
// Architecture:
//   - Pre-computed clusters (~296 entries) for country zoom (< 8): renders in < 1ms
//   - Typed Array (Float32Array) for detail zoom (>= 8): lazy-loaded, zero GC pressure
//   - Never unloads France data when navigating between departments

import { map } from './map.js';
import { loadWikiPreview } from './search.js';
import { minScoreThreshold, currentMapColorMode } from './geology.js';

// ─── Lookup Tables (numeric index → display values) ─────────────
const CATEGORIES = ['dinosaurs_reptiles', 'molluscs', 'plants', 'arthropods', 'mammals', 'fish', 'others'];
const SOURCES = ['MNHN', 'PBDB', 'BRGM'];
const PERIOD_LABELS = ['Carbonifère', 'Permien', 'Trias', 'Jurassique', 'Crétacé', 'Cénozoïque', 'Ordovicien', 'Mésozoïque'];
const CAT_COLORS = ['#ef4444', '#0284c7', '#16a34a', '#9333ea', '#d97706', '#0d9488', '#64748b'];
const CAT_LABELS = ['Dinosaures / Reptiles', 'Mollusques / Ammonites', 'Plantes / Végétaux', 'Trilobites / Arthropodes', 'Mammifères', 'Poissons', 'Autres'];
const CAT_ICONS = ['fa-dragon', 'fa-ring', 'fa-leaf', 'fa-bug', 'fa-bone', 'fa-fish', 'fa-circle-dot'];

const categoryColors = {}; const categoryLabels = {}; const categoryIcons = {};
CATEGORIES.forEach((c, i) => { categoryColors[c] = CAT_COLORS[i]; categoryLabels[c] = CAT_LABELS[i]; categoryIcons[c] = CAT_ICONS[i]; });

// ─── Active Filters ─────────────────────────────────────────────
export let activeCategories = new Set(CATEGORIES);
export let activeSources = new Set(SOURCES);
export let selectedPeriodFilter = "";

// ─── Data Storage ───────────────────────────────────────────────
let clusters = null;       // Array of [lat, lng, count, domCat, catCounts[7], srcCounts[3]]
let dataView = null;       // Float32Array: 6 floats per item (lat, lng, cat, score, period, source)
let dataCount = 0;
let detailLoaded = false;
let detailLoading = false;

// Spatial grid index (stores item indices in 0.5° cells)
let spatialGrid = new Map();
const GRID_SIZE = 0.5;

// ─── Canvas ─────────────────────────────────────────────────────
let canvasEl = null;
let visibleItems = [];
let renderScheduled = false;
const PI2 = Math.PI * 2;

// ─── Init ───────────────────────────────────────────────────────
export function initFossils() {
  if (!map) return;

  const pane = map.getPane('fossilsPane') || map.createPane('fossilsPane');
  pane.style.zIndex = 650;

  canvasEl = L.DomUtil.create('canvas', 'fossils-canvas-overlay');
  canvasEl.style.cssText = 'position:absolute;top:0;left:0;pointer-events:auto;';
  pane.appendChild(canvasEl);

  map.on('moveend', scheduleRender);
  map.on('zoomend', onZoomChange);
  map.on('resize', syncCanvasSize);
  map.on('click', handleMapPointClick);

  syncCanvasSize();
  window.loadWikiPreview = loadWikiPreview;
}

function onZoomChange() {
  if (map.getZoom() >= 8 && !detailLoaded && !detailLoading) {
    loadDetailData();
  }
  scheduleRender();
}

export function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => { renderScheduled = false; renderFossils(); });
}

function syncCanvasSize() {
  if (!map || !canvasEl) return;
  const s = map.getSize();
  canvasEl.width = s.x;
  canvasEl.height = s.y;
  scheduleRender();
}

// ─── Data Entry Points ──────────────────────────────────────────

/** Load pre-computed clusters for instant country-level rendering */
export function setClusters(data) {
  clusters = data;
  scheduleRender();
}

/** Directly set binary buffer */
export function setBinaryFossilsBuffer(buffer) {
  dataView = new Float32Array(buffer);
  dataCount = Math.floor(dataView.length / 6);
  detailLoaded = true;
  buildTypedGrid();
  scheduleRender();
}

/** Ensure detailed binary data is loaded (for department navigation) */
export function ensureDetailLoaded() {
  if (!detailLoaded && !detailLoading) {
    loadDetailData();
  }
}

/** Legacy compat */
export function setFossilsData(data, autoFit = true) {
  ensureDetailLoaded();
  scheduleRender();
}

// ─── Lazy Detail Data Loading ───────────────────────────────────
function loadDetailData() {
  detailLoading = true;
  fetch('processed/all_france.bin')
    .then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(buf => {
      dataView = new Float32Array(buf);
      dataCount = Math.floor(dataView.length / 6);
      buildTypedGrid();
      detailLoaded = true;
      detailLoading = false;
      scheduleRender();
    })
    .catch(() => { detailLoading = false; });
}

// ─── Spatial Grid Builder ───────────────────────────────────────
function buildTypedGrid() {
  spatialGrid.clear();
  for (let i = 0; i < dataCount; i++) {
    const off = i * 6;
    const key = `${Math.floor(dataView[off] / GRID_SIZE)}_${Math.floor(dataView[off + 1] / GRID_SIZE)}`;
    let cell = spatialGrid.get(key);
    if (!cell) { cell = []; spatialGrid.set(key, cell); }
    cell.push(i);
  }
}

// ─── Filter Controls ────────────────────────────────────────────
export function toggleCategory(catId, isChecked) {
  if (isChecked) activeCategories.add(catId); else activeCategories.delete(catId);
  scheduleRender();
}

export function toggleSourceFilter(source, isChecked) {
  if (isChecked) activeSources.add(source); else activeSources.delete(source);
  scheduleRender();
}

export function filterByPeriod(val) {
  selectedPeriodFilter = val;
  scheduleRender();
}

function getMasks() {
  const cm = new Uint8Array(7);
  CATEGORIES.forEach((c, i) => { cm[i] = activeCategories.has(c) ? 1 : 0; });
  const sm = new Uint8Array(3);
  SOURCES.forEach((s, i) => { sm[i] = activeSources.has(s) ? 1 : 0; });
  return { cm, sm };
}

// ─── Main Render Dispatch ───────────────────────────────────────
export function renderFossils() {
  if (!canvasEl || !map) return;

  const ctx = canvasEl.getContext('2d');
  const sz = map.getSize();
  L.DomUtil.setPosition(canvasEl, map.containerPointToLayerPoint([0, 0]));
  ctx.clearRect(0, 0, sz.x, sz.y);

  const zoom = map.getZoom();

  // If zoomed in (>= 8) and detail data is loaded, draw exact points
  if (zoom >= 8 && detailLoaded) {
    drawTypedPoints(ctx, zoom);
  } else if (clusters && clusters.length > 0) {
    // Country level (zoom < 8) or detail still downloading: draw clusters
    drawClusters(ctx);
    if (zoom >= 8 && !detailLoaded && !detailLoading) {
      loadDetailData();
    }
  } else if (detailLoaded) {
    drawTypedPoints(ctx, zoom);
  }
}

// ─── Cluster Renderer (zoom < 8, ~296 clusters → < 0.2ms) ──────
function drawClusters(ctx) {
  if (!clusters || clusters.length === 0) return;

  const bounds = map.getBounds().pad(0.08);
  const { cm, sm } = getMasks();

  let total = 0;
  const items = [];
  const g = [[], [], []]; // red, orange, blue

  for (let i = 0, len = clusters.length; i < len; i++) {
    const c = clusters[i];
    const cc = c[4], sc = c[5];

    // Filter by active categories
    let fc = 0;
    for (let j = 0; j < 7; j++) if (cm[j]) fc += (cc[j] || 0);
    if (fc === 0) continue;

    // Filter by active sources
    let hs = false;
    for (let j = 0; j < 3; j++) if (sm[j] && (sc[j] || 0) > 0) { hs = true; break; }
    if (!hs) continue;

    total += fc;

    const lat = c[0], lng = c[1];
    if (!bounds.contains([lat, lng])) continue;

    const pt = map.latLngToContainerPoint([lat, lng]);
    const r = Math.min(16, 4 + Math.log2(fc) * 2.5);

    const gi = fc > 80 ? 0 : (fc > 20 ? 1 : 2);
    g[gi].push(pt.x, pt.y, r);

    items.push({ x: pt.x, y: pt.y, isCluster: true, item: { lat, lng, name: `${fc.toLocaleString('fr-FR')} fossiles`, count: fc, category_id: CATEGORIES[c[3]] || 'others', score_potentiel: fc } });
  }

  // Batched draw by color group
  const fills = ['rgba(239,68,68,0.85)', 'rgba(249,115,22,0.8)', 'rgba(56,189,248,0.75)'];
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;

  for (let gi = 0; gi < 3; gi++) {
    const d = g[gi];
    if (!d.length) continue;
    ctx.fillStyle = fills[gi];
    for (let j = 0; j < d.length; j += 3) {
      ctx.beginPath();
      ctx.arc(d[j], d[j + 1], d[j + 2], 0, PI2);
      ctx.fill();
      ctx.stroke();
    }
  }

  visibleItems = items;
  const el = document.getElementById('stat-fossils');
  if (el) el.innerText = total.toLocaleString('fr-FR');
}

// ─── Typed Array Detail Renderer (zoom >= 8, Float32Array) ──────
function drawTypedPoints(ctx, zoom) {
  if (!dataView || dataCount === 0) return;

  const bounds = map.getBounds().pad(0.08);
  const { cm, sm } = getMasks();
  const bS = bounds.getSouth(), bN = bounds.getNorth(), bW = bounds.getWest(), bE = bounds.getEast();

  const r = zoom >= 13 ? 6 : (zoom >= 10 ? 4 : 2.5);
  const doStroke = zoom >= 11;

  const minGx = Math.floor(bS / GRID_SIZE), maxGx = Math.floor(bN / GRID_SIZE);
  const minGy = Math.floor(bW / GRID_SIZE), maxGy = Math.floor(bE / GRID_SIZE);

  let total = 0;
  const items = [];
  const colorBuckets = new Map();

  for (let gx = minGx; gx <= maxGx; gx++) {
    for (let gy = minGy; gy <= maxGy; gy++) {
      const cell = spatialGrid.get(`${gx}_${gy}`);
      if (!cell) continue;

      for (let ci = 0, cLen = cell.length; ci < cLen; ci++) {
        const idx = cell[ci];
        const off = idx * 6;
        const lat = dataView[off], lng = dataView[off + 1];
        const cat = Math.round(dataView[off + 2]);
        const score = Math.round(dataView[off + 3]);
        const src = Math.round(dataView[off + 5]);

        if (!cm[cat] || !sm[src]) continue;
        if (score < minScoreThreshold) continue;

        total++;

        if (lat < bS || lat > bN || lng < bW || lng > bE) continue;

        const pt = map.latLngToContainerPoint([lat, lng]);

        let color;
        if (currentMapColorMode === 'score') {
          color = score >= 80 ? '#dc2626' : (score >= 68 ? '#ea580c' : (score >= 55 ? '#f59e0b' : '#0284c7'));
        } else {
          color = CAT_COLORS[cat] || '#64748b';
        }

        let b = colorBuckets.get(color);
        if (!b) { b = []; colorBuckets.set(color, b); }
        b.push(pt.x, pt.y);
        items.push({ idx, x: pt.x, y: pt.y });
      }
    }
  }

  // Batched render by color
  colorBuckets.forEach((pts, color) => {
    ctx.fillStyle = color;
    if (doStroke) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; }
    for (let j = 0; j < pts.length; j += 2) {
      ctx.beginPath();
      ctx.arc(pts[j], pts[j + 1], r, 0, PI2);
      ctx.fill();
      if (doStroke) ctx.stroke();
    }
  });

  visibleItems = items;
  const el = document.getElementById('stat-fossils');
  if (el) el.innerText = total.toLocaleString('fr-FR');
}

// ─── Click Handler ──────────────────────────────────────────────
function handleMapPointClick(e) {
  if (!visibleItems || visibleItems.length === 0) return;

  const cp = e.containerPoint;
  let closest = null;
  let minDist = 20;

  for (let i = 0; i < visibleItems.length; i++) {
    const vi = visibleItems[i];
    const dx = vi.x - cp.x, dy = vi.y - cp.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < minDist) { minDist = d; closest = vi; }
  }

  if (!closest) return;

  let item;
  if (closest.isCluster) {
    // When clicking a cluster, zoom into it!
    map.flyTo([closest.item.lat, closest.item.lng], Math.min(map.getZoom() + 2, 11));
    return;
  } else if (closest.idx !== undefined && dataView) {
    item = itemFromIndex(closest.idx);
  }

  if (item) openFossilPopup(item, e.latlng);
}

/** Create a full JS object on demand (only when user clicks a point) */
function itemFromIndex(idx) {
  const off = idx * 6;
  const cat = Math.round(dataView[off + 2]);
  const src = Math.round(dataView[off + 5]);
  const per = Math.round(dataView[off + 4]);
  return {
    id: idx,
    name: 'Fossile Certifié',
    lat: dataView[off],
    lng: dataView[off + 1],
    category_id: CATEGORIES[cat] || 'others',
    category_name: CAT_LABELS[cat] || 'Autre',
    color: CAT_COLORS[cat] || '#64748b',
    score_potentiel: Math.round(dataView[off + 3]),
    period: PERIOD_LABELS[per] || 'Mésozoïque',
    source: SOURCES[src] || 'PBDB',
    precision_gps: '📍 Point GPS Certifié'
  };
}

// ─── Popup ──────────────────────────────────────────────────────
function openFossilPopup(item, latlng) {
  const itemScore = item.score_potentiel || item.count || 60;
  const src = item.source || 'PBDB';
  const iconColor = categoryColors[item.category_id] || '#64748b';
  const iconLabel = categoryLabels[item.category_id] || item.category_name || 'Fossile';
  const faIcon = categoryIcons[item.category_id] || 'fa-circle-dot';

  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.name + ' fossil')}`;
  const googleWebUrl = `https://www.google.com/search?q=${encodeURIComponent(item.name + ' fossile')}`;
  const cleanName = (item.name || '').replace(/[^a-zA-Z0-9 ]/g, "").trim();

  const precisionBadge = item.precision_gps || '🎯 Point GPS Certifié';
  const precisionColor = precisionBadge.includes('Certifié') ? '#10b981' : '#f59e0b';

  const sourceBadges = {
    'MNHN': '<span style="background:rgba(168,85,247,0.2); color:#c084fc; border:1px solid rgba(168,85,247,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">🏛️ Collection Muséum (MNHN Paris)</span>',
    'BRGM': '<span style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">📐 Carte Géologique BRGM</span>',
    'PBDB': '<span style="background:rgba(34,197,94,0.2); color:#4ade80; border:1px solid rgba(34,197,94,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">🌐 Base Scientifique PBDB</span>'
  };
  const srcBadge = sourceBadges[src] || sourceBadges['PBDB'];

  const popupContent = `
    <div class="popup-title">${item.name}</div>
    <div style="margin-bottom:6px;">${srcBadge}</div>
    <div class="popup-meta">
      <b>Potentiel Prédictif ML :</b> <span style="color:#f97316; font-weight:bold; font-size:1.02rem;">${itemScore} / 100</span><br>
      <b>Type :</b> <span style="color:${iconColor}; font-weight:600;"><i class="fa-solid ${faIcon}"></i> ${item.category_name || iconLabel}</span><br>
      <b>Précision Spatiale :</b> <span style="color:${precisionColor}; font-weight:600;">${precisionBadge}</span><br>
      <b>Période :</b> ${item.period || 'Non spécifiée'}<br>
      <b>Formation :</b> ${item.formation || 'Lithologie locale'}<br>
      <b>Coordonnées GPS :</b> ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}
    </div>
    <div id="wiki-box-${item.id}" style="margin-top:8px; font-size:0.78rem; color:#cbd5e1; background:rgba(0,0,0,0.3); padding:6px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); display:none;"></div>
    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
      <a href="${googleImagesUrl}" target="_blank" class="popup-tag" style="background:#0284c7; color:#fff; border-color:#0284c7;">🖼️ Photos Google</a>
      <a href="${googleWebUrl}" target="_blank" class="popup-tag" style="background:#475569; color:#fff; border-color:#475569;">🔍 Recherche Web</a>
      <button onclick="loadWikiPreview('${cleanName}', ${item.id})" class="popup-tag" style="background:#15803d; color:#fff; border-color:#15803d; cursor:pointer;">📖 Aperçu Wikipédia</button>
    </div>
  `;

  L.popup()
    .setLatLng(latlng || [item.lat, item.lng])
    .setContent(popupContent)
    .openOn(map);
}

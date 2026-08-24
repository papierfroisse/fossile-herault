// fossils.js — High-Performance Canvas Point Engine for 50,000+ Fossils
// Architecture:
//   - Pre-computed clusters (~296 entries) for country zoom (< 8): renders in < 1ms
//   - Typed Array (Float32Array) for detail zoom (>= 8): lazy-loaded, zero GC pressure
//   - Legacy object mode for single department loads (< 2000 items)

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

// Legacy object lookups (for popup rendering)
const categoryColors = {}; const categoryLabels = {}; const categoryIcons = {};
CATEGORIES.forEach((c, i) => { categoryColors[c] = CAT_COLORS[i]; categoryLabels[c] = CAT_LABELS[i]; categoryIcons[c] = CAT_ICONS[i]; });

// ─── Active Filters ─────────────────────────────────────────────
export let activeCategories = new Set(CATEGORIES);
export let activeSources = new Set(SOURCES);
export let selectedPeriodFilter = "";

// ─── Data Storage ───────────────────────────────────────────────
// Mode A: Clusters + lazy-loaded Float32Array ("Toute la France" — 50k items)
let clusters = null;       // Array of [lat, lng, count, domCat, catCounts[7], srcCounts[3]]
let dataView = null;       // Float32Array: 6 floats per item (lat, lng, cat, score, period, source)
let dataCount = 0;
let detailLoaded = false;
let detailLoading = false;
let typedMode = false;

// Mode B: Legacy object array (single department — small datasets)
export let fossilsData = [];

// Spatial grid index (stores item indices)
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
  if (map.getZoom() >= 8 && typedMode && !detailLoaded && !detailLoading) {
    loadDetailData();
  }
  scheduleRender();
}

function scheduleRender() {
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
  typedMode = true;
  fossilsData = [];
  detailLoaded = false;
  detailLoading = false;
  scheduleRender();
}

/** Backward compat: directly set binary buffer (skips lazy loading) */
export function setBinaryFossilsBuffer(buffer) {
  dataView = new Float32Array(buffer);
  dataCount = Math.floor(dataView.length / 6);
  typedMode = true;
  detailLoaded = true;
  buildTypedGrid();
  scheduleRender();
}

/** Legacy: set array of objects for single department mode */
export function setFossilsData(data, autoFit = true) {
  fossilsData = data || [];
  typedMode = false;
  clusters = null;
  dataView = null;
  dataCount = 0;
  detailLoaded = false;

  buildLegacyGrid();
  scheduleRender();

  if (autoFit && fossilsData.length > 0 && map) {
    const lls = fossilsData.map(i => [i.lat, i.lng]);
    const b = L.latLngBounds(lls);
    if (b.isValid()) map.fitBounds(b, { padding: [40, 40], maxZoom: 13 });
  }
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

// ─── Spatial Grid Builders ──────────────────────────────────────
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

function buildLegacyGrid() {
  spatialGrid.clear();
  for (let i = 0; i < fossilsData.length; i++) {
    const it = fossilsData[i];
    const key = `${Math.floor(it.lat / GRID_SIZE)}_${Math.floor(it.lng / GRID_SIZE)}`;
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

// ─── Projection & Filter Helpers ────────────────────────────────
function getProj(bounds) {
  const nw = bounds.getNorthWest(), se = bounds.getSouthEast();
  const pNW = map.latLngToContainerPoint(nw), pSE = map.latLngToContainerPoint(se);
  return {
    lngMin: nw.lng, latMax: nw.lat,
    pxL: pNW.x, pxT: pNW.y,
    sX: (pSE.x - pNW.x) / (se.lng - nw.lng),
    sY: (pSE.y - pNW.y) / (nw.lat - se.lat)
  };
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

  if (typedMode) {
    if (zoom < 8 || !detailLoaded) {
      drawClusters(ctx);
      if (zoom >= 8 && !detailLoaded && !detailLoading) loadDetailData();
    } else {
      drawTypedPoints(ctx, zoom);
    }
  } else if (fossilsData.length > 0) {
    drawLegacyPoints(ctx, zoom);
  }
}

// ─── Cluster Renderer (zoom < 8, ~296 clusters → < 1ms) ────────
function drawClusters(ctx) {
  if (!clusters || clusters.length === 0) return;

  const bounds = map.getBounds().pad(0.05);
  const { cm, sm } = getMasks();
  const p = getProj(bounds);
  const bS = bounds.getSouth(), bN = bounds.getNorth(), bW = bounds.getWest(), bE = bounds.getEast();

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
    if (lat < bS || lat > bN || lng < bW || lng > bE) continue;

    const px = p.pxL + (lng - p.lngMin) * p.sX;
    const py = p.pxT + (p.latMax - lat) * p.sY;
    const r = Math.min(16, 4 + Math.log2(fc) * 2.5);

    const gi = fc > 80 ? 0 : (fc > 20 ? 1 : 2);
    g[gi].push(px, py, r);

    items.push({ x: px, y: py, isCluster: true, item: { lat, lng, name: `${fc} fossiles`, count: fc, category_id: CATEGORIES[c[3]] || 'others', score_potentiel: fc } });
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

  const bounds = map.getBounds().pad(0.05);
  const { cm, sm } = getMasks();
  const pr = getProj(bounds);
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

        const px = pr.pxL + (lng - pr.lngMin) * pr.sX;
        const py = pr.pxT + (pr.latMax - lat) * pr.sY;

        let color;
        if (currentMapColorMode === 'score') {
          color = score >= 80 ? '#dc2626' : (score >= 68 ? '#ea580c' : (score >= 55 ? '#f59e0b' : '#0284c7'));
        } else {
          color = CAT_COLORS[cat] || '#64748b';
        }

        let b = colorBuckets.get(color);
        if (!b) { b = []; colorBuckets.set(color, b); }
        b.push(px, py);
        items.push({ idx, x: px, y: py });
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

// ─── Legacy Object Renderer (single department, small datasets) ─
function drawLegacyPoints(ctx, zoom) {
  const bounds = map.getBounds().pad(0.05);
  const pr = getProj(bounds);
  const bS = bounds.getSouth(), bN = bounds.getNorth(), bW = bounds.getWest(), bE = bounds.getEast();

  const r = zoom >= 13 ? 6 : (zoom >= 10 ? 4 : (zoom >= 8 ? 2.5 : 1.8));
  const doStroke = zoom >= 11;

  const minGx = Math.floor(bS / GRID_SIZE), maxGx = Math.floor(bN / GRID_SIZE);
  const minGy = Math.floor(bW / GRID_SIZE), maxGy = Math.floor(bE / GRID_SIZE);

  let total = 0;
  const items = [];

  if (zoom < 7) {
    // Density clustering for small datasets at country zoom
    const bktSz = 30;
    const dm = new Map();

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const cell = spatialGrid.get(`${gx}_${gy}`);
        if (!cell) continue;
        for (let ci = 0; ci < cell.length; ci++) {
          const item = fossilsData[cell[ci]];
          if (!activeCategories.has(item.category_id)) continue;
          if (!activeSources.has(item.source || 'PBDB')) continue;
          if ((item.score_potentiel || 60) < minScoreThreshold) continue;
          total++;
          const lat = item.lat, lng = item.lng;
          if (lat < bS || lat > bN || lng < bW || lng > bE) continue;
          const px = pr.pxL + (lng - pr.lngMin) * pr.sX;
          const py = pr.pxT + (pr.latMax - lat) * pr.sY;
          const key = ((px / bktSz) | 0) * 10000 + ((py / bktSz) | 0);
          let b = dm.get(key);
          if (!b) { b = { sx: 0, sy: 0, n: 0, sample: item }; dm.set(key, b); }
          b.sx += px; b.sy += py; b.n++;
        }
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    dm.forEach(b => {
      const ax = b.sx / b.n, ay = b.sy / b.n;
      const rad = Math.min(14, 3 + Math.log2(b.n) * 2.2);
      ctx.beginPath();
      ctx.arc(ax, ay, rad, 0, PI2);
      ctx.fillStyle = b.n > 50 ? 'rgba(239,68,68,0.85)' : (b.n > 15 ? 'rgba(249,115,22,0.8)' : 'rgba(56,189,248,0.75)');
      ctx.fill();
      ctx.stroke();
      items.push({ item: b.sample, x: ax, y: ay });
    });

  } else {
    // Individual points
    const colorBuckets = new Map();

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const cell = spatialGrid.get(`${gx}_${gy}`);
        if (!cell) continue;
        for (let ci = 0; ci < cell.length; ci++) {
          const item = fossilsData[cell[ci]];
          if (!activeCategories.has(item.category_id)) continue;
          if (!activeSources.has(item.source || 'PBDB')) continue;
          const score = item.score_potentiel || 60;
          if (score < minScoreThreshold) continue;
          total++;
          const lat = item.lat, lng = item.lng;
          if (lat < bS || lat > bN || lng < bW || lng > bE) continue;
          const px = pr.pxL + (lng - pr.lngMin) * pr.sX;
          const py = pr.pxT + (pr.latMax - lat) * pr.sY;

          let color = categoryColors[item.category_id] || '#64748b';
          if (currentMapColorMode === 'score') {
            color = score >= 80 ? '#dc2626' : (score >= 68 ? '#ea580c' : (score >= 55 ? '#f59e0b' : '#0284c7'));
          }

          let b = colorBuckets.get(color);
          if (!b) { b = []; colorBuckets.set(color, b); }
          b.push(px, py);
          items.push({ item, x: px, y: py });
        }
      }
    }

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
  }

  visibleItems = items;
  const el = document.getElementById('stat-fossils');
  if (el) el.innerText = total.toLocaleString('fr-FR');
}

// ─── Click Handler ──────────────────────────────────────────────
function handleMapPointClick(e) {
  if (!visibleItems || visibleItems.length === 0) return;

  const cp = e.containerPoint;
  let closest = null;
  let minDist = 18;

  for (let i = 0; i < visibleItems.length; i++) {
    const vi = visibleItems[i];
    const dx = vi.x - cp.x, dy = vi.y - cp.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < minDist) { minDist = d; closest = vi; }
  }

  if (!closest) return;

  let item;
  if (closest.isCluster) {
    item = closest.item;
  } else if (closest.idx !== undefined && dataView) {
    item = itemFromIndex(closest.idx);
  } else if (closest.item) {
    item = closest.item;
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
  const catalogTag = item.mnhn_catalog ? `<br><b>N° Spécimen Muséum :</b> <span style="color:#c084fc; font-weight:600;">${item.mnhn_catalog}</span>` : '';
  const deptName = item.department ? ` (Dép. ${item.department})` : '';

  const popupContent = `
    <div class="popup-title">${item.name}${deptName}</div>
    <div style="margin-bottom:6px;">${srcBadge}</div>
    <div class="popup-meta">
      <b>Potentiel Prédictif ML :</b> <span style="color:#f97316; font-weight:bold; font-size:1.02rem;">${itemScore} / 100</span><br>
      <b>Type :</b> <span style="color:${iconColor}; font-weight:600;"><i class="fa-solid ${faIcon}"></i> ${item.category_name || iconLabel}</span><br>
      <b>Précision Spatiale :</b> <span style="color:${precisionColor}; font-weight:600;">${precisionBadge}</span>${catalogTag}<br>
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

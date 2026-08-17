// Hardware-Accelerated 60 FPS Canvas Point Engine for 50,000+ Fossils
// Features: 2D Spatial Grid Indexing, Low-Zoom Density Clusters & Zero-DOM Direct Canvas Rendering
import { map } from './map.js';
import { loadWikiPreview } from './search.js';
import { minScoreThreshold, currentMapColorMode } from './geology.js';

export let fossilsData = [];
export let activeCategories = new Set(['dinosaurs_reptiles', 'molluscs', 'mammals', 'plants', 'arthropods', 'fish', 'others']);
export let activeSources = new Set(['MNHN', 'PBDB', 'BRGM']);
export let selectedPeriodFilter = "";

let canvasOverlayElement = null;
let currentVisibleItems = [];

// 2D Spatial Grid Indexing (0.5 degree cells) for sub-millisecond viewport queries
let spatialGrid = new Map();
const GRID_SIZE = 0.5;

const categoryColors = {
  'dinosaurs_reptiles': '#ef4444',
  'molluscs':           '#0284c7',
  'plants':             '#16a34a',
  'arthropods':         '#9333ea',
  'mammals':            '#d97706',
  'fish':               '#0d9488',
  'others':             '#64748b'
};

const categoryLabels = {
  'dinosaurs_reptiles': 'Dinosaures / Reptiles',
  'molluscs':           'Mollusques / Ammonites',
  'plants':             'Plantes / Végétaux',
  'arthropods':         'Trilobites / Arthropodes',
  'mammals':            'Mammifères',
  'fish':               'Poissons',
  'others':             'Autres'
};

const categoryIcons = {
  'dinosaurs_reptiles': 'fa-dragon',
  'molluscs':           'fa-ring',
  'plants':             'fa-leaf',
  'arthropods':         'fa-bug',
  'mammals':            'fa-bone',
  'fish':               'fa-fish',
  'others':             'fa-circle-dot'
};

export function initFossils() {
  if (!map) return;

  // Create hardware-accelerated Canvas container
  const pane = map.getPane('fossilsPane') || map.createPane('fossilsPane');
  pane.style.zIndex = 650;

  canvasOverlayElement = L.DomUtil.create('canvas', 'fossils-canvas-overlay');
  canvasOverlayElement.style.position = 'absolute';
  canvasOverlayElement.style.top = '0';
  canvasOverlayElement.style.left = '0';
  canvasOverlayElement.style.pointerEvents = 'auto';
  pane.appendChild(canvasOverlayElement);

  map.on('move', renderFossils);
  map.on('resize', syncCanvasSize);
  map.on('click', handleMapPointClick);

  syncCanvasSize();

  // Attach global handler for inline Wiki preview calls in popups
  window.loadWikiPreview = loadWikiPreview;
}

function syncCanvasSize() {
  if (!map || !canvasOverlayElement) return;
  const size = map.getSize();
  canvasOverlayElement.width = size.x;
  canvasOverlayElement.height = size.y;
  renderFossils();
}

function buildSpatialGrid(data) {
  spatialGrid.clear();
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const gridX = Math.floor(item.lat / GRID_SIZE);
    const gridY = Math.floor(item.lng / GRID_SIZE);
    const key = `${gridX}_${gridY}`;
    if (!spatialGrid.has(key)) {
      spatialGrid.set(key, []);
    }
    spatialGrid.get(key).push(item);
  }
}

function getCandidatesInViewport(mapBounds) {
  if (spatialGrid.size === 0) return fossilsData;

  const minX = Math.floor(mapBounds.getSouth() / GRID_SIZE);
  const maxX = Math.floor(mapBounds.getNorth() / GRID_SIZE);
  const minY = Math.floor(mapBounds.getWest() / GRID_SIZE);
  const maxY = Math.floor(mapBounds.getEast() / GRID_SIZE);

  const candidateItems = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const key = `${x}_${y}`;
      const cellItems = spatialGrid.get(key);
      if (cellItems) {
        for (let i = 0; i < cellItems.length; i++) {
          candidateItems.push(cellItems[i]);
        }
      }
    }
  }
  return candidateItems;
}

export function setFossilsData(data, autoFit = true) {
  fossilsData = data || [];
  buildSpatialGrid(fossilsData);
  renderFossils();

  if (autoFit && data && data.length > 0 && map) {
    const latLngs = data.map(item => [item.lat, item.lng]);
    const bounds = L.latLngBounds(latLngs);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }
}

export function toggleCategory(catId, isChecked) {
  if (isChecked) activeCategories.add(catId);
  else activeCategories.delete(catId);
  renderFossils();
}

export function toggleSourceFilter(source, isChecked) {
  if (isChecked) activeSources.add(source);
  else activeSources.delete(source);
  renderFossils();
}

export function filterByPeriod(val) {
  selectedPeriodFilter = val;
  renderFossils();
}

export function renderFossils() {
  if (!canvasOverlayElement || !map) return;

  const ctx = canvasOverlayElement.getContext('2d');
  const size = map.getSize();

  // Keep canvas position aligned with Leaflet map container
  const topLeft = map.containerPointToLayerPoint([0, 0]);
  L.DomUtil.setPosition(canvasOverlayElement, topLeft);

  ctx.clearRect(0, 0, size.x, size.y);

  const mapBounds = map.getBounds().pad(0.08);
  const currentZoom = map.getZoom();

  // Crisp point radius scaling
  const r = currentZoom >= 13 ? 6.0 : (currentZoom >= 10 ? 4.0 : (currentZoom >= 8 ? 2.5 : 1.8));

  // Query 2D spatial grid index for sub-millisecond candidate retrieval
  const candidates = getCandidatesInViewport(mapBounds);

  let totalMatchingCount = 0;
  currentVisibleItems = [];

  // Low Zoom Level (Zoom < 7): Screen density aggregation for clean country overview
  if (currentZoom < 7) {
    const bucketSize = 30; // 30px screen buckets
    const densityMap = new Map();

    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i];
      if (!activeCategories.has(item.category_id)) continue;
      if (!activeSources.has(item.source || 'PBDB')) continue;

      const itemScore = item.score_potentiel || 60;
      if (itemScore < minScoreThreshold) continue;

      if (selectedPeriodFilter) {
        const p = (item.period || "").toLowerCase();
        if (selectedPeriodFilter === 'permian' && !p.includes('permian') && !p.includes('permien')) continue;
        if (selectedPeriodFilter === 'jurassic' && !p.includes('jurassic') && !p.includes('jurassique')) continue;
        if (selectedPeriodFilter === 'cretaceous' && !p.includes('cretaceous') && !p.includes('crétacé')) continue;
        if (selectedPeriodFilter === 'ordovician_devonian' && !p.includes('ordovician') && !p.includes('devonian') && !p.includes('carboniferous') && !p.includes('silurian')) continue;
        if (selectedPeriodFilter === 'cenozoic' && !p.includes('neogene') && !p.includes('pliocene') && !p.includes('eocene') && !p.includes('miocene') && !p.includes('paleogene') && !p.includes('oligocene')) continue;
      }

      totalMatchingCount++;

      if (!mapBounds.contains([item.lat, item.lng])) continue;

      const pt = map.latLngToContainerPoint([item.lat, item.lng]);
      const bx = Math.floor(pt.x / bucketSize);
      const by = Math.floor(pt.y / bucketSize);
      const key = `${bx}_${by}`;

      if (!densityMap.has(key)) {
        densityMap.set(key, { sumX: 0, sumY: 0, count: 0, sampleItem: item });
      }
      const b = densityMap.get(key);
      b.sumX += pt.x;
      b.sumY += pt.y;
      b.count++;
    }

    // Render density spots
    densityMap.forEach(b => {
      const avgX = b.sumX / b.count;
      const avgY = b.sumY / b.count;
      const radius = Math.min(14, 3 + Math.log2(b.count) * 2.2);

      ctx.beginPath();
      ctx.arc(avgX, avgY, radius, 0, Math.PI * 2);
      ctx.fillStyle = b.count > 50 ? 'rgba(239, 68, 68, 0.85)' : (b.count > 15 ? 'rgba(249, 115, 22, 0.8)' : 'rgba(56, 189, 248, 0.75)');
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      currentVisibleItems.push({ item: b.sampleItem, x: avgX, y: avgY });
    });

  } else {
    // Zoom >= 7: Exact GPS Individual Canvas Markers
    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i];

      if (!activeCategories.has(item.category_id)) continue;

      const src = item.source || 'PBDB';
      if (!activeSources.has(src)) continue;

      const itemScore = item.score_potentiel || 60;
      if (itemScore < minScoreThreshold) continue;

      if (selectedPeriodFilter) {
        const p = (item.period || "").toLowerCase();
        if (selectedPeriodFilter === 'permian' && !p.includes('permian') && !p.includes('permien')) continue;
        if (selectedPeriodFilter === 'jurassic' && !p.includes('jurassic') && !p.includes('jurassique')) continue;
        if (selectedPeriodFilter === 'cretaceous' && !p.includes('cretaceous') && !p.includes('crétacé')) continue;
        if (selectedPeriodFilter === 'ordovician_devonian' && !p.includes('ordovician') && !p.includes('devonian') && !p.includes('carboniferous') && !p.includes('silurian')) continue;
        if (selectedPeriodFilter === 'cenozoic' && !p.includes('neogene') && !p.includes('pliocene') && !p.includes('eocene') && !p.includes('miocene') && !p.includes('paleogene') && !p.includes('oligocene')) continue;
      }

      totalMatchingCount++;

      if (!mapBounds.contains([item.lat, item.lng])) continue;

      const pt = map.latLngToContainerPoint([item.lat, item.lng]);

      let markerColor = categoryColors[item.category_id] || '#64748b';
      if (currentMapColorMode === 'score') {
        if (itemScore >= 80) markerColor = '#dc2626';
        else if (itemScore >= 68) markerColor = '#ea580c';
        else if (itemScore >= 55) markerColor = '#f59e0b';
        else markerColor = '#0284c7';
      }

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fillStyle = markerColor;
      ctx.fill();

      if (currentZoom >= 11) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      currentVisibleItems.push({ item, x: pt.x, y: pt.y });
    }
  }

  const statEl = document.getElementById('stat-fossils');
  if (statEl) statEl.innerText = totalMatchingCount.toLocaleString('fr-FR');
}

// Instant Spatial Click Handler (On-demand popup generation)
function handleMapPointClick(e) {
  if (!currentVisibleItems || currentVisibleItems.length === 0) return;

  const clickPt = e.containerPoint;
  let closest = null;
  let minDist = 18; // 18px click radius tolerance

  for (let i = 0; i < currentVisibleItems.length; i++) {
    const entry = currentVisibleItems[i];
    const dx = entry.x - clickPt.x;
    const dy = entry.y - clickPt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      closest = entry.item;
    }
  }

  if (closest) {
    openFossilPopup(closest, e.latlng);
  }
}

function openFossilPopup(item, latlng) {
  const itemScore = item.score_potentiel || 60;
  const src = item.source || 'PBDB';
  const iconConfigColor = categoryColors[item.category_id] || '#64748b';
  const iconLabel = categoryLabels[item.category_id] || 'Autre Fossile';
  const faIcon = categoryIcons[item.category_id] || 'fa-circle-dot';

  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.name + ' fossil')}`;
  const googleWebUrl = `https://www.google.com/search?q=${encodeURIComponent(item.name + ' fossile')}`;
  const cleanName = item.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();

  const precisionBadge = item.precision_gps || '🎯 Point GPS Certifié';
  const precisionColor = (item.precision_code === 'high' || precisionBadge.includes('Certifié')) ? '#10b981' : '#f59e0b';

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
      <b>Type :</b> <span style="color:${iconConfigColor}; font-weight:600;"><i class="fa-solid ${faIcon}"></i> ${item.category_name || iconLabel}</span><br>
      <b>Précision Spatiale :</b> <span style="color:${precisionColor}; font-weight:600;">${precisionBadge}</span>${catalogTag}<br>
      <b>Période :</b> ${item.period || 'Non spécifiée'}<br>
      <b>Formation :</b> ${item.formation || 'Lithologie locale'}<br>
      <b>Coordonnées GPS :</b> ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}
    </div>

    <div id="wiki-box-${item.id}" style="margin-top:8px; font-size:0.78rem; color:#cbd5e1; background:rgba(0,0,0,0.3); padding:6px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); display:none;"></div>

    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
      <a href="${googleImagesUrl}" target="_blank" class="popup-tag" style="background:#0284c7; color:#fff; border-color:#0284c7;">
        🖼️ Photos Google
      </a>
      <a href="${googleWebUrl}" target="_blank" class="popup-tag" style="background:#475569; color:#fff; border-color:#475569;">
        🔍 Recherche Web
      </a>
      <button onclick="loadWikiPreview('${cleanName}', ${item.id})" class="popup-tag" style="background:#15803d; color:#fff; border-color:#15803d; cursor:pointer;">
        📖 Aperçu Wikipédia
      </button>
    </div>
  `;

  L.popup()
    .setLatLng(latlng || [item.lat, item.lng])
    .setContent(popupContent)
    .openOn(map);
}

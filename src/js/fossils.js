// Fossil Dataset Management & Marker Rendering
import { map } from './map.js';
import { loadWikiPreview } from './search.js';

export let fossilsData = [];
export let fossilsLayerGroup;
export let activeCategories = new Set(['dinosaurs_reptiles', 'molluscs', 'mammals', 'plants', 'arthropods', 'fish', 'others']);
export let activeSources = new Set(['MNHN', 'PBDB', 'BRGM']);
export let selectedPeriodFilter = "";

export function initFossils() {
  if (typeof L.markerClusterGroup === 'function') {
    fossilsLayerGroup = L.markerClusterGroup({
      disableClusteringAtZoom: 14,
      maxClusterRadius: 40,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true
    }).addTo(map);
  } else {
    fossilsLayerGroup = L.layerGroup().addTo(map);
  }
  
  // Attach global handler for inline Wiki preview calls in popups
  window.loadWikiPreview = loadWikiPreview;
}

export function setFossilsData(data) {
  fossilsData = data;
  renderFossils();
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
  if (!fossilsLayerGroup) return;
  fossilsLayerGroup.clearLayers();
  let count = 0;

  const categoryIcons = {
    'dinosaurs_reptiles': { icon: 'fa-dragon', color: '#ef4444', label: 'Dinosaures / Reptiles' },
    'molluscs':           { icon: 'fa-note-sticky', color: '#0284c7', label: 'Mollusques / Ammonites' },
    'plants':             { icon: 'fa-leaf', color: '#16a34a', label: 'Plantes / Walchia' },
    'arthropods':         { icon: 'fa-bug', color: '#9333ea', label: 'Trilobites / Arthropodes' },
    'mammals':            { icon: 'fa-bone', color: '#d97706', label: 'Mammifères' },
    'fish':               { icon: 'fa-fish', color: '#0d9488', label: 'Poissons' },
    'others':             { icon: 'fa-circle-dot', color: '#64748b', label: 'Autres' }
  };

  fossilsData.forEach(item => {
    if (!activeCategories.has(item.category_id)) return;

    const src = item.source || 'PBDB';
    if (!activeSources.has(src)) return;

    if (selectedPeriodFilter) {
      const p = (item.period || "").toLowerCase();
      if (selectedPeriodFilter === 'permian' && !p.includes('permian')) return;
      if (selectedPeriodFilter === 'jurassic' && !p.includes('jurassic')) return;
      if (selectedPeriodFilter === 'cretaceous' && !p.includes('cretaceous')) return;
      if (selectedPeriodFilter === 'ordovician_devonian' && !p.includes('ordovician') && !p.includes('devonian')) return;
      if (selectedPeriodFilter === 'cenozoic' && !p.includes('neogene') && !p.includes('pliocene') && !p.includes('eocene') && !p.includes('miocene') && !p.includes('paleogene')) return;
    }

    count++;

    const iconConfig = categoryIcons[item.category_id] || categoryIcons['others'];
    let faIcon = iconConfig.icon;
    if (item.category_id === 'molluscs') faIcon = 'fa-ring';

    const marker = L.marker([item.lat, item.lng], {
      pane: 'fossilsPane',
      icon: L.divIcon({
        className: 'custom-fossil-icon',
        html: `<div style="background:${iconConfig.color}; color:#ffffff; width:22px; height:22px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-size:10px;"><i class="fa-solid ${faIcon}"></i></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    });

    const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.name + ' fossil')}`;
    const googleWebUrl = `https://www.google.com/search?q=${encodeURIComponent(item.name + ' fossile')}`;
    const cleanName = item.name.replace(/[^a-zA-Z0-9 ]/g, "").trim();

    const precisionBadge = item.precision_gps || '🎯 GPS Précis';
    const precisionColor = (item.precision_code === 'high') ? '#10b981' : '#f59e0b';

    const sourceBadges = {
      'MNHN': '<span style="background:rgba(168,85,247,0.2); color:#c084fc; border:1px solid rgba(168,85,247,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">🏛️ Collection Muséum (MNHN Paris)</span>',
      'BRGM': '<span style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">📐 Carte Géologique BRGM</span>',
      'PBDB': '<span style="background:rgba(34,197,94,0.2); color:#4ade80; border:1px solid rgba(34,197,94,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">🌐 Base Scientifique PBDB</span>'
    };
    const srcBadge = sourceBadges[src] || sourceBadges['PBDB'];
    const catalogTag = item.mnhn_catalog ? `<br><b>N° Spécimen Muséum :</b> <span style="color:#c084fc; font-weight:600;">${item.mnhn_catalog}</span>` : '';

    const popupContent = `
      <div class="popup-title">${item.name}</div>
      <div style="margin-bottom:6px;">${srcBadge}</div>
      <div class="popup-meta">
        <b>Type :</b> <span style="color:${iconConfig.color}; font-weight:600;"><i class="fa-solid ${faIcon}"></i> ${item.category_name}</span><br>
        <b>Précision Spatiale :</b> <span style="color:${precisionColor}; font-weight:600;">${precisionBadge}</span>${catalogTag}<br>
        <b>Période :</b> ${item.period} (${item.max_ma ? item.max_ma + ' Ma' : 'N/A'})<br>
        <b>Formation :</b> ${item.formation || 'Non spécifiée'}<br>
        <b>Phylum / Classe :</b> ${item.phylum} / ${item.class_name}<br>
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
        <a href="https://paleobiodb.org/classic/basicCollectionSearch?collection_no=${item.id}" target="_blank" class="popup-tag" style="background:#1e293b; color:#94a3b8; border-color:#334155;">
          📄 PBDB #${item.id}
        </a>
      </div>
    `;
    marker.bindPopup(popupContent);
    fossilsLayerGroup.addLayer(marker);
  });

  const statEl = document.getElementById('stat-fossils');
  if (statEl) statEl.innerText = count.toLocaleString('fr-FR');
}

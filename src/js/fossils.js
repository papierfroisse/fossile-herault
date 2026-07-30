// High-Performance Fossil Dataset Management & Marker Clustering
import { map } from './map.js';
import { loadWikiPreview } from './search.js';
import { minScoreThreshold, currentMapColorMode } from './geology.js';

export let fossilsData = [];
export let fossilsLayerGroup;
export let activeCategories = new Set(['dinosaurs_reptiles', 'molluscs', 'mammals', 'plants', 'arthropods', 'fish', 'others']);
export let activeSources = new Set(['MNHN', 'PBDB', 'BRGM']);
export let selectedPeriodFilter = "";

export function initFossils() {
  // Use Leaflet MarkerClusterGroup with chunked background loading for 60FPS zero-lag performance
  if (window.L && typeof L.markerClusterGroup === 'function') {
    fossilsLayerGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 15,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 13,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let bg = 'rgba(2, 132, 199, 0.9)'; // Blue for small
        let border = '#38bdf8';
        if (count >= 1000) {
          bg = 'rgba(220, 38, 38, 0.92)'; // Red for 1k+
          border = '#fca5a5';
        } else if (count >= 100) {
          bg = 'rgba(217, 119, 6, 0.92)'; // Orange for 100+
          border = '#fcd34d';
        }

        const displayCount = count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count;

        return L.divIcon({
          html: `<div style="background:${bg}; color:#ffffff; font-weight:800; font-family:'Outfit',sans-serif; border:2px solid ${border}; box-shadow:0 3px 12px rgba(0,0,0,0.5); border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; font-size:12px; text-shadow:0 1px 2px rgba(0,0,0,0.6);"><span>${displayCount}</span></div>`,
          className: 'custom-cluster-badge',
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });
      }
    }).addTo(map);
  } else {
    fossilsLayerGroup = L.layerGroup().addTo(map);
  }

  // Attach global handler for inline Wiki preview calls in popups
  window.loadWikiPreview = loadWikiPreview;
}

export function setFossilsData(data, autoFit = true) {
  fossilsData = data || [];
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
  if (!fossilsLayerGroup || !map) return;
  
  fossilsLayerGroup.clearLayers();

  const categoryIcons = {
    'dinosaurs_reptiles': { icon: 'fa-dragon', color: '#ef4444', label: 'Dinosaures / Reptiles' },
    'molluscs':           { icon: 'fa-ring', color: '#0284c7', label: 'Mollusques / Ammonites' },
    'plants':             { icon: 'fa-leaf', color: '#16a34a', label: 'Plantes / Végétaux' },
    'arthropods':         { icon: 'fa-bug', color: '#9333ea', label: 'Trilobites / Arthropodes' },
    'mammals':            { icon: 'fa-bone', color: '#d97706', label: 'Mammifères' },
    'fish':               { icon: 'fa-fish', color: '#0d9488', label: 'Poissons' },
    'others':             { icon: 'fa-circle-dot', color: '#64748b', label: 'Autres' }
  };

  const markersToAdd = [];
  let totalMatchingCount = 0;

  for (let i = 0; i < fossilsData.length; i++) {
    const item = fossilsData[i];

    if (!activeCategories.has(item.category_id)) continue;

    const src = item.source || 'PBDB';
    if (!activeSources.has(src)) continue;

    // Filter by predictive score threshold
    const itemScore = item.score_potentiel || 60;
    if (itemScore < minScoreThreshold) continue;

    // Filter by geological period
    if (selectedPeriodFilter) {
      const p = (item.period || "").toLowerCase();
      if (selectedPeriodFilter === 'permian' && !p.includes('permian') && !p.includes('permien')) continue;
      if (selectedPeriodFilter === 'jurassic' && !p.includes('jurassic') && !p.includes('jurassique')) continue;
      if (selectedPeriodFilter === 'cretaceous' && !p.includes('cretaceous') && !p.includes('crétacé')) continue;
      if (selectedPeriodFilter === 'ordovician_devonian' && !p.includes('ordovician') && !p.includes('devonian') && !p.includes('carboniferous') && !p.includes('silurian')) continue;
      if (selectedPeriodFilter === 'cenozoic' && !p.includes('neogene') && !p.includes('pliocene') && !p.includes('eocene') && !p.includes('miocene') && !p.includes('paleogene') && !p.includes('oligocene')) continue;
    }

    totalMatchingCount++;

    const iconConfig = categoryIcons[item.category_id] || categoryIcons['others'];
    let faIcon = iconConfig.icon;

    // Marker color based on ML Score or Category
    let markerColor = iconConfig.color;
    if (currentMapColorMode === 'score') {
      if (itemScore >= 80) markerColor = '#dc2626';
      else if (itemScore >= 68) markerColor = '#ea580c';
      else if (itemScore >= 55) markerColor = '#f59e0b';
      else markerColor = '#0284c7';
    }

    const marker = L.marker([item.lat, item.lng], {
      pane: 'fossilsPane',
      icon: L.divIcon({
        className: 'custom-fossil-icon',
        html: `<div style="background:${markerColor}; color:#ffffff; width:22px; height:22px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-size:10px;"><i class="fa-solid ${faIcon}"></i></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      })
    });

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
        <b>Type :</b> <span style="color:${iconConfig.color}; font-weight:600;"><i class="fa-solid ${faIcon}"></i> ${item.category_name || iconConfig.label}</span><br>
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
    marker.bindPopup(popupContent);
    markersToAdd.push(marker);
  }

  // Add all markers to Cluster Group at once (uses chunkedLoading internally)
  if (fossilsLayerGroup.addLayers) {
    fossilsLayerGroup.addLayers(markersToAdd);
  } else {
    markersToAdd.forEach(m => fossilsLayerGroup.addLayer(m));
  }

  const statEl = document.getElementById('stat-fossils');
  if (statEl) statEl.innerText = totalMatchingCount.toLocaleString('fr-FR');
}

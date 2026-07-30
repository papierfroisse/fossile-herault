// Secondary Map Layers: Rivers, Quarries, Protected Reserves, City Landmarks
import { map } from './map.js';

export let riversLayer = null;
export let quarriesLayer = null;
export let reservesLayer = null;
export let citiesLayerGroup = null;
export let landmarksLayerGroup = null;

let isReservesEnabled = false;
let isQuarriesEnabled = false;
let isRiversEnabled = false;

export function initEnvironmentalLayers() {
  citiesLayerGroup = L.layerGroup();
  landmarksLayerGroup = L.layerGroup();
  reservesLayer = L.layerGroup();
  quarriesLayer = L.layerGroup();

  // Major Cities Landmarks
  const majorCities = [
    { name: "MONTPELLIER", lat: 43.6108, lng: 3.8767, main: true },
    { name: "BÉZIERS", lat: 43.3442, lng: 3.2158, main: true },
    { name: "SÈTE", lat: 43.4053, lng: 3.6975, main: true },
    { name: "AGDE", lat: 43.3108, lng: 3.4758, main: false },
    { name: "LODÈVE", lat: 43.7311, lng: 3.3200, main: true },
    { name: "CLERMONT-L'HÉRAULT", lat: 43.6275, lng: 3.4303, main: false },
    { name: "BÉDARIEUX", lat: 43.6167, lng: 3.1583, main: false },
    { name: "GANGES", lat: 43.9358, lng: 3.7083, main: false },
    { name: "PÉZENAS", lat: 43.4608, lng: 3.4225, main: false }
  ];

  majorCities.forEach(city => {
    L.marker([city.lat, city.lng], {
      interactive: false,
      icon: L.divIcon({
        className: 'city-label-icon',
        html: `<div style="background:rgba(15,23,42,0.85); color:#f8fafc; border:1px solid rgba(56,189,248,0.6); padding:2px 7px; border-radius:4px; font-size:${city.main ? '11px' : '10px'}; font-weight:700; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.6); letter-spacing:0.5px;"><i class="fa-solid fa-city" style="font-size:9px; color:#38bdf8; margin-right:3px;"></i>${city.name}</div>`,
        iconAnchor: [30, 10]
      })
    }).addTo(citiesLayerGroup);
  });

  // Load Protected Reserves
  fetch('processed/reserves_herault.geojson').then(res => res.json()).then(data => {
    const geoLayer = L.geoJSON(data, {
      pointToLayer: function(f, latlng) {
        const p = f.properties;
        const isInterdit = p.interdiction;
        const bg = isInterdit ? '#dc2626' : '#f59e0b';
        const icon = isInterdit ? 'fa-ban' : 'fa-shield-halved';

        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background:${bg}; color:#fff; padding:6px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 10px rgba(0,0,0,0.6); text-align:center;"><i class="fa-solid ${icon}" style="font-size:13px;"></i></div>`,
            iconSize: [26, 26], iconAnchor: [13, 13]
          })
        }).bindPopup(`
          <div class="popup-title" style="color:${bg};">${p.name}</div>
          <div class="popup-meta">
            <b>Statut Légal :</b> ${p.type}<br><br>
            <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; padding:8px; border-radius:8px; font-size:0.8rem;">
              ${p.reglementation}
            </div>
          </div>
        `);
      }
    });
    reservesLayer.addLayer(geoLayer);
    updateLayerVisibility();
  });

  // Load Rivers Layer
  fetch('processed/rivieres_herault.geojson').then(res => res.json()).then(data => {
    riversLayer = L.geoJSON(data, {
      style: { color: '#0284c7', weight: 1.2, opacity: 0.35 },
      onEachFeature: function(f, l) { l.bindTooltip(f.properties.name || "Cours d'eau", { sticky: true }); }
    });
    updateLayerVisibility();
  });

  // Load Quarries
  fetch('processed/carrieres_herault.geojson').then(res => res.json()).then(data => {
    const geoLayer = L.geoJSON(data, {
      pointToLayer: function(f, latlng) {
        const p = f.properties;
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background:#f59e0b; color:#fff; padding:6px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4); text-align:center;"><i class="fa-solid fa-industry" style="font-size:12px;"></i></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).bindPopup(`
          <div class="popup-title">${p.name}</div>
          <div class="popup-meta">
            <b>Type :</b> ${p.type}<br>
            <b>Commune :</b> ${p.commune}<br>
            <b>Intérêt paléontologique :</b> ${p.interet}
          </div>
          <span class="popup-tag" style="color:#f59e0b; border-color:#f59e0b;">Coupe ouverte / Carrière</span>
        `);
      }
    });
    quarriesLayer.addLayer(geoLayer);
    updateLayerVisibility();
  });

  // Mont Sénégra Landmark Marker
  L.marker([43.6820, 3.1250], {
    icon: L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background:#10b981; color:#fff; padding:7px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.5); text-align:center;"><i class="fa-solid fa-leaf" style="font-size:13px;"></i></div>`,
      iconSize: [26, 26], iconAnchor: [13, 13]
    })
  }).bindPopup(`
    <div class="popup-title">🌿 Mont Sénégra (G. Gand et al., MNHN 2013)</div>
    <div class="popup-meta">
      <b>Période :</b> Autunien basal (Permien inférieur, ~295 Ma)<br>
      <b>Plantes identifiées :</b> <i>Walchia piniformis</i>, <i>Hermitia</i>, <i>Culmitzschia</i>, <i>Rhachiphyllum</i>.<br>
      <b>Repère de terrain :</b> 20m au-dessus du conglomérat basal.
    </div>
    <a href="https://sciencepress.mnhn.fr/sites/default/files/articles/pdf/comptes-rendus-palevol2013v12f2a02.pdf" target="_blank" class="popup-tag" style="color:#10b981; border-color:#10b981;">📄 Lire la publication MNHN (2013)</a>
  `).addTo(landmarksLayerGroup);

  // Dynamic zoom listener
  map.on('zoomend', updateLayerVisibility);
  updateLayerVisibility();
}

function updateLayerVisibility() {
  if (!map) return;
  const zoom = map.getZoom();

  // Landmarks & Cities only at high zoom (Zoom >= 12)
  if (zoom >= 12) {
    if (citiesLayerGroup && !map.hasLayer(citiesLayerGroup)) map.addLayer(citiesLayerGroup);
    if (landmarksLayerGroup && !map.hasLayer(landmarksLayerGroup)) map.addLayer(landmarksLayerGroup);
  } else {
    if (citiesLayerGroup && map.hasLayer(citiesLayerGroup)) map.removeLayer(citiesLayerGroup);
    if (landmarksLayerGroup && map.hasLayer(landmarksLayerGroup)) map.removeLayer(landmarksLayerGroup);
  }

  // Reserves & Quarries ONLY when enabled AND zoom >= 11
  if (isReservesEnabled && zoom >= 11) {
    if (reservesLayer && !map.hasLayer(reservesLayer)) map.addLayer(reservesLayer);
  } else {
    if (reservesLayer && map.hasLayer(reservesLayer)) map.removeLayer(reservesLayer);
  }

  if (isQuarriesEnabled && zoom >= 11) {
    if (quarriesLayer && !map.hasLayer(quarriesLayer)) map.addLayer(quarriesLayer);
  } else {
    if (quarriesLayer && map.hasLayer(quarriesLayer)) map.removeLayer(quarriesLayer);
  }

  // Rivers Layer at Zoom >= 12
  if (riversLayer) {
    if (isRiversEnabled && zoom >= 12) {
      if (!map.hasLayer(riversLayer)) map.addLayer(riversLayer);
    } else {
      if (map.hasLayer(riversLayer)) map.removeLayer(riversLayer);
    }
  }
}

export function toggleReservesLayer(checked) {
  isReservesEnabled = checked;
  updateLayerVisibility();
}

export function toggleRiversLayer(checked) {
  isRiversEnabled = checked;
  updateLayerVisibility();
}

export function toggleQuarriesLayer(checked) {
  isQuarriesEnabled = checked;
  updateLayerVisibility();
}

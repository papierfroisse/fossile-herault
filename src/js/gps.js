// Geolocation & Point Selection Handlers
import { map } from './map.js';

export let userLocationMarker = null;
export let isPointSelectionActive = false;

export function initGPSHandlers() {
  if (!map) return;

  // Map Click Listener
  map.on('click', function(e) {
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('mobile-open');
    }

    if (isPointSelectionActive) {
      isPointSelectionActive = false;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      openCustomPointPopup(lat, lng, e.latlng);
    }
  });

  // Long press on map (contextmenu event) to drop intentional pin
  map.on('contextmenu', function(e) {
    openCustomPointPopup(e.latlng.lat, e.latlng.lng, e.latlng);
  });
}

export function locateUserOnMap() {
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      if (userLocationMarker && map) map.removeLayer(userLocationMarker);

      userLocationMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-user-location',
          html: `<div style="background:#2563eb; color:#fff; width:26px; height:26px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 15px #2563eb; display:flex; align-items:center; justify-content:center; font-size:12px;"><i class="fa-solid fa-crosshairs"></i></div>`,
          iconSize: [26, 26], iconAnchor: [13, 13]
        })
      }).bindPopup(`
        <b>🎯 Votre Position GPS en Direct</b><br>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}<br>
        <div style="margin-top:8px; display:flex; flex-direction:column; gap:4px;">
          <a href="#" onclick="generateCustomLocationReport(${lat}, ${lng}); return false;" class="popup-tag" style="background:#0284c7; color:#fff; text-align:center;">📄 Rapport PDF Ma Position</a>
          <button onclick="togglePointSelectionMode()" style="background:#a855f7; color:#fff; border:none; padding:4px; border-radius:4px; font-size:0.75rem; cursor:pointer;">📌 Activer Sélection Autre Point</button>
        </div>
      `).addTo(map);

      map.flyTo([lat, lng], 14, { duration: 1.5 });
      userLocationMarker.openPopup();
    },
    err => {
      alert("Impossible d'obtenir votre position GPS. Astuce: Vous pouvez faire un appui long sur la carte pour placer un point.");
    },
    { enableHighAccuracy: true }
  );
}

export function togglePointSelectionMode() {
  isPointSelectionActive = !isPointSelectionActive;
  if (isPointSelectionActive) {
    alert("📍 Mode Sélection Activé : Touchez un endroit précis sur la carte pour générer son rapport PDF.");
  }
}

export function openCustomPointPopup(lat, lng, latlng) {
  L.popup().setLatLng(latlng).setContent(`
    <div class="popup-title">📍 Point GPS Sélectionné</div>
    <div class="popup-meta">
      <b>Coordonnées :</b> ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E<br>
      Générez une fiche de terrain PDF complète pour ce point précis.
    </div>
    <a href="#" onclick="generateCustomLocationReport(${lat}, ${lng}); return false;" class="popup-tag" style="background:#0284c7; color:#fff; border-color:#0284c7; font-size:0.8rem; display:block; text-align:center; margin-top:8px;">
      📄 Générer le Rapport PDF de ce Point
    </a>
  `).openOn(map);
}

// Personal Findings LocalStorage Logbook
import { map } from './map.js';

export let personalFindingsLayerGroup = null;

export function initPersonalFindings() {
  personalFindingsLayerGroup = L.layerGroup().addTo(map);
  loadPersonalFindings();
}

export function openAddPersonalFindingModal(lat = null, lng = null) {
  const modal = document.getElementById('personalFindingModal');
  if (modal) modal.style.display = 'flex';
  const center = map.getCenter();
  const latEl = document.getElementById('pf-lat');
  const lngEl = document.getElementById('pf-lng');
  if (latEl) latEl.value = lat ? lat.toFixed(5) : center.lat.toFixed(5);
  if (lngEl) lngEl.value = lng ? lng.toFixed(5) : center.lng.toFixed(5);
}

export function closeAddPersonalFindingModal() {
  const modal = document.getElementById('personalFindingModal');
  if (modal) modal.style.display = 'none';
}

export function savePersonalFinding(e) {
  e.preventDefault();
  const name = document.getElementById('pf-name').value;
  const category = document.getElementById('pf-category').value;
  const lat = parseFloat(document.getElementById('pf-lat').value);
  const lng = parseFloat(document.getElementById('pf-lng').value);
  const notes = document.getElementById('pf-notes').value;

  const newFinding = { id: Date.now(), name, category, lat, lng, notes, date: new Date().toLocaleDateString('fr-FR') };

  let saved = JSON.parse(localStorage.getItem('my_fossil_findings') || '[]');
  saved.push(newFinding);
  localStorage.setItem('my_fossil_findings', JSON.stringify(saved));

  closeAddPersonalFindingModal();
  document.getElementById('pf-name').value = '';
  document.getElementById('pf-notes').value = '';

  loadPersonalFindings();
  map.flyTo([lat, lng], 14);
}

export function loadPersonalFindings() {
  if (!personalFindingsLayerGroup) return;
  personalFindingsLayerGroup.clearLayers();
  let saved = JSON.parse(localStorage.getItem('my_fossil_findings') || '[]');

  saved.forEach(item => {
    const marker = L.marker([item.lat, item.lng], {
      pane: 'fossilsPane',
      icon: L.divIcon({
        className: 'custom-personal-finding',
        html: `<div style="background:#a855f7; color:#fff; width:26px; height:26px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 12px #a855f7; display:flex; align-items:center; justify-content:center; font-size:12px;"><i class="fa-solid fa-star"></i></div>`,
        iconSize: [26, 26], iconAnchor: [13, 13]
      })
    }).bindPopup(`
      <div class="popup-title" style="color:#a855f7;">🌟 Ma Découverte : ${item.name}</div>
      <div class="popup-meta">
        <b>Date :</b> ${item.date}<br>
        <b>GPS :</b> ${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}<br>
        <b>Notes :</b> ${item.notes || 'Aucune note'}
      </div>
      <button onclick="deletePersonalFinding(${item.id})" style="background:#dc2626; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-size:0.75rem; margin-top:8px; cursor:pointer;">🗑️ Supprimer de mon carnet</button>
    `);
    personalFindingsLayerGroup.addLayer(marker);
  });
}

export function deletePersonalFinding(id) {
  let saved = JSON.parse(localStorage.getItem('my_fossil_findings') || '[]');
  saved = saved.filter(x => x.id !== id);
  localStorage.setItem('my_fossil_findings', JSON.stringify(saved));
  loadPersonalFindings();
  if (map) map.closePopup();
}

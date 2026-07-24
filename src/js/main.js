// Main Entry Point for Fossile France Application
import '../styles/main.css';
import '../styles/sidebar.css';
import '../styles/map.css';
import '../styles/mobile.css';

import { initMap, flyToLoc } from './map.js';
import { initFossils, setFossilsData, toggleCategory, toggleSourceFilter, filterByPeriod } from './fossils.js';
import { setGeologyData, switchMapColorMode, updateScoreFilter, toggleSlopeFilter } from './geology.js';
import { initEnvironmentalLayers, toggleReservesLayer, toggleRiversLayer, toggleQuarriesLayer } from './layers.js';
import { handleSearch, loadWikiPreview } from './search.js';
import { initGPSHandlers, locateUserOnMap, togglePointSelectionMode } from './gps.js';
import { downloadGPXExport, downloadKMLExport, generateCurrentLocationReport, generateCustomLocationReport } from './export.js';
import { initPersonalFindings, openAddPersonalFindingModal, closeAddPersonalFindingModal, savePersonalFinding, deletePersonalFinding } from './personal.js';
import { toggleSidebar, toggleMobileSidebar, toggleMobileMapMode, openGearModal, closeGearModal, openGuideModal, closeGuideModal } from './ui.js';

// Expose functions required by inline HTML onclick/onchange attributes to window scope
window.locateUserOnMap = locateUserOnMap;
window.openAddPersonalFindingModal = openAddPersonalFindingModal;
window.closeAddPersonalFindingModal = closeAddPersonalFindingModal;
window.savePersonalFinding = savePersonalFinding;
window.deletePersonalFinding = deletePersonalFinding;
window.downloadGPXExport = downloadGPXExport;
window.downloadKMLExport = downloadKMLExport;
window.generateCurrentLocationReport = generateCurrentLocationReport;
window.generateCustomLocationReport = generateCustomLocationReport;
window.toggleSidebar = toggleSidebar;
window.toggleMobileSidebar = toggleMobileSidebar;
window.toggleMobileMapMode = toggleMobileMapMode;
window.switchMapColorMode = switchMapColorMode;
window.filterByPeriod = filterByPeriod;
window.toggleSourceFilter = toggleSourceFilter;
window.toggleReservesLayer = toggleReservesLayer;
window.toggleRiversLayer = toggleRiversLayer;
window.toggleQuarriesLayer = toggleQuarriesLayer;
window.toggleSlopeFilter = toggleSlopeFilter;
window.updateScoreFilter = updateScoreFilter;
window.toggleCategory = toggleCategory;
window.openGearModal = openGearModal;
window.closeGearModal = closeGearModal;
window.openGuideModal = openGuideModal;
window.closeGuideModal = closeGuideModal;
window.handleSearch = handleSearch;
window.loadWikiPreview = loadWikiPreview;
window.changeDepartment = function(deptCode) {
  const deptCenters = {
    '34': { center: [43.55, 3.45], file: 'processed/34/fossils.json' },
    '30': { center: [44.0, 4.2], file: 'processed/30/fossils.json' },
    '11': { center: [43.1, 2.4], file: 'processed/11/fossils.json' }
  };

  const target = deptCenters[deptCode];
  if (!target) return;

  flyToLoc(target.center[0], target.center[1], 10);
  fetch(target.file)
    .then(res => res.json())
    .then(data => setFossilsData(data))
    .catch(err => console.error("Error loading department fossils:", err));
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initFossils();
  initEnvironmentalLayers();
  initGPSHandlers();
  initPersonalFindings();

  // Load Primary Department Datasets (Hérault - 34)
  fetch('processed/fossils_herault.json')
    .then(res => res.json())
    .then(data => setFossilsData(data));

  fetch('processed/herault_geologie_pentes.geojson')
    .then(res => res.json())
    .then(data => setGeologyData(data));

  // Seasonality API / static widget
  fetch('/api/seasonality')
    .then(res => res.json())
    .then(data => {
      if (data && data.mois) {
        const monthEl = document.getElementById('season-month');
        const scoreEl = document.getElementById('season-score');
        const condEl = document.getElementById('season-condition');
        const adviceEl = document.getElementById('season-advice');
        if (monthEl) monthEl.innerText = data.mois;
        if (scoreEl) {
          scoreEl.innerText = data.score_saison + ' / 100';
          if (data.score_saison >= 80) scoreEl.style.color = '#34d399';
          else if (data.score_saison >= 60) scoreEl.style.color = '#f59e0b';
          else scoreEl.style.color = '#ef4444';
        }
        if (condEl) condEl.innerText = data.condition;
        if (adviceEl) adviceEl.innerText = data.conseil;
      }
    })
    .catch(() => {
      // Graceful fallback for static GitHub Pages serving
    });
});

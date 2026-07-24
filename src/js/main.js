// Main Entry Point for Fossile France Application
import { initMap, flyToLoc } from './map.js';
import { initFossils, setFossilsData, toggleCategory, toggleSourceFilter, filterByPeriod } from './fossils.js';
import { setGeologyData, switchMapColorMode, updateScoreFilter, toggleSlopeFilter } from './geology.js';
import { initEnvironmentalLayers, toggleReservesLayer, toggleRiversLayer, toggleQuarriesLayer } from './layers.js';
import { handleSearch, loadWikiPreview } from './search.js';
import { initGPSHandlers, locateUserOnMap, togglePointSelectionMode } from './gps.js';
import { downloadGPXExport, downloadKMLExport, generateCurrentLocationReport, generateCustomLocationReport } from './export.js';
import { initPersonalFindings, openAddPersonalFindingModal, closeAddPersonalFindingModal, savePersonalFinding, deletePersonalFinding } from './personal.js';
import { toggleSidebar, toggleMobileSidebar, toggleMobileMapMode, openGearModal, closeGearModal, openGuideModal, closeGuideModal } from './ui.js';
import { selectPaleoEra } from './paleogeography.js';

// Expose functions required by inline HTML onclick/onchange attributes to window scope
window.selectPaleoEra = selectPaleoEra;
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
let allDepartmentsMap = {};

window.changeDepartment = function(deptCode) {
  const dept = allDepartmentsMap[deptCode];
  if (!dept) return;

  flyToLoc(dept.center[0], dept.center[1], 10);

  // Try local processed dataset first, fallback to live PBDB API fetch for any department in France
  fetch(`processed/${deptCode}/fossils.json`)
    .then(res => {
      if (!res.ok) throw new Error("Dataset not pre-packaged");
      return res.json();
    })
    .then(data => setFossilsData(data))
    .catch(() => {
      // Live query PBDB for any French department
      const b = dept.bounds;
      const pbdbUrl = `https://paleobiodb.org/data1.2/occs/list.json?lngmin=${b[2]}&lngmax=${b[3]}&latmin=${b[0]}&latmax=${b[1]}&show=coords,classext,strata`;
      fetch(pbdbUrl)
        .then(r => r.json())
        .then(data => {
          if (data && data.records) {
            const formatted = data.records.map(r => ({
              id: r.oid,
              name: r.tno || r.mno || "Fossile PBDB",
              lat: r.lat,
              lng: r.lng,
              phylum: r.phl || "PBDB",
              class_name: r.cll || "Paleontology",
              period: r.dpt || r.eon || "Mésozoïque",
              formation: r.sfm || r.fmt || dept.name,
              category_id: "molluscs",
              category_name: "Fossile Certifié",
              color: "#0284c7",
              precision_gps: "📍 Point GPS Certifié PBDB",
              source: "PBDB"
            }));
            setFossilsData(formatted);
          }
        });
    });
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initFossils();
  initEnvironmentalLayers();
  initGPSHandlers();
  initPersonalFindings();

  // Load Department Index (All 96 Departments of France)
  fetch('processed/departments.json')
    .then(res => res.json())
    .then(depts => {
      const selectEl = document.getElementById('deptSelect');
      if (selectEl) {
        selectEl.innerHTML = depts.map(d => `<option value="${d.code}">${d.code} — ${d.name}</option>`).join('');
        depts.forEach(d => { allDepartmentsMap[d.code] = d; });
        selectEl.value = "34"; // Default Hérault
      }
    });

  // Load Primary Department Dataset (Hérault - 34)
  fetch('processed/34/fossils.json')
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

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
import { ALL_DEPARTMENTS, DEPARTMENTS_MAP } from './departments.js';

function cleanCategoryJS(phylum = '', className = '', orderName = '', family = '', genus = '', sciName = '') {
  const txt = `${phylum} ${className} ${orderName} ${family} ${genus} ${sciName}`.toLowerCase();
  if (txt.match(/dinosaur|reptil|sauropod|theropod|crocodil|turtle|testudines|squamata/)) {
    return { category_id: 'dinosaurs_reptiles', category_name: 'Dinosaures & Reptiles', color: '#ef4444' };
  }
  if (txt.match(/mollusc|cephalopod|ammonit|bivalv|gastropod|belemnit|brachiopod|hildoceras|lytoceras/)) {
    return { category_id: 'molluscs', category_name: 'Mollusques & Ammonites', color: '#0284c7' };
  }
  if (txt.match(/plant|tracheophyta|ginkgo|walchia|flora|fern|conifer/)) {
    return { category_id: 'plants', category_name: 'Plantes & Végétaux', color: '#16a34a' };
  }
  if (txt.match(/trilobit|arthropod|crustac|insect|ostracod/)) {
    return { category_id: 'arthropods', category_name: 'Trilobites & Arthropodes', color: '#9333ea' };
  }
  if (txt.match(/mammal|rodent|carnivor|hominid|artiodactyl|perissodactyl/)) {
    return { category_id: 'mammals', category_name: 'Mammifères', color: '#d97706' };
  }
  if (txt.match(/fish|pisces|actinopterygii|chondrichthyes|shark/)) {
    return { category_id: 'fish', category_name: 'Poissons & Chondrichthyens', color: '#0d9488' };
  }
  return { category_id: 'others', category_name: 'Autres Fossiles', color: '#64748b' };
}

window.changeDepartment = function(deptCode) {
  const dept = DEPARTMENTS_MAP[deptCode];
  if (!dept) return;

  flyToLoc(dept.center[0], dept.center[1], 10);

  // Try local pre-packaged department dataset, fallback to live PBDB query
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
            const formatted = data.records.map(r => {
              const cat = cleanCategoryJS(r.phl, r.cll, r.odl, r.fml, r.gnn, r.tno || r.mno);
              return {
                id: r.oid,
                name: r.tno || r.mno || "Fossile PBDB",
                lat: r.lat,
                lng: r.lng,
                phylum: r.phl || "PBDB Record",
                class_name: r.cll || "Paleontology",
                period: r.dpt || r.eon || "Mésozoïque",
                formation: r.sfm || r.fmt || dept.name,
                category_id: cat.category_id,
                category_name: cat.category_name,
                color: cat.color,
                precision_gps: "📍 Point GPS Certifié PBDB",
                source: "PBDB"
              };
            });
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

  // Populate Department Selector with all 96 French Departments
  const selectEl = document.getElementById('deptSelect');
  if (selectEl) {
    selectEl.innerHTML = ALL_DEPARTMENTS.map(d => `<option value="${d.code}">${d.code} — ${d.name}</option>`).join('');
    selectEl.value = "34"; // Default Hérault
  }

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

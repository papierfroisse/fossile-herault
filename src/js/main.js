// Main Entry Point for Fossile France Application (High-Performance Architecture)
import { initMap, flyToLoc, map } from './map.js';
import { initFossils, setFossilsData, toggleCategory, toggleSourceFilter, filterByPeriod } from './fossils.js';
import { setGeologyData, switchMapColorMode, updateScoreFilter, toggleSlopeFilter } from './geology.js';
import { initEnvironmentalLayers, toggleReservesLayer, toggleRiversLayer, toggleQuarriesLayer } from './layers.js';
import { handleSearch, loadWikiPreview } from './search.js';
import { initGPSHandlers, locateUserOnMap, togglePointSelectionMode } from './gps.js';
import { downloadGPXExport, downloadKMLExport, generateCurrentLocationReport, generateCustomLocationReport } from './export.js';
import { initPersonalFindings, openAddPersonalFindingModal, closeAddPersonalFindingModal, savePersonalFinding, deletePersonalFinding } from './personal.js';
import { toggleSidebar, toggleMobileSidebar, toggleMobileMapMode, openGearModal, closeGearModal, openGuideModal, closeGuideModal } from './ui.js';
import { selectPaleoEra, handlePaleoSliderChange } from './paleogeography.js';
import { ALL_DEPARTMENTS, DEPARTMENTS_MAP } from './departments.js';

// Expose functions required by inline HTML attributes to window scope
window.selectPaleoEra = selectPaleoEra;
window.handlePaleoSliderChange = handlePaleoSliderChange;
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

// Spatial Lazy-Loading Cache & Controller
const loadedDepartmentsCache = new Map(); // deptCode -> Array
let currentActiveMode = 'dept'; // 'dept' or 'all'

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

// Load a specific department dataset on-demand (Fast ~150KB load, 10ms speed)
function loadSingleDepartment(deptCode, autoFit = true) {
  currentActiveMode = 'dept';
  const dept = DEPARTMENTS_MAP[deptCode];
  if (!dept) return;

  if (autoFit) {
    flyToLoc(dept.center[0], dept.center[1], 10);
  }

  if (loadedDepartmentsCache.has(deptCode)) {
    setFossilsData(loadedDepartmentsCache.get(deptCode), autoFit);
    return;
  }

  fetch(`processed/${deptCode}/fossils.json`)
    .then(res => {
      if (!res.ok) throw new Error("Dataset not pre-packaged");
      return res.json();
    })
    .then(data => {
      loadedDepartmentsCache.set(deptCode, data);
      setFossilsData(data, autoFit);
    })
    .catch(() => {
      // Live PBDB Fallback query if dataset is missing
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
            loadedDepartmentsCache.set(deptCode, formatted);
            setFossilsData(formatted, autoFit);
          }
        });
    });
}

// Spatial Viewport Lazy Streaming for "Toute la France" view
function streamVisibleDepartmentsForFrance() {
  if (currentActiveMode !== 'all' || !map) return;

  const b = map.getBounds();
  const southWest = b.getSouthWest();
  const northEast = b.getNorthEast();

  // Find departments intersecting current visible map viewport
  const visibleDepts = ALL_DEPARTMENTS.filter(d => {
    const [minLat, maxLat, minLng, maxLng] = d.bounds;
    return !(maxLat < southWest.lat || minLat > northEast.lat || maxLng < southWest.lng || minLng > northEast.lng);
  });

  const promises = visibleDepts.map(d => {
    if (loadedDepartmentsCache.has(d.code)) {
      return Promise.resolve(loadedDepartmentsCache.get(d.code));
    }
    return fetch(`processed/${d.code}/fossils.json`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        loadedDepartmentsCache.set(d.code, data);
        return data;
      })
      .catch(() => []);
  });

  Promise.all(promises).then(() => {
    if (currentActiveMode !== 'all') return;
    let combined = [];
    loadedDepartmentsCache.forEach(arr => {
      combined.push(...arr);
    });
    setFossilsData(combined, false);
  });
}

window.changeDepartment = function(deptCode) {
  if (deptCode === 'all') {
    currentActiveMode = 'all';
    flyToLoc(46.6, 2.5, 6);
    streamVisibleDepartmentsForFrance();
    return;
  }
  loadSingleDepartment(deptCode, true);
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initFossils();
  initEnvironmentalLayers();
  initGPSHandlers();
  initPersonalFindings();

  // Attach spatial streaming listener on map movement when in "all France" mode
  if (map) {
    map.on('moveend', () => {
      if (currentActiveMode === 'all') {
        streamVisibleDepartmentsForFrance();
      }
    });
  }

  // Populate Department Selector with all 94 French Departments + "Toute la France" (Default Startup)
  const selectEl = document.getElementById('deptSelect');
  if (selectEl) {
    selectEl.innerHTML = '<option value="all">🇫🇷 Toute la France (49 757 fossiles)</option>' +
      ALL_DEPARTMENTS.map(d => `<option value="${d.code}">${d.code} — ${d.name}</option>`).join('');
    selectEl.value = "all";
  }

  // Startup default mode: All France Spatial Lazy Streaming
  currentActiveMode = 'all';
  streamVisibleDepartmentsForFrance();

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
    .catch(() => {});
});

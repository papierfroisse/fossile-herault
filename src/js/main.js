// Main Application Logic & Data Orchestration
import '../styles/main.css';
import '../styles/map.css';
import '../styles/sidebar.css';
import '../styles/mobile.css';

import { ALL_DEPARTMENTS } from './departments.js';
import { map, initMap, flyToLoc } from './map.js';
import { initFossils, setFossilsData } from './fossils.js';
import { setGeologyData } from './geology.js';
import { initEnvironmentalLayers } from './layers.js';
import { initGPSHandlers } from './gps.js';
import { initPersonalFindings } from './personal.js';

let loadedDepartmentsCache = new Map();
let currentActiveMode = 'all';

function cleanCategoryJS(phylum = "", className = "", orderName = "", familyName = "", genusName = "", nameStr = "") {
  const fullText = `${phylum} ${className} ${orderName} ${familyName} ${genusName} ${nameStr}`.toLowerCase();
  
  if (fullText.match(/dinosaur|reptil|sauropod|theropod|crocodil|turtle|testudines|squamata/)) {
    return { category_id: 'dinosaurs_reptiles', category_name: 'Dinosaures & Reptiles', color: '#ef4444' };
  }
  if (fullText.match(/mollusc|cephalopod|ammonit|bivalv|gastropod|belemnit|brachiopod|hildoceras|lytoceras/)) {
    return { category_id: 'molluscs', category_name: 'Mollusques & Ammonites', color: '#0284c7' };
  }
  if (fullText.match(/plant|tracheophyta|ginkgo|walchia|flora|fern|conifer/)) {
    return { category_id: 'plants', category_name: 'Plantes & Végétaux', color: '#16a34a' };
  }
  if (fullText.match(/trilobit|arthropod|crustac|insect|ostracod/)) {
    return { category_id: 'arthropods', category_name: 'Trilobites & Arthropodes', color: '#9333ea' };
  }
  if (fullText.match(/mammal|rodent|carnivor|hominid|artiodactyl|perissodactyl/)) {
    return { category_id: 'mammals', category_name: 'Mammifères', color: '#d97706' };
  }
  if (fullText.match(/fish|pisces|actinopterygii|chondrichthyes|shark/)) {
    return { category_id: 'fish', category_name: 'Poissons & Chondrichthyens', color: '#0d9488' };
  }
  return { category_id: 'others', category_name: 'Autres Fossiles', color: '#64748b' };
}

export function loadSingleDepartment(deptCode, autoFit = true) {
  currentActiveMode = 'dept';
  const dept = ALL_DEPARTMENTS.find(d => d.code === deptCode);
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

// Load All France Data across all 94 French Departments
function loadAllFranceData() {
  currentActiveMode = 'all';
  flyToLoc(46.6, 2.5, 6);

  fetch('processed/all_france.json')
    .then(res => {
      if (!res.ok) throw new Error("all_france.json missing");
      return res.json();
    })
    .then(data => {
      if (currentActiveMode === 'all') {
        setFossilsData(data, false);
      }
    })
    .catch(() => {
      // Fallback: parallel load across departments
      const promises = ALL_DEPARTMENTS.map(d =>
        fetch(`processed/${d.code}/fossils.json`)
          .then(res => res.ok ? res.json() : [])
          .catch(() => [])
      );
      Promise.all(promises).then(results => {
        if (currentActiveMode !== 'all') return;
        const combined = results.flat();
        setFossilsData(combined, false);
      });
    });
}

window.changeDepartment = function(deptCode) {
  if (deptCode === 'all') {
    loadAllFranceData();
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

  // Populate Department Selector with all 94 French Departments + "Toute la France"
  const selectEl = document.getElementById('deptSelect');
  if (selectEl) {
    selectEl.innerHTML = '<option value="all">🇫🇷 Toute la France (49 757 fossiles)</option>' +
      ALL_DEPARTMENTS.map(d => `<option value="${d.code}">${d.code} — ${d.name}</option>`).join('');
    selectEl.value = "all";
  }

  // DEFAULT STARTUP VIEW: ALL OF FRANCE
  loadAllFranceData();

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

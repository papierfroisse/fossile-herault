// Paleogeography & Geological Time Travel Feature
import { map, flyToLoc } from './map.js';
import { filterByPeriod } from './fossils.js';
import { switchMapColorMode } from './geology.js';

export let paleoSeaLayer = null;

export const PALEOGEOGRAPHY_ERAS = {
  'carboniferous': {
    index: 0,
    name: "Carbonifère",
    age: "~359 - 299 Ma",
    title: "🌿 Carbonifère (~350 Ma) — Forêts Houillères & Lagunes",
    periodFilter: "ordovician_devonian", // Early Paleozoic / Carboniferous
    color: "#059669",
    geography: "France occupée par la chaîne Varisque et d'immenses forêts marécageuses tropicales et lagunes houillères.",
    climate: "Chaud et très humide, atmosphère hyper-oxygénée (35% d'O2).",
    life: "Fougères géantes (*Lepidodendron*, *Sigillaria*), libellules géantes (*Meganeura*), premiers tétrapodes.",
    seaLevel: "Mers chaudes épicontinentales résiduelles, marécages côtiers.",
    seaCoords: [
      [[42.0, -5.0], [51.5, -5.0], [51.5, 9.5], [42.0, 9.5]], // Base container
    ]
  },
  'permian': {
    index: 1,
    name: "Permien",
    age: "~299 - 252 Ma",
    title: "🔴 Permien (~290 Ma) — Pangée & Bassins Continental Arides",
    periodFilter: "permian",
    color: "#dc2626",
    geography: "Supercontinent Pangée. La France est un vaste bassin d'effondrement continental aride à pélites et dômes volcaniques.",
    climate: "Chaud et aride (climat de type désertique / continental strict).",
    life: "Végétaux primitifs (*Walchia piniformis*), grands amphibiens (*Apateon*) et reptiles mammalions (Thérapsides).",
    seaLevel: "Retrait marin presque total en France, lacs salés endoréiques.",
    keySites: [
      { name: "Salagou / Lieude", lat: 43.6533, lng: 3.3478, zoom: 11 },
      { name: "Autun / Saône-et-Loire", lat: 46.9500, lng: 4.3000, zoom: 11 }
    ]
  },
  'trias': {
    index: 2,
    name: "Trias",
    age: "~252 - 201 Ma",
    title: "🍊 Trias (~230 Ma) — Mer Évaporitique & Muschelkalk",
    periodFilter: "permian", // Includes late Permian/Trias
    color: "#f59e0b",
    geography: "Début de la dislocation de la Pangée. Invasions marines peu profondes par l'est et le sud (lagunes salées, grès).",
    climate: "Chaud avec alternances de saisons très sèches et d'évaporation intense (évaporites, sel).",
    life: "Premiers dinosaures terrestres, reptiles marins (Nothosaures, Placodontes), bivalves et grès à empreintes.",
    seaLevel: "Transgression marine germanique et alpine.",
    keySites: [
      { name: "Bassin de Lodève / Causses", lat: 43.7317, lng: 3.3192, zoom: 11 }
    ]
  },
  'jurassic': {
    index: 3,
    name: "Jurassique",
    age: "~201 - 145 Ma",
    title: "🐚 Jurassique (~170 Ma) — Mer Téthys & Récifs d'Ammonites",
    periodFilter: "jurassic",
    color: "#0284c7",
    geography: "Submersion marine quasi-totale de la France sous l'océan Téthys. Mer chaude et cristalline parsemée d'atolls et bancs calcaro-marneux.",
    climate: "Tropical et très humide, niveau marin très élevé.",
    life: "Ammonites géantes (*Hildoceras*), Bélemnites, Plésiosaures, Ichthyosaures, Récifs coralliens et éponges.",
    seaLevel: "Mer Téthys occupant 85% du territoire français.",
    keySites: [
      { name: "Causses du Larzac", lat: 43.8506, lng: 3.1207, zoom: 11 },
      { name: "Sainte-Croix / Verdon", lat: 43.7500, lng: 6.1500, zoom: 11 }
    ]
  },
  'cretaceous': {
    index: 4,
    name: "Crétacé",
    age: "~145 - 66 Ma",
    title: "🦖 Crétacé (~100 Ma) — Archipel Européen & Dinosaures",
    periodFilter: "cretaceous",
    color: "#16a34a",
    geography: "Niveau des mers au plus haut historique. La France est un archipel d'îles tropicales bordées de deltas et de vasières.",
    climate: "Chaud et équatorial, absence de glaces aux pôles.",
    life: "Grands dinosaures (Titanosaures, Rhabdodon), œufs de dinosaures, Mosasaures et premières plantes à fleurs.",
    seaLevel: "Mers d'Hauteville & Craie du Bassin Parisien.",
    keySites: [
      { name: "Mèze / Gisement d'Œufs", lat: 43.4278, lng: 3.6056, zoom: 12 },
      { name: "Sainte-Victoire / Aix", lat: 43.5300, lng: 5.5800, zoom: 11 }
    ]
  },
  'cenozoic': {
    index: 5,
    name: "Cénozoïque",
    age: "~66 - 2 Ma",
    title: "🦴 Cénozoïque (~30 Ma) — Naissance des Alpes & Faune Moderne",
    periodFilter: "cenozoic",
    color: "#9333ea",
    geography: "Retrait des mers, plissement des Pyrénées et des Alpes. Création de la vallée du Rhône et volcans d'Auvergne.",
    climate: "Refroidissement progressif et développement des prairies et forêts modérées.",
    life: "Mammifères diversifiés (Lophiodon, Hyaenodon, Mastodontes), oiseaux, Poissons téléostéens et flore moderne.",
    seaLevel: "Retrait progressif des mers vers les bassins actuels.",
    keySites: [
      { name: "Phosphorites du Quercy", lat: 44.4500, lng: 1.6000, zoom: 11 },
      { name: "Cesseras / Minervois", lat: 43.3250, lng: 2.7150, zoom: 12 }
    ]
  },
  'all': {
    index: 6,
    name: "Toutes Époques",
    age: "4.5 Ma à Actuel",
    title: "🌐 Toutes les Époques Géologiques (Vue Globale)",
    periodFilter: "",
    color: "#38bdf8",
    geography: "France géologique contemporaine — Reliefs actuels et affleurements érodés.",
    climate: "Climat actuel tempéré.",
    life: "49 757 spécimens fossiles enregistrés sur 94 départements.",
    seaLevel: "Littoral métropolitain actuel."
  }
};

const SLIDER_ERA_KEYS = ['carboniferous', 'permian', 'trias', 'jurassic', 'cretaceous', 'cenozoic', 'all'];

export function selectPaleoEra(eraKey) {
  const era = PALEOGEOGRAPHY_ERAS[eraKey];
  if (!era) return;

  // Update Period filter in fossils module
  filterByPeriod(era.periodFilter);
  switchMapColorMode('period');

  // Update slider UI if element exists
  const sliderEl = document.getElementById('paleoTimeSlider');
  const labelEl = document.getElementById('paleoTimeLabel');
  if (sliderEl) sliderEl.value = era.index;
  if (labelEl) {
    labelEl.innerHTML = `<b style="color:${era.color}">${era.name}</b> (${era.age})`;
  }

  // Display Era Info Card
  const infoEl = document.getElementById('paleoEraInfo');
  if (infoEl) {
    infoEl.style.display = 'block';
    infoEl.style.borderColor = era.color;
    infoEl.innerHTML = `
      <div style="font-weight:700; color:${era.color}; font-size:0.92rem; margin-bottom:6px;">${era.title}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:4px;"><b>🌍 Paléogéographie & Terres :</b> ${era.geography}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:4px;"><b>🌊 Niveau des Mers :</b> ${era.seaLevel}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:4px;"><b>☀️ Climat :</b> ${era.climate}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:6px;"><b>🦕 Faune & Flore :</b> ${era.life}</div>
    `;
  }

  // Render paleogeography submerged sea overlay on Leaflet
  renderPaleoSeaOverlay(eraKey);

  // Fly to key site of the era if provided
  if (era.keySites && era.keySites.length > 0) {
    const site = era.keySites[0];
    flyToLoc(site.lat, site.lng, site.zoom);
  }
}

export function handlePaleoSliderChange(val) {
  const idx = parseInt(val);
  const eraKey = SLIDER_ERA_KEYS[idx] || 'all';
  selectPaleoEra(eraKey);
}

function renderPaleoSeaOverlay(eraKey) {
  if (!map) return;
  if (paleoSeaLayer) {
    map.removeLayer(paleoSeaLayer);
    paleoSeaLayer = null;
  }

  const era = PALEOGEOGRAPHY_ERAS[eraKey];
  if (!era || eraKey === 'all') return;

  // Submerged sea overlays according to paleogeographic reconstructions
  const seaPolygons = {
    'carboniferous': [
      // Shallow equatorial seas in North & East France
      [[51.2, 1.5], [51.2, 9.0], [48.0, 9.0], [48.5, 4.0], [50.0, 1.5]]
    ],
    'permian': [
      // Salagou & Autun continental lakes / epicontinental lagoons
      [[43.8, 3.1], [43.8, 3.6], [43.5, 3.6], [43.5, 3.1]],
      [[47.1, 4.1], [47.1, 4.6], [46.8, 4.6], [46.8, 4.1]]
    ],
    'trias': [
      // Germanian transgression / Tethys early opening east & south
      [[50.5, 4.5], [50.5, 8.5], [43.0, 8.5], [43.0, 5.0], [46.0, 4.5]]
    ],
    'jurassic': [
      // Tethys Ocean marine transgression covering ~80% of France
      [[51.0, -3.0], [51.0, 9.0], [42.5, 9.0], [42.5, -3.0]]
    ],
    'cretaceous': [
      // European archipelago / Chalk sea
      [[51.5, -2.0], [51.5, 8.5], [43.0, 8.5], [43.0, -2.0]]
    ],
    'cenozoic': [
      // Paratethys & Mediterranean gulfs
      [[44.0, 3.5], [44.0, 7.5], [42.5, 7.5], [42.5, 3.5]]
    ]
  };

  const coords = seaPolygons[eraKey];
  if (!coords) return;

  paleoSeaLayer = L.polygon(coords, {
    pane: 'polygonsPane',
    color: era.color,
    fillColor: era.color,
    fillOpacity: 0.18,
    weight: 2,
    dashArray: '6, 6'
  }).addTo(map);

  paleoSeaLayer.bindTooltip(`
    <div style="font-family:Outfit, sans-serif; font-size:0.82rem;">
      <b style="color:${era.color};">🌊 Terres Immergées & Mers (${era.name})</b><br>
      ${era.seaLevel}
    </div>
  `, { sticky: true });
}

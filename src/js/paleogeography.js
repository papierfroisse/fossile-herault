// Paleogeography & Geological Time Travel Feature (Organic Paleogeographic Maps)
import { map, flyToLoc } from './map.js';
import { filterByPeriod } from './fossils.js';
import { switchMapColorMode } from './geology.js';

export let paleoSeaLayer = null;

export const PALEOGEOGRAPHY_ERAS = {
  'carboniferous': {
    index: 0,
    name: "Carbonifère",
    age: "~359 - 299 Ma",
    title: "🌿 Carbonifère (~350 Ma) — Forêts Houillères & Lagunes Varisques",
    periodFilter: "ordovician_devonian",
    color: "#059669",
    geography: "Chaîne Varisque européenne. Immenses forêts marécageuses tropicales et lagunes houillères (Nord-Pas-de-Calais, Saint-Étienne).",
    climate: "Chaud et très humide, atmosphère hyper-oxygénée (35% O2).",
    life: "Fougères géantes (*Lepidodendron*, *Sigillaria*), libellules géantes (*Meganeura*), premiers tétrapodes.",
    seaLevel: "Marécages côtiers et estuaires équatoriaux.",
    seaCoords: [
      // Nord-Pas-de-Calais Coal Basin
      [[50.80, 1.80], [50.75, 4.20], [50.15, 4.30], [50.20, 1.90]],
      // Saint-Étienne Coal Basin
      [[45.55, 4.20], [45.52, 4.65], [45.32, 4.58], [45.35, 4.15]],
      // Carmaux Coal Basin
      [[44.12, 2.05], [44.08, 2.30], [43.98, 2.25], [44.00, 2.02]]
    ]
  },
  'permian': {
    index: 1,
    name: "Permien",
    age: "~299 - 252 Ma",
    title: "🔴 Permien (~290 Ma) — Pangée & Bassins Continentaux Arides",
    periodFilter: "permian",
    color: "#dc2626",
    geography: "Supercontinent Pangée. La France est un vaste bassin d'effondrement continental aride avec des lacs salés et volcans (Salagou, Autun).",
    climate: "Chaud et désertique (climat continental aride strict).",
    life: "Végétaux primitifs (*Walchia piniformis*), amphibiens (*Apateon*) et reptiles mammalions (Thérapsides).",
    seaLevel: "Retrait marin quasi-total en France, lacs salés endoréiques pélitiques.",
    seaCoords: [
      // Salagou & Lodève Basin
      [[43.78, 3.08], [43.74, 3.48], [43.55, 3.55], [43.52, 3.18]],
      // Autun Basin
      [[47.08, 4.12], [47.04, 4.48], [46.82, 4.50], [46.85, 4.15]],
      // Saint-Affrique Basin
      [[44.05, 2.70], [43.99, 3.10], [43.85, 3.05], [43.88, 2.68]],
      // Estérel Volcanic Basin
      [[43.55, 6.65], [43.58, 7.15], [43.35, 7.08], [43.32, 6.62]]
    ]
  },
  'trias': {
    index: 2,
    name: "Trias",
    age: "~252 - 201 Ma",
    title: "🍊 Trias (~230 Ma) — Mer Évaporitique & Muschelkalk",
    periodFilter: "permian",
    color: "#f59e0b",
    geography: "Dislocation de la Pangée. Invasions marines peu profondes par l'est et le sud (lagunes salées, grès à empreintes).",
    climate: "Chaud avec alternances de saisons très sèches et évaporation intense (sel, gypse).",
    life: "Dinosaures primitifs, reptiles marins (Nothosaures, Placodontes), bivalves et grès.",
    seaLevel: "Transgression marine germanique et alpine de l'est.",
    seaCoords: [
      [[50.80, 4.20], [50.50, 7.80], [48.20, 7.60], [46.50, 6.20], [43.50, 7.20], [43.20, 5.20], [45.50, 4.80], [48.80, 4.10]]
    ]
  },
  'jurassic': {
    index: 3,
    name: "Jurassique",
    age: "~201 - 145 Ma",
    title: "🐚 Jurassique (~170 Ma) — Mer Téthys & Récifs d'Ammonites",
    periodFilter: "jurassic",
    color: "#0284c7",
    geography: "Submersion marine quasi-totale sous l'océan Téthys. Mer chaude tropicale parsemée d'atolls et récifs coralliens.",
    climate: "Tropical chaud et très humide, niveau marin très élevé.",
    life: "Ammonites géantes (*Hildoceras*), Bélemnites, Plésiosaures, Ichthyosaures et Récifs.",
    seaLevel: "Mer Téthys recouvrant 85% de la France (Bassin Parisien, Aquitaine, Causses).",
    seaCoords: [
      // Organic Tethys Sea coastline covering submerged basins of France
      [
        [51.2, 2.5], [50.8, 4.2], [49.5, 6.8], [48.2, 7.5], [46.5, 6.5], [44.8, 7.2],
        [43.2, 7.5], [42.8, 3.2], [43.1, 1.2], [43.5, -1.2], [44.5, -1.8], [46.2, -1.5],
        [47.8, -2.5], [49.2, -1.8], [50.5, 0.2]
      ]
    ]
  },
  'cretaceous': {
    index: 4,
    name: "Crétacé",
    age: "~145 - 66 Ma",
    title: "🦖 Crétacé (~100 Ma) — Archipel Européen & Dinosaures",
    periodFilter: "cretaceous",
    color: "#16a34a",
    geography: "Niveau des mers au plus haut historique. La France est un archipel d'îles tropicales bordées de deltas et de lagunes à craie.",
    climate: "Chaud et équatorial sans aucune glace aux pôles.",
    life: "Grands dinosaures (Titanosaures, Rhabdodon), œufs de dinosaures (Mèze, Aix), Mosasaures.",
    seaLevel: "Mer de la Craie et archipel d'îles continentales.",
    seaCoords: [
      [
        [51.5, -1.5], [51.2, 4.8], [50.0, 7.2], [48.5, 6.0], [47.2, 4.5], [45.5, 5.2],
        [43.5, 6.8], [42.8, 3.0], [43.4, 0.5], [44.8, -1.2], [46.8, -2.0], [49.5, -1.2]
      ]
    ]
  },
  'cenozoic': {
    index: 5,
    name: "Cénozoïque",
    age: "~66 - 2 Ma",
    title: "🦴 Cénozoïque (~30 Ma) — Naissance des Alpes & Faune Moderne",
    periodFilter: "cenozoic",
    color: "#9333ea",
    geography: "Retrait des mers, plissement des Alpes et Pyrénées. Création des lacs de la Limagne et rifts de la vallée du Rhône.",
    climate: "Refroidissement progressif et développement des forêts modernes.",
    life: "Mammifères diversifiés (Lophiodon, Hyaenodon, Mastodontes), oiseaux et flore moderne.",
    seaLevel: "Retrait marin vers les bassins méditerranéens et atlantiques actuels.",
    seaCoords: [
      // Limagne Paleolake (Auvergne)
      [[46.12, 3.05], [46.08, 3.42], [45.48, 3.38], [45.52, 3.02]],
      // Bresse & Rhone Rift Gulf
      [[46.82, 5.08], [46.78, 5.42], [43.78, 4.92], [43.82, 4.58]],
      // Falcon Paleogulf (Minervois / Cesseras)
      [[43.42, 2.48], [43.39, 2.92], [43.23, 2.88], [43.26, 2.42]]
    ]
  },
  'all': {
    index: 6,
    name: "Toutes Époques",
    age: "4.5 Ma à Actuel",
    title: "🌐 Toutes les Époques Géologiques (Vue Globale)",
    periodFilter: "",
    color: "#38bdf8",
    geography: "France géologique contemporaine — 49 757 gisements répartis sur 94 départements.",
    climate: "Climat actuel tempéré.",
    life: "Données paléontologiques certifiées MNHN, PBDB et GBIF.",
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

  // Update slider UI
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
  if (!era || eraKey === 'all' || !era.seaCoords) return;

  paleoSeaLayer = L.polygon(era.seaCoords, {
    pane: 'polygonsPane',
    color: era.color,
    fillColor: era.color,
    fillOpacity: 0.16,
    weight: 1.5,
    dashArray: '5, 5'
  }).addTo(map);

  paleoSeaLayer.bindTooltip(`
    <div style="font-family:Outfit, sans-serif; font-size:0.82rem;">
      <b style="color:${era.color};">🌊 Terres Immergées & Mers (${era.name})</b><br>
      ${era.seaLevel}
    </div>
  `, { sticky: true });
}

// Paleogeography & Geological Time Travel Feature
import { map, flyToLoc } from './map.js';
import { filterByPeriod } from './fossils.js';
import { switchMapColorMode } from './geology.js';

export const PALEOGEOGRAPHY_ERAS = {
  'permian': {
    title: "🔴 Permien (~299 - 252 Ma) — Pangée & Bassins Rouges",
    periodFilter: "permian",
    color: "#dc2626",
    geography: "Supercontinent Pangée. L'Hérault et le Sud de la France sont un grand bassin continental aride avec des lacs temporaires.",
    climate: "Chaud et aride (climat de type désertique / continental strict).",
    life: "Végétaux primitive (*Walchia piniformis*), grands amphibiens et reptiles mammalient (Thérapsides).",
    keySites: [
      { name: "Salagou / Lieude", lat: 43.6533, lng: 3.3478, zoom: 13 },
      { name: "Mont Sénégra", lat: 43.6820, lng: 3.1250, zoom: 14 }
    ]
  },
  'trias': {
    title: "🍊 Trias (~252 - 201 Ma) — Mer Évaporitique & Muschelkalk",
    periodFilter: "permian", // Includes late Permian/Trias
    color: "#f59e0b",
    geography: "Début de la dislocation de la Pangée. Invasions marines peu profondes (lagunes salées, dolomies).",
    climate: "Chaud avec alternances de saisons humides et d'évaporation intense.",
    life: "Premiers dinosaures terrestres, reptiles marins (Nothosaures), bivalves et grès à empreintes.",
    keySites: [
      { name: "Bassin de Lodève North", lat: 43.7317, lng: 3.3192, zoom: 12 }
    ]
  },
  'jurassic': {
    title: "🐚 Jurassique (~201 - 145 Ma) — Mer Téthys & Récifs d'Ammonites",
    periodFilter: "jurassic",
    color: "#0284c7",
    geography: "Submersion marine quasi-totale de la France sous l'océan Téthys. Mer chaude et cristalline parsemée d'atolls.",
    climate: "Tropical et très humide.",
    life: "Ammonites géantes (*Hildoceras*), Bélemnites, Plésiosaures, Récifs coralliens et éponges.",
    keySites: [
      { name: "Causses du Larzac", lat: 43.8506, lng: 3.1207, zoom: 12 },
      { name: "Fontaneilles", lat: 43.9000, lng: 3.8500, zoom: 13 }
    ]
  },
  'cretaceous': {
    title: "🦖 Crétacé (~145 - 66 Ma) — Archipel Européen & Dinosaures",
    periodFilter: "cretaceous",
    color: "#16a34a",
    geography: "Niveau des mers très élevé. La France est un archipel d'îles tropicales bordées de deltas et de lagunes.",
    climate: "Chaud et équatorial, absence de glaces aux pôles.",
    life: "Grands dinosaures (Rhabdodon, Titanosaures), œufs de dinosaures, Mosasaures et premières plantes à fleurs.",
    keySites: [
      { name: "Mèze / Gisement d'Œufs", lat: 43.4278, lng: 3.6056, zoom: 13 },
      { name: "Bassin de Saint-Chinian", lat: 43.4200, lng: 3.0000, zoom: 12 }
    ]
  },
  'cenozoic': {
    title: "🦴 Cénozoïque / Tertiaire (~66 - 2 Ma) — Naissance des Alpes & Faune Moderne",
    periodFilter: "cenozoic",
    color: "#9333ea",
    geography: "Retrait des mers, plissement des Pyrénées et des Alpes. Création du golfe du Lion et volcans des Causses.",
    climate: "Refroidissement progressif et développement des prairies et forêts modernes.",
    life: "Mammifères diversifiés (Lophiodon, Hyaenodon), oiseaux, Poissons téléostéens et flore tempérée.",
    keySites: [
      { name: "Cesseras / Minervois", lat: 43.3250, lng: 2.7150, zoom: 13 }
    ]
  }
};

export function selectPaleoEra(eraKey) {
  const era = PALEOGEOGRAPHY_ERAS[eraKey];
  if (!era) return;

  // Update Period filter in fossils module
  filterByPeriod(era.periodFilter);
  switchMapColorMode('period');

  // Display Era Info Card
  const infoEl = document.getElementById('paleoEraInfo');
  if (infoEl) {
    infoEl.style.display = 'block';
    infoEl.style.borderColor = era.color;
    infoEl.innerHTML = `
      <div style="font-weight:700; color:${era.color}; font-size:0.92rem; margin-bottom:6px;">${era.title}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:4px;"><b>🌍 Paléogéographie :</b> ${era.geography}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:4px;"><b>☀️ Climat & Environnement :</b> ${era.climate}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:6px;"><b>🦕 Faune & Flore Clés :</b> ${era.life}</div>
    `;
  }

  // Fly to key site of the era
  if (era.keySites && era.keySites.length > 0) {
    const site = era.keySites[0];
    flyToLoc(site.lat, site.lng, site.zoom);
  }
}

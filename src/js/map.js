// Map Initialization & Core Controls
export let map;

export function initMap() {
  map = L.map('map', {
    center: [43.55, 3.45],
    zoom: 10,
    zoomControl: false,
    renderer: L.canvas()
  });

  L.control.zoom({ position: 'topright' }).addTo(map);

  // Base Layers
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' });
  const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Esri Satellite' });
  const cartoPositron = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© CartoDB Voyager' }).addTo(map);
  const ignCadastre = L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png', { attribution: '© IGN Cadastre France', opacity: 0.7 });

  const baseMaps = {
    "🗺️ Carte Villes & Villages (CartoDB)": cartoPositron,
    "📐 Parcellaire Cadastre (IGN)": ignCadastre,
    "🛰️ Vue Satellite Haute Résolution": esriSat,
    "🌐 OpenStreetMap Standard": osm
  };
  L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

  // Custom Panes for Layer Stacking Order
  map.createPane('polygonsPane');
  map.getPane('polygonsPane').style.zIndex = 400; // Underneath

  map.createPane('fossilsPane');
  map.getPane('fossilsPane').style.zIndex = 650; // On Top of Everything

  return map;
}

export function flyToLoc(lat, lng, zoom = 14) {
  if (map) {
    map.flyTo([lat, lng], zoom, { duration: 1.5 });
  }
}

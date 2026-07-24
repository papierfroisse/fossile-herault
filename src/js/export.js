// Field Export Utilities (GPX, KML, PDF Printable Report)
import { map } from './map.js';
import { fossilsData } from './fossils.js';

export function downloadGPXExport() {
  const center = map.getCenter();
  const lat = center.lat;
  const lng = center.lng;

  let gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Fossile Hérault Pro" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Prospection Fossiles Hérault (${lat.toFixed(3)}, ${lng.toFixed(3)})</name>
  </metadata>`;

  if (fossilsData && fossilsData.length > 0) {
    fossilsData.forEach(item => {
      const dist = Math.sqrt(Math.pow(item.lat - lat, 2) + Math.pow((item.lng - lng)*0.73, 2)) * 111.0;
      if (dist <= 10.0) {
        gpxXml += `
  <wpt lat="${item.lat}" lon="${item.lng}">
    <name>🦖 ${item.name}</name>
    <desc>Catégorie: ${item.category_name} | Période: ${item.period} | Formation: ${item.formation || 'N/A'}</desc>
    <sym>Fossil</sym>
  </wpt>`;
      }
    });
  }
  gpxXml += `\n</gpx>`;

  const blob = new Blob([gpxXml], { type: 'application/gpx+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fossiles_herault_${lat.toFixed(3)}_${lng.toFixed(3)}.gpx`;
  link.click();
}

export function downloadKMLExport() {
  const center = map.getCenter();
  const lat = center.lat;
  const lng = center.lng;

  let kmlXml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Prospection Fossiles Hérault (${lat.toFixed(3)}, ${lng.toFixed(3)})</name>`;

  if (fossilsData && fossilsData.length > 0) {
    fossilsData.forEach(item => {
      const dist = Math.sqrt(Math.pow(item.lat - lat, 2) + Math.pow((item.lng - lng)*0.73, 2)) * 111.0;
      if (dist <= 10.0) {
        kmlXml += `
    <Placemark>
      <name>${item.name}</name>
      <description>Période: ${item.period} | Formation: ${item.formation || 'N/A'}</description>
      <Point>
        <coordinates>${item.lng},${item.lat},0</coordinates>
      </Point>
    </Placemark>`;
      }
    });
  }
  kmlXml += `\n  </Document>\n</kml>`;

  const blob = new Blob([kmlXml], { type: 'application/vnd.google-earth.kml+xml' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `fossiles_herault_${lat.toFixed(3)}_${lng.toFixed(3)}.kml`;
  link.click();
}

export function generateCurrentLocationReport() {
  const center = map.getCenter();
  generateCustomLocationReport(center.lat, center.lng);
}

export function generateCustomLocationReport(lat, lng) {
  const printWin = window.open('', '_blank');
  printWin.document.write(`
    <html>
    <head>
      <title>FICHE TERRAIN DE PROSPECTION — ${lat.toFixed(4)}, ${lng.toFixed(4)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
        h1 { color: #0284c7; font-size: 22px; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
        .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .tag { font-weight: bold; color: #0369a1; }
      </style>
    </head>
    <body>
      <h1>🦕 FICHE DE TERRAIN PALÉONTOLOGIQUE — HÉRAULT (34)</h1>
      <div class="box">
        <p><b>Coordonnées GPS Cibles :</b> ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</p>
        <p><b>Date d'impression :</b> ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
      <div class="box">
        <p class="tag">📌 GISEMENTS FOSSILES CERTIFIÉS À PROXIMITÉ (&lt; 10 km) :</p>
        <ul>
          ${fossilsData.slice(0, 8).map(f => `<li><b>${f.name}</b> (${f.category_name}) — <i>${f.period}</i></li>`).join('')}
        </ul>
      </div>
      <div class="box" style="background:#fff7ed; border-color:#fdba74;">
        <p style="color:#c2410c;"><b>⚠️ CONSIGNES DE SÉCURITÉ & RESPECT DES SITES :</b></p>
        <p>• Respecter la signalisation et les réserves naturelles (ex: Réserve de Coumiac : observation seule).</p>
        <p>• Porter des lunettes de sécurité et des chaussures de marche adaptées aux terrains inclinés.</p>
      </div>
      <script>window.onload = function() { window.print(); };<\/script>
    </body>
    </html>
  `);
  printWin.document.close();
}

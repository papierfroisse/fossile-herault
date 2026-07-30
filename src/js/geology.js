// Predictive Geology Scoring & Polygon Layer
import { map } from './map.js';

export let rawGeojsonData = null;
export let geojsonLayer = null;
export let currentMapColorMode = "score"; // "score" or "period"
export let minScoreThreshold = 45;
export let slopeOnlyFilter = false;

export function setGeologyData(data) {
  rawGeojsonData = data;
  if (map) {
    map.on('zoomend', () => renderPredictiveGeology());
  }
  renderPredictiveGeology();
}

export function switchMapColorMode(mode) {
  currentMapColorMode = mode;
  const legendEl = document.getElementById('mapModeLegend');
  if (legendEl) {
    if (mode === 'period') {
      legendEl.innerHTML = `<b>🎨 Carte Stratigraphique BRGM :</b><br>
      <span style="color:#dc2626;">■ Permien (~295 Ma)</span> | <span style="color:#0284c7;">■ Jurassique (~170 Ma)</span><br>
      <span style="color:#16a34a;">■ Crétacé (~70 Ma)</span> | <span style="color:#9333ea;">■ Ordovicien/Dévonien (~450 Ma)</span><br>
      <span style="color:#f59e0b;">■ Trias (~230 Ma)</span> | <span style="color:#eab308;">■ Cénozoïque (~20 Ma)</span>`;
    } else {
      legendEl.innerHTML = "Affiche le potentiel de découverte calculé par le modèle Random Forest.";
    }
  }
  renderPredictiveGeology();
}

export function updateScoreFilter(val) {
  minScoreThreshold = parseInt(val);
  const scoreValEl = document.getElementById('scoreVal');
  if (scoreValEl) scoreValEl.innerText = val + ' / 100';
  renderPredictiveGeology();
}

export function toggleSlopeFilter(checked) {
  slopeOnlyFilter = checked;
  renderPredictiveGeology();
}

export function renderPredictiveGeology(selectedFormation = "") {
  if (!rawGeojsonData || !map) return;
  if (geojsonLayer) {
    map.removeLayer(geojsonLayer);
    geojsonLayer = null;
  }

  // Only render geology polygons when zoomed into a department/region (zoom >= 10)
  if (map.getZoom() < 10) return;

  const filteredFeatures = rawGeojsonData.features.filter(f => {
    const scorePass = (f.properties.score_potentiel >= minScoreThreshold);
    let slopePass = true;
    if (slopeOnlyFilter) {
      slopePass = (f.properties.pente_degres >= 14.0);
    }

    let formationPass = true;
    if (selectedFormation) {
      const desc = String(f.properties.DESCR || "").toLowerCase();
      formationPass = desc.includes(selectedFormation.toLowerCase());
    }

    return scorePass && slopePass && formationPass;
  });

  geojsonLayer = L.geoJSON({ type: "FeatureCollection", features: filteredFeatures }, {
    pane: 'polygonsPane',
    style: function(feature) {
      const p = feature.properties;
      const desc = String(p.DESCR || "").toLowerCase();
      const score = p.score_potentiel || 40;

      let color = '#eab308';

      if (currentMapColorMode === 'period') {
        if (desc.includes('permien') || desc.includes('autunien') || desc.includes('saxoniens') || desc.includes('salagou') || desc.includes('tuilières')) {
          color = '#dc2626';
        } else if (desc.includes('jurassique') || desc.includes('toarcien') || desc.includes('fontaneilles') || desc.includes('liassique') || desc.includes('dogger') || desc.includes('malm')) {
          color = '#0284c7';
        } else if (desc.includes('crétacé') || desc.includes('maastrichtien') || desc.includes('campanien') || desc.includes('grès à reptiles') || desc.includes('argiles rutilantes')) {
          color = '#16a34a';
        } else if (desc.includes('ordovicien') || desc.includes('dévonien') || desc.includes('silurien') || desc.includes('schiste') || desc.includes('coumiac') || desc.includes('landeyran') || desc.includes('saint-chinian')) {
          color = '#9333ea';
        } else if (desc.includes('trias') || desc.includes('keuper') || desc.includes('muschelkalk') || desc.includes('grès psammitiques')) {
          color = '#f59e0b';
        } else {
          color = '#eab308';
        }
        return { fillColor: color, color: color, weight: 1.2, fillOpacity: 0.55 };
      } else {
        if (score >= 80) color = '#991b1b';
        else if (score >= 68) color = '#dc2626';
        else if (score >= 55) color = '#f97316';
        else if (score >= 45) color = '#f59e0b';

        const opacity = Math.min(0.5, 0.18 + ((score - 30) / 100) * 0.4);
        return { fillColor: color, color: color, weight: 1, fillOpacity: opacity };
      }
    },
    onEachFeature: function(feature, layer) {
      const p = feature.properties;
      const desc = String(p.DESCR || 'Formation sédimentaire');
      let epoqueName = "Inconnue";

      const descLower = desc.toLowerCase();
      if (descLower.includes('permien')) epoqueName = "🔴 Permien (~295 Ma)";
      else if (descLower.includes('jurassique')) epoqueName = "🐚 Jurassique (~170 Ma)";
      else if (descLower.includes('crétacé')) epoqueName = "🦖 Crétacé (~70 Ma)";
      else if (descLower.includes('ordovicien') || descLower.includes('dévonien')) epoqueName = "INFO Ordovicien / Dévonien (~450 Ma)";
      else if (descLower.includes('trias')) epoqueName = "🍊 Trias (~230 Ma)";
      else epoqueName = "🟡 Cénozoïque / Tertiaire (~20 Ma)";

      layer.bindTooltip(`
        <div style="font-family: Outfit, sans-serif;">
          <b style="color:#38bdf8;">Zone Géologique (${epoqueName})</b><br>
          <b>Lithologie & Roche :</b> ${desc}<br>
          <b>Inclinaison Pente :</b> <span style="color:#ef4444; font-weight:bold;">${p.pente_degres}°</span> (${p.type_affleurement || ''})<br>
          <b>Score Potentiel ML :</b> <span style="color:#f97316; font-weight:bold; font-size:1.05rem;">${p.score_potentiel} / 100</span>
        </div>
      `, { sticky: true });
    }
  }).addTo(map);

  const statZonesEl = document.getElementById('stat-zones');
  if (statZonesEl) statZonesEl.innerText = filteredFeatures.length.toLocaleString('fr-FR');
}

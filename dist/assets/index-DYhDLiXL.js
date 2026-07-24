(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e;function t(){e=L.map(`map`,{center:[43.55,3.45],zoom:10,zoomControl:!1,renderer:L.canvas()}),L.control.zoom({position:`topright`}).addTo(e);let t=L.tileLayer(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`,{maxZoom:19,attribution:`© OpenStreetMap`}),n=L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`,{attribution:`Esri Satellite`}),r={"🗺️ Carte Villes & Villages (CartoDB)":L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`,{attribution:`© CartoDB Voyager`}).addTo(e),"📐 Parcellaire Cadastre (IGN)":L.tileLayer(`https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png`,{attribution:`© IGN Cadastre France`,opacity:.7}),"🛰️ Vue Satellite Haute Résolution":n,"🌐 OpenStreetMap Standard":t};return L.control.layers(r,null,{position:`topright`}).addTo(e),e.createPane(`polygonsPane`),e.getPane(`polygonsPane`).style.zIndex=400,e.createPane(`fossilsPane`),e.getPane(`fossilsPane`).style.zIndex=650,e}function n(t,n,r=14){e&&e.flyTo([t,n],r,{duration:1.5})}function r(e){if(e.key===`Enter`){let t=e.target.value.toLowerCase().trim();if(!t)return;fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(t+`, Hérault, France`)}`).then(e=>e.json()).then(e=>{e&&e.length>0?n(parseFloat(e[0].lat),parseFloat(e[0].lon),13):alert(`Lieu introuvable dans l'Hérault.`)})}}function i(e,t){let n=document.getElementById(`wiki-box-${t}`);if(!n)return;n.style.display=`block`,n.innerHTML=`<i class="fa-solid fa-spinner fa-spin"></i> Recherche scientifique...`;let r=e.replace(/["'()]/g,``).replace(/\b(sp|cf|var|subsp)\b\.?/gi,``).trim(),i=`
    <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
      <a href="${`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(r+` fossile`)}`}" target="_blank" class="popup-tag" style="background:#1e293b; color:#38bdf8; border-color:#0284c7; margin:0; font-size:0.75rem;">🖼️ Google Images</a>
      <a href="${`https://science.mnhn.fr/institution/mnhn/collection/f/item/list?full_text=${encodeURIComponent(r)}`}" target="_blank" class="popup-tag" style="background:#1e293b; color:#34d399; border-color:#059669; margin:0; font-size:0.75rem;">🏛️ MNHN Paris</a>
    </div>
  `;fetch(`https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(r)}&format=json&origin=*`).then(e=>e.json()).then(e=>{if(e&&e.query&&e.query.search&&e.query.search.length>0){let t=e.query.search[0].title;return fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`).then(e=>e.json())}else return fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(r)}&format=json&origin=*`).then(e=>e.json()).then(e=>e&&e.query&&e.query.search&&e.query.search.length>0?fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(e.query.search[0].title)}`).then(e=>e.json()):null)}).then(e=>{if(e&&e.extract){let t=``;e.thumbnail&&e.thumbnail.source&&(t=`<img src="${e.thumbnail.source}" style="width:100%; max-height:120px; object-fit:cover; border-radius:6px; margin-bottom:6px;">`),n.innerHTML=`
          ${t}
          <div style="font-size:0.8rem; line-height:1.3;">
            <b>${e.title}</b>: ${e.extract.substring(0,200)}...
          </div>
          ${i}
        `}else n.innerHTML=`
          <div style="font-size:0.8rem; color:#cbd5e1;">ℹ️ Pas d'article Wikipédia direct. Consultez les bases certifiées :</div>
          ${i}
        `}).catch(()=>{n.innerHTML=`
        <div style="font-size:0.8rem; color:#cbd5e1;">ℹ️ Recherche distante indisponible. Liens directs :</div>
        ${i}
      `})}var a=[],o,s=new Set([`dinosaurs_reptiles`,`molluscs`,`mammals`,`plants`,`arthropods`,`fish`,`others`]),c=new Set([`MNHN`,`PBDB`,`BRGM`]),l=``;function u(){o=typeof L.markerClusterGroup==`function`?L.markerClusterGroup({disableClusteringAtZoom:14,maxClusterRadius:40,showCoverageOnHover:!1,spiderfyOnMaxZoom:!0}).addTo(e):L.layerGroup().addTo(e),window.loadWikiPreview=i}function d(e){a=e,h()}function f(e,t){t?s.add(e):s.delete(e),h()}function p(e,t){t?c.add(e):c.delete(e),h()}function m(e){l=e,h()}function h(){if(!o)return;o.clearLayers();let e=0,t={dinosaurs_reptiles:{icon:`fa-dragon`,color:`#ef4444`,label:`Dinosaures / Reptiles`},molluscs:{icon:`fa-note-sticky`,color:`#0284c7`,label:`Mollusques / Ammonites`},plants:{icon:`fa-leaf`,color:`#16a34a`,label:`Plantes / Walchia`},arthropods:{icon:`fa-bug`,color:`#9333ea`,label:`Trilobites / Arthropodes`},mammals:{icon:`fa-bone`,color:`#d97706`,label:`Mammifères`},fish:{icon:`fa-fish`,color:`#0d9488`,label:`Poissons`},others:{icon:`fa-circle-dot`,color:`#64748b`,label:`Autres`}};a.forEach(n=>{if(!s.has(n.category_id))return;let r=n.source||`PBDB`;if(!c.has(r))return;if(l){let e=(n.period||``).toLowerCase();if(l===`permian`&&!e.includes(`permian`)||l===`jurassic`&&!e.includes(`jurassic`)||l===`cretaceous`&&!e.includes(`cretaceous`)||l===`ordovician_devonian`&&!e.includes(`ordovician`)&&!e.includes(`devonian`)||l===`cenozoic`&&!e.includes(`neogene`)&&!e.includes(`pliocene`)&&!e.includes(`eocene`)&&!e.includes(`miocene`)&&!e.includes(`paleogene`))return}e++;let i=t[n.category_id]||t.others,a=i.icon;n.category_id===`molluscs`&&(a=`fa-ring`);let u=L.marker([n.lat,n.lng],{pane:`fossilsPane`,icon:L.divIcon({className:`custom-fossil-icon`,html:`<div style="background:${i.color}; color:#ffffff; width:22px; height:22px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 2px 6px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-size:10px;"><i class="fa-solid ${a}"></i></div>`,iconSize:[22,22],iconAnchor:[11,11]})}),d=`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(n.name+` fossil`)}`,f=`https://www.google.com/search?q=${encodeURIComponent(n.name+` fossile`)}`,p=n.name.replace(/[^a-zA-Z0-9 ]/g,``).trim(),m=n.precision_gps||`🎯 GPS Précis`,h=n.precision_code===`high`?`#10b981`:`#f59e0b`,g={MNHN:`<span style="background:rgba(168,85,247,0.2); color:#c084fc; border:1px solid rgba(168,85,247,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">🏛️ Collection Muséum (MNHN Paris)</span>`,BRGM:`<span style="background:rgba(56,189,248,0.2); color:#38bdf8; border:1px solid rgba(56,189,248,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">📐 Carte Géologique BRGM</span>`,PBDB:`<span style="background:rgba(34,197,94,0.2); color:#4ade80; border:1px solid rgba(34,197,94,0.5); padding:1px 6px; border-radius:4px; font-weight:700; font-size:0.75rem;">🌐 Base Scientifique PBDB</span>`},_=g[r]||g.PBDB,v=n.mnhn_catalog?`<br><b>N° Spécimen Muséum :</b> <span style="color:#c084fc; font-weight:600;">${n.mnhn_catalog}</span>`:``,y=`
      <div class="popup-title">${n.name}</div>
      <div style="margin-bottom:6px;">${_}</div>
      <div class="popup-meta">
        <b>Type :</b> <span style="color:${i.color}; font-weight:600;"><i class="fa-solid ${a}"></i> ${n.category_name}</span><br>
        <b>Précision Spatiale :</b> <span style="color:${h}; font-weight:600;">${m}</span>${v}<br>
        <b>Période :</b> ${n.period} (${n.max_ma?n.max_ma+` Ma`:`N/A`})<br>
        <b>Formation :</b> ${n.formation||`Non spécifiée`}<br>
        <b>Phylum / Classe :</b> ${n.phylum} / ${n.class_name}<br>
        <b>Coordonnées GPS :</b> ${n.lat.toFixed(4)}, ${n.lng.toFixed(4)}
      </div>

      <div id="wiki-box-${n.id}" style="margin-top:8px; font-size:0.78rem; color:#cbd5e1; background:rgba(0,0,0,0.3); padding:6px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.08); display:none;"></div>

      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
        <a href="${d}" target="_blank" class="popup-tag" style="background:#0284c7; color:#fff; border-color:#0284c7;">
          🖼️ Photos Google
        </a>
        <a href="${f}" target="_blank" class="popup-tag" style="background:#475569; color:#fff; border-color:#475569;">
          🔍 Recherche Web
        </a>
        <button onclick="loadWikiPreview('${p}', ${n.id})" class="popup-tag" style="background:#15803d; color:#fff; border-color:#15803d; cursor:pointer;">
          📖 Aperçu Wikipédia
        </button>
        <a href="https://paleobiodb.org/classic/basicCollectionSearch?collection_no=${n.id}" target="_blank" class="popup-tag" style="background:#1e293b; color:#94a3b8; border-color:#334155;">
          📄 PBDB #${n.id}
        </a>
      </div>
    `;u.bindPopup(y),o.addLayer(u)});let n=document.getElementById(`stat-fossils`);n&&(n.innerText=e.toLocaleString(`fr-FR`))}var g=null,_=null,v=`score`,y=45,b=!1;function x(e){g=e,T()}function S(e){v=e;let t=document.getElementById(`mapModeLegend`);t&&(e===`period`?t.innerHTML=`<b>🎨 Carte Stratigraphique BRGM :</b><br>
      <span style="color:#dc2626;">■ Permien (~295 Ma)</span> | <span style="color:#0284c7;">■ Jurassique (~170 Ma)</span><br>
      <span style="color:#16a34a;">■ Crétacé (~70 Ma)</span> | <span style="color:#9333ea;">■ Ordovicien/Dévonien (~450 Ma)</span><br>
      <span style="color:#f59e0b;">■ Trias (~230 Ma)</span> | <span style="color:#eab308;">■ Cénozoïque (~20 Ma)</span>`:t.innerHTML=`Affiche le potentiel de découverte calculé par le modèle Random Forest.`),T()}function C(e){y=parseInt(e);let t=document.getElementById(`scoreVal`);t&&(t.innerText=e+` / 100`),T()}function w(e){b=e,T()}function T(t=``){if(!g||!e)return;_&&e.removeLayer(_);let n=g.features.filter(e=>{let n=e.properties.score_potentiel>=y,r=!0;b&&(r=e.properties.pente_degres>=14);let i=!0;return t&&(i=String(e.properties.DESCR||``).toLowerCase().includes(t.toLowerCase())),n&&r&&i});_=L.geoJSON({type:`FeatureCollection`,features:n},{pane:`polygonsPane`,style:function(e){let t=e.properties,n=String(t.DESCR||``).toLowerCase(),r=t.score_potentiel||40,i=`#eab308`;if(v===`period`)return i=n.includes(`permien`)||n.includes(`autunien`)||n.includes(`saxoniens`)||n.includes(`salagou`)||n.includes(`tuilières`)?`#dc2626`:n.includes(`jurassique`)||n.includes(`toarcien`)||n.includes(`fontaneilles`)||n.includes(`liassique`)||n.includes(`dogger`)||n.includes(`malm`)?`#0284c7`:n.includes(`crétacé`)||n.includes(`maastrichtien`)||n.includes(`campanien`)||n.includes(`grès à reptiles`)||n.includes(`argiles rutilantes`)?`#16a34a`:n.includes(`ordovicien`)||n.includes(`dévonien`)||n.includes(`silurien`)||n.includes(`schiste`)||n.includes(`coumiac`)||n.includes(`landeyran`)||n.includes(`saint-chinian`)?`#9333ea`:n.includes(`trias`)||n.includes(`keuper`)||n.includes(`muschelkalk`)||n.includes(`grès psammitiques`)?`#f59e0b`:`#eab308`,{fillColor:i,color:i,weight:1.2,fillOpacity:.55};{r>=80?i=`#991b1b`:r>=68?i=`#dc2626`:r>=55?i=`#f97316`:r>=45&&(i=`#f59e0b`);let e=Math.min(.5,.18+(r-30)/100*.4);return{fillColor:i,color:i,weight:1,fillOpacity:e}}},onEachFeature:function(e,t){let n=e.properties,r=String(n.DESCR||`Formation sédimentaire`),i=`Inconnue`,a=r.toLowerCase();i=a.includes(`permien`)?`🔴 Permien (~295 Ma)`:a.includes(`jurassique`)?`🐚 Jurassique (~170 Ma)`:a.includes(`crétacé`)?`🦖 Crétacé (~70 Ma)`:a.includes(`ordovicien`)||a.includes(`dévonien`)?`INFO Ordovicien / Dévonien (~450 Ma)`:a.includes(`trias`)?`🍊 Trias (~230 Ma)`:`🟡 Cénozoïque / Tertiaire (~20 Ma)`,t.bindTooltip(`
        <div style="font-family: Outfit, sans-serif;">
          <b style="color:#38bdf8;">Zone Géologique (${i})</b><br>
          <b>Lithologie & Roche :</b> ${r}<br>
          <b>Inclinaison Pente :</b> <span style="color:#ef4444; font-weight:bold;">${n.pente_degres}°</span> (${n.type_affleurement||``})<br>
          <b>Score Potentiel ML :</b> <span style="color:#f97316; font-weight:bold; font-size:1.05rem;">${n.score_potentiel} / 100</span>
        </div>
      `,{sticky:!0})}}).addTo(e);let r=document.getElementById(`stat-zones`);r&&(r.innerText=n.length.toLocaleString(`fr-FR`))}var E=null,D=null,O=null,k=null;function A(){k=L.layerGroup().addTo(e),[{name:`MONTPELLIER`,lat:43.6108,lng:3.8767,main:!0},{name:`BÉZIERS`,lat:43.3442,lng:3.2158,main:!0},{name:`SÈTE`,lat:43.4053,lng:3.6975,main:!0},{name:`AGDE`,lat:43.3108,lng:3.4758,main:!1},{name:`LODÈVE`,lat:43.7311,lng:3.32,main:!0},{name:`CLERMONT-L'HÉRAULT`,lat:43.6275,lng:3.4303,main:!1},{name:`BÉDARIEUX`,lat:43.6167,lng:3.1583,main:!1},{name:`GANGES`,lat:43.9358,lng:3.7083,main:!1},{name:`PÉZENAS`,lat:43.4608,lng:3.4225,main:!1}].forEach(e=>{L.marker([e.lat,e.lng],{interactive:!1,icon:L.divIcon({className:`city-label-icon`,html:`<div style="background:rgba(15,23,42,0.85); color:#f8fafc; border:1px solid rgba(56,189,248,0.6); padding:2px 7px; border-radius:4px; font-size:${e.main?`11px`:`10px`}; font-weight:700; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.6); letter-spacing:0.5px;"><i class="fa-solid fa-city" style="font-size:9px; color:#38bdf8; margin-right:3px;"></i>${e.name}</div>`,iconAnchor:[30,10]})}).addTo(k)}),fetch(`processed/reserves_herault.geojson`).then(e=>e.json()).then(t=>{O=L.geoJSON(t,{pointToLayer:function(e,t){let n=e.properties,r=n.interdiction,i=r?`#dc2626`:`#f59e0b`,a=r?`fa-ban`:`fa-shield-halved`;return L.marker(t,{icon:L.divIcon({className:`custom-div-icon`,html:`<div style="background:${i}; color:#fff; padding:6px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 10px rgba(0,0,0,0.6); text-align:center;"><i class="fa-solid ${a}" style="font-size:13px;"></i></div>`,iconSize:[26,26],iconAnchor:[13,13]})}).bindPopup(`
          <div class="popup-title" style="color:${i};">${n.name}</div>
          <div class="popup-meta">
            <b>Statut Légal :</b> ${n.type}<br><br>
            <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; padding:8px; border-radius:8px; font-size:0.8rem;">
              ${n.reglementation}
            </div>
          </div>
        `)}}).addTo(e)}),fetch(`processed/rivieres_herault.geojson`).then(e=>e.json()).then(t=>{E=L.geoJSON(t,{style:{color:`#0284c7`,weight:1.2,opacity:.35},onEachFeature:function(e,t){t.bindTooltip(e.properties.name||`Cours d'eau`,{sticky:!0})}}),e.getZoom()>=11&&E.addTo(e)}),e.on(`zoomend`,function(){E&&(e.getZoom()>=11?e.hasLayer(E)||e.addLayer(E):e.hasLayer(E)&&e.removeLayer(E))}),fetch(`processed/carrieres_herault.geojson`).then(e=>e.json()).then(t=>{D=L.geoJSON(t,{pointToLayer:function(e,t){let n=e.properties;return L.marker(t,{icon:L.divIcon({className:`custom-div-icon`,html:`<div style="background:#f59e0b; color:#fff; padding:6px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.4); text-align:center;"><i class="fa-solid fa-industry" style="font-size:12px;"></i></div>`,iconSize:[24,24],iconAnchor:[12,12]})}).bindPopup(`
          <div class="popup-title">${n.name}</div>
          <div class="popup-meta">
            <b>Type :</b> ${n.type}<br>
            <b>Commune :</b> ${n.commune}<br>
            <b>Intérêt paléontologique :</b> ${n.interet}
          </div>
          <span class="popup-tag" style="color:#f59e0b; border-color:#f59e0b;">Coupe ouverte / Carrière</span>
        `)}}).addTo(e)}),L.marker([43.682,3.125],{icon:L.divIcon({className:`custom-div-icon`,html:`<div style="background:#10b981; color:#fff; padding:7px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.5); text-align:center;"><i class="fa-solid fa-leaf" style="font-size:13px;"></i></div>`,iconSize:[26,26],iconAnchor:[13,13]})}).bindPopup(`
    <div class="popup-title">🌿 Mont Sénégra (G. Gand et al., MNHN 2013)</div>
    <div class="popup-meta">
      <b>Période :</b> Autunien basal (Permien inférieur, ~295 Ma)<br>
      <b>Plantes identifiées :</b> <i>Walchia piniformis</i>, <i>Hermitia</i>, <i>Culmitzschia</i>, <i>Rhachiphyllum</i>.<br>
      <b>Repère de terrain :</b> 20m au-dessus du conglomérat basal.
    </div>
    <a href="https://sciencepress.mnhn.fr/sites/default/files/articles/pdf/comptes-rendus-palevol2013v12f2a02.pdf" target="_blank" class="popup-tag" style="color:#10b981; border-color:#10b981;">📄 Lire la publication MNHN (2013)</a>
  `).addTo(e)}function j(t){O&&e&&(t?e.addLayer(O):e.removeLayer(O))}function M(t){E&&e&&(t?e.addLayer(E):e.removeLayer(E))}function N(t){D&&e&&(t?e.addLayer(D):e.removeLayer(D))}var P=null,F=!1;function I(){e&&(e.on(`click`,function(e){if(window.innerWidth<=768){let e=document.getElementById(`sidebar`);e&&e.classList.remove(`mobile-open`)}if(F){F=!1;let t=e.latlng.lat,n=e.latlng.lng;z(t,n,e.latlng)}}),e.on(`contextmenu`,function(e){z(e.latlng.lat,e.latlng.lng,e.latlng)}))}function R(){if(!navigator.geolocation){alert(`La géolocalisation n'est pas supportée par votre navigateur.`);return}navigator.geolocation.getCurrentPosition(t=>{let n=t.coords.latitude,r=t.coords.longitude;P&&e&&e.removeLayer(P),P=L.marker([n,r],{icon:L.divIcon({className:`custom-user-location`,html:`<div style="background:#2563eb; color:#fff; width:26px; height:26px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 15px #2563eb; display:flex; align-items:center; justify-content:center; font-size:12px;"><i class="fa-solid fa-crosshairs"></i></div>`,iconSize:[26,26],iconAnchor:[13,13]})}).bindPopup(`
        <b>🎯 Votre Position GPS en Direct</b><br>Lat: ${n.toFixed(5)}, Lng: ${r.toFixed(5)}<br>
        <div style="margin-top:8px; display:flex; flex-direction:column; gap:4px;">
          <a href="#" onclick="generateCustomLocationReport(${n}, ${r}); return false;" class="popup-tag" style="background:#0284c7; color:#fff; text-align:center;">📄 Rapport PDF Ma Position</a>
          <button onclick="togglePointSelectionMode()" style="background:#a855f7; color:#fff; border:none; padding:4px; border-radius:4px; font-size:0.75rem; cursor:pointer;">📌 Activer Sélection Autre Point</button>
        </div>
      `).addTo(e),e.flyTo([n,r],14,{duration:1.5}),P.openPopup()},e=>{alert(`Impossible d'obtenir votre position GPS. Astuce: Vous pouvez faire un appui long sur la carte pour placer un point.`)},{enableHighAccuracy:!0})}function z(t,n,r){L.popup().setLatLng(r).setContent(`
    <div class="popup-title">📍 Point GPS Sélectionné</div>
    <div class="popup-meta">
      <b>Coordonnées :</b> ${t.toFixed(4)}° N, ${n.toFixed(4)}° E<br>
      Générez une fiche de terrain PDF complète pour ce point précis.
    </div>
    <a href="#" onclick="generateCustomLocationReport(${t}, ${n}); return false;" class="popup-tag" style="background:#0284c7; color:#fff; border-color:#0284c7; font-size:0.8rem; display:block; text-align:center; margin-top:8px;">
      📄 Générer le Rapport PDF de ce Point
    </a>
  `).openOn(e)}function B(){let t=e.getCenter(),n=t.lat,r=t.lng,i=`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Fossile Hérault Pro" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Prospection Fossiles Hérault (${n.toFixed(3)}, ${r.toFixed(3)})</name>
  </metadata>`;a&&a.length>0&&a.forEach(e=>{Math.sqrt((e.lat-n)**2+((e.lng-r)*.73)**2)*111<=10&&(i+=`
  <wpt lat="${e.lat}" lon="${e.lng}">
    <name>🦖 ${e.name}</name>
    <desc>Catégorie: ${e.category_name} | Période: ${e.period} | Formation: ${e.formation||`N/A`}</desc>
    <sym>Fossil</sym>
  </wpt>`)}),i+=`
</gpx>`;let o=new Blob([i],{type:`application/gpx+xml`}),s=document.createElement(`a`);s.href=URL.createObjectURL(o),s.download=`fossiles_herault_${n.toFixed(3)}_${r.toFixed(3)}.gpx`,s.click()}function V(){let t=e.getCenter(),n=t.lat,r=t.lng,i=`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Prospection Fossiles Hérault (${n.toFixed(3)}, ${r.toFixed(3)})</name>`;a&&a.length>0&&a.forEach(e=>{Math.sqrt((e.lat-n)**2+((e.lng-r)*.73)**2)*111<=10&&(i+=`
    <Placemark>
      <name>${e.name}</name>
      <description>Période: ${e.period} | Formation: ${e.formation||`N/A`}</description>
      <Point>
        <coordinates>${e.lng},${e.lat},0</coordinates>
      </Point>
    </Placemark>`)}),i+=`
  </Document>
</kml>`;let o=new Blob([i],{type:`application/vnd.google-earth.kml+xml`}),s=document.createElement(`a`);s.href=URL.createObjectURL(o),s.download=`fossiles_herault_${n.toFixed(3)}_${r.toFixed(3)}.kml`,s.click()}function H(){let t=e.getCenter();U(t.lat,t.lng)}function U(e,t){let n=window.open(``,`_blank`);n.document.write(`
    <html>
    <head>
      <title>FICHE TERRAIN DE PROSPECTION — ${e.toFixed(4)}, ${t.toFixed(4)}</title>
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
        <p><b>Coordonnées GPS Cibles :</b> ${e.toFixed(4)}° N, ${t.toFixed(4)}° E</p>
        <p><b>Date d'impression :</b> ${new Date().toLocaleDateString(`fr-FR`)}</p>
      </div>
      <div class="box">
        <p class="tag">📌 GISEMENTS FOSSILES CERTIFIÉS À PROXIMITÉ (&lt; 10 km) :</p>
        <ul>
          ${a.slice(0,8).map(e=>`<li><b>${e.name}</b> (${e.category_name}) — <i>${e.period}</i></li>`).join(``)}
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
  `),n.document.close()}var W=null;function G(){W=L.layerGroup().addTo(e),Y()}function K(t=null,n=null){let r=document.getElementById(`personalFindingModal`);r&&(r.style.display=`flex`);let i=e.getCenter(),a=document.getElementById(`pf-lat`),o=document.getElementById(`pf-lng`);a&&(a.value=t?t.toFixed(5):i.lat.toFixed(5)),o&&(o.value=n?n.toFixed(5):i.lng.toFixed(5))}function q(){let e=document.getElementById(`personalFindingModal`);e&&(e.style.display=`none`)}function J(t){t.preventDefault();let n=document.getElementById(`pf-name`).value,r=document.getElementById(`pf-category`).value,i=parseFloat(document.getElementById(`pf-lat`).value),a=parseFloat(document.getElementById(`pf-lng`).value),o=document.getElementById(`pf-notes`).value,s={id:Date.now(),name:n,category:r,lat:i,lng:a,notes:o,date:new Date().toLocaleDateString(`fr-FR`)},c=JSON.parse(localStorage.getItem(`my_fossil_findings`)||`[]`);c.push(s),localStorage.setItem(`my_fossil_findings`,JSON.stringify(c)),q(),document.getElementById(`pf-name`).value=``,document.getElementById(`pf-notes`).value=``,Y(),e.flyTo([i,a],14)}function Y(){W&&(W.clearLayers(),JSON.parse(localStorage.getItem(`my_fossil_findings`)||`[]`).forEach(e=>{let t=L.marker([e.lat,e.lng],{pane:`fossilsPane`,icon:L.divIcon({className:`custom-personal-finding`,html:`<div style="background:#a855f7; color:#fff; width:26px; height:26px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 12px #a855f7; display:flex; align-items:center; justify-content:center; font-size:12px;"><i class="fa-solid fa-star"></i></div>`,iconSize:[26,26],iconAnchor:[13,13]})}).bindPopup(`
      <div class="popup-title" style="color:#a855f7;">🌟 Ma Découverte : ${e.name}</div>
      <div class="popup-meta">
        <b>Date :</b> ${e.date}<br>
        <b>GPS :</b> ${e.lat.toFixed(5)}, ${e.lng.toFixed(5)}<br>
        <b>Notes :</b> ${e.notes||`Aucune note`}
      </div>
      <button onclick="deletePersonalFinding(${e.id})" style="background:#dc2626; color:#fff; border:none; padding:4px 8px; border-radius:6px; font-size:0.75rem; margin-top:8px; cursor:pointer;">🗑️ Supprimer de mon carnet</button>
    `);W.addLayer(t)}))}function X(t){let n=JSON.parse(localStorage.getItem(`my_fossil_findings`)||`[]`);n=n.filter(e=>e.id!==t),localStorage.setItem(`my_fossil_findings`,JSON.stringify(n)),Y(),e&&e.closePopup()}function Z(){let t=document.getElementById(`sidebar`),n=document.getElementById(`toggleIcon`);t&&(t.classList.toggle(`collapsed`),n&&(t.classList.contains(`collapsed`)?n.className=`fa-solid fa-angles-right`:n.className=`fa-solid fa-angles-left`),setTimeout(()=>{e&&e.invalidateSize()},350))}function Q(){let e=document.getElementById(`sidebar`);e&&e.classList.toggle(`mobile-open`)}function $(){let e=v===`score`?`period`:`score`,t=document.getElementById(`mapModeSelect`);t&&(t.value=e),S(e)}function ee(){let e=document.getElementById(`gearModal`);e&&(e.style.display=`flex`)}function te(){let e=document.getElementById(`gearModal`);e&&(e.style.display=`none`)}function ne(){let e=document.getElementById(`guideModal`);e&&(e.style.display=`flex`)}function re(){let e=document.getElementById(`guideModal`);e&&(e.style.display=`none`)}var ie={permian:{title:`🔴 Permien (~299 - 252 Ma) — Pangée & Bassins Rouges`,periodFilter:`permian`,color:`#dc2626`,geography:`Supercontinent Pangée. L'Hérault et le Sud de la France sont un grand bassin continental aride avec des lacs temporaires.`,climate:`Chaud et aride (climat de type désertique / continental strict).`,life:`Végétaux primitive (*Walchia piniformis*), grands amphibiens et reptiles mammalient (Thérapsides).`,keySites:[{name:`Salagou / Lieude`,lat:43.6533,lng:3.3478,zoom:13},{name:`Mont Sénégra`,lat:43.682,lng:3.125,zoom:14}]},trias:{title:`🍊 Trias (~252 - 201 Ma) — Mer Évaporitique & Muschelkalk`,periodFilter:`permian`,color:`#f59e0b`,geography:`Début de la dislocation de la Pangée. Invasions marines peu profondes (lagunes salées, dolomies).`,climate:`Chaud avec alternances de saisons humides et d'évaporation intense.`,life:`Premiers dinosaures terrestres, reptiles marins (Nothosaures), bivalves et grès à empreintes.`,keySites:[{name:`Bassin de Lodève North`,lat:43.7317,lng:3.3192,zoom:12}]},jurassic:{title:`🐚 Jurassique (~201 - 145 Ma) — Mer Téthys & Récifs d'Ammonites`,periodFilter:`jurassic`,color:`#0284c7`,geography:`Submersion marine quasi-totale de la France sous l'océan Téthys. Mer chaude et cristalline parsemée d'atolls.`,climate:`Tropical et très humide.`,life:`Ammonites géantes (*Hildoceras*), Bélemnites, Plésiosaures, Récifs coralliens et éponges.`,keySites:[{name:`Causses du Larzac`,lat:43.8506,lng:3.1207,zoom:12},{name:`Fontaneilles`,lat:43.9,lng:3.85,zoom:13}]},cretaceous:{title:`🦖 Crétacé (~145 - 66 Ma) — Archipel Européen & Dinosaures`,periodFilter:`cretaceous`,color:`#16a34a`,geography:`Niveau des mers très élevé. La France est un archipel d'îles tropicales bordées de deltas et de lagunes.`,climate:`Chaud et équatorial, absence de glaces aux pôles.`,life:`Grands dinosaures (Rhabdodon, Titanosaures), œufs de dinosaures, Mosasaures et premières plantes à fleurs.`,keySites:[{name:`Mèze / Gisement d'Œufs`,lat:43.4278,lng:3.6056,zoom:13},{name:`Bassin de Saint-Chinian`,lat:43.42,lng:3,zoom:12}]},cenozoic:{title:`🦴 Cénozoïque / Tertiaire (~66 - 2 Ma) — Naissance des Alpes & Faune Moderne`,periodFilter:`cenozoic`,color:`#9333ea`,geography:`Retrait des mers, plissement des Pyrénées et des Alpes. Création du golfe du Lion et volcans des Causses.`,climate:`Refroidissement progressif et développement des prairies et forêts modernes.`,life:`Mammifères diversifiés (Lophiodon, Hyaenodon), oiseaux, Poissons téléostéens et flore tempérée.`,keySites:[{name:`Cesseras / Minervois`,lat:43.325,lng:2.715,zoom:13}]}};function ae(e){let t=ie[e];if(!t)return;m(t.periodFilter),S(`period`);let r=document.getElementById(`paleoEraInfo`);if(r&&(r.style.display=`block`,r.style.borderColor=t.color,r.innerHTML=`
      <div style="font-weight:700; color:${t.color}; font-size:0.92rem; margin-bottom:6px;">${t.title}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:4px;"><b>🌍 Paléogéographie :</b> ${t.geography}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:4px;"><b>☀️ Climat & Environnement :</b> ${t.climate}</div>
      <div style="font-size:0.8rem; color:#cbd5e1; margin-bottom:6px;"><b>🦕 Faune & Flore Clés :</b> ${t.life}</div>
    `),t.keySites&&t.keySites.length>0){let e=t.keySites[0];n(e.lat,e.lng,e.zoom)}}window.selectPaleoEra=ae,window.locateUserOnMap=R,window.openAddPersonalFindingModal=K,window.closeAddPersonalFindingModal=q,window.savePersonalFinding=J,window.deletePersonalFinding=X,window.downloadGPXExport=B,window.downloadKMLExport=V,window.generateCurrentLocationReport=H,window.generateCustomLocationReport=U,window.toggleSidebar=Z,window.toggleMobileSidebar=Q,window.toggleMobileMapMode=$,window.switchMapColorMode=S,window.filterByPeriod=m,window.toggleSourceFilter=p,window.toggleReservesLayer=j,window.toggleRiversLayer=M,window.toggleQuarriesLayer=N,window.toggleSlopeFilter=w,window.updateScoreFilter=C,window.toggleCategory=f,window.openGearModal=ee,window.closeGearModal=te,window.openGuideModal=ne,window.closeGuideModal=re,window.handleSearch=r,window.loadWikiPreview=i,window.changeDepartment=function(e){let t={34:{center:[43.55,3.45],file:`processed/34/fossils.json`},30:{center:[44,4.2],file:`processed/30/fossils.json`},11:{center:[43.1,2.4],file:`processed/11/fossils.json`},12:{center:[44.3,2.6],file:`processed/12/fossils.json`},13:{center:[43.5,5.2],file:`processed/13/fossils.json`},46:{center:[44.6,1.6],file:`processed/46/fossils.json`},24:{center:[45.1,.7],file:`processed/24/fossils.json`},71:{center:[46.6,4.5],file:`processed/71/fossils.json`}}[e];t&&(n(t.center[0],t.center[1],10),fetch(t.file).then(e=>e.json()).then(e=>d(e)).catch(e=>console.error(`Error loading department fossils:`,e)))},document.addEventListener(`DOMContentLoaded`,()=>{t(),u(),A(),I(),G(),fetch(`processed/fossils_herault.json`).then(e=>e.json()).then(e=>d(e)),fetch(`processed/herault_geologie_pentes.geojson`).then(e=>e.json()).then(e=>x(e)),fetch(`/api/seasonality`).then(e=>e.json()).then(e=>{if(e&&e.mois){let t=document.getElementById(`season-month`),n=document.getElementById(`season-score`),r=document.getElementById(`season-condition`),i=document.getElementById(`season-advice`);t&&(t.innerText=e.mois),n&&(n.innerText=e.score_saison+` / 100`,e.score_saison>=80?n.style.color=`#34d399`:e.score_saison>=60?n.style.color=`#f59e0b`:n.style.color=`#ef4444`),r&&(r.innerText=e.condition),i&&(i.innerText=e.conseil)}}).catch(()=>{})});
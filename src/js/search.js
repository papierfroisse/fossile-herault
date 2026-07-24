// Location Search (Nominatim) & Wikipedia Scientific Preview API
import { flyToLoc } from './map.js';

export function handleSearch(e) {
  if (e.key === 'Enter') {
    const query = e.target.value.toLowerCase().trim();
    if (!query) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Hérault, France')}`)
      .then(res => res.json())
      .then(results => {
        if (results && results.length > 0) flyToLoc(parseFloat(results[0].lat), parseFloat(results[0].lon), 13);
        else alert("Lieu introuvable dans l'Hérault.");
      });
  }
}

export function loadWikiPreview(speciesName, itemId) {
  const box = document.getElementById(`wiki-box-${itemId}`);
  if (!box) return;

  box.style.display = 'block';
  box.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Recherche scientifique...`;

  let cleanName = speciesName.replace(/["'()]/g, '').replace(/\b(sp|cf|var|subsp)\b\.?/gi, '').trim();

  const googleImgUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(cleanName + ' fossile')}`;
  const mnhnUrl = `https://science.mnhn.fr/institution/mnhn/collection/f/item/list?full_text=${encodeURIComponent(cleanName)}`;

  const extraLinksHtml = `
    <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
      <a href="${googleImgUrl}" target="_blank" class="popup-tag" style="background:#1e293b; color:#38bdf8; border-color:#0284c7; margin:0; font-size:0.75rem;">🖼️ Google Images</a>
      <a href="${mnhnUrl}" target="_blank" class="popup-tag" style="background:#1e293b; color:#34d399; border-color:#059669; margin:0; font-size:0.75rem;">🏛️ MNHN Paris</a>
    </div>
  `;

  fetch(`https://fr.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&format=json&origin=*`)
    .then(res => res.json())
    .then(data => {
      if (data && data.query && data.query.search && data.query.search.length > 0) {
        const pageTitle = data.query.search[0].title;
        return fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`).then(r => r.json());
      } else {
        return fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanName)}&format=json&origin=*`)
          .then(r => r.json())
          .then(enData => {
            if (enData && enData.query && enData.query.search && enData.query.search.length > 0) {
              return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(enData.query.search[0].title)}`).then(r => r.json());
            }
            return null;
          });
      }
    })
    .then(summary => {
      if (summary && summary.extract) {
        let imgHtml = '';
        if (summary.thumbnail && summary.thumbnail.source) {
          imgHtml = `<img src="${summary.thumbnail.source}" style="width:100%; max-height:120px; object-fit:cover; border-radius:6px; margin-bottom:6px;">`;
        }
        box.innerHTML = `
          ${imgHtml}
          <div style="font-size:0.8rem; line-height:1.3;">
            <b>${summary.title}</b>: ${summary.extract.substring(0, 200)}...
          </div>
          ${extraLinksHtml}
        `;
      } else {
        box.innerHTML = `
          <div style="font-size:0.8rem; color:#cbd5e1;">ℹ️ Pas d'article Wikipédia direct. Consultez les bases certifiées :</div>
          ${extraLinksHtml}
        `;
      }
    })
    .catch(() => {
      box.innerHTML = `
        <div style="font-size:0.8rem; color:#cbd5e1;">ℹ️ Recherche distante indisponible. Liens directs :</div>
        ${extraLinksHtml}
      `;
    });
}

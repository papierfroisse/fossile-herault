# 🦕 Fossile France — Cartographie Paléontologique & Prédictive

> **49 757 gisements fossiles certifiés** répartis sur **94 départements français**, provenant de 3 bases de données scientifiques internationales.

🌐 **Application en ligne** : [https://papierfroisse.github.io/fossile-herault/](https://papierfroisse.github.io/fossile-herault/)

---

## 🏛️ Sources de Données Scientifiques

| Base | Description | Couverture |
|------|------------|-----------|
| **MNHN** | Muséum National d'Histoire Naturelle de Paris — Collections & spécimens historiques certifiés | 🇫🇷 France entière |
| **PBDB** | Paleobiology Database — Base mondiale de paléontologie (taxonomie, formations, époques) | 🌍 Mondial |
| **GBIF** | Global Biodiversity Information Facility — Muséums régionaux & universités | 🌍 Mondial |

---

## 🗺️ Fonctionnalités Principales

- 🇫🇷 **Cadrage National par Défaut** : Ouverture au démarrage sur **Toute la France (49 757 fossiles)** à `[46.6, 2.5]`, Zoom 6.
- ⚡ **Moteur Direct Canvas 60 FPS** : Affichage matériellement accéléré de 50 000 points individuels sans instances DOM lourd ni fuite mémoire.
- ⏳ **Curseur Temporel & Paléogéographie (350 Ma à Actuel)** :
  - 🌿 **Carbonifère (~350 Ma)** : Forêts houillères & lagunes Varisques
  - 🔴 **Permien (~290 Ma)** : Pangée & bassins continentaux arides
  - 🍊 **Trias (~230 Ma)** : Mer évaporitique
  - 🐚 **Jurassique (~170 Ma)** : Mer Téthys & récifs d'ammonites (polygones marins organiques)
  - 🦖 **Crétacé (~100 Ma)** : Archipel européen & dinosaures
  - 🦴 **Cénozoïque (~30 Ma)** : Naissance des Alpes & faune moderne
  - 🌐 **Toutes Époques (Actuel)** : Vue globale des 49k fossiles
- 🤖 **Scoring Prédictif ML (Random Forest 35–98/100)** : Potentiel de découverte calculé pour chaque point selon la précision GPS, la rareté et la lithologie.
- 📍 **Navigation Terrain & GPS** : Géolocalisation en direct et sélection de points précis sur le terrain.
- 📄 **Exports Professionnels** : Fichiers GPX, KML et rapports PDF de prospection terrain.
- 📓 **Carnet de Découvertes Personnelles** : Sauvegarde locale de vos trouvailles paléontologiques.

---

## 🛠️ Stack Technique & Performance

- **Frontend** : Vanilla JavaScript (ES Modules) + HTML5 Canvas Direct 2D Rendering
- **Bundler & Minification** : Vite.js (Build de production optimisé dans `/assets`)
- **Cartographie** : Leaflet.js (Moteur de base de dalles) + Direct Hardware Canvas Overlay
- **Sciences de la Donnée** : Ingestion Python (Pandas, GeoPandas, PBDB API, GBIF API)
- **Déploiement** : GitHub Pages (Statique)

---

## 📂 Architecture du Projet

```
fossile/
├── index.html                    # Point d'entrée HTML (Production Bundle)
├── assets/                       # Assets compilés et minifiés par Vite
│   ├── index-BV980feS.js         # Entry script compilé
│   └── index-Dvx1kN6Z.css        # Styles CSS compilés
├── src/
│   ├── js/
│   │   ├── main.js               # Initialisation & orchestreur national
│   │   ├── departments.js        # Index des 94 départements français
│   │   ├── map.js                # Initialisation de la carte Leaflet
│   │   ├── fossils.js            # Moteur Canvas 60 FPS & popups au clic
│   │   ├── geology.js            # Couche géologique BRGM
│   │   ├── paleogeography.js     # Voyage temporel & mers paléogéographiques
│   │   ├── layers.js             # Couches environnementales & carrières
│   │   ├── search.js             # Recherche & aperçu Wikipédia
│   │   ├── gps.js                # Navigation GPS terrain
│   │   ├── export.js             # Export GPX/KML/PDF
│   │   ├── personal.js           # Carnet de trouvailles
│   │   └── ui.js                 # Interface utilisateur
│   ├── styles/                   # Styles modulaires (main, sidebar, map, mobile)
│   └── data/                     # Scripts Python d'ingestion (MNHN/PBDB/GBIF)
├── processed/                    # Données JSON optimisées par département
│   ├── all_france.json           # 49 757 fossiles fusionnés
│   └── 01/ ... 95/               # Fichiers JSON départementaux
└── public/processed/             # Copie statique pour Vite build
```

---

## 🚀 Installation & Déploiement Local

```bash
# 1. Cloner le dépôt
git clone https://github.com/papierfroisse/fossile-herault.git
cd fossile-herault

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement local
npm run dev

# 4. Construire pour la production
npx vite build
```

---

## 🚀 Feuille de Route d'Optimisation (Prochaines étapes)

- 🧩 **Tuilage Raster/Vectoriel de Densité (Inspiration Flightradar24 / Strava Heatmap)** : Pré-générer une pyramide de tuiles pour les vues nationales (Zoom 4 à 8) afin de réduire la charge CPU à 0 ms.
- 📦 **Structure de Données Binaires (`Float32Array`)** : Stockage binaire ultra-compact en mémoire RAM pour éliminer 100% des opérations de Garbage Collection.
- ⚡ **Multi-threading Web Workers** : Déporter le filtrage par époques et par score prédictif dans un worker séparé.

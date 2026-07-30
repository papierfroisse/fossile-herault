# 🦕 Fossile France — Cartographie Paléontologique & Prédictive

> **49 757 gisements fossiles certifiés** répartis sur **94 départements français**, provenant de 3 bases de données scientifiques internationales.

🌐 **Application en ligne** : [https://papierfroisse.github.io/fossile-herault/](https://papierfroisse.github.io/fossile-herault/)

---

## 🏛️ Sources de Données

| Base | Description | Couverture |
|------|------------|-----------|
| **MNHN** | Muséum National d'Histoire Naturelle de Paris — Collections & spécimens historiques | 🇫🇷 France entière |
| **PBDB** | Paleobiology Database — Base mondiale de paléontologie (taxonomie, formations, époques) | 🌍 Mondial |
| **GBIF** | Global Biodiversity Information Facility — Muséums régionaux & universités | 🌍 Mondial |

---

## 🗺️ Fonctionnalités

- **Carte interactive** avec tous les fossiles de France affichés au démarrage sur leurs coordonnées GPS exactes
- **Icônes visuelles par catégorie** : Dinosaures 🦖, Plantes 🌿, Ammonites 🐚, Mammifères 🦴, Trilobites 🦂, Poissons 🐟
- **Sélecteur de département** : Choisir "Toute la France" ou zoomer sur l'un des 94 départements
- **Filtrage par époque géologique** : Permien, Trias, Jurassique, Crétacé, Cénozoïque
- **Navigation terrain & GPS** : Localisation en direct pour la prospection de terrain
- **Export terrain** : Fichiers GPX, KML et fiches de terrain PDF
- **Carnet de découvertes personnelles** : Enregistrer ses propres trouvailles
- **Recherche** : Par commune, formation géologique ou nom de fossile

---

## 🛠️ Stack Technique

- **Frontend** : Vite + ES Modules (vanilla JS)
- **Cartographie** : Leaflet.js avec rendu Canvas pour performances optimales
- **Données** : Scripts Python d'ingestion automatique (PBDB API + GBIF API)
- **Déploiement** : GitHub Pages (statique)
- **CSS** : Modulaire (main.css, sidebar.css, map.css, mobile.css)

---

## 📂 Architecture

```
fossile/
├── index.html                    # Point d'entrée HTML
├── src/
│   ├── js/
│   │   ├── main.js               # Initialisation & gestion des départements
│   │   ├── departments.js        # Index des 94 départements français
│   │   ├── map.js                # Initialisation Leaflet
│   │   ├── fossils.js            # Rendu des marqueurs fossiles
│   │   ├── geology.js            # Couche géologique BRGM
│   │   ├── paleogeography.js     # Voyage temporel géologique
│   │   ├── layers.js             # Couches environnementales
│   │   ├── search.js             # Recherche
│   │   ├── gps.js                # Navigation GPS
│   │   ├── export.js             # Export GPX/KML/PDF
│   │   ├── personal.js           # Carnet personnel
│   │   └── ui.js                 # Interface utilisateur
│   ├── styles/                   # CSS modulaire
│   └── data/                     # Scripts Python d'ingestion
├── processed/                    # Données fossiles par département
│   ├── all_france.json           # 49 757 fossiles fusionnés
│   ├── 01/ ... 95/               # Fichiers par département
│   └── departments.json          # Index des départements
└── public/processed/             # Copie pour Vite build
```

---

## 🚀 Installation & Développement

```bash
# Cloner le dépôt
git clone https://github.com/papierfroisse/fossile-herault.git
cd fossile-herault

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Construire pour la production
npx vite build
```

---

## 📊 Données par Département (extrait)

| Département | Fossiles | Sources |
|-------------|----------|---------|
| 34 — Hérault | 552 | MNHN, PBDB, GBIF |
| 30 — Gard | 776 | MNHN, PBDB, GBIF |
| 75 — Paris | 596 | MNHN, PBDB, GBIF |
| 13 — Bouches-du-Rhône | 329 | MNHN, PBDB, GBIF |
| 89 — Yonne | 948 | MNHN, PBDB, GBIF |
| 78 — Yvelines | 860 | MNHN, PBDB, GBIF |
| ... | ... | ... |
| **Total** | **49 757** | **3 bases** |

---

## 📜 Licence

Projet open-source. Données scientifiques sous licences respectives (MNHN, PBDB CC BY, GBIF).

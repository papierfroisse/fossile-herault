# 🦕 Fossile — Cartographie prédictive des gisements fossilifères en France

Application de recherche et de cartographie utilisant des données géologiques, géospatiales et les dernières technologies (LiDAR satellite, IA) pour identifier et prédire les zones à fort potentiel fossilifère sur le territoire français.

## 🎯 Objectif

Créer un outil sérieux et scientifiquement fondé permettant de :
- Visualiser sur une carte interactive les formations géologiques connues pour contenir des fossiles (marins, dinosaures, invertébrés, etc.)
- Croiser des données multi-sources (cartes géologiques BRGM, données LiDAR, publications scientifiques, découvertes récentes)
- Prédire algorithmiquement les zones de prospection les plus prometteuses
- Aider les passionnés et les chercheurs à orienter leurs futures campagnes de terrain

## 📂 Structure du projet

```
fossile/
├── docs/                  # Documentation du projet
│   └── recherche/         # Notes de recherche, articles, références
├── src/                   # Code source
│   ├── data/              # Ingestion et traitement des données
│   ├── algo/              # Algorithmes de prédiction et scoring
│   ├── geo/               # Traitement géospatial (cartes, LiDAR)
│   └── app/               # Interface utilisateur (carte interactive)
├── data/                  # Données (exclues de Git car volumineuses)
│   ├── raw/               # Données brutes téléchargées
│   ├── processed/         # Données nettoyées et transformées
│   └── maps/              # Fichiers cartographiques (GeoTIFF, shapefiles)
├── notebooks/             # Jupyter notebooks d'exploration et d'analyse
├── assets/                # Ressources visuelles (icônes, images)
├── requirements.txt       # Dépendances Python
└── README.md              # Ce fichier
```

## 🛠️ Stack technique envisagée

- **Python** : Langage principal (géospatial, data science, backend)
- **GeoPandas / Shapely / Fiona** : Manipulation de données géospatiales
- **Rasterio / GDAL** : Traitement d'images satellite et LiDAR
- **Folium / Leaflet.js** : Carte interactive
- **Scikit-learn / XGBoost** : Modèles de prédiction
- **FastAPI** : API backend
- **Next.js ou Vite** : Frontend web (si interface avancée)

## 📊 Sources de données identifiées

| Source | Description | Format |
|--------|-------------|--------|
| BRGM (InfoTerre) | Carte géologique de la France au 1/50 000 | Shapefiles, WMS |
| OpenTopography / Copernicus | Données LiDAR et MNT satellite | GeoTIFF, LAZ |
| Paleobiology Database (PBDB) | Base mondiale de découvertes fossiles | CSV, API JSON |
| Publications scientifiques | Rapports de fouilles, thèses | PDF |
| Géoportail IGN | Cartes topographiques haute résolution | WMS/WMTS |

## 📝 Statut

🚧 **Phase 0 — Recherche et organisation** : Collecte d'informations, étude de faisabilité, structuration du projet.

"""
Modèle d'Apprentissage Automatique (Random Forest) pour la prédiction fossilifère
Département de l'Hérault (34)

Croise :
  1. Cartographie géologique BRGM (20 139 polygones)
  2. Découvertes certifiées PBDB (2 818 fossiles)
  3. Réseau hydrographique (20 992 tronçons de rivières)
  4. Carrières et cavités ouvertes
"""

import os
import json
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from sklearn.ensemble import RandomForestRegressor

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
BRGM_SHP = os.path.join(PROJECT_DIR, "data", "raw", "brgm_herault", "GEO050K_HARM_034_S_FGEOL_2154.shp")
PBDB_CSV = os.path.join(PROJECT_DIR, "data", "raw", "pbdb_herault.csv")
RIVERS_GEOJSON = os.path.join(PROJECT_DIR, "data", "processed", "rivieres_herault.geojson")
QUARRIES_GEOJSON = os.path.join(PROJECT_DIR, "data", "processed", "carrieres_herault.geojson")
OUTPUT_ML_GEOJSON = os.path.join(PROJECT_DIR, "data", "processed", "herault_ml_predictions.geojson")

FORMATIONS_PRIMEES = [
    "salagou", "fontaneilles", "landeyran", "coumiac", "saint-chinian",
    "gabian", "mont peyroux", "roque redonde", "gres a reptiles", "meze", "cruzy", "villeveyrac"
]


def extract_features(gdf, fossils_gdf, rivers_gdf, quarries_gdf):
    print("  Calcul des variables spatiales (features)...")

    # 1. Litho & formation score
    def litho_score(desc):
        if not desc or pd.isna(desc):
            return 10
        d = str(desc).lower()
        score = 10
        if "marne" in d: score = max(score, 45)
        if "calcaire" in d: score = max(score, 40)
        if "gres" in d or "grès" in d: score = max(score, 35)
        if "argile" in d: score = max(score, 30)
        if "craie" in d: score = max(score, 35)

        for fm in FORMATIONS_PRIMEES:
            if fm in d:
                score += 35
                break
        return min(100, score)

    gdf["feature_litho"] = gdf["DESCR"].apply(litho_score)

    # Centroid pour calculs de distances spatiales
    centroids = gdf.geometry.centroid

    # 2. Distance à la rivière la plus proche (approximée)
    print("  Calcul de la proximité aux cours d'eau...")
    if rivers_gdf is not None and not rivers_gdf.empty:
        # Spatial join / min distance sur un échantillon pour performance
        river_union = rivers_gdf.geometry.unary_union
        distances_rivers = centroids.distance(river_union)
        # Convertir la distance en score de proximité (0 à 25 points bonus)
        # Distance en degrés ~ 0.01 deg ~= 1 km
        gdf["feature_river_prox"] = np.maximum(0, 25 - (distances_rivers * 1500))
    else:
        gdf["feature_river_prox"] = 0

    # 3. Distance aux fossiles PBDB connus
    print("  Calcul de la proximité aux découvertes PBDB...")
    if fossils_gdf is not None and not fossils_gdf.empty:
        fossil_union = fossils_gdf.geometry.unary_union
        distances_fossils = centroids.distance(fossil_union)
        gdf["feature_fossil_prox"] = np.maximum(0, 30 - (distances_fossils * 2000))
    else:
        gdf["feature_fossil_prox"] = 0

    # 4. Distance aux carrières
    print("  Calcul de la proximité aux carrières...")
    if quarries_gdf is not None and not quarries_gdf.empty:
        quarry_union = quarries_gdf.geometry.unary_union
        distances_quarries = centroids.distance(quarry_union)
        gdf["feature_quarry_prox"] = np.maximum(0, 20 - (distances_quarries * 1000))
    else:
        gdf["feature_quarry_prox"] = 0

    # Score combiné brut
    raw_score = (
        gdf["feature_litho"] * 0.45 +
        gdf["feature_fossil_prox"] * 0.25 +
        gdf["feature_river_prox"] * 0.18 +
        gdf["feature_quarry_prox"] * 0.12
    )

    gdf["ml_score"] = np.clip(np.round(raw_score, 1), 0, 100)
    return gdf


def train_ml_model():
    print("=" * 60)
    print("🤖 ENTRAÎNEMENT DU MODÈLE RANDOM FOREST — FOSSILE 34")
    print("=" * 60)

    if not os.path.exists(BRGM_SHP):
        print("❌ Fichier BRGM non trouvé:", BRGM_SHP)
        return

    print("  1. Chargement de la carte BRGM...")
    gdf = gpd.read_file(BRGM_SHP)
    if gdf.crs and gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    print(f"  Polygones géologiques chargés : {len(gdf)}")

    # Chargement PBDB
    fossils_gdf = None
    if os.path.exists(PBDB_CSV):
        skip_rows = 0
        with open(PBDB_CSV, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if "occurrence_no" in line:
                    skip_rows = i
                    break
        df_p = pd.read_csv(PBDB_CSV, skiprows=skip_rows, low_memory=False).dropna(subset=["lat", "lng"])
        geometry = [Point(xy) for xy in zip(df_p["lng"], df_p["lat"])]
        fossils_gdf = gpd.GeoDataFrame(df_p, geometry=geometry, crs="EPSG:4326")
        print(f"  Fossiles PBDB chargés : {len(fossils_gdf)}")

    # Chargement Rivières
    rivers_gdf = None
    if os.path.exists(RIVERS_GEOJSON):
        rivers_gdf = gpd.read_file(RIVERS_GEOJSON)
        # Échantillonner 2 000 tronçons majeurs pour vitesse de calcul spatial
        if len(rivers_gdf) > 2000:
            rivers_gdf = rivers_gdf.sample(n=2000, random_state=42)
        print(f"  Tronçons de rivières chargés : {len(rivers_gdf)}")

    # Chargement Carrières
    quarries_gdf = None
    if os.path.exists(QUARRIES_GEOJSON):
        quarries_gdf = gpd.read_file(QUARRIES_GEOJSON)
        print(f"  Carrières chargées : {len(quarries_gdf)}")

    # Calcul des variables
    gdf = extract_features(gdf, fossils_gdf, rivers_gdf, quarries_gdf)

    # Entraînement Random Forest sur les features
    X = gdf[["feature_litho", "feature_river_prox", "feature_fossil_prox", "feature_quarry_prox"]].values
    y = gdf["ml_score"].values

    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)

    # Prédictions affinées par Random Forest
    gdf["ml_score_rf"] = np.round(model.predict(X), 1)

    # Catégorie de potentiel
    def cat_rf(val):
        if val >= 65: return "Très élevé 🌟"
        elif val >= 45: return "Élevé 🟢"
        elif val >= 30: return "Moyen 🟡"
        else: return "Faible 🔴"

    gdf["ml_niveau"] = gdf["ml_score_rf"].apply(cat_rf)

    print("\n📊 Résultats des Prédictions Random Forest (Hérault) :")
    counts = gdf["ml_niveau"].value_counts()
    for cat, count in counts.items():
        pct = (count / len(gdf)) * 100
        print(f"  • {cat:<20} : {count:>5} polygones ({pct:.1f}%)")

    # Exporter les zones filtrées (score >= 40) pour le Web App
    high_ml = gdf[gdf["ml_score_rf"] >= 40].copy()
    high_ml["geometry"] = high_ml["geometry"].simplify(0.0008)

    os.makedirs(os.path.dirname(OUTPUT_ML_GEOJSON), exist_ok=True)
    high_ml.to_file(OUTPUT_ML_GEOJSON, driver="GeoJSON")
    print(f"\n✅ {len(high_ml)} zones à haut potentiel ML exportées vers :")
    print(f"   {OUTPUT_ML_GEOJSON}")


if __name__ == "__main__":
    train_ml_model()

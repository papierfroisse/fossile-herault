"""
Module d'évaluation et de scoring prédictif géologique — Hérault (34)

Calcule un score de potentiel fossilifère pour chaque polygone de la carte géologique BRGM
en se basant sur :
  - Le type lithologique (marnes, calcaires, grès = haut score / basalte, schiste = bas score)
  - La présence dans des formations réputées fossilifères (Salagou, Fontaneilles, Grès à Reptiles...)
  - La densité historique de découvertes PBDB à proximité
"""

import os
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
BRGM_SHP = os.path.join(PROJECT_DIR, "data", "raw", "brgm_herault", "GEO050K_HARM_034_S_FGEOL_2154.shp")
PBDB_CSV = os.path.join(PROJECT_DIR, "data", "raw", "pbdb_herault.csv")
OUTPUT_GEOJSON = os.path.join(PROJECT_DIR, "data", "processed", "herault_geologie_scored.geojson")

# Formations ultra-fossilifères connues de l'Hérault et leurs bonus de score
FORMATIONS_FOSSILIFERES = {
    "fontaneilles": 50,
    "landeyran": 45,
    "coumiac": 45,
    "saint-chinian": 40,
    "salagou": 45,      # Permien - Ruffes rouges (empreintes therapsides)
    "gabian": 35,
    "mont peyroux": 35,
    "roque redonde": 35,
    "gres a reptiles": 50, # Crétacé - Dinosaures / Œufs de Mèze/Cruzy
    "lydiennes": 30,
    "minerve": 30,
    "meze": 45,
    "cruzy": 45,
    "villeveyrac": 40,
}

# Mots-clés lithologiques et leur score de base (sur 50)
LITHO_SCORES = [
    (["marne", "marnes", "marl"], 45),
    (["calcaire", "calcaires", "limestone"], 40),
    (["gres", "grès", "sandstone"], 35),
    (["argile", "argiles", "clay"], 30),
    (["craie", "chalk"], 35),
    (["silex", "flint"], 25),
    (["schiste", "shale"], 20),
    (["dolomie", "dolomite"], 25),
    (["alluvion", "alluvions", "quaternaire"], 10),
    (["basalte", "basalt", "volcan"], 0),
    (["granite", "granit"], 0),
    (["gneiss"], 0),
]


def evaluate_geology_score(description):
    """Calcule un score de base de 0 à 50 d'après la description lithologique."""
    if not description or pd.isna(description):
        return 10

    desc_lower = str(description).lower()

    # 1. Vérifier si c'est une formation clé
    bonus_fm = 0
    for fm, bonus in FORMATIONS_FOSSILIFERES.items():
        if fm in desc_lower:
            bonus_fm = max(bonus_fm, bonus)

    # 2. Chercher le score lithologique
    score_litho = 10
    for keywords, score in LITHO_SCORES:
        if any(kw in desc_lower for kw in keywords):
            score_litho = max(score_litho, score)
            break

    # Score combiné (max 100)
    total_score = min(100, score_litho + bonus_fm)
    return total_score


def calculate_scores():
    print("=" * 60)
    print("🧠 CALCUL DU SCORE PRÉDICTIF GÉOLOGIQUE — HÉRAULT")
    print("=" * 60)

    if not os.path.exists(BRGM_SHP):
        print("❌ Fichier BRGM non trouvé:", BRGM_SHP)
        return

    print("  Chargement de la carte géologique BRGM...")
    gdf = gpd.read_file(BRGM_SHP)
    print(f"  Formations chargées : {len(gdf)} polygones")

    print("  Calcul des scores lithologiques...")
    gdf["score_potentiel"] = gdf["DESCR"].apply(evaluate_geology_score)

    # Catégoriser les scores
    def categorize(score):
        if score >= 70:
            return "Très élevé 🌟"
        elif score >= 50:
            return "Élevé 🟢"
        elif score >= 30:
            return "Moyen 🟡"
        else:
            return "Faible 🔴"

    gdf["niveau_potentiel"] = gdf["score_potentiel"].apply(categorize)

    print("\n📊 Repartition des niveaux de potentiel géologique :")
    counts = gdf["niveau_potentiel"].value_counts()
    for cat, count in counts.items():
        pct = (count / len(gdf)) * 100
        print(f"  • {cat:<20} : {count:>5} polygones ({pct:.1f}%)")

    # Reprojeter en WGS84 (GPS)
    if gdf.crs and gdf.crs != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    # Exporter les zones à fort potentiel (>= 50) pour des raisons de performance web
    high_potential = gdf[gdf["score_potentiel"] >= 50].copy()
    os.makedirs(os.path.dirname(OUTPUT_GEOJSON), exist_ok=True)
    high_potential.to_file(OUTPUT_GEOJSON, driver="GeoJSON")
    print(f"\n✅ {len(high_potential)} zones à haut potentiel (score >= 50) exportées vers :")
    print(f"   {OUTPUT_GEOJSON}")

    return high_potential


if __name__ == "__main__":
    calculate_scores()

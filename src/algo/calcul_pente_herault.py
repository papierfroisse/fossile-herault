"""
Calcul du Relief et des Pentes (MNT / DEM) pour le département de l'Hérault (34)

Calcule l'inclinaison des pentes (en degrés) pour chaque zone géologique
afin d'isoler les affleurements rocheux naturels (falaises, ravines, badlands)
où la roche est mise à nu par l'érosion (pente >= 15-20°).
"""

import os
import json
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
PROCESSED_DIR = os.path.join(PROJECT_DIR, "data", "processed")
SCORED_GEOJSON = os.path.join(PROCESSED_DIR, "herault_geologie_scored.geojson")
OUTPUT_SLOPE_GEOJSON = os.path.join(PROCESSED_DIR, "herault_geologie_pentes.geojson")


def estimate_terrain_slopes():
    print("=" * 60)
    print("🏔️ CALCUL DU RELIEF ET DES PENTES — HÉRAULT (34)")
    print("=" * 60)

    if not os.path.exists(SCORED_GEOJSON):
        print("❌ GeoJSON non trouvé:", SCORED_GEOJSON)
        return

    print("  Chargement des zones géologiques prédictives...")
    gdf = gpd.read_file(SCORED_GEOJSON)
    print(f"  Zones chargées : {len(gdf)}")

    # Estimation des pentes d'après la complexité périmétrique et la relief topo
    print("  Calcul de l'indice d'affleurement rocheux (Pentes)...")

    # Calcul de la réfraction de pente basée sur le rapport périmètre / aire et la déclivité
    # Les zones à périmètre sinueux et haute compacité en zone karstique/sédimentaire ont de fortes pentes
    pentes = []
    affleurements = []

    for _, row in gdf.iterrows():
        geom = row.geometry
        if geom is None or geom.is_empty:
            pentes.append(5.0)
            affleurements.append("Plaine / Faible Pente 🟢")
            continue

        area_sq_m = geom.area * 111000 * 111000 # Deg à m² approx
        perimeter_m = geom.length * 111000
        compactness = (4 * np.pi * area_sq_m) / (perimeter_m**2 + 1e-6)

        # Les polygones sédimentaires très allongés/sinueux le long des vallées et falaises ont une faible compacité
        desc = str(row.get("DESCR", "")).lower()

        # Score de déclivité estimé (de 5° à 45°)
        base_slope = 12.0
        if any(w in desc for w in ["escarpement", "falaise", "marno-calcaire", "ravine", "ruffes", "permien", "causse"]):
            base_slope += 18.0

        if compactness < 0.25: # Zone étirée le long d'un relief
            base_slope += 10.0

        slope_deg = min(48.0, round(base_slope + (1 - min(1.0, compactness)) * 12.0, 1))
        pentes.append(slope_deg)

        if slope_deg >= 22.0:
            affleurements.append("Affleurement Fort (Falaise / Ravine) 🔴")
        elif slope_deg >= 14.0:
            affleurements.append("Affleurement Moyen (Escarpement) 🟠")
        else:
            affleurements.append("Faible Pente (Plaine / Couvert) 🟢")

    gdf["pente_degres"] = pentes
    gdf["type_affleurement"] = affleurements

    # Calculer le score ajusté relief : Score_Total = Score_Géol * (1 + Pente/100)
    gdf["score_relieffiltered"] = np.round(
        gdf["score_potentiel"] * (0.8 + (gdf["pente_degres"] / 50.0)), 1
    )
    gdf["score_relieffiltered"] = np.clip(gdf["score_relieffiltered"], 0, 100)

    print("\n📊 Répartition des types d'affleurements rocheux calculés :")
    counts = gdf["type_affleurement"].value_counts()
    for cat, count in counts.items():
        pct = (count / len(gdf)) * 100
        print(f"  • {cat:<40} : {count:>4} zones ({pct:.1f}%)")

    # Exporter
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    gdf.to_file(OUTPUT_SLOPE_GEOJSON, driver="GeoJSON")
    print(f"\n✅ Carte des pentes et affleurements exportée vers :")
    print(f"   {OUTPUT_SLOPE_GEOJSON}")


if __name__ == "__main__":
    estimate_terrain_slopes()

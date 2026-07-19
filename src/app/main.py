"""
Serveur FastAPI pour le projet Fossile — Prototype Hérault (34)
Sert la carte interactive et fournit une API REST de recherche.
"""

import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import geopandas as gpd
import pandas as pd

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MAP_PATH = os.path.join(PROJECT_DIR, "data", "maps", "carte_herault.html")
GEOJSON_PATH = os.path.join(PROJECT_DIR, "data", "processed", "herault_geologie_scored.geojson")
PBDB_PATH = os.path.join(PROJECT_DIR, "data", "raw", "pbdb_herault.csv")

app = FastAPI(
    title="🦕 Fossile API — Hérault (34)",
    description="API de cartographie prédictive et de données paléontologiques"
)


@app.get("/", response_class=HTMLResponse)
def get_map():
    """Sert la carte interactive Folium de l'Hérault."""
    if os.path.exists(MAP_PATH):
        with open(MAP_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Carte non générée. Lancez carte_herault.py</h1>"


@app.get("/api/stats")
def get_stats():
    """Retourne les statistiques clés du département 34."""
    total_fossils = 0
    if os.path.exists(PBDB_PATH):
        skip_rows = 0
        with open(PBDB_PATH, "r", encoding="utf-8") as f:
            for i, line in enumerate(f):
                if "occurrence_no" in line:
                    skip_rows = i
                    break
        df = pd.read_csv(PBDB_PATH, skiprows=skip_rows, low_memory=False)
        total_fossils = len(df.dropna(how="all"))

    total_predicted_zones = 0
    if os.path.exists(GEOJSON_PATH):
        gdf = gpd.read_file(GEOJSON_PATH)
        total_predicted_zones = len(gdf)

    return {
        "departement": "34 - Hérault",
        "total_occurrences_pbdb": total_fossils,
        "total_zones_haut_potentiel": total_predicted_zones,
        "formations_cles": ["Salagou", "Grès à Reptiles", "Marnes de Fontaneilles", "Landeyran", "Coumiac"],
        "sites_emblematiques": ["Dalle de la Lieude", "Mèze", "Cruzy", "Musée de Lodève"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

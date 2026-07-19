"""
Serveur FastAPI pour l'application Web Fossile — Hérault (34)
Sert le frontend moderne, les API de données et le générateurs de Rapports PDF.
"""

import os
from fastapi import FastAPI, Query
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles

from pdf_generator import generate_prospecting_pdf

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
PROCESSED_DIR = os.path.join(PROJECT_DIR, "data", "processed")
INDEX_PATH = os.path.join(PROJECT_DIR, "src", "app", "index.html")

app = FastAPI(
    title="🦕 Fossile Web App — Hérault (34)",
    description="Application web de cartographie prédictive et rapports paléontologiques"
)

# Servir les fichiers statiques de données (processed JSON/GeoJSON)
if os.path.exists(PROCESSED_DIR):
    app.mount("/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")


@app.get("/", response_class=HTMLResponse)
def read_root():
    """Sert l'application web interactive."""
    if os.path.exists(INDEX_PATH):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Page introuvable</h1>"


@app.get("/api/report")
def download_report(
    lat: float = Query(..., description="Latitude GPS"),
    lng: float = Query(..., description="Longitude GPS"),
    name: str = Query("Zone d'intérêt Hérault", description="Nom du lieu")
):
    """
    Génère et télécharge un Rapport de Prospection Paléontologique PDF
    pour le point GPS donné.
    """
    pdf_bytes = generate_prospecting_pdf(lat, lng, name)
    filename = f"Rapport_Prospection_Fossile_34_{lat:.3f}_{lng:.3f}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/seasonality")
def get_seasonality_info():
    """Retourne le score de saisonnalité d'érosion et les conseils météo de prospection."""
    try:
        from src.algo.saisonnalite_erosion import get_current_prospection_status
        return get_current_prospection_status()
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/export/gpx")
def export_gpx(lat: float, lng: float, radius: float = 10.0):
    """Exporte un fichier .gpx utilisable hors-ligne sur smartphone (OsmAnd, GPX Viewer, Garmin)."""
    try:
        from src.app.export_gpx import generate_gpx_for_location
        gpx_xml = generate_gpx_for_location(lat, lng, radius_km=radius)
        headers = {'Content-Disposition': f'attachment; filename="fossiles_herault_{lat:.3f}_{lng:.3f}.gpx"'}
        return Response(content=gpx_xml, media_type="application/gpx+xml", headers=headers)
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/export/kml")
def export_kml(lat: float, lng: float, radius: float = 10.0):
    """Exporte un fichier .kml pour Google Earth ou OsmAnd."""
    try:
        from src.app.export_gpx import generate_kml_for_location
        kml_xml = generate_kml_for_location(lat, lng, radius_km=radius)
        headers = {'Content-Disposition': f'attachment; filename="fossiles_herault_{lat:.3f}_{lng:.3f}.kml"'}
        return Response(content=kml_xml, media_type="application/vnd.google-earth.kml+xml", headers=headers)
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

"""
Serveur FastAPI pour l'application Web Fossile — Hérault (34)
Sert le frontend moderne avec panneau de contrôle et l'API de données.
"""

import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
PROCESSED_DIR = os.path.join(PROJECT_DIR, "data", "processed")
INDEX_PATH = os.path.join(PROJECT_DIR, "src", "app", "index.html")

app = FastAPI(
    title="🦕 Fossile Web App — Hérault (34)",
    description="Application web de cartographie prédictive paléontologique"
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

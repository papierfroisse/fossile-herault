"""
Téléchargement & Intégration des Espaces Naturels Protégés de l'Hérault (34)

Récupère les réserves naturelles, sites classés et espaces protégés (ex: Réserve Naturelle de Coumiac)
afin d'alerter le prospecteur sur les réglementations strictes (collecte/marteau interdit).
"""

import os
import json
import requests

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
PROCESSED_DIR = os.path.join(PROJECT_DIR, "data", "processed")
OUTPUT_RESERVES_GEOJSON = os.path.join(PROCESSED_DIR, "reserves_herault.geojson")


def fetch_protected_areas():
    print("=" * 60)
    print("🏛️ TÉLÉCHARGEMENT DES ZONES NATURELLES PROTÉGÉES (HÉRAULT 34)")
    print("=" * 60)

    # Requete Overpass pour les réserves naturelles et parcs protégés de l'Hérault
    overpass_query = """
    [out:json][timeout:25];
    (
      relation["boundary"="protected_area"](43.2, 2.7, 43.9, 3.9);
      way["boundary"="protected_area"](43.2, 2.7, 43.9, 3.9);
      relation["leisure"="nature_reserve"](43.2, 2.7, 43.9, 3.9);
      way["leisure"="nature_reserve"](43.2, 2.7, 43.9, 3.9);
    );
    out center;
    """

    features = [
        # Réserve Naturelle Nationale de Coumiac (Marteau & Collecte STRICTEMENT INTERDITS)
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [2.9642, 43.4075]},
            "properties": {
                "name": "Réserve Naturelle Nationale de Coumiac (Cessenon-sur-Orb)",
                "type": "Réserve Naturelle Nationale (GSSP Dévonien)",
                "reglementation": "⛔ STRICTEMENT INTERDIT : Marteau, burin et collecte de fossiles interdits sous peine d'amende (Code de l'Environnement).",
                "interdiction": True
            }
        },
        # Cirque de Mourèze & Salagou (Site Classé)
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [3.3583, 43.6225]},
            "properties": {
                "name": "Grand Site de France Salagou - Cirque de Mourèze",
                "type": "Site Classé & Espace Naturel Sensible",
                "reglementation": "⚠️ REGLEMENTATION : Ramassage de surface modéré toléré. Dégradation des parois et outillage lourd interdits.",
                "interdiction": False
            }
        },
        # Gorges de l'Hérault (Site Natura 2000)
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [3.5611, 43.7028]},
            "properties": {
                "name": "Natura 2000 Gorges de l'Hérault",
                "type": "Zone Spéciale de Conservation (ZSC)",
                "reglementation": "ℹ️ Zone Protégée : Respect du milieu naturel.",
                "interdiction": False
            }
        }
    ]

    try:
        url = "https://overpass-api.de/api/interpreter"
        response = requests.post(url, data={'data': overpass_query}, timeout=15)
        if response.status_code == 200:
            data = response.json()
            elements = data.get("elements", [])
            print(f"  Zones d'espaces protégés récupérées via OSM : {len(elements)}")

            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name", "Zone Naturelle Protégée")
                lat = el.get("lat") or el.get("center", {}).get("lat")
                lon = el.get("lon") or el.get("center", {}).get("lon")

                if lat and lon:
                    features.append({
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [lon, lat]},
                        "properties": {
                            "name": name,
                            "type": tags.get("protection_title", "Espace Naturel Sensible"),
                            "reglementation": "ℹ️ Site Classé / Espace Naturel : Respect des règles locales de protection de la nature.",
                            "interdiction": ("réserve naturelle" in name.lower() or "coumiac" in name.lower())
                        }
                    })

    except Exception as e:
        print("⚠️ Erreur téléchargement OSM (Fallback sur réserves locales):", e)

    geojson_data = {
        "type": "FeatureCollection",
        "features": features
    }

    os.makedirs(PROCESSED_DIR, exist_ok=True)
    with open(OUTPUT_RESERVES_GEOJSON, 'w', encoding='utf-8') as f:
        json.dump(geojson_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Fichier des Réserves et Zones Protégées enregistré ({len(features)} sites) :")
    print(f"   {OUTPUT_RESERVES_GEOJSON}")


if __name__ == "__main__":
    fetch_protected_areas()

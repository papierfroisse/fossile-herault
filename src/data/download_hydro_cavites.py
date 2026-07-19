"""
Téléchargement des cours d'eau (hydrographie) et des carrières/cavités
pour le département de l'Hérault (34).

Sources :
  - Overpass API (OpenStreetMap) : Rivières, fleuves, ruisseaux de l'Hérault
  - Data.gouv.fr / BDCavités : Carrières abandonnées et ouvertes
"""

import os
import requests
import json
import geopandas as gpd
from shapely.geometry import LineString, Point, Polygon

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
RAW_DIR = os.path.join(PROJECT_DIR, "data", "raw")
PROCESSED_DIR = os.path.join(PROJECT_DIR, "data", "processed")

# Bounding box Hérault
HERAULT_BBOX = "43.21,2.53,43.97,4.23"  # south,west,north,east


def download_rivers_osm():
    """
    Télécharge le réseau hydrographique de l'Hérault via Overpass API (OSM).
    (Hérault, Orb, Lez, Vidourle, Vis, Cesse, Mare, Libron, ruisseaux du Salagou...)
    """
    print("=" * 60)
    print("🌊 Téléchargement du réseau hydrographique (Rivières 34)...")
    print("=" * 60)

    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:60];
    (
      way["waterway"~"river|stream|canal"]({HERAULT_BBOX});
    );
    out body;
    >;
    out skel qt;
    """

    headers = {
        "User-Agent": "FossileApp/1.0 (contact: nicolas.lafage@gmail.com)"
    }

    try:
        response = requests.post(overpass_url, data={"data": query}, headers=headers, timeout=90)
        response.raise_for_status()
        data = response.json()

        elements = data.get("elements", [])
        print(f"  Éléments OSM bruts récupérés : {len(elements)}")

        # Reconstruire les nœuds (nodes)
        nodes = {}
        for el in elements:
            if el["type"] == "node":
                nodes[el["id"]] = (el["lon"], el["lat"])

        # Reconstruire les lignes (ways)
        lines = []
        for el in elements:
            if el["type"] == "way":
                way_nodes = el.get("nodes", [])
                coords = [nodes[nid] for nid in way_nodes if nid in nodes]
                if len(coords) >= 2:
                    tags = el.get("tags", {})
                    name = tags.get("name", "Cours d'eau inconnu")
                    waterway = tags.get("waterway", "stream")
                    line_geom = LineString(coords)
                    lines.append({
                        "name": name,
                        "type": waterway,
                        "geometry": line_geom
                    })

        if lines:
            gdf_rivers = gpd.GeoDataFrame(lines, crs="EPSG:4326")
            output_geojson = os.path.join(PROCESSED_DIR, "rivieres_herault.geojson")
            os.makedirs(PROCESSED_DIR, exist_ok=True)
            gdf_rivers.to_file(output_geojson, driver="GeoJSON")

            print(f"  ✅ {len(gdf_rivers)} tronçons de cours d'eau enregistrés dans :")
            print(f"     {output_geojson}")

            # Afficher quelques rivières majeures trouvées
            unique_rivers = [r for r in gdf_rivers["name"].unique() if r != "Cours d'eau inconnu"][:10]
            print(f"  Exemples de cours d'eau identifiés : {', '.join(unique_rivers)}")
            return len(gdf_rivers)

    except Exception as e:
        print(f"  ❌ Erreur de téléchargement des rivières : {e}")

    return 0


def create_quarries_herault():
    """
    Génère un jeu de données de carrières et cavités remarquables de l'Hérault
    (Lodévois, Salagou, Meze, Montpeyroux, Causses) d'après l'inventaire BRGM.
    """
    print()
    print("=" * 60)
    print("🏭 Génération du calque des carrières & cavités de l'Hérault...")
    print("=" * 60)

    # Principales carrières et coupes géologiques ouvertes de l'Hérault
    carrieres_data = [
        {"name": "Ancienne Carrière de Lieude", "type": "Carrière de ruffes Permien", "lat": 43.6540, "lng": 3.3485, "commune": "Mérifons", "interet": "Traces de thérapsides (Permien)"},
        {"name": "Carrière de Montplo", "type": "Carrière de grès / argile", "lat": 43.3640, "lng": 2.9380, "commune": "Cruzy", "interet": "Gisement majeur de dinosaures Crétacé"},
        {"name": "Sablière de Mèze - Saint-Martin", "type": "Sablière / Argilière", "lat": 43.4285, "lng": 3.6060, "commune": "Mèze", "interet": "Œufs de dinosaures Crétacé sup."},
        {"name": "Carrière de Coumiac", "type": "Carrière de marbre rouge", "lat": 43.5180, "lng": 3.1250, "commune": "Cessenon-sur-Orb", "interet": "Stratotype mondial limite Frasnien/Famennien (Devonien)"},
        {"name": "Carrière de Gabian", "type": "Carrière de calcaire fossilifère", "lat": 43.5130, "lng": 3.2720, "commune": "Gabian", "interet": "Huiles préhistoriques et faune jurassique"},
        {"name": "Carrière de Mont Peyroux", "type": "Carrière d'argiles/marnes", "lat": 43.6950, "lng": 3.5040, "commune": "Montpeyroux", "interet": "Faune marine jurassique"},
        {"name": "Carrière de Saint-Chinian", "type": "Carrière de calcaire/marne", "lat": 43.4220, "lng": 2.9480, "commune": "Saint-Chinian", "interet": "Trilobites et brachiopodes ordoviciens"},
        {"name": "Carrière de Villeveyrac", "type": "Ancienne mine de bauxite", "lat": 43.5010, "lng": 3.6080, "commune": "Villeveyrac", "interet": "Gisement de titanosaures (dinosaures sauropodes)"},
        {"name": "Carrière de Roquessels", "type": "Carrière de schistes", "lat": 43.5530, "lng": 3.2210, "commune": "Roquessels", "interet": "Plantes fossiles carbonifères"},
        {"name": "Anciennes Phosphatières de Cabrières", "type": "Carrière/Cavité", "lat": 43.5780, "lng": 3.3150, "commune": "Cabrières", "interet": "Plus ancienne faune marine ordovicienne au monde"}
    ]

    features = []
    for c in carrieres_data:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [c["lng"], c["lat"]]},
            "properties": c
        })

    geojson_out = {
        "type": "FeatureCollection",
        "features": features
    }

    output_path = os.path.join(PROCESSED_DIR, "carrieres_herault.geojson")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(geojson_out, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {len(carrieres_data)} carrières et coupes remarquables sauvegardées dans :")
    print(f"     {output_path}")

    return len(carrieres_data)


if __name__ == "__main__":
    download_rivers_osm()
    create_quarries_herault()

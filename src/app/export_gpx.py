"""
Module d'Export GPX & KML pour Smartphone Hors-Ligne (GPX Viewer, OsmAnd, Garmin)

Génère des fichiers de navigation GPS utilisables sur le terrain sans aucune connexion 4G/5G.
"""

import os
import json
import xml.etree.ElementTree as ET
from xml.dom import minidom

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
PROCESSED_DIR = os.path.join(PROJECT_DIR, "data", "processed")
FOSSILS_JSON = os.path.join(PROCESSED_DIR, "fossils_herault.json")
GEOJSON_PENTES = os.path.join(PROCESSED_DIR, "herault_geologie_pentes.geojson")


def generate_gpx_for_location(lat: float, lng: float, radius_km: float = 8.0) -> str:
    """Génère un fichier XML GPX contenant tous les waypoints fossiles et zones cibles dans un rayon donné."""
    gpx = ET.Element("gpx", {
        "version": "1.1",
        "creator": "Fossile Hérault Pro",
        "xmlns": "http://www.topografix.com/GPX/1/1",
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xsi:schemaLocation": "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
    })

    metadata = ET.SubElement(gpx, "metadata")
    name_el = ET.SubElement(metadata, "name")
    name_el.text = f"Cibles Prospection Fossiles ({lat:.3f}, {lng:.3f})"
    desc_el = ET.SubElement(metadata, "desc")
    desc_el.text = f"Fichier GPX généré pour prospection paléontologique hors-ligne (Rayon {radius_km}km)."

    # Charger les fossiles
    if os.path.exists(FOSSILS_JSON):
        with open(FOSSILS_JSON, 'r', encoding='utf-8') as f:
            fossils = json.load(f)

        for item in fossils:
            # Calcul distance euclidienne rapide approx
            d_lat = item['lat'] - lat
            d_lng = (item['lng'] - lng) * 0.73
            dist = (d_lat**2 + d_lng**2)**0.5 * 111.0

            if dist <= radius_km:
                wpt = ET.SubElement(gpx, "wpt", {"lat": str(item['lat']), "lon": str(item['lng'])})
                w_name = ET.SubElement(wpt, "name")
                w_name.text = f"🦖 {item['name']}"
                w_desc = ET.SubElement(wpt, "desc")
                w_desc.text = f"Catégorie: {item['category_name']} | Période: {item['period']} | Formation: {item.get('formation', 'N/A')}"
                w_sym = ET.SubElement(wpt, "sym")
                w_sym.text = "Fossil"

    # Convertir en chaîne XML indentée propre
    rough_string = ET.tostring(gpx, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")


def generate_kml_for_location(lat: float, lng: float, radius_km: float = 8.0) -> str:
    """Génère un fichier KML utilisable dans Google Earth ou OsmAnd."""
    kml = ET.Element("kml", {"xmlns": "http://www.opengis.net/kml/2.2"})
    doc = ET.SubElement(kml, "Document")
    d_name = ET.SubElement(doc, "name")
    d_name.text = f"Prospection Fossiles Hérault ({lat:.3f}, {lng:.3f})"

    if os.path.exists(FOSSILS_JSON):
        with open(FOSSILS_JSON, 'r', encoding='utf-8') as f:
            fossils = json.load(f)

        for item in fossils:
            d_lat = item['lat'] - lat
            d_lng = (item['lng'] - lng) * 0.73
            dist = (d_lat**2 + d_lng**2)**0.5 * 111.0

            if dist <= radius_km:
                pm = ET.SubElement(doc, "Placemark")
                p_name = ET.SubElement(pm, "name")
                p_name.text = item['name']
                p_desc = ET.SubElement(pm, "description")
                p_desc.text = f"Période: {item['period']} | Formation: {item.get('formation', 'N/A')}"

                point = ET.SubElement(pm, "Point")
                coords = ET.SubElement(point, "coordinates")
                coords.text = f"{item['lng']},{item['lat']},0"

    rough_string = ET.tostring(kml, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

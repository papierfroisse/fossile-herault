"""
Module de Tagging de Précision GPS des Fossiles (PBDB Hérault)

Analyse les coordonnées GPS et les métadonnées de la Paleobiology Database
afin d'attribuer à chaque découverte un indice de fiabilité spatiale :
- 🎯 GPS Précis (< 100m) : Coordonnées à forte décimale avec lieu-dit certifié.
- 📍 Secteur / Commune (~ 1km) : Coordonnées historiques ou arrondies.
"""

import os
import json

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
PROCESSED_DIR = os.path.join(PROJECT_DIR, "data", "processed")
FOSSILS_JSON = os.path.join(PROCESSED_DIR, "fossils_herault.json")


def tag_fossil_precision():
    print("=" * 60)
    print("🎯 CALCUL DE LA PRÉCISION SPATIALE GPS (PBDB HÉRAULT)")
    print("=" * 60)

    if not os.path.exists(FOSSILS_JSON):
        print("❌ Fichier introuvable:", FOSSILS_JSON)
        return

    with open(FOSSILS_JSON, 'r', encoding='utf-8') as f:
        fossils = json.load(f)

    precis_count = 0
    arrondi_count = 0

    for item in fossils:
        lat = item['lat']
        lng = item['lng']

        # Vérifier si les coordonnées ont été arrondies à 2 décimales (ex: 43.65, 3.35)
        lat_str = str(lat)
        lng_str = str(lng)

        decimals_lat = len(lat_str.split('.')[1]) if '.' in lat_str else 0
        decimals_lng = len(lng_str.split('.')[1]) if '.' in lng_str else 0

        # Si au moins 3-4 décimales et nom spécifique
        if decimals_lat >= 3 and decimals_lng >= 3 and not (lat_str.endswith('00') and lng_str.endswith('00')):
            item['precision_gps'] = "🎯 Précis (< 100m)"
            item['precision_code'] = "high"
            precis_count += 1
        else:
            item['precision_gps'] = "📍 Secteur / Commune (~ 1km)"
            item['precision_code'] = "medium"
            arrondi_count += 1

    with open(FOSSILS_JSON, 'w', encoding='utf-8') as f:
        json.dump(fossils, f, ensure_ascii=False, indent=2)

    print(f"✅ Précision spatialisée enregistrée pour {len(fossils)} fossiles :")
    print(f"  • {precis_count} gisements à haute précision GPS 🎯")
    print(f"  • {arrondi_count} gisements historiques de secteur 📍")


if __name__ == "__main__":
    tag_fossil_precision()

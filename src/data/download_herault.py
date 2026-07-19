"""
Script de téléchargement des données pour le prototype Hérault (34).
Sources :
  - PBDB (Paleobiology Database) : Fossiles trouvés dans l'Hérault
  - BRGM BD Charm-50 : Carte géologique de l'Hérault
"""

import os
import requests
import zipfile
import io
import json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

# Bounding box approximative de l'Hérault
HERAULT_BBOX = {
    "lng_min": 2.53,
    "lng_max": 4.23,
    "lat_min": 43.21,
    "lat_max": 43.97
}


def download_pbdb_herault():
    """
    Télécharge toutes les occurrences fossiles de la Paleobiology Database
    dans la zone de l'Hérault.
    """
    print("=" * 60)
    print("📥 Téléchargement des données PBDB (fossiles Hérault)...")
    print("=" * 60)

    url = "https://paleobiodb.org/data1.2/occs/list.csv"
    params = {
        "lngmin": HERAULT_BBOX["lng_min"],
        "lngmax": HERAULT_BBOX["lng_max"],
        "latmin": HERAULT_BBOX["lat_min"],
        "latmax": HERAULT_BBOX["lat_max"],
        "show": "coords,paleoloc,class,genus,formation,strat,lith,geo,time",
        "limit": "all"
    }

    print(f"  Requête API : {url}")
    print(f"  Zone : lat [{HERAULT_BBOX['lat_min']}, {HERAULT_BBOX['lat_max']}] "
          f"lng [{HERAULT_BBOX['lng_min']}, {HERAULT_BBOX['lng_max']}]")

    try:
        response = requests.get(url, params=params, timeout=60)
        response.raise_for_status()

        output_path = os.path.join(RAW_DIR, "pbdb_herault.csv")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(response.text)

        # Compter les lignes (moins l'en-tête)
        lines = response.text.strip().split("\n")
        n_records = len(lines) - 1 if len(lines) > 1 else 0

        print(f"  ✅ {n_records} occurrences fossiles téléchargées")
        print(f"  📁 Sauvegardé dans : {output_path}")
        return n_records

    except requests.exceptions.RequestException as e:
        print(f"  ❌ Erreur de téléchargement PBDB : {e}")
        return 0


def download_brgm_herault():
    """
    Télécharge la carte géologique BD Charm-50 pour le département 34 (Hérault).
    Format : Shapefile (.shp)
    """
    print()
    print("=" * 60)
    print("📥 Téléchargement de la carte géologique BRGM (Hérault)...")
    print("=" * 60)

    url = "http://infoterre.brgm.fr/telechargements/BDCharm50/GEO050K_HARM_034.zip"
    output_dir = os.path.join(RAW_DIR, "brgm_herault")

    print(f"  URL : {url}")

    try:
        response = requests.get(url, timeout=120, stream=True)
        response.raise_for_status()

        # Calculer la taille
        total_size = int(response.headers.get('content-length', 0))
        print(f"  Taille : {total_size / (1024*1024):.1f} Mo")

        # Télécharger le contenu complet
        content = response.content
        print(f"  Téléchargé : {len(content) / (1024*1024):.1f} Mo")

        # Extraire le ZIP
        os.makedirs(output_dir, exist_ok=True)
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            zf.extractall(output_dir)
            file_list = zf.namelist()

        print(f"  ✅ {len(file_list)} fichiers extraits dans : {output_dir}")
        for f_name in file_list[:10]:
            print(f"     - {f_name}")
        if len(file_list) > 10:
            print(f"     ... et {len(file_list) - 10} autres fichiers")

        return True

    except requests.exceptions.RequestException as e:
        print(f"  ❌ Erreur de téléchargement BRGM : {e}")
        return False


def download_georisques_cavites_herault():
    """
    Télécharge les données de cavités souterraines (carrières abandonnées)
    via l'API Géorisques pour le département 34.
    """
    print()
    print("=" * 60)
    print("📥 Téléchargement des cavités souterraines (Géorisques)...")
    print("=" * 60)

    url = "https://georisques.gouv.fr/api/v1/cavites"
    all_cavites = []
    page = 1
    page_size = 100

    while True:
        params = {
            "code_departement": "34",
            "page": page,
            "page_size": page_size
        }

        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            results = data.get("data", data.get("results", []))
            if not results:
                break

            all_cavites.extend(results)
            print(f"  Page {page} : {len(results)} cavités récupérées (total: {len(all_cavites)})")

            # Check if there are more pages
            total = data.get("total", None)
            if total and len(all_cavites) >= total:
                break
            if len(results) < page_size:
                break

            page += 1

        except requests.exceptions.RequestException as e:
            print(f"  ⚠️ Erreur page {page} : {e}")
            break

    if all_cavites:
        output_path = os.path.join(RAW_DIR, "cavites_herault.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_cavites, f, ensure_ascii=False, indent=2)
        print(f"  ✅ {len(all_cavites)} cavités sauvegardées dans : {output_path}")
    else:
        print("  ⚠️ Aucune cavité récupérée via l'API. Vérifier le format de l'API.")

    return len(all_cavites)


if __name__ == "__main__":
    print("🦕 FOSSILE — Téléchargement des données pour l'Hérault (34)")
    print("=" * 60)

    # Créer les répertoires
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    # 1. Données fossiles PBDB
    n_fossils = download_pbdb_herault()

    # 2. Carte géologique BRGM
    brgm_ok = download_brgm_herault()

    # 3. Cavités souterraines
    n_cavites = download_georisques_cavites_herault()

    # Résumé
    print()
    print("=" * 60)
    print("📊 RÉSUMÉ DU TÉLÉCHARGEMENT")
    print("=" * 60)
    print(f"  Fossiles PBDB       : {n_fossils} occurrences")
    print(f"  Carte géologique    : {'✅ OK' if brgm_ok else '❌ Échec'}")
    print(f"  Cavités souterraines: {n_cavites} entrées")
    print("=" * 60)

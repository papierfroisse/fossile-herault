import urllib.request
import json
import time
import sys
import os

# Department Bounding Boxes (Approximate lat/lng bounds for French departments)
DEPARTMENTS = {
    '34': {'name': 'Hérault', 'bounds': (43.1, 44.0, 2.7, 4.2), 'center': [43.55, 3.45]},
    '30': {'name': 'Gard', 'bounds': (43.4, 44.5, 3.2, 4.8), 'center': [44.0, 4.2]},
    '11': {'name': 'Aude', 'bounds': (42.7, 43.5, 1.7, 3.2), 'center': [43.1, 2.4]},
    '12': {'name': 'Aveyron', 'bounds': (43.7, 44.9, 1.9, 3.4), 'center': [44.3, 2.6]},
    '13': {'name': 'Bouches-du-Rhône', 'bounds': (43.1, 43.8, 4.7, 5.8), 'center': [43.5, 5.2]},
    '46': {'name': 'Lot', 'bounds': (44.2, 45.1, 1.1, 2.2), 'center': [44.6, 1.6]},
    '24': {'name': 'Dordogne', 'bounds': (44.5, 45.8, 0.0, 1.5), 'center': [45.1, 0.7]},
    '71': {'name': 'Saône-et-Loire', 'bounds': (46.1, 47.2, 3.6, 5.5), 'center': [46.6, 4.5]}
}

def clean_category(phylum, class_name, order_name, family, genus, sci_name):
    txt = f"{phylum} {class_name} {order_name} {family} {genus} {sci_name}".lower()
    
    if any(k in txt for k in ['dinosaur', 'reptil', 'sauropod', 'theropod', 'crocodil', 'turtle', 'testudines', 'squamata']):
        return 'dinosaurs_reptiles', 'Dinosaures & Reptiles', '#ef4444', 'fa-dragon'
    if any(k in txt for k in ['mollusc', 'cephalopod', 'ammonit', 'bivalv', 'gastropod', 'belemnit', 'brachiopod', 'hildoceras', 'lytoceras']):
        return 'molluscs', 'Mollusques & Ammonites', '#0284c7', 'fa-ring'
    if any(k in txt for k in ['plant', 'tracheophyta', 'ginkgo', 'walchia', 'flora', 'fern', 'conifer']):
        return 'plants', 'Plantes & Végétaux', '#16a34a', 'fa-leaf'
    if any(k in txt for k in ['trilobit', 'arthropod', 'crustac', 'insect', 'ostracod']):
        return 'arthropods', 'Trilobites & Arthropodes', '#9333ea', 'fa-bug'
    if any(k in txt for k in ['mammal', 'rodent', 'carnivor', 'hominid', 'artiodactyl', 'perissodactyl']):
        return 'mammals', 'Mammifères', '#d97706', 'fa-bone'
    if any(k in txt for k in ['fish', 'pisces', 'actinopterygii', 'chondrichthyes', 'shark']):
        return 'fish', 'Poissons & Chondrichthyens', '#0d9488', 'fa-fish'
    return 'others', 'Autres Fossiles & Spécimens', '#64748b', 'fa-circle-dot'

def fetch_pbdb_data(min_lat, max_lat, min_lng, max_lng):
    print(f"Fetching PBDB fossil occurrences for bounds ({min_lat}, {max_lat}, {min_lng}, {max_lng})...")
    url = f"https://paleobiodb.org/data1.2/occs/list.json?lngmin={min_lng}&lngmax={max_lng}&latmin={min_lat}&latmax={max_lat}&show=coords,classext,strata"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'FossileFrance/1.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            records = data.get('records', [])
            print(f"  Fetched {len(records)} PBDB records.")
            return records
    except Exception as e:
        print(f"Error fetching PBDB data: {e}")
        return []

def fetch_gbif_data(min_lat, max_lat, min_lng, max_lng):
    print(f"Fetching GBIF MNHN fossil occurrences for bounds ({min_lat}, {max_lat}, {min_lng}, {max_lng})...")
    mnhn_records = []
    offset = 0
    limit = 300
    while True:
        url = f"https://api.gbif.org/v1/occurrence/search?decimalLatitude={min_lat},{max_lat}&decimalLongitude={min_lng},{max_lng}&basisOfRecord=FOSSIL_SPECIMEN&limit={limit}&offset={offset}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'FossileFrance/1.0'})
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                results = data.get('results', [])
                if not results:
                    break
                mnhn_records.extend(results)
                offset += len(results)
                if offset >= data.get('count', 0) or offset >= 1200:
                    break
                time.sleep(0.1)
        except Exception as e:
            print(f"Error fetching GBIF page: {e}")
            break
    print(f"  Fetched {len(mnhn_records)} GBIF records.")
    return mnhn_records

def ingest_department(dept_code):
    if dept_code not in DEPARTMENTS:
        print(f"Unknown department code {dept_code}. Available: {list(DEPARTMENTS.keys())}")
        return

    info = DEPARTMENTS[dept_code]
    min_lat, max_lat, min_lng, max_lng = info['bounds']
    print(f"Ingesting Department {dept_code} ({info['name']})...")

    pbdb_raw = fetch_pbdb_data(min_lat, max_lat, min_lng, max_lng)
    gbif_raw = fetch_gbif_data(min_lat, max_lat, min_lng, max_lng)

    formatted = []
    seen = set()

    # Process GBIF MNHN
    for r in gbif_raw:
        lat = r.get('decimalLatitude')
        lng = r.get('decimalLongitude')
        if not lat or not lng:
            continue
        sci_name = r.get('scientificName') or r.get('genus') or "Spécimen Fossile MNHN"
        key = (round(lat, 4), round(lng, 4), sci_name)
        if key in seen:
            continue
        seen.add(key)

        cat_id, cat_name, color, icon = clean_category(r.get('phylum',''), r.get('class',''), r.get('order',''), r.get('family',''), r.get('genus',''), sci_name)

        formatted.append({
            "id": r.get('gbifID', int(time.time() * 1000)),
            "name": sci_name.split(' ')[0] + (' ' + sci_name.split(' ')[1] if len(sci_name.split(' ')) > 1 else ''),
            "lat": round(lat, 5),
            "lng": round(lng, 5),
            "phylum": r.get('phylum') or "Collection MNHN Paris",
            "class_name": r.get('class') or "Paléontologie",
            "period": r.get('period') or "Mésozoïque",
            "formation": r.get('locality', info['name']),
            "max_ma": 200, "min_ma": 66,
            "category_id": cat_id, "category_name": cat_name,
            "color": color, "icon": icon,
            "precision_gps": "🏛️ Collection Certifiée MNHN",
            "precision_code": "high",
            "source": "MNHN",
            "mnhn_catalog": r.get('catalogNumber', str(r.get('gbifID', '')))
        })

    # Process PBDB
    for r in pbdb_raw:
        try:
            lat = float(r.get('lat'))
            lng = float(r.get('lng'))
        except (TypeError, ValueError):
            continue
        if not lat or not lng:
            continue
        sci_name = r.get('tno') or r.get('mno') or "Fossile PBDB"
        key = (round(lat, 4), round(lng, 4), sci_name)
        if key in seen:
            continue
        seen.add(key)

        cat_id, cat_name, color, icon = clean_category(r.get('phl',''), r.get('cll',''), r.get('odl',''), r.get('fml',''), r.get('gnn',''), sci_name)

        formatted.append({
            "id": r.get('oid', int(time.time() * 1000)),
            "name": sci_name,
            "lat": round(lat, 5),
            "lng": round(lng, 5),
            "phylum": r.get('phl') or "PBDB Record",
            "class_name": r.get('cll') or "Paleontology",
            "period": r.get('dpt') or r.get('eon') or "Mésozoïque",
            "formation": r.get('sfm') or r.get('fmt') or info['name'],
            "max_ma": r.get('eag', 200), "min_ma": r.get('lag', 66),
            "category_id": cat_id, "category_name": cat_name,
            "color": color, "icon": icon,
            "precision_gps": "📍 Secteur PBDB (~1km)",
            "precision_code": "medium",
            "source": "PBDB"
        })

    out_dir = f"processed/{dept_code}"
    os.makedirs(out_dir, exist_ok=True)
    out_file = f"{out_dir}/fossils.json"

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(formatted, f, ensure_ascii=False, indent=2)

    print(f"SUCCESS: Saved {len(formatted)} records to {out_file} for Department {dept_code} ({info['name']}).")

if __name__ == '__main__':
    code = sys.argv[1] if len(sys.argv) > 1 else '30'
    ingest_department(code)

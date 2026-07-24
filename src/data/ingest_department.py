import urllib.request
import json
import time
import sys
import os

# Department Bounding Boxes (Approximate lat/lng bounds for French departments)
DEPARTMENTS = {
    '01': {'name': 'Ain', 'bounds': (45.7, 46.5, 4.8, 6.1), 'center': [46.1, 5.2]},
    '02': {'name': 'Aisne', 'bounds': (48.8, 50.1, 2.9, 4.2), 'center': [49.5, 3.6]},
    '03': {'name': 'Allier', 'bounds': (45.8, 46.8, 2.4, 3.9), 'center': [46.3, 3.3]},
    '04': {'name': 'Alpes-de-Haute-Provence', 'bounds': (43.7, 44.5, 5.6, 6.9), 'center': [44.1, 6.2]},
    '05': {'name': 'Hautes-Alpes', 'bounds': (44.2, 45.1, 5.7, 7.0), 'center': [44.7, 6.3]},
    '06': {'name': 'Alpes-Maritimes', 'bounds': (43.5, 44.4, 6.8, 7.7), 'center': [43.9, 7.1]},
    '07': {'name': 'Ardèche', 'bounds': (44.3, 45.3, 3.8, 4.9), 'center': [44.7, 4.4]},
    '08': {'name': 'Ardennes', 'bounds': (49.2, 50.2, 4.1, 5.3), 'center': [49.6, 4.6]},
    '09': {'name': 'Ariège', 'bounds': (42.6, 43.3, 1.0, 2.2), 'center': [42.9, 1.5]},
    '10': {'name': 'Aube', 'bounds': (47.9, 48.6, 3.4, 4.8), 'center': [48.3, 4.1]},
    '11': {'name': 'Aude', 'bounds': (42.7, 43.5, 1.7, 3.2), 'center': [43.1, 2.4]},
    '12': {'name': 'Aveyron', 'bounds': (43.7, 44.9, 1.9, 3.4), 'center': [44.3, 2.6]},
    '13': {'name': 'Bouches-du-Rhône', 'bounds': (43.1, 43.8, 4.7, 5.8), 'center': [43.5, 5.2]},
    '14': {'name': 'Calvados', 'bounds': (48.8, 49.4, -1.2, 0.4), 'center': [49.1, -0.4]},
    '15': {'name': 'Cantal', 'bounds': (44.6, 45.4, 2.1, 3.3), 'center': [45.0, 2.6]},
    '16': {'name': 'Charente', 'bounds': (45.2, 46.1, -0.5, 0.9), 'center': [45.7, 0.2]},
    '17': {'name': 'Charente-Maritime', 'bounds': (45.1, 46.4, -1.6, -0.1), 'center': [45.7, -0.8]},
    '18': {'name': 'Cher', 'bounds': (46.4, 47.6, 1.8, 3.0), 'center': [47.1, 2.4]},
    '19': {'name': 'Corrèze', 'bounds': (44.9, 45.7, 1.3, 2.5), 'center': [45.3, 1.9]},
    '21': {'name': "Côte-d'Or", 'bounds': (46.9, 47.9, 4.1, 5.5), 'center': [47.3, 4.8]},
    '22': {'name': "Côtes-d'Armor", 'bounds': (48.1, 48.9, -3.6, -1.9), 'center': [48.4, -2.8]},
    '23': {'name': 'Creuse', 'bounds': (45.6, 46.4, 1.4, 2.6), 'center': [46.0, 2.0]},
    '24': {'name': 'Dordogne', 'bounds': (44.5, 45.8, 0.0, 1.5), 'center': [45.1, 0.7]},
    '25': {'name': 'Doubs', 'bounds': (46.7, 47.6, 5.7, 7.0), 'center': [47.2, 6.3]},
    '26': {'name': 'Drôme', 'bounds': (44.1, 45.3, 4.6, 5.7), 'center': [44.7, 5.1]},
    '27': {'name': 'Eure', 'bounds': (48.7, 49.5, 0.3, 1.8), 'center': [49.0, 1.0]},
    '28': {'name': 'Eure-et-Loir', 'bounds': (47.9, 48.9, 0.7, 2.0), 'center': [48.4, 1.4]},
    '29': {'name': 'Finistère', 'bounds': (47.7, 48.7, -4.8, -3.4), 'center': [48.2, -4.1]},
    '30': {'name': 'Gard', 'bounds': (43.4, 44.5, 3.2, 4.8), 'center': [44.0, 4.2]},
    '31': {'name': 'Haute-Garonne', 'bounds': (42.7, 43.9, 0.7, 2.1), 'center': [43.3, 1.3]},
    '32': {'name': 'Gers', 'bounds': (43.3, 44.1, -0.3, 1.2), 'center': [43.6, 0.5]},
    '33': {'name': 'Gironde', 'bounds': (44.2, 45.6, -1.3, 0.3), 'center': [44.8, -0.6]},
    '34': {'name': 'Hérault', 'bounds': (43.1, 44.0, 2.7, 4.2), 'center': [43.55, 3.45]},
    '35': {'name': 'Ille-et-Vilaine', 'bounds': (47.6, 48.6, -2.2, -1.0), 'center': [48.2, -1.6]},
    '36': {'name': 'Indre', 'bounds': (46.3, 47.3, 1.0, 2.2), 'center': [46.8, 1.6]},
    '37': {'name': 'Indre-et-Loire', 'bounds': (46.7, 47.7, 0.1, 1.4), 'center': [47.2, 0.7]},
    '38': {'name': 'Isère', 'bounds': (44.7, 45.8, 5.0, 6.4), 'center': [45.2, 5.7]},
    '39': {'name': 'Jura', 'bounds': (46.3, 47.2, 5.2, 6.1), 'center': [46.7, 5.7]},
    '40': {'name': 'Landes', 'bounds': (43.5, 44.5, -1.5, -0.1), 'center': [43.9, -0.8]},
    '41': {'name': 'Loir-et-Cher', 'bounds': (47.2, 48.1, 0.6, 2.2), 'center': [47.6, 1.3]},
    '42': {'name': 'Loire', 'bounds': (45.3, 46.2, 3.7, 4.7), 'center': [45.7, 4.2]},
    '43': {'name': 'Haute-Loire', 'bounds': (44.7, 45.4, 3.1, 4.4), 'center': [45.1, 3.8]},
    '44': {'name': 'Loire-Atlantique', 'bounds': (46.9, 47.8, -2.4, -0.9), 'center': [47.3, -1.6]},
    '45': {'name': 'Loiret', 'bounds': (47.5, 48.3, 1.5, 3.1), 'center': [47.9, 2.2]},
    '46': {'name': 'Lot', 'bounds': (44.2, 45.1, 1.1, 2.2), 'center': [44.6, 1.6]},
    '47': {'name': 'Lot-et-Garonne', 'bounds': (44.0, 44.8, -0.1, 1.1), 'center': [44.3, 0.5]},
    '48': {'name': 'Lozère', 'bounds': (44.1, 44.9, 3.0, 4.0), 'center': [44.5, 3.5]},
    '49': {'name': 'Maine-et-Loire', 'bounds': (47.0, 47.8, -1.3, 0.2), 'center': [47.4, -0.5]},
    '50': {'name': 'Manche', 'bounds': (48.5, 49.7, -2.0, -0.7), 'center': [49.1, -1.3]},
    '51': {'name': 'Marne', 'bounds': (48.5, 49.4, 3.5, 4.9), 'center': [48.9, 4.2]},
    '52': {'name': 'Haute-Marne', 'bounds': (47.6, 48.6, 4.7, 5.8), 'center': [48.1, 5.2]},
    '53': {'name': 'Mayenne', 'bounds': (47.7, 48.5, -1.2, -0.1), 'center': [48.1, -0.6]},
    '54': {'name': 'Meurthe-et-Moselle', 'bounds': (48.4, 49.6, 5.4, 7.1), 'center': [48.7, 6.1]},
    '55': {'name': 'Meuse', 'bounds': (48.4, 49.6, 4.9, 5.9), 'center': [49.0, 5.4]},
    '56': {'name': 'Morbihan', 'bounds': (47.3, 48.2, -3.7, -2.1), 'center': [47.8, -2.8]},
    '57': {'name': 'Moselle', 'bounds': (48.6, 49.5, 5.9, 7.6), 'center': [49.0, 6.6]},
    '58': {'name': 'Nièvre', 'bounds': (46.7, 47.6, 2.8, 4.2), 'center': [47.1, 3.5]},
    '59': {'name': 'Nord', 'bounds': (50.0, 51.1, 2.1, 4.2), 'center': [50.4, 3.2]},
    '60': {'name': 'Oise', 'bounds': (49.1, 49.7, 1.7, 3.1), 'center': [49.4, 2.4]},
    '61': {'name': 'Orne', 'bounds': (48.3, 48.9, -0.8, 0.9), 'center': [48.6, 0.1]},
    '62': {'name': 'Pas-de-Calais', 'bounds': (50.1, 51.0, 1.5, 3.2), 'center': [50.5, 2.3]},
    '63': {'name': 'Puy-de-Dôme', 'bounds': (45.3, 46.2, 2.5, 3.9), 'center': [45.7, 3.1]},
    '64': {'name': 'Pyrénées-Atlantiques', 'bounds': (42.8, 43.6, -1.8, -0.1), 'center': [43.3, -0.8]},
    '65': {'name': 'Hautes-Pyrénées', 'bounds': (42.7, 43.6, -0.5, 0.6), 'center': [43.1, 0.1]},
    '66': {'name': 'Pyrénées-Orientales', 'bounds': (42.3, 42.9, 1.7, 3.2), 'center': [42.6, 2.6]},
    '67': {'name': 'Bas-Rhin', 'bounds': (48.2, 49.1, 6.9, 8.2), 'center': [48.7, 7.6]},
    '68': {'name': 'Haut-Rhin', 'bounds': (47.4, 48.3, 6.9, 7.7), 'center': [47.9, 7.3]},
    '69': {'name': 'Rhône', 'bounds': (45.5, 46.3, 4.3, 5.2), 'center': [45.8, 4.7]},
    '70': {'name': 'Haute-Saône', 'bounds': (47.3, 48.0, 5.4, 6.8), 'center': [47.6, 6.1]},
    '71': {'name': 'Saône-et-Loire', 'bounds': (46.1, 47.2, 3.6, 5.5), 'center': [46.6, 4.5]},
    '72': {'name': 'Sarthe', 'bounds': (47.6, 48.4, -0.4, 0.9), 'center': [48.0, 0.2]},
    '73': {'name': 'Savoie', 'bounds': (45.1, 45.9, 5.7, 7.1), 'center': [45.5, 6.5]},
    '74': {'name': 'Haute-Savoie', 'bounds': (45.7, 46.4, 5.9, 7.0), 'center': [46.0, 6.4]},
    '75': {'name': 'Paris', 'bounds': (48.8, 48.9, 2.2, 2.5), 'center': [48.85, 2.35]},
    '76': {'name': 'Seine-Maritime', 'bounds': (49.4, 50.1, 0.1, 1.8), 'center': [49.6, 1.1]},
    '77': {'name': 'Seine-et-Marne', 'bounds': (48.1, 49.1, 2.4, 3.4), 'center': [48.6, 2.9]},
    '78': {'name': 'Yvelines', 'bounds': (48.5, 49.1, 1.4, 2.2), 'center': [48.8, 1.9]},
    '79': {'name': 'Deux-Sèvres', 'bounds': (46.0, 47.1, -0.9, 0.2), 'center': [46.5, -0.3]},
    '80': {'name': 'Somme', 'bounds': (49.6, 50.4, 1.4, 3.2), 'center': [49.9, 2.3]},
    '81': {'name': 'Tarn', 'bounds': (43.4, 44.2, 1.6, 2.9), 'center': [43.8, 2.2]},
    '82': {'name': 'Tarn-et-Garonne', 'bounds': (43.8, 44.4, 0.8, 1.9), 'center': [44.1, 1.3]},
    '83': {'name': 'Var', 'bounds': (43.0, 43.8, 5.6, 6.9), 'center': [43.4, 6.2]},
    '84': {'name': 'Vaucluse', 'bounds': (43.7, 44.4, 4.6, 5.7), 'center': [44.0, 5.1]},
    '85': {'name': 'Vendée', 'bounds': (46.3, 47.1, -2.4, -0.6), 'center': [46.7, -1.3]},
    '86': {'name': 'Vienne', 'bounds': (46.1, 47.1, -0.1, 1.0), 'center': [46.6, 0.5]},
    '87': {'name': 'Haute-Vienne', 'bounds': (45.5, 46.4, 0.6, 1.8), 'center': [45.8, 1.2]},
    '88': {'name': 'Vosges', 'bounds': (47.8, 48.5, 5.6, 7.1), 'center': [48.2, 6.4]},
    '89': {'name': 'Yonne', 'bounds': (47.3, 48.4, 2.8, 4.3), 'center': [47.8, 3.6]},
    '90': {'name': 'Territoire de Belfort', 'bounds': (47.4, 47.8, 6.7, 7.1), 'center': [47.6, 6.9]},
    '91': {'name': 'Essonne', 'bounds': (48.3, 48.7, 1.9, 2.6), 'center': [48.5, 2.3]},
    '92': {'name': 'Hauts-de-Seine', 'bounds': (48.7, 48.9, 2.1, 2.4), 'center': [48.8, 2.2]},
    '93': {'name': 'Seine-Saint-Denis', 'bounds': (48.8, 49.0, 2.3, 2.6), 'center': [48.9, 2.4]},
    '94': {'name': 'Val-de-Marne', 'bounds': (48.7, 48.8, 2.3, 2.6), 'center': [48.8, 2.4]},
    '95': {"name": "Val-d'Oise", 'bounds': (48.9, 49.2, 1.6, 2.5), 'center': [49.1, 2.1]}
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

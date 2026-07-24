import urllib.request
import json
import time
import sys
import os
from ingest_department import ingest_department

ALL_DEPARTMENTS = [
    {"code": "01", "name": "Ain", "center": [46.1, 5.2], "bounds": (45.7, 46.5, 4.8, 6.1)},
    {"code": "02", "name": "Aisne", "center": [49.5, 3.6], "bounds": (48.8, 50.1, 2.9, 4.2)},
    {"code": "03", "name": "Allier", "center": [46.3, 3.3], "bounds": (45.8, 46.8, 2.4, 3.9)},
    {"code": "04", "name": "Alpes-de-Haute-Provence", "center": [44.1, 6.2], "bounds": (43.7, 44.5, 5.6, 6.9)},
    {"code": "05", "name": "Hautes-Alpes", "center": [44.7, 6.3], "bounds": (44.2, 45.1, 5.7, 7.0)},
    {"code": "06", "name": "Alpes-Maritimes", "center": [43.9, 7.1], "bounds": (43.5, 44.4, 6.8, 7.7)},
    {"code": "07", "name": "Ardèche", "center": [44.7, 4.4], "bounds": (44.3, 45.3, 3.8, 4.9)},
    {"code": "08", "name": "Ardennes", "center": [49.6, 4.6], "bounds": (49.2, 50.2, 4.1, 5.3)},
    {"code": "09", "name": "Ariège", "center": [42.9, 1.5], "bounds": (42.6, 43.3, 1.0, 2.2)},
    {"code": "10", "name": "Aube", "center": [48.3, 4.1], "bounds": (47.9, 48.6, 3.4, 4.8)},
    {"code": "11", "name": "Aude", "center": [43.1, 2.4], "bounds": (42.7, 43.5, 1.7, 3.2)},
    {"code": "12", "name": "Aveyron", "center": [44.3, 2.6], "bounds": (43.7, 44.9, 1.9, 3.4)},
    {"code": "13", "name": "Bouches-du-Rhône", "center": [43.5, 5.2], "bounds": (43.1, 43.8, 4.7, 5.8)},
    {"code": "14", "name": "Calvados", "center": [49.1, -0.4], "bounds": (48.8, 49.4, -1.2, 0.4)},
    {"code": "15", "name": "Cantal", "center": [45.0, 2.6], "bounds": (44.6, 45.4, 2.1, 3.3)},
    {"code": "16", "name": "Charente", "center": [45.7, 0.2], "bounds": (45.2, 46.1, -0.5, 0.9)},
    {"code": "17", "name": "Charente-Maritime", "center": [45.7, -0.8], "bounds": (45.1, 46.4, -1.6, -0.1)},
    {"code": "18", "name": "Cher", "center": [47.1, 2.4], "bounds": (46.4, 47.6, 1.8, 3.0)},
    {"code": "19", "name": "Corrèze", "center": [45.3, 1.9], "bounds": (44.9, 45.7, 1.3, 2.5)},
    {"code": "21", "name": "Côte-d'Or", "center": [47.3, 4.8], "bounds": (46.9, 47.9, 4.1, 5.5)},
    {"code": "22", "name": "Côtes-d'Armor", "center": [48.4, -2.8], "bounds": (48.1, 48.9, -3.6, -1.9)},
    {"code": "23", "name": "Creuse", "center": [46.0, 2.0], "bounds": (45.6, 46.4, 1.4, 2.6)},
    {"code": "24", "name": "Dordogne", "center": [45.1, 0.7], "bounds": (44.5, 45.8, 0.0, 1.5)},
    {"code": "25", "name": "Doubs", "center": [47.2, 6.3], "bounds": (46.7, 47.6, 5.7, 7.0)},
    {"code": "26", "name": "Drôme", "center": [44.7, 5.1], "bounds": (44.1, 45.3, 4.6, 5.7)},
    {"code": "27", "name": "Eure", "center": [49.0, 1.0], "bounds": (48.7, 49.5, 0.3, 1.8)},
    {"code": "28", "name": "Eure-et-Loir", "center": [48.4, 1.4], "bounds": (47.9, 48.9, 0.7, 2.0)},
    {"code": "29", "name": "Finistère", "center": [48.2, -4.1], "bounds": (47.7, 48.7, -4.8, -3.4)},
    {"code": "30", "name": "Gard", "center": [44.0, 4.2], "bounds": (43.4, 44.5, 3.2, 4.8)},
    {"code": "31", "name": "Haute-Garonne", "center": [43.3, 1.3], "bounds": (42.7, 43.9, 0.7, 2.1)},
    {"code": "32", "name": "Gers", "center": [43.6, 0.5], "bounds": (43.3, 44.1, -0.3, 1.2)},
    {"code": "33", "name": "Gironde", "center": [44.8, -0.6], "bounds": (44.2, 45.6, -1.3, 0.3)},
    {"code": "34", "name": "Hérault", "center": [43.55, 3.45], "bounds": (43.1, 44.0, 2.7, 4.2)},
    {"code": "35", "name": "Ille-et-Vilaine", "center": [48.2, -1.6], "bounds": (47.6, 48.6, -2.2, -1.0)},
    {"code": "36", "name": "Indre", "center": [46.8, 1.6], "bounds": (46.3, 47.3, 1.0, 2.2)},
    {"code": "37", "name": "Indre-et-Loire", "center": [47.2, 0.7], "bounds": (46.7, 47.7, 0.1, 1.4)},
    {"code": "38", "name": "Isère", "center": [45.2, 5.7], "bounds": (44.7, 45.8, 5.0, 6.4)},
    {"code": "39", "name": "Jura", "center": [46.7, 5.7], "bounds": (46.3, 47.2, 5.2, 6.1)},
    {"code": "40", "name": "Landes", "center": [43.9, -0.8], "bounds": (43.5, 44.5, -1.5, -0.1)},
    {"code": "41", "name": "Loir-et-Cher", "center": [47.6, 1.3], "bounds": (47.2, 48.1, 0.6, 2.2)},
    {"code": "42", "name": "Loire", "center": [45.7, 4.2], "bounds": (45.3, 46.2, 3.7, 4.7)},
    {"code": "43", "name": "Haute-Loire", "center": [45.1, 3.8], "bounds": (44.7, 45.4, 3.1, 4.4)},
    {"code": "44", "name": "Loire-Atlantique", "center": [47.3, -1.6], "bounds": (46.9, 47.8, -2.4, -0.9)},
    {"code": "45", "name": "Loiret", "center": [47.9, 2.2], "bounds": (47.5, 48.3, 1.5, 3.1)},
    {"code": "46", "name": "Lot", "center": [44.6, 1.6], "bounds": (44.2, 45.1, 1.1, 2.2)},
    {"code": "47", "name": "Lot-et-Garonne", "center": [44.3, 0.5], "bounds": (44.0, 44.8, -0.1, 1.1)},
    {"code": "48", "name": "Lozère", "center": [44.5, 3.5], "bounds": (44.1, 44.9, 3.0, 4.0)},
    {"code": "49", "name": "Maine-et-Loire", "center": [47.4, -0.5], "bounds": (47.0, 47.8, -1.3, 0.2)},
    {"code": "50", "name": "Manche", "center": [49.1, -1.3], "bounds": (48.5, 49.7, -2.0, -0.7)},
    {"code": "51", "name": "Marne", "center": [48.9, 4.2], "bounds": (48.5, 49.4, 3.5, 4.9)},
    {"code": "52", "name": "Haute-Marne", "center": [48.1, 5.2], "bounds": (47.6, 48.6, 4.7, 5.8)},
    {"code": "53", "name": "Mayenne", "center": [48.1, -0.6], "bounds": (47.7, 48.5, -1.2, -0.1)},
    {"code": "54", "name": "Meurthe-et-Moselle", "center": [48.7, 6.1], "bounds": (48.4, 49.6, 5.4, 7.1)},
    {"code": "55", "name": "Meuse", "center": [49.0, 5.4], "bounds": (48.4, 49.6, 4.9, 5.9)},
    {"code": "56", "name": "Morbihan", "center": [47.8, -2.8], "bounds": (47.3, 48.2, -3.7, -2.1)},
    {"code": "57", "name": "Moselle", "center": [49.0, 6.6], "bounds": (48.6, 49.5, 5.9, 7.6)},
    {"code": "58", "name": "Nièvre", "center": [47.1, 3.5], "bounds": (46.7, 47.6, 2.8, 4.2)},
    {"code": "59", "name": "Nord", "center": [50.4, 3.2], "bounds": (50.0, 51.1, 2.1, 4.2)},
    {"code": "60", "name": "Oise", "center": [49.4, 2.4], "bounds": (49.1, 49.7, 1.7, 3.1)},
    {"code": "61", "name": "Orne", "center": [48.6, 0.1], "bounds": (48.3, 48.9, -0.8, 0.9)},
    {"code": "62", "name": "Pas-de-Calais", "center": [50.5, 2.3], "bounds": (50.1, 51.0, 1.5, 3.2)},
    {"code": "63", "name": "Puy-de-Dôme", "center": [45.7, 3.1], "bounds": (45.3, 46.2, 2.5, 3.9)},
    {"code": "64", "name": "Pyrénées-Atlantiques", "center": [43.3, -0.8], "bounds": (42.8, 43.6, -1.8, -0.1)},
    {"code": "65", "name": "Hautes-Pyrénées", "center": [43.1, 0.1], "bounds": (42.7, 43.6, -0.5, 0.6)},
    {"code": "66", "name": "Pyrénées-Orientales", "center": [42.6, 2.6], "bounds": (42.3, 42.9, 1.7, 3.2)},
    {"code": "67", "name": "Bas-Rhin", "center": [48.7, 7.6], "bounds": (48.2, 49.1, 6.9, 8.2)},
    {"code": "68", "name": "Haut-Rhin", "center": [47.9, 7.3], "bounds": (47.4, 48.3, 6.9, 7.7)},
    {"code": "69", "name": "Rhône", "center": [45.8, 4.7], "bounds": (45.5, 46.3, 4.3, 5.2)},
    {"code": "70", "name": "Haute-Saône", "center": [47.6, 6.1], "bounds": (47.3, 48.0, 5.4, 6.8)},
    {"code": "71", "name": "Saône-et-Loire", "center": [46.6, 4.5], "bounds": (46.1, 47.2, 3.6, 5.5)},
    {"code": "72", "name": "Sarthe", "center": [48.0, 0.2], "bounds": (47.6, 48.4, -0.4, 0.9)},
    {"code": "73", "name": "Savoie", "center": [45.5, 6.5], "bounds": (45.1, 45.9, 5.7, 7.1)},
    {"code": "74", "name": "Haute-Savoie", "center": [46.0, 6.4], "bounds": (45.7, 46.4, 5.9, 7.0)},
    {"code": "75", "name": "Paris", "center": [48.85, 2.35], "bounds": (48.8, 48.9, 2.2, 2.5)},
    {"code": "76", "name": "Seine-Maritime", "center": [49.6, 1.1], "bounds": (49.4, 50.1, 0.1, 1.8)},
    {"code": "77", "name": "Seine-et-Marne", "center": [48.6, 2.9], "bounds": (48.1, 49.1, 2.4, 3.4)},
    {"code": "78", "name": "Yvelines", "center": [48.8, 1.9], "bounds": (48.5, 49.1, 1.4, 2.2)},
    {"code": "79", "name": "Deux-Sèvres", "center": [46.5, -0.3], "bounds": (46.0, 47.1, -0.9, 0.2)},
    {"code": "80", "name": "Somme", "center": [49.9, 2.3], "bounds": (49.6, 50.4, 1.4, 3.2)},
    {"code": "81", "name": "Tarn", "center": [43.8, 2.2], "bounds": (43.4, 44.2, 1.6, 2.9)},
    {"code": "82", "name": "Tarn-et-Garonne", "center": [44.1, 1.3], "bounds": (43.8, 44.4, 0.8, 1.9)},
    {"code": "83", "name": "Var", "center": [43.4, 6.2], "bounds": (43.0, 43.8, 5.6, 6.9)},
    {"code": "84", "name": "Vaucluse", "center": [44.0, 5.1], "bounds": (43.7, 44.4, 4.6, 5.7)},
    {"code": "85", "name": "Vendée", "center": [46.7, -1.3], "bounds": (46.3, 47.1, -2.4, -0.6)},
    {"code": "86", "name": "Vienne", "center": [46.6, 0.5], "bounds": (46.1, 47.1, -0.1, 1.0)},
    {"code": "87", "name": "Haute-Vienne", "center": [45.8, 1.2], "bounds": (45.5, 46.4, 0.6, 1.8)},
    {"code": "88", "name": "Vosges", "center": [48.2, 6.4], "bounds": (47.8, 48.5, 5.6, 7.1)},
    {"code": "89", "name": "Yonne", "center": [47.8, 3.6], "bounds": (47.3, 48.4, 2.8, 4.3)},
    {"code": "90", "name": "Territoire de Belfort", "center": [47.6, 6.9], "bounds": (47.4, 47.8, 6.7, 7.1)},
    {"code": "91", "name": "Essonne", "center": [48.5, 2.3], "bounds": (48.3, 48.7, 1.9, 2.6)},
    {"code": "92", "name": "Hauts-de-Seine", "center": [48.8, 2.2], "bounds": (48.7, 48.9, 2.1, 2.4)},
    {"code": "93", "name": "Seine-Saint-Denis", "center": [48.9, 2.4], "bounds": (48.8, 49.0, 2.3, 2.6)},
    {"code": "94", "name": "Val-de-Marne", "center": [48.8, 2.4], "bounds": (48.7, 48.8, 2.3, 2.6)},
    {"code": "95", "name": "Val-d'Oise", "center": [49.1, 2.1], "bounds": (48.9, 49.2, 1.6, 2.5)}
]

def copy_to_public(dept_code):
    """Ensure data is saved in both processed/ and public/processed/ for Vite dist bundle."""
    src = f"processed/{dept_code}/fossils.json"
    if os.path.exists(src):
        pub_dir = f"public/processed/{dept_code}"
        os.makedirs(pub_dir, exist_ok=True)
        with open(src, 'r', encoding='utf-8') as sf, open(f"{pub_dir}/fossils.json", 'w', encoding='utf-8') as df:
            df.write(sf.read())

def generate_department_index():
    os.makedirs('processed', exist_ok=True)
    os.makedirs('public/processed', exist_ok=True)

    with open('processed/departments.json', 'w', encoding='utf-8') as f:
        json.dump(ALL_DEPARTMENTS, f, ensure_ascii=False, indent=2)
    with open('public/processed/departments.json', 'w', encoding='utf-8') as f:
        json.dump(ALL_DEPARTMENTS, f, ensure_ascii=False, indent=2)

    print(f"Generated index for {len(ALL_DEPARTMENTS)} French departments.")

if __name__ == '__main__':
    generate_department_index()
    
    # Ingest key departments
    for d in ALL_DEPARTMENTS:
        code = d['code']
        ingest_department(code)
        copy_to_public(code)

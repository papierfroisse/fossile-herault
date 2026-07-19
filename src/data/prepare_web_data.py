"""
Prépa et formatage des données légères pour l'application Web interactive.
Génère :
  - data/processed/fossils_herault.json : Liste filtrable des 2 818 fossiles
  - data/processed/herault_geologie_scored.geojson : Polygones géologiques prédictifs
"""

import os
import json
import pandas as pd

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CSV_PATH = os.path.join(PROJECT_DIR, "data", "raw", "pbdb_herault.csv")
OUTPUT_FOSSILS_JSON = os.path.join(PROJECT_DIR, "data", "processed", "fossils_herault.json")


def categorize_taxon(phylum, class_name, accepted_name):
    p = str(phylum).lower() if pd.notna(phylum) else ""
    c = str(class_name).lower() if pd.notna(class_name) else ""
    name = str(accepted_name).lower() if pd.notna(accepted_name) else ""

    if any(w in p or w in c or w in name for w in ["dinosaur", "reptil", "sauris", "ornithis", "crocod", "testud"]):
        return "dinosaurs_reptiles", "Dinosaures & Reptiles", "#ff3333", "paw"
    elif any(w in p or w in c or w in name for w in ["mollusc", "cephalop", "bivalv", "gastrop", "ammon"]):
        return "molluscs", "Mollusques & Ammonites", "#3388ff", "water"
    elif any(w in p or w in c or w in name for w in ["mammal"]):
        return "mammals", "Mammifères", "#ffaa00", "paw"
    elif any(w in p or w in c or w in name for w in ["plant", "tracheoph", "ginkgo"]):
        return "plants", "Plantes & Végétaux", "#28a745", "leaf"
    elif any(w in p or w in c or w in name for w in ["arthrop", "trilob", "insect"]):
        return "arthropods", "Trilobites & Arthropodes", "#9c27b0", "bug"
    elif any(w in p or w in c or w in name for w in ["pisc", "fish", "chondrich", "osteich"]):
        return "fish", "Poissons", "#00bcd4", "fish"
    else:
        return "others", "Autres fossiles", "#6c757d", "gem"


def prepare_fossils():
    print("=" * 60)
    print("📦 Préparation des données fossiles pour le Web App...")
    print("=" * 60)

    if not os.path.exists(CSV_PATH):
        print("❌ CSV non trouvé:", CSV_PATH)
        return

    skip_rows = 0
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if "occurrence_no" in line:
                skip_rows = i
                break

    df = pd.read_csv(CSV_PATH, skiprows=skip_rows, low_memory=False)
    df = df.dropna(subset=["lng", "lat"])

    fossils_list = []
    for _, row in df.iterrows():
        cat_id, cat_name, color, icon = categorize_taxon(
            row.get("phylum"), row.get("class"), row.get("accepted_name")
        )

        fossils_list.append({
            "id": int(row.get("occurrence_no", 0)),
            "name": str(row.get("accepted_name", row.get("identified_name", "Fossile inconnu"))),
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "phylum": str(row.get("phylum", "")) if pd.notna(row.get("phylum")) else "",
            "class_name": str(row.get("class", "")) if pd.notna(row.get("class")) else "",
            "period": str(row.get("early_interval", "")) if pd.notna(row.get("early_interval")) else "Période inconnue",
            "formation": str(row.get("formation", "")) if pd.notna(row.get("formation")) else "",
            "max_ma": float(row["max_ma"]) if pd.notna(row.get("max_ma")) else None,
            "min_ma": float(row["min_ma"]) if pd.notna(row.get("min_ma")) else None,
            "category_id": cat_id,
            "category_name": cat_name,
            "color": color,
            "icon": icon
        })

    os.makedirs(os.path.dirname(OUTPUT_FOSSILS_JSON), exist_ok=True)
    with open(OUTPUT_FOSSILS_JSON, "w", encoding="utf-8") as f:
        json.dump(fossils_list, f, ensure_ascii=False, indent=2)

    print(f"✅ {len(fossils_list)} fossiles formatés et enregistrés dans :")
    print(f"   {OUTPUT_FOSSILS_JSON}")


if __name__ == "__main__":
    prepare_fossils()

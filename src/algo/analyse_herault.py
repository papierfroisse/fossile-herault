"""
Analyse statistique des fossiles de l'Hérault (34)
Issu de la Paleobiology Database (PBDB)
"""

import os
import pandas as pd

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
CSV_PATH = os.path.join(PROJECT_DIR, "data", "raw", "pbdb_herault.csv")


def me(df, col_name, top_n=10):
    if col_name in df.columns:
        counts = df[col_name].value_counts().head(top_n)
        return counts
    return pd.Series()


def analyze():
    if not os.path.exists(CSV_PATH):
        print("Fichier non trouvé:", CSV_PATH)
        return

    # Trouve la ligne de header
    skip_rows = 0
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if "occurrence_no" in line:
                skip_rows = i
                break

    df = pd.read_csv(CSV_PATH, skiprows=skip_rows, low_memory=False)
    df = df.dropna(how="all")

    print("=" * 60)
    print("📊 ANALYSE PALÉONTOLOGIQUE DES DONNÉES PBDB — HÉRAULT (34)")
    print("=" * 60)
    print(f"Total d'occurrences répertoriées : {len(df)}")
    print()

    print("--- 🦖 1. Principaux groupes taxonomiques (Classes) ---")
    for cls, count in df["class"].value_counts().head(10).items():
        print(f"  • {cls:<25} : {count} occurrences")
    print()

    print("--- ⏳ 2. Périodes géologiques les plus riches ---")
    for interval, count in df["early_interval"].value_counts().head(10).items():
        print(f"  • {interval:<25} : {count} occurrences")
    print()

    print("--- 🏔️ 3. Formations géologiques les plus fossilifères ---")
    for fm, count in df["formation"].value_counts().head(10).items():
        if pd.isna(fm) or str(fm).strip() == "":
            continue
        print(f"  • {fm:<35} : {count} occurrences")
    print()

    print("--- 🔍 4. Exemples d'espèces / genres emblématiques découverts ---")
    dino_reptiles = df[df["class"].astype(str).str.contains("Reptilia|Dinosauria|Archosauria", case=False, na=False)]
    print(f"  Reptiles / Dinosaures / Archosaures trouvés ({len(dino_reptiles)} occurrences) :")
    for genus in dino_reptiles["accepted_name"].value_counts().head(8).items():
        print(f"    - {genus[0]} ({genus[1]} fois)")

    print("=" * 60)


if __name__ == "__main__":
    analyze()

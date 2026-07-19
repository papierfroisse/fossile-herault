"""
Génère une carte interactive Folium de l'Hérault avec :
  - Les fossiles PBDB (points colorés par type)
  - La carte géologique BRGM (polygones colorés par période)
  - Les carrières/cavités (marqueurs spéciaux)
"""

import os
import sys
import pandas as pd
import geopandas as gpd
import folium
from folium.plugins import MarkerCluster, HeatMap
import json
import glob

# Paths
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
RAW_DIR = os.path.join(PROJECT_DIR, "data", "raw")
OUTPUT_DIR = os.path.join(PROJECT_DIR, "data", "maps")

# Centre de l'Hérault (approximatif)
HERAULT_CENTER = [43.55, 3.45]


def load_pbdb_data():
    """Charge et nettoie les données fossiles PBDB."""
    csv_path = os.path.join(RAW_DIR, "pbdb_herault.csv")
    if not os.path.exists(csv_path):
        print("  [!] Fichier PBDB non trouvé. Lancez d'abord download_herault.py")
        return None

    # Le CSV PBDB a des lignes d'avertissement au début, il faut trouver l'en-tête
    skip_rows = 0
    with open(csv_path, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            if "occurrence_no" in line:
                skip_rows = i
                break

    df = pd.read_csv(csv_path, skiprows=skip_rows, low_memory=False)
    # Supprimer les lignes vides
    df = df.dropna(how="all")
    print(f"  Fossiles PBDB chargés : {len(df)} entrées")

    # Nettoyer les colonnes essentielles
    if "lng" in df.columns and "lat" in df.columns:
        df = df.dropna(subset=["lng", "lat"])
        print(f"  Avec coordonnées valides : {len(df)}")
    elif "lngdeg" in df.columns and "latdeg" in df.columns:
        # Parfois les colonnes s'appellent différemment
        df = df.rename(columns={"lngdeg": "lng", "latdeg": "lat"})
        df = df.dropna(subset=["lng", "lat"])
        print(f"  Avec coordonnées valides : {len(df)}")
    else:
        print(f"  [!] Colonnes de coordonnées introuvables. Colonnes : {list(df.columns)}")
        return None

    return df


def load_brgm_geology():
    """Charge la carte géologique BRGM (shapefile)."""
    brgm_dir = os.path.join(RAW_DIR, "brgm_herault")
    if not os.path.exists(brgm_dir):
        print("  [!] Données BRGM non trouvées.")
        return None

    # Trouver le shapefile principal (formations géologiques)
    shp_files = glob.glob(os.path.join(brgm_dir, "**", "*.shp"), recursive=True)
    print(f"  Shapefiles trouvés : {len(shp_files)}")
    for f in shp_files:
        print(f"    - {os.path.basename(f)}")

    # Chercher le fichier des surfaces/polygones (S_FGEOL)
    geo_shp = None
    # 1. Chercher d'abord les surfaces (S_FGEOL)
    for shp in shp_files:
        basename = os.path.basename(shp).upper()
        if "S_FGEOL" in basename:
            geo_shp = shp
            break

    # 2. Sinon chercher n'importe quel fichier de surface
    if geo_shp is None:
        for shp in shp_files:
            basename = os.path.basename(shp).lower()
            if "s_" in basename or "surface" in basename or "poly" in basename:
                geo_shp = shp
                break

    if geo_shp is None and shp_files:
        # Prendre le premier par défaut
        geo_shp = shp_files[0]

    if geo_shp:
        print(f"  Chargement du shapefile : {os.path.basename(geo_shp)}")
        try:
            gdf = gpd.read_file(geo_shp)
            # Reprojeter en WGS84 si nécessaire
            if gdf.crs and gdf.crs != "EPSG:4326":
                gdf = gdf.to_crs("EPSG:4326")
            print(f"  Formations géologiques chargées : {len(gdf)}")
            print(f"  Colonnes disponibles : {list(gdf.columns)}")
            return gdf
        except Exception as e:
            print(f"  [!] Erreur chargement shapefile : {e}")
            return None

    return None


def load_cavites():
    """Charge les données de cavités souterraines."""
    json_path = os.path.join(RAW_DIR, "cavites_herault.json")
    if not os.path.exists(json_path):
        print("  [!] Données cavités non trouvées.")
        return None

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"  Cavités chargées : {len(data)} entrées")
    return data


def get_fossil_color(row):
    """Retourne une couleur selon le type de fossile."""
    taxon = str(row.get("phylum", row.get("class_name", ""))).lower()
    accepted_name = str(row.get("accepted_name", "")).lower()

    if any(w in taxon for w in ["dinosaur", "reptil", "sauris", "ornithis"]):
        return "red"
    elif any(w in accepted_name for w in ["dinosaur", "saur"]):
        return "red"
    elif any(w in taxon for w in ["mollus", "cephalop", "bivalv", "gastropo"]):
        return "blue"
    elif any(w in taxon for w in ["mammali", "mammal"]):
        return "orange"
    elif any(w in taxon for w in ["plant", "tracheoph"]):
        return "green"
    elif any(w in taxon for w in ["arthropo", "trilob", "insect"]):
        return "purple"
    elif any(w in taxon for w in ["echinod", "crinoid"]):
        return "pink"
    elif any(w in taxon for w in ["brach", "bryoz", "coral", "cnidari"]):
        return "cadetblue"
    elif any(w in taxon for w in ["pisces", "fish", "chondrich", "osteich", "actinopter"]):
        return "darkblue"
    else:
        return "gray"


def get_fossil_icon(row):
    """Retourne une icône Font Awesome selon le type."""
    taxon = str(row.get("phylum", row.get("class_name", ""))).lower()
    accepted_name = str(row.get("accepted_name", "")).lower()

    if any(w in taxon for w in ["dinosaur", "reptil"]) or "saur" in accepted_name:
        return "paw"
    elif any(w in taxon for w in ["mollus"]):
        return "water"
    elif any(w in taxon for w in ["mammali"]):
        return "paw"
    elif any(w in taxon for w in ["plant", "tracheoph"]):
        return "leaf"
    else:
        return "gem"


def create_interactive_map(pbdb_df, geo_gdf, cavites_data):
    """Construit la carte interactive Folium."""
    print("\n" + "=" * 60)
    print("Création de la carte interactive...")
    print("=" * 60)

    # Carte de base
    m = folium.Map(
        location=HERAULT_CENTER,
        zoom_start=10,
        tiles=None
    )

    # Couches de fond
    folium.TileLayer("OpenStreetMap", name="OpenStreetMap").add_to(m)
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        attr="Esri",
        name="Esri Topographique"
    ).add_to(m)
    folium.TileLayer(
        tiles="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr="Esri",
        name="Esri Satellite"
    ).add_to(m)

    # ===== COUCHE PRÉDICTIVE : Zones à haut potentiel (Score >= 50) =====
    geojson_scored = os.path.join(PROJECT_DIR, "data", "processed", "herault_geologie_scored.geojson")
    if os.path.exists(geojson_scored):
        print("  Ajout de la couche PRÉDICTIVE (Zones à haut potentiel)...")
        try:
            gdf_scored = gpd.read_file(geojson_scored)
            # Simplifier la géométrie pour la vitesse d'affichage web
            gdf_scored["geometry"] = gdf_scored["geometry"].simplify(0.0008)

            def style_predictive(feature):
                score = feature["properties"].get("score_potentiel", 50)
                color = "#ffaa00" if score < 70 else "#ff1100"
                return {
                    "fillColor": color,
                    "color": "#990000",
                    "weight": 1.5,
                    "fillOpacity": 0.4
                }

            pred_layer = folium.GeoJson(
                gdf_scored.to_json(),
                name="🎯 PREDICTION : Zones a Haut Potentiel (535 zones)",
                style_function=style_predictive,
                tooltip=folium.GeoJsonTooltip(
                    fields=["NOTATION", "DESCR", "score_potentiel", "niveau_potentiel"],
                    aliases=["Code :", "Description :", "Score Potentiel (0-100) :", "Niveau :"],
                    localize=True
                ),
                show=True  # Visible par défaut !
            )
            pred_layer.add_to(m)
            print(f"  [OK] {len(gdf_scored)} zones prédictives affichées")
        except Exception as e:
            print(f"  [!] Erreur ajout couche prédictive : {e}")

    # ===== COUCHE 1 : Géologie BRGM globale =====
    if geo_gdf is not None and len(geo_gdf) > 0:
        print("  Ajout de la couche géologique...")

        # Simplifier la géométrie pour les performances web
        geo_simplified = geo_gdf.copy()
        geo_simplified["geometry"] = geo_simplified["geometry"].simplify(0.001)

        # Déterminer la colonne de description
        desc_col = None
        for candidate in ["DESCR", "NOTATION", "TYPE", "LITHO", "CODE", "LABEL", "NATURE"]:
            if candidate in geo_simplified.columns:
                desc_col = candidate
                break

        age_col = None
        for candidate in ["ERA", "PERIOD", "AGE", "EPOQUE", "PERIODE", "C_PERIOD"]:
            if candidate in geo_simplified.columns:
                age_col = candidate
                break

        # Créer une couche GeoJSON avec style
        def style_function(feature):
            return {
                "fillColor": "#3388ff",
                "color": "#333333",
                "weight": 0.5,
                "fillOpacity": 0.15
            }

        geo_layer = folium.GeoJson(
            geo_simplified.to_json(),
            name="Geologie BRGM (formations)",
            style_function=style_function,
            tooltip=folium.GeoJsonTooltip(
                fields=[c for c in [desc_col, age_col] if c is not None],
                aliases=[c for c in [desc_col, age_col] if c is not None],
                localize=True
            ) if (desc_col or age_col) else None,
            show=False  # Masquée par défaut (performance)
        )
        geo_layer.add_to(m)
        print(f"  [OK] {len(geo_simplified)} formations ajoutées")

    # ===== COUCHE 2 : Fossiles PBDB =====
    if pbdb_df is not None and len(pbdb_df) > 0:
        print("  Ajout des fossiles PBDB...")

        fossil_cluster = MarkerCluster(name="Fossiles PBDB (clusters)")

        for _, row in pbdb_df.iterrows():
            lat, lng = row["lat"], row["lng"]
            color = get_fossil_color(row)
            icon = get_fossil_icon(row)

            # Construire le popup
            name = row.get("accepted_name", row.get("identified_name", "Inconnu"))
            period = row.get("early_interval", row.get("max_ma", "?"))
            phylum = row.get("phylum", "?")
            class_name = row.get("class", row.get("class_name", "?"))
            formation = row.get("formation", "?")

            popup_html = f"""
            <div style='font-family: Arial; min-width: 200px;'>
                <h4 style='color: {color}; margin: 0;'>{name}</h4>
                <hr style='margin: 4px 0;'>
                <b>Phylum :</b> {phylum}<br>
                <b>Classe :</b> {class_name}<br>
                <b>Periode :</b> {period}<br>
                <b>Formation :</b> {formation}<br>
                <b>Coords :</b> {lat:.4f}, {lng:.4f}
            </div>
            """

            folium.Marker(
                location=[lat, lng],
                popup=folium.Popup(popup_html, max_width=300),
                tooltip=f"{name}",
                icon=folium.Icon(color=color, icon=icon, prefix="fa")
            ).add_to(fossil_cluster)

        fossil_cluster.add_to(m)
        print(f"  [OK] {len(pbdb_df)} fossiles ajoutés en clusters")

        # Heatmap des fossiles
        heat_data = [[row["lat"], row["lng"]] for _, row in pbdb_df.iterrows()]
        HeatMap(
            heat_data,
            name="Heatmap densité fossiles",
            radius=20,
            blur=15,
            max_zoom=12,
            show=False
        ).add_to(m)

    # ===== COUCHE 3 : Cavités souterraines =====
    if cavites_data and len(cavites_data) > 0:
        print("  Ajout des cavités souterraines...")
        cavite_group = folium.FeatureGroup(name="Cavites / Carrieres (Georisques)", show=False)

        n_added = 0
        for cav in cavites_data:
            # Extraire les coordonnées selon la structure de l'API
            lat = cav.get("latitude") or cav.get("lat")
            lng = cav.get("longitude") or cav.get("lon") or cav.get("lng")

            if lat is None or lng is None:
                # Essayer dans un sous-objet "coordonnees" ou "geometry"
                coord = cav.get("coordonnees", {})
                lat = coord.get("latitude") or coord.get("lat")
                lng = coord.get("longitude") or coord.get("lon")

            if lat is not None and lng is not None:
                try:
                    lat, lng = float(lat), float(lng)
                except (ValueError, TypeError):
                    continue

                nom = cav.get("nom", cav.get("type", "Cavité"))
                type_cav = cav.get("type_cavite", cav.get("type", "Inconnu"))

                popup_html = f"""
                <div style='font-family: Arial;'>
                    <h4>Cavite souterraine</h4>
                    <b>Nom :</b> {nom}<br>
                    <b>Type :</b> {type_cav}
                </div>
                """

                folium.Marker(
                    location=[lat, lng],
                    popup=folium.Popup(popup_html, max_width=250),
                    tooltip=f"Cavite: {nom}",
                    icon=folium.Icon(color="darkred", icon="industry", prefix="fa")
                ).add_to(cavite_group)
                n_added += 1

        cavite_group.add_to(m)
        print(f"  [OK] {n_added} cavités ajoutées")

    # ===== SITES EMBLEMATIQUES HERAULT =====
    print("  Ajout des sites emblématiques...")
    sites_emblematiques = [
        {"name": "Dalle de la Lieude (Permien, ~270 Ma)", "lat": 43.6533, "lng": 3.3478,
         "desc": "900+ empreintes de therapsides sur dalle de ruffe rouge. Site protege."},
        {"name": "Musee-Parc des Dinosaures de Meze", "lat": 43.4278, "lng": 3.6056,
         "desc": "Milliers d'oeufs de dinosaures du Cretace superieur (70-75 Ma). Ossements d'ankylosaures."},
        {"name": "Site de Cruzy (Montplo/Massecaps)", "lat": 43.3625, "lng": 2.9375,
         "desc": "Ossements de dinosaures du Cretace superieur."},
        {"name": "Musee de Lodeve - Paleontologie", "lat": 43.7317, "lng": 3.3192,
         "desc": "Musee de reference. Fossiles locaux sur 540 Ma d'histoire. Crocodile marin jurassique."},
        {"name": "Grotte de Clamouse", "lat": 43.7050, "lng": 3.6167,
         "desc": "Formations geologiques remarquables dans le calcaire jurassique."},
    ]

    sites_group = folium.FeatureGroup(name="Sites emblematiques Herault")
    for site in sites_emblematiques:
        folium.Marker(
            location=[site["lat"], site["lng"]],
            popup=folium.Popup(
                f"<div style='font-family:Arial; min-width:200px;'>"
                f"<h4 style='color:#d4380d;'>{site['name']}</h4>"
                f"<p>{site['desc']}</p></div>",
                max_width=300
            ),
            tooltip=site["name"],
            icon=folium.Icon(color="red", icon="star", prefix="fa")
        ).add_to(sites_group)
    sites_group.add_to(m)

    # ===== LÉGENDE =====
    legend_html = """
    <div style="position: fixed; bottom: 30px; right: 30px; z-index: 1000;
                background: rgba(255, 255, 255, 0.95); padding: 14px; border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial;
                font-size: 12px; max-width: 230px;">
        <b style="font-size: 14px; color: #111;">🎯 Prédictions Fossile</b><br>
        <i style="background: #ff1100; opacity: 0.6; display: inline-block; width: 12px; height: 12px; border: 1px solid #900;"></i> Potentialité Très Élevée (Score ≥ 70)<br>
        <i style="background: #ffaa00; opacity: 0.6; display: inline-block; width: 12px; height: 12px; border: 1px solid #900;"></i> Potentialité Élevée (Score ≥ 50)<br>
        <hr style="margin: 8px 0;">
        <b style="font-size: 13px;">📌 Découvertes PBDB</b><br>
        <i style="color: red;">&#9679;</i> Dinosaures / Reptiles<br>
        <i style="color: blue;">&#9679;</i> Mollusques (ammonites...)<br>
        <i style="color: darkblue;">&#9679;</i> Poissons<br>
        <i style="color: orange;">&#9679;</i> Mammifères<br>
        <i style="color: green;">&#9679;</i> Plantes<br>
        <i style="color: purple;">&#9679;</i> Arthropodes / Trilobites<br>
        <i style="color: gray;">&#9679;</i> Autres<br>
        <hr style="margin: 8px 0;">
        <i style="color: red;">&#9733;</i> Sites emblématiques Hérault
    </div>
    """
    m.get_root().html.add_child(folium.Element(legend_html))

    # Contrôle des couches
    folium.LayerControl(collapsed=False).add_to(m)

    # Sauvegarder
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, "carte_herault.html")
    m.save(output_path)
    print(f"\n  Carte sauvegardée : {output_path}")
    print(f"  Ouvrez ce fichier dans votre navigateur !")

    return output_path


if __name__ == "__main__":
    print("=" * 60)
    print("FOSSILE - Carte interactive de l'Herault (34)")
    print("=" * 60)

    # Charger les données
    print("\n--- Chargement des données ---")
    pbdb_df = load_pbdb_data()
    geo_gdf = load_brgm_geology()
    cavites = load_cavites()

    # Générer la carte
    map_path = create_interactive_map(pbdb_df, geo_gdf, cavites)

    print("\n[DONE] Carte interactive generee avec succes !")

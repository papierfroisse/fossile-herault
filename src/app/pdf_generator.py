"""
Générateur de Rapports de Prospection Paléontologique PDF pour l'Hérault (34)
Utilise ReportLab pour produire un document PDF professionnel et imprimable.
"""

import os
import io
import json
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
PROCESSED_DIR = os.path.join(PROJECT_DIR, "data", "processed")
FOSSILS_JSON = os.path.join(PROCESSED_DIR, "fossils_herault.json")
GEOJSON_PATH = os.path.join(PROCESSED_DIR, "herault_geologie_scored.geojson")
QUARRIES_PATH = os.path.join(PROCESSED_DIR, "carrieres_herault.geojson")


def generate_prospecting_pdf(lat: float, lng: float, location_name: str = "Zone Hérault"):
    """
    Génère un PDF de rapport de prospection paléontologique pour les coordonnées GPS (lat, lng).
    Retourne les octets du fichier PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
        spaceAfter=15
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155")
    )

    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor("#0284c7")
    )

    story = []

    # ===== HEADER =====
    story.append(Paragraph("🦕 FOSSILE — Rapport de Prospection", title_style))
    story.append(Paragraph(f"<b>Secteur :</b> {location_name} | <b>Coordonnées GPS :</b> {lat:.4f}° N, {lng:.4f}° E | <b>Département :</b> Hérault (34)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=15))

    # ===== 1. ÉVALUATION DU POTENTIEL & GÉOLOGIE =====
    story.append(Paragraph("1. Évaluation du Potentiel & Contexte Géologique", section_heading))

    # Recherche de la formation géologique au point
    score_val = 55
    niveau = "Élevé 🟢"
    code_geo = "Indéterminé"
    desc_geo = "Formation sédimentaire du bassin permien/mesozoïque"

    if os.path.exists(GEOJSON_PATH):
        try:
            gdf = gpd.read_file(GEOJSON_PATH)
            pt = Point(lng, lat)
            matching = gdf[gdf.geometry.contains(pt)]
            if len(matching) > 0:
                row = matching.iloc[0]
                score_val = row.get("score_potentiel", 55)
                niveau = row.get("niveau_potentiel", "Élevé 🟢")
                code_geo = row.get("NOTATION", "N/A")
                desc_geo = row.get("DESCR", desc_geo)
        except Exception:
            pass

    # Dynamic color for score
    score_color = colors.HexColor("#d97706")
    if score_val >= 70:
        score_color = colors.HexColor("#dc2626")
    elif score_val < 50:
        score_color = colors.HexColor("#65a30d")

    summary_table_data = [
        [Paragraph("<b>Score Prédictif :</b>", body_style), Paragraph(f"<font color='{score_color.hexval()}'><b>{score_val} / 100</b> ({niveau})</font>", body_style)],
        [Paragraph("<b>Code Géologique BRGM :</b>", body_style), Paragraph(code_geo, body_style)],
        [Paragraph("<b>Description de la Roche :</b>", body_style), Paragraph(desc_geo, body_style)],
        [Paragraph("<b>Accessibilité du Terrain :</b>", body_style), Paragraph("Affleurements sédimentaires sensibles à l'érosion", body_style)]
    ]

    t_summary = Table(summary_table_data, colWidths=[4.5 * cm, 12.5 * cm])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BORDER', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 12))

    # ===== 2. DÉCOUVERTES CERTIFIÉES À PROXIMITÉ =====
    story.append(Paragraph("2. Découvertes Certifiées à Proximité (< 10 km)", section_heading))

    nearby_fossils = []
    if os.path.exists(FOSSILS_JSON):
        try:
            with open(FOSSILS_JSON, "r", encoding="utf-8") as f:
                fossils = json.load(f)

            # Calculer distance rapide (Euclidienne deg)
            for fos in fossils:
                dist_deg = ((fos["lat"] - lat)**2 + (fos["lng"] - lng)**2)**0.5
                dist_km = dist_deg * 111.0  # Approx
                if dist_km <= 15.0:
                    nearby_fossils.append((dist_km, fos))

            nearby_fossils.sort(key=lambda x: x[0])
        except Exception:
            pass

    if nearby_fossils:
        table_fossils = [
            [Paragraph("<b>Distance</b>", body_style), Paragraph("<b>Nom Scientifique</b>", body_style), Paragraph("<b>Catégorie</b>", body_style), Paragraph("<b>Période / Formation</b>", body_style)]
        ]
        for dist_km, f in nearby_fossils[:6]:
            table_fossils.append([
                Paragraph(f"{dist_km:.1f} km", body_style),
                Paragraph(f"<i>{f['name']}</i>", body_style),
                Paragraph(f['category_name'], body_style),
                Paragraph(f"{f['period']} ({f['formation'] or 'N/A'})", body_style)
            ])

        t_fossils = Table(table_fossils, colWidths=[2.5 * cm, 5.5 * cm, 4.5 * cm, 4.5 * cm])
        t_fossils.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e0f2fe")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(t_fossils)
    else:
        story.append(Paragraph("<i>Aucune découverte historique directe à moins de 15 km dans la base PBDB. Zone sous-prospectée = opportunité !</i>", body_style))

    story.append(Spacer(1, 12))

    # ===== 3. GUIDE D'IDENTIFICATION SUR LE TERRAIN =====
    story.append(Paragraph("3. Guide d'Identification Visuelle des Fossiles de l'Hérault", section_heading))

    guide_data = [
        [Paragraph("<b>Ce que vous voyez :</b>", body_style), Paragraph("<b>Taxon probable :</b>", body_style), Paragraph("<b>Indices de reconnaissance :</b>", body_style)],
        [Paragraph("Rameau feuillé / sapin", body_style), Paragraph("<i>Walchia piniformis</i> / Conifère", body_style), Paragraph("Petites aiguilles serrées en spirale, pellicule noire charbonneuse.", body_style)],
        [Paragraph("Fougère découpée 3 lobes", body_style), Paragraph("<i>Rhachiphyllum lyratifolia</i>", body_style), Paragraph("Pinnules arrondies à 3 lobes dans les siltites grises/ocres.", body_style)],
        [Paragraph("Grandes feuilles rubanées", body_style), Paragraph("<i>Taeniopteris sp.</i>", body_style), Paragraph("Feuille allongée avec une nervure centrale nette.", body_style)],
        [Paragraph("Ossements / Empreintes", body_style), Paragraph("Reptiles / Thérapsides / Dinosaures", body_style), Paragraph("Empreintes de pas sur grès/ruffes rouges (Salagou, Mèze, Cruzy).", body_style)]
    ]
    t_guide = Table(guide_data, colWidths=[4.5 * cm, 5.0 * cm, 7.5 * cm])
    t_guide.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_guide)
    story.append(Spacer(1, 12))

    # ===== 4. CONSEILS DE SÉCURITÉ ET LÉGALITÉ =====
    story.append(Paragraph("4. Rappels Légaux et Consignes de Prospection", section_heading))
    legal_text = (
        "• <b>Propriété Privée / Domaine Public :</b> Obtenez toujours l'accord du propriétaire du terrain avant de prospecter.<br/>"
        "• <b>Préservation des Sites :</b> Le prélèvement doit rester modéré. Ne dégradez jamais les affleurements rocheux naturels.<br/>"
        "• <b>Découvertes Majeures :</b> En cas de découverte exceptionnelle (os de dinosaure, empreintes), signalez-la au <b>Service Régional de l'Archéologie (SRA / DRAC Occitanie)</b> ou aux musées locaux (Musée de Lodève / Mèze / Cruzy)."
    )
    story.append(Paragraph(legal_text, body_style))

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

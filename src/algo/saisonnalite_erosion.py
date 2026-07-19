"""
Module d'Indice de Saisonnalité & Érosion Météo — Hérault (34)

Calcule les meilleures fenêtres de prospection sur le terrain en fonction :
1. Des épisodes cévenols et fortes pluies d'automne/printemps (ravinement des ruffes du Salagou).
2. Du gel/dégel hivernal (éclatement des marnes jurassiques de Fontaneilles et schistes de Saint-Chinian).
3. Du taux d'exposition de la roche fraîche récemment dénudée.
"""

import datetime

MONTH_NAMES_FR = [
    "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
]

# Modèle de saisonnalité d'érosion pour l'Hérault (Basé sur le climat méditerranéen / Cévenol)
EROSION_CALENDAR = {
    1:  {"score": 88, "condition": "Forte Érosion (Gel/Dégel)", "conseil": "Excellent pour le schiste et les marnes (éclatement par le gel). Attention aux sols glissants."},
    2:  {"score": 92, "condition": "Fenêtre Optimale Hivernale", "conseil": "Meilleure période post-gel ! Les parois de marnes et schistes ont libéré de nouveaux fossiles."},
    3:  {"score": 85, "condition": "Pluies de Printemps", "conseil": "Très bon nettoyage naturel des ruisseaux et ruffes. Végétation encore basse."},
    4:  {"score": 78, "condition": "Prospection Printanière", "conseil": "Bonnes conditions météo. Les ravines du Salagou et du Lodévois sont bien dégagées."},
    5:  {"score": 65, "condition": "Végétation Naissante", "conseil": "Végétation dense qui commence à couvrir certains affleurements. Privilégier les carrières et falaises."},
    6:  {"score": 45, "condition": "Sécheresse / Poussière", "conseil": "Roche très sèche et sol durs. Visibilité réduite sous la poussière sur les ruffes rouges."},
    7:  {"score": 35, "condition": "Chaleur / Fort Ensoleillement", "conseil": "Conditions difficiles sur le terrain. Privilégier les zones ombragées et les bords de rivières."},
    8:  {"score": 30, "condition": "Sécheresse Estivale", "conseil": "Sol très sec. Prévoir beaucoup d'eau. Bonne visibilité dans le lit des cours d'eau asséchés."},
    9:  {"score": 75, "condition": "Reprises des Orages Cévenols", "conseil": "Début des orages d'automne. Le ravinement commence à mettre à nu des couches fraîches."},
    10: {"score": 95, "condition": "Fenêtre Optimale Cévenole ⚡", "conseil": "Période N°1 dans l'Hérault ! Post orages d'automne : les ruffes et argiles sont décapées par le ruissellement."},
    11: {"score": 90, "condition": "Érosion Pluviale Intense", "conseil": "Excellent post-pluies. Prospection idéale dans les lits de ruisseaux et ravines."},
    12: {"score": 82, "condition": "Début du Gel Hivernal", "conseil": "Bonne visibilité. Début de la fragmentation thermique des roches sédimentaires tendres."}
}


def get_current_prospection_status():
    today = datetime.date.today()
    month_num = today.month
    info = EROSION_CALENDAR.get(month_num, EROSION_CALENDAR[10])

    return {
        "mois": MONTH_NAMES_FR[month_num],
        "mois_num": month_num,
        "score_saison": info["score"],
        "condition": info["condition"],
        "conseil": info["conseil"],
        "calendrier_complet": EROSION_CALENDAR
    }


if __name__ == "__main__":
    status = get_current_prospection_status()
    print("=" * 60)
    print(f"🌦️ INDICE DE SAISONNALITÉ DE PROSPECTION — {status['mois'].upper()}")
    print("=" * 60)
    print(f"  • Score d'érosion/visibilité : {status['score_saison']} / 100")
    print(f"  • Condition météo terrain   : {status['condition']}")
    print(f"  • Conseil tactique          : {status['conseil']}")

# 🦕 Recherche — Toutes les Techniques et Astuces pour Trouver des Fossiles

Ce document recense l'ensemble des techniques, indicateurs et données exploitables
pour maximiser les chances de localiser des gisements fossilifères.

---

## 🗺️ COUCHE 1 — Géologie (La base absolue)

Les fossiles ne se trouvent **que dans les roches sédimentaires**. C'est le premier filtre.

### Types de roches favorables (par ordre de potentiel)
| Roche | Potentiel | Fossiles typiques |
|-------|-----------|-------------------|
| **Calcaire** | ⭐⭐⭐⭐⭐ | Ammonites, bivalves, coraux, crinoïdes |
| **Marne** (calcaire + argile) | ⭐⭐⭐⭐⭐ | Ammonites, vertébrés marins, poissons |
| **Schiste** | ⭐⭐⭐⭐ | Empreintes végétales, trilobites |
| **Grès** | ⭐⭐⭐ | Empreintes de pas, bois pétrifié |
| **Argile** | ⭐⭐⭐ | Mollusques, micro-fossiles |
| **Craie** | ⭐⭐⭐ | Oursins, bélemnites, foraminifères |
| **Silex** (nodules dans calcaire) | ⭐⭐ | Éponges, micro-organismes |

### Types de roches DÉFAVORABLES (à exclure du scoring)
- **Granit, basalte, gneiss** (roches magmatiques/métamorphiques) → Pas de fossiles
- **Roches volcaniques** → Sauf cas exceptionnels (cendres fossilisantes)

### Périodes géologiques clés en France
| Période | Âge (Ma) | Ce qu'on trouve | Régions françaises |
|---------|----------|-----------------|-------------------|
| **Jurassique** | 201-145 | Ammonites, dinosaures, ichtyosaures | Jura, Bourgogne, Normandie, Causses |
| **Crétacé** | 145-66 | Dinosaures, ammonites géantes, rudistes | Provence, Charentes, Pyrénées |
| **Éocène** | 56-34 | Mammifères primitifs, poissons, plantes | Bassin parisien, Quercy |
| **Miocène** | 23-5 | Coquillages, requins, mammifères | Aquitaine, Touraine, vallée du Rhône |
| **Carbonifère** | 359-299 | Fougères géantes, arthropodes | Nord, Massif Central |
| **Dévonien** | 419-359 | Trilobites, premiers poissons | Ardennes, Bretagne, Massif armoricain |

---

## 🏔️ COUCHE 2 — Morphologie du Terrain (Où la roche est accessible)

Un fossile enterré sous 50m de terre est invisible. Il faut des **zones d'affleurement**
où la roche est exposée en surface.

### Indicateurs d'affleurement (intégrables dans l'algo)
1. **Pente forte** (calculable via LiDAR/MNT) → Les versants raides exposent la roche
2. **Proximité de cours d'eau** → L'érosion fluviale creuse et expose les couches
3. **Falaises côtières** → L'érosion marine dégage en permanence de nouveaux fossiles
4. **Ravines et badlands** → Érosion intense = affleurements massifs
5. **Alternance calcaire/marne** → Les marnes s'érodent, libérant les fossiles des bancs calcaires au-dessus
6. **Champs labourés après pluie** → Le labour remonte les fossiles en surface

### Données exploitables
- **MNT (Modèle Numérique de Terrain)** → Calcul de pente, orientation, rugosité
- **Réseau hydrographique** (BD TOPO IGN) → Proximité des rivières
- **Trait de côte** (Géoportail) → Identification des falaises en érosion

---

## 🏭 COUCHE 3 — Carrières et Sites Artificiels

Les carrières (actives ou abandonnées) sont des **fenêtres ouvertes sur le sous-sol**.

### Types de sites
| Site | Pourquoi c'est intéressant | Donnée source |
|------|---------------------------|---------------|
| **Carrières abandonnées** | Parois exposées sur des dizaines de mètres de profondeur | BDCavités (BRGM/Géorisques) |
| **Carrières actives** | Nouvelles couches dégagées en permanence (accès restreint) | Base des carrières BRGM |
| **Chantiers de construction** | Terrassements temporaires exposant le sous-sol | Permis de construire (communes) |
| **Tranchées routières/ferroviaires** | Coupes géologiques linéaires sur des km | Cartographie IGN |

### Source de données
- **API Géorisques** : `https://georisques.gouv.fr/` → Inventaire national des cavités souterraines
- **BDCavités BRGM** : Téléchargement CSV/Shapefile via data.gouv.fr
- **Géoportail** : Couche "Carrières" visible en superposition

---

## 🛰️ COUCHE 4 — Télédétection et Technologies Avancées

### LiDAR HD (IGN)
- **Résolution** : ≥10 points/m² (ultra-précis)
- **Utilité** : Détecter les micro-reliefs invisibles à l'œil nu sous la végétation
  - Anciens affleurements masqués par la forêt
  - Structures géologiques (failles, plissements)
  - Carrières oubliées envahies par la végétation
- **Source** : cartes.gouv.fr (Open Data, format .copc.laz)

### Imagerie satellite multispectrale
- **Principe** : Les roches sédimentaires riches en fossiles ont des signatures spectrales
  spécifiques (réflectance infrarouge différente des roches magmatiques)
- **Sources** : Sentinel-2 (ESA, gratuit, 10m résolution), Landsat (NASA, gratuit)
- **Utilité algo** : Classifier automatiquement les types de sols/roches visibles

### Analyse d'érosion par comparaison temporelle
- **Principe** : Comparer des images satellite prises à plusieurs années d'intervalle
  pour détecter les zones où l'érosion est active (= nouveaux affleurements)
- **Sources** : Google Earth Engine (archive Landsat depuis 1984)

---

## 📚 COUCHE 5 — Données Historiques et Communautaires

### Découvertes existantes (PBDB)
- Chaque découverte fossile documentée = un "vote" pour la zone géologique environnante
- **Clustering** : Les zones proches de découvertes existantes ont plus de chances d'en contenir d'autres
- **Zones sous-prospectées** : Les zones géologiquement similaires mais sans découverte = OPPORTUNITÉ

### Publications scientifiques
- Rapports de fouilles du CNRS, Muséum national d'Histoire naturelle
- Thèses universitaires (HAL, theses.fr)
- Forums communautaires (Géoforum, univers-fossile.com)

### Sites protégés et réserves géologiques
| Réserve | Région | Spécialité |
|---------|--------|------------|
| Réserve géologique de Haute-Provence | PACA | Ammonites, ichtyosaures |
| Réserve de Saucats-La Brède | Gironde | Coquillages miocènes |
| Falaises des Vaches Noires | Calvados | Vertébrés marins jurassiques |
| Dalle à empreintes de Plagne | Ain | Plus grandes empreintes de dinosaures au monde |
| Phosphatières du Quercy | Lot | Mammifères éocènes |

---

## 🧮 COUCHE 6 — Facteurs de Scoring pour l'Algorithme

Chaque couche de données contribue à un **score de potentiel fossilifère** :

```
Score = w1 × Géologie
      + w2 × Affleurement
      + w3 × Proximité_découvertes
      + w4 × Érosion_active
      + w5 × Carrières_proches
      + w6 × Sous_prospection
      - p1 × Zone_protégée
      - p2 × Urbanisation
```

### Facteurs positifs (boosters)
| Facteur | Poids estimé | Justification |
|---------|-------------|---------------|
| Roche sédimentaire d'âge favorable | Très fort | Condition nécessaire |
| Pente > 15° (affleurement probable) | Fort | Roche exposée |
| Proximité cours d'eau (< 500m) | Fort | Érosion fluviale |
| Falaise côtière en érosion | Très fort | Renouvellement permanent |
| Carrière abandonnée dans un rayon de 2km | Fort | Fenêtre sur le sous-sol |
| Découverte PBDB dans un rayon de 10km | Moyen | Clustering spatial |
| Zone géologiquement similaire mais sans découverte | Moyen | Opportunité de prospection |
| Alternance calcaire/marne détectée | Fort | Mécanisme de libération naturelle |

### Facteurs négatifs (malus)
| Facteur | Poids estimé | Justification |
|---------|-------------|---------------|
| Roche magmatique/métamorphique | Éliminatoire | Pas de fossiles possibles |
| Zone urbanisée dense | Fort | Terrain inaccessible |
| Zone protégée (réserve naturelle) | Information | Prospection interdite sans autorisation |
| Couvert forestier dense sans LiDAR | Faible | Affleurement masqué mais pas absent |

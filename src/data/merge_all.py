import json, os, glob

def compute_predictive_score(item):
    score = 50
    
    # Source scoring
    src = item.get('source', 'PBDB')
    if src == 'MNHN':
        score += 20
    elif src == 'BRGM':
        score += 15
    elif src == 'PBDB':
        score += 10
        
    # Spatial precision scoring
    precision = item.get('precision_code', 'medium')
    if precision == 'high' or 'Certifié' in str(item.get('precision_gps', '')):
        score += 15
    elif precision == 'medium':
        score += 8

    # Taxon rarity & interest scoring
    cat = item.get('category_id', 'others')
    if cat == 'dinosaurs_reptiles':
        score += 15
    elif cat in ['trilobites', 'arthropods', 'mammals']:
        score += 12
    elif cat in ['molluscs', 'fish']:
        score += 8
    elif cat == 'plants':
        score += 10

    # Era scoring
    period = str(item.get('period', '')).lower()
    if any(p in period for p in ['permian', 'triassic', 'jurassic', 'cretaceous']):
        score += 10

    return min(98, max(35, score))

all_fossils = []
dept_dirs = sorted(glob.glob('processed/*/fossils.json'))
for dept_dir in dept_dirs:
    code = dept_dir.replace('\\', '/').split('/')[1]
    if code == 'all_france.json':
        continue
    with open(dept_dir, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            item['department'] = code
            item['score_potentiel'] = compute_predictive_score(item)
        all_fossils.extend(data)

with open('processed/all_france.json', 'w', encoding='utf-8') as f:
    json.dump(all_fossils, f, ensure_ascii=False)

os.makedirs('public/processed', exist_ok=True)
with open('public/processed/all_france.json', 'w', encoding='utf-8') as f:
    json.dump(all_fossils, f, ensure_ascii=False)

print(f"Merged {len(all_fossils)} fossils with predictive scores across {len(dept_dirs)} departments into all_france.json")

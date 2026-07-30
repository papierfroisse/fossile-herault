import json, os, glob

# Generate a lightweight France overview summary (~2000 top representative fossils across all 94 departments)
# plus per-department fossil counts & bounds for ultra-fast startup (<150KB)

summary_fossils = []
dept_stats = {}

files = sorted(glob.glob('processed/*/fossils.json'))
for fpath in files:
    code = fpath.replace('\\', '/').split('/')[1]
    if code == 'all_france.json':
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
        dept_stats[code] = len(data)
        
        # Select top scoring / certified specimens per department for the national summary
        # Pick top 25-30 items per department
        sorted_items = sorted(data, key=lambda x: (x.get('score_potentiel', 50), 1 if x.get('source')=='MNHN' else 0), reverse=True)
        sample = sorted_items[:30]
        summary_fossils.extend(sample)

summary_data = {
    "total_fossils": sum(dept_stats.values()),
    "department_counts": dept_stats,
    "summary_fossils": summary_fossils
}

with open('processed/france_summary.json', 'w', encoding='utf-8') as f:
    json.dump(summary_data, f, ensure_ascii=False)

os.makedirs('public/processed', exist_ok=True)
with open('public/processed/france_summary.json', 'w', encoding='utf-8') as f:
    json.dump(summary_data, f, ensure_ascii=False)

print(f"Generated france_summary.json with {len(summary_fossils)} representative fossils from {len(dept_stats)} departments.")

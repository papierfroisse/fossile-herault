import json, os, glob

all_fossils = []
dept_dirs = sorted(glob.glob('processed/*/fossils.json'))
for dept_dir in dept_dirs:
    code = dept_dir.replace('\\', '/').split('/')[1]
    with open(dept_dir, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for item in data:
            item['department'] = code
        all_fossils.extend(data)

with open('processed/all_france.json', 'w', encoding='utf-8') as f:
    json.dump(all_fossils, f, ensure_ascii=False)

os.makedirs('public/processed', exist_ok=True)
with open('public/processed/all_france.json', 'w', encoding='utf-8') as f:
    json.dump(all_fossils, f, ensure_ascii=False)

print(f"Merged {len(all_fossils)} fossils from {len(dept_dirs)} departments into all_france.json")

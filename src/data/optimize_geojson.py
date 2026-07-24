import json
import os

def round_coords(coords, precision=4):
    """Recursively round coordinates to specified decimal places."""
    if isinstance(coords, (int, float)):
        return round(coords, precision)
    elif isinstance(coords, list):
        return [round_coords(c, precision) for c in coords]
    return coords

def optimize_geojson(input_path, output_path, precision=4):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    orig_size = os.path.getsize(input_path) / (1024 * 1024)
    print(f"Optimizing {input_path} ({orig_size:.2f} MB)...")

    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if 'features' in data:
        for feature in data['features']:
            if 'geometry' in feature and 'coordinates' in feature['geometry']:
                feature['geometry']['coordinates'] = round_coords(feature['geometry']['coordinates'], precision)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)

    new_size = os.path.getsize(output_path) / (1024 * 1024)
    reduction = ((orig_size - new_size) / orig_size) * 100
    print(f"Done: {output_path} ({new_size:.2f} MB) -> {reduction:.1f}% size reduction!")

if __name__ == '__main__':
    optimize_geojson('processed/rivieres_herault.geojson', 'processed/rivieres_herault.geojson', precision=4)
    optimize_geojson('processed/herault_geologie_pentes.geojson', 'processed/herault_geologie_pentes.geojson', precision=4)

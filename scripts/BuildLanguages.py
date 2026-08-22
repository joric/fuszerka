import os
import json
from pathlib import Path

# CONFIGURATION - Edit these paths
SOURCE_DIR = r"C:\Temp\Localization"
OUTPUT_DIR = r"..\data\Localization"
LANGUAGES = ["en", "ru", "fr", "pl", "uk", "de", "zh"]

for lang in LANGUAGES:
    lang_path = Path(SOURCE_DIR) / lang
    if not lang_path.exists():
        print(f"Skipping {lang} - folder not found")
        continue
    
    merged = {}
    for json_file in lang_path.glob("*.json"):
        with open(json_file, 'r', encoding='utf-8-sig') as f:  # Changed to utf-8-sig
            data = json.load(f)
            for entry in data.get('entries', []):
                merged[str(entry['key'])] = entry['value']
    
    if merged:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        output_file = Path(OUTPUT_DIR) / f"{lang}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)
        print(f"Created {output_file} with {len(merged)} entries")

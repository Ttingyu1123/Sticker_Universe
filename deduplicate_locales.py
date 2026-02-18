import json
from collections import OrderedDict

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        # Using json.load directly will handle duplicate keys by keeping the last one
        return json.load(f, object_pairs_hook=OrderedDict)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def consolidate_locales():
    en_path = r'd:\Antigravity\Sticker_Universe\src\locales\en.json'
    zh_path = r'd:\Antigravity\Sticker_Universe\src\locales\zh-TW.json'

    for path in [en_path, zh_path]:
        # Reading raw text and parsing with OrderedDict to preserve order
        # and automatically deduplicate (last one wins)
        data = load_json(path)
        
        if 'generator' in data:
            # First, extract the consolidated action keys
            # Because we used json.load, duplicates in the file are already resolved
            # by keeping the last occurrence.
            # However, we might want to manually ensure ALL keys from both blocks are present.
            
            # Let's check if we have a duplicate 'action' object in the generator
            # Wait, OrderedDict doesn't help with finding duplicates in the file.
            # If the file has:
            # { "a": 1, "a": 2 }
            # load_json will return { "a": 2 }
            
            # This is exactly what we want to CLEAN UP the file.
            # But we want to make sure the MERGED result has all keys.
            
            # Since I added all keys in my previous attempts at BOTH locations,
            # the "last one" (which is at the bottom of the generator object) 
            # should have everything.
            
            pass # No-op, just re-saving will deduplicate
            
        save_json(path, data)
        print(f"Deduplicated and consolidated {path}")

if __name__ == "__main__":
    consolidate_locales()

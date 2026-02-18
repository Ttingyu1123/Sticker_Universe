import json
from collections import OrderedDict

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f, object_pairs_hook=OrderedDict)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def fix_sticker_locales():
    en_path = r'd:\Antigravity\Sticker_Universe\src\locales\en.json'
    zh_path = r'd:\Antigravity\Sticker_Universe\src\locales\zh-TW.json'

    updates = {
        "en": {
            "generator": {
                "phases": {
                    "settings": "Phase 4: Settings"
                },
                "phrase": {
                    "custom": "Custom Phrase",
                    "customPlaceholder": "Or type custom phrase...",
                    "errorNoPhrase": "Please select or type a phrase!"
                },
                "settings": {
                    "batchBatchWarning": "Batch size is fixed to 1 when using a phrase.",
                    "includeText": "Include Text"
                },
                "result": {
                    "emptyTitle": "Ready to create?",
                    "emptyDesc": "Upload a photo and select a style to start."
                },
                "action": {
                    "zipName": "stickers",
                    "preview": "Preview",
                    "download": "Download",
                    "removeBg": "Remove Background",
                    "batchProcessing": "Batch Processing",
                    "generatingArt": "Generating AI Art...",
                    "applyingMagic": "Applying Magic...",
                    "close": "Close"
                }
            }
        },
        "zh-TW": {
            "generator": {
                "phases": {
                    "settings": "階段 4: 參數設定"
                },
                "phrase": {
                    "custom": "自訂台詞",
                    "customPlaceholder": "或輸入自訂台詞...",
                    "errorNoPhrase": "請選擇或輸入一個台詞！"
                },
                "settings": {
                    "batchBatchWarning": "選擇慣用語時，批次張數固定為 1 張",
                    "includeText": "包含文字"
                },
                "result": {
                    "emptyTitle": "準備好開始了嗎？",
                    "emptyDesc": "上傳照片並選擇風格即可開始製作。"
                },
                "action": {
                    "zipName": "stickers",
                    "preview": "預覽",
                    "download": "下載",
                    "removeBg": "背景移除",
                    "batchProcessing": "批次處理中",
                    "generatingArt": "正在生成 AI 藝術...",
                    "applyingMagic": "正在進行魔法優化...",
                    "close": "關閉"
                }
            }
        }
    }

    for lang, path in [("en", en_path), ("zh-TW", zh_path)]:
        data = load_json(path)
        
        gen = data.get("generator", {})
        
        # Deep merge updates
        for key, category_updates in updates[lang]["generator"].items():
            if key not in gen:
                gen[key] = category_updates
            else:
                for subkey, value in category_updates.items():
                    gen[key][subkey] = value
        
        data["generator"] = gen
        save_json(path, data)
        print(f"Updated {lang} locales at {path}")

if __name__ == "__main__":
    fix_sticker_locales()

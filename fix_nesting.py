import json

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def fix_nesting():
    en_path = r'd:\Antigravity\Sticker_Universe\src\locales\en.json'
    zh_path = r'd:\Antigravity\Sticker_Universe\src\locales\zh-TW.json'

    for path in [en_path, zh_path]:
        data = load_json(path)
        if 'generator' in data:
            # Define the keys we want at the top level of generator
            actions = {
                "styleInspiration": "Style & Inspiration" if "en" in path else "風格與靈感",
                "autoOptimize": "AI Auto-Optimize" if "en" in path else "AI 自動優化",
                "luckyPrompt": "Lucky Prompt" if "en" in path else "手氣不錯",
                "referenceImage": "Reference Image" if "en" in path else "參考圖片",
                "clear": "Clear" if "en" in path else "清除",
                "uploadImage": "Upload Image" if "en" in path else "上傳圖片",
                "pasteImage": "Paste Image" if "en" in path else "貼上圖片",
                "fromGallery": "From Gallery" if "en" in path else "從作品集選取",
                "imageLoaded": "Image Loaded" if "en" in path else "圖片已載入",
                "aspectRatio": "Aspect Ratio" if "en" in path else "圖片比例",
                "custom": "Custom" if "en" in path else "自訂",
                "generatingArt": "Generating AI Art..." if "en" in path else "正在生成 AI 藝術...",
                "failed": "Generation Failed" if "en" in path else "生成失敗",
                "generate": "Generate" if "en" in path else "開始生成圖片",
                "generating": "Generating..." if "en" in path else "生成中..."
            }
            
            # Explicitly set them at generator.action
            if 'action' not in data['generator']:
                data['generator']['action'] = {}
            data['generator']['action'].update(actions)
            
            # Ensure imageGen is also correct
            image_gen = {
                "styleInspiration": actions["styleInspiration"],
                "hotApps": "Hot Apps" if "en" in path else "熱門應用",
                "twelveGrid": "Sticker Twelve Grid" if "en" in path else "貼圖十二宮格",
                "top100": "TOP 100 Styles" if "en" in path else "TOP 100 風格重繪",
                "artStyles": "Art Style Library" if "en" in path else "藝術風格庫",
                "modGuide": "Modification Guide" if "en" in path else "各種改圖指南",
                "settings": "Settings" if "en" in path else "生成設定",
                "prompt": "Prompt" if "en" in path else "提示詞",
                "promptPlaceholder": "Enter prompt..." if "en" in path else "請輸入提示詞，或選擇左側風格..."
            }
            data['generator']['imageGen'] = image_gen
            
        save_json(path, data)
    print("Surgically corrected the nesting of generator.action and generator.imageGen.")

if __name__ == "__main__":
    fix_nesting()

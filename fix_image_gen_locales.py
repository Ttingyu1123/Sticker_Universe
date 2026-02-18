import json
import os

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

def fix_image_gen_locales():
    en_path = r'd:\Antigravity\Sticker_Universe\src\locales\en.json'
    zh_path = r'd:\Antigravity\Sticker_Universe\src\locales\zh-TW.json'

    en_data = load_json(en_path)
    zh_data = load_json(zh_path)

    new_actions_en = {
        "styleInspiration": "Style & Inspiration",
        "autoOptimize": "AI Auto-Optimize",
        "luckyPrompt": "Lucky Prompt",
        "referenceImage": "Reference Image",
        "clear": "Clear",
        "uploadImage": "Upload Image",
        "pasteImage": "Paste Image",
        "fromGallery": "From Gallery",
        "imageLoaded": "Image Loaded",
        "aspectRatio": "Aspect Ratio",
        "custom": "Custom",
        "generatingArt": "Generating AI Art...",
        "failed": "Generation Failed",
        "generate": "Generate",
        "generating": "Generating..."
    }

    new_image_gen_en = {
        "styleInspiration": "Style & Inspiration",
        "hotApps": "Hot Apps",
        "twelveGrid": "Sticker Twelve Grid",
        "top100": "TOP 100 Styles",
        "artStyles": "Art Style Library",
        "modGuide": "Modification Guide",
        "settings": "Settings",
        "prompt": "Prompt",
        "promptPlaceholder": "Enter prompt or choose style from left..."
    }

    new_actions_zh = {
        "styleInspiration": "風格與靈感",
        "autoOptimize": "AI 自動優化",
        "luckyPrompt": "手氣不錯",
        "referenceImage": "參考圖片",
        "clear": "清除",
        "uploadImage": "上傳圖片",
        "pasteImage": "貼上圖片",
        "fromGallery": "從作品集選取",
        "imageLoaded": "圖片已載入",
        "aspectRatio": "圖片比例",
        "custom": "自訂",
        "generatingArt": "正在生成 AI 藝術...",
        "failed": "生成失敗",
        "generate": "開始生成圖片",
        "generating": "生成中..."
    }

    new_image_gen_zh = {
        "styleInspiration": "風格與靈感",
        "hotApps": "熱門應用",
        "twelveGrid": "貼圖十二宮格",
        "top100": "TOP 100 風格重繪",
        "artStyles": "藝術風格庫",
        "modGuide": "各種改圖指南",
        "settings": "生成設定",
        "prompt": "提示詞",
        "promptPlaceholder": "請輸入提示詞，或選擇左側風格..."
    }

    # Inject into generator object
    for lang, data, actions, image_gen in [('en', en_data, new_actions_en, new_image_gen_en), 
                                           ('zh-TW', zh_data, new_actions_zh, new_image_gen_zh)]:
        if 'generator' not in data:
            data['generator'] = {}
        
        # Merge action
        if 'action' not in data['generator']:
            data['generator']['action'] = actions
        else:
            data['generator']['action'].update(actions)
            
        # Add imageGen
        data['generator']['imageGen'] = image_gen

    save_json(en_path, en_data)
    save_json(zh_path, zh_data)
    print(f"Successfully updated AI Image Gen translations for en and zh-TW.")

if __name__ == "__main__":
    fix_image_gen_locales()

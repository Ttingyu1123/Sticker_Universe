import { TOP_100_STYLES, TOP_100_STYLES_CATEGORIZED } from '../../../constants/top100Styles';

// Re-export top 100 styles for convenience
export { TOP_100_STYLES, TOP_100_STYLES_CATEGORIZED };

// Aspect Ratios for UI
export const ASPECT_RATIOS = ['11:6', '16:9', '3:2', '4:3', '1:1', '3:4', '2:3', '9:16', '6:11'] as const;

// Example prompts for the initial screen
export const EXAMPLE_PROMPTS = [
    '一隻可愛的貓咪太空人，漂浮在銀河中',
    '一座未來城市的霓虹燈夜景，賽博龐克風格',
    '一幅梵高風格的向日葵星夜畫',
    '一座維多利亞時代的豪宅，住著傳說中的吸血鬼',
    '一位身穿盔甲的女騎士，站在山頂上',
    '一個廢棄的太空站，被外星人佔領',
    '一片超現實的沙漠景觀，瘋狂麥斯車隊正在追逐',
    '一個舒適的書房，窗外下著雨',
];

// Function buttons for quick prompt additions
export const FUNCTION_BUTTONS = [
    { label: '3D公仔', prompt: '4K, create a 1/7 scale commercialized figure of the character, in a realistic style and environment. Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the ZBrush modeling process of the figure. Next to the computer screen, place a EANDAI-style toy packaging box printed with the original artwork' },
    { label: '三視圖', prompt: 'character design sheet, orthographic view, front view, side view, back view, T-pose, detailed, clean line art, white background' },
    { label: '3D紙雕', prompt: '3D sculpted paper art, layered paper, intricate papercraft, quilling, detailed, delicate lighting' },
    { label: '撲克牌', prompt: 'A hyper-detailed cinematic playing card artwork, Queen card format, standing slightly tilted on a wooden surface, shallow depth of field, soft bokeh background. The central subject: [YOUR MAIN SUBJECT], close-up bust portrait (from chest up), designed with a strong 3D pop-out effect, partially emerging from the card surface. Front part of the subject appears outside the card frame, while the back part blends seamlessly into the card texture. Highly detailed face, realistic skin texture, sharp eyes, expressive lighting. Surrounded by intricate ornamental elements, colorful layered textures, metallic accents, sculpted fantasy decorations. Premium embossed card material, realistic paper texture, subtle wear, sharp edges. Soft cinematic lighting, warm highlights, realistic shadows, ambient occlusion. Ultra-detailed semi-3D painterly realism, photorealistic fusion, 8k resolution, macro photography look, masterpiece quality.' },
    { label: '向量圖標', prompt: 'convert this into a clean, simple, flat 2D vector icon' },
    { label: '黏土模型', prompt: 'claymation style, plasticine model, stop-motion animation look' },
    { label: '像素藝術', prompt: 'pixel art, 16-bit, retro video game style' },
    { label: '雙重曝光', prompt: 'double exposure effect with a silhouette of a person and a forest scene' },
    { label: '低多邊形', prompt: 'low poly art style, geometric, faceted' },
    { label: '黑白素描', prompt: 'black and white pencil sketch, detailed shading' },
    { label: '產品攝影', prompt: 'commercial product photography, clean studio background, professional lighting' },
    { label: '開箱照', prompt: 'Knolling photography, objects arranged neatly at 90-degree angles, flat lay, top-down view, clean studio lighting on a flat surface, organized, hyper-detailed, photorealistic' },
    { label: '等距可愛', prompt: 'Isometric 3D cute art, miniature diorama, soft pastel colors, clay-like texture, clean studio lighting, detailed, high quality' },
    { label: '電影感', prompt: 'cinematic lighting, dramatic, movie still' },
    { label: '吉卜力風格', prompt: 'ghibli studio style, anime, beautiful scenery' },
    { label: '品牌視覺設計', prompt: '使用上傳的產品圖片，製作一張垂直版 9:16 比例的品牌設計規格海報。設計風格需貼合產品的細分市場定位與視覺標誌。海報需劃分清晰美觀的版塊，具體包含：（1）品牌標誌醒目展示及安全區域使用規範；（2）產品樣機居中突出呈現；（3）主輔色卡搭配十六進制色值標註；（4）字體規範，涵蓋標題、副標題、正文字體示例及行間距參數；（5）品牌常用圖示或圖形元素範例；（6）圖片處理風格，附生活場景或棚拍效果範例圖；（7）網格系統與版面配置規則；（8）包裝樣機及實體應用效果展示；（9）設計注意事項，搭配標註說明圖。背景採用簡約白色或柔和中性色調，輔以規則的版塊分割線及投影效果。最終成品需視覺豐富、版面整潔，適用於印刷版或電子版品牌手冊。' },
    { label: '真人角色設計表', prompt: '請根據這張照片中的人物，建立一份詳細的角色設計表。這將用於真人電影，因此請注意不要製作成動漫風格的藝術作品。它必須包含以下三個角色元素。完成後，請移除人物的原始圖像。(1)角色多角度（三視圖）轉向圖 (2)表情表，顯示基本情緒狀態，例如喜悅、悲傷、憤怒、驚訝、恐懼和中性 (3) 姿勢表，顯示典型動作，例如角色跑步、跳躍、大笑和哭泣' },
    { label: '角色設計表', prompt: 'Best quality, masterpiece, ultra high res, Create a photo character sheet of her with identically consistent facial features. Include different angles: front, side, back, quarter. List different expressions and details with photos. White background. Landscape mode. Render at max resolution., detailed lighting, 8k wallpaper' },
    { label: '文字排版畫(細字)', prompt: '將上傳的人像照片轉換為 typography portrait 文字藝術風格，使用優雅的手寫 calligraphy 字體，大量文字沿著臉部輪廓與陰影方向排列，文字大小與密度形成明暗與立體結構，側面剪影構圖，單色高對比設計，白色文字組成整個臉部，深藍色純色背景，極簡配色、乾淨排版、大師級設計感，vector illustration style, clean typography layout,high contrast, minimal color palette' },
    { label: '文字排版畫(粗體)', prompt: 'Create a typographic illustration shaped like a {OBJECT), where the text itself forms the shape - bold and playful lettering style that fills the entire silhouette - letters adapt fluidly to the curves and contours of the object - vibrant and contrasting color palette that fits the theme - background is solid and enhances the focus on the main shape - vector-style, clean, high resolution.' },
    { label: '英文單字卡', prompt: 'Draw a detailed {{carnival}} scene and label every object with English words. Label format: (1)First line: English word (2)Second line: IPA pronunciation (3)Third line: Traditional Chinese (zh-tw) translation' },
    { label: '商品拆解圖', prompt: 'Create a technical infographic of [OBJECT] with a 45-degree isometric 3D perspective showing the device slightly tilted to reveal depth and dimension. Combine a realistic photoreal render with black ink technical annotations on pure white background. Include: (1)Key component labels with color-coded callout boxes (2)Internal component visibility through transparent/ cutaway sections (3)Measurements, dimensions, and precise scale markers (4)Material callouts and quantities (5)Color-coded arrows for function/flow: RED (power/ battery), BLUE (data/connectivity), ORANGE (thermal/processor), GREEN (sensors/haptics) (6)Simple schematics or cross-sectional diagrams where relevant. (7)Place  [OBJECT] title in a hand-drawn technical box (top-left corner). (8)Style: Black linework (technical pen/architectural), sketched but precise. Object remains clearly visible. (9)Educational museum-exhibit vibe. Clean composition, balanced negative space. (10)Perspective: Isometric 3D angle-tilted to show depth, dimension, and internal architecture dramatically. Like a professional product teardown or engineering manual. (11)Colors: ~10-15% accent density. Black dominant. White background. (12)Output: 1080x1080, ultra-crisp, social-feed optimized.' },
    { label: '照片塗鴉(腦粉)', prompt: '生成圖片，把這張照片處理得像是「列印在紙上的實體照片」。接著，用紅色奇異筆（Marker）在上面瘋狂地加上「繁體中文」的手寫批註、塗鴉、亂畫。請發揮超級腦粉模式，極盡所能地瘋狂稱讚照片裡的人（例如穿著、表情、動作）。視覺上要充滿愛意，畫上很多愛心圖案、星星、爆炸驚嘆號，並隨機貼上一些可愛的、帶有正面詞彙的小貼紙圖案。' },
    { label: '照片塗鴉(酸民)', prompt: '生成圖片，把這張照片處理得像是「列印在紙上的實體照片」。這張照片被用「粗頭紅色奇異筆」瘋狂地塗鴉和破壞。上面寫滿了憤怒且刻薄的「繁體中文」手寫批註（例如：「品味極差」、「這臉是在哈囉？」、「醜到哭」）。請發揮毒舌風格，針對照片中的人物進行吐槽（例如穿著、表情、動作）。視覺上充滿了紅色的箭頭指向人物的衣服和表情，臉部被畫上圓圈或大叉叉。照片周圍隨意貼著廉價、怪異的迷因小貼紙（meme stickers） 和剪貼簿素材。整體風格混亂、充滿嘲諷意味，像是一個崩潰的酸民在發洩情緒。' },
    { label: '旗袍剪紙肖像', prompt: '一張紀實照片，將參考圖片的人物，轉變成一位身穿紅色旗袍的東亞女性，坐在古樸的木桌前。她手裡拿著剪刀，專注地在剪紅紙。鏡頭前的桌上，一幅快完成的、精緻的紅色剪紙藝術品正面朝向觀眾展示著，那是她自己的肖像畫，周圍裝飾著傳統的中國蓮花和雲朵圖案。桌上散落著紅色的紙屑。溫暖、柔和的光線，充滿喜慶的文化氛圍，高品質，電影感。' },
    { label: '便條紙牆', prompt: '極簡主義的電影彩色海報，由肩膀到頭頂的角色肖像。面部採用少量大、方形切割的紙片，以簡單的格子排列［大約4x5或5x6片］。每張紙片都含有臉部的失處部分，一起重構肖像。構成臉部的內部紙片片並不完美平整；許多有些微彎曲的邊緣 and 捲起的角落，施放著微小的寫實陰影，使其呈現立體、被打倒的樣貌。其中4個方格直接在皮膚/圖像上有微妙的黑色手寫［文字1、文字2、文字3、文字4］。在此中央網格的外圍不規則散落在各種隨意擺放的位置（不限於角落），幾個【黏紙條顏色】黏紙條貼在【顏色】牆上，包含手寫的【外部文字內容，例如標誌性引文】。整體佈局略有不規則，件件之間有可見的縫隙顯示［顏色］混凝土牆背景。寫實紙張紋理整個，高端工作室打燈強調掀邊，鋒利著重墨水與紙紋。' },
    { label: '漫畫背景', prompt: 'The central figure, extracted from the uploaded image, is rendered in full, vibrant photorealistic color and sharp detail. They are dramatically lit to powerfully stand out. The background is an intricately detailed, multi-panel, black and white comic strip, entirely wordless and filled with humorous, exaggerated narratives directly featuring the central figure. These comic panels should not only depict the subject in funny, light-hearted, or slightly absurd scenarios, but also seamlessly integrate the central figure into the surrounding comic world. The colorful main subject should appear as if they are an integral part of this dynamic, monochromatic comic reality, perhaps \'stepping out\' or \'frozen within\' a specific comic panel, with their pose and expression directly interacting with the surrounding black and white narrative. The comic panels are drawn in a classic, high-contrast comic book style with bold lines, and creatively arranged to create a cohesive and engaging narrative backdrop, strongly linking the vibrant figure to the detailed monochrome comic environment.' },
];

// Art styles for the accordion
export const ART_STYLES_CATEGORIES = [
    {
        name: "現代藝術流派 (Modern Art Movements)",
        styles: [
            { en: 'Impressionism', zh: '印象派' },
            { en: 'Post-Impressionism', zh: '後印象派' },
            { en: 'Expressionism', zh: '表現主義' },
            { en: 'Cubism', zh: '立體主義' },
            { en: 'Surrealism', zh: '超現實主義' },
            { en: 'Abstract Expressionism', zh: '抽象表現主義' },
            { en: 'Pop Art', zh: '普普藝術' },
            { en: 'Minimalism', zh: '極簡主義' },
            { en: 'Futurism', zh: '未來主義' },
            { en: 'Dadaism', zh: '達達主義' },
            { en: 'Constructivism', zh: '構成主義' },
            { en: 'Fauvism', zh: '野獸派' },
            { en: 'Art Nouveau', zh: '新藝術運動' },
            { en: 'Art Deco', zh: '裝飾藝術' },
            { en: 'Bauhaus', zh: '包浩斯' },
            { en: 'Op Art', zh: '歐普藝術' },
            { en: 'Kinetic Art', zh: '動態藝術' },
        ]
    },
    {
        name: "古典與歷史藝術 (Classical & Historical)",
        styles: [
            { en: 'Renaissance', zh: '文藝復興' },
            { en: 'Baroque', zh: '巴洛克' },
            { en: 'Rococo', zh: '洛可可' },
            { en: 'Neoclassicism', zh: '新古典主義' },
            { en: 'Romanticism', zh: '浪漫主義' },
            { en: 'Realism', zh: '現實主義' },
            { en: 'Gothic Art', zh: '哥德藝術' },
            { en: 'Byzantine Art', zh: '拜占庭藝術' },
            { en: 'Pre-Raphaelite', zh: '前拉斐爾派' },
        ]
    },
    {
        name: "數位與當代藝術 (Digital & Contemporary)",
        styles: [
            { en: 'Cyberpunk', zh: '賽博龐克' },
            { en: 'Steampunk', zh: '蒸汽龐克' },
            { en: 'Solarpunk', zh: '太陽龐克' },
            { en: 'Vaporwave', zh: '蒸汽波' },
            { en: 'Glitch Art', zh: '故障藝術' },
            { en: 'Pixel Art', zh: '像素藝術' },
            { en: 'Voxel Art', zh: '體素藝術' },
            { en: 'Low Poly', zh: '低多邊形' },
            { en: 'Fractal Art', zh: '碎形藝術' },
            { en: 'Generative Art', zh: '生成藝術' },
            { en: 'Digital Painting', zh: '數位繪畫' },
            { en: 'Concept Art', zh: '概念藝術' },
            { en: 'Matte Painting', zh: '霧面繪畫' },
            { en: 'Photobashing', zh: '照片拼貼' },
            { en: 'Synthwave', zh: '合成波' },
            { en: 'Holographic', zh: '全息影像' },
        ]
    },
    {
        name: "插畫與平面設計 (Illustration & Graphic)",
        styles: [
            { en: 'Anime Style', zh: '日本動畫' },
            { en: 'Manga Style', zh: '日本漫畫' },
            { en: 'Ghibli Studio Style', zh: '吉卜力風格' },
            { en: 'Disney Style', zh: '迪士尼風格' },
            { en: 'Cartoon Style', zh: '卡通風格' },
            { en: 'Comic Book Art', zh: '美式漫畫' },
            { en: 'Flat Design', zh: '扁平化設計' },
            { en: 'Vector Art', zh: '向量藝術' },
            { en: 'Infographic Style', zh: '資訊圖表' },
            { en: 'Psychedelic Art', zh: '迷幻藝術' },
            { en: 'Vintage Poster', zh: '復古海報' },
            { en: 'Fantasy Art', zh: '奇幻藝術' },
            { en: 'Sci-Fi Art', zh: '科幻藝術' },
            { en: 'Children\'s Book Illustration', zh: '童書插畫' },
        ]
    },
    {
        name: "文化與區域風格 (Cultural & Regional)",
        styles: [
            { en: 'Ukiyo-e', zh: '浮世繪' },
            { en: 'Sumi-e (Ink Wash Painting)', zh: '水墨畫' },
            { en: 'Chinese Painting (Guohua)', zh: '國畫' },
            { en: 'Aboriginal Art', zh: '澳洲原住民藝術' },
            { en: 'African Art', zh: '非洲藝術' },
            { en: 'Islamic Art', zh: '伊斯蘭藝術' },
            { en: 'Mandala', zh: '曼陀羅' },
            { en: 'Celtic Knotwork', zh: '凱爾特結' },
            { en: 'Mayan Art', zh: '馬雅藝術' },
            { en: 'Aztec Art', zh: '阿茲特克藝術' },
            { en: 'Indian Miniature Painting', zh: '印度細密畫' },
            { en: 'Tibetan Thangka', zh: '西藏唐卡' },
            { en: 'Mexican Muralism', zh: '墨西哥壁畫' },
        ]
    },
    {
        name: "傳統媒材模擬 (Traditional Mediums)",
        styles: [
            { en: 'Oil Painting', zh: '油畫' },
            { en: 'Watercolor Painting', zh: '水彩畫' },
            { en: 'Acrylic Painting', zh: '壓克力畫' },
            { en: 'Gouache Painting', zh: '水粉畫' },
            { en: 'Pencil Sketch', zh: '鉛筆素描' },
            { en: 'Charcoal Drawing', zh: '炭筆素描' },
            { en: 'Ink Drawing', zh: '墨水畫' },
            { en: 'Woodcut Print', zh: '木刻版畫' },
            { en: 'Linocut Print', zh: '油氈版畫' },
            { en: 'Etching', zh: '蝕刻版畫' },
            { en: 'Lithography', zh: '石版畫' },
            { en: 'Collage', zh: '拼貼' },
            { en: 'Mosaic', zh: '馬賽克' },
            { en: 'Stained Glass', zh: '彩繪玻璃' },
            { en: 'Graffiti Art', zh: '塗鴉藝術' },
            { en: 'Street Art', zh: '街頭藝術' },
            { en: 'Calligraphy', zh: '書法' },
            { en: 'Pastel Drawing', zh: '粉彩畫' },
            { en: 'Ballpoint Pen Art', zh: '原子筆藝術' },
        ]
    },
    {
        name: "攝影與電影風格 (Photographic & Cinematic)",
        styles: [
            { en: 'Cinematic', zh: '電影感' },
            { en: 'Film Noir', zh: '黑色電影' },
            { en: 'Documentary Style', zh: '紀錄片風格' },
            { en: 'Golden Hour Photography', zh: '黃金時刻攝影' },
            { en: 'Blue Hour Photography', zh: '藍色時刻攝影' },
            { en: 'Long Exposure Photography', zh: '長曝光攝影' },
            { en: 'Macro Photography', zh: '微距攝影' },
            { en: 'Double Exposure', zh: '雙重曝光' },
            { en: 'Black and White Photography', zh: '黑白攝影' },
            { en: 'Sepia Tone', zh: '棕褐色調' },
            { en: 'Infrared Photography', zh: '紅外線攝影' },
            { en: 'Tilt-Shift Photography', zh: '移軸攝影' },
            { en: 'Lomography', zh: 'LOMO風格' },
            { en: 'Pinhole Photography', zh: '針孔攝影' },
            { en: 'Drone Photography', zh: '空拍攝影' },
            { en: 'Polaroid Photo', zh: '拍立得風格' },
        ]
    },
    {
        name: "特殊與小眾風格 (Unique & Niche)",
        styles: [
            { en: 'Knolling', zh: '擺拍藝術' },
            { en: 'Claymation', zh: '黏土動畫' },
            { en: 'Quilling', zh: '衍紙' },
            { en: 'Origami', zh: '摺紙' },
            { en: 'Tattoo Art', zh: '紋身藝術' },
            { en: 'Body Painting', zh: '人體彩繪' },
            { en: 'Light Painting', zh: '光繪' },
            { en: 'Diorama', zh: '立體透視模型' },
            { en: 'Miniature Faking', zh: '微縮景觀' },
            { en: 'Anamorphic Art', zh: '變形藝術' },
            { en: 'Cross-Stitch', zh: '十字繡' },
            { en: 'Stipple Art', zh: '點畫' },
        ]
    }
];

export const EDITING_EXAMPLES = [
    {
        category: '主體變換',
        examples: [
            { title: '變換材質', prompt: '將 [主體] 的材質變成 [玻璃/木頭/金屬/石頭]' },
            { title: '添加發光效果', prompt: '讓 [主體] 的 [特定部位] 發出 [顏色] 的光芒' },
            { title: '風格化', prompt: '將 [主體] 變成 [像素/卡通/素描] 風格，保持構圖不變' },
            { title: '擬人化', prompt: '將 [物體] 擬人化，賦予其人類的表情 and 動作' },
        ]
    },
    {
        category: '編輯圖片',
        examples: [
            { title: '移除文字', prompt: 'remove all text, subtitles, and logos from the image' },
            { title: '線稿提取', prompt: 'extract the line art from this image, clean white background' },
            { title: '圖案提取', prompt: '從[上衣] 中提取圖案並將其放置在純白色背景上，確保圖案與背景分離，邊緣清晰，色彩鮮艷，分辨率高。背景應為純白色，無任何干擾。清晰對焦，高質量，細節豐富' },
            { title: '修復模糊', prompt: '修復這張照片，消除裂痕，增強清晰度，校正色彩，還原原始照片，達到超高清畫質' },
            { title: '老照片上色', prompt: '將這張照片上色及高清處理成現代照片，並保持人物面部調整不變' },
        ]
    },
    {
        category: '背景與環境',
        examples: [
            { title: '更換背景', prompt: '將背景更換為 [未來城市/魔法森林/廢棄工廠], 保持主體不變，注意光影 and 場景的自然融合。' },
            { title: '電商產品換背景', prompt: '將背景改為電商場景，專業攝影打光，氛圍感，保持商品主體不變' },

            { title: '改變天氣', prompt: '將天氣變為 [下雨/下雪/起霧/黃昏]' },
            { title: '添加元素', prompt: '在背景中添加 [漂浮的島嶼/巨大的月亮/飛過的龍]' },
            { title: '時間變換', prompt: '將場景的時間變為 [白天/夜晚/黎明]' },
        ]
    },
    {
        category: '構圖與視角',
        examples: [
            { title: '改變視角', prompt: '將視角變為 [鳥瞰/仰視/魚眼]' },
            { title: '聚焦主體', prompt: '使用淺景深效果，模糊背景，突出主體' },
            { title: '延伸畫布 (Outpainting)', prompt: '將畫布向 [上下左右] 延伸，並智慧填充內容' },
            { title: '畫面裁切', prompt: '將畫面裁切為 [16:9/4:3/方形] 比例，重新構圖' },
        ]
    },
    {
        category: '特效與氛圍',
        examples: [
            { title: '添加動態模糊', prompt: '為主體添加運動模糊效果，營造速度感' },
            { title: '電影感色調', prompt: '為整張圖片套上電影感色調，參考 [駭客任務/銀翼殺手] 的風格' },
            { title: '雙重曝光', prompt: '將 [主體輪廓] 與 [另一張圖片，如森林/星空] 進行雙重曝光' },
            { title: '故障藝術', prompt: '為圖片添加 Glitch Art (故障藝術) 效果，如數據錯誤、色彩分離' },
        ]
    },
];

// Combine all styles into a flat list for searching.
export const ART_STYLES_LIST = ART_STYLES_CATEGORIES.flatMap(cat => cat.styles);

// Twelve Grid categories for reference
export const TWELVE_GRID_CATEGORIES = [
    { label: '人像攝影', category: 'Portrait' },
    { label: '產品展示', category: 'Product' },
    { label: '美食料理', category: 'Food' },
    { label: '自然風景', category: 'Nature' },
    { label: '建築空間', category: 'Architecture' },
    { label: '藝術創意', category: 'Creative' },
];

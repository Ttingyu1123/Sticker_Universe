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
    { label: 'Mini Me(男)', prompt: 'A high quality mixed media portrait of a trendy young man (using my uploaded person photo) standing on a train station platform at night. The subject is posing coolly, holding the strap of an olive backpack with one hand. He is wearing a stylish streetwear outfit with an oversized layered black hoodie, gray sweatpants, and chunky sneakers. The background features a realistic KRL Jabodetabek Commuter Line train side view with its signature red striping, with the train doors wide open, bathed in bright cinematic station lighting and city night ambiance. Surrounding the realistic main subject are several cute 3D style chibi versions of himself, same outfit and same face. These chibis are interacting playfully, one sitting on his shoulder, one climbing his leg, and another peeking out from the backpack. Overlay the image with vibrant hand drawn doodle effects, white drawn outlines around the subject, playful scribbles, stars, sparkles, electric sparks, and floating white and black handwritten slogans like "forever young", "krI", "night", and "gen z vibes". The style should seamlessly blend hyper realistic photography with colorful flat cartoon illustrations while keeping the face and body shape unchanged.' },
    { label: 'Mini Me(女)', prompt: 'A high quality mixed media portrait of a trendy young woman (using my uploaded person photo) standing on a train station platform at night. The subject is posing confidently, holding the strap of an olive backpack with one hand. She is wearing a stylish streetwear outfit with an oversized layered black hoodie, relaxed gray jogger sweatpants, and chunky sneakers. The background features a realistic KRL Jabodetabek Commuter Line train side view with its signature red striping, with the train doors wide open, bathed in bright cinematic station lighting and city night ambiance. Surrounding the realistic main subject are several cute 3D style chibi versions of herself, wearing the same outfit and having the same facial features. These chibis are interacting playfully — one sitting on her shoulder, one climbing her leg, and another peeking out from the backpack. Overlay the image with vibrant hand drawn doodle effects, white drawn outlines around the subject, playful scribbles, stars, sparkles, electric sparks, and floating white and black handwritten slogans like "forever young", "krI", "night", and "gen z vibes". The style should seamlessly blend hyper realistic photography with colorful flat cartoon illustrations, while strictly preserving the original face structure, body proportions, and identity of the uploaded person.' },
    { label: '時尚海報(女)', prompt: '這是一張高級時裝大片風格的雜誌拼貼海報，背景被分割為 9個矩形區域，分別模仿《Vogue》《GQ》《i-D》《Dazed》《Elle》《Harper\'s Bazaar》《Men\'s Uno》《Numéro Homme》《Esquire》等頂級時尚雜誌的封面版式,，所有其他版本的主角所提供的封面其他人。前景中，一位女模特兒以動態行走的全身姿態破格疊加在網格之上，打破背景格子的邊界，營造出強烈的 3D 縱深感。模特兒身穿極簡幹練的全黑造型：oversize 黑色雙排扣西裝外套內搭黑色吊帶，搭配剪裁俐落的黑色闊腿西褲與黑色尖頭高跟鞋，手持鱷魚紋壓花皮革手拿包。整體畫面以柔和棚拍光線，呈現 8K 照片等級的真實質感，色彩乾淨極簡，充滿精緻的時尚編輯感' },
    { label: '時尚海報(男)', prompt: '這是一張高級時裝大片風格的雜誌拼貼海報，背景被分割為 9個矩形區域，分別模仿《Vogue》《GQ》《i-D》《Dazed》《Elle》《Harper\'s Bazaar》《Men\'s Uno》《Numéro Homme》《Esquire》等頂級時尚雜誌的封面版式,，所有其他版本的主角所提供的封面其他人。前景中，一位男模特兒以動態行走的全身姿態破格疊加在網格之上，打破了背景格子的邊界，營造出強烈的 3D 縱深感。模特兒身穿極簡街頭風穿搭：寬鬆的花灰色 V 領針織毛衣內搭白色圓領打底衫，腰間隨意繫著一件黑白條紋襯衫，下身搭配深灰色漸變闊腿牛仔褲與棕褐色厚底鞋。整體畫面以柔和棚拍光線，呈現 8K 照片等級的真實質感，色彩乾淨極簡，充滿精緻的時尚編輯感' },
    { label: '俏皮冬季九宮格', prompt: '創建一個 3×3 的俏皮冬季人像九宮格，所有九幀均使用附件圖片中的同一張臉。每幀呈現不同表情、髮型與服裝——滑稽、尷尬、歡樂、無聊、頑皮、誇張。整體氛圍童真、即興、不完美，像一場只為好玩的創意冬季拍攝。背景為純色冬季色調（冷藍、灰、米白、柔 beige）。造型在各幀間變化：凌亂針織帽、圍巾、耳罩、 oversized 大衣、毛絨毛衣、層疊冬季紋理、搞怪眼鏡、誇張起床發、被雪微微打濕的頭髮。部分畫麵包含吐舌頭、咧嘴大笑、驚訝臉、假裝嚴肅、被冷到瞇眼。佈光為柔和工作室冷中性調，可見顆粒，輕微紋理，無磨皮。九宮格整體協調卻刻意混亂俏皮──冬季情緒但無節慶符號。所有 9 幀中臉部必須 100% 完全相同' },
    { label: '旗袍剪紙肖像', prompt: '一張紀實照片，將參考圖片的人物，轉變成一位身穿紅色旗袍的東亞女性，坐在古樸的木桌前。她手裡拿著剪刀，專注地在剪紅紙。鏡頭前的桌上，一幅快完成的、精緻的紅色剪紙藝術品正面朝向觀眾展示著，那是她自己的肖像畫，周圍裝飾著傳統的中國蓮花和雲朵圖案。桌上散落著紅色的紙屑。溫暖、柔和的光線，充滿喜慶的文化氛圍，高品質，電影感。' },
    { label: '便條紙牆', prompt: '極簡主義的電影彩色海報，由肩膀到頭頂的角色肖像。面部採用少量大、方形切割的紙片，以簡單的格子排列［大約4x5或5x6片］。每張紙片都含有臉部的失處部分，一起重構肖像。構成臉部的內部紙片片並不完美平整；許多有些微彎曲的邊緣 and 捲起的角落，施放著微小的寫實陰影，使其呈現立體、被打倒的樣貌。其中4個方格直接在皮膚/圖像上有微妙的黑色手寫［文字1、文字2、文字3、文字4］。在此中央網格的外圍不規則散落在各種隨意擺放的位置（不限於角落），幾個【黏紙條顏色】黏紙條貼在【顏色】牆上，包含手寫的【外部文字內容，例如標誌性引文】。整體佈局略有不規則，件件之間有可見的縫隙顯示［顏色］混凝土牆背景。寫實紙張紋理整個，高端工作室打燈強調掀邊，鋒利著重墨水與紙紋。' },
    { label: '繪圖過程', prompt: 'Make 2 by 2 grid showing process of drawing this image. First grid cell (upper left) should be rough sketch on white background. Second grid cell (upper right) should be crisp lineart on white background). Third grid cell (lower left) should be flat color stage without much details. Fourth grid cell (lower right should look like this finished image.' },
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
    {
        categoryName: '動漫熱血風',
        items: [
            { label: '熱血少年漫風（Jump感）', prompt: '將參考圖片角色變形，設計12款LINE貼紙，日系少年漫畫風格，強烈動作誇張姿勢，速度線與爆炸特效，台灣慣用語繁體中文，文字像漫畫對話框，情緒張力極強，每張如動畫戰鬥分鏡，構圖變化豐富' },
            { label: '動漫劇場版電影海報感', prompt: '參考角色變形設計12張LINE貼紙，每張像劇場版動畫截圖， cinematic lighting，強烈鏡頭構圖，台灣慣用語繁體中文，文字像電影台詞字幕，畫面震撼' },
            { label: '韓系Webtoon風（Naver漫畫感）', prompt: '參考角色變形成韓系Webtoon漫畫角色，設計12張LINE貼紙，清爽扁平上色，強烈表情特寫，台灣慣用語繁體中文，文字像網漫字幕框，劇情感像戀愛或搞笑漫畫分鏡' },
            { label: 'Studio Trigger Anime Explosion（扳機社超燃）', prompt: 'Transform the character into Studio Trigger anime style, intense action poses, dramatic speedlines, explosive effects, 12 sticker scenes like anime battle frames' },
            { label: 'Reaction Screenshot Style（劇情截圖風）', prompt: 'Design 12 LINE stickers as if they are screenshots from an anime episode, cinematic framing, dramatic subtitles in English or Chinese, strong storytelling moments' },
            { label: 'Anime Sports Hype Moment（運動畫面熱血）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，運動番熱血風格，角色像比賽中爆發瞬間，台灣慣用語繁體中文呈現，文字排版像體育轉播字幕，姿勢動感強烈，每張如高潮分鏡' },
            { label: 'Anime Cooking Battle（料理對決番）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，料理對決動畫風格，角色像在做浮誇料理戰鬥，台灣慣用語繁體中文呈現，文字排版像必殺菜名字幕，每張如熱血美食番' },
        ]
    },
    {
        categoryName: '浪漫戀愛風',
        items: [
            { label: '戀愛少女漫風（少女心爆炸）', prompt: '參考角色變形為戀愛漫畫貼紙角色，設計12張LINE貼紙，少女漫畫風，夢幻花朵與閃光背景，台灣慣用語繁體中文，文字像戀愛漫畫旁白，姿勢優雅誇張' },
            { label: 'Romantic Blossom Anime（春日戀愛微光風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，浪漫春日戀愛動畫風格，櫻花飄落與柔焦光暈，角色害羞告白、心動轉身，台灣慣用語繁體中文呈現，文字像少女漫畫旁白字幕，構圖夢幻吸睛，每張如戀愛動畫名場面' },
            { label: 'Dreamy Night Sky Romance（夢境星空浪漫風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，夢境星空浪漫動畫風格，夜晚柔藍光與星星閃爍，角色靜靜想念、溫柔擁抱，台灣慣用語繁體中文呈現，文字像詩意旁白，每張如劇場版溫柔鏡頭' },
            { label: 'Sweet Dessert Romance（甜點系戀愛可愛風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，甜點戀愛動畫風格，馬卡龍粉彩與糖霜光澤，角色抱著草莓蛋糕、撒嬌微笑，台灣慣用語繁體中文呈現，文字像甜甜的告白台詞，每張如可愛戀愛番外篇' },
            { label: 'Soft Confession Moments（小小告白劇情風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，溫柔告白劇情動畫風格，角色露出害羞表情、遞出小花或信，台灣慣用語繁體中文呈現，文字像戀愛動畫台詞，構圖簡潔留白，每張如心動瞬間分鏡' },
            { label: 'Honey Love Mood（蜂蜜戀愛泡泡風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，蜂蜜般甜蜜戀愛動畫風格，柔金色光暈與愛心泡泡環繞，角色撒嬌、害羞、輕輕擁抱，台灣慣用語繁體中文呈現，文字排版像溫柔告白字幕，每張如戀愛動畫甜蜜名場面' },
            { label: 'Strawberry First Love（草莓牛奶初戀風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，草莓牛奶初戀動畫風格，粉白柔霧配色與春日甜香氛圍，角色臉紅、偷看、心動微笑，台灣慣用語繁體中文呈現，文字像少女漫畫旁白，每張如初戀心跳分鏡' },
            { label: 'Couple Cozy Moments（情侶日常小劇場風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，情侶日常甜蜜小劇場動畫風格，角色一起吃點心、牽手散步、互相鬧脾氣又和好，台灣慣用語繁體中文呈現，文字排版像動畫對話字幕，每張如戀愛番外篇' },
            { label: 'Love Letter Scene（心動告白信件風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，戀愛情書動畫風格，角色拿著信封、小花束、偷偷告白，柔焦光暈與紙張手繪質感，台灣慣用語繁體中文呈現，文字像情書句子，每張如告白劇情高潮' },
            { label: 'Tea Party Romance（甜點夢幻下午茶風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，夢幻下午茶戀愛動畫風格，馬卡龍、蛋糕與花朵背景，角色捧著甜點微笑撒嬌，台灣慣用語繁體中文呈現，文字排版像甜甜的邀約，每張如浪漫下午茶動畫場景' },
            { label: 'Animals Blessing Love（小動物助攻戀愛風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，吉卜力小動物助攻戀愛風格，角色被貓咪、兔子、小鳥圍繞，浪漫祝福氣氛濃厚，台灣慣用語繁體中文呈現，文字像幸福小旁白，每張如童話戀愛鏡頭' },
            { label: 'Starry Hug Scene（星光擁抱甜蜜風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，星光擁抱甜蜜動畫風格，夜晚柔藍星點與輕光包圍，角色輕輕抱抱、想念、說晚安，台灣慣用語繁體中文呈現，文字像詩意情話字幕，每張如劇場版溫柔高潮' },
            { label: 'Blushing Cute Romance（戀愛害羞小表情包）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，戀愛害羞表情包動畫風格，角色臉紅捂臉、偷笑、心跳加速，背景充滿小愛心與粉色光點，台灣慣用語繁體中文呈現，文字短句可愛，每張如心動反應名場面' },
            { label: 'Fairytale Wedding Sweetness（幸福新婚童話風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，幸福童話新婚甜蜜動畫風格，角色穿著浪漫元素服飾與花環，氣氛像童話結局，台灣慣用語繁體中文呈現，文字排版像祝福台詞，每張如最甜結尾分鏡' },
        ]
    },
    {
        categoryName: '溫馨療癒風',
        items: [
            { label: '吉卜力溫柔動畫風', prompt: '以參考角色為主角，設計12張LINE貼紙，吉卜力動畫柔和筆觸，日常生活劇情感，台灣慣用語繁體中文，文字排版像手寫字幕，表情細膩可愛，每張像動畫片段截圖' },
            { label: 'Lo-fi Chill Mood Stickers（療癒系低飽和）', prompt: 'Reference character in lo-fi chill aesthetic, muted colors, cozy sleepy expressions, minimalist captions, 12 stickers like lo-fi animation stills, soft calm vibe' },
            { label: 'Japanese Soft Commercial Mascot（日本廣告吉祥物風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，日本商業吉祥物風格，角色圓潤親切帶治癒感，台灣慣用語繁體中文呈現，文字排版像便利商店宣傳語，每張像溫馨動畫廣告分鏡' },
            { label: 'Dreamy Cloud Stickercore（雲朵貼紙風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，雲朵Stickercore夢幻風格，角色像漂浮在柔軟雲裡，台灣慣用語繁體中文呈現，文字排版像天空小標籤，療癒感爆棚' },
            { label: 'Ultra Soft Baby Picture Book（嬰兒繪本萌）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，嬰兒繪本柔軟可愛風格，角色表情超純真，台灣慣用語繁體中文呈現，文字排版像睡前故事句子，治癒感極強' },
            { label: 'Cute Pet Adoption Poster（領養海報萌）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，寵物領養海報風格，角色像動物之家宣傳主角，台灣慣用語繁體中文呈現，文字排版像可愛公告，療癒又吸粉' },
            { label: 'Cozy Slice-of-Life（治癒系日常小幸福）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，吉卜力式治癒日常動畫風格，溫暖柔光與手繪筆觸，角色在生活小場景中微笑、發呆、抱著小物，台灣慣用語繁體中文呈現，文字排版像動畫字幕，每張如溫馨日常分鏡' },
            { label: 'Whimsical Forest Spirit（森林精靈童話風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，吉卜力森林精靈童話風格，柔和水彩背景與小動物陪伴，角色像在森林裡冒險與祝福，台灣慣用語繁體中文呈現，文字排版像故事書字幕，每張如童話動畫片段' },
            { label: 'Rainy Day Comfort（雨天溫柔陪伴風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，吉卜力雨天溫柔陪伴動畫風格，小雨傘與濕潤街道的柔光氛圍，角色安慰、守候、輕聲說話，台灣慣用語繁體中文呈現，文字排版像安靜字幕，每張如療癒電影片段' },
        ]
    },
    {
        categoryName: '搞笑迷因風',
        items: [
            { label: '搞笑泡麵番 Q版崩壞風', prompt: '將參考角色Q版變形，設計12款LINE貼紙，搞笑泡麵番風格，顏藝崩壞表情，誇張動作，台灣慣用語繁體中文，文字巨大浮誇，像動畫搞笑名場面' },
            { label: '超浮誇特效梗圖動畫風（迷因感）', prompt: '參考角色迷因化變形，設計12張LINE貼紙，誇張特效與爆炸背景，台灣慣用語繁體中文，文字排版像網路梗圖，劇情反轉感強烈，動作超浮誇' },
            { label: '迷因大字報風（Meme Poster）', prompt: '參考角色迷因化設計12張LINE貼紙，誇張表情搭配超大繁體中文台灣慣用語，文字像迷因大字報，構圖強烈衝突感，像社群梗圖動畫截圖' },
            { label: 'CapCut Meme Subtitle Core（短影片大字幕潮）', prompt: 'Design 12 LINE stickers based on the reference character, CapCut meme subtitle style, bold oversized text, high-energy expressions, cinematic reaction moments, clean white background, social-media viral vibe' },
            { label: 'Meme Cat/Dog Caption Style（國際迷因梗）', prompt: 'Create 12 meme-style LINE stickers from the reference character, exaggerated expressions, bold Impact-style captions in English, funny internet humor vibe' },
            { label: 'Handwritten Chaos Doodle Stickers（亂畫感爆紅）', prompt: 'Reference character in chaotic handwritten doodle style, messy funny expressions, scribble text captions, 12 stickers like viral indie cartoon memes' },
            { label: 'Comic Sticker Speech Chaos（漫畫氣泡混亂）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，漫畫氣泡混亂風格，多重對話框與吐槽文字，台灣慣用語繁體中文呈現，排版像吵鬧動畫場景，誇張又爆笑' },
            { label: 'Luxury Marble Sculpture Meme（大理石雕像梗）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，大理石雕像奢華梗圖風格，角色像藝術雕塑卻在講廢話，台灣慣用語繁體中文呈現，文字排版像博物館標牌，反差感超吸睛' },
            { label: 'Retro TV Variety Show Caption（綜藝復古字幕）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，復古綜藝節目字幕風格，角色像被主持人吐槽，台灣慣用語繁體中文呈現，文字排版像綜藝大字報，爆笑吸睛' },
            { label: 'Ultimate Viral Reaction Multiverse（爆紅反應宇宙）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，終極爆紅反應包宇宙風格，角色集合所有情緒誇張姿勢，台灣慣用語繁體中文呈現，文字排版像社群迷因合集，每張都是動畫名場面等級，變化最豐富吸睛' },
        ]
    },
    {
        categoryName: '潮流時尚風',
        items: [
            { label: 'Y2K潮流貼紙風（復古千禧）', prompt: '參考角色變形成Y2K潮流貼紙風格，設計12張LINE貼紙，閃亮金屬質感背景，泡泡字繁體中文台灣慣用語，動作像偶像劇梗圖，潮流感強烈' },
            { label: '韓團偶像Reaction風（追星梗）', prompt: '參考角色偶像化變形，設計12款LINE貼紙，韓團reaction風格，誇張尖叫表情，台灣慣用語繁體中文，文字像舞台字幕，劇情像追星名場面' },
            { label: '短影音字幕風（TikTok Reels感）', prompt: '參考角色設計12張LINE貼紙，短影音字幕風格，角色動作像Reels截圖，台灣慣用語繁體中文，文字超大置中，排版像影片梗字幕，節奏感強' },
            { label: '超潮插畫塗層風（Poster Graphic Design）', prompt: '參考角色設計12張LINE貼紙，潮流插畫海報風，強烈構圖與字體設計，台灣慣用語繁體中文，排版像潮牌宣傳圖，獨特視覺衝擊' },
            { label: 'Streetwear Graffiti Sticker Pack（潮牌塗鴉）', prompt: 'Design 12 LINE stickers with the reference character in streetwear graffiti style, bold spray typography, urban hype aesthetic, anime-meets-skate culture, energetic poses' },
            { label: 'Neo-Chinese Pop Cute（新國潮可愛風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，新國潮可愛風格，融合東方圖案與現代潮流配色，台灣慣用語繁體中文呈現，文字排版像潮流包裝設計，角色動作誇張，吸睛又獨特' },
            { label: 'Cinematic Blur Motion Reaction（動態模糊反應包）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，動態模糊Motion Blur潮流風格，角色像突然衝出去或震驚瞬間，台灣慣用語繁體中文呈現，文字排版像短影音截圖，節奏超強吸睛' },
            { label: 'Sticker Bomb Maximalism（貼紙爆炸滿版風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，Sticker Bomb滿版潮流風格，構圖塞滿小元素與誇張裝飾，台灣慣用語繁體中文呈現，文字像街頭貼紙拼貼，姿勢變化極多，視覺衝擊強' },
            { label: 'Glow Outline Neon Icon（霓虹線框icon）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，霓虹線框icon潮流風格，角色以發光輪廓呈現，台灣慣用語繁體中文呈現，文字排版像夜店招牌字幕，姿勢動感強烈，吸睛度爆表' },
            { label: 'Holographic Prism Pop（全息棱鏡潮流）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，全息棱鏡Holographic潮流風格，角色表面帶彩虹折射光澤，台灣慣用語繁體中文呈現，文字排版像潮流包裝燙金標籤，姿勢誇張閃耀，吸睛度極強' },
            { label: 'Neon Street Photography Flash（街拍閃光燈潮）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，霓虹街拍閃光燈風格，角色像夜生活抓拍瞬間，台灣慣用語繁體中文呈現，文字排版像潮流街拍標題，超酷吸睛' },
        ]
    },
    {
        categoryName: '科幻遊戲風',
        items: [
            { label: '像素遊戲 RPG 表情包風', prompt: '將參考角色像素化RPG風格，設計12張LINE貼紙，台灣慣用語繁體中文，文字像遊戲UI提示框，動作像角色技能動畫，創意排版' },
            { label: 'Cyber Emoji Glow（科技emoji霓虹感）', prompt: 'Create 12 neon cyber emoji stickers from the reference character, glowing outlines, futuristic UI text, techno meme style, short English phrases like "LOL" "AFK" "BRUH"' },
            { label: 'Chibi RPG Status Effect Pack（遊戲狀態貼圖）', prompt: 'Reference character as chibi RPG character stickers, 12 status effects like "HP LOW" "STUNNED" "LEVEL UP", game UI typography, anime emoji vibe' },
            { label: 'Neo-Transparent Glassmorphism（玻璃感UI潮流）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，玻璃感Glassmorphism潮流風格，半透明UI質感與柔光邊緣，台灣慣用語繁體中文呈現，文字排版像未來手機介面浮動字幕，姿勢變化豐富，極具設計感' },
            { label: 'Retro Pixel UI Sticker（復古像素介面風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，復古像素遊戲UI風格，角色像8-bit動畫角色，台灣慣用語繁體中文呈現，文字排版像遊戲提示框與狀態欄，每張像RPG劇情事件' },
            { label: 'Cute Horror Game UI（恐怖遊戲介面萌）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，可愛恐怖遊戲UI風格，角色像驚悚遊戲裡的萌系主角，台灣慣用語繁體中文呈現，文字排版像任務提示框，反差感爆紅' },
            { label: 'Super Flat Icon System（扁平圖標系統）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，超扁平icon系統設計風格，角色像App圖示般高度簡化，台灣慣用語繁體中文呈現，文字排版像功能按鈕標籤，現代感極強' },
            { label: 'Cute Sci-Fi Control Panel（科幻控制面板）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，科幻控制面板UI風格，角色像太空艙內的操作員，台灣慣用語繁體中文呈現，文字排版像系統提示訊息，每張如未來動畫劇情' },
            { label: 'Sci-Fi Retro Anime VHS（VHS復古科幻）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，VHS復古科幻動畫風格，畫面帶掃描線與舊電視質感，台灣慣用語繁體中文呈現，文字排版像80年代動畫字幕，潮流復古吸睛' },
            { label: 'Futuristic AR Popup Sticker（AR彈窗未來感）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，AR彈窗未來介面風格，角色像從螢幕跳出的提示角色，台灣慣用語繁體中文呈現，文字排版像系統通知彈窗，科技感強烈又可愛' },
            { label: 'Cute Space Mission Patch（太空任務徽章）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，太空任務徽章Patch風格，角色像NASA吉祥物，台灣慣用語繁體中文呈現，文字排版像任務代號標籤，每張如太空動畫番外篇' },
        ]
    },
    {
        categoryName: '藝術插畫風',
        items: [
            { label: '浮世繪＋日式復古動畫融合', prompt: '參考角色日式復古浮世繪動畫混合風格，設計12款LINE貼紙，台灣慣用語繁體中文，文字排版像復古招牌，構圖藝術化，動作誇張幽默' },
            { label: '手繪塗鴉動畫風（獨立動畫感）', prompt: '參考角色變形成手繪塗鴉動畫風，設計12款LINE貼紙，粗線條與隨性筆觸，台灣慣用語繁體中文，文字像手寫塗鴉，構圖自由有創意' },
            { label: 'Pinterest Sticker Collage Aesthetic（拼貼文青）', prompt: 'Design 12 LINE stickers in Pinterest collage aesthetic, layered paper textures, cute doodles, reference character integrated with trendy typography, soft modern layout' },
            { label: 'Paper Cut Collage（紙雕拼貼風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，紙雕拼貼藝術風格，層層紙張材質與手作質感，台灣慣用語繁體中文呈現，文字排版像手帳貼紙，姿勢活潑多變，每張像童話動畫場景' },
            { label: 'Minimal Line Art + Punchline（極簡線稿梗句）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，極簡線稿插畫風格，角色用最少線條呈現但表情到位，台灣慣用語繁體中文呈現，文字像一句梗Punchline，排版俐落時髦，適合爆款貼圖' },
            { label: 'Surreal Museum Art Sticker（美術館超現實）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，超現實美術館藝術風格，角色像出現在畫框中的奇幻人物，台灣慣用語繁體中文呈現，文字排版像展覽標籤，劇情感獨特高級' },
            { label: 'Luxury Calligraphy Brush Pop（書法潮流混搭）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，書法筆刷潮流混搭風格，角色搭配潑墨筆觸與動態字體，台灣慣用語繁體中文呈現，文字像帥氣書法招式名，每張如武俠動畫必殺技' },
            { label: 'Museum Poster Typography（美術館海報字排）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，美術館海報字排風格，角色像展覽主視覺人物，台灣慣用語繁體中文呈現，文字排版像現代藝術展標題，構圖高級極簡，吸睛又獨特' },
            { label: 'Cute Medieval Manuscript（中世紀手抄本萌）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，中世紀手抄本插畫風格，角色像古書邊角的可愛小怪物，台灣慣用語繁體中文呈現，文字排版像古卷註解，荒謬又吸睛' },
            { label: 'Cute DIY Craft Sticker（手作拼貼風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，DIY手作拼貼風格，像剪紙與貼紙手帳作品，台灣慣用語繁體中文呈現，文字排版像手寫便利貼，溫暖可愛超耐看' },
        ]
    },
    {
        categoryName: '商業可愛風',
        items: [
            { label: '超可愛貼貼風（LINE熱門商業款）', prompt: '以參考角色為主角，設計12張LINE貼紙，簡潔可愛商業貼圖風，角色線條乾淨，背景留白，台灣慣用語繁體中文，文字排版整齊但活潑，動作變化豐富' },
            { label: '3D黏土動畫風（像Pingu/Stop-motion）', prompt: '參考角色變形成3D黏土定格動畫風，設計12張LINE貼紙，立體材質柔軟可愛，台灣慣用語繁體中文，文字像貼紙標籤，動作幽默像動畫片段' },
            { label: '極簡emoji貼圖風（爆款商業感）', prompt: '將參考角色極簡化emoji貼圖風，設計12款LINE貼紙，粗線條簡單表情，台灣慣用語繁體中文，文字短句搭配角色動作，排版像社群表情包，乾淨留白' },
            { label: '扁平插畫品牌風（像無印＋LINE Friends）', prompt: '參考角色扁平插畫品牌化，設計12張LINE貼紙，簡約色塊與乾淨線條，台灣慣用語繁體中文，文字排版整齊有設計感，角色可愛耐看' },
            { label: 'AI潮流毛絨玩偶風（Plush Toy Core）', prompt: '參考角色變形成毛絨玩偶公仔風格，設計12張LINE貼紙，柔軟材質3D可愛，台灣慣用語繁體中文，文字像玩具包裝標籤，動作誇張萌化' },
            { label: '泡泡Q版動態感（Sticker Bounce Style）', prompt: '參考角色Q版圓潤化，設計12張LINE貼紙，泡泡感強烈，動作像彈跳動畫，台灣慣用語繁體中文，文字排版跟著動作變形，超可愛活潑' },
            { label: 'Pixar Reaction Face Style（皮克斯誇張表情）', prompt: 'Reference character transformed into Pixar-style expressive sticker pack, 12 unique poses, exaggerated facial emotions, cinematic lighting, playful typography in English, meme-worthy reactions' },
            { label: 'Sanrio Kawaii Pop（Hello Kitty爆款可愛）', prompt: 'Turn the reference character into Sanrio-inspired kawaii style, pastel colors, soft outlines, 12 cute LINE stickers, sweet expressions, playful short English captions' },
            { label: 'Cute Blob Character Trend（果凍團子風）', prompt: 'Turn the reference character into a cute blob mascot style, squishy proportions, funny bouncing poses, 12 stickers with simple viral captions, ultra trendy kawaii meme' },
            { label: 'Dreamy Soft Airbrush Style（柔霧噴槍風）', prompt: 'Reference character in dreamy soft airbrush illustration style, smooth gradients, glossy highlights, delicate emotions, 12 stickers like modern aesthetic emojis' },
            { label: '3D Toy Figure Stickers（潮流公仔風）', prompt: 'Turn the reference character into a designer toy figure style, 3D collectible look, cute big head proportions, 12 stickers with fun English catchphrases' },
            { label: 'Luxury Minimal Emoji (Apple-like)（高級極簡）', prompt: 'Create 12 ultra-minimal luxury emoji-style stickers, reference character simplified, clean outlines, subtle typography, modern premium aesthetic, short captions only' },
            { label: 'Soft 3D Emoji Core（柔軟立體表情包）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，柔軟3D emoji風格，角色像手機貼圖般圓潤立體，台灣慣用語繁體中文呈現，文字短句搭配動作表情，構圖簡潔但吸睛，每張像社群反應包' },
            { label: 'Cute Minimal Pastel UI（粉彩介面簡約）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，粉彩UI極簡風格，角色像app介面中的可愛小助手，台灣慣用語繁體中文呈現，文字排版像按鈕標籤，乾淨又流行' },
        ]
    },
    {
        categoryName: '台灣日常風',
        items: [
            { label: 'Cute Office Meme Style（上班族爆紅梗）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，上班族迷因風格，角色像社畜日常動畫，台灣慣用語繁體中文呈現，文字排版像辦公室便利貼吐槽，劇情感強烈，每張都像職場名場面' },
            { label: 'ASMR Cozy Foodie Sticker（療癒食物系）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，ASMR療癒食物系風格，角色在吃喝或抱著食物，台灣慣用語繁體中文呈現，文字像甜點包裝小標籤，畫面溫暖可愛超流行' },
            { label: 'Notebook Margin Doodle（課本邊角塗鴉風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，課本邊角塗鴉風格，像學生隨手畫的小劇場角色，台灣慣用語繁體中文呈現，文字像筆記旁的吐槽註解，構圖自由可愛，青春感爆棚' },
            { label: 'Film Camera Snapshot Retro（底片快照復古）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，底片相機快照復古風格，帶顆粒與閃光燈效果，台灣慣用語繁體中文呈現，文字排版像拍立得日期標註，每張像青春動畫回憶片段' },
            { label: 'Cute Café Menu Sticker（咖啡廳菜單風）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，咖啡廳菜單插畫風格，角色搭配飲料甜點情境，台灣慣用語繁體中文呈現，文字排版像餐廳手寫菜單，溫暖又流行' },
            { label: 'Lo-fi Night Bus Mood（深夜公車氛圍）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，深夜lo-fi公車氛圍風格，角色像在夜晚通勤發呆，台灣慣用語繁體中文呈現，文字排版像內心旁白字幕，療癒又有故事感' },
            { label: 'Cute Classroom Meme Pack（教室梗圖系列）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，校園教室迷因風格，角色像學生上課崩潰日常，台灣慣用語繁體中文呈現，文字排版像黑板吐槽，劇情感超強爆紅' },
            { label: 'Bubble Tea Pop Culture（珍奶流行文化）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，珍奶流行文化風格，角色搭配飲料杯與Q彈元素，台灣慣用語繁體中文呈現，文字排版像手搖杯封膜，超台又超可愛' },
            { label: 'Cute Convenience Store Drama（超商小劇場）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，便利商店小劇場風格，角色像在7-11裡發生荒謬日常，台灣慣用語繁體中文呈現，文字排版像收據吐槽，超生活爆款' },
        ]
    },
    {
        categoryName: '高級質感風',
        items: [
            { label: 'Luxury Fashion Editorial Sticker（時尚雜誌貼圖）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，高級時尚雜誌Editorial風格，角色動作像伸展台定格，台灣慣用語繁體中文呈現，文字排版像精品雜誌標題，極簡但超有質感' },
            { label: 'Luxury Japanese Packaging Minimal（高級日式包裝）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，高級日式包裝設計風格，極簡留白與精緻字體排版，台灣慣用語繁體中文呈現，角色姿勢優雅，整體像精品伴手禮貼紙' },
            { label: 'High Fashion Runway Reaction（伸展台表情包）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，高級時裝伸展台反應包風格，角色姿勢像時尚定格，台灣慣用語繁體中文呈現，文字排版像雜誌標題，冷酷又搞笑的反差感' },
            { label: 'Cute Luxury Gold Stamp（精品金印章）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，精品金印章風格，角色搭配燙金標章與極簡高級排版，台灣慣用語繁體中文呈現，文字像精品認證標籤，質感爆棚獨特' },
            { label: 'Luxury Perfume Label Style（香水標籤高級）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，高級香水標籤風格，角色搭配精品排版與留白，台灣慣用語繁體中文呈現，文字像香氛命名，極簡奢華感強烈' },
            { label: 'Luxury Coffee Roaster Label（咖啡豆包裝）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，精品咖啡烘豆包裝風格，角色搭配高級字排，台灣慣用語繁體中文呈現，文字像咖啡命名標籤，文青又時髦' },
            { label: 'Futuristic Neon Snack Packaging（零食包裝潮）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，未來霓虹零食包裝風格，角色像新潮洋芋片吉祥物，台灣慣用語繁體中文呈現，文字排版像商品標語，潮到爆' },
            { label: 'Luxury Neon Sign Minimal（精品霓虹招牌）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，精品霓虹招牌極簡風格，角色搭配發光字體與大留白，台灣慣用語繁體中文呈現，文字排版像高級夜店招牌，極潮吸睛' },
        ]
    },
    {
        categoryName: '奇幻混搭風',
        items: [
            { label: '黑暗哥德動畫風（Tim Burton感）', prompt: '參考角色哥德式變形，設計12款LINE貼紙，暗黑童話動畫風，陰影強烈，怪誕可愛，台灣慣用語繁體中文，文字排版像電影字幕，劇情感強烈' },
            { label: '可愛厭世風（Chill Doom Cute）', prompt: '參考角色設計12張LINE貼紙，可愛厭世風格，表情呆萌但情緒疲倦，台灣慣用語繁體中文，文字小但致命，排版留白像文青貼紙，日常崩潰劇情感' },
            { label: 'Kawaii Horror（可愛恐怖混搭）', prompt: '參考角色設計12款LINE貼紙，可愛恐怖混搭風，萌系外表但氣氛詭異，台灣慣用語繁體中文，文字像恐怖童話台詞，劇情反差強' },
            { label: 'Dreamcore Pastel Surreal（夢核粉彩超現實）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，Dreamcore粉彩超現實風格，夢境般柔霧背景與怪奇可愛元素，台灣慣用語繁體中文呈現，文字像夢中旁白，姿勢奇幻多變，吸睛又療癒' },
            { label: 'Ultra Cute Animal Costume Cosplay（動物裝扮潮）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，角色穿各種動物裝扮Cosplay潮流風格，台灣慣用語繁體中文呈現，文字排版像可愛角色標籤，每張像動畫番外篇，變化豐富超吸粉' },
            { label: 'Cute Chaos Scribble Pop（亂畫潮流崩壞可愛）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，可愛混亂塗鴉潮流風格，角色線條隨性但表情超有戲，台灣慣用語繁體中文呈現，文字像手寫爆炸塗鴉，姿勢誇張超吸睛' },
            { label: 'Cute Weather Forecast Pack（天氣預報情緒貼）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，天氣預報情緒風格，角色搭配晴天雨天雷暴等心情象徵，台灣慣用語繁體中文呈現，文字排版像氣象ICON提示，每張都超可愛實用' },
            { label: 'Wholesome Family Sitcom Style（家庭動畫喜劇）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，家庭動畫喜劇風格，角色像情境動畫主角，台灣慣用語繁體中文呈現，文字排版像電視字幕吐槽，每張像日常劇名場面' },
            { label: 'Cute Tarot Card Mystic（可愛塔羅神秘）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，可愛塔羅牌神秘風格，角色搭配占卜符號與夢幻框架，台灣慣用語繁體中文呈現，文字排版像命運旁白，每張都像魔法故事卡' },
            { label: 'Neon Karaoke Subtitle（霓虹卡拉OK字幕）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，霓虹卡拉OK字幕風格，角色像在唱歌或吐槽，台灣慣用語繁體中文呈現，文字排版像跳動歌詞字幕，動作誇張歡樂，每張像音樂動畫名場面' },
            { label: 'Cute Dream Journal Mood（夢日記旁白）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，夢日記情緒風格，角色像在記錄奇怪夢境，台灣慣用語繁體中文呈現，文字排版像日記旁白，療癒又超現實' },
            { label: 'Cute Mythology Card Set（神話角色卡）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，可愛神話卡牌風格，角色像傳說小英雄，台灣慣用語繁體中文呈現，文字排版像技能說明，每張如動畫冒險番' },
            { label: 'Cute Airport Travel Sticker Pack（旅行行李貼）', prompt: '將參考圖片的角色變形並設計12種LINE貼紙，機場旅行行李貼紙風格，角色像旅遊紀念貼，台灣慣用語繁體中文呈現，文字排版像登機證標籤，每張如旅行動畫片段' },
        ]
    },
];

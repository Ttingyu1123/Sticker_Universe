
export interface Sticker {
  id: string;
  imageUrl: string;
  phrase: string;
  timestamp: number;
}


export interface Sticker {
  id: string;
  imageUrl: string;
  phrase: string;
  timestamp: number;
}

export interface PhraseOption {
  text: string;
  description: string;
}

export interface StickerStyle {
  id: string;
  name: string;
  description: string;
  promptSnippet: string;
}

export interface StickerTheme {
  id: string;
  name: string;
  icon: string; // Emoji or Lucide icon name
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  styles: StickerStyle[];
  phrases: PhraseOption[];
}

export const THEMES: StickerTheme[] = [
  {
    id: 'taiwanese',
    name: '台味霓虹',
    icon: 'Zap',
    colors: {
      primary: 'text-pink-500',
      secondary: 'bg-pink-500',
      background: 'from-purple-900 to-slate-900' // Dark mode vibe
    },
    styles: [
      {
        id: 'cel-shaded',
        name: '賽璐璐動漫',
        description: '經典、乾淨、無邊框',
        promptSnippet: 'Modern high-quality Japanese "Cel-Shaded" anime art. Clean black ink lines. STRICT RULE: NO WHITE BORDER, NO OUTLINE, NO GLOW. The character must be a raw sprite with edges touching the green background directly. Render as a character asset for a video game.'
      },
      {
        id: 'retro-90s',
        name: '90年代復古',
        description: '懷舊畫質，無邊框',
        promptSnippet: '1990s retro anime aesthetic. Slightly muted colors. STRICT RULE: NO WHITE BORDER, NO OUTLINE, NO WHITE RADIANCE. The character must be rendered directly onto the green background like a cell animation layer.'
      },
      {
        id: 'pop-art',
        name: '波普風',
        description: '強烈對比，無邊框',
        promptSnippet: 'Bold Pop Art style. Vibrant colors, dot patterns. STRICT RULE: NO WHITE BORDER, NO OUTLINE. The character must be a clean-cut graphic element with NO border against the green background.'
      },
      {
        id: 'realistic',
        name: '寫實貼紙',
        description: '3D質感，像真的貼紙',
        promptSnippet: 'Hyper-realistic vinyl sticker style. High detail 3D rendering. Sharp focus, subtle glossy finish, slight dimensional feel. STRICT RULE: NO WHITE BORDER, NO OUTLINE. The subject should be isolated against the green background.'
      },
      {
        id: 'chibi-cute',
        name: 'Q版可愛',
        description: '大頭小身，超級可愛',
        promptSnippet: 'Super deformed (SD) "Chibi" anime style. Big head, small body, extremely cute and expressive. Bright colors, soft rounded smooth lines. STRICT RULE: NO WHITE BORDER, NO OUTLINE. Character asset.'
      },
      {
        id: 'gameboy-pixel',
        name: '懷舊像素',
        description: '8-bit 電玩風格',
        promptSnippet: '8-bit pixel art style, Game Boy Color aesthetic. Low resolution, blocky pixels, limited color palette. Retro gaming character sprite. Crisp edges.'
      }
    ],
    phrases: [
      { text: "歸剛欸", description: "整天都在搞這個" },
      { text: "修但幾勒", description: "等一下" },
      { text: "我就爛", description: "自暴自棄的自信" },
      { text: "是在哈囉", description: "到底在搞什麼" },
      { text: "笑死", description: "超級好笑" },
      { text: "母湯喔", description: "不行喔" },
      { text: "真的假的", description: "驚訝、懷疑" },
      { text: "有料喔", description: "很有實力" },
      { text: "蛤？", description: "聽不懂/挑釁" },
      { text: "雀食", description: "確實" },
      { text: "哭阿", description: "崩潰" },
      { text: "好喔", description: "敷衍/答應" }
    ]
  },
  {
    id: 'literary',
    name: '文青手繪',
    icon: 'Feather',
    colors: {
      primary: 'text-teal-600',
      secondary: 'bg-teal-600',
      background: 'from-stone-50 to-orange-50' // Light paper vibe
    },
    styles: [
      {
        id: 'watercolor',
        name: '透明水彩',
        description: '輕透、暈染、手感',
        promptSnippet: 'Soft watercolor illustration style. Gentle brush strokes, pastel colors, white paper texture feeling. Dreamy, airy, and cute. NO harsh lines.'
      },
      {
        id: 'crayon',
        name: '童趣蠟筆',
        description: '粗糙質感、可愛',
        promptSnippet: 'Cute crayon drawing style. Rough texture, childlike innocence, warm and cozy atmosphere. Hand-drawn aesthetic.'
      },
      {
        id: 'risograph',
        name: '孔版印刷',
        description: '復古網點、錯位疊印',
        promptSnippet: 'Risograph print style. Grainy texture, halftone dots, slight color misalignment. Retro 2-3 color palette (teal, pink, yellow). Artistic, independent zine aesthetic. STRICT RULE: NO WHITE BORDER.'
      },
      {
        id: 'colored-pencil',
        name: '溫暖色鉛筆',
        description: '手感筆觸、溫柔日常',
        promptSnippet: 'Soft colored pencil drawing. Visible pencil texture, gentle strokes, cozy and warm atmosphere. Sketch paper background texture feel. Hand-drawn illustration.'
      },
      {
        id: 'matisse',
        name: '馬蒂斯剪紙',
        description: '大膽色塊、藝術拼貼',
        promptSnippet: 'Henri Matisse paper cutouts style. Organic abstract shapes, bold flat colors, simple composition. Artistic collage aesthetic. Minimalist but vibrant.'
      },
      {
        id: 'fountain-pen',
        name: '鋼筆淡彩',
        description: '優雅線條、淡雅上色',
        promptSnippet: 'Fountain pen and wash sketch. Elegant ink lines with light watercolor wash. Urban sketching style. Sophisticated, loose, and artistic.'
      },
      {
        id: 'ukiyo-e',
        name: '浮世繪',
        description: '日式版畫風格',
        promptSnippet: 'Japanese Ukiyo-e woodblock print style. Flat perspective, bold outlines, traditional patterns. Hokusai or Hiroshige aesthetic. Vintage texture.'
      },
      {
        id: 'stamp-art',
        name: '橡皮章',
        description: '手作蓋印質感',
        promptSnippet: 'Rubber stamp art style. Monochromatic or dual-tone ink. Texture of ink on paper, slight unevenness, negative space. Hand-carved aesthetic.'
      }
    ],
    phrases: [
      { text: "歲月靜好", description: "享受平靜時光" },
      { text: "可可愛愛", description: "單純的可愛" },
      { text: "早安晨之美", description: "美好的早晨" },
      { text: "今天也要加油", description: "自我勉勵" },
      { text: "休息一下", description: "放鬆時刻" },
      { text: "小確幸", description: "微小而確切的幸福" },
      { text: "收到", description: "優雅的確認" },
      { text: "謝謝你", description: "溫暖的感謝" },
      { text: "日日是好日", description: "每天都是好日子" },
      { text: "慢慢來", description: "不急不躁" },
      { text: "保持善良", description: "內心的堅持" },
      { text: "生活明朗", description: "充滿希望" }
    ]
  },
  {
    id: '3d-clay',
    name: '3D軟糖黏土',
    icon: 'Cloud',
    colors: {
      primary: 'text-sky-500',
      secondary: 'bg-sky-500',
      background: 'from-blue-50 to-pink-50' // Soft pastel layout
    },
    styles: [
      {
        id: 'claymation',
        name: '黏土定格',
        description: '手工捏塑質感',
        promptSnippet: 'Claymation style, plasticine texture, thumbprints visible, stop-motion animation aesthetic. Soft lighting, 3D render. Cute and rounded.'
      },
      {
        id: 'fluffy-fur',
        name: '毛絨絨',
        description: '柔軟毛球觸感',
        promptSnippet: '3D fluffy faux fur texture. Soft, cozy, plush toy aesthetic. Pixar style 3D rendering. Warm lighting, fuzzy edges.'
      },
      {
        id: 'glossy-balloon',
        name: '亮面氣球',
        description: '充氣膨脹感',
        promptSnippet: 'Glossy 3D balloon art style. inflated, shiny, plastic texture. Studio lighting, reflections. Vibrant colors, smooth surfaces.'
      },
      {
        id: 'felt-art',
        name: '羊毛氈',
        description: '溫暖毛躁質感',
        promptSnippet: 'Needle felted wool art style. Fuzzy texture, visible fibers, soft edges. Handmade craft aesthetic. Warm and cozy 3D object.'
      },
      {
        id: 'ceramic',
        name: '陶瓷娃娃',
        description: '光滑釉面質感',
        promptSnippet: 'Glazed ceramic figurine style. Shiny porcelain texture, smooth surface, heavy feeling. Studio lighting with highlights. Hand-painted details.'
      },
      {
        id: 'low-poly',
        name: '低多邊形',
        description: '幾何摺紙3D',
        promptSnippet: 'Low poly 3D art style. Geometric shapes, faceted surfaces, sharp edges. Minimalist shading, vibrant colors. Papercraft or retro 3D game aesthetic.'
      }
    ],
    phrases: [
      { text: "不想努力了", description: "軟爛心態" },
      { text: "融化中", description: "被可愛擊暈" },
      { text: "抱抱", description: "討拍" },
      { text: "軟爛每一天", description: "生活態度" },
      { text: "摸摸頭", description: "安慰" },
      { text: "我就廢", description: "自信廢柴" },
      { text: "登出人生", description: "暫時消失" },
      { text: "想睡覺", description: "日常狀態" },
      { text: "充電中", description: "勿擾模式" },
      { text: "耍廢無罪", description: "理所當然" },
      { text: "好像可以", description: "勉強接受" },
      { text: "隨便啦", description: "無所謂" }
    ]
  },
  {
    id: 'y2k',
    name: 'Y2K千禧辣妹',
    icon: 'Disc',
    colors: {
      primary: 'text-fuchsia-600',
      secondary: 'bg-fuchsia-600',
      background: 'from-slate-900 to-fuchsia-900' // Cyber vibe
    },
    styles: [
      {
        id: 'liquid-metal',
        name: '液態金屬',
        description: '流動銀色質感',
        promptSnippet: 'Y2K aesthetic, chrome liquid metal text and shapes. 3D metallic render, futuristic, shiny silver, reflections. 2000s retro-futurism.'
      },
      {
        id: 'acid-graphics',
        name: '酸性設計',
        description: '高飽和、迷幻',
        promptSnippet: 'Acid graphics style. High contrast, neon colors, geometric shapes, distorted fonts, glitch texture. Rave culture aesthetic.'
      },
      {
        id: 'pixel-glitch',
        name: '像素故障',
        description: '電子訊號干擾',
        promptSnippet: 'Pixel art with digital glitch effects. RGB shift, data moshing, retro computer aesthetic. Cyberpunk 2000s vibe.'
      },
      {
        id: 'vaporwave',
        name: '蒸氣波',
        description: '粉紫霓虹夢境',
        promptSnippet: 'Vaporwave aesthetic. Pink and cyan neon gradient, retro computer graphics, greek statues, palm trees. Surpuk dreamscape. Nostalgic 80s/90s.'
      },
      {
        id: 'holographic',
        name: '雷射貼紙',
        description: '七彩反光質感',
        promptSnippet: 'Holographic sticker texture. Iridescent rainbow gradients, metallic foil finish. Shiny, reflective, futuristic. Prismatic color shifts.'
      },
      {
        id: 'cyberpunk',
        name: '賽博龐克',
        description: '高科技低生活',
        promptSnippet: 'Cyberpunk anime style. Dark background, neon lights (pink/blue/green), mechanical details, futuristic techwear. High contrast, edgy.'
      }
    ],
    phrases: [
      { text: "少來煩我", description: "拒絕打擾" },
      { text: "登入中...", description: "連線狀態" },
      { text: "EMO了", description: "情緒低落" },
      { text: "太無聊", description: "冷漠" },
      { text: "心情複雜", description: "難以言喻" },
      { text: "保持聯絡", description: "客套話" },
      { text: "拒絕往來", description: "封鎖" },
      { text: "沒有靈魂", description: "放空" },
      { text: "禁止觸摸", description: "私人空間" },
      { text: "載入錯誤", description: "當機" },
      { text: "誰理你", description: "不在乎" },
      { text: "別吵", description: "安靜點" }
    ]
  },
  {
    id: 'american-retro',
    name: '美式復古漫畫',
    icon: 'Tv',
    colors: {
      primary: 'text-red-600',
      secondary: 'bg-red-600',
      background: 'from-yellow-50 to-red-50' // Vintage paper
    },
    styles: [
      {
        id: 'rubber-hose',
        name: '橡皮管動畫',
        description: '30年代米老鼠風',
        promptSnippet: '1930s rubber hose animation style. Black and white vintage cartoon (like Cuphead or old Mickey). Pie eyes, noodle limbs. Retro grain.'
      },
      {
        id: 'pop-comic',
        name: '普普漫畫',
        description: '美式英雄漫畫',
        promptSnippet: 'Vintage American comic book style. Halftone dots, bold black outlines, primary colors (Red, Blue, Yellow). Speech bubbles, dynamic action pose.'
      },
      {
        id: 'vintage-poster',
        name: '復古海報',
        description: '50年代廣告畫報',
        promptSnippet: '1950s vintage advertising poster style. Textured paper effect, slightly faded colors, retro typography. Pin-up or domestic aesthetic.'
      },
      {
        id: 'old-school-tattoo',
        name: '美式刺青',
        description: '粗線條老學校',
        promptSnippet: 'Old school American traditional tattoo style. Bold black outlines, limited color palette (red, green, yellow, black). Roses, daggers, skulls aesthetic.'
      },
      {
        id: 'graffiti',
        name: '街頭塗鴉',
        description: '噴漆 wild style',
        promptSnippet: 'Street graffiti art style. Spray paint texture, drips, wildstyle lettering, vibrant colors. Urban hip-hop aesthetic. Bold and rebellious.'
      },
      {
        id: 'noir-comic',
        name: '黑色漫畫',
        description: '高反差黑白',
        promptSnippet: 'Film Noir comic style. High contrast Black and White. Heavy shadows (chiaroscuro), dramatic lighting. Frank Miller Sin City aesthetic.'
      }
    ],
    phrases: [
      { text: "OMG!", description: "驚訝" },
      { text: "NO WAY!", description: "不敢相信" },
      { text: "BINGO!", description: "答對了" },
      { text: "WHOOPS!", description: "搞砸了" },
      { text: "NICE JOB!", description: "做得好" },
      { text: "COOL!", description: "酷斃了" },
      { text: "POW!", description: "衝擊" },
      { text: "YIKES!", description: "糟糕" },
      { text: "HELLO!", description: "打招呼" },
      { text: "WOW!", description: "讚嘆" },
      { text: "OOPS!", description: "出錯了" },
      { text: "YEAH!", description: "贊同" }
    ]
  },
  {
    id: 'romantic',
    name: '浪漫夢幻',
    icon: 'Heart',
    colors: {
      primary: 'text-rose-400',
      secondary: 'bg-rose-400',
      background: 'from-rose-50 to-pink-100' // Romantic vibe
    },
    styles: [
      {
        id: 'shojo-anime',
        name: '少女漫畫',
        description: '閃亮大眼、星光',
        promptSnippet: '90s Shojo Anime style. Big sparkling eyes, floating flowers and stars background. Soft pastel colors, flowy hair. Sailor Moon aesthetic. Dreamy and romantic.'
      },
      {
        id: 'art-nouveau',
        name: '慕夏風',
        description: '華麗裝飾線條',
        promptSnippet: 'Art Nouveau style (Alphonse Mucha). Intricate floral decorative borders, flowing lines, organic curves. Elegant, vintage, highly detailed. Soft gold and pastel tones.'
      },
      {
        id: 'webtoon',
        name: '韓漫唯美',
        description: '精緻光影、夢幻',
        promptSnippet: 'High-quality Korean Webtoon style. Exquisite lighting, glossy hair, soft blush. Detailed, beautiful rendering, romantic atmosphere. Manhwa aesthetic.'
      },
      {
        id: 'rococo',
        name: '洛可可',
        description: '蕾絲珍珠下午茶',
        promptSnippet: 'Rococo art style. Pastel colors, frilly lace, ribbons, pearls, roses. intricate details, ornate and elegant. Marie Antoinette aesthetic. Soft and powdery.'
      },
      {
        id: 'stained-glass',
        name: '彩繪玻璃',
        description: '透光色彩、教會',
        promptSnippet: 'Stained glass art style. Bold black lead lines, vibrant translucent colors. Light shining through glass effect. Geometric and floral patterns. Spiritual and ethereal.'
      },
      {
        id: 'tarot-card',
        name: '塔羅牌風',
        description: '神秘學、華麗',
        promptSnippet: 'Tarot card illustration style. Art Nouveau influence, symbolic elements, decorative frame. Mystical, magical, gold leaf details. Sun, Moon, Star motifs.'
      }
    ],
    phrases: [
      { text: "心動", description: "怦然心動" },
      { text: "愛你", description: "告白" },
      { text: "想見你", description: "思念" },
      { text: "晚安", description: "甜蜜問候" },
      { text: "抱一個", description: "溫暖擁抱" },
      { text: "在一起", description: "承諾" },
      { text: "小仙女", description: "稱讚" },
      { text: "花癡中", description: "迷戀" },
      { text: "戀愛腦", description: "沉浸愛河" },
      { text: "浪漫突進", description: "熱情" },
      { text: "美夢成真", description: "祝福" },
      { text: "唯美日常", description: "生活美學" }
    ]
  }
];

// Fallback for backward compatibility if needed, but we should switch to THEMES
export const COMMON_PHRASES = THEMES[0].phrases;
export const STICKER_STYLES = THEMES[0].styles;


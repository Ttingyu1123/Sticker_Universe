
// --- Constants & Types ---
// NOTE: `label` is kept verbatim (unchanged) on FESTIVALS and CARD_STYLES because it is also
// used as functional text fed into AI prompt requests (see GreetingCardTab.tsx optimizePrompt /
// generateCardData) and stored on HistoryItem. `labelKey` is added purely for UI rendering so
// that display text can be localized without altering AI-facing behavior.
export const FESTIVALS = [
    { id: 'new-year', label: '🧧 Lunar New Year (農曆新年 - 2026 Year of the Horse 🐎)', labelKey: 'generator.greetingCard.festivals.newYear', icon: '🧧' },
    { id: 'christmas', label: '🎄 Christmas (聖誕節)', labelKey: 'generator.greetingCard.festivals.christmas', icon: '🎄' },
    { id: 'birthday', label: '🎂 Birthday (生日)', labelKey: 'generator.greetingCard.festivals.birthday', icon: '🎂' },
    { id: 'valentine', label: '❤️ Valentine\'s Day (情人節)', labelKey: 'generator.greetingCard.festivals.valentine', icon: '❤️' },
    { id: 'mother', label: '💐 Mother\'s Day (母親節)', labelKey: 'generator.greetingCard.festivals.mother', icon: '💐' },
    { id: 'father', label: '👔 Father\'s Day (父親節)', labelKey: 'generator.greetingCard.festivals.father', icon: '👔' },
    { id: 'graduation', label: '🎓 Graduation (畢業季)', labelKey: 'generator.greetingCard.festivals.graduation', icon: '🎓' },
    { id: 'thank-you', label: '🙏 Thank You (感謝卡)', labelKey: 'generator.greetingCard.festivals.thankYou', icon: '🙏' },
    { id: 'general', label: '✨ General Greeting (日常問候)', labelKey: 'generator.greetingCard.festivals.general', icon: '✨' },
];

export const CARD_STYLES = [
    { id: 'realistic-photo', label: '📸 Realistic Photo (真實攝影)', labelKey: 'generator.greetingCard.cardStyles.realisticPhoto', prompt: 'Professional photography, realistic human features, natural lighting, high detail, photorealistic portrait' },
    { id: 'vintage-photo', label: '📷 Vintage Photo (復古照片)', labelKey: 'generator.greetingCard.cardStyles.vintagePhoto', prompt: 'Vintage photo style, film grain, warm tones, nostalgic atmosphere, retro photography' },
    { id: 'polaroid', label: '📱 Polaroid (拍立得)', labelKey: 'generator.greetingCard.cardStyles.polaroid', prompt: 'Polaroid instant photo style, white border frame, casual snapshot, warm vintage colors' },
    { id: 'magazine-cover', label: '📰 Magazine Cover (雜誌封面)', labelKey: 'generator.greetingCard.cardStyles.magazineCover', prompt: 'Professional magazine cover style, fashion photography, studio lighting, glamorous portrait' },
    { id: 'watercolor', label: '🎨 Watercolor (水彩畫)', labelKey: 'generator.greetingCard.cardStyles.watercolor', prompt: 'Soft watercolor painting style, dreamy, artistic, elegant, pastel colors' },
    { id: 'oil-painting', label: '🖼️ Oil Painting (油畫)', labelKey: 'generator.greetingCard.cardStyles.oilPainting', prompt: 'Classic oil painting style, rich textures, vibrant colors, masterpiece, fine art' },
    { id: 'illustration', label: '✨ Modern Illustration (現代插畫)', labelKey: 'generator.greetingCard.cardStyles.illustration', prompt: 'Modern digital illustration, clean lines, vibrant colors, contemporary art style' },
    { id: 'chinese-painting', label: '🖌️ Chinese Ink (國畫水墨)', labelKey: 'generator.greetingCard.cardStyles.chinesePainting', prompt: 'Traditional Chinese ink painting style, elegant brushstrokes, minimalist, artistic zen' },
    { id: '3d-cartoon', label: '🧸 3D Cartoon (3D卡通)', labelKey: 'generator.greetingCard.cardStyles.threeDCartoon', prompt: 'Pixar style 3D cute cartoon, soft lighting, vibrant colors, 3D rendering' },
    { id: 'ghibli', label: '🍃 Anime Style (宮崎駿風)', labelKey: 'generator.greetingCard.cardStyles.ghibli', prompt: 'Studio Ghibli style, lush background, detailed anime aesthetic, whimsical' },
    { id: 'chibi', label: '🎀 Chibi Style (Q版風格)', labelKey: 'generator.greetingCard.cardStyles.chibi', prompt: 'Cute chibi style, super deformed characters, big eyes, adorable proportions' },
    { id: 'comic', label: '💥 Comic Book (美式漫畫)', labelKey: 'generator.greetingCard.cardStyles.comic', prompt: 'Comic book style, bold outlines, vibrant colors, dynamic composition, pop art' },
    { id: 'paper-cut', label: '✂️ Paper Cutout (剪紙藝術)', labelKey: 'generator.greetingCard.cardStyles.paperCut', prompt: 'Layered paper cut style, intricate details, shadow depth, craft aesthetic' },
    { id: 'collage', label: '🎨 Collage Art (拼貼藝術)', labelKey: 'generator.greetingCard.cardStyles.collage', prompt: 'Artistic collage style, mixed media, creative composition, textured layers' },
    { id: 'minimalist', label: '✏️ Minimalist (極簡線條)', labelKey: 'generator.greetingCard.cardStyles.minimalist', prompt: 'Minimalist line art, clean background, modern design, simple and elegant' },
    { id: 'pixel-art', label: '👾 Pixel Art (像素風)', labelKey: 'generator.greetingCard.cardStyles.pixelArt', prompt: 'Retro pixel art style, 16-bit, vibrant colors, nostalgic gaming aesthetic' },
    { id: 'fantasy', label: '🌟 Fantasy Art (奇幻藝術)', labelKey: 'generator.greetingCard.cardStyles.fantasy', prompt: 'Fantasy art style, magical atmosphere, dreamy lighting, ethereal and enchanting' },
];

export const FONTS = [
    { id: 'serif', labelKey: 'generator.greetingCard.fonts.serif', family: 'serif', className: 'font-serif' },
    { id: 'sans', labelKey: 'generator.greetingCard.fonts.sans', family: 'sans-serif', className: 'font-sans' },
    { id: 'mono', labelKey: 'generator.greetingCard.fonts.mono', family: 'monospace', className: 'font-mono' },
    { id: 'cursive', labelKey: 'generator.greetingCard.fonts.cursive', family: 'cursive', className: 'italic' },
];

export const TEXT_COLORS = [
    { id: '#333333', labelKey: 'generator.greetingCard.textColors.classicBlack', value: '#333333', class: 'bg-zinc-800' },
    { id: '#78350f', labelKey: 'generator.greetingCard.textColors.antiqueGold', value: '#78350f', class: 'bg-amber-900' },
    { id: '#1e3a8a', labelKey: 'generator.greetingCard.textColors.deepSeaBlue', value: '#1e3a8a', class: 'bg-blue-900' },
    { id: '#881337', labelKey: 'generator.greetingCard.textColors.wineRed', value: '#881337', class: 'bg-rose-900' },
    { id: '#064e3b', labelKey: 'generator.greetingCard.textColors.forestGreen', value: '#064e3b', class: 'bg-emerald-900' },
    { id: '#ffffff', labelKey: 'generator.greetingCard.textColors.pureWhite', value: '#ffffff', class: 'bg-white border border-cream-dark' },
];

export const ASPECT_RATIOS = [
    { id: '1:1', labelKey: 'generator.greetingCard.aspectRatios.square', value: '1:1' },
    { id: '3:4', labelKey: 'generator.greetingCard.aspectRatios.portraitCard', value: '3:4' },
    { id: '4:3', labelKey: 'generator.greetingCard.aspectRatios.landscapeCard', value: '4:3' },
    { id: '9:16', labelKey: 'generator.greetingCard.aspectRatios.story', value: '9:16' },
    { id: '16:9', labelKey: 'generator.greetingCard.aspectRatios.desktop', value: '16:9' },
    { id: '2:3', labelKey: 'generator.greetingCard.aspectRatios.portraitPostcard', value: '3:4' },
    { id: '3:2', labelKey: 'generator.greetingCard.aspectRatios.landscapePostcard', value: '4:3' },
];

export const CARD_BACKGROUNDS = [
    { id: 'cream', value: '#FDFCF8', labelKey: 'generator.greetingCard.cardBackgrounds.cream', class: 'bg-[#FDFCF8] border border-stone-200' },
    { id: 'white', value: '#FFFFFF', labelKey: 'generator.greetingCard.cardBackgrounds.white', class: 'bg-white border border-cream-dark' },
    { id: 'pink', value: '#FDF2F8', labelKey: 'generator.greetingCard.cardBackgrounds.pink', class: 'bg-pink-50 border border-pink-200' },
    { id: 'blue', value: '#EFF6FF', labelKey: 'generator.greetingCard.cardBackgrounds.blue', class: 'bg-blue-50 border border-blue-200' },
    { id: 'green', value: '#F0FDF4', labelKey: 'generator.greetingCard.cardBackgrounds.green', class: 'bg-green-50 border border-green-200' },
    { id: 'stone', value: '#1C1917', labelKey: 'generator.greetingCard.cardBackgrounds.stone', class: 'bg-stone-900 border border-stone-700' },
];

export interface HistoryItem {
    id: string;
    imageUrl: string;
    title: string;
    message: string;
    festival?: string;
    style?: string;
    visualPrompt: string;
    timestamp: number;
}

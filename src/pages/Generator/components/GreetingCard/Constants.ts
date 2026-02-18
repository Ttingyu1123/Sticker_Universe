
// --- Constants & Types ---
export const FESTIVALS = [
    { id: 'new-year', label: '🧧 Lunar New Year (農曆新年 - 2026 Year of the Horse 🐎)', icon: '🧧' },
    { id: 'christmas', label: '🎄 Christmas (聖誕節)', icon: '🎄' },
    { id: 'birthday', label: '🎂 Birthday (生日)', icon: '🎂' },
    { id: 'valentine', label: '❤️ Valentine\'s Day (情人節)', icon: '❤️' },
    { id: 'mother', label: '💐 Mother\'s Day (母親節)', icon: '💐' },
    { id: 'father', label: '👔 Father\'s Day (父親節)', icon: '👔' },
    { id: 'graduation', label: '🎓 Graduation (畢業季)', icon: '🎓' },
    { id: 'thank-you', label: '🙏 Thank You (感謝卡)', icon: '🙏' },
    { id: 'general', label: '✨ General Greeting (日常問候)', icon: '✨' },
];

export const CARD_STYLES = [
    { id: 'realistic-photo', label: '📸 Realistic Photo (真實攝影)', prompt: 'Professional photography, realistic human features, natural lighting, high detail, photorealistic portrait' },
    { id: 'vintage-photo', label: '📷 Vintage Photo (復古照片)', prompt: 'Vintage photo style, film grain, warm tones, nostalgic atmosphere, retro photography' },
    { id: 'polaroid', label: '📱 Polaroid (拍立得)', prompt: 'Polaroid instant photo style, white border frame, casual snapshot, warm vintage colors' },
    { id: 'magazine-cover', label: '📰 Magazine Cover (雜誌封面)', prompt: 'Professional magazine cover style, fashion photography, studio lighting, glamorous portrait' },
    { id: 'watercolor', label: '🎨 Watercolor (水彩畫)', prompt: 'Soft watercolor painting style, dreamy, artistic, elegant, pastel colors' },
    { id: 'oil-painting', label: '🖼️ Oil Painting (油畫)', prompt: 'Classic oil painting style, rich textures, vibrant colors, masterpiece, fine art' },
    { id: 'illustration', label: '✨ Modern Illustration (現代插畫)', prompt: 'Modern digital illustration, clean lines, vibrant colors, contemporary art style' },
    { id: 'chinese-painting', label: '🖌️ Chinese Ink (國畫水墨)', prompt: 'Traditional Chinese ink painting style, elegant brushstrokes, minimalist, artistic zen' },
    { id: '3d-cartoon', label: '🧸 3D Cartoon (3D卡通)', prompt: 'Pixar style 3D cute cartoon, soft lighting, vibrant colors, 3D rendering' },
    { id: 'ghibli', label: '🍃 Anime Style (宮崎駿風)', prompt: 'Studio Ghibli style, lush background, detailed anime aesthetic, whimsical' },
    { id: 'chibi', label: '🎀 Chibi Style (Q版風格)', prompt: 'Cute chibi style, super deformed characters, big eyes, adorable proportions' },
    { id: 'comic', label: '💥 Comic Book (美式漫畫)', prompt: 'Comic book style, bold outlines, vibrant colors, dynamic composition, pop art' },
    { id: 'paper-cut', label: '✂️ Paper Cutout (剪紙藝術)', prompt: 'Layered paper cut style, intricate details, shadow depth, craft aesthetic' },
    { id: 'collage', label: '🎨 Collage Art (拼貼藝術)', prompt: 'Artistic collage style, mixed media, creative composition, textured layers' },
    { id: 'minimalist', label: '✏️ Minimalist (極簡線條)', prompt: 'Minimalist line art, clean background, modern design, simple and elegant' },
    { id: 'pixel-art', label: '👾 Pixel Art (像素風)', prompt: 'Retro pixel art style, 16-bit, vibrant colors, nostalgic gaming aesthetic' },
    { id: 'fantasy', label: '🌟 Fantasy Art (奇幻藝術)', prompt: 'Fantasy art style, magical atmosphere, dreamy lighting, ethereal and enchanting' },
];

export const FONTS = [
    { id: 'serif', label: '經典襯線 (Serif)', family: 'serif', className: 'font-serif' },
    { id: 'sans', label: '現代無襯線 (Sans)', family: 'sans-serif', className: 'font-sans' },
    { id: 'mono', label: '特務打字機 (Mono)', family: 'monospace', className: 'font-mono' },
    { id: 'cursive', label: '手寫風格 (Cursive)', family: 'cursive', className: 'italic' },
];

export const TEXT_COLORS = [
    { id: '#333333', label: '經典黑', value: '#333333', class: 'bg-zinc-800' },
    { id: '#78350f', label: '古銅金', value: '#78350f', class: 'bg-amber-900' },
    { id: '#1e3a8a', label: '深海藍', value: '#1e3a8a', class: 'bg-blue-900' },
    { id: '#881337', label: '酒紅色', value: '#881337', class: 'bg-rose-900' },
    { id: '#064e3b', label: '森林綠', value: '#064e3b', class: 'bg-emerald-900' },
    { id: '#ffffff', label: '純淨白', value: '#ffffff', class: 'bg-white border border-gray-300' },
];

export const ASPECT_RATIOS = [
    { id: '1:1', label: '1:1 (方形 / IG 貼文)', value: '1:1' },
    { id: '3:4', label: '3:4 (直式賀卡)', value: '3:4' },
    { id: '4:3', label: '4:3 (橫式賀卡)', value: '4:3' },
    { id: '9:16', label: '9:16 (限時動態 / 手機桌布)', value: '9:16' },
    { id: '16:9', label: '16:9 (電腦桌布)', value: '16:9' },
    { id: '2:3', label: '2:3 (直式明信片)', value: '3:4' },
    { id: '3:2', label: '3:2 (橫式明信片)', value: '4:3' },
];

export const CARD_BACKGROUNDS = [
    { id: 'cream', value: '#FDFCF8', label: '奶油白 (預設)', class: 'bg-[#FDFCF8] border border-stone-200' },
    { id: 'white', value: '#FFFFFF', label: '純白', class: 'bg-white border border-gray-200' },
    { id: 'pink', value: '#FDF2F8', label: '櫻花粉', class: 'bg-pink-50 border border-pink-200' },
    { id: 'blue', value: '#EFF6FF', label: '天空藍', class: 'bg-blue-50 border border-blue-200' },
    { id: 'green', value: '#F0FDF4', label: '薄荷綠', class: 'bg-green-50 border border-green-200' },
    { id: 'stone', value: '#1C1917', label: '質感黑', class: 'bg-stone-900 border border-stone-700' },
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

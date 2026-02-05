export enum ComicLayout {
    Single = 'Single Panel Full Page',
    TwoVertical = '2 Panels Vertical Stack',
    ThreeVertical = '3 Panels Vertical Stack',
    ThreeSplit = '3 Panels: 1 Top, 2 Bottom Split',
    FourVertical = '4 Panels Vertical Stack',
    FourGrid = '4 Panels Grid (2x2)',
    FiveMix = '5 Panels Dynamic Layout',
    SixGrid = '6 Panels Grid (2 columns x 3 rows)',
    EightGrid = '8 Panels Grid (2 columns x 4 rows)'
}

export enum ComicStyle {
    Cute = 'Cute Manga/Chibi Style',
    American = 'American Comic Book Style',
    Anime = 'Japanese Anime Style',
    Horror = 'Japanese Horror Manga Style',
    Webtoon = 'Korean Webtoon Style',
    Ink = 'Chinese Ink Wash Painting Style',
    Realistic = 'Realistic Cinematic Lighting Style',
    Cyberpunk = 'Cyberpunk Sci-Fi Style, Neon Lights, High Tech',
    Watercolor = 'Soft Watercolor Painting Style, Dreamy, Shoujo Manga',
    Vintage = '90s Retro Anime Style, Cel Shading, Nostalgic, Grainy',
    Flat = 'Modern Flat Illustration Style, Clean Lines, Minimalist, Vector Art',
    Photorealism = 'Photorealistic Style, Real Life Photography 4k, Ultra Realistic, Live Action Movie'
}

export enum ColorMode {
    Color = 'Vibrant Full Color',
    BlackWhite = 'Black and White, Manga Screen Tones, High Contrast',
    Bit8 = '8-Bit Pixel Art Color Palette, Retro Game Style'
}

export enum Resolution {
    R1K = 'Standard Detail (1K)',
    R2K = 'High Resolution (2K) with detailed textures',
    R4K = 'Ultra High Resolution (4K), incredibly detailed, sharp focus'
}

export interface Character {
    id: string;
    name: string;
    description: string;
    image: File | null;
    previewUrl: string | null;
}

export interface ComicConfig {
    layout: ComicLayout;
    style: ComicStyle;
    colorMode: ColorMode;
    aspectRatio: string;
    theme: string;
    withText: boolean;
    textLanguage: string;
    resolution: Resolution;
    negativePrompt: string;
    characters: Character[];
}

export interface GenerationResult {
    imageUrl: string;
    promptUsed: string;
}

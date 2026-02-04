export enum PhotoSize {
    OneInchStd = '1inch_std',     // 25x35mm
    OneInchTw = '1inch_tw',       // 28x35mm
    TwoInch = '2inch',            // 35x45mm
    USVisa = 'us_visa',           // 51x51mm
    Resume = 'resume',            // 40x50mm (4:5)
    Social = 'social',            // 50x50mm (1:1)
    Cover = 'cover',              // 89x50mm (16:9)
}

export enum PaperSize {
    FourBySix = '4x6',      // 4x6 inch
    FiveBySeven = '5x7',    // 5x7 inch
    EightByTen = '8x10',    // 8x10 inch
    A4 = 'a4',              // 210x297mm
    Letter = 'letter',      // 8.5x11 inch
}

export enum LayoutMode {
    Auto = 'auto',
    Custom = 'custom',
}

export interface Dimensions {
    width: number;
    height: number;
}

export interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface PhotoAsset {
    id: string;
    sourceUrl: string;
    croppedUrl: string;
    quantity: number;
}

export interface AppConfig {
    photoSize: PhotoSize;
    paperSize: PaperSize;
    paperOrientation: 'portrait' | 'landscape';
    marginMm: number;
    gapMm: number;
    layoutMode: LayoutMode;
    customCount: number;
    showCutLines: boolean;
    enableMirror: boolean;
    outputFormat: 'image/png' | 'image/jpeg' | 'application/pdf';
}

export const DEFAULT_CONFIG: AppConfig = {
    photoSize: PhotoSize.TwoInch,
    paperSize: PaperSize.FiveBySeven,
    paperOrientation: 'portrait',
    marginMm: 3,
    gapMm: 2,
    layoutMode: LayoutMode.Auto,
    customCount: 4,
    showCutLines: true,
    enableMirror: false,
    outputFormat: 'image/png',
};

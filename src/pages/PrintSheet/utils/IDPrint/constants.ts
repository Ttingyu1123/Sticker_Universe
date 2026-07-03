import { PhotoSize, PaperSize } from "../../types/idPrint";

export const DPI = 300;
export const MM_PER_INCH = 25.4;

// Helper to convert MM to Pixels at 300 DPI
export const mmToPx = (mm: number) => Math.round((mm / MM_PER_INCH) * DPI);
export const inchToPx = (inch: number) => Math.round(inch * DPI);

interface Spec {
    width: number; // in pixels
    height: number; // in pixels
    label: string;
}

// Paper Size definitions
export const PAPER_DIMENSIONS: Record<PaperSize, Spec> = {
    [PaperSize.FourBySix]: {
        width: inchToPx(4),
        height: inchToPx(6),
        label: '4x6" (10x15cm)'
    },
    [PaperSize.FiveBySeven]: {
        width: inchToPx(5),
        height: inchToPx(7),
        label: '5x7" (13x18cm)'
    },
    [PaperSize.EightByTen]: {
        width: inchToPx(8),
        height: inchToPx(10),
        label: '8x10" (20x25cm)'
    },
    [PaperSize.A4]: {
        width: mmToPx(210),
        height: mmToPx(297),
        label: 'A4 (21.0x29.7cm)'
    },
    [PaperSize.Letter]: {
        width: inchToPx(8.5),
        height: inchToPx(11),
        label: 'Letter (8.5x11")'
    },
};

// ID Photo definitions (in mm)
// We store these as specs to convert to PX later
interface PhotoSpec {
    width: number;
    height: number;
    labelKey: string; // i18n key for display name; render sites append "(WxHmm)" from width/height
}

export const PHOTO_DIMENSIONS_MM: Record<PhotoSize, PhotoSpec> = {
    [PhotoSize.OneInchStd]: { width: 25, height: 35, labelKey: 'printSheet.idPrint.photoSizes.oneInchStd' },
    [PhotoSize.OneInchTw]: { width: 28, height: 35, labelKey: 'printSheet.idPrint.photoSizes.oneInchTw' },
    [PhotoSize.TwoInch]: { width: 35, height: 45, labelKey: 'printSheet.idPrint.photoSizes.twoInch' },
    [PhotoSize.USVisa]: { width: 51, height: 51, labelKey: 'printSheet.idPrint.photoSizes.usVisa' },
    [PhotoSize.Resume]: { width: 40, height: 50, labelKey: 'printSheet.idPrint.photoSizes.resume' },
    [PhotoSize.Social]: { width: 50, height: 50, labelKey: 'printSheet.idPrint.photoSizes.social' },
    [PhotoSize.Cover]: { width: 89, height: 50, labelKey: 'printSheet.idPrint.photoSizes.cover' },
};

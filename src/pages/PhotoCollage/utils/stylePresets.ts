import { CollageSettings, LayoutType } from '../types';

// One-click style bundles: each preset is a settings overlay that turns the
// individual features (layouts, frame styles, tape, blur-fill) into a
// finished look. Applying one always resets backgroundId/customGradient so
// the preset's backgroundColor wins (mirrors Controls handleChange).
export interface StylePreset {
    id: string;
    labelKey: string;
    apply: Partial<CollageSettings>;
}

export const STYLE_PRESETS: StylePreset[] = [
    {
        id: 'scrapbook',
        labelKey: 'collage.presets.scrapbook',
        apply: {
            layout: LayoutType.SCATTER,
            frameStyle: 'torn',
            tapeDecoration: true,
            imageFit: 'cover',
            backgroundColor: '#f2ecdd',
            gap: 24,
            padding: 36,
            cornerRadius: 0,
            shadow: 25,
        },
    },
    {
        id: 'polaroidWall',
        labelKey: 'collage.presets.polaroidWall',
        apply: {
            layout: LayoutType.SCATTER,
            frameStyle: 'polaroid',
            tapeDecoration: true,
            imageFit: 'cover',
            backgroundColor: '#e9e5db',
            gap: 20,
            padding: 30,
            cornerRadius: 0,
            shadow: 45,
        },
    },
    {
        id: 'magazine',
        labelKey: 'collage.presets.magazine',
        apply: {
            layout: LayoutType.BENTO,
            frameStyle: 'normal',
            tapeDecoration: false,
            imageFit: 'cover',
            backgroundColor: '#141414',
            gap: 6,
            padding: 6,
            cornerRadius: 0,
            shadow: 0,
        },
    },
    {
        id: 'cleanGrid',
        labelKey: 'collage.presets.cleanGrid',
        apply: {
            layout: LayoutType.GRID,
            frameStyle: 'normal',
            tapeDecoration: false,
            imageFit: 'cover',
            backgroundColor: '#ffffff',
            gap: 8,
            padding: 16,
            cornerRadius: 12,
            shadow: 0,
        },
    },
];

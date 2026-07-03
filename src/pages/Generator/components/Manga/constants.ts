import { ComicLayout, ComicStyle, ColorMode, Resolution } from './types';

export const LAYOUT_OPTIONS = [
    { id: ComicLayout.Single, labelKey: 'generator.manga.layouts.grid1Full' },
    { id: ComicLayout.TwoVertical, labelKey: 'generator.manga.layouts.grid2Vertical' },
    { id: ComicLayout.ThreeVertical, labelKey: 'generator.manga.layouts.grid3Vertical' },
    { id: ComicLayout.ThreeSplit, labelKey: 'generator.manga.layouts.grid3Split' },
    { id: ComicLayout.FourVertical, labelKey: 'generator.manga.layouts.grid4Vertical' },
    { id: ComicLayout.FourGrid, labelKey: 'generator.manga.layouts.grid4Grid' },
    { id: ComicLayout.FiveMix, labelKey: 'generator.manga.layouts.grid5Mix' },
    { id: ComicLayout.SixGrid, labelKey: 'generator.manga.layouts.grid6Grid' },
    { id: ComicLayout.EightGrid, labelKey: 'generator.manga.layouts.grid8Grid' },
];

export const STYLE_OPTIONS = [
    { id: ComicStyle.Cute, labelKey: 'generator.manga.styles.cute' },
    { id: ComicStyle.American, labelKey: 'generator.manga.styles.american' },
    { id: ComicStyle.Anime, labelKey: 'generator.manga.styles.anime' },
    { id: ComicStyle.Horror, labelKey: 'generator.manga.styles.horror' },
    { id: ComicStyle.Webtoon, labelKey: 'generator.manga.styles.webtoon' },
    { id: ComicStyle.Ink, labelKey: 'generator.manga.styles.ink' },
    { id: ComicStyle.Realistic, labelKey: 'generator.manga.styles.realistic' },
    { id: ComicStyle.Cyberpunk, labelKey: 'generator.manga.styles.cyberpunk' },
    { id: ComicStyle.Watercolor, labelKey: 'generator.manga.styles.watercolor' },
    { id: ComicStyle.Vintage, labelKey: 'generator.manga.styles.vintage' },
    { id: ComicStyle.Flat, labelKey: 'generator.manga.styles.flat' },
    { id: ComicStyle.Photorealism, labelKey: 'generator.manga.styles.photorealism' },
];

export const COLOR_OPTIONS = [
    { id: ColorMode.Color, labelKey: 'generator.manga.colorModes.full' },
    { id: ColorMode.BlackWhite, labelKey: 'generator.manga.colorModes.blackWhite' },
    { id: ColorMode.Bit8, labelKey: 'generator.manga.colorModes.bit8' },
];

export const ASPECT_RATIOS = [
    { id: '1:1', labelKey: 'generator.manga.aspectRatios.square' },
    { id: '3:4', labelKey: 'generator.manga.aspectRatios.comicPage' },
    { id: '4:3', labelKey: 'generator.manga.aspectRatios.banner' },
    { id: '9:16', labelKey: 'generator.manga.aspectRatios.verticalStrip' },
    { id: '16:9', labelKey: 'generator.manga.aspectRatios.cinematic' },
];

export const MAX_CHARACTERS = 3;

// Language options are self-referential (each label names the language itself),
// so they stay as literal display strings rather than going through t().
export const TEXT_LANGUAGES = [
    { id: 'zh-TW', label: '繁體中文' },
    { id: 'en', label: 'English' },
    { id: 'ja', label: '日本語' },
    { id: 'ko', label: '한국어' },
];

export const RESOLUTION_OPTIONS = [
    { id: Resolution.R1K, labelKey: 'generator.manga.resolutions.r1k' },
    { id: Resolution.R2K, labelKey: 'generator.manga.resolutions.r2k' },
    { id: Resolution.R4K, labelKey: 'generator.manga.resolutions.r4k' },
];

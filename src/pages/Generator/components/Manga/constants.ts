import { ComicLayout, ComicStyle, ColorMode, Resolution } from './types';

export const LAYOUT_OPTIONS = [
    { id: ComicLayout.Single, label: '1格:滿版' },
    { id: ComicLayout.TwoVertical, label: '2格:上下' },
    { id: ComicLayout.ThreeVertical, label: '3格:上下' },
    { id: ComicLayout.ThreeSplit, label: '3格:上1下2' },
    { id: ComicLayout.FourVertical, label: '4格:上下' },
    { id: ComicLayout.FourGrid, label: '4格:田字' },
    { id: ComicLayout.FiveMix, label: '5格:任意' },
    { id: ComicLayout.SixGrid, label: '6格:三排' },
    { id: ComicLayout.EightGrid, label: '8格:四排' },
];

export const STYLE_OPTIONS = [
    { id: ComicStyle.Cute, label: '可愛漫畫風格' },
    { id: ComicStyle.American, label: '美式漫畫風格' },
    { id: ComicStyle.Anime, label: '日式動漫風格' },
    { id: ComicStyle.Horror, label: '日式恐怖漫畫風格' },
    { id: ComicStyle.Webtoon, label: '韓式Webtoon風格' },
    { id: ComicStyle.Ink, label: '中式水墨風格' },
    { id: ComicStyle.Realistic, label: '寫實光影風格' },
    { id: ComicStyle.Cyberpunk, label: '賽博龐克風格' },
    { id: ComicStyle.Watercolor, label: '柔美水彩風格' },
    { id: ComicStyle.Vintage, label: '復古90s動畫' },
    { id: ComicStyle.Flat, label: '現代扁平插畫' },
    { id: ComicStyle.Photorealism, label: '真人寫實風格' },
];

export const COLOR_OPTIONS = [
    { id: ColorMode.Color, label: '全彩' },
    { id: ColorMode.BlackWhite, label: '黑白' },
    { id: ColorMode.Bit8, label: '8位元' },
];

export const ASPECT_RATIOS = [
    { id: '1:1', label: '正方形 (1:1)' },
    { id: '3:4', label: '漫畫頁 (3:4)' },
    { id: '4:3', label: '橫幅 (4:3)' },
    { id: '9:16', label: '條漫 (9:16)' },
    { id: '16:9', label: '電影感 (16:9)' },
];

export const MAX_CHARACTERS = 3;

export const TEXT_LANGUAGES = [
    { id: 'zh-TW', label: '繁體中文' },
    { id: 'en', label: 'English' },
    { id: 'ja', label: '日本語' },
    { id: 'ko', label: '한국어' },
];

export const RESOLUTION_OPTIONS = [
    { id: Resolution.R1K, label: '1K 標準畫質' },
    { id: Resolution.R2K, label: '2K 高畫質' },
    { id: Resolution.R4K, label: '4K 超高清' },
];

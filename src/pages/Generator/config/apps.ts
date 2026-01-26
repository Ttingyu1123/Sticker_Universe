/// <reference types="vite/client" />
const isDev = import.meta.env.MODE === 'development';

export const APPS = [
    {
        name: 'Toolbox (Eraser)',
        url: isDev ? 'http://localhost:3000' : 'https://sticker-toolbox-magic-eraser.vercel.app',
        icon: 'Eraser'
    },
    {
        name: 'Sticker Generator',
        url: isDev ? 'http://localhost:3001' : 'https://taiwanese-anime-sticker-maker.vercel.app',
        icon: 'Sparkles'
    },
    {
        name: 'Batch Master',
        url: isDev ? 'http://localhost:3002' : 'https://sticker-master-ai.vercel.app',
        icon: 'Layers'
    },
    {
        name: 'LayerLab (Editor)',
        url: isDev ? 'http://localhost:3003' : 'https://sticker-layer-lab.vercel.app',
        icon: 'Palette'
    }
];

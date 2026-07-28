import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import openAiImageHandler from './api/openai-image'
import openAiTextHandler from './api/openai-text'

// https://vitejs.dev/config/
import { VitePWA } from 'vite-plugin-pwa'

type LocalApiHandler = (req: unknown, res: unknown) => Promise<void>;

interface LocalApiResponse {
    status: (statusCode: number) => LocalApiResponse;
    json: (payload: unknown) => void;
}

const localVercelApiPlugin = (): Plugin => ({
    name: 'local-vercel-api-functions',
    apply: 'serve',
    configureServer(server) {
        const registerHandler = (route: string, handler: LocalApiHandler) => {
            server.middlewares.use(route, async (req, res, next) => {
                const apiResponse: LocalApiResponse = {
                    status(statusCode) {
                        res.statusCode = statusCode;
                        return apiResponse;
                    },
                    json(payload) {
                        if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
                        res.end(JSON.stringify(payload));
                    },
                };

                try {
                    await handler(req, apiResponse);
                } catch (error) {
                    if (!res.writableEnded) next(error);
                }
            });
        };

        registerHandler('/api/openai-image', openAiImageHandler);
        registerHandler('/api/openai-text', openAiTextHandler);
    },
});

export default defineConfig({
    plugins: [
        localVercelApiPlugin(),
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png'],
            workbox: {
                maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                globIgnores: ['**/*.wasm', '**/ort-*.mjs', '**/ort-*.js'],
                navigateFallbackDenylist: [/^\/imgly-data/]
            },
            manifest: {
                name: 'CreativeOS',
                short_name: 'CreativeOS',
                description: 'AI creative suite: sticker generation, photo collage, image editing, drawing, and print layouts',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'icon-maskable-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'icon-maskable-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})

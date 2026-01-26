import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            workbox: {
                maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,json}'],
                navigateFallbackDenylist: [/^\/imgly-data/]
            },
            manifest: {
                name: 'StickerOS',
                short_name: 'StickerOS',
                description: 'The Ultimate AI Sticker Creative Suite',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml',
                        purpose: 'any maskable'
                    }
                ],
                start_url: '/',
                display: 'standalone',
                background_color: '#ffffff'
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})

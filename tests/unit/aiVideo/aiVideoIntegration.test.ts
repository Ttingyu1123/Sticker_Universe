import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => {
    const absolutePath = resolve(process.cwd(), path);
    return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

describe('AI video generation workflow', () => {
    it('exposes a dedicated routed page and sidebar entry', () => {
        expect(source('src/App.tsx')).toContain("path=\"/ai-video\"");
        expect(source('src/layouts/Layout.tsx')).toContain('to="/ai-video"');
        expect(source('src/pages/AiVideo/App.tsx')).toContain('aiVideo.generate');
    });

    it('supports only Gemini and Grok in the first release', () => {
        const page = source('src/pages/AiVideo/App.tsx');
        expect(page).toContain("'gemini'");
        expect(page).toContain("'grok'");
        expect(page).not.toContain("'openai'");
    });

    it('keeps long-running task state and media blobs in IndexedDB', () => {
        const db = source('src/db.ts');
        expect(db).toContain('aiVideoJobs');
        expect(db).toContain('saveAiVideoJob');
        expect(db).toContain('getLatestAiVideoJob');
    });

    it('uses create and status calls instead of holding one long request open', () => {
        const proxy = source('api/ai-video.ts');
        expect(proxy).toContain("action === 'create'");
        expect(proxy).toContain("action === 'status'");
        expect(proxy).toContain('predictLongRunning');
        expect(proxy).toContain('api.x.ai/v1/videos/generations');
        expect(proxy).not.toContain('setInterval');
    });

    it('registers the API proxy in the local Vite server', () => {
        const vite = source('vite.config.ts');
        expect(vite).toContain("import aiVideoHandler from './api/ai-video'");
        expect(vite).toContain("registerHandler('/api/ai-video', aiVideoHandler)");
    });

    it('provides both requested workflow shortcuts', () => {
        const spriteSheet = source('src/features/sprite-sheet-generator/SpriteSheetGeneratorTab.tsx');
        const animatedSticker = source('src/pages/AnimatedSticker/App.tsx');
        expect(spriteSheet).toContain('createAiVideoDraft');
        expect(spriteSheet).toContain("navigate(`/ai-video?job=${job.id}`)");
        expect(animatedSticker).toContain('to="/ai-video"');
        expect(animatedSticker).toContain('videoJob');
    });

    it('builds a motion prompt that protects the 4x2 layout and all eight captions', () => {
        const prompt = source('src/features/ai-video/prompt.ts');
        expect(prompt).toContain('export const buildStickerVideoPrompt');
        expect(prompt).toContain('locked camera');
        expect(prompt).toContain('4x2');
        expect(prompt).toContain('concept.caption');
    });

    it('keeps the new page readable and consistent with the mint and cream UI', () => {
        const page = source('src/pages/AiVideo/App.tsx');
        expect(page).not.toMatch(/text-\[(?:9|10|11)px\]/);
        expect(page).toContain('bg-cream');
        expect(page).toContain('bg-cream-light');
    });
});

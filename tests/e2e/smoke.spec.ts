import { test, expect } from '@playwright/test';

// Core-flow smoke tests: every route must load without crashing.
// No AI calls — these verify the shell, not generation.

test.describe('smoke', () => {
    test('landing renders the tool grid including all categories', async ({ page }) => {
        await page.goto('/');
        // :visible filter — the desktop sidebar duplicates these hrefs but is
        // display:none on the mobile viewport this suite runs in.
        for (const path of ['/generator', '/photo-collage', '/drawing-studio', '/layer-lab']) {
            await expect(page.locator(`a[href*="${path}"]:visible`).first()).toBeVisible({ timeout: 30_000 });
        }
    });

    test('generator loads and gates on the API key dialog', async ({ page }) => {
        await page.goto('/generator');
        // With no stored key, the key modal must appear and be a proper dialog.
        const dialog = page.getByRole('dialog').first();
        await expect(dialog).toBeVisible({ timeout: 15_000 });
        await expect(dialog.locator('input').first()).toBeVisible();
    });

    test('photo collage loads its editor without requiring an API key', async ({ page }) => {
        await page.goto('/photo-collage');
        // Manual collage mode should render an upload input immediately.
        await expect(page.locator('input[type="file"]').first()).toBeAttached({ timeout: 15_000 });
        // No full-screen blocking key dialog on entry.
        await expect(page.getByRole('dialog')).toHaveCount(0);
    });

    test('drawing studio renders a drawable canvas with no horizontal overflow', async ({ page }) => {
        await page.goto('/drawing-studio');
        const canvas = page.locator('canvas').first();
        await expect(canvas).toBeVisible({ timeout: 15_000 });
        const overflow = await page.evaluate(() => ({
            scroll: document.documentElement.scrollWidth,
            inner: window.innerWidth,
        }));
        expect(overflow.scroll).toBeLessThanOrEqual(overflow.inner);
    });

    test('gallery loads its browsing UI', async ({ page }) => {
        await page.goto('/gallery');
        await expect(page.locator('main, [class*="container"]').first()).toBeVisible({ timeout: 15_000 });
    });
});

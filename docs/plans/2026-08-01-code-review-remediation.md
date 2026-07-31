# Code Review Remediation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve the five validated review findings without changing the existing sticker-generation workflow or creating duplicate Gallery records.

**Architecture:** Keep localized copy at the React/i18n boundary, keep sprite-series utilities language-neutral, persist animated results through a small tested Gallery adapter, and move SpriteSheet state/presentation responsibilities into a hook and focused child components. Video extraction remains owned by the existing processing flow, while the preview becomes non-interactive whenever that flow is active.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, i18next, IndexedDB.

---

### Task 1: Localize sprite-series fallback names

**Files:**
- Modify: `src/features/sprite-sheet-generator/planPersistence.ts`
- Modify: `src/features/sprite-sheet-generator/series.ts`
- Modify: `src/pages/Generator/components/SpriteSheetGeneratorTab.tsx`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh-TW.ts`
- Test: `tests/unit/spriteSheetGenerator/planPersistence.test.ts`
- Test: `tests/unit/spriteSheetGenerator/series.test.ts`

**Step 1: Write the failing tests**

Add English-fallback tests proving that plan restoration and blank archive names use caller-provided localized labels instead of Chinese utility constants.

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/spriteSheetGenerator/planPersistence.test.ts tests/unit/spriteSheetGenerator/series.test.ts`

Expected: FAIL because the utilities do not yet accept localized fallback names.

**Step 3: Write the minimal implementation**

Remove both hardcoded Chinese fallbacks, require the caller to supply the fallback label, add English and Traditional Chinese translation keys, and pass translated values from `SpriteSheetGeneratorTab`.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/spriteSheetGenerator/planPersistence.test.ts tests/unit/spriteSheetGenerator/series.test.ts tests/unit/i18nParity.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit message: `fix(sprite-sheet): localize series fallbacks`

### Task 2: Lock video playback controls during frame extraction

**Files:**
- Modify: `src/pages/AnimatedSticker/components/VideoBoardPreview.tsx`
- Test: `tests/unit/animatedSticker/uiStyle.test.ts`

**Step 1: Write the failing test**

Assert that the preview hides native controls, removes pointer interaction, and leaves the video out of the tab order while `disabled` is true.

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/animatedSticker/uiStyle.test.ts`

Expected: FAIL because `<video controls>` is always interactive.

**Step 3: Write the minimal implementation**

Bind `controls`, `tabIndex`, `aria-busy`, and pointer-event styling to the existing `disabled` prop. Keep the existing explicit `video.pause()` at processing start.

**Step 4: Run the test to verify it passes**

Run: `npm test -- tests/unit/animatedSticker/uiStyle.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit message: `fix(animated-sticker): lock video during extraction`

### Task 3: Persist animated stickers in Gallery

**Files:**
- Create: `src/pages/AnimatedSticker/gallery.ts`
- Modify: `src/pages/AnimatedSticker/App.tsx`
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/zh-TW.ts`
- Create: `tests/unit/animatedSticker/gallery.test.ts`

**Step 1: Write the failing tests**

Test Blob-to-data-URL conversion and deterministic Gallery item mapping. Verify stable IDs can be reused so compressed results overwrite the original eight records rather than adding duplicates.

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/animatedSticker/gallery.test.ts`

Expected: FAIL because the Gallery adapter does not exist.

**Step 3: Write the minimal implementation**

Add a small adapter that converts result Blobs to durable data URLs and calls `saveStickerToDB`. Generate one batch ID per extraction run, save all successful results immediately, and reuse that batch ID after compression. Add localized Gallery labels and a non-destructive warning when persistence fails.

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/animatedSticker/gallery.test.ts tests/unit/animatedSticker/uiStyle.test.ts tests/unit/i18nParity.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit message: `fix(animated-sticker): persist generated results`

### Task 4: Split SpriteSheetGeneratorTab into focused units

**Files:**
- Create: `src/features/sprite-sheet-generator/useStickerSeriesControls.ts`
- Create: `src/pages/Generator/components/sprite-sheet/SeriesControlsPanel.tsx`
- Create: `src/pages/Generator/components/sprite-sheet/SeriesProgressPanel.tsx`
- Create: `src/pages/Generator/components/sprite-sheet/ConceptPlannerGrid.tsx`
- Create: `src/pages/Generator/components/sprite-sheet/GeneratedCollectionPanel.tsx`
- Modify: `src/pages/Generator/components/SpriteSheetGeneratorTab.tsx`
- Modify: `tests/unit/spriteSheetGenerator/uiStyle.test.ts`

**Step 1: Write the failing structural test**

Assert that `SpriteSheetGeneratorTab.tsx` stays at or below 500 lines and imports the extracted hook and presentation components.

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/spriteSheetGenerator/uiStyle.test.ts`

Expected: FAIL because the component is currently about 806 lines.

**Step 3: Extract without behavior changes**

Move localStorage/archive preference orchestration into the hook. Move the series controls, progress/history, concept planning, and generated collection JSX into typed child components. Keep generation/network orchestration in the page component.

**Step 4: Run targeted verification**

Run: `npm test -- tests/unit/spriteSheetGenerator`

Run: `npx tsc --noEmit`

Expected: PASS, and the main component is no more than 500 lines.

**Step 5: Commit**

Commit message: `refactor(sprite-sheet): split generator tab`

### Task 5: Full regression verification

**Step 1: Run all tests**

Run: `npm test`

Expected: all tests pass.

**Step 2: Run static verification**

Run: `npm run lint`

Run: `npx tsc --noEmit`

Expected: both pass.

**Step 3: Run production build**

Run: `npm run build`

Expected: Vite production build passes.

**Step 4: Review the diff and worktree status**

Confirm only the planned source, test, locale, and plan files changed; ensure no generated dependency metadata or unrelated user files are included.

**Step 5: Commit any verification-only adjustments**

Use a narrow conventional commit only if verification requires source changes.

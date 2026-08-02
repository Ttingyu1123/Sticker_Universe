# Sticker Series Portable Backup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add downloadable, versioned lightweight sticker-series ZIP backups that preserve reference data, settings, concepts, and exact batch generation prompts, with import modes for continuing a series or avoiding duplicates.

**Architecture:** Extend completed batch records with optional generation metadata for backward compatibility. A pure backup module owns versioned manifest validation and JSZip serialization, while the sprite-sheet controller coordinates download/import state and the workspace renders explicit controls plus a focused import dialog.

**Tech Stack:** React 18, TypeScript, Vitest, JSZip, file-saver, i18next, browser File APIs and localStorage.

---

### Task 1: Preserve exact generation metadata per batch

**Files:**
- Modify: `src/features/sprite-sheet-generator/series.ts`
- Modify: `src/features/sprite-sheet-generator/useSpriteSheetGeneratorController.ts`
- Modify: `tests/unit/spriteSheetGenerator/series.test.ts`

**Step 1: Write failing tests**

Add tests showing that `appendStickerBatch` and `replaceStickerBatch` accept optional generation metadata with the exact `prompt`, `provider`, and `model`, while existing batches without metadata remain valid.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/spriteSheetGenerator/series.test.ts`

Expected: FAIL because batch helpers do not accept or retain generation metadata.

**Step 3: Implement the minimal data-model change**

Add an optional `generation` object to `StickerSeriesBatch`. Update batch append/replace helpers and controller generation calls so new Gemini/OpenAI batches record the exact prompt and model used. Keep old local-storage parsing compatible with batches lacking `generation`.

**Step 4: Verify GREEN**

Run: `npm test -- tests/unit/spriteSheetGenerator/series.test.ts tests/unit/spriteSheetGenerator/prompt.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit: `feat(sprite-sheet): retain batch generation prompts`

### Task 2: Build and validate the portable ZIP format

**Files:**
- Create: `src/features/sprite-sheet-generator/seriesBackup.ts`
- Create: `tests/unit/spriteSheetGenerator/seriesBackup.test.ts`

**Step 1: Write failing round-trip tests**

Cover a v1 ZIP round trip with reference image, character/settings data, required captions, draft concepts, completed batches, and generation metadata. Assert that generated images and API keys are absent, filenames are sanitized, legacy prompt-less batches work, and invalid marker/version/missing image/malformed concepts are rejected.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/spriteSheetGenerator/seriesBackup.test.ts`

Expected: FAIL because the module does not exist.

**Step 3: Implement minimal serializer/parser**

Define `STICKER_SERIES_BACKUP_FORMAT`, version `1`, size limits, manifest/project interfaces, and normalized validation. Use JSZip to write `manifest.json` plus one reference image and to parse them back into a project with a data URL. Export a safe backup filename helper.

**Step 4: Verify GREEN**

Run: `npm test -- tests/unit/spriteSheetGenerator/seriesBackup.test.ts tests/unit/spriteSheetGenerator/series.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit: `feat(sprite-sheet): add portable series backup format`

### Task 3: Wire download and both import modes into the controller

**Files:**
- Modify: `src/features/sprite-sheet-generator/useSpriteSheetGeneratorController.ts`
- Modify: `tests/unit/spriteSheetGenerator/uiStyle.test.ts`

**Step 1: Write failing controller wiring assertions**

Assert that the controller creates and downloads a backup, parses an uploaded backup, restores all relevant active-series state for continue mode, persists restored batches, and uses `appendStickerSeriesArchive` plus the imported ID for duplicate-only mode.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/spriteSheetGenerator/uiStyle.test.ts`

Expected: FAIL because backup controller handlers do not exist.

**Step 3: Implement controller integration**

Add backup input ref and pending-import state. Build exports from current state, derive a stable series ID/created time from the first batch, call `saveAs`, and show localized errors. Continue mode restores reference/settings/batches/draft concepts without retaining Blob URLs. Duplicate-only mode updates the capped local archive and selects it for exclusion without changing the active series.

**Step 4: Verify GREEN**

Run: `npm test -- tests/unit/spriteSheetGenerator/uiStyle.test.ts tests/unit/spriteSheetGenerator/seriesBackup.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit: `feat(sprite-sheet): wire series backup import and export`

### Task 4: Add import/export UI and localized guidance

**Files:**
- Create: `src/features/sprite-sheet-generator/components/SeriesBackupImportDialog.tsx`
- Modify: `src/features/sprite-sheet-generator/components/SpriteSheetWorkspace.tsx`
- Modify: `src/locales/en.json`
- Modify: `src/locales/zh-TW.json`
- Modify: `tests/unit/spriteSheetGenerator/uiStyle.test.ts`

**Step 1: Write failing UI and locale assertions**

Assert that the workspace exposes download/import buttons and a hidden ZIP input, the dialog uses `useModalA11y`, displays prompt completeness and series details, and offers continue, duplicate-only, and cancel actions. Parse both locale files and require every new key.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/spriteSheetGenerator/uiStyle.test.ts`

Expected: FAIL because the UI and labels do not exist.

**Step 3: Implement focused UI**

Render backup actions beside the series controls, disable export without completed batches, reset the file input after selection, and show the import dialog only for a validated pending backup. Use the shared modal focus trap and localized toasts/labels. Do not add Gallery entries.

**Step 4: Verify GREEN**

Run: `npm test -- tests/unit/spriteSheetGenerator`

Run: `npm run typecheck`

Expected: PASS.

**Step 5: Commit**

Commit: `feat(sprite-sheet): add series backup controls`

### Task 5: Full verification

**Step 1:** Run `npm test` and expect all tests to pass.

**Step 2:** Run `npm run typecheck` and expect no errors.

**Step 3:** Run `npm run build` and expect a successful Vite production build.

**Step 4:** Run `git diff --check` and inspect `git status --short` for only intended files.

**Step 5:** Review the commit list and use `superpowers:finishing-a-development-branch` to present integration options.

# APNG Frame Trimmer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-sticker leading/trailing frame trimming for the current AnimatedSticker generation session while preserving LINE-compliant duration and Gallery identity.

**Architecture:** A pure frame-trimming utility validates ranges, re-encodes APNG data, and returns updated result metadata. A focused dialog owns range selection and frame previews, while `App.tsx` replaces one result, revokes the superseded Blob URL, and persists the edited sticker with the existing batch ID.

**Tech Stack:** React 18, TypeScript, Vitest, UPNG.js, IndexedDB, i18next.

---

### Task 1: Frame-trimming domain utility

**Files:**
- Create: `src/pages/AnimatedSticker/utils/frameTrimming.ts`
- Create: `tests/unit/animatedSticker/frameTrimming.test.ts`

**Step 1: Write failing tests**

Cover slicing leading/trailing frames, preserving total duration, updating frame count/blob metadata, rejecting fewer than 5 retained frames, and rejecting invalid ranges.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/animatedSticker/frameTrimming.test.ts`

Expected: FAIL because `trimAnimatedStickerFrames` does not exist.

**Step 3: Implement the minimal utility**

Use `encodeAnimatedPng`, retain `result.durationMs`, recompute `loopCount`, `hasMotion`, `hasTransparency`, Blob URL, size, and `sourceFrames`.

**Step 4: Verify GREEN**

Run: `npm test -- tests/unit/animatedSticker/frameTrimming.test.ts tests/unit/animatedSticker/lineCompliance.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit: `feat(animated-sticker): add frame trimming utility`

### Task 2: Keep compressed source frames accurate

**Files:**
- Modify: `src/pages/AnimatedSticker/utils/compression.ts`
- Modify: `tests/unit/animatedSticker/compression.test.ts`

**Step 1: Write a failing regression test**

Assert that a compressed result stores the exact evenly selected frames in `sourceFrames` and that `frameCount` matches them.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/animatedSticker/compression.test.ts`

Expected: FAIL because compression currently leaves the original source frame array attached.

**Step 3: Implement the minimal fix**

Assign `sourceFrames: selectedFrames` to each compression candidate.

**Step 4: Verify GREEN**

Run: `npm test -- tests/unit/animatedSticker/compression.test.ts tests/unit/animatedSticker/frameTrimming.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit: `fix(animated-sticker): retain compressed frame set`

### Task 3: Frame trim dialog and result-card entry point

**Files:**
- Create: `src/pages/AnimatedSticker/components/FrameTrimDialog.tsx`
- Modify: `src/pages/AnimatedSticker/components/StickerResultCard.tsx`
- Modify: `tests/unit/animatedSticker/uiStyle.test.ts`

**Step 1: Write failing source integration assertions**

Assert that the result card exposes a localized edit action and the dialog contains start/end controls, first/last-frame actions, reset/apply actions, a 5-frame guard, and canvas thumbnails.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/animatedSticker/uiStyle.test.ts`

Expected: FAIL because the dialog and edit action do not exist.

**Step 3: Implement the focused UI**

Keep range state inside the dialog, draw each RGBA frame to a Canvas, enforce the minimum retained frame count, and return only the selected start/end indices on apply.

**Step 4: Verify GREEN**

Run: `npm test -- tests/unit/animatedSticker/uiStyle.test.ts`

Expected: PASS.

**Step 5: Commit**

Commit: `feat(animated-sticker): add frame trim dialog`

### Task 4: Apply edits and update Gallery

**Files:**
- Modify: `src/pages/AnimatedSticker/App.tsx`
- Modify: `src/locales/en.json`
- Modify: `src/locales/zh-TW.json`
- Modify: `tests/unit/animatedSticker/uiStyle.test.ts`

**Step 1: Write failing wiring assertions**

Assert that App opens the dialog for one result, calls `trimAnimatedStickerFrames`, replaces only that result, revokes the old URL, and persists `[trimmedResult]` with `galleryBatchIdRef.current`.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/animatedSticker/uiStyle.test.ts`

Expected: FAIL because App does not wire trimming yet.

**Step 3: Implement App integration and translations**

Add selected-result state, apply/error handlers, localized labels and toasts, and reuse `persistResultsInGallery` so the edited APNG overwrites its stable Gallery record.

**Step 4: Verify GREEN**

Run: `npm test -- tests/unit/animatedSticker`

Run: `npx tsc --noEmit`

Expected: PASS.

**Step 5: Commit**

Commit: `feat(animated-sticker): wire per-sticker frame editing`

### Task 5: Full verification

**Step 1:** Run `npm test` and expect all tests to pass.

**Step 2:** Run `npx tsc --noEmit` and expect no errors.

**Step 3:** Run `npm run build` and expect a successful Vite production build.

**Step 4:** Run `git diff --check` and inspect `git status --short` for only intended files.

# Sticker Series Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add required sticker captions and selectable prior-series exclusions to the existing three-batch, 24-sticker workflow.

**Architecture:** Keep deterministic caption parsing, batch allocation, archive persistence, and conflict checks in pure feature utilities. Pass required captions and combined current/archive exclusions into the existing AI planner, then validate the returned plan and the final generation locally. Store lightweight archives in versioned localStorage and extend gallery drafts with backward-compatible optional fields.

**Tech Stack:** React 19, TypeScript, Vitest, i18next, localStorage, existing Gemini/OpenAI structured planning.

---

### Task 1: Required-caption domain rules

**Files:**
- Create: `src/features/sprite-sheet-generator/seriesControls.ts`
- Modify: `tests/unit/spriteSheetGenerator/series.test.ts`

**Step 1: Write failing tests**

- Parse newline/comma/頓號 input, trim values, remove normalized duplicates, and cap at 24.
- Allocate only captions not already used outside the active batch.
- Report required captions that conflict with selected archived concepts.

**Step 2: Verify RED**

Run: `npm test -- tests/unit/spriteSheetGenerator/series.test.ts`

Expected: FAIL because the new functions are absent.

**Step 3: Implement minimal pure helpers**

Add:

```ts
parseRequiredCaptions(input: string): string[]
getRequiredCaptionsForBatch(required, batches, editingBatchIndex): string[]
findRequiredCaptionConflicts(required, excludedConcepts): string[]
```

**Step 4: Verify GREEN**

Run the targeted test and expect all cases to pass.

### Task 2: Historical series archives

**Files:**
- Modify: `src/features/sprite-sheet-generator/seriesControls.ts`
- Modify: `tests/unit/spriteSheetGenerator/series.test.ts`

**Step 1: Write failing tests**

- Archive completed batches under a stable id and user-visible name.
- Load only valid archives.
- Resolve concepts from selected archive ids.

**Step 2: Verify RED**

Run the series test and confirm the missing archive behavior fails.

**Step 3: Implement persistence-safe helpers**

Add `StickerSeriesArchive`, validation, archive creation, and selected-concept flattening. Keep localStorage access in the component; helpers operate on unknown data and plain arrays.

**Step 4: Verify GREEN**

Run the series test and expect PASS.

### Task 3: AI planning constraints

**Files:**
- Modify: `src/features/sprite-sheet-generator/concepts.ts`
- Modify: `tests/unit/spriteSheetGenerator/prompt.test.ts`
- Modify: `tests/unit/spriteSheetGenerator/concepts.test.ts`

**Step 1: Write failing tests**

- Prompt lists exact required captions.
- AI response missing a required caption is rejected.
- Required captions and earlier-series exclusions work together.

**Step 2: Verify RED**

Run:

`npm test -- tests/unit/spriteSheetGenerator/prompt.test.ts tests/unit/spriteSheetGenerator/concepts.test.ts`

**Step 3: Implement**

Extend planner options and prompt arguments with `requiredCaptions`. Validate exact normalized inclusion after response normalization.

**Step 4: Verify GREEN**

Re-run both test files.

### Task 4: Draft compatibility and UI state

**Files:**
- Modify: `src/features/sprite-sheet-generator/planPersistence.ts`
- Modify: `src/features/sprite-sheet-generator/SpriteSheetGeneratorTab.tsx`
- Modify: `tests/unit/spriteSheetGenerator/planPersistence.test.ts`
- Modify: `tests/unit/spriteSheetGenerator/uiStyle.test.ts`

**Step 1: Write failing tests**

- New fields round-trip through gallery drafts.
- Old version-1 drafts restore with defaults.
- UI exposes series name, required-caption input, and archive checkboxes.
- Planning passes required captions and selected archive concepts.

**Step 2: Verify RED**

Run the two targeted test files.

**Step 3: Implement state and controls**

Add current series preferences, archive localStorage state, selected archive ids, required-caption textarea, counts/chips, and archive selection UI. On “start new series,” archive completed concepts before clearing the current three batches.

**Step 4: Verify GREEN**

Run targeted tests.

### Task 5: Generation guardrails and translations

**Files:**
- Modify: `src/features/sprite-sheet-generator/SpriteSheetGeneratorTab.tsx`
- Modify: `src/locales/en.json`
- Modify: `src/locales/zh-TW.json`

**Step 1: Add failing source/behavior assertions**

Assert that planning and generation both block missing required captions or cross-series conflicts.

**Step 2: Implement guardrails and translated copy**

Add clear error messages for missing required captions, conflicts, archive creation, and the 24-word limit.

**Step 3: Verify**

Run:

```bash
npm test -- tests/unit/spriteSheetGenerator
npm run validate:i18n
npm run typecheck
npm run build
```

Expected: all commands exit 0.

### Task 6: Final review

**Files:** all modified files

**Step 1:** Run `git diff --check` and review `git diff`.

**Step 2:** Run the complete `npm test`.

**Step 3:** Use `superpowers:verification-before-completion` before reporting completion.

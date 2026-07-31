# Chroma-Friendly Sticker Styles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the sprite-sheet generator from five to nine visual styles by adding flat vector, bold cartoon, retro comic, and pixel art with chroma-key-safe prompt constraints.

**Architecture:** Extend the shared `SpriteSheetStyle` union so the UI, prompt builder, and persisted drafts use one set of stable identifiers. Keep the existing global background rules, while each new `STYLE_PROMPTS` entry handles style-specific edge risks. Preserve backward compatibility by extending, not replacing, the draft parser whitelist.

**Tech Stack:** React 19, TypeScript, i18next, Vitest, Vite

---

### Task 1: Define New Style Prompt Behavior

**Files:**
- Modify: `tests/unit/spriteSheetGenerator/prompt.test.ts`
- Modify: `src/features/sprite-sheet-generator/types.ts`
- Modify: `src/features/sprite-sheet-generator/prompt.ts`

**Step 1: Write the failing tests**

Add assertions that `STYLE_PROMPTS` contains the four stable identifiers and their chroma-safe constraints:

```ts
expect(STYLE_PROMPTS['flat-vector']).toContain('flat opaque color fills');
expect(STYLE_PROMPTS['bold-cartoon']).toContain('thick uniform');
expect(STYLE_PROMPTS['retro-comic']).toContain('halftone');
expect(STYLE_PROMPTS['pixel-art']).toContain('no anti-aliasing');
```

Add one generated-prompt assertion proving the selected new style text reaches `buildSpriteSheetPrompt`.

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/spriteSheetGenerator/prompt.test.ts`

Expected: FAIL because the four style keys do not exist.

**Step 3: Implement the minimal production code**

Extend `SpriteSheetStyle`:

```ts
export type SpriteSheetStyle =
    | 'reference'
    | 'chibi'
    | 'cel'
    | 'clay'
    | 'sketch'
    | 'flat-vector'
    | 'bold-cartoon'
    | 'retro-comic'
    | 'pixel-art';
```

Add four `STYLE_PROMPTS` entries with the approved edge, fill, texture, and anti-aliasing constraints.

**Step 4: Run tests and typecheck**

Run: `npm test -- tests/unit/spriteSheetGenerator/prompt.test.ts`

Run: `npm run typecheck`

Expected: prompt tests and typecheck PASS.

**Step 5: Commit**

```bash
git add -- tests/unit/spriteSheetGenerator/prompt.test.ts src/features/sprite-sheet-generator/types.ts src/features/sprite-sheet-generator/prompt.ts
git commit -m "feat(sprite-sheet): add chroma-friendly style prompts"
```

### Task 2: Preserve New Styles in Saved Drafts

**Files:**
- Modify: `tests/unit/spriteSheetGenerator/planPersistence.test.ts`
- Modify: `src/features/sprite-sheet-generator/planPersistence.ts`

**Step 1: Write the failing test**

Create or clone a draft with `style: 'pixel-art'`, save it through `createSpriteSheetPlanGalleryItem`, parse it, and assert the style remains `pixel-art`.

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/spriteSheetGenerator/planPersistence.test.ts`

Expected: FAIL because the parser whitelist rejects the new style.

**Step 3: Implement the minimal parser change**

Export one `SPRITE_SHEET_STYLES` constant from `types.ts`, derive `SpriteSheetStyle` from it, and use `SPRITE_SHEET_STYLES.includes(...)` in the parser so type and runtime validation cannot drift.

**Step 4: Run tests and typecheck**

Run: `npm test -- tests/unit/spriteSheetGenerator/planPersistence.test.ts tests/unit/spriteSheetGenerator/prompt.test.ts`

Run: `npm run typecheck`

Expected: both test files and typecheck PASS.

**Step 5: Commit**

```bash
git add -- src/features/sprite-sheet-generator/types.ts src/features/sprite-sheet-generator/planPersistence.ts tests/unit/spriteSheetGenerator/planPersistence.test.ts
git commit -m "refactor(sprite-sheet): share supported style values"
```

### Task 3: Expose All Nine Styles in the UI

**Files:**
- Modify: `tests/unit/spriteSheetGenerator/uiStyle.test.ts`
- Modify: `src/features/sprite-sheet-generator/SpriteSheetGeneratorTab.tsx`
- Modify: `src/locales/en.json`
- Modify: `src/locales/zh-TW.json`

**Step 1: Write the failing UI test**

Assert that the component uses the shared style list and a responsive three-column layout:

```ts
expect(source).toContain('SPRITE_SHEET_STYLES');
expect(source).toContain('sm:grid-cols-3');
expect(source).toContain("t(`spriteSheet.styles.${option}`)");
```

Also load both locale JSON files and assert names exist for `flat-vector`, `bold-cartoon`, `retro-comic`, and `pixel-art`.

**Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/spriteSheetGenerator/uiStyle.test.ts`

Expected: FAIL because the component still has a local five-style list and the locale keys are missing.

**Step 3: Implement the UI and translations**

Import `SPRITE_SHEET_STYLES`, remove the local `STYLE_OPTIONS`, map the shared list, and change the button container to `grid-cols-2 sm:grid-cols-3`.

Add Traditional Chinese and English labels for the four new identifiers.

**Step 4: Run focused verification**

Run: `npm test -- tests/unit/spriteSheetGenerator/uiStyle.test.ts tests/unit/spriteSheetGenerator/planPersistence.test.ts tests/unit/spriteSheetGenerator/prompt.test.ts`

Run: `npm run validate:i18n`

Expected: focused tests and i18n validation PASS.

**Step 5: Commit**

```bash
git add -- src/features/sprite-sheet-generator/SpriteSheetGeneratorTab.tsx src/locales/en.json src/locales/zh-TW.json tests/unit/spriteSheetGenerator/uiStyle.test.ts
git commit -m "feat(sprite-sheet): expose nine visual styles"
```

### Task 4: Full Verification

**Files:**
- Verify only; no expected production changes.

**Step 1: Run static checks**

Run: `npm run typecheck`

Run: `npm run validate:i18n`

Run: `npm run check:boundaries`

Expected: all PASS.

**Step 2: Run the full test suite**

Run: `npm test`

Expected: all tests PASS.

**Step 3: Run the production build**

Run: `npm run build`

Expected: Vite build PASS; existing bundle-size and dependency warnings are acceptable.

**Step 4: Review the branch**

Run: `git status --short --branch`

Run: `git diff main...HEAD --check`

Run: `git log --oneline main..HEAD`

Expected: clean feature worktree with only the planned commits.

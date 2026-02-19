# CreativeOS App Guide

## Purpose
- Single source of truth for app-level tab inventory and user entry points.

## Generator Tabs (AI Studio)
- `sticker` - Style Sticker
- `holiday` - Holiday Sticker
- `greeting` - Greeting Card
- `manga` - Manga Master
- `character-create` - Character Create
- `cinematic` - Cinematic Poster
- `image-gen` - AI Image Gen
- `headshot` - Headshot Pro
- `portrait` - Portrait Master

## Other Core Areas
- `image-editor` - Batch Crop / Smart Remove / Animator / Editor / Resizer / Outpaint / SVG Converter
- `layer-lab` - Layer composition workspace
- `photo-collage` - Photo collage creation
- `print-sheet` - Sticker print + ID print
- `gallery` - Unified generated/processed outputs

## Landing Summary (from `src/config/landingTabs.ts`)
- Total categories: `5`
- Total tools: `20`

## Maintenance Rules
- When adding/removing a user-facing tab:
1. Update `src/config/landingTabs.ts`.
2. Update both locales: `src/locales/en.json` and `src/locales/zh-TW.json`.
3. Ensure landing counts are correct (tools/categories).
4. Verify nav/tab labels in desktop and mobile.

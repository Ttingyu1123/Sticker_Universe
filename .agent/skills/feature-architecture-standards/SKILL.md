---
name: Feature Architecture & Design Standards
description: Guidelines for adding new features (Apps), ensuring consistent UI architecture (Header/Layout), terminology, and internationalization.
---

# Feature Architecture & Design Standards

This skill defines the mandatory standards for developing new features, "Apps", or modules within the Sticker Universe project. Follow these rules to ensure consistency and avoid "re-fixing" UI issues.

## 1. Unified Architecture (The Golden Rules)

### Global Header Strategy

* **NEVER create a local `<header>` component** inside a page file (e.g., `Demo/App.tsx`).
* **ALWAYS use the Global Header** provided by `src/layouts/Layout.tsx`.
* The Global Header handles the "Back Home" arrow and the current page title automatically.

### Registering a New App

When adding a new feature route (e.g., `/new-feature`):

1. **Update `Layout.tsx`**: Modify the `getPageTitle()` function to return the correct title for your new route.

    ```typescript
    // src/layouts/Layout.tsx
    const getPageTitle = () => {
        // ...
        if (path.startsWith('/new-feature')) return t('newFeature.title'); // Add this!
        // ...
    };
    ```

2. **Update Sidebar**: Add a `<NavItem>` in the `<nav>` section of `Layout.tsx` to link to your new App.

### Layout Container

* Do not set `max-w-screen` arbitrarily.
* **Standard Container**: Use `container mx-auto px-4 max-w-[1920px]` for the main content wrapper to match other apps.
* **Top Spacing**: Since the Global Header is fixed, usually `pt-24` (padding-top) or similar is handled by the main layout structure, but check if content is hidden behind the header. *Correction*: The current `Layout.tsx` structure might handle spacing, or specific pages might need adjustment. Check `Layout.tsx` implementation.

## 2. Standard Terminology (Naming Conventions)

Use these terms in conversation and code comments to maintain clarity:

| Interface Location | Terminology | Description |
| :--- | :--- | :--- |
| **Leftmost Column** | **Sidebar / Main Menu** | The fixed navigation bar containing links to all Apps. |
| **Sidebar Items** | **App / Module** | Distinct functional areas like "Sticker Generator", "Image Editor". |
| **Top Buttons (inside App)** | **Tabs / Sub-features** | Buttons to switch modes within an App (e.g., "Text to Sticker", "Style Tab"). |
| **Center Area** | **Workspace / Canvas** | The main interactive area where editing or generation happens. |
| **Right Side** | **Control Panel / Toolbar** | Area for adjusting parameters, layers, or settings. |

## 3. Internationalization (i18n) Standards

All user-facing text **MUST** be internationalized.

### Rules

1. **No Hardcoded Strings**: Never write English or Chinese text directly in JSX/TSX components (e.g., `<div>Settings</div>` is forbidden).
2. **Dual Language Support**: Every new text key must be added to **BOTH**:
    * `src/locales/zh-TW.json` (Traditional Chinese)
    * `src/locales/en.json` (English)
3. **Key Structure**: Nest keys logically by feature.
    * *Bad*: `title_collage`, `grid_layout`
    * *Good*:

        ```json
        "collage": {
            "title": "...",
            "layout": {
                "grid": "..."
            }
        }
        ```

4. **Usage**:
    * Import hook: `import { useTranslation } from 'react-i18next';`
    * Use hook: `const { t } = useTranslation();`
    * Render: `{t('collage.layout.grid')}`

## 4. Design System (Mint/Cream Theme)

The application uses a specific "Taiwanese Anime" inspired palette characterized by soft creams, mints, and desaturated purples.

### Core Palette

| Role | Color Name | Hex | Tailwind Utility | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **App Background** | **Mint Ice** | `#E3F3F1` | `bg-cream-light` | Main background for the entire application window. |
| **Surface / Card** | **Faint Cream** | `#F8F7EE` | `bg-cream` | Background for Sidebars, Toolbars, and Cards. |
| **Primary Accent** | **Lavender** | `#A186B4` | `text-primary`, `bg-primary` | Key actions, active states, icons. |
| **Text (Body)** | **Deep Bronze** | `#4A4055` | `text-bronze-text` | Main content text. |
| **Text (Heading)** | **Bronze** | `#4A4055` | `text-bronze` | Headings (often bold/black). |
| **Borders** | **Cream Dark** | `#D8D7CE` | `border-cream-dark` | Dividers and container borders. |

### UI Implementation Rules

1. **Layout Structure**:
    * **Root Container**: `min-h-screen bg-cream-light text-bronze-text`
    * **Sidebar / Panels**: `bg-cream/90 backdrop-blur-md border-r border-cream-dark`
    * **Workspace / Canvas Layout**:
        * Wrapper: `bg-cream-light` (matches app background for seamless feel)
        * Actual Canvas/Paper: `bg-white` (representing physical paper/sticker)

2. **Typography**:
    * Headings: `font-black text-bronze`
    * Body: `font-sans text-bronze-text`
    * Muted text: `text-bronze-text/60` (Do not use `text-gray-500`)

3. **Interactive Elements**:
    * **Primary Button**: `bg-primary text-white hover:bg-primary-hover`
    * **Secondary/Ghost Button**: `text-bronze-light hover:text-primary hover:bg-white/60`
    * **Tabs**:
        * Selected: `bg-white text-primary shadow-sm ring-1 ring-primary/20`
        * Unselected: `text-bronze-light hover:text-primary`

4. **Shadows & Effects**:
    * Use soft colored shadows: `shadow-xl shadow-bronze/5` or `shadow-primary/5`
    * Glassmorphism: `backdrop-blur-md` on sidebars/floating toolbars.

## 5. Mobile-Friendly Image Sharing (Web Share API)

All features that generate or export images **MUST** implement mobile-friendly sharing using the standardized approach.

### Required Implementation

1. **Use the Shared Hook**: Import and use `useImageShare` from `src/hooks/useImageShare.ts`

   ```typescript
   import { useImageShare } from '../../../hooks/useImageShare';
   const { shareImage, isSharing } = useImageShare();
   ```

2. **Call with Metadata**: Always provide descriptive metadata for intelligent filename generation

   ```typescript
   await shareImage(imageSrc, {
       filename: 'base-name',
       metadata: {
           type: 'sticker' | 'headshot' | 'poster' | 'image',
           style: styleValue,
           size: sizeValue,
           phrase: userPhrase
       },
       title: '分享標題',
       text: '分享描述'
   });
   ```

### Filename Standards

Generated filenames follow: `[type]_[metadata]_[date]_[time].png`

**Examples**:

* `sticker_cute_哈囉_2026-02-04_18-30-15.png`
* `headshot_photo_1inch_28x35mm_Professional_2026-02-04_18-30-35.png`

### UI/UX Standards

1. **Button Design**:
   * Icon: `<Download size={18} strokeWidth={2.5} />`
   * Styling: `p-2.5 bg-primary/20 rounded-full hover:bg-primary/30 active:scale-95`

2. **Button Placement**:
   * Always visible (not in hover-only overlays)
   * Place below images or in persistent action bars

3. **Loading State**: Use `isSharing` to show loading and disable button

### Browser Behavior

The hook automatically detects capabilities:

* **iOS/Android**: Native share panel (save to Files/Drive or share to apps)
* **Desktop/Old Browsers**: Falls back to traditional download
* **Error Handling**: Silently handles user cancellation

### Reference

See `src/pages/Generator/components/HeadshotGeneratorTab.tsx` for complete implementation.

## 6. API Key & Security (BYOK Architecture)

To protect user keys and ensure a seamless experience, follow the "Bring Your Own Key" (BYOK) pattern.

### 6.1 Centralized Logic

* **Root Handler**: Only the App's root (e.g., `Generator/App.tsx`) handles `localStorage` and `sessionStorage`.
* **Key Props**: All sub-tabs and components must receive `apiKey` as a prop.
* **Re-Authentication**: Components should call `onNeedApiKey()` if an API call fails with a 401/403 error.

### 6.2 Implementation Pattern (Google GenAI)

Always initialize the client dynamically with the provided key:

```typescript
// service.ts
import { GoogleGenAI } from "@google/genai";

export async function useAiService(apiKey: string) {
  const ai = new GoogleGenAI({ apiKey });
  const model = ai.getGenerativeModel({ model: "gemini-3-pro-image-preview" });
  // ...
}
```

## 7. CreativeOS Loading & Processing UX

Generation and AI processing should feel consistent and "magical":

### 7.1 Full-Screen "Magic" Overlay

For batch processing or long generations, use the standard full-screen overlay:

* **Icon**: Spinning `Sparkles` or `Wand2`.
* **Text**: "Generating AI Art..." (generatingArt) or "Batch Processing..." (batchProcessing).
* **Secondary Text**: "Applying Magic..." (applyingMagic).
* **Progress**: Include a progress bar for batch operations.

### 7.2 Micro-Loading (Buttons)

For quick actions, use a spinner icon inside the button and disable the button.

## 8. Error Handling & Feedback Pattern

### 8.1 Error Toasts

* Errors should appear at the **bottom center** as a floating toast.
* Use `red-500` background with a white "!" icon.

### 8.2 Validation Errors

* Perform client-side validation (e.g., checking if image is uploaded) before calling API.
* Show a descriptive error message using the `t('generator.errors.*')` keys.

## 9. Background Removal (Chroma-Key)

Many apps offer background removal. Always use the standardized chroma-key logic for green/blue screens:

1. **Smart Chroma Detection**: Check corners for background color.
2. **Alpha Transparency**: Use an off-screen canvas to set alpha to 0 for detected background pixels.
3. **Edge Smoothing**: Apply a slight expansion/feathering to the mask to avoid "green halos".

## 10. Gallery & Portfolio Lifecycle Standards

To ensure a persistent and multi-tab experience ("CreativeOS" feel), all Apps MUST integrate with the local Gallery (IndexedDB).

### 10.1 Uploading: "From Gallery" Integration

Every image upload area (Drag & Drop zone) must provide a way to pick from existing works.

* **Button UI**: Use a secondary styled button with `<FolderHeart size={16} />`.
* **Behavior**: Launch the `<GalleryPicker />` modal and handle the `onSelect(blobs)` callback.

### 10.2 Success: Auto-Import to Gallery

When a generation or edit is successful (e.g., AI generation finished, collage exported), the result **MUST** be automatically saved to the Gallery.

* **Timing**: Save immediately upon successful creation, before the user initiates a download.
* **Implementation**: Use `saveStickerToDB(stickerObject)` from `src/db.ts`.
* **UX Benefit**: This ensures work is never lost if the browser refreshes and allows "assembling" a project across different apps.

## 11. Mobile-Friendly Action Patterns

Mobile users cannot rely on hover states. UI actions must be explicit and touch-friendly.

### 11.1 Persistent Action Overlays

* **No Hover-Only controls**: Actions like "Preview", "Download", "Remove BG" should be visible by default or reachable via a single tap, not just mouse hover.
* **Large Touch Targets**: Ensure buttons have at least `44x44px` hit area (or equivalent spacing).

### 11.2 Robust Download Logic

Always use the Blob-based download pattern to avoid "Corrupted file" or "Lost transparency" issues on mobile browsers:

```typescript
const blob = await (await fetch(imageUrl)).blob();
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'filename.png';
link.click();
URL.revokeObjectURL(url);
```

## 11. Results Preview & Management

Generated outputs should be easy to inspect and export in bulk.

### 11.1 Standard Preview Modal

* **Logic**: Click on a result thumbnail to open a high-res modal.
* **UI**: Black semi-transparent background (`bg-black/90`), backdrop blur, and persistent action buttons (Download, Copy, Remove BG) inside the modal for mobile friendly access.

### 11.2 Batch Export (ZIP)

Apps that generate multiple items (like Batch Stickers) MUST provide a ZIP export option.

* **Implementation**: Use `jszip` library.
* **Naming**: Use `t('generator.action.zipName')` or a descriptive feature-based name.

## 12. AI Prompting & Output Standards

### 12.1 Prompt Engineering Flow

For high-quality results, use a **Two-Step** process:

1. **Optimize (Text)**: Use the model to convert user intent into a detailed English visual prompt.
2. **Generate (Image)**: Feed the optimized prompt into the image generation call.

### 12.2 Output Sanitization (JSON)

* **MIME Type**: Always use `config: { responseMimeType: "application/json" }` for structured data.
* **Code Block Stripping**: AI often wraps JSON in ```json blocks. Always strip these manually before `JSON.parse`.
* **React Safety**: **NEVER** render AI-generated keys directly. Always force types: `String(data.key || "")`.

---
**Checklist for New Features:**

* [ ] Is it registered in `Layout.tsx` (Title & Sidebar)?
* [ ] Does it use `zh-TW.json` and `en.json`?
* [ ] Does it use standard container classes?
* [ ] Are local headers removed?
* [ ] Does it offer "From Gallery" in the upload section?
* [ ] Does successful output auto-save to Galllery via `saveStickerToDB`?
* [ ] Does it use the standard `apiKey` prop pattern (NOT internal storage)?
* [ ] Does it implement the Two-Step Prompt Optimization flow?
* [ ] Is raw AI output sanitized and type-forced before rendering?
* [ ] Does the loading state use the standard "Magic Overlay" or button spinner?
* [ ] Are error messages displayed using the global `error` toast pattern?
* [ ] Does the result gallery provide a standard zoom-in Preview Modal?
* [ ] Does image download/share use `useImageShare` hook (for mobile)?
* [ ] Are hover-only buttons avoided for critical mobile actions?

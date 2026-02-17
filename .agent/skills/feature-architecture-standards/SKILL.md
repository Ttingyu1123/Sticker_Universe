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

---
**Checklist for New Features:**

* [ ] Is it registered in `Layout.tsx` (Title & Sidebar)?
* [ ] Does it use `zh-TW.json` and `en.json`?
* [ ] Does it use standard container classes?
* [ ] Are local headers removed?
* [ ] Does image download/share use `useImageShare` hook?

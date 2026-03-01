# Sticker Universe — CLAUDE.md

## 專案概述

**CreativeOS** — 創意貼紙套件 PWA，整合 Google Gemini AI 生成圖像。
純前端架構（無後端伺服器），使用者自帶 Gemini API Key (BYOK)。
Tech stack: React 19, Vite 6, TypeScript 5.9, Tailwind CSS v4, i18next, IndexedDB (idb), DOMPurify。

---

## 常用指令

```bash
npm run dev              # 開發伺服器
npm run build            # 生產建置
npx tsc --noEmit         # TypeScript 型別檢查（改完必跑）
npm run validate:i18n    # 驗證 i18n 翻譯鍵完整性
npm run check:boundaries # 檢查頁面模組邊界
npm run test             # Vitest 單元測試
npm run test:coverage    # 單元測試 + 覆蓋率報告
npm run e2e              # Playwright E2E 測試
```

**每次修改後必跑：** `npx tsc --noEmit`

---

## 軟體架構

### 整體架構圖

```
Browser (PWA)
├── Service Worker (Workbox)          # 離線快取
├── React 19 App
│   ├── React Router v7               # SPA 路由
│   ├── framer-motion                 # 頁面切換動畫
│   ├── i18next                       # 多語系 (en / zh-TW)
│   └── Pages (lazy-loaded)
│       ├── Landing                   # 首頁 /
│       ├── Generator                 # AI 生成器 /generator/*
│       ├── ImageEditor               # 圖像編輯 /image-editor/*
│       ├── PhotoCollage              # 照片拼貼 /photo-collage/*
│       ├── DrawingStudio             # 手繪工作室 /drawing-studio/*
│       ├── PrintSheet                # 列印版面 /print-sheet
│       ├── Gallery                   # 作品庫 /gallery
│       └── LayerLab                  # 圖層實驗室 /layer-lab
└── External Services
    └── Google Gemini API             # 直接從瀏覽器呼叫 (HTTPS)
```

### 路由結構

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | Landing | 功能入口首頁 |
| `/generator/*` | Generator | AI 圖像生成，9 個子功能 Tab |
| `/image-editor/*` | ImageEditor | 圖像編輯套件，8 個子功能 Tab |
| `/photo-collage/*` | PhotoCollage | 照片拼貼，含 AI 自動排版 |
| `/drawing-studio/*` | DrawingStudio | 手繪畫布，含筆刷/圖層 |
| `/print-sheet` | PrintSheet | 貼紙/證件照列印版面 |
| `/gallery` | Gallery | IndexedDB 作品瀏覽庫 |
| `/layer-lab` | LayerLab | 進階圖層合成/遮罩實驗室 |

### 目錄結構

```
src/
├── App.tsx                  # 路由設定、PageRoute wrapper (ErrorBoundary + Suspense)
├── main.tsx                 # 應用程式入口，掛載 BrowserRouter + i18n
├── db.ts                    # IndexedDB 操作 (idb): 貼紙 CRUD
├── i18n.ts                  # i18next 初始化，語言偵測設定
├── index.css                # 全域樣式，Tailwind v4 指令
│
├── pages/                   # 各功能頁面（按功能模組切分）
│   ├── Landing/             # 首頁：CategorySection、TabCard 入口卡片
│   ├── Generator/           # AI 生成器
│   │   ├── App.tsx          # API Key 管理、Tab 切換、全域結果 Gallery
│   │   ├── components/      # 9 個 Tab 元件（StyleStickerTab, ImageGeneratorTab...）
│   │   ├── services/
│   │   │   ├── geminiService.ts       # 核心 Gemini API 呼叫（sticker/image/caption）
│   │   │   └── geminiMangaService.ts  # 漫畫分格專用 Gemini 服務
│   │   ├── config/apps.ts   # Generator 功能 app 清單設定
│   │   ├── constants/       # 生成器常數（模型清單、提示詞模板）
│   │   └── types.ts         # Sticker、GeneratorState 等型別
│   │
│   ├── ImageEditor/         # 圖像編輯套件 (8 Tabs)
│   │   ├── App.tsx          # Tab 切換控制器（react-aria Tabs）
│   │   └── components/
│   │       ├── PackagerTab.tsx      # 批次處理：背景移除、格式轉換
│   │       ├── SmartRemoveTab.tsx   # AI 背景移除 (@imgly/background-removal)
│   │       ├── AnimatorTab.tsx      # GIF 動畫製作 (gif.js)
│   │       ├── EditorTab.tsx        # 裁切/旋轉/濾鏡 (cropperjs)
│   │       ├── ImageResizerTab.tsx  # 尺寸調整
│   │       ├── OutpaintTab.tsx      # 魔法擴圖 (Gemini 圖生圖)
│   │       ├── LocalRedrawTab.tsx   # 局部重繪 (Gemini 遮罩修補)
│   │       └── SvgConverterTab.tsx  # 點陣圖轉 SVG (imagetracerjs)
│   │
│   ├── PhotoCollage/        # 照片拼貼
│   │   ├── App.tsx          # 拼貼主控制器
│   │   ├── AutoCollageTab.tsx # AI 自動排版（Gemini 建議）
│   │   ├── components/      # PhotoCanvas、Controls
│   │   ├── geminiService.ts # 拼貼專用 Gemini 服務
│   │   └── utils/           # backgroundPresets、geometry 工具
│   │
│   ├── DrawingStudio/       # 手繪工作室
│   │   ├── App.tsx          # 畫布 + 圖層 + 筆刷控制
│   │   ├── components/      # CanvasToolbar、LayerPanel、BrushSettingsPanel
│   │   ├── hooks/
│   │   │   └── useBrushPresets.ts  # 筆刷預設管理
│   │   └── types.ts         # DrawingLayer、BrushSettings 型別
│   │
│   ├── PrintSheet/          # 列印版面
│   │   ├── App.tsx          # 列印版面主控制器
│   │   └── components/
│   │       ├── PrintSheetTab.tsx    # 貼紙列印排版
│   │       └── IDPrintStudioTab.tsx # 證件照排版
│   │
│   ├── Gallery/             # 作品庫（IndexedDB 瀏覽）
│   ├── LayerLab/            # 圖層合成/遮罩實驗室
│   │   ├── components/      # EditorCanvas、MaskCanvas、SplitPreviewModal
│   │   └── utils/           # exportUtils、maskUtils
│   │
│   ├── Editor/              # 獨立 Canvas 編輯器（貼紙製作）
│   │   ├── components/      # EditorCanvas、Sidebar、Toolbar、BubblePicker、LayerObject
│   │   ├── hooks/
│   │   │   └── useHistory.ts  # Undo/Redo 歷程管理
│   │   ├── utils/           # exportUtils、idUtils、textMeasurement
│   │   └── types.ts         # Layer、LayerType、TextProperties、CanvasConfig
│   │
│   ├── Packager/            # 批次背景處理引擎
│   │   └── services/ai/
│   │       └── backgroundRemoval.ts  # @imgly 背景移除包裝
│   │
│   └── Eraser/              # 橡皮擦工具頁面
│
├── features/                # 可重用 Feature Cores（re-export 模式）
│   ├── editor-core/index.ts      # 匯出 EditorCanvas、Layer 型別、useHistory
│   ├── animator-core/index.ts    # 匯出 LayerCanvas、LayerProperties
│   ├── packager-core/index.ts    # 匯出 processImage、fileToBase64
│   ├── eraser-core/index.ts      # 橡皮擦工具 exports
│   ├── mask-core/index.ts        # 遮罩工具 exports
│   └── character-creator-core/  # 角色創建核心（service + constants + types）
│
├── components/              # 跨頁面共用元件
│   ├── GalleryPicker.tsx    # 從 IndexedDB 挑選作品的彈窗
│   ├── LinePreviewModal.tsx # LINE 貼圖預覽模態窗
│   ├── shared/
│   │   ├── APIKeySetup.tsx  # Gemini API Key 設定元件
│   │   └── ErrorBoundary.tsx # React Error Boundary
│   └── ui/
│       ├── Button.tsx       # 共用按鈕元件
│       └── LanguageSwitcher.tsx # 語言切換器
│
├── shared/                  # 共用工具函式（純邏輯，無 UI）
│   ├── geminiApiKey.ts      # API Key 讀取/儲存/清除（localStorage/sessionStorage）
│   ├── localStorage.ts      # safeSaveToLocalStorage / safeLoadFromLocalStorage
│   └── types/
│       └── sticker.ts       # Sticker 型別定義
│
├── locales/                 # i18n 翻譯檔
│   ├── en.json              # 英文翻譯（主要）
│   ├── zh-TW.json           # 繁體中文翻譯
│   └── landing_en.json      # 首頁專用英文翻譯
│
├── config/
│   └── landingTabs.ts       # Landing 頁面 Tab 設定資料
│
├── constants/
│   └── top100Styles.ts      # Top 100 風格常數
│
└── layouts/
    └── Layout.tsx           # 全域版面（含 Header、語言切換）
```

### 資料流架構

```
使用者操作
    │
    ▼
React State (useState/useReducer)
    │
    ├─── 持久化 ──→ IndexedDB (idb)            # 貼紙/作品庫
    │              src/db.ts
    │
    ├─── 輕量快取 → localStorage / sessionStorage  # API Key、近期歷程
    │              src/shared/geminiApiKey.ts
    │              src/shared/localStorage.ts
    │
    └─── AI 生成 → Google Gemini API            # 直連 (無後端代理)
                   src/pages/Generator/services/geminiService.ts
                   src/pages/PhotoCollage/geminiService.ts
                   src/pages/Generator/services/geminiMangaService.ts
```

### Gemini API Key 管理機制

```
使用者輸入 API Key
    │
    ├─ 勾選「記住」→ localStorage   (跨 session 持久)
    └─ 未勾選     → sessionStorage (關閉分頁即清除)

驗證規則: key.startsWith('AIza') && key.length >= 35
```

### 關鍵第三方套件用途

| 套件 | 用途 |
|------|------|
| `@google/genai` | Gemini API 呼叫（圖像生成、文字生成） |
| `@imgly/background-removal` | 本地 AI 背景移除（WASM/ONNX，無需伺服器） |
| `@xenova/transformers` | 本地 ML 推論（Hugging Face 模型） |
| `gif.js` | 前端 GIF 動畫合成（Web Worker） |
| `jspdf` + `html2canvas` | 匯出 PDF 或高解析圖片 |
| `jszip` | 批次打包下載（.zip） |
| `cropperjs` + `react-image-crop` | 圖片裁切工具 |
| `imagetracerjs` | 點陣圖轉 SVG 向量化 |
| `framer-motion` | 頁面/元件進出場動畫 |
| `react-aria-components` | 無障礙 UI 元件（Tabs 等） |
| `dompurify` | SVG/HTML sanitize（防 XSS） |
| `idb` | IndexedDB Promise 封裝 |
| `upng-js` | PNG 壓縮處理 |

### PWA 設定

- App 名稱：**CreativeOS**（`vite.config.ts` manifest）
- Service Worker：Workbox autoUpdate 策略
- 快取排除：`*.wasm`、`ort-*.mjs/js`（避免快取過大的 ML 模型）
- imgly-data（背景移除模型資料）不走 navigateFallback
- 部署平台：**Vercel**（`vercel.json` 設定）

---

## 安全規則（必須遵守）

### SVG / HTML 渲染
- **所有 `dangerouslySetInnerHTML` 的 SVG 內容必須先經過 DOMPurify sanitize**
- 使用 svg profile：
  ```tsx
  import DOMPurify from 'dompurify';
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svgContent, { USE_PROFILES: { svg: true, svgFilters: true } }) }}
  ```

### Gemini API Key 驗證
- 儲存前必須驗證格式：
  ```typescript
  const isValidGeminiKey = (key: string) => key.startsWith('AIza') && key.length >= 35;
  ```

---

## 程式碼規範

### localStorage 操作
- **禁止直接 `try/catch` 包 localStorage**，統一使用共用工具：
  ```typescript
  import { safeSaveToLocalStorage, safeLoadFromLocalStorage } from '../../shared/localStorage';
  ```

### 多語系（i18n）
- **禁止硬編碼中文字串**，一律使用 `t('key')` 翻譯函式
- 新增翻譯鍵時，`en.json` 和 `zh-TW.json` 都要同步更新
- 修改後跑 `npm run validate:i18n` 確認

### Error Boundary
- 每個 lazy-loaded 頁面已由 `src/App.tsx` 的 `PageRoute` 包覆 `ErrorBoundary`
- 新增頁面路由時，使用同樣的 `PageRoute` wrapper

### 新增路由頁面
1. 在 `src/pages/` 下建立新目錄
2. 在 `src/App.tsx` 用 `React.lazy` 載入
3. 使用 `PageRoute` wrapper（內含 ErrorBoundary + Suspense）
4. 確認符合 `check:boundaries` 規範

### 元件大小
- 單一元件超過 500 行應考慮拆分
- 優先將 side-effect 邏輯提取為 custom hook

### features/ 目錄規範
- `features/*-core/index.ts` 只做 re-export，不含業務邏輯
- 業務邏輯保留在各自 `pages/` 內，features/ 只是統一的對外介面

---

## 文件慣例

- Code review 記錄存放於 `docs/code-review-YYYY-MM-DD.md`
- 不要建立 `tasks/` 目錄，統一用 `docs/`

---

## 注意事項

- `src/locales/zh-TW-temp.json` 已刪除，不要重新建立
- Gemini API Key 存在 localStorage / sessionStorage 是已知限制，不要試圖在前端加密
- `GoogleGenAI` 實例在 `geminiService.ts` 已有 Map 快取（clientCache），同 key 不會重複建立實例
- `@imgly/background-removal` 模型資料由 `copy-imgly-assets.js` 在 `postinstall` 時複製到 `public/imgly-data/`
- GIF 動畫使用 `gif.js` 的 Web Worker（`public/gif.worker.js`），不要移動此檔案位置

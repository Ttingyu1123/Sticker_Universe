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
npm run typecheck        # TypeScript 型別檢查（改完必跑；勿用 npx tsc --noEmit，該指令在本 repo 是 no-op）
npm run validate:i18n    # 驗證 i18n 翻譯鍵完整性
npm run check:boundaries # 檢查頁面模組邊界
npm run test             # Vitest 單元測試
npm run test:coverage    # 單元測試 + 覆蓋率報告
npm run e2e              # Playwright E2E 測試
```

**每次修改後必跑：** `npm run typecheck`（底層是 `tsc -b --noEmit --force`；root tsconfig 是 solution-style references，不帶 `-b` 的 `tsc --noEmit` 什麼都不會檢查）

---

## 軟體架構

### 路由結構

| 路徑 | 頁面 | 說明 |
|------|------|------|
| `/` | Landing | 功能入口首頁 |
| `/generator/*` | Generator | AI 圖像生成，10 個子功能 Tab（含 sprite-sheet 貼圖分鏡表） |
| `/image-editor/*` | ImageEditor | 圖像編輯套件，8 個子功能 Tab |
| `/animated-sticker` | AnimatedSticker | LINE 動態貼圖製作：影片＋4×2 格線抽幀 → 8 張 320×270 APNG，含主圖/頁籤圖產生器、LINE 規格驗證與自動壓縮 |
| `/ai-video` | AiVideo | AI 影片生成（Gemini Veo / Grok），走 `api/ai-video.ts` proxy，job 存 IndexedDB `aiVideoJobs` |
| `/sprite-sheet-generator` | — | 302 轉址至 `/generator?tab=sprite-sheet` |
| `/photo-collage/*` | PhotoCollage | 照片拼貼，含 AI 自動排版、文字標注（字型/大小/顏色） |
| `/drawing-studio/*` | DrawingStudio | 手繪畫布，含筆刷/圖層 |
| `/print-sheet` | PrintSheet | 貼紙/證件照列印版面 |
| `/print-preflight` | PrintPreflight | 列印前檢查：DPI/銳利度/噪點/CMYK 風險 |
| `/gallery` | Gallery | IndexedDB 作品瀏覽庫 |
| `/layer-lab` | LayerLab | 進階圖層合成/遮罩實驗室 |

### 目錄結構

```
src/
├── pages/       # 各功能頁面（Landing/Generator/ImageEditor/AnimatedSticker/AiVideo/PhotoCollage/DrawingStudio/PrintSheet/PrintPreflight/Gallery/LayerLab/Editor/Packager/Eraser/Animator/SpriteSheetGenerator）
├── features/    # `*-core/` 是 re-export 模式（不含業務邏輯）；`ai-video/`、`sprite-sheet-generator/` 是含實際邏輯的 feature 模組（服務層/prompt 組裝/持久化）
├── components/  # 跨頁面共用元件（GalleryPicker、LinePreviewModal、shared/、ui/）
├── shared/      # 共用工具函式（geminiApiKey、localStorage、types/）
├── locales/     # i18n 翻譯檔（en.json、zh-TW.json、landing_en.json）
├── config/      # landingTabs.ts
├── constants/   # top100Styles.ts
└── layouts/     # Layout.tsx（含 Global Header、語言切換）
```

### 資料流

- React State → **IndexedDB** (idb) — 貼紙/作品庫持久化（`src/db.ts`）
- React State → **localStorage/sessionStorage** — API Key、近期歷程（`src/shared/`）
- React State → **Google Gemini API** — 直連無後端代理（`src/pages/*/geminiService.ts`）

### Gemini API Key 管理

- 勾選「記住」→ localStorage（跨 session 持久）；未勾選 → sessionStorage（關閉分頁清除）
- 驗證規則：`key.startsWith('AIza') && key.length >= 35`

### 關鍵第三方套件

| 套件 | 用途 |
|------|------|
| `@google/genai` | Gemini API（圖像/文字生成） |
| `@imgly/background-removal` | 本地 AI 背景移除（WASM/ONNX） |
| `@xenova/transformers` | 本地 ML 推論（Hugging Face） |
| `gif.js` | 前端 GIF 合成（Web Worker） |
| `jspdf` + `html2canvas` | 匯出 PDF/高解析圖片 |
| `jszip` | 批次打包下載（.zip） |
| `cropperjs` + `react-image-crop` | 圖片裁切 |
| `imagetracerjs` | 點陣圖轉 SVG |
| `framer-motion` | 頁面/元件動畫 |
| `dompurify` | SVG/HTML sanitize（防 XSS） |
| `idb` | IndexedDB Promise 封裝 |
| `upng-js` | APNG 編碼（動態貼圖輸出，`AnimatedSticker/utils/apng.ts`） |
| `file-saver` | Blob 下載（單張圖仍優先走 `useImageShare`） |

### PWA 設定

- App 名稱：**CreativeOS**；Service Worker：Workbox autoUpdate
- 快取排除：`*.wasm`、`ort-*.mjs/js`（避免快取過大的 ML 模型）
- 部署平台：**Vercel**（push to main 自動觸發）

---

## 安全規則（必須遵守）

- **所有 `dangerouslySetInnerHTML` SVG 必須先 DOMPurify sanitize**（svg + svgFilters profile）
- **Gemini API Key 儲存前必須驗證格式**（`startsWith('AIza') && length >= 35`）

---

## 程式碼規範

### localStorage
禁止直接 `try/catch` 包 localStorage，統一使用 `safeSaveToLocalStorage` / `safeLoadFromLocalStorage`（`src/shared/localStorage.ts`）。

### 多語系（i18n）
- 禁止硬編碼中文字串，一律使用 `t('key')`
- 新增翻譯鍵時 `en.json` + `zh-TW.json` 同步更新，修改後跑 `npm run validate:i18n`

### Error Boundary
- 每個 lazy-loaded 頁面由 `src/App.tsx` 的 `PageRoute` 包覆 ErrorBoundary + Suspense
- 新增路由頁面時，使用同樣的 `PageRoute` wrapper，並在 `Layout.tsx` 的 `getPageTitle()` 加標題

### 元件大小
- 單一元件超過 500 行應拆分；side-effect 邏輯提取為 custom hook

### features/ 規範
- `features/*-core/index.ts` 只做 re-export，不含業務邏輯

### UI 架構強制規則
- **禁止在 page 檔內建立 local `<header>`**，一律使用 `src/layouts/Layout.tsx` Global Header
- 主要內容容器標準：`container mx-auto px-4 max-w-[1920px]`

### 設計系統色票（Mint/Cream 主題）
禁止使用 `text-gray-*` / `bg-gray-*`，一律使用專案色票：

| 用途 | Tailwind Class | Hex |
|------|---------------|-----|
| App 背景 | `bg-cream-light` | `#E3F3F1` |
| 側欄 / 卡片 | `bg-cream` | `#F8F7EE` |
| 主強調色 | `text-primary` / `bg-primary` | `#A186B4` |
| 內文 | `text-bronze-text` | `#4A4055` |
| 邊框 | `border-cream-dark` | `#D8D7CE` |
| 靜音文字 | `text-bronze-text/60` | 取代 `text-gray-500` |

互動元素：Primary 按鈕 `bg-primary text-white hover:bg-primary-hover`；Ghost 按鈕 `text-bronze-light hover:text-primary hover:bg-white/60`

### 共享基礎設施（優先使用，禁止重複造輪）
- **通知**：`useToast`（`src/components/shared/ToastProvider.tsx`）— **禁用 `alert()`**；錯誤訊息一律 `showToast(t('key'), 'error')`
- **Provider 切換 UI**：`<ProviderSwitcher />`（`src/components/shared/ProviderSwitcher.tsx`）；key 錯誤判斷用 `isApiKeyError()`（`src/shared/geminiApiKey.ts`）
- **Modal 無障礙**：所有 `fixed inset-0` 互動 modal 必掛 `useModalA11y`（`src/hooks/useModalA11y.ts`）+ `role="dialog"` / `aria-modal` / `aria-labelledby`
- **內容選項字典**（主題/風格/節慶等 constant array）：display 欄位用 `labelKey` + `t()`；`prompt` 欄位是 AI 輸入，**永不翻譯、永不因 UI 語言改變**

### 新功能整合必做清單
- [ ] 圖片下載/分享一律用 `useImageShare` hook（`src/hooks/useImageShare.ts`）
- [ ] 成功生成後立即呼叫 `saveStickerToDB()`（`src/db.ts`）自動存入 Gallery
- [ ] 上傳區提供「從作品集選取」按鈕，使用 `<GalleryPicker />` modal
- [ ] AI 生成採兩步驟：先 text 模式最佳化 prompt → 再 image 模式生成

### AI 輸出安全規則
- JSON 回傳前必須去除 Markdown code block（`.replace(/```json\n?|\n?```/g, '').trim()`）
- 渲染 AI 資料前必須強制型別（`String(data.title || "")`，防空白頁 crash）
- localStorage 存 base64 圖片必須用 `safeSaveToLocalStorage`，history 最多保留 3–5 筆（防 `QuotaExceededError`）

---

## 部署與除錯

- 平台：**Vercel**（push to main 自動部署）；機密存 Vercel 環境變數 / GitHub Secrets，不用 `.env`
- 修完 bug 注意 SW 快取和 Vite chunk hash（lazy-loaded chunk 新部署後舊 hash 失效，會出現 "Failed to fetch dynamically imported module"）
- `ErrorBoundary` 已加入 chunk load error 自動 reload（`src/components/shared/ErrorBoundary.tsx`）
- **同一方向最多嘗試 2 次**，失敗立即換策略

---

## 注意事項

- `src/locales/zh-TW-temp.json` 已刪除，不要重新建立
- Gemini API Key 存在 localStorage/sessionStorage 是已知限制，不要在前端加密
- `GoogleGenAI` 實例在 `geminiService.ts` 有 Map 快取（clientCache），同 key 不重複建立
- `@imgly/background-removal` 模型資料由 `copy-imgly-assets.js` 在 `postinstall` 複製到 `public/imgly-data/`
- GIF 動畫使用 `gif.js` Web Worker（`public/gif.worker.js`），不要移動此檔案位置
- 本地 dev 的 `/api/*`（openai-image / openai-text / ai-video）由 `vite.config.ts` 的 `localVercelApiPlugin` 直接掛載 serverless handler，不需要 `vercel dev`；新增 api handler 時記得在該 plugin 註冊
- Code review 記錄存 `docs/code-review-YYYY-MM-DD.md`，不建立 `tasks/` 目錄

---

## AI Provider 架構

- **雙 provider（Gemini / OpenAI）覆蓋範圍**：Generator 全部 10 個 tab、PhotoCollage `AutoCollageTab`、ImageEditor `LocalRedrawTab` / `OutpaintTab`。
- API key 分開儲存：`gemini_api_key` / `openai_api_key`（localStorage 或 sessionStorage，統一走 `src/shared/geminiApiKey.ts`）；AiVideo 的 Grok key 存 `grok_api_key`（`src/features/ai-video/apiKeys.ts`）。
- **Gemini**：前端直連（BYOK）。**OpenAI**：一律走 Vercel proxy — 圖片生成/edit 走 `api/openai-image.ts`、文字走 `api/openai-text.ts`。
- Proxy 有 abuse guard（`api/_guard.ts`）：同源 Origin 檢查、model allowlist、prompt/輸入長度與圖片數量上限。新 model 要先加進 allowlist。
- Generator 的 per-tab provider 狀態集中在 `Generator/App.tsx` 的 `tabProviders: Record<TabId, AiProvider>`，不要新增獨立 useState。

### AI 影片（AiVideo）

- Provider：**Gemini Veo** 與 **Grok**（`api.x.ai`），皆 BYOK、一律走 `api/ai-video.ts` proxy（同樣套 `api/_guard.ts` 的 origin 檢查與 body 上限）。
- **Model ID 寫死在 `api/ai-video.ts` server 端**，client 傳的 `model` 欄位會被忽略——換 model 要改 proxy，不是改前端。
- 流程是兩段式：`create` 建 job → 前端輪詢 `status`；job（含 MP4 blob）存 IndexedDB `aiVideoJobs` store（`src/db.ts`，DB version 2），可經 `?job=` 參數跨 reload 續看。
- 完成的 MP4 可轉送 `/animated-sticker?videoJob=<id>` 切幀做動態貼圖。
- 新增上游網域時要同步更新 `vercel.json` 的 CSP（`media-src`/`connect-src`，目前含 `*.googleapis.com`、`*.x.ai`）。

## Available CLI Tools (OpenCLI)

Run `opencli list` to discover all available CLI tools. Use `opencli <command> -f json` for structured output.

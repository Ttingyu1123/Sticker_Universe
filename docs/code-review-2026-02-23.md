# Code Review — Sticker Universe
**日期：** 2026-02-23
**審查範圍：** 全專案（src/、tests/、scripts/、設定檔）

---

## 整體印象

功能豐富的創意套件，技術選型現代（React 19, Vite 6, Tailwind v4），架構模組化且支援 PWA。但隨著功能快速增長，累積了一些需要處理的技術債。

---

## P0 — 嚴重問題（建議盡快處理）

### 1. XSS 安全漏洞 — SVG 注入

**影響檔案：**
- `src/pages/ImageEditor/components/SvgConverterTab.tsx`
- `src/pages/Editor/components/BubblePicker.tsx`

`SvgConverterTab.tsx` 將使用者圖片轉換後產生的 SVG 直接用 `dangerouslySetInnerHTML` 渲染，未經任何 sanitization：

```tsx
// SvgConverterTab.tsx
dangerouslySetInnerHTML={{ __html: svgContent }}

// BubblePicker.tsx — regex replace 不足以防護
dangerouslySetInnerHTML={{ __html: bubble.svg.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"') }}
```

**建議：** 安裝 `dompurify`，在渲染前做 sanitization：

```tsx
import DOMPurify from 'dompurify';
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(svgContent, { USE_PROFILES: { svg: true } }) }}
```

---

### 2. 全站缺乏 Error Boundary

整個專案找不到任何 `ErrorBoundary` 元件。任何一個頁面 crash 都會把整個 App 拉垮，對 PWA 來說影響尤其大。

**建議：** 至少在每個 page 的 `React.lazy()` Suspense 外層包一層 ErrorBoundary，搭配 fallback UI 提示使用者重新整理。

---

## P1 — 高優先度

### 3. 測試覆蓋率幾乎為零

整個專案只有 `tests/e2e/gallery.mobile.spec.ts` 一個測試檔，且只有 2 個 test case。

| 功能 | 測試狀態 |
|------|---------|
| Generator（最核心功能） | ❌ 無測試 |
| API Key 存取邏輯（安全關鍵） | ❌ 無測試 |
| DrawingStudio 畫布操作 | ❌ 無測試 |
| ImageEditor 各工具 | ❌ 無測試 |
| geminiService.ts | ❌ 無測試 |
| Gallery（現有） | ✅ 2 個 E2E tests |

`playwright.config.ts` 目前也只測 iPhone 13，沒有桌面版瀏覽器。

**建議優先補充：**
1. `geminiService.ts` 的 unit tests（mock API 回應）
2. Generator 頁面的 E2E tests
3. API key 儲存 / 讀取 / 清除的流程測試
4. 擴展 Playwright 設定，加入桌面版 Chromium / Firefox

---

### 4. 巨型元件需要拆分

單一元件過大，難以維護與測試，也容易造成不必要的 re-render：

| 檔案 | 行數 | 備註 |
|------|------|------|
| `src/pages/DrawingStudio/App.tsx` | **1,324 行** | 含 39 個 useState、24 個 useCallback |
| `src/pages/ImageEditor/components/SmartRemoveTab.tsx` | **1,223 行** | |
| `src/pages/Generator/components/StyleStickerTab.tsx` | **1,158 行** | |
| `src/pages/ImageEditor/components/PackagerTab.tsx` | **1,040 行** | |
| `src/pages/Generator/components/PortraitMasterTab.tsx` | **1,026 行** | 含 17 個 useState |
| `src/pages/Editor/components/Sidebar.tsx` | **748 行** | |

**建議：** 以 DrawingStudio 為優先，將畫布邏輯、工具列、圖層管理等拆分為獨立子元件與 custom hooks。

---

## P2 — 中優先度

### 5. 大量硬編碼中文字串（未走 i18n）

`src/pages/Generator/App.tsx` 第 73 行：
```typescript
setError("請輸入有效的 API Key");  // 應改為 t('...')
```

`src/pages/Generator/App.tsx` 第 245 行：
```typescript
setError("壓縮檔案失敗。");  // 應改為 t('...')
```

`src/pages/Generator/components/StyleStickerTab.tsx` 中的 theme label 也有同樣問題：
```typescript
{ id: 'office', label: '社畜日常 (預設)', ... },  // 應走 i18n
{ id: 'daily', label: '日常生活', ... },
```

**建議：** 用以下指令找出所有未翻譯的中文字串：
```bash
grep -rn '"\([^"]*[\u4e00-\u9fff][^"]*\)"' src --include="*.tsx"
```

---

### 6. 重複的 localStorage 錯誤處理模式

至少 4 個地方使用完全相同的 try/catch 寫法存取 localStorage：
- `src/pages/Generator/App.tsx`
- `src/pages/DrawingStudio/App.tsx`
- `src/pages/Generator/components/GreetingCardTab.tsx`
- `src/pages/Generator/components/CharacterCreateTab.tsx`

```typescript
// 四個地方都是這個 pattern
try {
    localStorage.setItem('key_name', JSON.stringify(data));
} catch (e) {
    console.warn("LocalStorage Quota Exceeded...", e);
}
```

**建議：** 抽成 `useLocalStorage` hook 或 `safeSaveToLocalStorage()` utility function，統一管理。

---

### 7. API Key 驗證太弱

`src/components/shared/APIKeySetup.tsx` 和 `src/pages/Generator/App.tsx` 只驗證 key 不為空字串，沒有格式驗證。存進 storage 後才會在 API 呼叫時報錯，UX 不佳。

**建議：** 加入 Gemini API Key 的基本格式驗證（例如前綴、長度），讓使用者在輸入時就能得到回饋。

---

## P3 — 低優先度 / 技術優化

### 8. GoogleGenAI 每次 API 呼叫都重新建立實例

`src/pages/Generator/services/geminiService.ts` 中每個 exported function 都各自 `new GoogleGenAI({ apiKey })`，至少 5 處（lines 17, 178, 249, 300, 352）。

**建議：** 改為 singleton 或 memoized 工廠函式：
```typescript
const clientCache = new Map<string, GoogleGenAI>();
function getClient(apiKey: string): GoogleGenAI {
    if (!clientCache.has(apiKey)) {
        clientCache.set(apiKey, new GoogleGenAI({ apiKey }));
    }
    return clientCache.get(apiKey)!;
}
```

---

### 9. App.tsx 路由設定不夠 DRY

`src/App.tsx` 中每個 `React.lazy()` 都是複製貼上，8 個 route 各自重複同樣的 pattern。

**建議：** 抽成 config array 動態產生：
```typescript
const ROUTES = [
  { path: '/', component: () => import('./pages/Landing/App') },
  { path: '/generator/*', component: () => import('./pages/Generator/App') },
  // ...
];
```

---

### 10. localStorage 寫入未做 debounce

`src/pages/Generator/App.tsx` 的 `useEffect` 在每次 `stickers` 狀態變更時都立即寫入 localStorage，頻繁操作時會造成不必要的 I/O。

**建議：** 加入 debounce 或 batch write 機制。

---

### 11. 錯誤處理吞掉太多 context

多處 `.catch(console.error)` 不區分錯誤類型，debug 時難以追蹤根因。

**建議：**
```typescript
// 改為區分錯誤類型
.catch(err => {
    const message = err instanceof TypeError ? '輸入格式有誤' : '伺服器錯誤，請稍後再試';
    setError(message);
    console.error('[功能名稱] 錯誤:', err);
});
```

---

## 待清理項目

### 12. 遺留暫存檔案

`src/locales/zh-TW-temp.json`（44KB）應從版本控制移除或正式整合。

---

## API Key 安全說明

`src/shared/geminiApiKey.ts` 將 API key 以明文存入 `localStorage` 或 `sessionStorage`。這是 client-side API key 方案的已知限制，無法在前端完全避免。

目前的緩解措施（`remember me` 警告提示）是合理的做法。若未來考慮提升安全性，可評估：
- 加入 Content Security Policy（CSP）headers 降低 XSS 攻擊面
- 改由後端 proxy 轉發 API 請求（key 不落地在前端）

---

## 優先行動總覽

| 優先度 | 項目 | 影響 |
|--------|------|------|
| P0 | SVG 加 DOMPurify sanitization | 安全 |
| P0 | 加 Error Boundary 到每個 page | 穩定性 |
| P1 | 補 Generator 和 geminiService 的測試 | 品質保證 |
| P1 | 拆分 DrawingStudio/App.tsx | 可維護性 |
| P2 | 抽出 `safeSaveToLocalStorage` / `useLocalStorage` | 程式碼品質 |
| P2 | 修所有硬編碼中文字串 | i18n 完整性 |
| P3 | GoogleGenAI singleton 改造 | 效能 |
| P3 | App.tsx 路由設定 DRY 化 | 可維護性 |
| P3 | localStorage 寫入加 debounce | 效能 |
| 清理 | 移除 zh-TW-temp.json | 整潔 |

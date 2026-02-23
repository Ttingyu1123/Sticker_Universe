# Sticker Universe — CLAUDE.md

## 專案概述

創意貼紙套件 PWA，整合 Google Gemini AI 生成圖像。
Tech stack: React 19, Vite 6, TypeScript 5.9, Tailwind CSS v4, i18next, IndexedDB (idb), DOMPurify。

---

## 常用指令

```bash
npm run dev              # 開發伺服器
npm run build            # 生產建置
npx tsc --noEmit         # TypeScript 型別檢查（改完必跑）
npm run validate:i18n    # 驗證 i18n 翻譯鍵完整性
npm run check:boundaries # 檢查頁面模組邊界
npm run e2e              # Playwright E2E 測試
```

**每次修改後必跑：** `npx tsc --noEmit`

---

## 專案結構

```
src/
  pages/          # 各功能頁面（Generator, DrawingStudio, ImageEditor, ...）
  components/     # 共用元件（shared/）
  shared/         # 共用工具函式（localStorage.ts, geminiApiKey.ts, ...）
  locales/        # i18n 翻譯檔（en.json, zh-TW.json）
  layouts/        # Layout 元件
docs/             # 技術文件、code review 記錄
tests/e2e/        # Playwright 測試
scripts/          # 輔助腳本（validate-i18n, check-page-boundaries）
```

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

### 元件大小
- 單一元件超過 500 行應考慮拆分
- 優先將 side-effect 邏輯提取為 custom hook

---

## 文件慣例

- Code review 記錄存放於 `docs/code-review-YYYY-MM-DD.md`
- 不要建立 `tasks/` 目錄，統一用 `docs/`

---

## 注意事項

- `src/locales/zh-TW-temp.json` 已刪除，不要重新建立
- Gemini API Key 存在 localStorage / sessionStorage 是已知限制，不要試圖在前端加密
- `GoogleGenAI` 實例目前各函式各自建立，未來可改為 singleton（P3 優先度）

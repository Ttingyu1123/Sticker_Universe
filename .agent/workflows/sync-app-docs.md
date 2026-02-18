---
description: 當新增 App 或 Tab 時同步更新首頁配置與文件 (README/Guide)
---

# 同步新增功能至 CreativeOS 平台 (SOP)

當您在專案中開發了新的功能頁面 (App) 或標籤 (Tab) 並決定要在首頁 (Landing Page) 展示時，請遵循以下步驟確保文件與 UI 的一致性。

## 1. 更新首頁配置 (Config)

// turbo

1. 修改 `src/config/landingTabs.ts`：
   - 在適當的 `LANDING_CATEGORIES` 分類中新增項目。
   - 確保包含 `id`, `icon`, `path`, `tab`, `titleKey`, `descKey`, `featuresKey`。

## 2. 補全多國語言 (Locales)

// turbo
2. 修改 `src/locales/zh-TW.json` (繁體中文)：

- 在 `landing.tabs` 下新增對應您在第一步設定的 `titleKey`, `descKey`, 與 `featuresKey`。
- 確保描述簡潔且符合功能導向。

## 3. 更新操作指南 (CreativeOS Guide)

// turbo
3. 修改 `<appDataDir>/brain/<conversation-id>/creativeos_guide.md`：

- 在「五大功能分類」中對應的類別下增加新工具。
- 更新標題中的「共計 XX 款專業工具」總量。
- 若功能流程有變動，同步更新 Mermaid 工作流圖表。

## 4. 同步至 README

// turbo
4. 修改專案根目錄的 `README.md`：

- 手動同步 `creativeos_guide.md` 中的變動至 README 的「功能分類」與「使用指南」段落。
- 確保中英文描述（若有）的準確性。

## 5. 更新首頁計數 (UI)

// turbo
5. 修改 `src/pages/Landing/App.tsx`：

- 找到 `stats.tools` 對應的數字（例如 `<span className="text-2xl font-black text-primary">19</span>`）。
- 將數字更新為最新的工具總量。

## 6. 最終驗證

// turbo
6. 啟動 `npm run dev` 並檢查：

- 首頁的新 Tab 是否出現並能正確跳轉。
- 工具計數器顯示是否正確。
- 選中新功能後，多國語言字串是否正確渲染。

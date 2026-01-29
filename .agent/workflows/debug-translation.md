---
description: 解決 UI 翻譯錯誤或失效的標準作業流程 (SOP)
---

當遇到 UI 顯示英文原文或翻譯 key (e.g. `editor.title`) 而非正確語言時，請依照此流程檢查：

1. **檢查 Component 原始碼 (.tsx)**
   - 找到顯示該文字的程式碼位置。
   - **檢查點**：文字是否被 `t()` 函數包覆？
     - ❌ 錯誤範例：`<button>LINE Preview</button>` (這是 Hardcoded 字串，永遠不會變)
     - ✅ 正確範例：`<button>{t('animator.linePreview')}</button>`
   - **修正**：如果發現是 Hardcoded 字串，請定義一個語意化的 key (如 `section.keyName`) 並替換之。

2. **檢查語言檔 (.json)**
   - 開啟 `src/locales/zh-TW.json` 與 `src/locales/en.json`。
   - **檢查點 1**：確認 key 是否存在於對應的階層中。
     - 例如 `t('animator.linePreview')` 必須在 `animator` 物件下包含 `linePreview` 屬性。
   - **檢查點 2**：檢查該區塊是否有 **重複的 Key (Duplicate Keys)**。
     - JSON 中如果有兩個相同的 key，後者會覆蓋前者，或者導致解析錯誤。
     - 使用 `view_file` 檢查該區段，特別留意是否有重複貼上的內容。

3. **修正與驗證**
   - 使用 `replace_file_content` 更新 JSON 檔。
   - **技巧**：為了避免破壞 JSON 結構，盡量只替換該 key 所在的最小區塊，或該 section 的結尾處。
   - 回到瀏覽器確認文字是否正確顯示。

**總結本次案例 (Animator LINE Preview)**：

- 問題：Json 檔雖有 key，但 UI 仍顯示英文。
- 原因：Component 內直接寫死字串 "LINE Preview (APNG)"，根本沒呼叫 `t()`。
- 只改 Json 沒用，必須先改 Code。

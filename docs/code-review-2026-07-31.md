# Code Review — 2026-07-31（Codex 動態貼圖相關新功能）

審查範圍：`4c11ef4..e899fc5`（2026-07-28 起，約 8,300 行新增），由三個獨立 code-reviewer 分塊審查。
基礎驗證：`npm run typecheck` 綠、Vitest 191/191 通過。

## 總結

| 區塊 | 結論 | CRITICAL/HIGH | MEDIUM | LOW |
|------|------|---------------|--------|-----|
| AiVideo（含 proxy） | 慣例全合規，需修資源防護 | 0 | 2 | 4 |
| SpriteSheetGenerator 系列標語 | 邏輯正確，i18n 違規＋檔案超限 | 3 | 2 | 1 |
| AnimatedSticker | 演算法正確，Gallery/下載慣例違規 | 2 | 2 | 2 |

核心演算法（APNG duration/loop、frame 抽取、chroma key、caption 必做詞分配、proxy 安全）均正確且有測試佐證。問題集中在：專案慣例偏離（i18n 硬編碼、未走 useImageShare/saveStickerToDB）與資源防護缺口（無上限輪詢、無上限累積儲存）。

## CRITICAL / HIGH（2026-08-01 全數修復，逐條 re-grep + 閘門驗證：typecheck 綠、i18n 驗證過、Vitest 203/203）

1. ~~**[SpriteSheet] `planPersistence.ts:8` 硬編碼「我的貼圖系列」**~~ — ✅ 已修（`0067040`），features/sprite-sheet-generator 全目錄 grep 零硬編碼中文。
2. ~~**[SpriteSheet] `series.ts:95` fallback 硬編碼「系列 …」**~~ — ✅ 已修（`0067040`）。
3. ~~**[SpriteSheet] `SpriteSheetGeneratorTab.tsx` 807 行超限**~~ — ✅ 已修（`6e0571b`）：拆成 32 行 shell + `useSpriteSheetGeneratorController.ts`（697 行）+ `components/SpriteSheetWorkspace.tsx`（186 行）。
4. ~~**[AnimatedSticker] 生成結果不進 Gallery**~~ — ✅ 已修（`1cb143a`）：新增 `src/pages/AnimatedSticker/gallery.ts` 逐張 `saveStickerToDB()`，附單元測試。
5. ~~**[AnimatedSticker] 處理期間 video 控制項未鎖定**~~ — ✅ 已修（`efd5faa`）：`VideoBoardPreview.tsx:90` `controls={!disabled}` + `pointer-events-none`。

## MEDIUM（2026-08-01 複查：以下三項仍未修，維持開放）

6. **[AiVideo] `src/pages/AiVideo/App.tsx:102-168`** — 輪詢無次數/時間上限，卡住的 job 會永遠每 6 秒打一次。加 30 分鐘上限後轉 failed。（未修）
7. **[AiVideo] `src/db.ts:74`** — `deleteAiVideoJob` 從未被呼叫；`aiVideoJobs` store 累積整支 MP4 無清理。每次存檔後修剪舊 job。（未修）
8. **[SpriteSheet] series archive** — `archivedSeries` 無筆數上限持續累加進 localStorage，建議留最近 10–20 筆。位置已隨拆檔移至 `useSpriteSheetGeneratorController.ts`。（未修）
9. **[AnimatedSticker] `compression.ts:74-82`** — 壓縮後 spread 保留舊 `hasTransparency`/`hasMotion` 未重算，合規檢查可能顯示過時狀態。
10. **[AnimatedSticker] 下載慣例** — 單張下載直接 `saveAs()`（App.tsx:225、MainImageMaker.tsx:110/241、TabImageMaker.tsx:71）未走 `useImageShare`；MainImageMaker.tsx:112、TabImageMaker.tsx:73 錯誤用本地紅框未走 `showToast`。
11. **[測試品質] `tests/unit/*/uiStyle.test.ts`（三個功能都有）** — 斷言原始碼字串內容而非行為，重構即假紅。之後改 render + 屬性斷言。

## LOW

- [AiVideo] `apiKeys.ts:17-35` Grok key 儲存邏輯重複實作而非擴充 `shared/geminiApiKey.ts` 的 `AiProvider` union。
- [AiVideo] `apiKeys.ts:41` Grok key 驗證接受 `sk-` 前綴（疑 OpenAI validator 殘留）。
- [AiVideo] `App.tsx:113-117` blob 預取失敗被靜默吞掉；輪詢 fetch 無 AbortController。
- [SpriteSheet] `SpriteSheetGeneratorTab.tsx:346` 區域變數遮蔽同名元件層級變數。
- [AnimatedSticker] `frameProcessing.ts`（505 行）混雜六種職責，建議拆 `gridGeometry`/`chromaKey`/`stabilization`/`resize`。
- [AnimatedSticker] `MainImageMaker.tsx:85-99` 同步迴圈跑最多 6 次 `UPNG.encode` 無 yield，幀數多時瞬間卡頓。

## 正面確認（不需動）

- `api/ai-video.ts` 安全性：套 `rejectBadOrigin`、model 寫死 server 端（比 allowlist 更強）、body 上限 4.2MB、key 只走 header 不進 URL/log、錯誤回應不透傳上游 payload、`requestId` 正則驗證後才插入 URL。
- `db.ts` 版本 1→2 migration 用 `contains()` guard，模式正確。
- AnimatedSticker i18n 104 個 key 雙語零缺漏、色票全合規。
- SpriteSheet caption 必做詞分配/衝突檢查/prompt 組裝無 off-by-one、無矛盾指令，實作符合 `docs/plans/2026-07-31` 計畫。

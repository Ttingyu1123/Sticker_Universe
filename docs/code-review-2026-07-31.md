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

## MEDIUM（#6–#8 於 2026-08-01 由 Claude 修復，閘門：typecheck 綠、i18n 過、Vitest 206/206）

6. ~~**[AiVideo] 輪詢無上限**~~ — ✅ 已修：`POLL_TIMEOUT_MS = 30 分鐘`，逾時將 job 轉 failed 並 toast（`aiVideo.errors.timeout`）。
7. ~~**[AiVideo] `aiVideoJobs` 無清理**~~ — ✅ 已修：`db.ts` 新增 `pruneAiVideoJobs()`（留最近 10 筆），AiVideo 頁掛載時執行。
8. ~~**[SpriteSheet] series archive 無上限**~~ — ✅ 已修：`series.ts` 新增 `MAX_SERIES_ARCHIVES = 20` + `appendStickerSeriesArchive()`（append 與 parse 兩端都 cap），附 3 個單元測試。
   - 順手修：`AiVideo/App.tsx` `providerOptions` 的 note/cost 硬編碼中文（review 時漏抓，與 CRITICAL #1 同類）→ 移入 `aiVideo.providers.*` i18n 鍵。
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

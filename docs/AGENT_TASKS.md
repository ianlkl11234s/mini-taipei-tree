# AGENT_TASKS — 任務看板（SSOT）

> 每張任務卡自帶驗收標準。接手的 agent：先讀 README → PLAN → DATA_CONTRACT，再做你的卡。
> 完成後回這裡打勾＋填交付物路徑。主持人（orchestrator）負責驗收。

## 進度總覽

- [x] T0 探索與規劃（三路盤點 + 本套文件 + pkl RSS 首份快照）— 2026-07-13
- [x] T1 三期資料管線（analytics repo）— 2026-07-13 完成並驗收（驗收數字表 14/14 全過）
- [x] T2 前端 scaffold：地圖 + 篩選（本 repo）— 2026-07-13 完成並驗收（build/dev/瀏覽器實測全過，已直接接三期真資料）
- [x] T3 infograph 統計區 + About 頁 — 2026-07-13 agent 完成；主持人驗收 **9 成過**（build ✅、stats 數字抽驗 ✅、瀏覽器渲染 ✅），剩 1 項待確認（見驗收紀錄「T3 未結項」）
- [ ] T4 Phase 2 動態層（修剪公告 weekly pipeline + 受保護樹木圖層）
- [ ] T5 部署（Dockerfile/nginx/Zeabur）＋上線驗收

---

## T1 三期資料管線 🔴 資料正確性最高優先

**工作 repo**：`/Users/migu/Desktop/資料庫/gen_ai_try/ichef_工作用/GIS/taipei-gis-analytics`
**產出規格**：完全依 `DATA_CONTRACT.md` §2-§3，陷阱表 §4 逐條遵守。

步驟：
1. 新增 `pipelines/urban_open_space/street_trees_taipei_3epoch/06_three_epoch_merge.py`
   - 讀三份快照（2022 XML 注意 `X/Y` 欄名 + Diameter×100），建 TreeID union 軌跡表
   - renumber_2224 重算：演算法照抄 `pipelines/urban_open_space/street_trees_taipei_diff/06_status_merge.py` 的 renumber 邏輯
   - TWD97→WGS84 用 `src/geo_crs.py`；跑 `./venv/bin/python3`
   - 輸出 `data/processed/urban_open_space/street_trees_taipei_3epoch/street_trees_taipei_3epoch_YYYYMMDD.geojson`
2. 新增 `07_export.py`：tippecanoe 配方照抄二期版 07_export.py（-r1 全 zoom）＋產全部 stats JSON（含 clusters.json，讀 spike_poc 的 clusters CSV）
3. manifest 用 `src/manifest_writer.py`（或 generate_manifests.py），更新 `docs/data-registry.yaml`、建 `docs/data-catalog/urban_open_space/street_trees_taipei_3epoch.md`（抄 street_trees_taipei_diff.md 格式）
4. 成品複製到 `mini-taipei-trees/public/data/`（pmtiles + stats/*.json）
5. 跑 `python3 .claude/skills/data-catalog-audit/audit.py --check-all-v2` 須 0 ERROR
6. 更新 `docs/topic-research/street_tree_removal/_status.md`：Phase 1 勾「三時點」項 + 腳本清單加列

**驗收**（主持人執行）：
- DATA_CONTRACT §2 驗收數字表逐項相符（union 105,675、traj 分布、6,189/13,612/7,494/4,029/88,004、dbh 中位 ≈24、renumber 447）
- `pmtiles show` 確認 source-layer 名與屬性欄齊全
- stats JSON 能被 `python3 -m json.tool` 解析且 overview 數字與 PMTiles 一致

## T2 前端 scaffold：地圖 + 篩選

**工作 repo**：本 repo（`/Users/migu/Desktop/資料庫/gen_ai_try/ichef_工作用/GIS/mini-taipei-trees`）
**參考程式碼**（可抄檔案的絕對路徑清單在 `RESEARCH_NOTES.md` §2）。

規格：
- Vite + React 18 + TS + pnpm；mapbox-gl ^3 + pmtiles + mapbox-pmtiles（⚠️ 必須 import `mapbox-pmtiles/dist/mapbox-pmtiles.js`）
- 地圖：dark 底圖（mapbox dark-v11），台北市視角起始（lng 121.54, lat 25.05, zoom 12）
- PMTiles 圖層：circle layer 三色分染（persisted `#2e7d32` / disappeared `#e53935` / appeared `#9ccc65`，沿用 pulse 已驗證配色）；renumber 點 opacity 降至 0.35；circle-radius 隨 zoom 內插
- 篩選 UI（見 PLAN.md §2 地圖探索區）：時段切換 / 狀態 toggle / 樹種 chip+搜尋 / 胸徑 range / 只看道路開關 / 行政區——全部組合成 `setFilter` expression
- 點擊 popup：樹種、胸徑、樹高、路段、狀態（時段語境）、調查日期、重編號警語
- 資料源 adapter：`src/lib/dataSource.ts` 集中定義 source url + source-layer + 欄位名。**先接既有二期 PMTiles**（從 `taipei-gis-analytics/data/processed/urban_open_space/street_trees_taipei_diff/street_trees_taipei_diff.pmtiles` 複製到 `public/data/`；欄位對照：status→status_2426、TreeType→species…），T1 完成後只改 adapter 一處換三期源
- design tokens 抄 mini-taiwan-info `globals.css`（綠 accent），UI 亮暗雙主題；RWD：手機篩選面板收合為 bottom sheet
- token：讀參考 repo `.env` 的 `VITE_MAPBOX_TOKEN` 複製到本 repo `.env`（gitignore），另留 `.env.example`
- 載入 frontend-design 與 dataviz skill 再動手；`pnpm build` 必須過

**驗收**：`pnpm dev` 起得來、地圖顯示三色樹點、每個篩選器實際改變地圖、popup 正確、`pnpm build` 無錯、手機寬度可用。

## T3 Infograph 統計區 + About

- 依賴 `public/data/stats/*.json`（T1）；T1 未完成前可先用上游現成數字建 mock（`ANALYTICS/docs/topic-research/street_tree_removal/spike_poc/descriptive_stats.json` + `species_removal_rate.csv` + `species_net_change.csv`）
- 圖表六張見 PLAN.md §2 infograph 區；手刻 SVG（抄 info 的 charts 元件當基底）
- 每張圖附一句人話 insight（從 RESEARCH_NOTES §1-E 的結論取材）
- About 頁內容 = PLAN.md §7 風險聲明展開 + 資料來源連結
- 「整排消失熱點」卡片點擊 → 地圖 flyTo（與 T2 的 map ref 對接）

**驗收**：六區塊皆以真實/mock 資料渲染、數字與 stats JSON 一致、insight 文案無過度宣稱（不得寫「被砍」，一律「從清冊消失」）。

## T4 Phase 2 動態層（等 T1-T3 驗收後再啟動）

1. 修剪公告 weekly pipeline（analytics repo）：RSS `https://pkl.gov.taipei/OpenData.aspx?SN=AF467FBC2E237D95`（description 內嵌 HTML table，9 欄）→ parse → 路段名 join 行道樹 `region` → 輸出「本週預定修剪路段」JSON；首份快照已存 `ANALYTICS/data/raw/urban_open_space/pruning_announcements/pruning_rss_2026-07-13.xml`；**每週日晚更新、無歷史檔**，需排程（cron 或半動態機制，跟主持人確認）
2. 受保護樹木圖層：data.taipei dataset 121274（3,874 棵含經緯度）→ 靜態 GeoJSON 小圖層
3. 樹穴 TaipeiTreeHole.csv（2,254 筆）缺株分析（選做）

## T5 部署

- Dockerfile + nginx.conf 抄 `mini-taiwan-info/frontend/`；Zeabur 上線；用戶拍板後才部署（鐵則）

---

## 主持人驗收紀錄

| 任務 | 驗收日 | 結果 | 備註 |
|------|--------|------|------|
| T0 | 2026-07-13 | ✅ | 本套文件 |
| T1 | 2026-07-13 | ✅ | DATA_CONTRACT §2 驗收表逐項相符（union 105,675 / traj 分布 / dbh 中位 24.0 / renumber 447）；pmtiles 兩側 md5 一致；audit 0 findings（repo 既有技術債與本案無關）。備註：species_count=292 定義為 2026 快照樹種數（三期 union 為 328）；契約 §4.5「51 筆 Diameter 空值」實測為 0（契約已過時，無影響）；`_trees_common.py` 共用模組屬合理抽取。**analytics 端變更未 commit，待用戶拍板。** |
| T2 | 2026-07-13 | ✅ | 主持人實測：`pnpm build` 過、dev server 200、SwiftShader 瀏覽器實看——地圖三色樹點渲染（畫面計數 76,728 棵）、時段切 2022→2024 計數正確變 6,189/13,612、Hero KPI 與免責聲明到位、無 WebGL 時降級提示正常。**關鍵坑已記錄：mapbox-gl 必 pin 3.25.0**（3.26 會讓 mapbox-pmtiles 1.0.56 掛掉、整圖 0 features）；status 欄含 `absent` 必須始終過濾。三期軌跡（traj）視圖 disabled「深化中」屬合理範圍裁切，列後續。 |
| T3 | 2026-07-13 | ✅（1 項未結） | 主持人已驗：`pnpm build` 過；stats 數字抽驗與 agent 回報一致（消失率 top3 = 亞力山大椰子 71.7／櫸 35.2／鐵刀木 27.6；淨流失榕樹 −763；淨增榜首洋紅風鈴木 +93——PLAN 裡的「水柳 +213」因基數<50 被 species.json 併入其他，agent 採 JSON 真值正確）；#stats 區瀏覽器渲染截圖 OK。**T3 未結項（接手第一件事）**：clusters.json 全量最大叢集是「線形公園 428 棵（北投·垂榕）」，但 T3 回報熱點卡片榜首為「松仁路 304」→ 推測卡片有排除公園類叢集（合理設計），**需開瀏覽器確認卡片實際排序與是否有註明「已排除公園」**；若無排除邏輯則是 bug 要修。另 agent 自報：手機單欄僅原始碼確認未截圖佐證。 |

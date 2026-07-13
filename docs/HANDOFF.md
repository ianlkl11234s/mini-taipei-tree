# HANDOFF — 交接紀錄（2026-07-13 17:15，主持人 session 中止於 limit）

> 給下一個 session／帳號的接手指南。**接手順序：本檔 → AGENT_TASKS.md（看板 SSOT）→ 其他文件按需。**

## 1. 一句話現況

「台北行道樹探索」網站 MVP **已完成 T0-T3**（規劃/資料/地圖/infograph+About），本機可跑、
build 通過、主持人已驗收（T3 剩 1 小項未結，見 §4）。**兩個 repo 都尚未 git commit**（等用戶拍板）。

## 2. 完成了什麼（全部驗收紀錄在 AGENT_TASKS.md 表格）

| 件 | 內容 | 位置 |
|---|------|------|
| 規劃文件 5 份 | README / PLAN / DATA_CONTRACT / AGENT_TASKS / RESEARCH_NOTES | `mini-taipei-trees/docs/` |
| T1 資料管線 | `street_trees_taipei_3epoch`：三期軌跡 105,675 點 GeoJSON+PMTiles + 6 份 stats JSON；manifest/catalog/registry/audit/_status.md 全做完；驗收 14/14 | `taipei-gis-analytics/pipelines/urban_open_space/street_trees_taipei_3epoch/` + `data/processed/.../street_trees_taipei_3epoch/` |
| T2 前端 | Vite+React18+TS+mapbox-gl(**pin 3.25.0**)+mapbox-pmtiles；地圖三色點+時段/狀態/樹種/胸徑/只看道路/行政區篩選+popup；亮暗雙主題；WebGL fallback | `mini-taipei-trees/src/` |
| T3 infograph | 六區塊（waterfall/消失率排行/淨變化 diverging/胸徑樹高 bins/行政區/熱點卡片 flyTo）+ About（4 點誠實聲明+松仁路 S2 故事+來源）+ Hero KPI 接 overview.json | `src/components/{Infograph,About,charts}.tsx`、`src/lib/stats.ts` |
| 外部資料搶救 | pkl 公園處修剪公告 RSS 首份週快照（**此源每週日覆蓋、無歷史檔**） | `taipei-gis-analytics/data/raw/urban_open_space/pruning_announcements/pruning_rss_2026-07-13.xml` |
| 生態記帳 | journal 2026-07.md 已 append；memory `project_mini_taipei_trees.md` 已建 | `.gis-agent-system/journal/`、`~/.claude/.../memory/` |

## 3. 怎麼跑起來

```bash
cd mini-taipei-trees && pnpm install && pnpm dev   # .env 已有 VITE_MAPBOX_TOKEN（gitignored）
# 交接時 dev server 可能仍掛在 http://localhost:5184（T2 agent 背景啟的），掛了就重起
# agent-browser 驗證地圖必加軟體 WebGL：
#   agent-browser --args "--use-gl=angle,--use-angle=swiftshader,--enable-unsafe-swiftshader" open http://localhost:5184
```

## 4. 接手第一批事（優先序）

1. **T3 唯一未結項**：熱點卡片榜首 = 松仁路 304，但 clusters.json 全量最大是「線形公園 428」→
   開瀏覽器確認卡片是否有「排除公園」邏輯與註記（有＝合格收尾；無＝bug 修掉），順手補手機 390px 寬度截圖驗證。
2. **請用戶拍板 git commit**（兩邊都是乾淨新增，無刪改他人檔案）：
   - `taipei-gis-analytics`：新 pipeline 3 支腳本 + processed 成品 + catalog/registry/_status.md（scope 建議 `feat(urban_open_space):`）。⚠️ repo 有**本 session 之前就存在**的髒檔（`.claude/skills/{relation-explorer,wrap-up}/SKILL.md`、`pipelines/open_data_monitor/db_sync.py` 等），**不屬本案，勿一起 commit**
   - `mini-taipei-trees`：整個 repo 首 commit（`public/data/*.pmtiles` ~29MB 是否入版控由用戶決定；D6 設計是要進 Docker image 的）
3. **T4**（Phase 2，見 AGENT_TASKS 任務卡）：修剪公告 weekly pipeline（RSS endpoint 在卡上）+ 受保護樹木 121274 圖層。**修剪公告每週日晚更新，下次抓取 deadline = 2026-07-20 前**，否則斷一週。
4. **T5** 部署（Zeabur，Dockerfile 抄 mini-taiwan-info），**部署前須用戶拍板**（鐵則）。
5. 選做 backlog：三期軌跡（traj）地圖視圖（T2 刻意 disabled「深化中」）；species_list.json 移入 T1 管線產出；2022→2024 段 renumber 疑似率 17.4% 的圖面警示強化。

## 5. 不可踩的坑（違者白做，細節在 DATA_CONTRACT §4 + AGENT_TASKS 驗收紀錄）

- **mapbox-gl 鎖 3.25.0 不可升**（3.26 讓 mapbox-pmtiles 1.0.56 整圖 0 features）
- mapbox-pmtiles 必須 import `mapbox-pmtiles/dist/mapbox-pmtiles.js`
- 三期 status 欄含 `absent`，任何 filter 都要先排除
- 2022 快照 Diameter 單位是公尺（管線已 ×100，重跑時別再改）
- 換資料源只動 `src/lib/dataSource.ts` 一處
- 文案鐵則：「從清冊消失」不寫「被砍」

## 6. 主要參照

- 看板 SSOT：`docs/AGENT_TASKS.md`（進度勾選 + 逐任務驗收紀錄表）
- 資料契約：`docs/DATA_CONTRACT.md`；規劃：`docs/PLAN.md`；調查底稿：`docs/RESEARCH_NOTES.md`
- 上游主題入口：`taipei-gis-analytics/docs/topic-research/street_tree_removal/_status.md`（T1 已同步更新）
- memory：`project_mini_taipei_trees.md`（跨 session 索引已掛 MEMORY.md）

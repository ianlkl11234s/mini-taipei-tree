# mini-taipei-trees — 台北行道樹探索

> 面向民眾的單一主題資料視覺化網站：台北市行道樹在 **2022-10 / 2024-11 / 2026-07** 三個時點的
> **新增（appeared）／維持（persisted）／消失（disappeared）** 狀態地圖 + 統計 infograph。
> 讓任何人都能探索：哪裡的樹消失了、哪裡種了新樹、什麼樹種／什麼胸徑的樹變動最大。

## 專案定位

- **只做一件事**：行道樹狀態探索。不做通報（那是 `../tree-report/`）、不做多主題儀錶板（那是 `../mini-taiwan-info/`）。
- 資料上游：`../taipei-gis-analytics/` 的 `street_tree_removal` 主題研究（Wayback 三時點快照 + diff pipeline）。
- 生態定位：GIS 生態系「應用層」的獨立 app，與 mini-taiwan-* 系列平行。

## 現在的狀態（給接手的 agent / 人）

**先讀 `docs/AGENT_TASKS.md`**——那是任務看板與驗收標準 SSOT。其餘文件：

| 文件 | 內容 |
|------|------|
| `docs/PLAN.md` | 網站內容規劃、資訊架構、Phase 0-3、架構決策與理由 |
| `docs/DATA_CONTRACT.md` | 三時點資料 schema、stats JSON 格式、**所有資料陷阱**（單位差 100 倍等） |
| `docs/AGENT_TASKS.md` | T1-T4 任務卡（含驗收數字）+ 進度勾選 |
| `docs/RESEARCH_NOTES.md` | 探索期三路調查摘要（資料資產／參考 repo 可抄檔案／外部資料源） |

## 技術棧（拍板，理由見 PLAN.md §決策）

Vite + React 18 + TypeScript + mapbox-gl 3.x + mapbox-pmtiles（PMTiles 向量磚）
+ 手刻 SVG 圖表（抄 mini-taiwan-info）+ design tokens CSS（無 tailwind）+ Zeabur Docker 部署。

## 快速啟動（scaffold 完成後）

```bash
pnpm install
cp .env.example .env   # 填 VITE_MAPBOX_TOKEN
pnpm dev
```

## 關聯 repo

| repo | 關係 |
|------|------|
| `../taipei-gis-analytics/` | 資料上游；pipeline `pipelines/urban_open_space/street_trees_taipei_*`；主題入口 `docs/topic-research/street_tree_removal/_status.md` |
| `../mini-taiwan-info/` | UI/圖表/部署模板來源 |
| `../mini-taiwan-project-new-taipei/` | PMTiles 地圖程式碼來源 |
| `../mini-taiwan-pulse/` | 既有 street_trees_taipei_diff 圖層已上線處（PR #65），本站是其深化獨立版 |
| `../tree-report/` | 姊妹方向（民眾通報 VGI POC），未來可互連 |

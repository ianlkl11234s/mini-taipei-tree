# PLAN — 網站內容規劃與架構決策

> 撰於 2026-07-13，基於三路探索 agent 實查（摘要見 RESEARCH_NOTES.md）。
> 本檔是「要做什麼、為什麼這樣做」的 SSOT；「怎麼做、驗收什麼」在 AGENT_TASKS.md。

## 1. 一句話願景

民眾打開網站 30 秒內看懂「台北的行道樹這四年發生了什麼」，
再花 5 分鐘探索自己家門口／關心的樹種／關心的粗細等級發生了什麼。

## 2. 資訊架構（單頁式 + 錨點區塊）

```
┌─ Hero 區 ────────────────────────────────────────────┐
│ 標題 + 三個大 KPI（現有棵數 92,033 / 2024→2026 消失 7,494 / 新增 4,029）│
│ 一句方法論免責（「消失 ≠ 一定被砍」連到 About）                    │
├─ 地圖探索區（全螢幕高度，網站主體）───────────────────────┤
│ • 時段切換：2022→2024 ／ 2024→2026（預設）／ 三期軌跡        │
│ • 狀態 toggle：消失🔴 / 新增🟡綠 / 維持🟢（可獨立開關）          │
│ • 樹種篩選：top 20 快選 chip + 全 292 種搜尋下拉               │
│ • 胸徑篩選：range slider（cm，分級距 <10/10-20/20-40/40-60/>60）│
│ • 「只看道路行道樹」開關（濾掉公園/綠地/廣場，佔 11.4%）           │
│ • 行政區篩選（12 區）                                       │
│ • 點擊樹 → popup：樹種/胸徑/樹高/路段/狀態軌跡/調查日期            │
│ • 圖例 + 「疑似重編號」半透明說明                               │
├─ Infograph 統計區（捲動進入）─────────────────────────────┤
│ ① 三時點總量變化（88,075 → 95,498 → 92,033）waterfall/階梯   │
│ ② 樹種消失率排行（基數≥100；亞力山大椰子 71.7% 領頭）+ 淨變化雙向條 │
│ ③ 「種什麼取代什麼」：淨流失 top（榕樹 −764）vs 淨增 top（水柳 +213）│
│ ④ 胸徑/樹高分級距消失率（打破「越大越容易被砍」直覺：樹高單調遞減）    │
│ ⑤ 行政區比較（12 區消失率/淨變化）                             │
│ ⑥ 整排消失熱點 top N 卡片（叢集，點擊飛到地圖位置）                │
├─ About / 方法論區 ────────────────────────────────────┤
│ 資料來源、三時點怎麼來（Wayback）、消失≠砍除（重編號 caveat）、       │
│ 單位/資料品質備註、S2 衛星互證故事（松仁路案例）、原始碼/授權          │
└──────────────────────────────────────────────────────┘
```

Phase 2+ 追加區塊（見 §5）：本週修剪公告圖層、受保護樹木圖層、樹穴缺株。

## 3. 架構決策記錄

| # | 決策 | 選擇 | 理由 / 放棄的替代方案 |
|---|------|------|--------------------|
| D1 | 地圖庫 | **mapbox-gl 3.x + mapbox-pmtiles** | 兩個參考 repo 皆用且有踩雷紀錄可抄（import dist/ 陷阱、style.load 重註冊）；token 已存在。替代：maplibre-gl + pmtiles protocol 免 token，但無 in-house 現成碼——若日後流量/計費成疑再換（改動面集中在 map 初始化層） |
| D2 | 資料承載 | **單一 PMTiles（三期軌跡合併層，~105,675 點）+ 靜態 stats JSON** | 一個檔案切三種時段視圖（paint/filter expression 切換），免多檔切換閃爍；統計預算好放 public/data/，全站零後端 |
| D3 | 篩選實作 | client-side `setFilter` expression 疊加（時段×狀態×樹種×胸徑×公園×行政區） | 10 萬點向量磚屬性過濾在 client 毫無壓力；不需 server |
| D4 | 圖表 | 手刻 SVG（抄 mini-taiwan-info 的 Donut/TrendChart + 自寫 BarChart） | 套件（echarts）對 6 張靜態圖過重；info 的手刻風格與 design tokens 一致 |
| D5 | 樣式 | info 的 design tokens 單檔 CSS（綠色系 accent），**地圖深色底 + UI 亮暗雙主題** | 深色底圖 + 三色樹點是 pulse 已驗證的視覺（用戶截圖即此風格）；UI 面板沿用 info tokens 支援 light/dark |
| D6 | 部署 | Zeabur Docker（node build → nginx），PMTiles 直接放 `public/data/`（~15-20 MB） | 與 info 部署鏈相同；量級不需 S3/CDN 分離，之後要搬 S3 只改一個 URL |
| D7 | 資料生產位置 | pipeline 留在 `taipei-gis-analytics`（新 dataset `street_trees_taipei_3epoch`），本 repo 只放成品副本 | 遵守生態系 SSOT：資料骨架/manifest/catalog 都在 analytics；本 repo 是消費者 |
| D8 | 範圍 | 只做台北行道樹 | 跨縣市逐棵資料僅台中（2020 舊檔）；受保護樹木跨縣市比較留 Phase 3 觀察 |

## 4. 資料流

```
taipei-gis-analytics（上游）
  pipelines/urban_open_space/street_trees_taipei_3epoch/
    06b_three_epoch_merge.py → 三期軌跡 GeoJSON（union ~105,675 點）
    07b_export.py            → PMTiles（tippecanoe -r1 z5-14）+ stats/*.json
  data/processed/urban_open_space/street_trees_taipei_3epoch/ ＋ _manifest.json
        │ 複製成品
        ▼
mini-taipei-trees/public/data/
  street_trees_taipei_3epoch.pmtiles
  stats/{overview,species,dbh_bins,height_bins,districts,clusters}.json
```

過渡期：scaffold 先吃既有 `street_trees_taipei_diff.pmtiles`（2024↔2026 二期版，
`taipei-gis-analytics/data/processed/urban_open_space/street_trees_taipei_diff/`），
以 adapter 對齊 DATA_CONTRACT 欄位，等 T1 產出三期版後一鍵換源。

## 5. Phases

| Phase | 內容 | 狀態 |
|-------|------|------|
| **0 探索與規劃** | 三路盤點 + 本套文件 + pkl RSS 首份快照 | ✅ 2026-07-13 |
| **1 MVP** | T1 三期資料管線 + T2 前端 scaffold（地圖+篩選）+ T3 infograph 區 + About | 🔵 進行中 |
| **2 動態層** | 公園處每週修剪公告（RSS snapshot pipeline + 路段 join 圖層「本週預定修剪」）；受保護樹木 3,874 棵圖層；樹穴 TaipeiTreeHole 缺株分析 | ⬜ |
| **3 深化** | S2 衛星互證敘事頁（松仁路斷崖案例）；跨縣市珍貴老樹比較；月度快照自動更新（接 analytics 半動態機制） | ⬜ |

## 6. 差異化（vs 既有產品）

- [taipei-trees.org](https://taipei-trees.org/)（第三方查詢站）：只有「現在」的樹。**我們的核心差異＝時間軸**（三時點 diff + 未來月度累積）與「消失去哪了」的敘事。
- mini-taiwan-pulse 的 street_trees_taipei_diff 圖層：只有地圖三色點，無樹種/胸徑探索、無統計敘事。本站是給民眾的完整版。

## 7. 風險與誠實聲明（About 頁必寫）

1. **消失 ≠ 砍除**：TreeID 重編號風險（2022→2024 段 17.4% 疑似、2024→2026 段 2.9%）；地圖以半透明標示疑似重編號點。
2. 2022 快照來自 Wayback Machine 存檔，非官方版本化資料。
3. 公園處資料無逐筆異動時間（UpdDate 是批次戳），時點間變化無法定位到日。
4. 資料品質：樹高欄有髒值（max 2023m）、2022 胸徑單位與後期差 100 倍——管線已清理，方法論頁要交代。

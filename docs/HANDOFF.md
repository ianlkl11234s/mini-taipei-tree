# HANDOFF — 交接紀錄（2026-07-14）

> 給下一個 session 的接手指南。

## 1. 一句話現況

台北行道樹探索網站已 **production ready 並部署上線**。GitHub repo 已公開，Zeabur 部署運行中。

## 2. 線上 / Repo

- **線上**：https://mini-tree.itsmigu.com
- **GitHub**：git@github.com:ianlkl11234s/mini-taipei-tree.git（main 分支）
- **Zeabur**：Project `project-6a54ecc35bbdf534d2cf7dc0`、Service `6a54f072b4bb381efe5436f1`

## 3. 完成了什麼

| 項目 | 內容 |
|------|------|
| T0-T3 MVP | 三期清冊比對地圖 + 篩選面板 + 統計 infograph + About |
| 用詞中性化 | 全站文案改為事實陳述（離冊/在冊） |
| 地圖多視圖 | 點位 / 熱力圖 / 禁航區疊圖（三選一切換） |
| 點位大小拉桿 | 0.3x–2.5x 可調 |
| 完整樹種列表 | 「全部 303 種」chip → modal |
| 圖表/表格切換 | 樹種 + 行政區都有 pill 切換，表格可排序、全量展開 |
| 指標 pill | 圖表可選離冊率/離冊數/新增數/在冊數/淨變化 |
| Section 03 進階分析 | H3 網格離冊率分布（res-9, 1,182 格）+ 透明度控制 + 方法論說明 |
| 禁航區資料 | 台北市 192 筆禁飛區 GeoJSON（從 mini-taiwan-pulse 提取） |
| 部署 | Dockerfile + nginx.conf + Zeabur 上線（含 gzip off PMTiles 修復） |
| Mapbox token | 已換為 URL-restricted 的新 token |

## 4. 怎麼跑

```bash
cd mini-taipei-trees && pnpm install && pnpm dev
# .env 已有 VITE_MAPBOX_TOKEN（gitignored）
```

## 5. 不可踩的坑

- **mapbox-gl 鎖 3.25.0**（3.26 讓 mapbox-pmtiles 1.0.56 整圖 0 features）
- mapbox-pmtiles 必須 import `mapbox-pmtiles/dist/mapbox-pmtiles.js`
- nginx 的 PMTiles location 必須 `gzip off`（否則 Range request 回 200 而非 206，樹點無法載入）
- 三期 status 欄含 `absent`，任何 filter 都要先排除
- 文案鐵則：「從清冊消失」不寫「被砍」

## 6. Backlog

- 修剪公告 weekly pipeline（RSS 每週日覆蓋，需排程抓取）
- 三期軌跡（traj）地圖視圖（目前 disabled）
- renumber 疑似率 17.4% 圖面警示強化
- H3 改為方格（square grid）讓視覺更整齊
- 底圖換 maplibre-gl + OSM（完全免費方案）
- species_list.json 移入 T1 管線
- 受保護樹木圖層（data.taipei 121274）

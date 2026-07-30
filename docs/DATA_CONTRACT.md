# DATA_CONTRACT — 四時點行道樹資料契約

> 前端（T2/T3）與資料管線（T1）之間的唯一契約。改欄位必先改這裡。
> 所有上游檔案路徑以 `ANALYTICS = /Users/migu/Desktop/資料庫/gen_ai_try/ichef_工作用/GIS/taipei-gis-analytics` 為根。
> ⚠️ 2026-07-29 由三時點擴充為四時點：舊 `data-staged/` 原始檔目錄已刪除，原始快照新家見下表；
> 既有兩段（2224/2426）結果 bit-identical 保留，新增第四時點與 0307 段。

## 1. 上游原始資料（實查驗證 2026-07-29）

| 時點 | key | 檔案 | 筆數 | 座標欄 | 胸徑單位 |
|------|-----|------|------|--------|---------|
| 2022-10-15 | `2022` | `ANALYTICS/data/raw/urban_open_space/street_trees_taipei_diff/taipei_tree_20221015.xml` | 88,075 | `X`/`Y`（EPSG:3826） | **公尺** ⚠️ |
| 2024-11-21 | `2024` | `.../taipei_tree_20241121.json` | 95,498 | `TWD97X`/`TWD97Y`（EPSG:3826） | 公分 |
| 2026-07-12 | `2603` | `.../taipei_tree_20260712.json` | 92,033 | `TWD97X`/`TWD97Y`（EPSG:3826） | 公分 |
| 2026-07-29 | `2607` | `.../taipei_tree_20260729.json` | 91,369 | `TWD97X`/`TWD97Y`（EPSG:3826） | 公分 |

⚠️ **匯出日 ≠ 內容時點**：key=`2603` 的檔案 `taipei_tree_20260712.json` 是 **2026-07-12 匯出**，
但內容時點依 data.taipei 當時公告約為 **2026-03**；該檔 `UpdDate` 全欄 = 2026-07-12 匯出時刻，
不可當內容時間使用。key 命名故意用「26」+ 月份碼（`03`/`07`）而非匯出年月，避免與內容時點混淆。

共同欄位（11 欄，100% 覆蓋）：`TreeID, Dist, Region, RegionRemark, TreeType, Diameter, TreeHeight, SurveyDate, {座標2欄}, UpdDate`。

既有二期成品（`mini-taiwan-pulse` 使用，非本前端主力）：
`ANALYTICS/data/processed/urban_open_space/street_trees_taipei_diff/street_trees_taipei_diff.pmtiles`
（99,527 點，source-layer 名稱 = `street_trees_taipei_diff`，properties: TreeID/TreeType/Dist/Region/Diameter/TreeHeight/SurveyDate/status[persisted|disappeared|appeared]/renumber_suspect）。

既有三期成品（`street_trees_taipei_3epoch`，105,675 點，已被四期取代，保留為歷史記錄）：
`ANALYTICS/data/processed/urban_open_space/street_trees_taipei_3epoch/street_trees_taipei_3epoch.pmtiles`。

## 2. 成品一：四期軌跡 PMTiles

- dataset_id：`street_trees_taipei_4epoch`
- 落地：`ANALYTICS/data/processed/urban_open_space/street_trees_taipei_4epoch/`（GeoJSON + PMTiles + _manifest.json）
- 前端副本：`mini-taipei-trees/public/data/street_trees_taipei_4epoch.pmtiles`
- tippecanoe 配方沿用三期版：`-r1 --no-feature-limit --no-tile-size-limit -z14 -Z5`（拉遠不抽稀）
- source-layer 名稱 = `street_trees_taipei_4epoch`
- 幾何：Point EPSG:4326；座標取「最後出現時點」的位置
- **預設 segment 改為 `0307`**（最新一段，2026-03→2026-07）；`2224`/`2426` 兩段保留供歷史切換

### feature properties（前端依此寫 expression，欄名全小寫，共 15 欄）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `tree_id` | string | TreeID |
| `traj` | string | 四期出現軌跡，4 碼 `{2022}{2024}{2603}{2607}`，1=在冊 0=不在 |
| `status_2224` | string | `appeared` / `persisted` / `disappeared` / `absent`（該段兩期皆不在） |
| `status_2426` | string | 同上值域 |
| `status_0307` | string | 同上值域（2603→2607 段，即 2026-03→2026-07）|
| `species` | string | TreeType，取最後出現時點 |
| `dist` | string | 行政區 |
| `region` | string | 路段/公園名 |
| `is_park` | 0/1 | `region` 匹配 regex `公園|綠地|廣場` → 1（佔 baseline 約 11.4%） |
| `dbh_cm` | number | 胸徑（公分）。**2022-only 樹之原值為公尺，管線須 ×100** |
| `height_m` | number\|null | 樹高（m）；>60 視為髒值設 null（上游 max 2023 是年份誤植） |
| `survey_date` | string | 最後出現時點的 SurveyDate（YYYY-MM-DD，截掉時間） |
| `renumber_2224` | 0/1 | 2022→2024 段疑似重編號（演算法沿用 06_status_merge.py） |
| `renumber_2426` | 0/1 | 2024→2603 段疑似重編號（既有欄位，數值不變） |
| `renumber_0307` | 0/1 | 2603→2607 段疑似重編號（新增） |

### `traj` 值域（實測，2026-07-29 用 `python3 Counter` 對 105,700 features 實算，共 14 種）

| traj | 筆數 | 備註 |
|------|------|------|
| `1111` | 75,449 | 四期皆在冊 |
| `0111` | 11,895 | 2022 未在冊，2024 起持續在冊 |
| `1000` | 6,146 | 僅 2022 在冊（2022→2024 消失）|
| `1100` | 5,892 | 2022/2024 在冊，2603 起消失 |
| `0011` | 3,954 | 2603 起才出現 |
| `0100` | 1,599 | 僅 2024 在冊 |
| `1110` | 543 | 2022-2603 在冊，2607 消失（0307 段消失主力）|
| `0110` | 117 | 2024-2603 在冊，2607 消失 |
| `1011` | 41 | 2022 在冊、2024 消失、2603 起重現（沿用三期 `101`，歸入 2024→2603 appeared）|
| `0010` | 34 | 僅 2603 在冊，2607 消失 |
| `0001` | 25 | 僅 2607 在冊（四期 union 新增的 25 棵首次出現）|
| `1101` | 2 | 2022/2024/2607 在冊、2603 缺 |
| `1001` | 2 | 2022/2607 在冊、2024/2603 缺 |
| `0101` | 1 | 2024/2607 在冊、2022/2603 缺 |

### 驗收數字（T1 必須逐項核對，出處：`06_three_epoch_merge.py`/`07_export.py` 與 2026-07-29 實測）

| 檢查 | 期望值 |
|------|-------|
| 總 features（四期 TreeID union） | **105,700**（= 舊三期 105,675 + 25 棵首次出現）|
| status_2224 分布 | persisted 81,886／appeared 13,612／disappeared 6,189／absent 4,013 |
| status_2426 分布 | persisted 88,004／appeared 4,029／disappeared 7,494／absent 6,173 |
| status_0307 分布 | persisted 91,339／appeared 30／disappeared 694（行道樹 679／公園樹 15）／absent 13,637 |
| `dbh_cm` 全表中位數 | ≈ 24（若跑出 ≈0.24 代表 2022 單位沒轉）|
| renumber_2224=1 | 2,140 點 |
| renumber_2426=1 | 447 點（消失側 221 + 新增側 226，與三期/二期一致，**不可回歸**）|
| renumber_0307=1 | 10 點（消失側 5 + 新增側 5）|
| 0307 段 removal_rate | 0.75%（694/92,033）|
| 既有段 bit-identical | `traj` 前三碼收合分佈、`status_2224`/`status_2426`/`renumber_2224`/`renumber_2426` 須與三期成品完全一致 |

## 3. 成品二：stats JSON（infograph 餵料）

落地：`mini-taipei-trees/public/data/stats/`（管線同時在 analytics processed 目錄留副本）。
所有「消失率」皆以該段 baseline 期總數為分母，並提供 `all`（全部）與 `street`（排除 is_park）兩組。

### `overview.json`（四期擴充後：`epochs` 4 筆、`segments` 3 筆）
```jsonc
{
  "epochs": [
    {"key": "2022", "date": "2022-10", "total": 88075, "total_street": 74471},
    {"key": "2024", "date": "2024-11", "total": 95498, "total_street": 84612},
    {"key": "2603", "date": "2026-03", "total": 92033, "total_street": 81699},
    {"key": "2607", "date": "2026-07", "total": 91369, "total_street": 81049}
  ],
  "segments": [
    {"key": "2224", "base": 88075, "disappeared": 6189, "appeared": 13612, "persisted": 81886, "net": 7423,
     "renumber_suspect": 1076, "removal_rate": 0.0703, "removal_rate_norenumber": 0.0581, "..._street": "同組排除公園版"},
    {"key": "2426", "base": 95498, "disappeared": 7494, "appeared": 4029, "persisted": 88004, "net": -3465,
     "renumber_suspect": 221, "removal_rate": 0.0785, "removal_rate_norenumber": 0.0762, "...": "..."},
    {"key": "0307", "base": 92033, "disappeared": 694, "appeared": 30, "persisted": 91339, "net": -664,
     "renumber_suspect": 5, "removal_rate": 0.0075, "removal_rate_norenumber": 0.0075, "...": "..."}
  ],
  "species_count": 292,
  "generated_at": "ISO8601"
}
```
⚠️ `key="2603"` 對應「2026-07-12 匯出、內容時點約 2026-03」，`date` 欄故意寫 `2026-03` 而非匯出日；
`key="2607"` 為 2026-07-29 現行快照。`segments` 第三筆 `key="0307"` 即 2603→2607 段。

### `species.json`
每段每樹種一列（樹種取「基數≥50 的全部」+ 其餘併 `其他`）；`segments` 現含 `2224`/`2426`/`0307` 三段：
```jsonc
{"segments": {
  "2426": [{"species": "榕樹", "base": 11548, "disappeared": 947, "appeared": 183, "net": -764,
   "removal_rate": 0.082, "base_street": ..., "removal_rate_street": ...}, ...],
  "2224": [ ... ],
  "0307": [{"species": "榕樹", "base": 10784, "disappeared": 92, "appeared": 0, "net": -92,
   "removal_rate": 0.0085, "base_street": 9827, "removal_rate_street": 0.0093}, ...]
 },
 "epoch_top20": [{"species": "榕樹", "count_2026": 10691}, ...]}
```
⚠️ **`epoch_top20` 欄位名沿用舊鍵 `count_2026`**（未隨四期擴充改名），但實際數值已是**現行（2607）**
快照統計，前端讀取時不要被鍵名誤導成 2026 舊終點。

### `dbh_bins.json` / `height_bins.json`
分級距沿用既有分析：胸徑 `<10 / 10-20 / 20-40 / 40-60 / >60`（cm）、
樹高 `<5 / 5-10 / 10-15 / 15-20 / >20`（m）。每段（`2224`/`2426`/`0307`）每 bin：
`{bin, base, disappeared, appeared, removal_rate, removal_rate_street}`。

### `districts.json`
12 行政區 × 每段（`2224`/`2426`/`0307`）：`{dist, base, disappeared, appeared, net, removal_rate, removal_rate_street}`
+ 各區總數（頂層鍵沿用舊名 `total_2026`，同 `epoch_top20` 一樣，實際數值已是現行 2607 快照）。

### `clusters.json`
整排消失熱點（size≥10 的叢集），現含三段：`[{segment, cluster_id, road, dist, size, centroid: [lng,lat], species_top}]`，
依 size 降冪；`0307` 段新增 31 群，代表案例：環河北路三段／士林 42 白千層、中山北路五段 378 巷／士林 36 榕樹、
信義路五段／信義 27 大花紫薇。

### `h3_grid.geojson`（既有六邊形疊圖，非上表 6 份 stats 之一）
落地：`mini-taipei-trees/public/data/h3_grid.geojson`。四期擴充**只新增兩欄、既有欄位不動**：
`disappeared_0307`（該 hex 落入 0307 段消失樹筆數）、`ratio_0307`（沿用既有 `total` 當分母）。
694 筆 0307 消失樹 100% 落入既有 1,182 個六邊形中的 160 格。

## 4. 陷阱總表（違反任一條 = 驗收退回）

1. **2022 胸徑單位是公尺**（中位 0.26），2024/2603/2607 是公分（中位 ~24）。跨期比較前必 ×100。
2. **2022 座標欄名是 `X`/`Y`**，不是 `TWD97X/Y`；既有 `06_status_merge.py::load_snapshot` 只認後者，直接餵 2022 會炸。
3. TWD97→WGS84 一律用 `ANALYTICS/src/geo_crs.py`，禁手刻。管線跑 `./venv/bin/python3`。
4. **消失 ≠ 砍除**：`traj=1011`（沿用三期 `101`，重現）41 筆與 renumber_suspect 點，前端必須降透明度並在圖例說明。
5. `TreeHeight` 髒值（max 2023）；>60m 設 null。`Diameter` 2026 有 51 筆空值 → null。
6. `Region` 混公園/綠地/廣場（11.4%）：`is_park` 過濾 regex = `公園|綠地|廣場`（`園區` 35 筆忽略）。
7. `UpdDate` 是批次覆寫戳記，不是逐筆異動時間，不可當事件時間軸。
8. 樹種淨變化解讀：新增樹屬性取自新期快照、消失樹取自舊期快照——同一張圖混兩期屬性是設計使然，圖說要註明。
9. PMTiles 屬性會被 tippecanoe 保留與否取決於參數——匯出後必用 `pmtiles show` / 實際地圖驗證欄位齊全。
10. **2026-03 時點的檔案匯出日是 2026-07-12**（key=`2603`）：`taipei_tree_20260712.json` 的 `UpdDate`
    全欄 = 匯出時刻，不可當內容時間；圖說/前端顯示該時點一律標「2026-03」而非「2026-07-12」。

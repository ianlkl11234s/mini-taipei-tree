# DATA_CONTRACT — 三時點行道樹資料契約

> 前端（T2/T3）與資料管線（T1）之間的唯一契約。改欄位必先改這裡。
> 所有上游檔案路徑以 `ANALYTICS = /Users/migu/Desktop/資料庫/gen_ai_try/ichef_工作用/GIS/taipei-gis-analytics` 為根。

## 1. 上游原始資料（已存在，實查驗證 2026-07-13）

| 時點 | 檔案 | 筆數 | 座標欄 | 胸徑單位 |
|------|------|------|--------|---------|
| 2022-10-15 | `ANALYTICS/docs/topic-research/street_tree_removal/data-staged/tree_snapshots/taipei_tree_20221015.xml` | 88,075 | `X`/`Y`（EPSG:3826） | **公尺** ⚠️ |
| 2024-11-21 | `.../taipei_tree_20241121.json` | 95,498 | `TWD97X`/`TWD97Y`（EPSG:3826） | 公分 |
| 2026-07-12 | `.../taipei_tree_20260712.json` | 92,033 | `TWD97X`/`TWD97Y`（EPSG:3826） | 公分 |

共同欄位（11 欄，100% 覆蓋）：`TreeID, Dist, Region, RegionRemark, TreeType, Diameter, TreeHeight, SurveyDate, {座標2欄}, UpdDate`。

既有二期成品（過渡期前端先吃這個）：
`ANALYTICS/data/processed/urban_open_space/street_trees_taipei_diff/street_trees_taipei_diff.pmtiles`
（99,527 點，source-layer 名稱 = `street_trees_taipei_diff`，properties: TreeID/TreeType/Dist/Region/Diameter/TreeHeight/SurveyDate/status[persisted|disappeared|appeared]/renumber_suspect）。

## 2. 成品一：三期軌跡 PMTiles

- dataset_id：`street_trees_taipei_3epoch`
- 落地：`ANALYTICS/data/processed/urban_open_space/street_trees_taipei_3epoch/`（GeoJSON + PMTiles + _manifest.json）
- 前端副本：`mini-taipei-trees/public/data/street_trees_taipei_3epoch.pmtiles`
- tippecanoe 配方沿用二期版：`-r1 --no-feature-limit --no-tile-size-limit -z14 -Z5`（拉遠不抽稀）
- source-layer 名稱 = `street_trees_taipei_3epoch`
- 幾何：Point EPSG:4326；座標取「最後出現時點」的位置

### feature properties（前端依此寫 expression，欄名全小寫）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `tree_id` | string | TreeID |
| `traj` | string | 三期出現軌跡，3 碼 `{2022}{2024}{2026}`，1=在冊 0=不在。值域實測 7 種：`111` 75,992／`110`／`100`／`011`／`010`／`001`／`101` 41 筆（消失後重現，幾乎必為重編號） |
| `status_2224` | string | `appeared` / `persisted` / `disappeared` / `absent`（該段兩期皆不在） |
| `status_2426` | string | 同上值域 |
| `species` | string | TreeType，取最後出現時點 |
| `dist` | string | 行政區 |
| `region` | string | 路段/公園名 |
| `is_park` | 0/1 | `region` 匹配 regex `公園|綠地|廣場` → 1（佔 baseline 約 11.4%） |
| `dbh_cm` | number | 胸徑（公分）。**2022-only 樹（traj=100）之原值為公尺，管線須 ×100** |
| `height_m` | number\|null | 樹高（m）；>60 視為髒值設 null（上游 max 2023 是年份誤植） |
| `survey_date` | string | 最後出現時點的 SurveyDate（YYYY-MM-DD，截掉時間） |
| `renumber_2224` | 0/1 | 2022→2024 段疑似重編號（消失點附近出現同種新編號；演算法沿用 06_status_merge.py，2022 段需重算） |
| `renumber_2426` | 0/1 | 2024→2026 段疑似重編號（既有欄位） |

### 驗收數字（T1 必須逐項核對，出處：01_snapshot_diff.py 與 2026-07-13 實測）

| 檢查 | 期望值 |
|------|-------|
| 總 features（三期 TreeID union） | **105,675** |
| traj=111 | 75,992 |
| 2022→2024 消失（traj 1 0 *）＝ `100`+`101` | 6,189（其中 `101`=41） |
| 2022→2024 新增（traj 0 1 *）＝ `011`+`010` | 13,612 |
| 2024→2026 消失（traj * 1 0）＝ `110`+`010` | 7,494 |
| 2024→2026 新增（traj * 0 1）＝ `001`+`101` | 4,029（含 41 筆重現） |
| 2024→2026 維持（traj * 1 1）＝ `111`+`011` | 88,004 |
| `dbh_cm` 全表中位數 | ≈ 24（若跑出 ≈0.24 代表 2022 單位沒轉） |
| renumber_2426=1 | 447 點所屬段 =221 消失 + 226 新增（與二期成品一致） |

## 3. 成品二：stats JSON（infograph 餵料）

落地：`mini-taipei-trees/public/data/stats/`（管線同時在 analytics processed 目錄留副本）。
所有「消失率」皆以該段 baseline 期總數為分母，並提供 `all`（全部）與 `street`（排除 is_park）兩組。

### `overview.json`
```jsonc
{
  "epochs": [
    {"key": "2022", "date": "2022-10-15", "total": 88075, "total_street": ...},
    {"key": "2024", "date": "2024-11-21", "total": 95498, "total_street": ...},
    {"key": "2026", "date": "2026-07-12", "total": 92033, "total_street": ...}
  ],
  "segments": [
    {"key": "2224", "disappeared": 6189, "appeared": 13612, "persisted": 81886, "net": 7423,
     "renumber_suspect": 1076, "removal_rate": 0.0703, "..._street": "同組排除公園版"},
    {"key": "2426", "disappeared": 7494, "appeared": 4029, "persisted": 88004, "net": -3465,
     "renumber_suspect": 221, "removal_rate": 0.0785, "removal_rate_norenumber": 0.0762, "...": "..."}
  ],
  "species_count": 292,
  "generated_at": "ISO8601"
}
```

### `species.json`
每段每樹種一列（樹種取「基數≥50 的全部」+ 其餘併 `其他`）：
```jsonc
{"segments": {"2426": [
  {"species": "榕樹", "base": 11548, "disappeared": 947, "appeared": 183, "net": -764,
   "removal_rate": 0.082, "base_street": ..., "removal_rate_street": ...}, ...
], "2224": [ ... ]},
 "epoch_top20": [{"species": "榕樹", "count_2026": 10784}, ...]}
```

### `dbh_bins.json` / `height_bins.json`
分級距沿用既有分析：胸徑 `<10 / 10-20 / 20-40 / 40-60 / >60`（cm）、
樹高 `<5 / 5-10 / 10-15 / 15-20 / >20`（m）。每段每 bin：`{bin, base, disappeared, appeared, removal_rate, removal_rate_street}`。

### `districts.json`
12 行政區 × 每段：`{dist, base, disappeared, appeared, net, removal_rate, removal_rate_street}` + 各區 2026 總數。

### `clusters.json`
整排消失熱點（上游 `spike_poc/clusters_*_with_ids.csv`，取 size≥10 的叢集）：
`[{segment, cluster_id, road, dist, size, centroid: [lng,lat], species_top}]`，依 size 降冪。

## 4. 陷阱總表（違反任一條 = 驗收退回）

1. **2022 胸徑單位是公尺**（中位 0.26），2024/2026 是公分（中位 ~24）。跨期比較前必 ×100。
2. **2022 座標欄名是 `X`/`Y`**，不是 `TWD97X/Y`；既有 `06_status_merge.py::load_snapshot` 只認後者，直接餵 2022 會炸。
3. TWD97→WGS84 一律用 `ANALYTICS/src/geo_crs.py`，禁手刻。管線跑 `./venv/bin/python3`。
4. **消失 ≠ 砍除**：`101`（重現）41 筆與 renumber_suspect 點，前端必須降透明度並在圖例說明。
5. `TreeHeight` 髒值（max 2023）；>60m 設 null。`Diameter` 2026 有 51 筆空值 → null。
6. `Region` 混公園/綠地/廣場（11.4%）：`is_park` 過濾 regex = `公園|綠地|廣場`（`園區` 35 筆忽略）。
7. `UpdDate` 是批次覆寫戳記，不是逐筆異動時間，不可當事件時間軸。
8. 樹種淨變化解讀：新增樹屬性取自新期快照、消失樹取自舊期快照——同一張圖混兩期屬性是設計使然，圖說要註明。
9. PMTiles 屬性會被 tippecanoe 保留與否取決於參數——匯出後必用 `pmtiles show` / 實際地圖驗證欄位齊全。

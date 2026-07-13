# RESEARCH_NOTES — 探索期調查摘要（2026-07-13，三路 agent 實查）

> 濃縮版。原始完整回報在當日 session；此檔保留「接手需要的一切事實」。

## 1. 資料資產（上游 taipei-gis-analytics）

- 三時點快照齊全（88,075 / 95,498 / 92,033），欄位 11 欄 100% 覆蓋；細節與陷阱全部收進 `DATA_CONTRACT.md`。
- 既有成品 `street_trees_taipei_diff`（99,527 點，只含 2024↔2026）已上 mini-taiwan-pulse（PR #65）。
- diff 中間產物三檔 schema 不一致（2022 段缺 renumber、Diameter 字串公尺）→ 所以 T1 從快照重算，不吃中間檔。
- **E. 可直接變 infograph 的關鍵數字**（出處 `spike_poc/descriptive_analysis.md`，對象 2024→2026）：
  - 全市消失率 7.85%（排除疑似重編號 7.62%）
  - 消失率最高樹種（基數≥100）：亞力山大椰子 71.7%、櫸 35.2%、鐵刀木 27.6%、大葉桉 22.4%、桑樹 21.6%
  - 消失絕對數：榕樹 947、樟樹 607、臺灣欒樹 525
  - 淨流失：榕樹 −764、臺灣欒樹 −398、黑板樹 −251；淨增：水柳 +213、洋紅風鈴木 +93、海檬果 +74
  - 樹高越高消失率越低（<5m 12.0% → >20m 3.9%，單調）；胸徑與消失率無單調關係（U 型），同樹種內有 Simpson's paradox
  - 現行 top 樹種：榕樹 10,784、茄苳 10,267、樟樹 8,603、楓香 7,714、臺灣欒樹 6,500（共 292 種）
- 現成圖片 10 張在 `spike_poc/images/`（NDVI 時序 + 分級距柱狀），About 頁 S2 敘事可直接用。
- 衛星互證故事：松仁路 304 棵 16 季 NDVI 穩定後 2026Q2 斷崖（雙源互證），是 About 頁最有力案例。

## 2. 前端參考 repo 盤點

**結論：mini-taiwan-info 當 UI/圖表/部署模板 + new-taipei 抄 PMTiles 三件套。兩者皆 mapbox-gl 3.x。**

可直接抄的檔案（絕對路徑）：

PMTiles 地圖核心（from mini-taiwan-project-new-taipei）：
- `.../GIS/mini-taiwan-project-new-taipei/src/map/pmtilesConstants.ts`
- `.../GIS/mini-taiwan-project-new-taipei/src/map/pmtilesSourceType.ts` ⚠️ 頂部有踩雷註解：必須 import `mapbox-pmtiles/dist/mapbox-pmtiles.js`
- `.../GIS/mini-taiwan-project-new-taipei/src/map/mapLayerUtils.ts`（firstSymbolLayerId 插層）
- `.../GIS/mini-taiwan-project-new-taipei/src/hooks/useRoadNetworkLayer.ts`（改寫成 circle 層樣板；開關/透明度走 setPaintProperty 不重建）
- `.../GIS/mini-taiwan-project-new-taipei/src/map/MapView.tsx`（**style.load 時先重註冊 SourceType 再重掛圖層** + styleEpoch pattern——Mapbox setStyle 會清光自訂 source）
- `.../GIS/mini-taiwan-project-new-taipei/src/state/layerStore.ts`（useSyncExternalStore 自製 store，可選）

UI / 圖表 / 部署（from mini-taiwan-info/frontend）：
- `src/styles/globals.css`（design tokens 單檔，`--accent-environment: #22C55E` 現成綠色系；light 預設 + `[data-theme="dark"]`）
- `src/components/charts/{Donut,TrendChart,Sparkline}.tsx`（手刻 SVG）
- `src/components/kpi/KPICard.tsx`、`src/components/map/MapLegend.tsx`、`src/components/common/DataSourceBadge.tsx`
- `src/lib/mapbox.ts`（style presets：light/dark/satellite/blank + color ramps）、`src/lib/format.ts`
- `frontend/Dockerfile` + `frontend/nginx.conf`（Zeabur node→nginx 部署鏈）+ 根目錄 `DEPLOYMENT.md`

其他事實：
- 兩模板都需 `VITE_MAPBOX_TOKEN`；免 token 替代 = maplibre-gl + pmtiles protocol（無 in-house 現成碼，是 D1 的 fallback）。
- info 的點位層是 GeoJSON setData（≤數千點），撐不住 10 萬點——所以必走 PMTiles。
- `tree-report/` 是「護樹通報 VGI POC」（Leaflet + Supabase RLS + Vercel），與本站互補不重疊；未來加民眾回報可接其 schema。

## 3. 外部資料源

### 公園處修剪公告（pkl.gov.taipei）★ 全站唯一動態源
- 欄目「行道樹、公園樹木預定修剪及澆灌行程」= **滾動週報，永遠只有當週 3 則**（週日晚更新、舊版覆蓋、無歷史檔）→ **weekly snapshot 越早開始越有價值**；首份已存（見 AGENT_TASKS T4）。
- 程式化端點（不用爬 HTML）：RSS `https://pkl.gov.taipei/OpenData.aspx?SN=AF467FBC2E237D95`（⭐ description 內嵌完整 HTML table）；JSON `SN=DDD0871317BDE9F7`（table 被壓平，難用）；XML `SN=DE40C0028A7994AF`（utf-16）。
- 行道樹修剪表 9 欄：作業期間起/迄、分隊、地點、施工項目、施工內容、數量、施作單位、依據。當週 47 列。
- 路段名可 join 行道樹清冊 `Region`（同機關命名體系一致；多路段以「、」切分）；粒度只到「路段×棵數」。
- `依據` 欄可分「APP案件/陳情案件」vs「例行性」vs「承商查報」→ 民眾陳情 vs 例行養護敘事。
- 移樹/砍伐公告不在此欄目；「樹木移植計畫書審查專區」目前為空。

### 全國行道樹開放資料（twinkle-hub 實查）
- **逐棵帶座標只有兩縣市**：台北（128274，~9 萬棵，blob 直連 `https://tppkl.blob.core.windows.net/blobfs/TaipeiTree.csv`，同源另有 **TaipeiTreeHole.csv 樹穴 2,254 筆**）；台中（109853，KMZ，**2020 靜態舊檔 + Google Drive 託管**，除非做雙北比較否則緩）。
- 新北 125339 = 533 路 × 151 樹種計數寬表（無座標，可做樹種組成比較不能上點圖）；新竹市/台中另有路段級統計。高雄/台南/桃園查無行道樹清冊。
- **受保護/珍貴樹木**反而全國可比：10+ 縣市有 dataset（新北 125615 每 3 月更新、桃園 26129、台中 83615、台南 53536、高雄 163742…）→ Phase 3 素材。

### 台北市其他
- ⭐ **受保護樹木 121274**（文化局）：3,874 棵逐棵含經緯度/樹種學名/胸徑/地址，接入成本≈0 → T4-2。官方樹木故事平臺 https://eculture.gov.taipei/trees/zh-tw 可外連。
- 行道樹認養人資料（145726，年更）：企業認養路段 → 敘事層選材。
- 大地工程處：無樹木清冊類開放資料（領域是山坡地查詢系統）→ 放棄。
- 都發局綠覆率：法規審查指標、無開放 dataset → 要綠覆空間層走自家 S2 NDVI / Meta CHM。
- 主計處綠資源統計 / 工務統計「行道樹及其他植栽」：年度總量，可當概況數字備援。

### 競品
- https://taipei-trees.org/ ：第三方行道樹+受保護樹查詢站（QR 掃碼）。**差異化 = 我們有時間軸（三時點 diff、衛星互證、未來週修剪動態），他們只有「現在」。**

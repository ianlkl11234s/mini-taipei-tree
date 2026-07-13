"""
gen_h3_grid.py — 預計算 H3 六邊形網格統計
===========================================
讀取三期合併 GeoJSON，依 H3 resolution 8 聚合每格的消失率統計，
產出 public/data/h3_grid.geojson 供前端 choropleth 使用。

用法：
  python3 scripts/gen_h3_grid.py
"""

import json
import os
from collections import defaultdict
from pathlib import Path

import h3

# ---------- 路徑 ----------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
UPSTREAM_GEOJSON = (
    PROJECT_ROOT.parent
    / "taipei-gis-analytics"
    / "data"
    / "processed"
    / "urban_open_space"
    / "street_trees_taipei_3epoch"
    / "street_trees_taipei_3epoch_20260713.geojson"
)
OUTPUT_PATH = PROJECT_ROOT / "public" / "data" / "h3_grid.geojson"

H3_RES = 8
SEGMENTS = ["2224", "2426"]


def main():
    print(f"Reading {UPSTREAM_GEOJSON} ...")
    with open(UPSTREAM_GEOJSON) as f:
        src = json.load(f)

    features = src["features"]
    print(f"  {len(features)} points loaded")

    # ---------- 聚合到 H3 cell ----------
    # 每個 cell 記：total（所有點）、per-segment total_seg / disappeared
    cells: dict[str, dict] = defaultdict(lambda: {
        "total": 0,
        **{f"total_{s}": 0 for s in SEGMENTS},
        **{f"disappeared_{s}": 0 for s in SEGMENTS},
    })

    for feat in features:
        lng, lat = feat["geometry"]["coordinates"]
        cell = h3.latlng_to_cell(lat, lng, H3_RES)
        props = feat["properties"]

        bucket = cells[cell]
        bucket["total"] += 1

        for seg in SEGMENTS:
            status = props.get(f"status_{seg}")
            if status == "absent":
                continue  # 該期不參與
            bucket[f"total_{seg}"] += 1
            if status == "disappeared":
                bucket[f"disappeared_{seg}"] += 1

    print(f"  {len(cells)} H3 cells (res {H3_RES})")

    # ---------- 產生六邊形 polygon GeoJSON ----------
    out_features = []
    for cell_id, stats in cells.items():
        # cell_to_boundary → list of (lat, lng) tuples
        boundary = h3.cell_to_boundary(cell_id)
        # GeoJSON 要 [lng, lat]，且 polygon ring 必須閉合
        ring = [[lng, lat] for lat, lng in boundary]
        ring.append(ring[0])  # 閉合

        props = {
            "h3_index": cell_id,
            "total": stats["total"],
        }
        for seg in SEGMENTS:
            total_seg = stats[f"total_{seg}"]
            disappeared = stats[f"disappeared_{seg}"]
            ratio = round(disappeared / total_seg, 4) if total_seg > 0 else 0.0
            props[f"disappeared_{seg}"] = disappeared
            props[f"ratio_{seg}"] = ratio

        out_features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [ring],
            },
            "properties": props,
        })

    geojson = {
        "type": "FeatureCollection",
        "features": out_features,
    }

    os.makedirs(OUTPUT_PATH.parent, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(geojson, f)

    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"  Written {OUTPUT_PATH} ({size_kb:.0f} KB, {len(out_features)} features)")


if __name__ == "__main__":
    main()

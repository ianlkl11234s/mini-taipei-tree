import { useEffect, useRef } from "react";
import type { Map as MapboxMap, MapMouseEvent, LngLat } from "mapbox-gl";
import { FIELDS, SOURCE, statusFieldFor, renumberFieldFor } from "../lib/dataSource";
import { PMTILES_SOURCE_TYPE } from "./pmtilesConstants";
import { registerPmtilesSourceTypeOnce } from "./pmtilesSourceType";
import { firstSymbolLayerId } from "./mapLayerUtils";
import {
  buildFilter,
  buildColorExpr,
  buildOpacityExpr,
  radiusExpr,
} from "../filters/filterExpression";
import type { FilterState } from "../filters/types";

export const TREE_LAYER_ID = "tree-points";

export interface TreeFeatureClick {
  props: Record<string, unknown>;
  lngLat: LngLat;
}

/**
 * 樹點圖層：PMTiles circle 層 + 三色分染 + 組合式 setFilter。
 * - styleEpoch 變（底圖切亮暗）→ source/layer 重掛。
 * - filter 變 → 只呼叫 setFilter，不重建圖層。
 */
export function useTreeLayer(
  map: MapboxMap | null,
  styleEpoch: number,
  filter: FilterState,
  onFeatureClick: (f: TreeFeatureClick) => void,
) {
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const clickRef = useRef(onFeatureClick);
  clickRef.current = onFeatureClick;

  // 掛載 source + layer（含底圖切換後重掛）
  useEffect(() => {
    if (!map) return;
    registerPmtilesSourceTypeOnce();

    const before = firstSymbolLayerId(map);
    const seg0 = filterRef.current.segment;
    const statusField = statusFieldFor(seg0) ?? FIELDS.status2426;
    const renumberField = renumberFieldFor(seg0) ?? FIELDS.renumber2426;

    if (!map.getSource(SOURCE.id)) {
      map.addSource(SOURCE.id, {
        type: PMTILES_SOURCE_TYPE,
        url: SOURCE.url,
        minzoom: 0,
        maxzoom: 14,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
    if (!map.getLayer(TREE_LAYER_ID)) {
      map.addLayer(
        {
          id: TREE_LAYER_ID,
          type: "circle",
          source: SOURCE.id,
          "source-layer": SOURCE.sourceLayer,
          paint: {
            "circle-color": buildColorExpr(statusField),
            "circle-radius": radiusExpr(filterRef.current.circleScale),
            "circle-opacity": buildOpacityExpr(renumberField),
            "circle-stroke-width": 0.4,
            "circle-stroke-color": "rgba(6,20,12,0.55)",
          },
        },
        before,
      );
    }
    map.setFilter(TREE_LAYER_ID, buildFilter(filterRef.current));

    const onClick = (e: MapMouseEvent) => {
      const feat = e.features?.[0];
      if (!feat) return;
      clickRef.current({ props: feat.properties ?? {}, lngLat: e.lngLat });
    };
    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("click", TREE_LAYER_ID, onClick);
    map.on("mouseenter", TREE_LAYER_ID, onEnter);
    map.on("mouseleave", TREE_LAYER_ID, onLeave);

    return () => {
      map.off("click", TREE_LAYER_ID, onClick);
      map.off("mouseenter", TREE_LAYER_ID, onEnter);
      map.off("mouseleave", TREE_LAYER_ID, onLeave);
      if (map.getLayer(TREE_LAYER_ID)) map.removeLayer(TREE_LAYER_ID);
      if (map.getSource(SOURCE.id)) map.removeSource(SOURCE.id);
    };
  }, [map, styleEpoch]);

  // filter 變 → setFilter（含時段的色彩欄更新）
  useEffect(() => {
    if (!map || !map.getLayer(TREE_LAYER_ID)) return;
    map.setFilter(TREE_LAYER_ID, buildFilter(filter));
    const statusField = statusFieldFor(filter.segment);
    if (statusField) {
      map.setPaintProperty(TREE_LAYER_ID, "circle-color", buildColorExpr(statusField));
    }
    const renumberField = renumberFieldFor(filter.segment);
    if (renumberField) {
      map.setPaintProperty(TREE_LAYER_ID, "circle-opacity", buildOpacityExpr(renumberField));
    }
    map.setPaintProperty(TREE_LAYER_ID, "circle-radius", radiusExpr(filter.circleScale));
    const vis = filter.mapView === "points" ? "visible" : "none";
    map.setLayoutProperty(TREE_LAYER_ID, "visibility", vis);
  }, [map, styleEpoch, filter]);
}

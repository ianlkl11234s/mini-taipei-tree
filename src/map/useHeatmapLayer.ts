import { useEffect } from "react";
import type { Map as MapboxMap } from "mapbox-gl";
import { SOURCE } from "../lib/dataSource";
import { buildFilter } from "../filters/filterExpression";
import type { FilterState } from "../filters/types";
import { firstSymbolLayerId } from "./mapLayerUtils";

const HEATMAP_ID = "tree-heatmap";

export function useHeatmapLayer(
  map: MapboxMap | null,
  styleEpoch: number,
  filter: FilterState,
) {
  const visible = filter.mapView === "heatmap";

  useEffect(() => {
    if (!map || !map.getSource(SOURCE.id)) return;
    if (!visible) {
      if (map.getLayer(HEATMAP_ID)) map.setLayoutProperty(HEATMAP_ID, "visibility", "none");
      return;
    }

    if (!map.getLayer(HEATMAP_ID)) {
      const before = firstSymbolLayerId(map);
      map.addLayer(
        {
          id: HEATMAP_ID,
          type: "heatmap",
          source: SOURCE.id,
          "source-layer": SOURCE.sourceLayer,
          paint: {
            "heatmap-weight": 0.3,
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              9, 0.4,
              12, 0.8,
              14, 1.2,
              18, 2,
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              9, 8,
              12, 16,
              14, 22,
              18, 32,
            ],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.05, "rgba(46,125,50,0.15)",
              0.15, "rgba(102,187,106,0.35)",
              0.30, "rgba(156,204,101,0.45)",
              0.45, "rgba(255,235,59,0.55)",
              0.60, "rgba(255,193,7,0.65)",
              0.75, "rgba(255,152,0,0.75)",
              0.90, "rgba(229,57,53,0.82)",
              1, "rgba(183,28,28,0.90)",
            ],
            "heatmap-opacity": 0.80,
          },
        },
        before,
      );
    }

    map.setLayoutProperty(HEATMAP_ID, "visibility", "visible");
    map.setFilter(HEATMAP_ID, buildFilter(filter));
  }, [map, styleEpoch, filter, visible]);

  useEffect(() => {
    return () => {
      if (map?.getLayer(HEATMAP_ID)) map.removeLayer(HEATMAP_ID);
    };
  }, [map, styleEpoch]);
}

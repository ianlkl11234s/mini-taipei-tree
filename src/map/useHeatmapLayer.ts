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
            "heatmap-weight": 1,
            "heatmap-intensity": [
              "interpolate", ["linear"], ["zoom"],
              9, 0.8,
              14, 2,
              18, 4,
            ],
            "heatmap-radius": [
              "interpolate", ["linear"], ["zoom"],
              9, 6,
              12, 14,
              14, 20,
              18, 30,
            ],
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.15, "rgba(46,125,50,0.3)",
              0.3, "rgba(156,204,101,0.5)",
              0.5, "rgba(255,235,59,0.6)",
              0.7, "rgba(255,152,0,0.75)",
              0.9, "rgba(229,57,53,0.85)",
              1, "rgba(183,28,28,0.95)",
            ],
            "heatmap-opacity": 0.85,
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

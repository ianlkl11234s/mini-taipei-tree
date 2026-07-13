import { useEffect, useRef } from "react";
import type { Map as MapboxMap, MapMouseEvent, Popup } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import type { FilterState } from "../filters/types";

const H3_SOURCE = "h3-grid";
const H3_FILL = "h3-fill";
const H3_LINE = "h3-line";

function ratioField(segment: string) {
  return segment === "2224" ? "ratio_2224" : "ratio_2426";
}

function disappearedField(segment: string) {
  return segment === "2224" ? "disappeared_2224" : "disappeared_2426";
}

export function useH3Layer(
  map: MapboxMap | null,
  styleEpoch: number,
  filter: FilterState,
) {
  const visible = filter.mapView === "h3";
  const popupRef = useRef<Popup | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!visible) {
      if (map.getLayer(H3_FILL)) map.setLayoutProperty(H3_FILL, "visibility", "none");
      if (map.getLayer(H3_LINE)) map.setLayoutProperty(H3_LINE, "visibility", "none");
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      return;
    }

    const base = import.meta.env.BASE_URL;

    if (!map.getSource(H3_SOURCE)) {
      map.addSource(H3_SOURCE, {
        type: "geojson",
        data: `${base}data/h3_grid.geojson`,
      });
    }

    if (!map.getLayer(H3_FILL)) {
      map.addLayer({
        id: H3_FILL,
        type: "fill",
        source: H3_SOURCE,
        paint: {
          "fill-color": [
            "interpolate", ["linear"],
            ["get", ratioField(filter.segment)],
            0, "rgba(46,125,50,0.25)",
            0.05, "rgba(156,204,101,0.4)",
            0.10, "rgba(255,235,59,0.5)",
            0.15, "rgba(255,152,0,0.6)",
            0.25, "rgba(229,57,53,0.7)",
            0.50, "rgba(183,28,28,0.8)",
          ],
          "fill-opacity": 0.7,
        },
      });
    }

    if (!map.getLayer(H3_LINE)) {
      map.addLayer({
        id: H3_LINE,
        type: "line",
        source: H3_SOURCE,
        paint: {
          "line-color": "rgba(46,125,50,0.4)",
          "line-width": 1,
        },
      });
    }

    map.setLayoutProperty(H3_FILL, "visibility", "visible");
    map.setLayoutProperty(H3_LINE, "visibility", "visible");

    map.setPaintProperty(H3_FILL, "fill-color", [
      "interpolate", ["linear"],
      ["get", ratioField(filter.segment)],
      0, "rgba(46,125,50,0.25)",
      0.05, "rgba(156,204,101,0.4)",
      0.10, "rgba(255,235,59,0.5)",
      0.15, "rgba(255,152,0,0.6)",
      0.25, "rgba(229,57,53,0.7)",
      0.50, "rgba(183,28,28,0.8)",
    ]);
  }, [map, styleEpoch, filter, visible]);

  // hover popup
  useEffect(() => {
    if (!map || !visible) return;

    const onMove = (e: MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: [H3_FILL] });
      if (!feats.length) {
        if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
        map.getCanvas().style.cursor = "";
        return;
      }
      map.getCanvas().style.cursor = "pointer";
      const p = feats[0].properties!;
      const seg = filter.segment;
      const ratio = p[ratioField(seg)];
      const gone = p[disappearedField(seg)];
      const total = p.total;

      if (!popupRef.current) {
        popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: "200px" });
      }
      popupRef.current
        .setLngLat(e.lngLat)
        .setHTML(
          `<div style="font-size:13px;line-height:1.5">` +
          `<b>區域內行道樹 ${total} 棵</b><br/>` +
          `離冊 ${gone} 棵（${(ratio * 100).toFixed(1)}%）` +
          `</div>`
        )
        .addTo(map);
    };

    const onLeave = () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      map.getCanvas().style.cursor = "";
    };

    map.on("mousemove", H3_FILL, onMove);
    map.on("mouseleave", H3_FILL, onLeave);
    return () => {
      map.off("mousemove", H3_FILL, onMove);
      map.off("mouseleave", H3_FILL, onLeave);
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    };
  }, [map, visible, filter.segment]);

  useEffect(() => {
    return () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      if (map?.getLayer(H3_FILL)) map.removeLayer(H3_FILL);
      if (map?.getLayer(H3_LINE)) map.removeLayer(H3_LINE);
      if (map?.getSource(H3_SOURCE)) map.removeSource(H3_SOURCE);
    };
  }, [map, styleEpoch]);
}

import { useEffect, useRef } from "react";
import type { Map as MapboxMap, MapMouseEvent, Popup } from "mapbox-gl";
import mapboxgl from "mapbox-gl";
import type { FilterState } from "../filters/types";

const NFZ_SOURCE = "drone-nfz";
const NFZ_FILL = "drone-nfz-fill";
const NFZ_LINE = "drone-nfz-line";

export function useDroneLayer(
  map: MapboxMap | null,
  styleEpoch: number,
  filter: FilterState,
) {
  const visible = filter.mapView === "drone";
  const popupRef = useRef<Popup | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!visible) {
      if (map.getLayer(NFZ_FILL)) map.setLayoutProperty(NFZ_FILL, "visibility", "none");
      if (map.getLayer(NFZ_LINE)) map.setLayoutProperty(NFZ_LINE, "visibility", "none");
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      return;
    }

    const base = import.meta.env.BASE_URL;

    if (!map.getSource(NFZ_SOURCE)) {
      map.addSource(NFZ_SOURCE, {
        type: "geojson",
        data: `${base}data/drone_nfz_taipei.geojson`,
      });
    }

    if (!map.getLayer(NFZ_FILL)) {
      map.addLayer({
        id: NFZ_FILL,
        type: "fill",
        source: NFZ_SOURCE,
        filter: ["==", ["get", "空域顏色"], "紅區"],
        paint: {
          "fill-color": "rgba(229,57,53,0.2)",
          "fill-opacity": 0.5,
        },
      });
    }

    if (!map.getLayer(NFZ_LINE)) {
      map.addLayer({
        id: NFZ_LINE,
        type: "line",
        source: NFZ_SOURCE,
        filter: ["==", ["get", "空域顏色"], "紅區"],
        paint: {
          "line-color": "rgba(229,57,53,0.5)",
          "line-width": 1,
        },
      });
    }

    map.setLayoutProperty(NFZ_FILL, "visibility", "visible");
    map.setLayoutProperty(NFZ_LINE, "visibility", "visible");
  }, [map, styleEpoch, filter, visible]);

  useEffect(() => {
    if (!map || !visible) return;

    const onMove = (e: MapMouseEvent) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: [NFZ_FILL] });
      if (!feats.length) {
        if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
        return;
      }
      const name = feats[0].properties?.["空域名稱"] ?? "";
      if (!popupRef.current) {
        popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: "220px" });
      }
      popupRef.current
        .setLngLat(e.lngLat)
        .setHTML(`<div style="font-size:13px"><b>禁航區</b><br/>${name}</div>`)
        .addTo(map);
    };

    const onLeave = () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    };

    map.on("mousemove", NFZ_FILL, onMove);
    map.on("mouseleave", NFZ_FILL, onLeave);
    return () => {
      map.off("mousemove", NFZ_FILL, onMove);
      map.off("mouseleave", NFZ_FILL, onLeave);
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    };
  }, [map, visible]);

  useEffect(() => {
    return () => {
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      if (map?.getLayer(NFZ_FILL)) map.removeLayer(NFZ_FILL);
      if (map?.getLayer(NFZ_LINE)) map.removeLayer(NFZ_LINE);
      if (map?.getSource(NFZ_SOURCE)) map.removeSource(NFZ_SOURCE);
    };
  }, [map, styleEpoch]);
}

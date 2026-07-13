import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { registerPmtilesSourceTypeOnce } from "./pmtilesSourceType";

/** 初始視角：台北市。 */
const TAIPEI_VIEW = {
  center: [121.54, 25.05] as [number, number],
  zoom: 12,
  minZoom: 9,
  maxZoom: 18.5,
};

interface MapViewProps {
  styleUrl: string;
  onMapReady?: (map: mapboxgl.Map) => void;
  /**
   * 底圖 setStyle 後（style.load）觸發。Mapbox 切 style 會清掉所有自訂 source/layer，
   * 上層據此 bump styleEpoch 讓樹點圖層重掛。初次載入（load 前）不觸發。
   */
  onStyleReload?: () => void;
}

export function MapView({ styleUrl, onMapReady, onStyleReload }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const readyRef = useRef(false);
  const [initError, setInitError] = useState(false);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;
  const onStyleReloadRef = useRef(onStyleReload);
  onStyleReloadRef.current = onStyleReload;

  useEffect(() => {
    if (!containerRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

    // 地圖初始化可能因缺 WebGL（無 GPU / 舊裝置）拋錯——包起來避免整頁白屏。
    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: styleUrl,
        center: TAIPEI_VIEW.center,
        zoom: TAIPEI_VIEW.zoom,
        minZoom: TAIPEI_VIEW.minZoom,
        maxZoom: TAIPEI_VIEW.maxZoom,
        antialias: true,
        attributionControl: false,
      });
    } catch (err) {
      console.error("[map] 初始化失敗（可能不支援 WebGL）", err);
      setInitError(true);
      return;
    }
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    // 每次底圖切換都會觸發：PMTiles SourceType 須在任何 pmtiles addSource 前註冊。
    map.on("style.load", () => {
      registerPmtilesSourceTypeOnce();
      // 初次 load 由下方 load handler 掛圖層；只有「之後的」style 切換才重掛。
      if (readyRef.current) onStyleReloadRef.current?.();
    });

    map.on("load", () => {
      mapRef.current = map;
      readyRef.current = true;
      if (import.meta.env.DEV || window.location.search.includes("debug")) {
        (window as unknown as { __map?: mapboxgl.Map }).__map = map;
      }
      onMapReadyRef.current?.(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切換底圖樣式（亮暗）。setStyle 走完整 reload → 觸發 style.load，
  // 上層 onStyleReload 得以重掛樹點圖層。首次 load 前不切（readyRef 守門）。
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setStyle(styleUrl);
  }, [styleUrl]);

  return (
    <>
      <div ref={containerRef} className="map-canvas" />
      {initError && (
        <div className="map-fallback">
          <p>這個裝置或瀏覽器無法顯示互動地圖（需要 WebGL）。</p>
          <p className="sub">你仍然可以往下捲動閱讀統計與資料說明。</p>
        </div>
      )}
    </>
  );
}

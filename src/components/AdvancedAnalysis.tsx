import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

function MiniMap({
  id,
  layers,
  opacity,
}: {
  id: string;
  layers: (map: mapboxgl.Map) => void;
  opacity: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [121.54, 25.05],
      zoom: 11.2,
      interactive: true,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    map.on("load", () => {
      layers(map);
      readyRef.current = true;
      mapRef.current = map;
    });
    return () => { map.remove(); mapRef.current = null; readyRef.current = false; };
  }, [id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    if (map.getLayer("h3-fill")) {
      map.setPaintProperty("h3-fill", "fill-opacity", opacity);
    }
  }, [opacity]);

  return <div ref={ref} className="mini-map" />;
}

export function AdvancedAnalysis() {
  const [opacity, setOpacity] = useState(0.65);

  return (
    <section id="advanced" className="section-band">
      <div className="section-kicker">
        <span className="idx">03</span>
        <span className="rule" />
      </div>
      <h2 className="section-title">進階空間分析</h2>
      <p className="section-sub">
        將行道樹清冊資料以 H3 六邊形網格聚合，觀察各區域的離冊比例差異。
      </p>

      <div className="stat-block">
        <div className="sb-head">
          <span className="sb-n">❶</span>
          <div>
            <h3 className="sb-title">H3 網格離冊率分布</h3>
            <p className="sb-hint">
              Resolution 9（邊長約 174m）· 2026-03→2026-07 · 綠＝低離冊率 · 紅＝高離冊率
            </p>
          </div>
        </div>

        <div className="mini-map-controls">
          <label>
            透明度 <span className="hint">{Math.round(opacity * 100)}%</span>
          </label>
          <input
            type="range"
            className="cp-range light"
            min={0.1}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </div>

        <MiniMap
          id="h3-map"
          opacity={opacity}
          layers={(map) => {
            const base = import.meta.env.BASE_URL;
            map.addSource("h3", {
              type: "geojson",
              data: `${base}data/h3_grid.geojson`,
            });
            map.addLayer({
              id: "h3-fill",
              type: "fill",
              source: "h3",
              paint: {
                "fill-color": [
                  "interpolate", ["linear"],
                  ["get", "ratio_0307"],
                  0, "rgba(46,125,50,0.4)",
                  0.05, "rgba(156,204,101,0.5)",
                  0.10, "rgba(255,235,59,0.6)",
                  0.15, "rgba(255,152,0,0.7)",
                  0.25, "rgba(229,57,53,0.8)",
                  0.50, "rgba(183,28,28,0.9)",
                ],
                "fill-opacity": 0.65,
              },
            });
            map.addLayer({
              id: "h3-line",
              type: "line",
              source: "h3",
              paint: { "line-color": "rgba(255,255,255,0.2)", "line-width": 0.5 },
            });

            const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: "220px" });
            map.on("mousemove", "h3-fill", (e) => {
              const f = e.features?.[0];
              if (!f) return;
              const p = f.properties!;
              const ratio = p.ratio_0307;
              const gone = p.disappeared_0307;
              const total = p.total;
              popup
                .setLngLat(e.lngLat)
                .setHTML(
                  `<div style="font-size:13px;line-height:1.5">` +
                  `<b>區域內行道樹 ${total} 棵</b><br/>` +
                  `離冊 ${gone} 棵（${(ratio * 100).toFixed(1)}%）` +
                  `</div>`
                )
                .addTo(map);
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "h3-fill", () => {
              popup.remove();
              map.getCanvas().style.cursor = "";
            });
          }}
        />

        <div className="sb-insight">
          <b>計算方法</b>：將全市行道樹依座標分配到 H3 六邊形網格（resolution 9，邊長約 174 公尺），
          計算每格內「離冊樹數 ÷ 該格行道樹總數」作為離冊率。顏色越紅代表該區域離冊比例越高。
        </div>
        <div className="sb-insight" style={{ marginTop: 8 }}>
          <b>可能意涵</b>：高離冊率的區域可能反映集中汰換、道路工程、編號重整等因素。
          但離冊率高不等於一定有大量移除——單一格內如果基數很小（如僅 20–30 棵），
          少量異動就會使比例劇烈波動。解讀時應同時參考格內總數。
        </div>
        <p className="sb-note">
          H3 resolution 9 · 2026-03→2026-07 · 資料來源為公園處行道樹清冊四時點比對 · hover 六邊形可查看該格數據
        </p>
      </div>
    </section>
  );
}

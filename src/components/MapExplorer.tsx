import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapboxMap, LngLatLike, MapMouseEvent } from "mapbox-gl";
import { MapView } from "../map/MapView";
import { useTreeLayer, TREE_LAYER_ID, type TreeFeatureClick } from "../map/useTreeLayer";
import { FIELDS, type SegmentKey } from "../lib/dataSource";
import { type TreeStatus } from "../lib/status";
import { defaultFilterState, type FilterState } from "../filters/types";
import { ControlPanel } from "./ControlPanel";
import { Legend } from "./Legend";
import { TreePopup } from "./TreePopup";
import { type SpeciesItem } from "./SpeciesFilter";
import { fmtInt } from "../lib/format";
import { IconFilter } from "./icons";

const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

interface PopupState {
  props: Record<string, unknown>;
  lngLat: LngLatLike;
}

interface OverviewSegment {
  key: string;
  disappeared: number;
  appeared: number;
  persisted: number;
}

interface MapExplorerProps {
  /** 地圖就緒時上拋實例（供 App 對接統計區的「飛到叢集」）。 */
  onMap?: (map: MapboxMap) => void;
}

export function MapExplorer({ onMap }: MapExplorerProps) {
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [styleEpoch, setStyleEpoch] = useState(0);
  const [filter, setFilter] = useState<FilterState>(defaultFilterState);
  const [species, setSpecies] = useState<SpeciesItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false); // 手機 bottom sheet
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [pixel, setPixel] = useState<{ x: number; y: number } | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [overview, setOverview] = useState<OverviewSegment[]>([]);
  const segRef = useRef<SegmentKey>(filter.segment);
  segRef.current = filter.segment;

  // 樹種清單 + overview（狀態總數）
  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}data/species_list.json`)
      .then((r) => r.json())
      .then((d: SpeciesItem[]) => setSpecies(d))
      .catch(() => setSpecies([]));
    fetch(`${base}data/stats/overview.json`)
      .then((r) => r.json())
      .then((d: { segments?: OverviewSegment[] }) => setOverview(d.segments ?? []))
      .catch(() => setOverview([]));
  }, []);

  // 當前時段各狀態總數
  const statusTotals = useMemo<Record<TreeStatus, number> | null>(() => {
    const seg = overview.find((s) => s.key === filter.segment);
    if (!seg) return null;
    return { disappeared: seg.disappeared, appeared: seg.appeared, persisted: seg.persisted };
  }, [overview, filter.segment]);

  const onFeatureClick = useCallback((f: TreeFeatureClick) => {
    setPopup({ props: f.props, lngLat: [f.lngLat.lng, f.lngLat.lat] });
  }, []);

  useTreeLayer(map, styleEpoch, filter, onFeatureClick);

  // popup 像素定位：隨地圖移動重算
  useEffect(() => {
    if (!map || !popup) {
      setPixel(null);
      return;
    }
    const place = () => {
      const pt = map.project(popup.lngLat);
      setPixel({ x: pt.x, y: pt.y });
    };
    place();
    map.on("move", place);
    return () => {
      map.off("move", place);
    };
  }, [map, popup]);

  // 空白處點擊關閉 popup + 視窗內棵數
  useEffect(() => {
    if (!map) return;
    const onClick = (e: MapMouseEvent) => {
      const hit = map.queryRenderedFeatures(e.point, { layers: [TREE_LAYER_ID] });
      if (hit.length === 0) setPopup(null);
    };
    const onIdle = () => {
      const feats = map.queryRenderedFeatures({ layers: [TREE_LAYER_ID] });
      const ids = new Set<string>();
      for (const ft of feats) ids.add(String(ft.properties?.[FIELDS.treeId] ?? Math.random()));
      setViewCount(ids.size);
    };
    map.on("click", onClick);
    map.on("idle", onIdle);
    return () => {
      map.off("click", onClick);
      map.off("idle", onIdle);
    };
  }, [map]);

  // ---- filter 操作 ----
  const onSegment = (s: SegmentKey) => setFilter((f) => ({ ...f, segment: s }));
  const onToggleStatus = (s: TreeStatus) =>
    setFilter((f) => ({ ...f, statuses: { ...f.statuses, [s]: !f.statuses[s] } }));
  const onSpeciesToggle = (s: string) =>
    setFilter((f) => {
      const next = new Set(f.species);
      next.has(s) ? next.delete(s) : next.add(s);
      return { ...f, species: next };
    });
  const onSpeciesClear = () => setFilter((f) => ({ ...f, species: new Set() }));
  const onDbh = (v: [number, number]) => setFilter((f) => ({ ...f, dbhRange: v }));
  const onStreetOnly = (v: boolean) => setFilter((f) => ({ ...f, streetOnly: v }));
  const onDistrictToggle = (d: string) =>
    setFilter((f) => {
      const next = new Set(f.districts);
      next.has(d) ? next.delete(d) : next.add(d);
      return { ...f, districts: next };
    });
  const onReset = () => setFilter(defaultFilterState());

  return (
    <div className="explorer">
      <MapView
        styleUrl={MAP_STYLE}
        onMapReady={(m) => {
          setMap(m);
          onMap?.(m);
        }}
        onStyleReload={() => setStyleEpoch((e) => e + 1)}
      />

      {/* 手機：開啟篩選鈕 + 背景遮罩 */}
      <button className="cp-toggle" onClick={() => setPanelOpen(true)}>
        <IconFilter /> 篩選
      </button>
      <div className={`cp-backdrop${panelOpen ? " show" : ""}`} onClick={() => setPanelOpen(false)} />

      <ControlPanel
        filter={filter}
        species={species}
        statusTotals={statusTotals}
        open={panelOpen}
        onSegment={onSegment}
        onToggleStatus={onToggleStatus}
        onSpeciesToggle={onSpeciesToggle}
        onSpeciesClear={onSpeciesClear}
        onDbh={onDbh}
        onStreetOnly={onStreetOnly}
        onDistrictToggle={onDistrictToggle}
        onReset={onReset}
        onClose={() => setPanelOpen(false)}
      />

      <div className="map-count">
        <span className="pulse" />
        本畫面 <b>{viewCount != null ? fmtInt(viewCount) : "…"}</b> 棵
      </div>

      <Legend />

      {popup && pixel && (
        <TreePopup
          props={popup.props}
          segment={segRef.current}
          x={pixel.x}
          y={pixel.y}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Map, Marker, NavigationControl, LngLat, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coordinates } from "../../lib/location";
import "./AddressMapPicker.css";

setWorkerUrl(workerUrl);
const MAP_STYLE = import.meta.env.VITE_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";

interface Props {
  initialCoordinates: Coordinates | null;
  onConfirm: (coordinates: Coordinates) => void;
  onCancel: () => void;
}

export function AddressMapPicker({ initialCoordinates, onConfirm, onCancel }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const selectRef = useRef<(point: LngLat) => void>(() => {});
  const [selected, setSelected] = useState(initialCoordinates);
  const [mapError, setMapError] = useState<string | null>(null);
  // The picker is remounted on each opening so its initial point stays stable.
  const initial = useRef(initialCoordinates);

  useEffect(() => {
    if (!container.current) return;
    const point = initial.current;
    let active = true;
    let map: Map;
    try {
      map = new Map({
        container: container.current,
        style: MAP_STYLE,
        center: point ? [point.longitude, point.latitude] : [105.80482, 21.02851],
        zoom: point ? 17 : 13,
        maxZoom: 19,
      });
    } catch {
      queueMicrotask(() => { if (active) setMapError("Không thể khởi tạo bản đồ. Vui lòng kiểm tra hỗ trợ WebGL của trình duyệt."); });
      return () => { active = false; };
    }
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("error", () => {
      if (active) setMapError("Không tải được dữ liệu bản đồ. Vui lòng kiểm tra kết nối mạng hoặc thử mở lại bản đồ.");
    });
    map.on("idle", () => {
      if (active && map.isStyleLoaded() && map.areTilesLoaded()) setMapError(null);
    });
    map.getCanvas().style.cursor = "crosshair";
    let marker: Marker | undefined;
    const select = (latlng: LngLat) => {
      const wrapped = latlng.wrap();
      const latitude = Math.max(-90, Math.min(90, wrapped.lat));
      const longitude = wrapped.lng;
      if (marker) marker.setLngLat([longitude, latitude]);
      else {
        marker = new Marker({ draggable: true, color: "#2563eb" }).setLngLat([longitude, latitude]).addTo(map);
        marker.getElement().setAttribute("aria-label", "Vị trí địa chỉ đã chọn");
        marker.on("dragend", () => select(marker!.getLngLat()));
      }
      setSelected({ latitude, longitude });
    };
    selectRef.current = select;
    if (point) select(new LngLat(point.longitude, point.latitude));
    map.on("click", event => select(event.lngLat));
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => {
      active = false;
      observer.disconnect();
      marker?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <section className="address-map-picker field-span" aria-label="Chọn vị trí địa chỉ trên bản đồ">
    <p>Nhấn vào bản đồ hoặc kéo ghim đến địa chỉ của bạn, sau đó bấm “Dùng vị trí này”.</p>
    <div ref={container} className="address-map-picker-canvas" />
    {mapError && <p role="status">{mapError}</p>}
    <p aria-live="polite">{selected ? `Vĩ độ: ${selected.latitude.toFixed(6)} · Kinh độ: ${selected.longitude.toFixed(6)}` : "Chưa chọn vị trí."}</p>
    <div className="address-location-actions">
      <button type="button" className="outline-button" onClick={() => { if (mapRef.current) selectRef.current(mapRef.current.getCenter()); }}>Chọn tâm bản đồ</button>
      <button type="button" className="outline-button" onClick={onCancel}>Hủy chọn</button>
      <button type="button" className="primary-button" disabled={!selected} onClick={() => { if (selected) onConfirm(selected); }}>Dùng vị trí này</button>
    </div>
  </section>;
}

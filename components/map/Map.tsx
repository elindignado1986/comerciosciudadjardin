"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { bounds, center, isInsideCiudadJardin } from "@/lib/map/boundary";
import { baseStyle } from "@/lib/map/layers/baseLayer";
import { addBoundary } from "@/lib/map/layers/boundaryLayer";
import { markerElement } from "@/lib/map/layers/businessLayer";
import type { PublicBusiness } from "@/lib/types";
type Props = {
  businesses?: PublicBusiness[];
  onSelect?: (b: PublicBusiness) => void;
  editable?: boolean;
  point?: [number, number] | null;
  onPoint?: (point: [number, number]) => void;
  onInvalid?: () => void;
  focus?: [number, number] | null;
};
export default function NeighborhoodMap({
  businesses = [],
  onSelect,
  editable = false,
  point,
  onPoint,
  onInvalid,
  focus,
}: Props) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<maplibregl.Map | null>(null),
    pin = useRef<maplibregl.Marker | null>(null);
  const callbacks = useRef({ onSelect, onPoint, onInvalid });
  const [error, setError] = useState("");
  useEffect(() => {
    callbacks.current = { onSelect, onPoint, onInvalid };
  }, [onSelect, onPoint, onInvalid]);
  useEffect(() => {
    if (!container.current) return;
    // Next.js does not emit the worker and its shared module together.
    maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    const m = new maplibregl.Map({
      container: container.current,
      style: baseStyle(),
      center,
      zoom: 14,
      pitch: 0,
      maxPitch: 0,
      dragRotate: false,
      touchPitch: false,
      maxZoom: 19,
      minZoom: 12,
      attributionControl: { compact: true },
      bounds: [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      fitBoundsOptions: { padding: 45 },
    });
    map.current = m;
    m.touchZoomRotate.disableRotation();
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    m.on("error", (event) => {
      console.error("Error de cartografía (MapLibre):", event.error);
      setError(
        "La cartografía no pudo cargarse completamente. Verificá tu conexión o el proveedor de mapas.",
      );
    });
    m.on("load", () => {
      for (const layer of m.getStyle().layers || []) {
        const id = layer.id.toLowerCase();
        if (layer.type === "fill-extrusion" || /poi|housenumber/.test(id))
          m.setLayoutProperty(layer.id, "visibility", "none");
        if (layer.type === "background")
          m.setPaintProperty(layer.id, "background-color", "#f5f3eb");
        if (layer.type === "fill" && /park|grass|wood|landcover/.test(id))
          m.setPaintProperty(layer.id, "fill-color", "#d6deca");
        if (layer.type === "fill" && /building/.test(id))
          m.setPaintProperty(layer.id, "fill-color", "#deddd2");
      }
      addBoundary(m);
      setError("");
    });
    if (editable)
      m.on("click", (e) => {
        if (isInsideCiudadJardin(e.lngLat.lat, e.lngLat.lng))
          callbacks.current.onPoint?.([e.lngLat.lng, e.lngLat.lat]);
        else callbacks.current.onInvalid?.();
      });
    return () => {
      m.remove();
      map.current = null;
    };
  }, [editable]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const markers = businesses.map((b) => {
      const el = markerElement(b);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        callbacks.current.onSelect?.(b);
      });
      return new maplibregl.Marker({ element: el })
        .setLngLat([b.lng, b.lat])
        .addTo(m);
    });
    return () => markers.forEach((marker) => marker.remove());
  }, [businesses]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    pin.current?.remove();
    if (!point) return;
    const el = document.createElement("div");
    el.className = "selection-marker";
    el.textContent = "+";
    const marker = new maplibregl.Marker({ element: el, draggable: editable })
      .setLngLat(point)
      .addTo(m);
    pin.current = marker;
    marker.on("dragend", () => {
      const p = marker.getLngLat();
      if (isInsideCiudadJardin(p.lat, p.lng))
        callbacks.current.onPoint?.([p.lng, p.lat]);
      else {
        marker.setLngLat(point);
        callbacks.current.onInvalid?.();
      }
    });
    return () => {
      marker.remove();
    };
  }, [point, editable]);
  useEffect(() => {
    if (focus) map.current?.flyTo({ center: focus, zoom: 16, duration: 700 });
  }, [focus]);
  return (
    <div className="map-frame">
      <div
        className="map-canvas"
        ref={container}
        aria-label={
          editable
            ? "Seleccioná la ubicación del comercio en Ciudad Jardín"
            : "Mapa de comercios de Ciudad Jardín"
        }
      />
      {error && (
        <div className="map-error" role="status">
          {error}
        </div>
      )}
    </div>
  );
}

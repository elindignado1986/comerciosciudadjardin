"use client";
import dynamic from "next/dynamic";
const MapLoader = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">Preparando el mapa de Ciudad Jardín…</div>
  ),
});
export default MapLoader;

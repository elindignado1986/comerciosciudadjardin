import data from "@/data/ciudad-jardin-boundary.json";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import bbox from "@turf/bbox";
import type { Feature, Polygon, MultiPolygon } from "geojson";
export const boundary = data as Feature<Polygon | MultiPolygon>;
export const bounds = bbox(boundary) as [number, number, number, number];
export const center: [number, number] = [
  (bounds[0] + bounds[2]) / 2,
  (bounds[1] + bounds[3]) / 2,
];
export function isInsideCiudadJardin(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    booleanPointInPolygon([lng, lat], boundary)
  );
}

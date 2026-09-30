import type { Map } from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
export function addVegetation(map: Map, data: FeatureCollection<Point>) {
  map.addSource("vegetation", { type: "geojson", data });
  map.addLayer({
    id: "vegetation",
    type: "circle",
    source: "vegetation",
    minzoom: 16,
    paint: { "circle-radius": 4, "circle-color": "#8ea57a" },
  });
}

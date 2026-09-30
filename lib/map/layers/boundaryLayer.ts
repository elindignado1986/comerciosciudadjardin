import type { Map } from "maplibre-gl";
import { boundary } from "../boundary";
import difference from "@turf/difference";
import { featureCollection, polygon } from "@turf/helpers";
export function addBoundary(map: Map) {
  const outside = difference(
    featureCollection([
      polygon([
        [
          [-179, -80],
          [179, -80],
          [179, 80],
          [-179, 80],
          [-179, -80],
        ],
      ]),
      boundary,
    ]),
  );
  map.addSource("neighborhood", { type: "geojson", data: boundary });
  if (outside) {
    map.addSource("outside", { type: "geojson", data: outside });
    map.addLayer({
      id: "outside-wash",
      type: "fill",
      source: "outside",
      paint: { "fill-color": "#ebece7", "fill-opacity": 0.85 },
    });
  }
  map.addLayer({
    id: "neighborhood-outline",
    type: "line",
    source: "neighborhood",
    paint: {
      "line-color": "#718975",
      "line-width": 2,
      "line-dasharray": [3, 3],
    },
  });
}

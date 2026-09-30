import type {
  Map,
  ImageSourceSpecification,
  RasterSourceSpecification,
} from "maplibre-gl";
export function addIllustratedLayer(
  map: Map,
  source: ImageSourceSpecification | RasterSourceSpecification,
  opacity = 1,
) {
  map.addSource("illustrated", source);
  map.addLayer(
    {
      id: "illustrated",
      type: "raster",
      source: "illustrated",
      paint: { "raster-opacity": opacity },
    },
    map.getLayer("outside-wash") ? "outside-wash" : undefined,
  );
}

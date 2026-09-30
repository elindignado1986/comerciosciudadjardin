import type { StyleSpecification } from "maplibre-gl";
export function baseStyle(): string | StyleSpecification {
  const url = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (url)
    return url.replace(
      "{key}",
      encodeURIComponent(process.env.NEXT_PUBLIC_TILE_PROVIDER_KEY || ""),
    );
  // OpenFreeMap public vector service; a configurable provider, never OSM standard tiles.
  return "https://tiles.openfreemap.org/styles/liberty";
}

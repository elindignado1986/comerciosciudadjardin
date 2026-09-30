import fs from "node:fs/promises";
import osmtogeojson from "osmtogeojson";
import booleanValid from "@turf/boolean-valid";
import bbox from "@turf/bbox";
const id = 2442850;
const source = `https://www.openstreetmap.org/api/0.6/relation/${id}/full.json`;
const response = await fetch(source, {
  signal: AbortSignal.timeout(60000),
  headers: {
    "User-Agent": "CiudadJardinCommunityMap/0.1 (boundary maintenance)",
  },
});
if (!response.ok) throw new Error(`OSM ${response.status}`);
const raw = await response.json();
const relation = raw.elements.find(
  (e: { type: string; id: number }) => e.type === "relation" && e.id === id,
);
if (
  !/^Ciudad Jardín Lomas (del|de El) Palomar$/i.test(relation?.tags?.name || "")
)
  throw new Error("La relación no corresponde a Ciudad Jardín");
const collection = osmtogeojson(raw);
const boundary = collection.features.find((f) => f.id === `relation/${id}`);
if (
  !boundary ||
  !["Polygon", "MultiPolygon"].includes(boundary.geometry.type) ||
  !booleanValid(boundary)
)
  throw new Error("Geometría inválida");
const extent = bbox(boundary);
if (
  extent[0] < -58.7 ||
  extent[2] > -58.5 ||
  extent[1] < -34.7 ||
  extent[3] > -34.5
)
  throw new Error(
    "La relación cambió de ámbito geográfico. Revisar antes de actualizar.",
  );
boundary.properties = {
  ...boundary.properties,
  source,
  fetched_at: new Date().toISOString(),
  license: "ODbL 1.0 · © OpenStreetMap contributors",
};
await fs.mkdir("data", { recursive: true });
await fs.writeFile(
  "data/ciudad-jardin-boundary.geojson",
  JSON.stringify(boundary, null, 2),
);
await fs.writeFile(
  "data/ciudad-jardin-boundary.json",
  JSON.stringify(boundary),
);
await fs.mkdir("supabase/migrations", { recursive: true });
const geometry = JSON.stringify(boundary.geometry).replaceAll("'", "''");
const sql = `-- Generated from ${source} at ${boundary.properties.fetched_at}\ninsert into public.app_boundary (id, geom) values (1, st_setsrid(st_geomfromgeojson('${geometry}'),4326)) on conflict (id) do update set geom=excluded.geom;\n`;
await fs.writeFile(
  `supabase/migrations/${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}_boundary.sql`,
  sql,
);
console.log(
  "Boundary validado:",
  relation.tags.name,
  boundary.geometry.type,
  boundary.properties.fetched_at,
);

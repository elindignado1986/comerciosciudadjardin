import { isInsideCiudadJardin, center } from "@/lib/map/boundary";
import type { SearchResult } from "@/lib/types";
export interface GeocoderProvider {
  search(query: string): Promise<SearchResult[]>;
  reverse(lat: number, lng: number): Promise<string | null>;
}
const base =
  process.env.GEOREF_API_URL || "https://apis.datos.gob.ar/georef/api/v2.0";
async function json(url: string) {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(9000),
    next: { revalidate: 86400 },
  });
  if (!r.ok) throw new Error("Geocoder unavailable");
  return r.json();
}
export class GeorefProvider implements GeocoderProvider {
  async streets(name: string) {
    return json(
      `${base}/calles?${new URLSearchParams({ nombre: name, provincia: "06", departamento: "Tres de Febrero", max: "5" })}`,
    );
  }
  async search(query: string): Promise<SearchResult[]> {
    const normalized = query
      .trim()
      .replace(/^wernicke\b/i, "Aviador German Wernicke");
    const params = new URLSearchParams({
      direccion: normalized,
      provincia: "06",
      departamento: "Tres de Febrero",
      max: "8",
    });
    const data = await json(`${base}/direcciones?${params}`);
    return (data.direcciones || []).flatMap(
      (d: {
        ubicacion?: { lat: number; lon: number };
        nomenclatura: string;
      }) => {
        const lat = d.ubicacion?.lat,
          lng = d.ubicacion?.lon;
        return typeof lat === "number" && typeof lng === "number"
          ? [
              {
                label: d.nomenclatura,
                lat,
                lng,
                source: "georef",
                inside: isInsideCiudadJardin(lat, lng),
              },
            ]
          : [];
      },
    );
  }
  async reverse(lat: number, lng: number) {
    const d = await json(`${base}/ubicacion?lat=${lat}&lon=${lng}`);
    return (
      d.ubicacion?.localidad_censal?.nombre ||
      d.ubicacion?.municipio?.nombre ||
      null
    );
  }
}
export class OsmProvider implements GeocoderProvider {
  private url =
    process.env.PHOTON_API_URL ||
    (process.env.NODE_ENV === "development" ? "https://photon.komoot.io" : "");
  async search(query: string): Promise<SearchResult[]> {
    if (!this.url) return [];
    const data = await json(
      `${this.url}/api/?${new URLSearchParams({ q: `${query} Ciudad Jardín Buenos Aires`, lat: String(center[1]), lon: String(center[0]), limit: "5" })}`,
    );
    return (data.features || []).flatMap(
      (f: {
        geometry: { coordinates: number[] };
        properties: Record<string, string>;
      }) => {
        const [lng, lat] = f.geometry.coordinates,
          p = f.properties;
        return [
          {
            label: [p.name, p.street, p.housenumber, p.city]
              .filter(Boolean)
              .join(" "),
            lat,
            lng,
            source: "photon",
            inside: isInsideCiudadJardin(lat, lng),
          },
        ];
      },
    );
  }
  async reverse(lat: number, lng: number) {
    if (!this.url) return null;
    const data = await json(`${this.url}/reverse?lat=${lat}&lon=${lng}`);
    const p = data.features?.[0]?.properties;
    return p ? [p.street, p.housenumber].filter(Boolean).join(" ") : null;
  }
}

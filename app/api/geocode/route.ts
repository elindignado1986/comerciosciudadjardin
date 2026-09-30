import { GeorefProvider, OsmProvider } from "@/lib/geocoding/providers";
import { apiError, rateLimit } from "@/lib/security";
import { configured } from "@/lib/supabase/server";
import { isInsideCiudadJardin } from "@/lib/map/boundary";
export async function GET(req: Request) {
  try {
    if (configured()) await rateLimit(req, "geocode", 60);
    const params = new URL(req.url).searchParams;
    const q = params.get("q")?.trim();
    if (!q || q.length < 3 || q.length > 250)
      return Response.json(
        { error: "Escribí una calle y altura." },
        { status: 400 },
      );
    const primary = new GeorefProvider();
    let results = await primary.search(q).catch(() => []);
    if (!results.some((r) => r.inside))
      results = [
        ...results,
        ...(await new OsmProvider().search(q).catch(() => [])),
      ];
    results = results.filter((r) => isInsideCiudadJardin(r.lat, r.lng));
    return Response.json({
      results,
      streets: [],
      message: results.length
        ? ""
        : "No encontramos esa dirección dentro de Ciudad Jardín. Podés marcar el comercio manualmente en el mapa.",
    });
  } catch (e) {
    return apiError(e);
  }
}

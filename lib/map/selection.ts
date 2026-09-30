import { isInsideCiudadJardin } from "./boundary";

export function selectedPoint(
  lat: string | string[] | undefined,
  lng: string | string[] | undefined,
): [number, number] | null {
  if (
    typeof lat !== "string" ||
    typeof lng !== "string" ||
    !lat.trim() ||
    !lng.trim()
  )
    return null;
  const latitude = Number(lat),
    longitude = Number(lng);
  return isInsideCiudadJardin(latitude, longitude)
    ? [longitude, latitude]
    : null;
}

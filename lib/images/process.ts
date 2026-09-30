import "server-only";
import sharp from "sharp";
import { HttpError } from "@/lib/http-error";
export async function processEvidence(file: File) {
  if (file.size > 8 * 1024 * 1024)
    throw new HttpError(413, "La foto debe pesar menos de 8 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  const image = sharp(input, { limitInputPixels: 40000000, animated: false });
  let meta;
  try {
    meta = await image.metadata();
  } catch {
    throw new HttpError(400, "La fotografía no es válida.");
  }
  const formats: Record<string, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  if (
    !meta.format ||
    formats[meta.format] !== file.type ||
    (meta.pages || 1) > 1 ||
    !meta.width ||
    !meta.height ||
    meta.width > 12000 ||
    meta.height > 12000
  )
    throw new HttpError(
      400,
      "Usá una imagen JPEG, PNG o WebP de hasta 12.000 px y 40 megapíxeles.",
    );
  return image
    .rotate()
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 76 })
    .toBuffer();
}

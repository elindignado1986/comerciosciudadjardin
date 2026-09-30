import { z } from "zod";
import { categories, reportTypes } from "@/lib/config";
import { isInsideCiudadJardin } from "@/lib/map/boundary";
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[<>\u0000-\u0008]/.test(v),
      "No se admite HTML ni caracteres de control.",
    );
export const businessFields = z.object({
  name: text(140).pipe(z.string().min(2)),
  address_input: text(250).pipe(z.string().min(3)),
  address_normalized: text(300).pipe(z.string().min(3)),
  lat: z.number().finite(),
  lng: z.number().finite(),
  category: z.enum(categories),
  adhesion: z.enum(["ADHERIDO", "SIN_ADHESION"]),
  geocoder_source: z.enum(["georef", "photon", "manual"]).default("manual"),
  geocoder_confidence: z.number().min(0).max(1).nullable().optional(),
  manually_adjusted: z.boolean().default(false),
  evidence: text(3000).default(""),
});
export const businessSchema = businessFields.refine(
  (v) => isInsideCiudadJardin(v.lat, v.lng),
  "Esta ubicación está fuera de Ciudad Jardín.",
);
export const submissionSchema = businessFields
  .extend({
    comment: text(3000).default(""),
    sender_name: text(120).default(""),
    sender_email: z.union([z.email(), z.literal("")]).default(""),
    terms: z.literal(true),
    location_confirmed: z.literal(true),
    captcha: z.string().max(2048),
  })
  .refine(
    (v) => isInsideCiudadJardin(v.lat, v.lng),
    "Esta ubicación está fuera de Ciudad Jardín.",
  );
export const reportSchema = z.object({
  business_id: z.uuid(),
  type: z.enum(
    Object.keys(reportTypes) as [
      keyof typeof reportTypes,
      ...(keyof typeof reportTypes)[],
    ],
  ),
  comment: text(3000).default(""),
  captcha: z.string().max(2048),
});
export function isBusinessCode(value: string) {
  return /^CJ-\d{4,}$/.test(value);
}

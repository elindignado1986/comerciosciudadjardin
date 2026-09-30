import { randomUUID } from "node:crypto";
import { submissionSchema } from "@/lib/validation";
import {
  apiError,
  checkOrigin,
  checkSize,
  rateLimit,
  verifyCaptcha,
  readMultipart,
} from "@/lib/security";
import { serviceDb } from "@/lib/supabase/server";
import { processEvidence } from "@/lib/images/process";
import { HttpError } from "@/lib/auth/admin";
export async function POST(req: Request) {
  let photoPath: string | undefined;
  try {
    checkOrigin(req);
    checkSize(req, 9 * 1024 * 1024);
    await rateLimit(req, "submission");
    const form = await readMultipart(req);
    const raw = form.get("data");
    if (typeof raw !== "string" || raw.length > 20000)
      throw new HttpError(400, "Formulario inválido.");
    const parsed = submissionSchema.parse(JSON.parse(raw));
    await verifyCaptcha(parsed.captcha);
    const db = serviceDb();
    const file = form.get("photo");
    if (file instanceof File && file.size) {
      const buffer = await processEvidence(file);
      photoPath = `${randomUUID()}.webp`;
      const { error } = await db.storage
        .from("evidence")
        .upload(photoPath, buffer, {
          contentType: "image/webp",
          upsert: false,
        });
      if (error) throw error;
    }
    const { captcha, terms, location_confirmed, ...data } = parsed;
    void captcha;
    void terms;
    void location_confirmed;
    const { error } = await db
      .from("business_submissions")
      .insert({ ...data, status: "PENDING", photo_path: photoPath });
    if (error) throw error;
    return Response.json(
      {
        ok: true,
        message:
          "Recibimos tu propuesta. Un administrador la revisará antes de publicarla.",
      },
      { status: 201 },
    );
  } catch (e) {
    if (photoPath)
      await serviceDb().storage.from("evidence").remove([photoPath]);
    return apiError(e);
  }
}

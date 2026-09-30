import { reportSchema } from "@/lib/validation";
import {
  apiError,
  checkOrigin,
  checkSize,
  rateLimit,
  verifyCaptcha,
  readJson,
} from "@/lib/security";
import { serviceDb } from "@/lib/supabase/server";
import { HttpError } from "@/lib/auth/admin";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    checkSize(req, 12000);
    await rateLimit(req, "report");
    const { captcha, ...data } = reportSchema.parse(await readJson(req, 12000));
    await verifyCaptcha(captcha);
    const db = serviceDb();
    const { data: business } = await db
      .from("public_businesses")
      .select("id")
      .eq("id", data.business_id)
      .maybeSingle();
    if (!business) throw new HttpError(404, "Comercio no encontrado.");
    const { error } = await db.from("business_reports").insert(data);
    if (error) throw error;
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

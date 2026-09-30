import { z } from "zod";
import { requireAdmin, HttpError } from "@/lib/auth/admin";
import { apiError, checkOrigin, checkSize, readJson } from "@/lib/security";
import { businessSchema } from "@/lib/validation";
const actionSchema = z.object({
  action: z.enum([
    "create",
    "edit",
    "approve",
    "reject",
    "qr_status",
    "delete",
    "resolve",
  ]),
  id: z.uuid().optional(),
  entity: z.enum(["businesses", "business_submissions"]).default("businesses"),
  data: z.unknown().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "REVOKED"]).optional(),
});
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    checkSize(req, 24000);
    const { db, user } = await requireAdmin();
    const a = actionSchema.parse(await readJson(req));
    if (a.action !== "create" && !a.id)
      throw new HttpError(400, "Falta el identificador.");
    if (a.action === "approve") {
      const { data, error } = await db.rpc("approve_submission", {
        submission_id: a.id,
      });
      if (error) throw error;
      return Response.json({ ok: true, id: data });
    }
    if (a.action === "reject") {
      const { data, error } = await db
        .from("business_submissions")
        .update({
          status: "REJECTED",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", a.id)
        .eq("status", "PENDING")
        .select("id")
        .single();
      if (error || !data)
        throw error || new HttpError(409, "La propuesta ya fue revisada.");
      return Response.json({ ok: true });
    }
    if (a.action === "resolve") {
      const { error } = await db
        .from("business_reports")
        .update({ status: "RESOLVED" })
        .eq("id", a.id);
      if (error) throw error;
      return Response.json({ ok: true });
    }
    if (a.action === "qr_status") {
      if (!a.status) throw new HttpError(400, "Falta el estado.");
      const { data: business } = await db
        .from("businesses")
        .select("qr_status,adhesion")
        .eq("id", a.id)
        .single();
      if (!business) throw new HttpError(404, "Comercio no encontrado.");
      if (business.qr_status === "REVOKED" && a.status !== "REVOKED")
        throw new HttpError(409, "Una placa revocada no puede reactivarse.");
      const { error } = await db
        .from("businesses")
        .update({ qr_status: a.status })
        .eq("id", a.id);
      if (error) throw error;
      return Response.json({ ok: true });
    }
    if (a.action === "delete") {
      const { error } = await db
        .from("businesses")
        .update({ deleted_at: new Date().toISOString(), qr_status: "REVOKED" })
        .eq("id", a.id);
      if (error) throw error;
      return Response.json({ ok: true });
    }
    const values = businessSchema.parse(a.data);
    if (a.action === "create") {
      const { data, error } = await db
        .from("businesses")
        .insert({
          ...values,
          adhesion_date:
            values.adhesion === "ADHERIDO"
              ? new Date().toISOString().slice(0, 10)
              : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return Response.json({ ok: true, id: data.id });
    }
    let updateValues: Record<string, unknown> = values;
    if (a.entity === "businesses") {
      const { data: old } = await db
        .from("businesses")
        .select("adhesion,adhesion_date")
        .eq("id", a.id)
        .single();
      updateValues = {
        ...values,
        adhesion_date:
          values.adhesion === "ADHERIDO"
            ? old?.adhesion_date || new Date().toISOString().slice(0, 10)
            : null,
      };
    }
    let query = db.from(a.entity).update(updateValues).eq("id", a.id);
    if (a.entity === "business_submissions")
      query = query.eq("status", "PENDING");
    const { data, error } = await query.select("id").single();
    if (error || !data) throw error || new HttpError(409, "No se pudo editar.");
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

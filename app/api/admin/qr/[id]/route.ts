import { z } from "zod";
import QRCode from "qrcode";
import fs from "node:fs/promises";
import path from "node:path";
import { requireAdmin, HttpError } from "@/lib/auth/admin";
import { serviceDb } from "@/lib/supabase/server";
import { apiError, checkOrigin } from "@/lib/security";
import { qrFilename } from "@/lib/qr/filename";
import { appUrl } from "@/lib/config";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const { db } = await requireAdmin();
    const { id } = await params;
    z.uuid().parse(id);
    const { data: b } = await db
      .from("businesses")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    if (!b) throw new HttpError(404, "Comercio no encontrado.");
    const { data: existing } = await db
      .from("qr_codes")
      .select("*")
      .eq("business_id", id)
      .maybeSingle();
    if (existing)
      return Response.json({ ok: true, download: `/api/admin/qr/${id}` });
    let filename = qrFilename(b.name, b.address_normalized);
    const { data: collision } = await db
      .from("qr_codes")
      .select("id")
      .eq("filename", filename)
      .maybeSingle();
    if (collision) filename = qrFilename(b.name, b.address_normalized, b.code);
    const url = `${appUrl()}/v/${b.code}`,
      storagePath = `${b.code}/${filename}`;
    const buffer = await QRCode.toBuffer(url, {
      type: "png",
      width: 1000,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#193d30", light: "#ffffff" },
    });
    const { error: upload } = await serviceDb()
      .storage.from("qr-codes")
      .upload(storagePath, buffer, { contentType: "image/png", upsert: true });
    if (upload) throw upload;
    const { error } = await db
      .from("qr_codes")
      .insert({ business_id: id, path: storagePath, filename, url });
    if (error) throw error;
    if (process.env.NODE_ENV === "development") {
      await fs.mkdir(path.join(process.cwd(), "generated", "qr"), {
        recursive: true,
      });
      await fs.writeFile(
        path.join(process.cwd(), "generated", "qr", filename),
        buffer,
      );
    }
    return Response.json({ ok: true, download: `/api/admin/qr/${id}` });
  } catch (e) {
    return apiError(e);
  }
}
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { db } = await requireAdmin();
    const { id } = await params;
    z.uuid().parse(id);
    const { data } = await db
      .from("qr_codes")
      .select("*")
      .eq("business_id", id)
      .single();
    if (!data) throw new HttpError(404, "Generá el QR primero.");
    const { data: blob, error } = await serviceDb()
      .storage.from("qr-codes")
      .download(data.path);
    if (error) throw error;
    return new Response(await blob.arrayBuffer(), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${data.filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

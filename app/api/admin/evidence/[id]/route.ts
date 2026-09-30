import { z } from "zod";
import { requireAdmin, HttpError } from "@/lib/auth/admin";
import { serviceDb } from "@/lib/supabase/server";
import { apiError } from "@/lib/security";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { db } = await requireAdmin();
    const { id } = await params;
    z.uuid().parse(id);
    const table =
      new URL(req.url).searchParams.get("entity") === "businesses"
        ? "businesses"
        : "business_submissions";
    const { data } = await db
      .from(table)
      .select("photo_path")
      .eq("id", id)
      .single();
    if (!data?.photo_path) throw new HttpError(404, "No hay fotografía.");
    const { data: blob, error } = await serviceDb()
      .storage.from("evidence")
      .download(data.photo_path);
    if (error) throw error;
    return new Response(await blob.arrayBuffer(), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}

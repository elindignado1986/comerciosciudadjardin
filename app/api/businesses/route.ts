import { configured, publicDb } from "@/lib/supabase/server";
import { apiError } from "@/lib/security";
export async function GET() {
  if (!configured())
    return Response.json({ businesses: [], configured: false });
  try {
    const { data, error } = await publicDb()
      .from("public_businesses")
      .select("*")
      .order("name")
      .limit(5000);
    if (error) throw error;
    return Response.json({ businesses: data, configured: true });
  } catch (e) {
    return apiError(e);
  }
}

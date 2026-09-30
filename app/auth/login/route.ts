import { sessionDb } from "@/lib/supabase/server";
import { appUrl } from "@/lib/config";
import { apiError } from "@/lib/security";
export async function GET() {
  try {
    const db = await sessionDb();
    const { data, error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${appUrl()}/auth/callback` },
    });
    if (error || !data.url) throw error;
    return Response.redirect(data.url);
  } catch (e) {
    return apiError(e);
  }
}

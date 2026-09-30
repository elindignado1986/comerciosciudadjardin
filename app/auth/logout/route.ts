import { sessionDb } from "@/lib/supabase/server";
import { appUrl } from "@/lib/config";
import { apiError, checkOrigin } from "@/lib/security";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await (await sessionDb()).auth.signOut();
    return Response.redirect(appUrl(), 303);
  } catch (e) {
    return apiError(e);
  }
}

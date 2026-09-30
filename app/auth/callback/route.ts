import { sessionDb } from "@/lib/supabase/server";
import { appUrl } from "@/lib/config";
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (code) {
    const db = await sessionDb();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return Response.redirect(`${appUrl()}/admin`);
  }
  return Response.redirect(`${appUrl()}/admin?error=auth`);
}

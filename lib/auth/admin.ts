import "server-only";
import { sessionDb } from "@/lib/supabase/server";
import { HttpError } from "@/lib/http-error";
export { HttpError } from "@/lib/http-error";
export async function requireAdmin() {
  const db = await sessionDb();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new HttpError(401, "Iniciá sesión para continuar.");
  const { data } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data)
    throw new HttpError(403, "Esta cuenta no tiene permiso de administrador.");
  return { db, user };
}

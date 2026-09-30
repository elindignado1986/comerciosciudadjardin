import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function publicDb() {
  // Public read permissions, even when called from a server component or route.
  if (!configured()) throw new Error("Falta configurar Supabase.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}
export function serviceDb() {
  // Privileged backend only: this module is protected by the server-only boundary.
  if (!configured() || !process.env.SUPABASE_SECRET_KEY)
    throw new Error("Falta configurar Supabase en el servidor.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false } },
  );
}
export async function sessionDb() {
  // Publishable key + user cookies preserves authenticated RLS and audit identity.
  const jar = await cookies();
  if (!configured()) throw new Error("Falta configurar Supabase.");
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Read-only server render; route handlers refresh cookies. */
          }
        },
      },
    },
  );
}

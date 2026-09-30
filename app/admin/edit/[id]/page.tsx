import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { configured } from "@/lib/supabase/server";
import BusinessEditor from "@/components/admin/BusinessEditor";
export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ entity?: string }>;
}) {
  if (!configured()) return null;
  let auth;
  try {
    auth = await requireAdmin();
  } catch {
    return null;
  }
  const { id } = await params,
    { entity } = await searchParams,
    table =
      entity === "business_submissions" ? "business_submissions" : "businesses";
  if (id === "new") return <BusinessEditor entity="businesses" record={null} />;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data, error } = await auth.db
    .from(table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  return <BusinessEditor entity={table} record={data} />;
}

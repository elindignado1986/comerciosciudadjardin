import Link from "next/link";
import { notFound } from "next/navigation";
import { publicDb, configured } from "@/lib/supabase/server";
import { isBusinessCode } from "@/lib/validation";
import Brand from "@/components/ui/Brand";
import ReportForm from "@/components/verification/ReportForm";
import type { PublicBusiness } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function Verification({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!isBusinessCode(code)) notFound();
  if (!configured())
    return (
      <main className="prose-page">
        <Brand />
        <h1>Verificación no disponible</h1>
        <p>
          La base de datos todavía no está conectada. No podemos confirmar la
          vigencia de esta placa.
        </p>
        <Link href="/">Volver al mapa</Link>
      </main>
    );
  const { data, error } = await publicDb()
    .from("public_businesses")
    .select(
      "id,code,name,address_normalized,lat,lng,adhesion,qr_status,adhesion_date",
    )
    .eq("code", code)
    .maybeSingle();
  if (error)
    throw new Error("No se pudo consultar el estado actual de la placa.");
  if (!data) notFound();
  const b = data as PublicBusiness,
    active = b.adhesion === "ADHERIDO" && b.qr_status === "ACTIVE";
  const text =
    b.qr_status === "SUSPENDED"
      ? "Esta adhesión se encuentra temporalmente suspendida."
      : b.qr_status === "REVOKED"
        ? "Esta placa ya no acredita una adhesión vigente."
        : active
          ? "Comercio adherido a la preservación del patrimonio urbano de Ciudad Jardín."
          : "Sin adhesión registrada.";
  return (
    <>
      <header className="site-header">
        <Brand />
        <Link href="/">Ver el mapa ↗</Link>
      </header>
      <main className="prose-page">
        <div className="eyebrow">FICHA PÚBLICA · VERIFICACIÓN DE PLACA</div>
        <article className="verification-card">
          <p className="verification-code">{b.code}</p>
          <h1>{b.name}</h1>
          <p>{b.address_normalized}</p>
          <div className={`verification-status ${active ? "" : "neutral"}`}>
            <strong>
              {active
                ? "✓ ADHESIÓN VERIFICADA"
                : b.qr_status === "ACTIVE"
                  ? "◇ SIN ADHESIÓN REGISTRADA"
                  : b.qr_status === "SUSPENDED"
                    ? "◇ ADHESIÓN SUSPENDIDA"
                    : "◇ PLACA REVOCADA"}
            </strong>
            <p>{text}</p>
          </div>
          <dl>
            <div>
              <dt>Estado de verificación</dt>
              <dd>
                {active
                  ? "Vigente"
                  : b.qr_status === "SUSPENDED"
                    ? "Suspendida"
                    : b.qr_status === "REVOKED"
                      ? "Revocada"
                      : "Sin adhesión registrada"}
              </dd>
            </div>
            {b.adhesion_date && (
              <div>
                <dt>Fecha de adhesión</dt>
                <dd>
                  {new Date(`${b.adhesion_date}T12:00:00`).toLocaleDateString(
                    "es-AR",
                  )}
                </dd>
              </div>
            )}
          </dl>
          <Link className="button button-dark" href={`/?code=${b.code}`}>
            Ver en mapa ↗
          </Link>
          <ReportForm
            businessId={b.id}
            siteKey={process.env.TURNSTILE_SITE_KEY || ""}
          />
        </article>
      </main>
    </>
  );
}

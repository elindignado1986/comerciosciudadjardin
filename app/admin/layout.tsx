import Link from "next/link";
import Brand from "@/components/ui/Brand";
import { requireAdmin } from "@/lib/auth/admin";
import { configured } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let authorized = false,
    message = "";
  if (configured()) {
    try {
      await requireAdmin();
      authorized = true;
    } catch (e) {
      message = e instanceof Error ? e.message : "Acceso no disponible.";
    }
  }
  return (
    <>
      <header className="site-header">
        <Brand />
        {authorized ? (
          <form action="/auth/logout" method="post">
            <button className="button">Cerrar sesión</button>
          </form>
        ) : (
          <Link href="/">Volver al mapa ↗</Link>
        )}
      </header>
      {authorized ? (
        <div className="admin-layout">
          <nav className="admin-nav" aria-label="Administración">
            {[
              ["", "Dashboard"],
              ["pending", "Pendientes"],
              ["businesses", "Comercios"],
              ["reports", "Reportes"],
              ["history", "Historial"],
              ["settings", "Configuración"],
            ].map(([id, label]) => (
              <Link href={`/admin?section=${id}`} key={id}>
                {label}
              </Link>
            ))}
          </nav>
          <main className="admin-main">{children}</main>
        </div>
      ) : (
        <main className="prose-page">
          <div className="eyebrow">ACCESO RESTRINGIDO</div>
          <h1>
            Cuidar el mapa
            <br />
            <em>también es un compromiso.</em>
          </h1>
          <p>
            Ingresá con una cuenta de Google autorizada por el equipo
            administrador.
          </p>
          {message && <p className="notice">{message}</p>}
          {configured() ? (
            <Link className="button button-dark" href="/auth/login">
              Continuar con Google ↗
            </Link>
          ) : (
            <p className="notice">
              Para habilitar la administración, conectá Supabase y configurá
              Google OAuth siguiendo el README del proyecto.
            </p>
          )}
        </main>
      )}
    </>
  );
}

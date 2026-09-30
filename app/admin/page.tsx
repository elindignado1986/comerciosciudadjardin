import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { configured } from "@/lib/supabase/server";
import AdminAction from "@/components/admin/AdminAction";
import { reportTypes } from "@/lib/config";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; page?: string; entity?: string }>;
}) {
  if (!configured()) return null;
  let auth;
  try {
    auth = await requireAdmin();
  } catch {
    return null;
  }
  const { db } = auth,
    { section = "", page = "1", entity } = await searchParams;
  const current = Math.max(1, Number.parseInt(page) || 1),
    from = (current - 1) * 50;
  if (section === "settings")
    return (
      <>
        <h1>Configuración</h1>
        <p>
          El nombre, descripción y paleta se centralizan en{" "}
          <code>lib/config.ts</code>.
        </p>
        <div className="editor-detail">
          {[
            ["Supabase", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)],
            ["Secret key (servidor)", Boolean(process.env.SUPABASE_SECRET_KEY)],
            [
              "Turnstile",
              Boolean(
                process.env.TURNSTILE_SITE_KEY &&
                process.env.TURNSTILE_SECRET_KEY,
              ),
            ],
            ["Rate limiting", Boolean(process.env.RATE_LIMIT_SALT)],
            ["Dominio público", Boolean(process.env.NEXT_PUBLIC_APP_URL)],
            [
              "Proveedor de tiles propio",
              Boolean(process.env.NEXT_PUBLIC_MAP_STYLE_URL),
            ],
          ].map(([name, ready]) => (
            <p key={String(name)}>
              {name}:{" "}
              {ready ? "Configurado" : "Pendiente / valor predeterminado"}
            </p>
          ))}
        </div>
        <p>
          El límite local proviene de OSM, relación 2442850. Actualizar con{" "}
          <code>npm run boundary:update</code> y aplicar la nueva migración.
        </p>
      </>
    );
  if (section === "pending" || section === "businesses") {
    const pending = section === "pending";
    let query = db
      .from(pending ? "business_submissions" : "businesses")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + 49);
    query = pending
      ? query.eq("status", "PENDING")
      : query.is("deleted_at", null);
    const { data, error, count } = await query;
    if (error) throw error;
    return (
      <>
        <div className="admin-heading">
          <h1>{pending ? "Propuestas pendientes" : "Comercios"}</h1>
          {!pending && (
            <Link className="button button-dark" href="/admin/edit/new">
              + Crear comercio
            </Link>
          )}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Comercio</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.name}
                    <br />
                    <small>
                      {b.code ||
                        new Date(b.created_at).toLocaleDateString("es-AR")}
                    </small>
                  </td>
                  <td>{b.address_normalized}</td>
                  <td>
                    {b.adhesion}
                    <br />
                    {b.qr_status || b.status}
                  </td>
                  <td>
                    <Link
                      href={`/admin/edit/${b.id}?entity=${pending ? "business_submissions" : "businesses"}`}
                    >
                      Revisar / editar ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.length && (
            <p className="admin-empty">
              No hay{" "}
              {pending ? "propuestas pendientes" : "comercios publicados"}.
            </p>
          )}
        </div>
        <Pagination current={current} total={count || 0} section={section} />
      </>
    );
  }
  if (section === "reports") {
    const { data, error, count } = await db
      .from("business_reports")
      .select("*, businesses(name,code)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + 49);
    if (error) throw error;
    return (
      <>
        <h1>Reportes</h1>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Comercio</th>
                <th>Motivo</th>
                <th>Comentario</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/edit/${r.business_id}`}>
                      {r.businesses?.name}
                    </Link>
                  </td>
                  <td>{reportTypes[r.type as keyof typeof reportTypes]}</td>
                  <td>{r.comment}</td>
                  <td>
                    {r.status === "OPEN" ? (
                      <AdminAction
                        label="Marcar resuelto"
                        payload={{ action: "resolve", id: r.id }}
                      />
                    ) : (
                      "Resuelto"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.length && <p className="admin-empty">No hay reportes.</p>}
        </div>
        <Pagination current={current} total={count || 0} section={section} />
      </>
    );
  }
  if (section === "history") {
    let query = db
      .from("business_history")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .range(from, from + 49);
    if (entity && /^[0-9a-f-]{36}$/i.test(entity))
      query = query.eq("entity_id", entity);
    const { data, error, count } = await query;
    if (error) throw error;
    return (
      <>
        <h1>Historial</h1>
        <p>Registro privado de propuestas, decisiones, cambios y placas.</p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.timestamp).toLocaleString("es-AR")}</td>
                  <td>{h.action}</td>
                  <td>{h.entity}</td>
                  <td>
                    <details>
                      <summary>Ver cambios</summary>
                      <pre className="history-detail">
                        {JSON.stringify(
                          {
                            actor: h.actor,
                            old: h.old_values,
                            new: h.new_values,
                            metadata: h.metadata,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.length && (
            <p className="admin-empty">Todavía no hay actividad.</p>
          )}
        </div>
        <Pagination
          current={current}
          total={count || 0}
          section={section}
          entity={entity}
        />
      </>
    );
  }
  const queries = [
    db
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    db
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("adhesion", "ADHERIDO")
      .eq("qr_status", "ACTIVE")
      .is("deleted_at", null),
    db
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("adhesion", "SIN_ADHESION")
      .is("deleted_at", null),
    db
      .from("business_submissions")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING"),
    db
      .from("business_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "OPEN"),
    ...["ACTIVE", "SUSPENDED", "REVOKED"].map((s) =>
      db
        .from("qr_codes")
        .select("*,businesses!inner(qr_status)", { count: "exact", head: true })
        .eq("businesses.qr_status", s),
    ),
  ];
  const results = await Promise.all(queries);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  return (
    <>
      <div className="eyebrow">EL BARRIO, AL DÍA</div>
      <h1>Panel de administración</h1>
      <p>Revisá aportes, cuidá la información y administrá las adhesiones.</p>
      <div className="stats-grid">
        {[
          "Comercios",
          "Adhesiones vigentes",
          "Sin adhesión",
          "Pendientes",
          "Reportes abiertos",
          "QR activos",
          "QR suspendidos",
          "QR revocados",
        ].map((label, i) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{results[i].count || 0}</strong>
          </div>
        ))}
      </div>
      <Link className="button button-dark" href="/admin?section=pending">
        Revisar propuestas →
      </Link>
    </>
  );
}
function Pagination({
  current,
  total,
  section,
  entity,
}: {
  current: number;
  total: number;
  section: string;
  entity?: string;
}) {
  const base = `/admin?section=${section}${entity ? `&entity=${entity}` : ""}`;
  return (
    <div className="pagination">
      {current > 1 && (
        <Link href={`${base}&page=${current - 1}`}>← Anterior</Link>
      )}
      <span>
        {total} registros · Página {current}
      </span>
      {current * 50 < total && (
        <Link href={`${base}&page=${current + 1}`}>Siguiente →</Link>
      )}
    </div>
  );
}

"use client";
/* Private authenticated evidence must not pass through the public image optimizer. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/config";
import { businessSchema } from "@/lib/validation";
import MapLoader from "@/components/map/MapLoader";
import AddressSearch from "@/components/map/AddressSearch";
type RecordData = {
  id?: string;
  name?: string;
  address_input?: string;
  address_normalized?: string;
  lat?: number;
  lng?: number;
  category?: string;
  adhesion?: string;
  qr_status?: string;
  status?: string;
  code?: string;
  evidence?: string;
  comment?: string;
  sender_name?: string;
  sender_email?: string;
  photo_path?: string;
  created_at?: string;
  geocoder_source?: string;
  geocoder_confidence?: number;
  manually_adjusted?: boolean;
  deleted_at?: string;
};
export default function BusinessEditor({
  entity,
  record,
}: {
  entity: "businesses" | "business_submissions";
  record: RecordData | null;
}) {
  const router = useRouter(),
    pending = entity === "business_submissions",
    r = record || {};
  const [point, setPoint] = useState<[number, number] | null>(
      typeof r.lng === "number" && typeof r.lat === "number"
        ? [r.lng, r.lat]
        : null,
    ),
    [focus, setFocus] = useState<[number, number] | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [source, setSource] = useState(r.geocoder_source || "manual"),
    [adjusted, setAdjusted] = useState(r.manually_adjusted || false);
  async function action(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      return d;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al guardar");
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = businessSchema.safeParse({
      ...Object.fromEntries(f),
      lat: point?.[1],
      lng: point?.[0],
      geocoder_source: source,
      manually_adjusted: adjusted,
    });
    if (!parsed.success) {
      setMessage(parsed.error.issues.map((i) => i.message).join(" "));
      return;
    }
    const d = await action({
      action: r.id ? "edit" : "create",
      id: r.id,
      entity,
      data: parsed.data,
    });
    if (d) {
      setMessage("Cambios guardados.");
      if (!r.id) router.push(`/admin/edit/${d.id}`);
      else router.refresh();
    }
  }
  async function moderate(actionName: string) {
    const d = await action({ action: actionName, id: r.id });
    if (d) {
      router.push(
        actionName === "approve"
          ? `/admin/edit/${d.id}`
          : "/admin?section=pending",
      );
      router.refresh();
    }
  }
  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/qr/${r.id}`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMessage(
        "QR generado y guardado. Usá Descargar QR para obtener el PNG.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="editor">
      <Link
        className="text-link"
        href={`/admin?section=${pending ? "pending" : "businesses"}`}
      >
        ← Volver al listado
      </Link>
      <h1>
        {!r.id ? "Crear comercio" : pending ? "Revisar propuesta" : r.name}
      </h1>
      {r.code && (
        <p className="verification-code">
          {r.code} · {r.qr_status}
        </p>
      )}
      {pending && (
        <div className="editor-detail">
          Propuesta: {r.status}
          <br />
          Remitente: {r.sender_name || "Anónimo"} ·{" "}
          {r.sender_email || "Sin email"}
          <br />
          Fecha:{" "}
          {r.created_at ? new Date(r.created_at).toLocaleString("es-AR") : ""}
          <br />
          Fuente: {r.geocoder_source} · Ajuste manual:{" "}
          {r.manually_adjusted ? "Sí" : "No"}
          <br />
          Confianza: {r.geocoder_confidence ?? "No informada"}
          <br />
          Comentario: {r.comment || "Sin comentario"}
        </div>
      )}
      <form onSubmit={save}>
        <div className="form-grid">
          <label>
            Nombre
            <input name="name" defaultValue={r.name} required maxLength={140} />
          </label>
          <label>
            Categoría
            <select name="category" defaultValue={r.category || "Otros"}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Dirección ingresada
            <input
              name="address_input"
              defaultValue={r.address_input}
              required
              maxLength={250}
            />
          </label>
          <label>
            Dirección normalizada
            <input
              name="address_normalized"
              defaultValue={r.address_normalized}
              required
              maxLength={300}
            />
          </label>
          <label>
            Adhesión
            <select name="adhesion" defaultValue={r.adhesion || "SIN_ADHESION"}>
              <option value="ADHERIDO">Adherido</option>
              <option value="SIN_ADHESION">Sin adhesión registrada</option>
            </select>
          </label>
          <label>
            Evidencia privada
            <textarea
              name="evidence"
              defaultValue={r.evidence}
              maxLength={3000}
            />
          </label>
        </div>
        <AddressSearch
          onResult={(p) => {
            setPoint([p.lng, p.lat]);
            setFocus([p.lng, p.lat]);
            setSource(p.source);
            setAdjusted(false);
          }}
        />
        <div className="picker-map">
          <MapLoader
            editable
            point={point}
            focus={focus}
            onPoint={(p) => {
              setPoint(p);
              setAdjusted(true);
            }}
            onInvalid={() =>
              setMessage("Esta ubicación está fuera de Ciudad Jardín.")
            }
          />
        </div>
        {point && (
          <p className="field-help">
            Coordenadas confirmadas: {point[1].toFixed(6)},{" "}
            {point[0].toFixed(6)}
          </p>
        )}
        <div className="admin-actions">
          <button
            className="button button-dark"
            disabled={busy || Boolean(pending && r.status !== "PENDING")}
          >
            Guardar {pending ? "correcciones" : "comercio"}
          </button>
          {r.name && (
            <Link
              className="button"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.address_normalized} Ciudad Jardín`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Verificar en Google Maps ↗
            </Link>
          )}
        </div>
      </form>
      {r.photo_path && (
        <div>
          <h2>Evidencia fotográfica privada</h2>
          <img
            className="private-photo"
            alt="Evidencia aportada para moderación"
            src={`/api/admin/evidence/${r.id}?entity=${entity}`}
          />
        </div>
      )}
      {pending && r.status === "PENDING" && (
        <div className="admin-actions">
          <button
            className="button button-dark"
            disabled={busy}
            onClick={() => void moderate("approve")}
          >
            Aprobar propuesta guardada
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => void moderate("reject")}
          >
            Rechazar
          </button>
        </div>
      )}
      {!pending && r.id && !r.deleted_at && (
        <>
          <h2 style={{ marginTop: 32 }}>Placa y QR</h2>
          <p>
            El QR siempre abre la misma ficha. Guardá las correcciones antes de
            generar la placa.
          </p>
          <div className="admin-actions">
            <button
              className="button button-dark"
              disabled={busy}
              onClick={() => void generate()}
            >
              Generar QR
            </button>
            <Link className="button" href={`/api/admin/qr/${r.id}`}>
              Descargar QR PNG
            </Link>
            {[
              ["ACTIVE", "Activar QR"],
              ["SUSPENDED", "Suspender QR"],
              ["REVOKED", "Revocar QR"],
            ].map(([s, label]) => (
              <button
                className="button"
                key={s}
                disabled={
                  busy || r.qr_status === "REVOKED" || r.qr_status === s
                }
                onClick={async () => {
                  if (
                    s === "REVOKED" &&
                    !confirm("Revocar esta placa es permanente. ¿Continuar?")
                  )
                    return;
                  if (
                    await action({ action: "qr_status", id: r.id, status: s })
                  )
                    router.refresh();
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="admin-actions">
            <Link className="button" href={`/v/${r.code}`} target="_blank">
              Ver ficha ↗
            </Link>
            <Link
              className="button"
              href={`/admin?section=history&entity=${r.id}`}
            >
              Ver historial
            </Link>
            <button
              className="button"
              disabled={busy}
              onClick={async () => {
                if (
                  !confirm(
                    "¿Dar de baja este comercio? Se conservará el historial.",
                  )
                )
                  return;
                if (await action({ action: "delete", id: r.id })) {
                  router.push("/admin?section=businesses");
                  router.refresh();
                }
              }}
            >
              Dar de baja
            </button>
          </div>
        </>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

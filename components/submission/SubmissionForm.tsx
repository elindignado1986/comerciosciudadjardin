"use client";
import Link from "next/link";

import { useState } from "react";
import { Check, MapPin, Send } from "lucide-react";
import MapLoader from "@/components/map/MapLoader";
import AddressSearch from "@/components/map/AddressSearch";
import Turnstile from "@/components/ui/Turnstile";
import { categories } from "@/lib/config";
import { submissionSchema } from "@/lib/validation";
import type { PublicBusiness } from "@/lib/types";
export default function SubmissionForm({
  siteKey,
  initialPoint = null,
}: {
  siteKey: string;
  initialPoint?: [number, number] | null;
}) {
  const [point, setPoint] = useState<[number, number] | null>(initialPoint),
    [focus, setFocus] = useState<[number, number] | null>(initialPoint),
    [address, setAddress] = useState(""),
    [source, setSource] = useState("manual"),
    [adjusted, setAdjusted] = useState(Boolean(initialPoint)),
    [confirmed, setConfirmed] = useState(false),
    [token, setToken] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [duplicates, setDuplicates] = useState<PublicBusiness[]>([]),
    [captchaKey, setCaptchaKey] = useState(0);
  async function findDuplicates(name: string) {
    try {
      const d = await fetch("/api/businesses").then((r) => r.json());
      const normalize = (s: string) =>
        s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      setDuplicates(
        (d.businesses || [])
          .filter(
            (b: PublicBusiness) =>
              (name.length > 2 &&
                normalize(b.name).includes(normalize(name))) ||
              (address.length > 4 &&
                normalize(b.address_normalized).includes(normalize(address))) ||
              (point &&
                Math.hypot((b.lng - point[0]) * 0.82, b.lat - point[1]) <
                  0.00065),
          )
          .slice(0, 4),
      );
    } catch {
      /* Duplicate warnings do not block proposals. */
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!point) {
      setStatus("Seleccioná una ubicación en el mapa.");
      return;
    }
    setBusy(true);
    setStatus("");
    const f = new FormData(e.currentTarget);
    const data = {
      name: f.get("name"),
      address_input: f.get("address"),
      address_normalized: address || f.get("address"),
      category: f.get("category"),
      adhesion: f.get("adhesion"),
      comment: f.get("comment"),
      evidence: f.get("evidence"),
      sender_name: f.get("sender_name"),
      sender_email: f.get("sender_email"),
      terms: f.get("terms") === "on",
      location_confirmed: confirmed,
      lat: point[1],
      lng: point[0],
      geocoder_source: source,
      manually_adjusted: adjusted,
      captcha: token,
    };
    const validation = submissionSchema.safeParse(data);
    if (!validation.success) {
      setStatus(validation.error.issues.map((i) => i.message).join(" "));
      setBusy(false);
      return;
    }
    const body = new FormData();
    body.set("data", JSON.stringify(validation.data));
    const photo = f.get("photo");
    if (photo instanceof File && photo.size) body.set("photo", photo);
    try {
      const r = await fetch("/api/submissions", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDone(true);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "No se pudo enviar.");
      setToken("");
      setCaptchaKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="success-card">
        <Check size={40} />
        <h2>Gracias por sumar tu mirada.</h2>
        <p>
          Tu propuesta quedó pendiente. Un administrador la revisará antes de
          publicarla.
        </p>
        <Link className="button button-dark" href="/">
          Volver al mapa
        </Link>
      </div>
    );
  return (
    <form onSubmit={submit} className="submission-form">
      <section className="form-section">
        <div className="step-title">
          <span>01</span>
          <h2>El comercio</h2>
        </div>
        <div className="form-grid">
          <label>
            Nombre del comercio *
            <input
              name="name"
              required
              minLength={2}
              maxLength={140}
              placeholder="Como lo conocemos en el barrio"
              onBlur={(e) => void findDuplicates(e.target.value)}
            />
          </label>
          <label>
            Categoría *
            <select name="category" required>
              <option value="">Elegí una categoría</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="full">
            Dirección ingresada *
            <input
              name="address"
              required
              maxLength={250}
              placeholder="Por ejemplo, Aviador Germán Wernicke 2236"
            />
          </label>
        </div>
        {duplicates.length > 0 && (
          <div className="notice">
            Encontramos comercios similares. Revisalos antes de enviar:{" "}
            {duplicates.map((b) => (
              <Link
                key={b.id}
                target="_blank"
                rel="noreferrer"
                href={`/v/${b.code}`}
              >
                {b.name} · {b.address_normalized} ↗{" "}
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="form-section">
        <div className="step-title">
          <span>02</span>
          <h2>La ubicación exacta</h2>
        </div>
        <p>
          Buscá la dirección o tocá el mapa. Arrastrá el marcador hasta la
          entrada del comercio.
        </p>
        <AddressSearch
          onResult={(r) => {
            setPoint([r.lng, r.lat]);
            setFocus([r.lng, r.lat]);
            setAddress(r.label);
            setSource(r.source);
            setAdjusted(false);
            setConfirmed(false);
            setStatus("");
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
              setConfirmed(false);
              setStatus("");
            }}
            onInvalid={() =>
              setStatus("Esta ubicación está fuera de Ciudad Jardín.")
            }
          />
        </div>
        {point && (
          <p className="coordinates">
            <MapPin size={14} /> {point[1].toFixed(6)}, {point[0].toFixed(6)} ·{" "}
            {source}
          </p>
        )}
        <label className="check-label">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          Confirmo que el marcador está colocado sobre el comercio correcto.
        </label>
      </section>
      <section className="form-section">
        <div className="step-title">
          <span>03</span>
          <h2>El compromiso</h2>
        </div>
        <label>
          Estado propuesto *
          <select name="adhesion">
            <option value="SIN_ADHESION">Sin adhesión registrada</option>
            <option value="ADHERIDO">
              Adherido a la preservación del patrimonio urbano
            </option>
          </select>
        </label>
        <p className="field-help">
          “Sin adhesión” indica que no hay una adhesión registrada. No expresa
          oposición a la iniciativa.
        </p>
        <label>
          Evidencia de adhesión
          <textarea
            name="evidence"
            maxLength={3000}
            placeholder="Contanos cómo se manifestó el compromiso del comercio."
          />
        </label>
        <label>
          Comentario
          <textarea
            name="comment"
            maxLength={3000}
            placeholder="Información que ayude a revisar tu propuesta."
          />
        </label>
        <label>
          Fotografía opcional · privada
          <input
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          />
          <small>
            JPEG, PNG o WebP. Hasta 8 MB. Solo la verá el equipo de moderación.
          </small>
        </label>
      </section>
      <section className="form-section">
        <div className="step-title">
          <span>04</span>
          <h2>Tu aporte</h2>
        </div>
        <div className="form-grid">
          <label>
            Tu nombre · opcional
            <input name="sender_name" maxLength={120} />
          </label>
          <label>
            Tu email · opcional
            <input name="sender_email" type="email" maxLength={254} />
          </label>
        </div>
        <label className="check-label">
          <input type="checkbox" name="terms" required />
          <span>
            Acepto los{" "}
            <Link href="/terminos" target="_blank">
              términos y el tratamiento de datos
            </Link>
            . Declaro que puedo compartir la información y la fotografía.
          </span>
        </label>
        <Turnstile key={captchaKey} siteKey={siteKey} onToken={setToken} />
      </section>
      {status && (
        <p className="notice" role="alert">
          {status}
        </p>
      )}
      <button
        className="button button-dark"
        disabled={busy || !token}
        type="submit"
      >
        <Send size={17} />
        {busy ? "Enviando…" : "Enviar para revisión"}
      </button>
      <p className="field-help">Ningún aporte se publica automáticamente.</p>
    </form>
  );
}

"use client";
import { useState } from "react";
import Turnstile from "@/components/ui/Turnstile";
import { reportTypes } from "@/lib/config";
export default function ReportForm({
  businessId,
  siteKey,
}: {
  businessId: string;
  siteKey: string;
}) {
  const [token, setToken] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [captchaKey, setCaptchaKey] = useState(0);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          type: f.get("type"),
          comment: f.get("comment"),
          captcha: token,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage("Gracias. El equipo revisará tu reporte.");
      setDone(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo enviar.");
      setToken("");
      setCaptchaKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="report-form">
      <summary>Reportar información incorrecta</summary>
      {!done && (
        <form onSubmit={submit}>
          <label>
            Motivo
            <select name="type">
              {Object.entries(reportTypes).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Más información
            <textarea name="comment" maxLength={3000} />
          </label>
          <Turnstile key={captchaKey} siteKey={siteKey} onToken={setToken} />
          <button className="button button-dark" disabled={busy || !token}>
            Enviar reporte
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </details>
  );
}

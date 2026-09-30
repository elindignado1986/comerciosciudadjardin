"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AdminAction({
  label,
  payload,
}: {
  label: string;
  payload: Record<string, unknown>;
}) {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <>
      <button
        className="button button-light"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/admin/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Error");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Guardando…" : label}
      </button>
      {message && <p role="alert">{message}</p>}
    </>
  );
}

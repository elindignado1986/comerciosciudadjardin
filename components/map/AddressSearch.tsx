"use client";
import { useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import type { SearchResult } from "@/lib/types";
export default function AddressSearch({
  onResult,
}: {
  onResult: (result: SearchResult) => void;
}) {
  const [q, setQ] = useState(""),
    [results, setResults] = useState<SearchResult[]>([]),
    [streets, setStreets] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function search() {
    if (q.trim().length < 3) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setResults(d.results || []);
      setStreets(d.streets || []);
      setMessage(d.error || d.message || "");
    } catch {
      setMessage("No pudimos buscar. Podés señalar la ubicación en el mapa.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="address-search">
      <div className="search-box">
        <Search size={19} />
        <input
          aria-label="Buscar calle y altura"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void search();
            }
          }}
          placeholder="Buscá una calle y altura"
        />
        <button
          type="button"
          disabled={busy}
          aria-label="Buscar dirección"
          onClick={() => void search()}
        >
          {busy ? "…" : <ArrowUpRight size={19} />}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  if (!r.inside) {
                    setMessage("Esta ubicación está fuera de Ciudad Jardín.");
                    return;
                  }
                  onResult(r);
                  setResults([]);
                  setMessage("Ubicación aproximada. Revisá el marcador.");
                }}
              >
                {r.label}
                <small>
                  {r.inside ? "Ver en el mapa" : "Fuera de Ciudad Jardín"} ·{" "}
                  {r.source}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && (
        <p className="search-message" role="status">
          {message}
        </p>
      )}
      {streets.length > 0 && (
        <p className="search-message">
          Calles encontradas: {streets.join(" · ")}. Indicá la altura o marcá la
          ubicación manualmente.
        </p>
      )}
    </div>
  );
}

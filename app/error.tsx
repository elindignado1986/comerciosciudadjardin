"use client";
import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="prose-page">
      <h1>No pudimos cargar la información.</h1>
      <p>
        No es posible confirmar el estado de una placa mientras el servicio no
        está disponible.
      </p>
      <button className="button button-dark" onClick={reset}>
        Volver a intentar
      </button>{" "}
      <Link href="/">Volver al mapa</Link>
    </main>
  );
}

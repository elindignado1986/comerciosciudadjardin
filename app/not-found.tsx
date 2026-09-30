import Link from "next/link";
import Brand from "@/components/ui/Brand";
export default function NotFound() {
  return (
    <main className="prose-page">
      <Brand />
      <h1>No encontramos esta ficha.</h1>
      <p>
        El código puede ser incorrecto o el comercio ya no está publicado. Esta
        página no acredita una adhesión vigente.
      </p>
      <Link className="button button-dark" href="/">
        Volver al mapa
      </Link>
    </main>
  );
}

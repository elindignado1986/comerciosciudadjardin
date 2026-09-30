import Link from "next/link";
import Brand from "@/components/ui/Brand";
import { brand } from "@/lib/config";
export default function About() {
  return (
    <>
      <header className="site-header">
        <Brand />
        <Link href="/">Volver al mapa ↗</Link>
      </header>
      <main className="prose-page">
        <div className="eyebrow">PATRIMONIO · COMUNIDAD · BARRIO</div>
        <h1>
          Un compromiso
          <br />
          <em>con nuestro lugar.</em>
        </h1>
        <p>{brand.description}</p>
        <h2>Un mapa construido entre vecinos</h2>
        <p>
          Cualquier persona puede proponer un comercio de Ciudad Jardín Lomas
          del Palomar. El equipo administrador revisa la ubicación y la
          evidencia antes de publicar la ficha.
        </p>
        <h2>Qué significa cada estado</h2>
        <p>
          ✓ Adherido: cuenta con una adhesión registrada a la preservación del
          patrimonio urbano de Ciudad Jardín.
        </p>
        <p>
          ◇ Sin adhesión registrada: no contamos con una adhesión formal. No
          implica oposición a esta iniciativa.
        </p>
        <h2>Placas verificables</h2>
        <p>
          Cada QR abre la ficha permanente del comercio. Consultá allí el estado
          actual y reportá una placa que esté colocada en otro local.
        </p>
        <h2>Fuentes del mapa</h2>
        <p>
          Límite y cartografía: © colaboradores de OpenStreetMap, bajo ODbL.
          Cartografía vectorial inicial: OpenFreeMap / OpenMapTiles.
          Direcciones: Georef Argentina; Photon como respaldo opcional.
        </p>
        <Link className="button button-dark" href="/sumar">
          Sumar un comercio
        </Link>
      </main>
    </>
  );
}

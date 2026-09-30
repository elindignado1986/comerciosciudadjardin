import Link from "next/link";
import Brand from "@/components/ui/Brand";
export default function Terms() {
  return (
    <>
      <header className="site-header">
        <Brand />
      </header>
      <main className="prose-page">
        <h1>Términos y privacidad</h1>
        <p>
          Esta iniciativa reúne información de comercios ubicados exclusivamente
          en Ciudad Jardín Lomas del Palomar. Los aportes se someten a revisión
          y no constituyen una certificación oficial del municipio.
        </p>
        <h2>Información pública</h2>
        <p>
          Se publica el nombre, dirección, ubicación, adhesión, código y estado
          de verificación del comercio. La categoría se utiliza únicamente en
          los filtros del mapa.
        </p>
        <h2>Información privada</h2>
        <p>
          El nombre y email del remitente, comentarios, evidencia y fotografías
          solo son accesibles al equipo administrador. La fotografía se comprime
          y se eliminan sus metadatos antes de guardarla en almacenamiento
          privado.
        </p>
        <h2>Tu responsabilidad</h2>
        <p>
          Compartí información veraz y fotografías propias o autorizadas. Evitá
          datos sensibles, rostros y patentes. El equipo puede rechazar
          propuestas, corregir información o suspender una adhesión.
        </p>
        <h2>Correcciones y conservación</h2>
        <p>
          Podés solicitar correcciones o retiro de información mediante el
          formulario de reporte de cada ficha. Se mantiene un historial privado
          para revisar las decisiones y prevenir el uso indebido de placas.
        </p>
        <h2>Servicios externos</h2>
        <p>
          Los mapas usan el proveedor cartográfico configurado; la búsqueda
          utiliza Georef y, cuando está habilitado, Photon. Cloudflare Turnstile
          protege los formularios. Supabase aloja datos y autenticación. Estos
          servicios reciben los datos técnicos necesarios para funcionar.
        </p>
        <Link href="/">Volver al mapa</Link>
      </main>
    </>
  );
}

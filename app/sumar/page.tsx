import Link from "next/link";
import SubmissionForm from "@/components/submission/SubmissionForm";
import Brand from "@/components/ui/Brand";
import { selectedPoint } from "@/lib/map/selection";
export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string | string[]; lng?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialPoint = selectedPoint(params.lat, params.lng);
  return (
    <>
      <header className="site-header">
        <Brand />
        <Link href="/" className="text-link">
          Volver al mapa ↗
        </Link>
      </header>
      <main className="form-page">
        <div className="eyebrow">CONSTRUYAMOS EL MAPA JUNTOS</div>
        <h1>
          Sumá un comercio
          <br />
          <em>a la historia del barrio.</em>
        </h1>
        <p className="intro">
          Tu aporte ayuda a cuidar Ciudad Jardín. Revisamos cada propuesta antes
          de publicarla.
        </p>
        <SubmissionForm
          siteKey={process.env.TURNSTILE_SITE_KEY || ""}
          initialPoint={initialPoint}
        />
      </main>
    </>
  );
}

import "server-only";
import { createHash } from "node:crypto";
import { serviceDb } from "@/lib/supabase/server";
import { HttpError } from "@/lib/auth/admin";
import { ZodError } from "zod";
import { appUrl } from "@/lib/config";
import { acceptsTurnstileResult } from "@/lib/auth/turnstile-policy";
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== new URL(appUrl()).origin)
    throw new HttpError(403, "Origen de solicitud no permitido.");
}
export async function rateLimit(req: Request, scope: string, max = 8) {
  const salt = process.env.RATE_LIMIT_SALT;
  if (!salt)
    throw new HttpError(503, "Falta configurar la protección de solicitudes.");
  const ip =
    (process.env.VERCEL
      ? req.headers.get("x-vercel-forwarded-for")
      : req.headers.get("x-forwarded-for")
    )
      ?.split(",")[0]
      ?.trim() || "local";
  const key = createHash("sha256")
    .update(`${salt}:${scope}:${ip}`)
    .digest("hex");
  const { data, error } = await serviceDb().rpc("consume_rate_limit", {
    bucket_key: key,
    max_hits: max,
    window_seconds: 600,
  });
  if (error)
    throw new HttpError(503, "No se pudo verificar el límite de solicitudes.");
  if (!data)
    throw new HttpError(
      429,
      "Demasiados intentos. Volvé a probar en unos minutos.",
    );
}
export async function verifyCaptcha(token: string) {
  if (!process.env.TURNSTILE_SECRET_KEY)
    throw new HttpError(503, "Falta configurar la verificación CAPTCHA.");
  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  const data = await result.json();
  if (
    !acceptsTurnstileResult({
      success: data.success === true,
      hostname: data.hostname,
      expectedHostname: new URL(appUrl()).hostname,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      siteKey: process.env.TURNSTILE_SITE_KEY,
      secretKey: process.env.TURNSTILE_SECRET_KEY,
      token,
    })
  )
    throw new HttpError(
      400,
      "Completá nuevamente la verificación de seguridad.",
    );
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return Response.json(
      { error: error.issues.map((i) => i.message).join(" ") },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(
    error instanceof Error ? error.message : "Database operation failed",
  );
  return Response.json(
    {
      error:
        "No se pudo completar la operación. Revisá la configuración o intentá nuevamente.",
    },
    { status: 503 },
  );
}
export function checkSize(req: Request, max: number) {
  if (Number(req.headers.get("content-length") || 0) > max)
    throw new HttpError(
      413,
      "El archivo o formulario supera el límite permitido.",
    );
}

async function boundedBody(req: Request, max: number): Promise<Uint8Array> {
  checkSize(req, max);
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new HttpError(
        413,
        "El archivo o formulario supera el límite permitido.",
      );
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
export async function readJson(req: Request, max = 24000): Promise<unknown> {
  const bytes = await boundedBody(req, max);
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "JSON inválido.");
  }
}
export async function readMultipart(req: Request, max = 9 * 1024 * 1024) {
  const bytes = await boundedBody(req, max);
  try {
    return await new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
  } catch {
    throw new HttpError(400, "Formulario multipart inválido.");
  }
}

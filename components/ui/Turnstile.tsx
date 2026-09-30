"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
declare global {
  interface Window {
    turnstile?: {
      render: (node: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}
export default function Turnstile({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    id = useRef<string | null>(null),
    callback = useRef(onToken);
  useEffect(() => {
    callback.current = onToken;
  }, [onToken]);
  const render = useCallback(() => {
    if (ref.current && window.turnstile && id.current === null)
      id.current = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token: string) => callback.current(token),
        "expired-callback": () => callback.current(""),
        "error-callback": () => callback.current(""),
      });
  }, [siteKey]);
  useEffect(() => {
    render();
    return () => {
      if (id.current !== null) {
        window.turnstile?.remove(id.current);
        id.current = null;
      }
    };
  }, [render]);
  if (!siteKey)
    return (
      <p className="notice">
        El envío estará disponible al configurar la verificación de seguridad.
      </p>
    );
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={render}
      />
      <div ref={ref} />
    </>
  );
}

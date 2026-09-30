import type { Metadata } from "next";
import { brand } from "@/lib/config";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR">
      <body
        style={
          {
            "--forest": brand.colors.forest,
            "--cream": brand.colors.cream,
            "--sage": brand.colors.sage,
            "--terracotta": brand.colors.terracotta,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}

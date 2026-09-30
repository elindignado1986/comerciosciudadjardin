import type { PublicBusiness } from "@/lib/types";
export function markerElement(business: PublicBusiness) {
  const element = document.createElement("button");
  const active =
    business.adhesion === "ADHERIDO" && business.qr_status === "ACTIVE";
  element.className = `business-marker ${active ? "joined" : "neutral"}`;
  element.textContent = active ? "✓" : "◇";
  element.setAttribute(
    "aria-label",
    `${business.name}: ${active ? "Adherido" : "Sin adhesión vigente"}`,
  );
  return element;
}

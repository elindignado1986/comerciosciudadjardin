export const brand = {
  name: "Comercios comprometidos con Ciudad Jardín",
  shortName: "Ciudad Jardín",
  tagline: "COMERCIOS COMPROMETIDOS",
  description:
    "Conocé los comercios que adhieren a la preservación del patrimonio urbano de Ciudad Jardín.",
  place: "Ciudad Jardín Lomas del Palomar",
  colors: {
    forest: "#294e40",
    sage: "#9aaa89",
    cream: "#f5f3eb",
    terracotta: "#b66e50",
  },
};
export const categories = [
  "Gastronomía",
  "Alimentos",
  "Indumentaria",
  "Salud",
  "Servicios",
  "Educación",
  "Profesionales",
  "Otros",
] as const;
export const reportTypes = {
  CLOSED: "Comercio cerrado",
  RENAMED: "Cambió de nombre",
  WRONG_ADDRESS: "Dirección incorrecta",
  WRONG_LOCATION: "Ubicación incorrecta",
  WRONG_STATUS: "Estado incorrecto",
  FAKE_OR_MISPLACED_QR: "Esta placa está colocada en otro comercio",
  OTHER: "Otro",
};
export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

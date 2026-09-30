export function slug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 85) || "comercio"
  );
}
export function qrFilename(name: string, address: string, code?: string) {
  return `${slug(name)}_${slug(address)}${code ? `_${code}` : ""}.png`;
}

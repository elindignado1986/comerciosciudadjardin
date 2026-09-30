import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { businessSchema } from "../lib/validation/index";
const file = process.argv[2],
  apply = process.argv.includes("--apply");
if (!file)
  throw new Error(
    "Uso: npm run import:businesses -- archivo.csv|xlsx|json [--apply]. Por defecto solo valida.",
  );
const root = process.cwd() + path.sep,
  absolute = path.resolve(file);
if (!absolute.toLowerCase().startsWith(root.toLowerCase()))
  throw new Error("El archivo debe estar dentro del proyecto.");
let rows: Record<string, unknown>[];
if (file.endsWith(".json"))
  rows = JSON.parse(await fs.readFile(absolute, "utf8"));
else if (file.endsWith(".csv"))
  rows = parse(await fs.readFile(absolute, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
else if (file.endsWith(".xlsx")) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(absolute);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Planilla vacía");
  const headers = (sheet.getRow(1).values as unknown[]).slice(1).map(String);
  rows = [];
  sheet.eachRow((row, index) => {
    if (index > 1) {
      const values = (row.values as unknown[]).slice(1);
      rows.push(Object.fromEntries(headers.map((h, i) => [h, values[i]])));
    }
  });
} else throw new Error("Formato no admitido");
if (!Array.isArray(rows) || rows.length > 5000)
  throw new Error("Máximo 5000 filas por lote.");
const seen = new Set<string>();
const valid = rows.map((r, i) => {
  const v = businessSchema.parse({
    ...r,
    lat: Number(r.lat),
    lng: Number(r.lng),
    address_normalized: r.address_normalized || r.address_input,
    manually_adjusted:
      r.manually_adjusted === true || r.manually_adjusted === "true",
  });
  const key = `${v.name.toLowerCase()}|${v.address_normalized.toLowerCase()}`;
  if (seen.has(key))
    console.warn(`Posible duplicado en fila ${i + 2}: ${v.name}`);
  seen.add(key);
  return {
    ...v,
    status: "PENDING",
    comment: "Importado para revisión administrativa",
  };
});
console.log(`${valid.length} filas válidas dentro de Ciudad Jardín.`);
if (apply) {
  // Private Node.js maintenance script; never import into browser/application UI.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error("Cargá variables de Supabase en el entorno.");
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("business_submissions").insert(valid);
  if (error) throw error;
  console.log("Importadas como PENDING. No se publicó ningún comercio.");
} else
  console.log(
    "Validación sin escritura. Agregá --apply para importar como propuestas pendientes.",
  );

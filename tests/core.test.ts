import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import booleanValid from "@turf/boolean-valid";
import { boundary, isInsideCiudadJardin } from "../lib/map/boundary";
import { qrFilename, slug } from "../lib/qr/filename";
import {
  businessSchema,
  submissionSchema,
  reportSchema,
  isBusinessCode,
} from "../lib/validation/index";
const valid = {
  name: "Comercio de prueba",
  address_input: "Wernicke 2236",
  address_normalized: "AV WERNICKE 2236",
  lat: -34.592576043142856,
  lng: -58.590959175959185,
  category: "Servicios",
  adhesion: "SIN_ADHESION",
  terms: true,
  location_confirmed: true,
  captcha: "test",
};
test("boundary completo válido y coherente con su copia GeoJSON", () => {
  assert.equal(booleanValid(boundary), true);
  assert.deepEqual(
    boundary,
    JSON.parse(fs.readFileSync("data/ciudad-jardin-boundary.geojson", "utf8")),
  );
  assert.match(boundary.properties?.source, /2442850/);
});
test("Wernicke 2236 está dentro del boundary", () =>
  assert.equal(isInsideCiudadJardin(valid.lat, valid.lng), true));
test("CABA, coordenadas invertidas y NaN se rechazan", () => {
  assert.equal(isInsideCiudadJardin(-34.6037, -58.3816), false);
  assert.equal(isInsideCiudadJardin(valid.lng, valid.lat), false);
  assert.equal(isInsideCiudadJardin(NaN, valid.lng), false);
});
test("filename seguro: acentos, traversal, caracteres y colisión", () => {
  assert.equal(
    qrFilename("Occó Helados", "Aviador Wernicke 2236"),
    "occo-helados_aviador-wernicke-2236.png",
  );
  assert.equal(qrFilename("A", "B", "CJ-0007"), "a_b_CJ-0007.png");
  assert.equal(slug("../../<>Árbol"), "arbol");
  assert.ok(slug("x".repeat(400)).length <= 85);
});
test("códigos CJ sin reutilizar formato, más de 9999 permitido", () => {
  for (const code of ["CJ-0001", "CJ-9999", "CJ-10000"])
    assert.ok(isBusinessCode(code));
  for (const code of ["cj-0001", "CJ-1", "../CJ-0001", "CJ-0001?x"])
    assert.equal(isBusinessCode(code), false);
});
test("propuesta válida, consentimiento y ubicación obligatorios", () => {
  assert.ok(submissionSchema.safeParse(valid).success);
  assert.equal(
    submissionSchema.safeParse({ ...valid, terms: false }).success,
    false,
  );
  assert.equal(
    submissionSchema.safeParse({ ...valid, location_confirmed: false }).success,
    false,
  );
  assert.equal(
    submissionSchema.safeParse({ ...valid, lat: -34.6037, lng: -58.3816 })
      .success,
    false,
  );
});
test("payload malicioso no publica ni define códigos, HTML se rechaza", () => {
  const parsed = submissionSchema.parse({
    ...valid,
    status: "APPROVED",
    code: "CJ-0001",
    photo_path: "secret",
  });
  assert.equal("status" in parsed, false);
  assert.equal("code" in parsed, false);
  assert.equal("photo_path" in parsed, false);
  assert.equal(
    businessSchema.safeParse({ ...valid, name: "<script>alert(1)</script>" })
      .success,
    false,
  );
});
test("reporte de placa falsa disponible y enums cerrados", () => {
  assert.ok(
    reportSchema.safeParse({
      business_id: "bdb97ca8-3a2d-4b56-bba6-b20dfd63e502",
      type: "FAKE_OR_MISPLACED_QR",
      captcha: "t",
    }).success,
  );
  assert.equal(
    reportSchema.safeParse({
      business_id: "bad",
      type: "APPROVE",
      captcha: "t",
    }).success,
    false,
  );
});

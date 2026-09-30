import test from "node:test";
import assert from "node:assert/strict";
import { GeorefProvider, OsmProvider } from "../lib/geocoding/providers";
import { selectedPoint } from "../lib/map/selection";

const lat = -34.592576043142856,
  lng = -58.590959175959185;

test("Georef pide Ciudad Jardín y descarta coordenadas de Caseros", async (t) => {
  t.mock.method(globalThis, "fetch", async (input: string) => {
    const url = new URL(input);
    assert.equal(url.searchParams.get("localidad"), "0684001003");
    assert.equal(url.searchParams.get("direccion"), "Blvd. San Martín 2215");
    return Response.json({
      direcciones: [
        { nomenclatura: "Ciudad Jardín", ubicacion: { lat, lon: lng } },
        { nomenclatura: "Caseros", ubicacion: { lat: -34.604, lon: -58.563 } },
      ],
    });
  });
  const results = await new GeorefProvider().search("Blvd. San Martín 2215");
  assert.equal(results.length, 1);
  assert.equal(results[0].label, "Ciudad Jardín");
});

test("Photon no sustituye una altura por el centro de una calle ni por otro barrio", async (t) => {
  const previous = process.env.PHOTON_API_URL;
  process.env.PHOTON_API_URL = "https://photon.example";
  t.after(() => {
    if (previous === undefined) delete process.env.PHOTON_API_URL;
    else process.env.PHOTON_API_URL = previous;
  });
  t.mock.method(globalThis, "fetch", async (input: string) => {
    assert.ok(new URL(input).searchParams.get("bbox"));
    return Response.json({
      features: [
        {
          geometry: { coordinates: [lng, lat] },
          properties: { street: "San Martín" },
        },
        {
          geometry: { coordinates: [lng, lat] },
          properties: { street: "San Martín", housenumber: "2215" },
        },
        {
          geometry: { coordinates: [-58.563, -34.604] },
          properties: { street: "San Martín", housenumber: "2215" },
        },
      ],
    });
  });
  const results = await new OsmProvider().search("Blvd. San Martín 2215");
  assert.equal(results.length, 1);
  assert.match(results[0].label, /2215/);
  assert.equal((await new OsmProvider().search("Urquiza 4700 Caseros")).length, 0);
});

test("el formulario recibe el punto elegido y rechaza enlaces fuera del barrio o inválidos", () => {
  assert.deepEqual(selectedPoint(String(lat), String(lng)), [lng, lat]);
  for (const [a, b] of [
    ["-34.604", "-58.563"],
    ["", ""],
    ["NaN", "Infinity"],
    [undefined, undefined],
    [[String(lat)], String(lng)],
  ] as const) {
    assert.equal(selectedPoint(a as string | string[] | undefined, b), null);
  }
});

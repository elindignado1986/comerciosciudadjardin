import fs from "node:fs/promises";
await fs.mkdir(".checks", { recursive: true });
for (const [name, url] of Object.entries({
  directions:
    "https://apis.datos.gob.ar/georef/api/v2.0/direcciones?direccion=Wernicke%202236&provincia=06&departamento=Tres%20de%20Febrero&max=5",
  streets:
    "https://apis.datos.gob.ar/georef/api/v2.0/calles?nombre=Wernicke&provincia=06&departamento=Tres%20de%20Febrero&max=5",
  photon:
    "https://photon.komoot.io/api/?q=Wernicke%202236%20Ciudad%20Jardin&lat=-34.6&lon=-58.59&limit=3",
  tiles: "https://tiles.openfreemap.org/styles/liberty",
})) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
    const t = await r.text();
    await fs.writeFile(`.checks/${name}.json`, t);
    console.log(name, r.status, t.slice(0, 1800));
  } catch (e) {
    console.log(name, e.message);
  }
}

import assert from "node:assert/strict";
import fs from "node:fs/promises";
const root = "http://localhost:3000";
const results = [];
for (const route of [
  "/",
  "/sumar",
  "/admin",
  "/acerca",
  "/terminos",
  "/v/CJ-0001",
]) {
  const r = await fetch(root + route);
  const html = await r.text();
  assert.equal(r.status, 200, route);
  assert.ok(!html.includes("Internal Server Error"));
  results.push({ route, status: r.status, bytes: html.length });
}
const businesses = await fetch(root + "/api/businesses").then((r) => r.json());
assert.deepEqual(businesses.businesses, []);
const malicious = await fetch(root + "/api/admin/action", {
  method: "POST",
  headers: {
    Origin: "https://evil.example",
    "Content-Type": "application/json",
  },
  body: "{}",
});
assert.equal(malicious.status, 403);
const direct = await fetch(root + "/api/submissions", {
  method: "POST",
  headers: { Origin: root, "Content-Type": "application/json" },
  body: "{}",
});
assert.ok(direct.status >= 400);
const search = await fetch(root + "/api/geocode?q=Wernicke%202236").then((r) =>
  r.json(),
);
results.push({ search });
assert.ok(
  search.results?.some((r) => r.inside),
  "Wernicke debe devolver un punto interior",
);
await fs.mkdir(".checks", { recursive: true });
await fs.writeFile(
  ".checks/http-results.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));

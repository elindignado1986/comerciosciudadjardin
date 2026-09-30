import test from "node:test";
import assert from "node:assert/strict";
import { checkOrigin, readJson, readMultipart } from "../lib/security";
test("origen ajeno o ausente rechazado", () => {
  const expected = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request(expected, { headers: { Origin: new URL(expected).origin } }),
    ),
  );
  assert.throws(() => checkOrigin(new Request(expected)), /Origen/);
  assert.throws(
    () =>
      checkOrigin(
        new Request(expected, { headers: { Origin: "https://evil.example" } }),
      ),
    /Origen/,
  );
});
test("límite real de cuerpo no depende de Content-Length", async () => {
  await assert.rejects(
    readJson(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ text: "x".repeat(100) }),
      }),
      30,
    ),
    /supera el límite/,
  );
  await assert.rejects(
    readJson(
      new Request("http://localhost", { method: "POST", body: "not-json" }),
    ),
    /JSON inválido/,
  );
  assert.deepEqual(
    await readJson(
      new Request("http://localhost", {
        method: "POST",
        body: '{"valid":true}',
      }),
    ),
    { valid: true },
  );
});
test("multipart válido y límite de subida", async () => {
  const form = new FormData();
  form.set("data", "{}");
  assert.equal(
    (
      await readMultipart(
        new Request("http://localhost", { method: "POST", body: form }),
      )
    ).get("data"),
    "{}",
  );
  await assert.rejects(
    readMultipart(
      new Request("http://localhost", { method: "POST", body: await new Request('http://localhost',{method:'POST',body:form}).arrayBuffer() }),
      2,
    ),
    /supera el límite/,
  );
});

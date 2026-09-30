import test from "node:test";
import assert from "node:assert/strict";
import { acceptsTurnstileResult } from "../lib/auth/turnstile-policy";
const local = {
  success: true,
  hostname: "example.com",
  expectedHostname: "localhost",
  nodeEnv: "development",
  siteKey: `1x${"0".repeat(18)}AA`,
  secretKey: `1x${"0".repeat(31)}AA`,
  token: "XXXX.DUMMY.TOKEN.XXXX",
};
test("Turnstile oficial de prueba permitido únicamente en desarrollo local", () => {
  assert.equal(acceptsTurnstileResult(local), true);
  for (const change of [
    { nodeEnv: "production" },
    { vercel: "1" },
    { expectedHostname: "comerciosciudadjardin.vercel.app" },
    { token: "wrong" },
    { success: false },
  ])
    assert.equal(acceptsTurnstileResult({ ...local, ...change }), false);
});
test("Turnstile real exige resultado exitoso y hostname exacto", () => {
  const real = {
    success: true,
    hostname: "comerciosciudadjardin.vercel.app",
    expectedHostname: "comerciosciudadjardin.vercel.app",
    nodeEnv: "production",
    token: "fixture",
  };
  assert.equal(acceptsTurnstileResult(real), true);
  assert.equal(
    acceptsTurnstileResult({ ...real, hostname: "example.com" }),
    false,
  );
  assert.equal(acceptsTurnstileResult({ ...real, success: false }), false);
});

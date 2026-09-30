export function acceptsTurnstileResult(options: {
  success: boolean;
  hostname?: string;
  expectedHostname: string;
  nodeEnv?: string;
  vercel?: string;
  siteKey?: string;
  secretKey?: string;
  token: string;
}) {
  if (!options.success) return false;
  const testKey = /^[123]x0+/.test(options.secretKey || "");
  if (!testKey) return options.hostname === options.expectedHostname;
  // Cloudflare's public testing credentials are accepted only by local dev.
  return (
    options.nodeEnv === "development" &&
    !options.vercel &&
    ["localhost", "127.0.0.1"].includes(options.expectedHostname) &&
    options.siteKey === `1x${"0".repeat(18)}AA` &&
    options.secretKey === `1x${"0".repeat(31)}AA` &&
    options.token === "XXXX.DUMMY.TOKEN.XXXX" &&
    ["example.com", options.expectedHostname].includes(options.hostname || "")
  );
}

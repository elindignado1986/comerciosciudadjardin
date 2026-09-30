import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { processEvidence } from "../lib/images/process";
test("fotografía procesada: resize, EXIF eliminado, WebP real", async () => {
  const input = await sharp({
    create: { width: 2000, height: 1200, channels: 3, background: "#315945" },
  })
    .withMetadata({ exif: { IFD0: { Artist: "Private person" } } })
    .jpeg()
    .toBuffer();
  const processed = await processEvidence(
    new File([new Uint8Array(input)], "foto.jpg", { type: "image/jpeg" }),
  );
  const meta = await sharp(processed).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 1600);
  assert.equal(meta.exif, undefined);
});
test("MIME falso, SVG y archivo excesivo se rechazan", async () => {
  const png = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "#ffffff" },
  })
    .png()
    .toBuffer();
  await assert.rejects(
    processEvidence(
      new File([new Uint8Array(png)], "foto.jpg", { type: "image/jpeg" }),
    ),
    /JPEG, PNG o WebP/,
  );
  await assert.rejects(
    processEvidence(
      new File(
        ['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'],
        "x.svg",
        { type: "image/svg+xml" },
      ),
    ),
    /JPEG, PNG o WebP/,
  );
  await assert.rejects(
    processEvidence(
      new File([new Uint8Array(8 * 1024 * 1024 + 1)], "x.jpg", {
        type: "image/jpeg",
      }),
    ),
    /8 MB/,
  );
});

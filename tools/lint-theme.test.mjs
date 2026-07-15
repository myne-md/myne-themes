import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio, hexToRgb } from "./contrast.mjs";
import { lintContrast, lintMeta, loadSchema } from "./lint-theme.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const readJson = (...p) => JSON.parse(readFileSync(join(HERE, "..", ...p), "utf8"));

test("contrastRatio: black vs white is ~21", () => {
  assert.ok(Math.abs(contrastRatio("#000000", "#ffffff") - 21) < 0.1);
});

test("contrastRatio: identical colors is ~1", () => {
  assert.ok(Math.abs(contrastRatio("#123456", "#123456") - 1) < 0.001);
});

test("hexToRgb: rejects non-hex, expands shorthand", () => {
  assert.equal(hexToRgb("red"), null);
  assert.deepEqual(hexToRgb("#fff"), [255, 255, 255]);
  assert.deepEqual(hexToRgb("#17150f"), [23, 21, 15]);
});

test("contrast lint PASSES fixtures/contrast/good.json", () => {
  const r = lintContrast(readJson("fixtures", "contrast", "good.json"));
  assert.equal(r.ok, true, r.errors.join("; "));
});

test("contrast lint FAILS fixtures/contrast/bad.json (ink ≈ paper)", () => {
  const r = lintContrast(readJson("fixtures", "contrast", "bad.json"));
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("--ink-1")));
});

test("contrast lint PASSES both seed themes", () => {
  for (const slug of ["nocturne", "warm-paper"]) {
    const r = lintContrast(readJson("themes", slug, "theme.json"));
    assert.equal(r.ok, true, `${slug}: ${r.errors.join("; ")}`);
  }
});

test("meta lint PASSES a valid meta.json", () => {
  const schema = loadSchema();
  const r = lintMeta(readJson("themes", "nocturne", "meta.json"), schema);
  assert.equal(r.ok, true, r.errors.join("; "));
});

test("meta lint FAILS a missing license", () => {
  const schema = loadSchema();
  const r = lintMeta(
    { name: "X", author: "Y", description: "Z" },
    schema,
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("license")));
});

test("meta lint FAILS a license outside the allowed set", () => {
  const schema = loadSchema();
  const r = lintMeta(
    { name: "X", author: "Y", description: "Z", license: "GPL-3.0-only" },
    schema,
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("license")));
});

test("meta lint PASSES a port (MIT + upstream)", () => {
  const schema = loadSchema();
  const r = lintMeta(
    {
      name: "Dracula",
      author: "Dracula Theme",
      description: "A dark theme.",
      license: "MIT",
      appearance: "dark",
      upstream: "https://draculatheme.com",
      port_by: "Myne",
    },
    schema,
  );
  assert.equal(r.ok, true, r.errors.join("; "));
});

test("meta lint FAILS an unknown field", () => {
  const schema = loadSchema();
  const r = lintMeta(
    { name: "X", author: "Y", description: "Z", license: "CC-BY-4.0", evil: 1 },
    schema,
  );
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes("unknown field")));
});

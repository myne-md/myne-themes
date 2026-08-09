import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lintMeta, loadSchema } from "./lint-theme.mjs";

// Contrast is no longer tested here: the rules moved into the Rust
// `theme-validator` crate (myne#394) so the client and this repo enforce them
// from one implementation. Their coverage lives in `contrast.rs`'s unit tests,
// and the CI `validate` step proves the gate actually runs against the
// `fixtures/contrast/` pair.

const HERE = dirname(fileURLToPath(import.meta.url));
const readJson = (...p) => JSON.parse(readFileSync(join(HERE, "..", ...p), "utf8"));

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

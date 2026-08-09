// Theme lints run by CI ON TOP of the Rust `theme-validator` binary.
//
// Split of responsibility (deliberate):
//   - the VALUE ALLOWLIST (injection safety) is the Rust `validate` binary — the
//     EXACT client validator, never reimplemented here.
//   - the WCAG CONTRAST GATE (readability) is ALSO that binary, since myne#394.
//     It used to live in this file, which made it a second implementation of a
//     rule the client also enforces — and a lint that disagrees with the client
//     produces the worst outcome available: a theme that passes CI and is then
//     refused on install. The rules now live in `theme-validator`'s `contrast`
//     module and gate the app's import path and this repo from the same code.
//   - THIS file does what is left, and what the client genuinely does not care
//     about: meta.json shape and license.
//
// Zero runtime deps (minimal-dependency discipline): meta validation is a tiny
// schema-driven check, not ajv.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(HERE, "..", "schema", "meta.schema.json");

/** Minimal schema-driven validation of a meta.json object. */
export function lintMeta(meta, schema) {
  const errors = [];
  const props = schema.properties || {};
  for (const req of schema.required || []) {
    if (!(req in meta)) errors.push(`missing required field: ${req}`);
  }
  if (schema.additionalProperties === false) {
    for (const k of Object.keys(meta)) {
      if (!(k in props)) errors.push(`unknown field: ${k}`);
    }
  }
  for (const [k, v] of Object.entries(meta)) {
    const p = props[k];
    if (!p) continue;
    if (p.const !== undefined && v !== p.const) {
      errors.push(`${k} must be "${p.const}"`);
    }
    if (p.enum && !p.enum.includes(v)) {
      errors.push(`${k} must be one of: ${p.enum.join(", ")}`);
    }
    if (p.type === "string") {
      if (typeof v !== "string") errors.push(`${k} must be a string`);
      else {
        if (p.minLength && v.length < p.minLength) errors.push(`${k} is empty`);
        if (p.maxLength && v.length > p.maxLength) {
          errors.push(`${k} exceeds ${p.maxLength} characters`);
        }
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export function loadSchema() {
  return JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
}

/** Lint a theme directory — meta.json only; contrast is the `validate` binary's. */
export function lintThemeDir(dir) {
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  const schema = loadSchema();
  const m = lintMeta(meta, schema);
  return { ok: m.ok, meta: m };
}

// CLI: node tools/lint-theme.mjs <theme-dir>
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("usage: node tools/lint-theme.mjs <theme-dir>");
    process.exit(2);
  }
  const r = lintThemeDir(dir);
  for (const e of r.meta.errors) console.error(`  meta: ${e}`);
  if (r.ok) {
    console.log(`ok: ${dir}`);
    process.exit(0);
  }
  process.exit(1);
}

// Theme lints run by CI ON TOP of the Rust `theme-validator` value allowlist.
//
// Split of responsibility (deliberate):
//   - the VALUE ALLOWLIST (injection safety) is the Rust `validate` binary — the
//     EXACT client validator, never reimplemented here.
//   - THIS file does the two checks the allowlist can't: WCAG contrast (readability)
//     and meta.json shape/license.
//
// Zero runtime deps (minimal-dependency discipline): meta validation is a tiny
// schema-driven check, not ajv.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { contrastRatio } from "./contrast.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(HERE, "..", "schema", "meta.schema.json");

/**
 * Contrast requirements. Thresholds: primary/display text uses WCAG AA body
 * (4.5); secondary text and the accent (a UI component) use the 3.0 large-text /
 * non-text-contrast floor. Tertiary `--ink-3` is a hint color — intentionally not
 * gated (it is allowed to be low-contrast by design).
 */
export const CONTRAST_RULES = [
  { fg: "--ink-0", bg: "--paper", min: 4.5, label: "display text on page" },
  { fg: "--ink-1", bg: "--paper", min: 4.5, label: "primary text on page" },
  { fg: "--ink-1", bg: "--paper-2", min: 4.5, label: "primary text on surface" },
  { fg: "--ink-2", bg: "--paper", min: 3.0, label: "secondary text on page" },
  { fg: "--accent", bg: "--paper", min: 3.0, label: "accent on page" },
];

/** Contrast lint over a parsed theme object. Non-hex values are skipped (the
 *  allowlist already fenced them for safety; contrast is only defined on hex). */
export function lintContrast(theme) {
  const errors = [];
  for (const rule of CONTRAST_RULES) {
    const fg = theme[rule.fg];
    const bg = theme[rule.bg];
    if (fg == null || bg == null) continue; // missing-key is the validator's job
    const ratio = contrastRatio(fg, bg);
    if (ratio == null) continue; // non-hex; can't compute — skip
    if (ratio < rule.min) {
      errors.push(
        `${rule.fg} on ${rule.bg} (${rule.label}): contrast ${ratio.toFixed(2)} < ${rule.min}`,
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

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

/** Lint a theme directory (theme.json + meta.json) — contrast + meta only. */
export function lintThemeDir(dir) {
  const theme = JSON.parse(readFileSync(join(dir, "theme.json"), "utf8"));
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  const schema = loadSchema();
  const c = lintContrast(theme);
  const m = lintMeta(meta, schema);
  return { ok: c.ok && m.ok, contrast: c, meta: m };
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
  for (const e of r.contrast.errors) console.error(`  contrast: ${e}`);
  if (r.ok) {
    console.log(`ok: ${dir}`);
    process.exit(0);
  }
  process.exit(1);
}

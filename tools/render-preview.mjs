// Render a gallery preview by painting a theme onto the REAL Myne interface.
//
// The page screenshotted here is not a drawing of Myne — it is Myne: the editor's
// own DOM and its own stylesheet, captured from the running desktop app by that
// repo's `e2e/capture/theme-preview.capture.ts` and shipped as `preview/src/`.
// The theme is applied to it exactly the way the app applies one (custom
// properties on the root, ornament selections as `data-o-*` attributes), so a
// gallery card shows what installing actually gets you.
//
// WHY IT CHANGED (myne#394). This file used to build its own small mock UI from
// the palette. It was honest about colour and blind to everything else: ornament
// did not exist here, so a theme selecting a thick frame, a dog-eared corner or
// a scanline texture previewed as a plain rectangle — and the gallery was the
// one place a person looked BEFORE installing. It was also the third
// hand-written imitation of Myne in the project, each drifting on its own
// schedule.
//
// THE ORNAMENT VOCABULARY IS READ OUT OF THE STYLESHEET, never restated here.
// A selection is reflected only if the captured CSS actually carries a rule for
// it, which makes "the gallery draws what the app draws" true by construction
// rather than by three lists agreeing.
//
// Usage: node tools/render-preview.mjs <theme-dir> <out.png>
// Snapshot: MYNE_DIR env → .. (companion nested in the main repo, the canonical
//           layout `workspace/setup.sh` produces) → ../myne (sibling checkout).
// Browser:  CHROME_BIN env, else common Chrome/Chromium paths (mac + linux CI).

import { readFileSync, writeFileSync, existsSync, mkdtempSync, copyFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const W = 1200;
const H = 760;

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");

function findChrome() {
  const cands = [
    process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean);
  return cands.find((c) => existsSync(c)) || null;
}

/**
 * The main `myne` checkout this repo reads the snapshot and apply helper from.
 *
 * Two layouts are real and only one used to be handled. `workspace/setup.sh`
 * clones the companions **nested inside** the main repo, which is the canonical
 * layout and the one every maintainer has; a **sibling** checkout
 * (`~/products/{myne,myne-themes}`) is the other. The sibling path was the only
 * candidate, so in the canonical layout it resolved to `<myne>/myne` — a
 * directory that has never existed — and eleven tests SKIPPED themselves on the
 * missing helper while the suite reported green. One of them was "a tint-only
 * theme still gets the on-flag", i.e. the exact bug a user had to find by
 * looking at the screen.
 */
function myneDir() {
  if (process.env.MYNE_DIR) return process.env.MYNE_DIR;
  const nested = join(REPO, ".."); // companion cloned inside the main repo
  if (existsSync(join(nested, "preview", "src"))) return nested;
  return join(REPO, "..", "myne"); // sibling checkout
}

/** Where the captured interface lives. */
export function snapshotDir() {
  return join(myneDir(), "preview", "src");
}

/**
 * The shared apply helper, loaded from the snapshot package.
 *
 * `@myne/preview`'s `apply.mjs` is the ONE implementation of "paint a palette
 * onto the captured interface". This file used to carry its own copy, and the
 * copies had diverged — most consequentially over `none`, which must be WRITTEN
 * (the two inheriting primitives need an explicit reset) and which both copies
 * skipped. Loaded by path rather than by package name because this repo is not
 * a workspace member of the app's tree; `MYNE_DIR` already locates it.
 */
export async function loadApply() {
  const mod = join(snapshotDir(), "apply.mjs");
  if (!existsSync(mod)) {
    throw new Error(
      `No shared apply helper at ${mod}. It ships in the main myne repo as ` +
        "preview/src/apply.mjs; point MYNE_DIR at a checkout.",
    );
  }
  return import(pathToFileURL(mod).href);
}

/**
 * The captured interface with `theme` painted onto it.
 *
 * **The palette goes on as an INLINE STYLE, not a `:root` block, and that is
 * load-bearing rather than stylistic.** It is what the app does
 * (`applyCustomTheme` → `root.style.setProperty`), and a `<style>:root{…}</style>`
 * does not reproduce it: `tokens.css` carries
 * `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]):not(…):not(…) }`,
 * whose three `:not()`s outrank a bare `:root` — so under a dark-preferring
 * headless Chrome (which is the default), every light theme rendered DARK while
 * its ornament and layout were perfectly correct. An inline style outranks any
 * stylesheet and therefore cannot lose that argument.
 *
 * Values still pass through `theme-validator` before a theme can merge (CI lints
 * every submission), and a KEY OR VALUE carrying a quote is dropped here anyway
 * — an attribute is a different escaping context from a declaration block, and
 * this one is assembled by string. The website builder faces UNVALIDATED input
 * from a live form and must go through per-property `setProperty` instead
 * (SYNC-4).
 */
export function previewHtml(theme, html, css, appearance = "light", apply) {
  // BOTH halves are interpolated into the attribute, so both are filtered. The
  // value-only version of this filter shipped with a docstring claiming it
  // covered the pair: a key of `--a" onload="…` closed the attribute and put a
  // live event handler in a `file://` page that this file then renders with
  // headless Chrome under `--no-sandbox`. CI's `is_allowed_key` stops such a
  // theme MERGING, but this is a local CLI that `JSON.parse`s whatever it is
  // pointed at — a maintainer rendering an untrusted PR's card runs it before
  // the gate that would have caught it.
  const unsafe = /["'<>]/;
  const vars = Object.entries(theme)
    .filter(([k]) => k.startsWith("--") && !k.startsWith("--_") && !unsafe.test(k))
    .filter(([, v]) => !unsafe.test(String(v)))
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  const attrs = apply.ornamentAttributes(theme, apply.drawableOrnaments(css));
  const attrText = Object.entries(attrs)
    .map(([k, v]) => (v === "" ? ` ${k}` : ` ${k}="${v}"`))
    .join("");

  // The BASE the palette is laid over.
  //
  // A theme supplies the twenty-one required colours plus whatever else it cares
  // about; everything it leaves out — most `--syntax-*`, the highlight family,
  // shadows — falls through to `tokens.css`. Which fallback it lands on is
  // decided by `data-theme`, so a dark theme has to sit on the dark base or its
  // unset tokens come back light-on-dark (and vice versa). The captured document
  // carries whichever built-in was active at capture time; replace it with the
  // one this theme declares rather than dropping it, which is the difference
  // between "the tokens it set" and "the theme".
  const base = appearance === "dark" ? "dark" : "light";
  let doc = html.replace(/\sdata-theme="[^"]*"/, "");
  // A REPLACER FUNCTION, not a replacement string — and that is the whole point
  // of this line.
  //
  // `String.prototype.replace` interprets `$1`, `$&`, `` $` `` and `$$` inside a
  // replacement STRING. `$` is not a character the sanitizer above can refuse
  // (a CSS value may legitimately contain one), so a theme key or value of
  // `$1 onload=…` expanded to the captured group — ` lang="en" dir="ltr"` —
  // whose quote closed the `style` attribute and left a live event handler in a
  // `file://` page this file then renders under `--no-sandbox`. The quote
  // filter was doing its job; the substitution put quotes back afterwards.
  //
  // A function receives the interpolated text verbatim: no `$` sequence in
  // `vars` or `attrText` means anything to it.
  doc = doc.replace(
    /<html([^>]*)>/i,
    (_m, existing) => `<html${existing} data-theme="${base}"${attrText} style="${vars}">`,
  );
  const style = `<style>\n${css}\n</style>`;
  return doc.includes("</head>")
    ? doc.replace("</head>", `${style}</head>`)
    : `${style}${doc}`;
}

export async function renderPreview(themeDir, outPath) {
  const chrome = findChrome();
  if (!chrome) throw new Error("No Chrome/Chromium found (set CHROME_BIN).");

  const snap = snapshotDir();
  const htmlPath = join(snap, "preview.html");
  const cssPath = join(snap, "preview.css");
  if (!existsSync(htmlPath) || !existsSync(cssPath)) {
    throw new Error(
      `No captured interface at ${snap}. It ships in the main myne repo as preview/src/ ` +
        "(capture it with ./scripts/capture-theme-preview.sh), or point MYNE_DIR at a checkout.",
    );
  }

  const theme = JSON.parse(readFileSync(join(themeDir, "theme.json"), "utf8"));
  const html = readFileSync(htmlPath, "utf8");
  const css = readFileSync(cssPath, "utf8");
  // `meta.json`'s `appearance` decides which built-in base the theme's unset
  // tokens fall through to. Absent, light is the safer default: a light base
  // under a dark palette shows as wrong immediately, where the reverse can hide.
  let appearance = "light";
  try {
    appearance = JSON.parse(readFileSync(join(themeDir, "meta.json"), "utf8")).appearance ?? "light";
  } catch {
    /* a theme with no readable meta still renders */
  }

  const work = mkdtempSync(join(tmpdir(), "preview-"));
  const pagePath = join(work, "preview.html");
  const apply = await loadApply();
  writeFileSync(pagePath, previewHtml(theme, html, css, appearance, apply));
  // The captured CSS carries the app's `@font-face` rules with absolute
  // `/fonts/*.woff2` paths. Chrome resolves those against the file:// root, so
  // the fonts have to sit where the URLs say — otherwise every card silently
  // renders in a fallback face and the gallery misrepresents the typography as
  // surely as it used to misrepresent ornament.
  const fontsFrom = join(myneDir(), "public", "fonts");
  if (existsSync(fontsFrom)) {
    mkdirSync(join(work, "fonts"), { recursive: true });
    for (const f of ["InterVariable.woff2", "JetBrainsMono.woff2"]) {
      if (existsSync(join(fontsFrom, f))) copyFileSync(join(fontsFrom, f), join(work, "fonts", f));
    }
  }

  const res = spawnSync(
    chrome,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${W},${H}`,
      `--user-data-dir=${join(work, "profile")}`,
      "--no-first-run",
      "--no-default-browser-check",
      // The captured document is a real app screen: web fonts and the ornament
      // layer's gradients need a beat to paint, and a screenshot taken before
      // they land is the stale-looking card nobody can explain.
      "--virtual-time-budget=3000",
      // Pin the color-scheme preference of the RENDERING MACHINE.
      //
      // `tokens.css` ends with `@media (prefers-color-scheme: dark) { :root:not(
      // [data-theme=…]) … }`, which fills in every token the theme did not
      // supply. Headless Chrome reports `dark`, so a light theme's unset tokens
      // — syntax colours, highlights — came back as dark-theme values and were
      // invisible on the theme's own light paper. That is a property of the
      // renderer, not of the theme, and a gallery card must not show it.
      //
      // `preferredColorScheme=1` is light. The theme's own appearance is applied
      // below through `data-theme`, which the `:not()` chain then excludes from
      // the media rule entirely — belt and braces, and each half is load-bearing
      // on its own.
      "--blink-settings=preferredColorScheme=1",
      `--screenshot=${outPath}`,
      `file://${pagePath}`,
    ],
    { timeout: 90000, encoding: "utf8" },
  );
  if (!existsSync(outPath)) {
    throw new Error(`render failed for ${themeDir}: ${res.stderr || res.error}`);
  }
  return outPath;
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [dir, out] = process.argv.slice(2);
  if (!dir || !out) {
    console.error("usage: node tools/render-preview.mjs <theme-dir> <out.png>");
    process.exit(2);
  }
  await renderPreview(dir, out);
  console.log(`rendered ${out}`);
}

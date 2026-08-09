// The gallery renderer's theme→page mapping (myne#394).
//
// Chrome is not exercised here — what is, is everything that decides WHAT gets
// screenshotted: which ornament selections reach the document, which are
// dropped, and whether the palette outranks the captured token sheet.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { loadApply, previewHtml, snapshotDir } from "./render-preview.mjs";

// The reflect logic lives in `@myne/preview`'s `apply.mjs` — the ONE
// implementation, shared with the website builder. This file used to carry its
// own copy and the two had already diverged over `none`. Loading the real module
// here is deliberate: a stub would test the copy that no longer exists.
// The snapshot package lives in the main `myne` repo. CI's `lint` step runs in a
// bare node image with no checkout beside it (only `validate` clones one, into
// `_myne/`), so it can legitimately be absent there.
//
// A SKIP IS ONLY LEGITIMATE WHEN THERE IS NO MAIN-REPO CHECKOUT AT ALL.
//
// "Skip loudly" was the intent and it was not enough: a `console.log` line
// scrolls past, the runner exits 0, and eleven tests report as passing work.
// That is precisely what happened — the path resolution handled only a SIBLING
// checkout, so in the canonical nested layout it pointed at a directory that has
// never existed, and these tests self-skipped for their whole life. One of them
// covers the tint-only on-flag, i.e. a bug a user then had to find by looking at
// the screen.
//
// So the absence is now classified. If `MYNE_DIR` was set deliberately, or a
// main-repo checkout is present, the helper MUST load — anything else is drift
// and fails. Only a genuinely standalone checkout (CI's bare `lint` image)
// skips.
let apply = null;
let loadError = null;
try {
  apply = await loadApply();
} catch (e) {
  loadError = e;
}
if (!apply) {
  const deliberate = Boolean(process.env.MYNE_DIR);
  const checkoutPresent = existsSync(join(snapshotDir(), "..", ".."));
  if (deliberate || checkoutPresent) {
    throw new Error(
      `${loadError.message}\n` +
        "  A main-repo checkout is present (or MYNE_DIR was set), so this is drift, not absence.\n" +
        "  Skipping here is only legitimate in a standalone checkout with no myne repo beside it.",
    );
  }
  console.log(`# skip: ${loadError.message}`);
}
const t = apply ? test : test.skip;
const drawableOrnaments = (css) => apply.drawableOrnaments(css);
const ornamentAttributes = (theme, css) =>
  apply.ornamentAttributes(theme, apply.drawableOrnaments(css));

// A stand-in for the captured stylesheet: two ornament rules and the on-flag,
// written the way `ornaments.css` writes them.
const CSS = `
:root[data-o-on] [data-ornament] { position: relative; }
:root[data-o-box-frame="thick"] [data-ornament="box"] { --_o-frame: inset 0 0 0 3px var(--line-2); }
:root[data-o-box-frame="hairline"] [data-ornament="box"] { --_o-frame: inset 0 0 0 1px var(--line-1); }
:root[data-o-surface-texture="scanline"] [data-ornament="surface"]::before { display: block; }
`;

const HTML = '<html lang="en" data-theme="light"><head><title>x</title></head><body>hi</body></html>';

t("the drawable vocabulary comes from the stylesheet, not a list", () => {
  const drawable = drawableOrnaments(CSS);
  assert.deepEqual([...drawable.get("data-o-box-frame")].sort(), ["hairline", "thick"]);
  assert.deepEqual([...drawable.get("data-o-surface-texture")], ["scanline"]);
  assert.equal(drawable.has("data-o-box-fold"), false);
});

t("reflects a selection the stylesheet can draw", () => {
  const attrs = ornamentAttributes({ "--box-frame": "thick" }, CSS);
  assert.equal(attrs["data-o-box-frame"], "thick");
  assert.equal(attrs["data-o-on"], "");
});

t("drops a selection no rule matches, rather than putting it in the DOM", () => {
  // An attribute nothing selects on is the exact failure the website builder
  // shipped with: the selection reflected, and the page drew nothing.
  const attrs = ornamentAttributes({ "--box-frame": "quilted", "--box-fold": "dogear" }, CSS);
  assert.equal(attrs["data-o-box-frame"], undefined);
  assert.equal(attrs["data-o-box-fold"], undefined);
  assert.equal(attrs["data-o-on"], undefined);
});

t("a tint-only theme still gets the on-flag", () => {
  // `--tint` reflects to no attribute of its own — the stylesheet reads it
  // through var() — but every rule that draws it is scoped under `data-o-on`.
  const attrs = ornamentAttributes({ "--tint": "#ff5cae", "--tint-strength": "0.1" }, CSS);
  assert.equal(attrs["data-o-on"], "");
});

t("a colour-only theme reflects nothing at all", () => {
  const attrs = ornamentAttributes({ "--accent": "#7a4a1f", "--paper": "#f5f1e6" }, CSS);
  assert.deepEqual(attrs, {});
});

t("the page sits on the declared base and carries the palette", () => {
  const page = previewHtml({ "--accent": "#7a4a1f", "--box-frame": "thick" }, HTML, CSS, "light", apply);
  assert.match(page, /data-theme="light"/, "the theme sits on its declared base");
  assert.match(page, /data-o-box-frame="thick"/);
  // The palette must land as an INLINE style on <html>, not as a `:root` block.
  // `tokens.css` carries a `@media (prefers-color-scheme: dark)` rule selected by
  // `:root:not(…):not(…):not(…)`, which outranks a bare `:root` — so a `<style>`
  // block loses, and every light theme rendered dark under headless Chrome while
  // its ornament and layout looked perfect.
  assert.match(page, /<html[^>]*style="[^"]*--accent:#7a4a1f;/);
});

t("a dark theme sits on the dark base, so its unset tokens fall through right", () => {
  // A theme supplies its own colours and leaves most `--syntax-*`, the highlight
  // family and the shadows to `tokens.css`. Land a dark palette on the light
  // base and every one of those comes back light-on-dark — which is what a
  // gallery card showed before the base was declared rather than dropped.
  const page = previewHtml({ "--paper": "#14121f" }, HTML, CSS, "dark", apply);
  assert.match(page, /data-theme="dark"/);
  assert.doesNotMatch(page, /data-theme="light"/);
});

t("never lets a theme write the ornament layer's private namespace", () => {
  // `--_o-ceiling` is the bound the tint wash is clamped by; a palette that
  // could set it could raise its own ceiling.
  const page = previewHtml({ "--_o-ceiling": "1", "--accent": "#000000" }, HTML, CSS, "light", apply);
  assert.doesNotMatch(page, /--_o-ceiling/);
});

t("drops a value that would break out of the style attribute", () => {
  // The attribute is assembled by string concatenation, which is a different
  // escaping context from a declaration block. CI validates every submission
  // before merge, so this is depth rather than the only gate.
  const page = previewHtml({ "--accent": '#fff" onload="x', "--paper": "#000000" }, HTML, CSS, "light", apply);
  assert.doesNotMatch(page, /onload/);
  assert.match(page, /--paper:#000000;/);
});

t("drops a KEY that would break out of the style attribute", () => {
  // The value-only filter shipped with a docstring claiming it covered the pair.
  // A key of `--a" onload="…` closes the attribute and lands a live event
  // handler in a file:// page this tool then renders with headless Chrome under
  // --no-sandbox. CI stops such a theme merging; a maintainer rendering an
  // untrusted PR's card locally runs it first.
  const page = previewHtml({ '--a" onload="alert(1)': "#fff", "--paper": "#000000" }, HTML, CSS, "light", apply);
  assert.doesNotMatch(page, /onload/);
  assert.match(page, /--paper:#000000;/);
});

t("does not let a `$` sequence re-open the attribute the quote filter closed", () => {
  // The quote filter was doing its job and the SUBSTITUTION put quotes back.
  //
  // The tag is assembled through `String.replace`, whose replacement STRING
  // interprets `$1`, `$&`, `` $` `` and `$$`. `$` is not something the filter
  // can refuse — a CSS value may legitimately contain one — so `$1` expanded to
  // the captured group `lang="en" …`, and that group's own quote closed the
  // `style` attribute and left a live handler in a `file://` page rendered under
  // `--no-sandbox`.
  //
  // Asserted STRUCTURALLY, not by grepping for `onload`: the payload's text
  // legitimately survives INSIDE the style value, where it is inert, so a text
  // match would fail on correct output. What must hold is that no `$` sequence
  // expanded — the emitted tag carries exactly the four attributes it should,
  // hence exactly eight quotes.
  const openingTag = (theme) => {
    const page = previewHtml(theme, HTML, CSS, "light", apply);
    return page.slice(0, page.indexOf(">") + 1);
  };
  // Calibrate against a benign payload of the same shape rather than hardcoding
  // a count — the fixture's attribute list is not this test's business.
  const quotes = (tag) => (tag.match(/"/g) ?? []).length;
  const baseline = quotes(openingTag({ "--x": "1 onload=alert(1)//", "--paper": "#000000" }));
  for (const payload of ["$1 onload=alert(1)//", "$& onload=x//", "$`onload=y//"]) {
    const tag = openingTag({ "--x": payload, "--paper": "#000000" });
    // No quote appeared that the sanitizer did not admit — expansion is the only
    // way one could, since the payloads carry none.
    assert.equal(quotes(tag), baseline, `a $-sequence re-opened the attribute: ${tag}`);
    // …and the sequence is still there verbatim, which is what "did not expand"
    // means. Inside the style value it is inert text.
    assert.ok(tag.includes(payload), `a $-sequence was substituted away: ${tag}`);
  }
  // The same for a KEY, which travels the identical path. `"` is filtered, so
  // the key is dropped outright and nothing of it reaches the tag.
  const keyed = openingTag({ '$1" onload=z': "#fff", "--paper": "#000000" });
  assert.equal(quotes(keyed), baseline, `a $-sequence in a KEY re-opened the attribute: ${keyed}`);
});

t("drops a key carrying an angle bracket or a single quote", () => {
  const page = previewHtml(
    { "--x<script>": "#fff", "--y' onerror='x": "#fff", "--paper": "#111111" },
    HTML,
    CSS,
    "light",
    apply,
  );
  assert.doesNotMatch(page, /onerror/);
  assert.doesNotMatch(page, /<script>/);
  assert.match(page, /--paper:#111111;/);
});

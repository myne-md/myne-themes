// Render an AUTHENTIC gallery preview from a theme's own tokens: a small mock
// Myne UI (sidebar + note + buttons + state chips) styled with the palette and
// screenshotted. Because the preview IS the theme's tokens, it cannot
// misrepresent the theme — and authors never submit an image.
//
// Usage: node tools/render-preview.mjs <theme-dir> <out.png>
// Browser: CHROME_BIN env, else common Chrome/Chromium paths (mac + linux CI).

import { readFileSync, writeFileSync, existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const W = 1200;
const H = 760;

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

// Map theme tokens → CSS custom properties on :root, then paint a mock UI.
export function mockHtml(theme) {
  const vars = Object.entries(theme)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
:root{${vars}}
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;}
html,body{width:${W}px;height:${H}px;overflow:hidden;}
.win{width:${W}px;height:${H}px;background:var(--paper);display:flex;
  border:1px solid var(--line-1);}
.side{width:300px;height:100%;background:var(--paper-2);border-right:1px solid var(--line-1);
  padding:26px 20px;display:flex;flex-direction:column;gap:6px;}
.side .title{color:var(--ink-3);font-size:15px;font-weight:700;letter-spacing:1px;
  text-transform:uppercase;margin-bottom:14px;}
.row{padding:12px 14px;border-radius:10px;color:var(--ink-2);font-size:19px;}
.row.active{background:var(--accent-soft);color:var(--accent);font-weight:600;}
.main{flex:1;height:100%;padding:48px 56px;display:flex;flex-direction:column;}
.h1{color:var(--ink-0);font-size:42px;font-weight:800;letter-spacing:-1px;}
.meta{color:var(--ink-3);font-size:18px;margin-top:10px;}
.p{color:var(--ink-1);font-size:22px;line-height:1.6;margin-top:28px;max-width:640px;}
.p .dim{color:var(--ink-2);}
.p .acc{color:var(--accent);font-weight:600;}
.controls{margin-top:40px;display:flex;align-items:center;gap:16px;}
.btn{background:var(--accent);color:var(--accent-on);font-size:20px;font-weight:600;
  padding:14px 26px;border-radius:12px;}
.btn.ghost{background:transparent;color:var(--ink-2);border:1px solid var(--line-2);}
.chips{margin-left:auto;display:flex;gap:12px;}
.chip{width:18px;height:18px;border-radius:50%;}
.line{height:1px;background:var(--line-1);margin-top:36px;}
</style></head><body>
<div class="win">
  <aside class="side">
    <div class="title">Notes</div>
    <div class="row active">Welcome</div>
    <div class="row">Ideas</div>
    <div class="row">Reading list</div>
    <div class="row">Journal</div>
  </aside>
  <section class="main">
    <div class="h1">A theme, previewed</div>
    <div class="meta">Edited just now · 2 min read</div>
    <div class="p">This preview is rendered from the theme's own
      <span class="acc">design tokens</span> — <span class="dim">so it can never
      misrepresent how the theme actually looks in Myne.</span></div>
    <div class="line"></div>
    <div class="controls">
      <div class="btn">New note</div>
      <div class="btn ghost">Import</div>
      <div class="chips">
        <div class="chip" style="background:var(--danger)"></div>
        <div class="chip" style="background:var(--warning)"></div>
        <div class="chip" style="background:var(--success)"></div>
      </div>
    </div>
  </section>
</div></body></html>`;
}

export function renderPreview(themeDir, outPath) {
  const chrome = findChrome();
  if (!chrome) throw new Error("No Chrome/Chromium found (set CHROME_BIN).");
  const theme = JSON.parse(readFileSync(join(themeDir, "theme.json"), "utf8"));
  const work = mkdtempSync(join(tmpdir(), "preview-"));
  const htmlPath = join(work, "preview.html");
  writeFileSync(htmlPath, mockHtml(theme));
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
      `--screenshot=${outPath}`,
      `file://${htmlPath}`,
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
  renderPreview(dir, out);
  console.log(`rendered ${out}`);
}

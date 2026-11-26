// Build the gallery index: walk themes/<slug>/ → a single index.json the
// myne-website /themes page consumes at build time. Deterministic (sorted by
// slug) so the output is stable and diffable.

import { readFileSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const THEMES_DIR = join(HERE, "..", "themes");

// The published repo coordinates the download/GitHub links point at.
export const REPO = {
  org: "myne-md",
  name: "myne-themes",
  branch: "develop",
};

const rawBase = (slug, file) =>
  `https://raw.githubusercontent.com/${REPO.org}/${REPO.name}/${REPO.branch}/themes/${slug}/${file}`;
const treeBase = (slug) =>
  `https://github.com/${REPO.org}/${REPO.name}/tree/${REPO.branch}/themes/${slug}`;

/** The 5-swatch chiplet the app derives — background/surface/foreground/accent/line. */
export function swatches(theme) {
  return {
    background: theme["--paper"],
    surface: theme["--paper-2"],
    foreground: theme["--ink-1"],
    accent: theme["--accent"],
    line: theme["--line-1"],
  };
}

/** Build one index row from a theme dir (pure; takes already-parsed objects). */
export function buildRow(slug, theme, meta) {
  const row = {
    slug,
    name: meta.name,
    author: meta.author,
    description: meta.description,
    license: meta.license,
    github: treeBase(slug),
    download: rawBase(slug, "theme.json"),
    preview: `previews/${slug}.png`,
    swatches: swatches(theme),
  };
  if (meta.appearance) row.appearance = meta.appearance;
  if (meta.homepage) row.homepage = meta.homepage;
  return row;
}

/** Walk a themes directory into a sorted array of index rows. */
export function buildIndex(themesDir = THEMES_DIR) {
  const slugs = readdirSync(themesDir)
    .filter((d) => {
      try {
        return statSync(join(themesDir, d)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
  const rows = [];
  for (const slug of slugs) {
    const dir = join(themesDir, slug);
    const theme = JSON.parse(readFileSync(join(dir, "theme.json"), "utf8"));
    const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
    rows.push(buildRow(slug, theme, meta));
  }
  return rows;
}

// CLI: node tools/build-index.mjs [out.json]  (default: ./index.json)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = process.argv[2] || join(HERE, "..", "index.json");
  const index = buildIndex();
  writeFileSync(out, JSON.stringify({ themes: index }, null, 2) + "\n");
  console.log(`wrote ${out} (${index.length} themes)`);
}

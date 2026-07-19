import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, buildRow, swatches, REPO } from "./build-index.mjs";
import { loadSchema } from "./lint-theme.mjs";

// SPDX ids the gallery accepts — the single source of truth is the meta schema
// (a faithful port keeps its upstream license, usually MIT), NOT a fixed default.
const ALLOWED_LICENSES = loadSchema().properties.license.enum;

const theme = {
  "--paper": "#17150f",
  "--paper-2": "#1e1c14",
  "--ink-1": "#e8e4d8",
  "--accent": "#d99a4e",
  "--line-1": "#2c2920",
};
const meta = {
  name: "Nocturne",
  author: "Myne",
  description: "A warm dark theme.",
  license: "CC-BY-4.0",
  appearance: "dark",
};

test("swatches pulls the 5 chiplet tokens", () => {
  assert.deepEqual(swatches(theme), {
    background: "#17150f",
    surface: "#1e1c14",
    foreground: "#e8e4d8",
    accent: "#d99a4e",
    line: "#2c2920",
  });
});

test("buildRow produces correct raw + tree links and preview path", () => {
  const row = buildRow("nocturne", theme, meta);
  assert.equal(
    row.download,
    `https://raw.githubusercontent.com/${REPO.org}/${REPO.name}/${REPO.branch}/themes/nocturne/theme.json`,
  );
  assert.equal(
    row.github,
    `https://github.com/${REPO.org}/${REPO.name}/tree/${REPO.branch}/themes/nocturne`,
  );
  assert.equal(row.preview, "previews/nocturne.png");
  assert.equal(row.appearance, "dark");
  assert.equal(row.name, "Nocturne");
});

test("buildRow omits appearance/homepage when absent", () => {
  const row = buildRow("x", theme, {
    name: "X",
    author: "Y",
    description: "Z",
    license: "CC-BY-4.0",
  });
  assert.equal("appearance" in row, false);
  assert.equal("homepage" in row, false);
});

test("buildIndex reads the real seed themes, sorted, one row each", () => {
  const idx = buildIndex(); // default themes dir
  const slugs = idx.map((r) => r.slug);
  assert.deepEqual(slugs, [...slugs].sort(), "rows are sorted by slug");
  assert.ok(slugs.includes("nocturne"));
  assert.ok(slugs.includes("warm-paper"));
  for (const row of idx) {
    assert.ok(row.name && row.author && row.description, "row has metadata");
    assert.ok(
      ALLOWED_LICENSES.includes(row.license),
      `${row.slug}: license "${row.license}" not in the schema's allowed SPDX set`,
    );
    assert.ok(row.swatches.background.startsWith("#"));
  }
});

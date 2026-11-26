# Licensing

`myne-themes` is **multi-licensed by path**. The table is the whole repository:
a path that is not listed here has no licence of its own and is governed by the
nearest applicable file, which is why a new top-level directory is a licensing
question rather than a housekeeping one.

| Path / material | What it is | License | File |
|---|---|---|---|
| `themes/**` (original) | Community themes authored by the contributor | **CC-BY-4.0** (default) | [`LICENSE`](LICENSE) |
| `themes/**` (ports) | Faithful ports of an existing scheme | **its upstream license** (per `meta.json`, usually MIT) | the theme's `meta.json` + [`NOTICE`](NOTICE) |
| `README.md`, `CONTRIBUTING.md`, `GOVERNANCE.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `TRADEMARK.md`, `NOTICE`, `LICENSING.md` | Documentation and project prose | **CC-BY-4.0** | [`LICENSE`](LICENSE) |
| `schema/**`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md` | Theme-format schema and contribution templates | **CC-BY-4.0** | [`LICENSE`](LICENSE) |
| `tools/**`, `scripts/**`, `fixtures/**`, `lefthook.yml`, `.github/workflows/**` | Tooling: validator wrapper, lints, index/preview generators, CI | **AGPL-3.0-only** | [`LICENSE-TOOLING`](LICENSE-TOOLING) |
| `.github/banner.gif`, `.github/banner.png` | Visual and brand assets | **All rights reserved** | [`LICENSE-ASSETS`](LICENSE-ASSETS) |

The Myne name, wordmark, "M" mark and app icon are not covered by CC-BY-4.0 or
AGPL-3.0-only. Their usage policy is in [`TRADEMARK.md`](TRADEMARK.md).

## Original themes → CC-BY-4.0 (default)

A theme you authored yourself is licensed Creative Commons Attribution 4.0
International. You may use, share, and adapt it, including commercially, as long
as you credit the author — the gallery does this by showing each theme's
`author`. By submitting one you certify the Developer Certificate of Origin (the
DCO line in the PR template): it is your original work (or you have the right to
contribute it) and does not infringe anyone's copyright or trademark.

## Ported themes → the upstream license

A faithful port of an existing color scheme is not relicensed. It keeps the
upstream scheme's license (declared in the theme's `meta.json` `license`,
usually MIT), credits the original author in `author`, and links the source in
`upstream`. Only permissive SPDX licenses are accepted (see
[`schema/meta.schema.json`](schema/meta.schema.json)); a port whose upstream
terms forbid redistribution or adaptation is not admissible. The bundled ports'
copyright lines, the MIT text, and the trademark / non-affiliation disclaimer
live in [`NOTICE`](NOTICE).

A port reproduces only the upstream palette (color values, re-expressed into
Myne's own tokens), not upstream code, token names, or files.

## Tooling → AGPL-3.0-only

The validator wrapper, contrast and metadata lints, gallery/index and preview
generators, tests, CI configuration and fixtures are AGPL-3.0-only, matching the
Myne application code. This does not reach the themes: a theme file is data and
stays under its own license above.

## Documentation and schema → CC-BY-4.0

The README, contribution/governance/security/trademark prose, the contribution
templates, and the theme-format schema are CC-BY-4.0 so they can be reused and
translated with attribution.

## Visual assets

The banners and the Myne Marks are all rights reserved; see
[`LICENSE-ASSETS`](LICENSE-ASSETS) and [`TRADEMARK.md`](TRADEMARK.md).

Copyright (C) 2026 Myne contributors.

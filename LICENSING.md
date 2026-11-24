# Licensing

`myne-themes` is **dual-licensed by subtree**, mirroring the main
[`myne`](https://github.com/myne-md/myne) repo's `LICENSING.md` split.

| Subtree | What it is | License | File |
|---|---|---|---|
| `themes/**` (original) | Community themes authored by the contributor | **CC-BY-4.0** (default) | [`LICENSE-THEMES`](LICENSE-THEMES) |
| `themes/**` (ports) | Faithful ports of an existing scheme | **its upstream license** (per `meta.json`, usually MIT) | see the theme's `meta.json` + `upstream` |
| everything else | Tooling: CI validator wrapper, contrast/metadata lints, index + preview generators, docs | **AGPL-3.0-only** | [`LICENSE-TOOLING`](LICENSE-TOOLING) |

## Original themes → CC-BY-4.0 (default)

A theme you **authored yourself** is licensed **Creative Commons Attribution 4.0
International**. You may use, share, and adapt it, including commercially, **as long
as you credit the author** — the gallery does this automatically by showing each
theme's `author`. By submitting one you certify the **Developer Certificate of
Origin** (the DCO line in the PR template): it is your original work (or you have
the right to contribute it) and does not infringe anyone's copyright or trademark.
This mirrors the main repo's `docs/` choice — CC-BY keeps the work reusable *as long
as the author is credited*.

## Ported themes → the upstream license

A **faithful port** of an existing color scheme (Dracula, Nord, Solarized, …) is
**not** relicensed. It keeps the upstream scheme's license (declared in the theme's
`meta.json` `license`, usually `MIT`), credits the **original author** in `author`,
and links the source in `upstream`. Only permissive SPDX licenses are accepted (see
[`schema/meta.schema.json`](schema/meta.schema.json)); a port whose upstream terms
forbid redistribution/adaptation is **not** admissible. Redistributing here honors
the upstream terms (attribution + license text preserved via `meta.json`).

The bundled ports' upstream copyright lines, the MIT permission text they are
redistributed under, and the trademark / non-affiliation disclaimer for the scheme
names live in [`NOTICE`](NOTICE). Adding a new port adds its attribution there in
the same PR. A port reproduces only the upstream **palette** (color values,
re-expressed into Myne's own tokens) — not upstream code, token names, or files.

## Tooling → AGPL-3.0

The CI scripts, lints, and gallery generators are **AGPL-3.0-only**, matching the
Myne application code.

> SPDX: `CC-BY-4.0` (themes) · `AGPL-3.0-only` (tooling).

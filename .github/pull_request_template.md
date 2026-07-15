<!-- One theme per PR. See CONTRIBUTING.md. -->

## Theme

- **Name:**
- **Slug (folder):** `themes/<slug>/`
- **Author (as it should appear in the gallery):**
- **Light / dark:**

## Submission checklist

- [ ] One theme in this PR (one `themes/<slug>/` folder).
- [ ] `theme.json` **validates** locally: `cargo run -p theme-validator --bin validate -- themes/<slug>/theme.json` exits 0.
- [ ] All **required-core** tokens present; dark themes also set `--syntax-*` / `--label-*`.
- [ ] `meta.json` is complete. For an **original** theme, `license` is `CC-BY-4.0`. For a **port**, `license` is the upstream license (e.g. `MIT`), `author` is the original creator, and `upstream` links the source.
- [ ] I checked **contrast** — text is readable on the theme's own surfaces.
- [ ] The palette is **not deceptive** — `--danger` reads as danger, `--success` as success, etc.
- [ ] No `preview.png` added by me (CI renders it from `theme.json`).
- [ ] I read the [Code of Conduct](../CODE_OF_CONDUCT.md).

## Developer Certificate of Origin (DCO)

By submitting this pull request I certify that **one** of the following holds:

> **Original theme:** I license this theme under **CC-BY-4.0**, it is my original
> work (or I have the right to contribute it), and it does not infringe any third
> party's copyright or trademark.
>
> **Port:** this is a faithful port of an existing scheme whose upstream license
> (declared in `meta.json`) **permits** redistribution and adaptation; I have
> preserved its license and credited the original author, and I am not
> misrepresenting authorship.

- [ ] I agree to the applicable statement above.

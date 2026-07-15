# Governance

`myne-themes` is a curated community repository under the
[`myne-md`](https://github.com/myne-md) organization.

## Roles

- **Maintainer(s)** — listed in [`.github/CODEOWNERS`](.github/CODEOWNERS). Own
  merges and takedowns. Every submission requires a maintainer approval; there is
  **no auto-merge**.

## Review model

Every PR is gated in two layers:

1. **CI (objective, automated)** — runs the exact Myne `theme-validator`, a WCAG
   contrast lint, and a `meta.json` schema/license check. All must pass.
2. **Maintainer review (subjective, human)** — judges what CI cannot: semantic
   color deception (e.g. a destructive-action color made to look safe), overall
   quality/taste, spam, and licensing legitimacy.

CI passing is necessary but **not sufficient** — a maintainer must still approve.

## Takedown policy

A theme may be **removed from the repo and gallery** if it is:

- **Deceptive** — a valid palette engineered to mislead (danger-looks-safe, etc.).
- **Infringing** — clones a trademarked brand's identity or a paid/proprietary
  theme, or otherwise violates the license it was submitted under (the CC-BY-4.0
  grant for an original theme, or a port's upstream license / attribution terms).
- **Malicious or abusive** — any attempt to weaponize the theme surface, or
  harassment/abuse via metadata.

Anyone can flag a theme via the **"report a theme"** issue template. A maintainer
reviews and, if warranted, deletes the theme folder; CI regenerates the gallery
index without it.

**Scope of a takedown:** a download is a **device-local copy**. Removing a theme
here stops *offering* it (repo + `myne.md/themes`); it does **not** and cannot
uninstall copies users already downloaded — Myne is local-first and never reaches
into a user's device. There is deliberately **no client-side revocation channel**
(it would require the app to phone home, which Myne does not do). The client's
re-validation on import remains the only device-side safety.

## Changes to governance

Governance changes are proposed as PRs to this file and approved by the
maintainer(s).

# Fixtures

A corpus that pins CI behaviour: the validator + contrast lint (task 5) assert
against these so a regression in either is caught. Expected outcomes were verified
against the real `theme-validator` `validate` binary from the main repo.

## `valid/` — must PASS `validate` (exit 0)

| File | Notes |
|---|---|
| `minimal.json` | Exactly the 21 required-core tokens, all allowlist-valid. |
| `full.json` | Required core + optional `--syntax-*` / `--label-*` tokens. |

## `invalid/` — must FAIL `validate` (exit 1) with the stated reason

| File | Expected `ThemeError` |
|---|---|
| `injection-url.json` | `{"kind":"InvalidValue","key":"--accent"}` — `url(evil.png)` |
| `injection-import.json` | `{"kind":"InvalidValue","key":"--danger"}` — `red; @import "x"` |
| `injection-expression.json` | `{"kind":"InvalidValue","key":"--accent"}` — `expression(alert(1))` |
| `injection-javascript.json` | `{"kind":"InvalidValue","key":"--accent"}` — `javascript:alert(1)` |
| `injection-var.json` | `{"kind":"InvalidValue","key":"--accent"}` — `var(--x)` |
| `injection-calc.json` | `{"kind":"InvalidValue","key":"--accent"}` — `calc(1px + 2px)` |
| `missing-key.json` | `{"kind":"MissingKey","key":"--accent"}` |
| `malformed.json` | `{"kind":"ParseError","line":3}` |

## `contrast/` — both PASS `validate`; the contrast lint distinguishes them

The value allowlist accepts any *valid color*, so it cannot catch an unreadable
palette. These two both pass `validate` (exit 0); the WCAG **contrast lint**
(task 5) must **pass `good.json` and fail `bad.json`**.

| File | Validator | Contrast lint |
|---|---|---|
| `good.json` | pass | pass (legible ink on paper) |
| `bad.json` | pass | **fail** (`--ink-1`/`--ink-2` ≈ `--paper`) |

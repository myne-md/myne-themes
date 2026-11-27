# Security Policy

## Reporting a vulnerability

Report security issues to **security@myne.md** privately. You can also use
GitHub private vulnerability reporting: open this repository's **Security** tab
and choose **Report a vulnerability**. Please do not open a public GitHub issue
for a vulnerability.

If you do not get an acknowledgment within 5 business days, send a reminder; the
address may have failed silently.

## What to include

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- The affected component: this repository, the theme validator in
  `myne-md/myne`, or the gallery/website.
- Any suggested mitigation.
- How you want to be credited.

## Response commitment

- Acknowledge within 5 business days.
- Initial assessment within 14 days.
- Coordinated disclosure: we ask for a 90-day window from acknowledgment,
  extended by agreement if a fix needs more time.

## Scope

In scope:

- The theme format and the `theme-validator` crate it is checked against: a
  value that passes the allowlist and can still escape the intended CSS-value
  surface, or a contrast rule that can be bypassed.
- The gallery/index generator and the download/GitHub links it publishes.
- A published theme that is deceptive, malicious, or infringes a license.

Out of scope:

- A user's local copy of a downloaded theme. Takedown removes the offer, not the
  device-local file; there is deliberately no client-side revocation channel.
- Third-party color schemes: report upstream first; we will relay.
- Self-hosted deployments run by third parties.

## Pre-1.0 caveat

Myne is pre-alpha and the theme surface is young. Reports outside the documented
value allowlist are still welcome, but may be classified as known limitations.

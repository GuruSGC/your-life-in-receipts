# Security policy

## Supported versions

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please open a private security advisory on GitHub, or contact the maintainer through the GitHub profile. Do not open a public issue for a vulnerability.

You can expect an acknowledgement within a few days. The app is frontend only, has no accounts and stores nothing but the chosen theme in the browser, so the realistic risks are cross-site scripting and dependency vulnerabilities.

## What the project already does

- All text is rendered through React; there are no raw HTML sinks (`innerHTML`, `dangerouslySetInnerHTML`, `eval`).
- A strict Content Security Policy and the other security headers are set in `vercel.json`, and a verification script confirms the built app runs under them without violations.
- `npm audit --omit=dev` is clean, and the number of runtime dependencies is kept small.
- The only value read back from storage is the theme, behind one guarded service that validates it.

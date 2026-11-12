# Distribute the project MIT license notice

**Type:** Fix

**Source:** Audit 2026-11-12 REC-02 (FND-02)

## Summary

| Field         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| Intent        | Ship the project's own MIT notice inside web and desktop artifacts |
| Key decisions | none                                                               |
| Open risks    | Installer formats for unbuilt targets need the same check when     |
|               | they are produced                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`LICENSE` conditions distribution on including its copyright and
permission notice. The Electron `build.files` list ships `dist/**/*`,
`electron/**/*`, and `package.json` but not the root `LICENSE`, and the
web bundle has no `dist/LICENSE`. The unpacked macOS app carries
dependency notices such as `argparse/LICENSE` and `font/UFL.txt` but not
the project's own terms.

Every distributed artifact must carry the project MIT notice - in the web
bundle and inside the packaged desktop resources, not only as
`LICENSE.electron.txt` or as a repository file the bundle never sees.
Per-dependency notices already present stay untouched.

## Use Cases

- When the web build completes, `dist/` contains the project license
  text.
- When the desktop app is packaged, the project's copyright and
  permission notice ships inside the application resources.
- When an installer is produced later, the same check applies to it.

## Hints

- Options are a `build.files` or `extraResources` entry for packaging and
  a public-asset or build-step copy for the web bundle - pick the
  mechanism that keeps the file a verbatim copy of `LICENSE`.
- Verify by inspecting actual packaged contents, mirroring the audit's
  `E12` check: ASAR listing plus a `test -e dist/LICENSE` equivalent.
- Sites: `LICENSE`, `package.json` `build.files`, `vite.config.ts`,
  `public/`.

## Out of Scope

- Regenerating or auditing third-party dependency notices.
- Code signing or notarization work.

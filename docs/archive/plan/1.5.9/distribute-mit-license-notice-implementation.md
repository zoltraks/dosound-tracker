# Distribute the Project MIT License Notice Implementation Plan

**Change Request Reference:** `docs/change/1.5.9/distribute-mit-license-notice.md`

## Summary

| Field         | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Intent        | Ship the verbatim `LICENSE` inside `dist/` and packaged apps      |
| Key decisions | `public/LICENSE` is the tracked verbatim copy; a guard test keeps |
|               | it equal to the root file                                         |
| Open risks    | Installer targets are unbuilt - the artifact check reruns when    |
|               | they exist                                                        |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Best Practices

Follow `docs/standard/typescript-react-development.md`: no new runtime
code beyond configuration; the guard test is a pure file comparison.

## Documentation Updates

- `DEPLOYMENT.md` - distributed artifact contents now include the
  project license notice.

## Type and State Updates

None - packaging configuration only.

## Step by Step Implementation

**Ship the license in the web bundle**

Place a verbatim copy of `LICENSE` at `public/LICENSE` so the Vite build
emits `dist/LICENSE`.

File to create: `public/LICENSE`.

**Ship the license in packaged apps**

Add `LICENSE` to the electron-builder `build.files` list so the ASAR
carries the project notice alongside the dependency notices already
present.

File to modify: `package.json` (`build.files`).

**Guard the copy against drift**

Add a guard test asserting `public/LICENSE` is byte-identical to the
root `LICENSE`, next to the existing directory-purity guard.

File to create: `test/guard/licenseNotice.test.ts`.

## Implementation Order

1. Update documentation.
2. `public/LICENSE` copy.
3. `build.files` entry.
4. Guard test.
5. Verification loop.

## Testing Strategy

**Unit tests**

`test/guard/licenseNotice.test.ts` - read both files, assert identical
contents; assert `package.json` `build.files` contains `LICENSE`.

**Integration tests**

Post-build artifact check: `dist/LICENSE` exists; an unpacked package
inspection (the audit's `E12` procedure) finds the project notice inside
the ASAR - run manually with `electron-builder --dir` as the release
gate does.

## Verification

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`,
  `npm test` - all clean.
- `test -e dist/LICENSE` passes; unpacked macOS app contains the notice.

## Refinements

Recorded as the implementation landed.

- The packaged ASAR carries the notice twice: `/LICENSE` from the
  `build.files` entry and `/dist/LICENSE` from the `public/LICENSE` copy -
  a harmless duplication that covers both the app root and the bundle.

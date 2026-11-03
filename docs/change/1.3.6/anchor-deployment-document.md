# Anchor the Deployment Document to the Real Deployment

**Type:** Chore

**Source:** ASE evaluation findings, 2026-11-03

## Summary

| Field         | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Intent        | Rewrite `DEPLOYMENT.md` so every claim is anchored in the repository  |
| Key decisions | Remove unanchored boilerplate; keep and keep only the real deployment |
| Open risks    | Generic hosting guidance is dropped rather than re-anchored elsewhere |

## Description

`DEPLOYMENT.md` carries content not anchored in the repository:

- An environment-variables table documenting `VITE_APP_TITLE` and `VITE_APP_VERSION`, neither of which is referenced in `src/`, `electron/`, or `vite.config.ts`.
- A Dockerfile and `nginx.conf` example, a health-check endpoint, CDN guidance, security headers, and analytics suggestions (Google Analytics 4, Sentry) - the repository has no Dockerfile, no container deployment, and no analytics integration.
- A generic static-hosting table (Vercel, Netlify, GitHub Pages, AWS S3, Azure Static) and per-platform rollback notes for platforms the project does not use.

The rewrite keeps the real deployment surface:

- `npm run build` producing `dist/` (no version bump) and `npm run bump` for the bumped build.
- The service worker at `/sw.js` with the versioned `dosound-tracker-<version>` cache and network-first strategy.
- The Content-Security-Policy injection into `dist/index.html` via `vite.config.ts`.
- `npm run electron:build` packaging with electron-builder into `release/` for macOS, Windows, and Linux.
- Release integrity via `SHA256SUMS-<platform>.txt` from `scripts/afterAllArtifactBuild.cjs`.
- The unsigned-binaries evaluation and the macOS quarantine workaround.
- The dosound.alyx.pl download page and a short static-SPA hosting note.

## Execution

- Remove the environment-variables, Docker, nginx, health-check, CDN, security-headers, analytics, and rollback sections.
- Keep the sections listed above and reword them only where they depend on removed content.
- Replace the generic hosting table with a statement that `dist/` deploys to any static host, naming the project's own host as the live deployment.

## Out of Scope

- No new deployment infrastructure is created.
- No changes outside `DEPLOYMENT.md`.

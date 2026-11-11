# Deployment

## Build Output

**Toolchain**

Builds require the toolchain floor declared in `package.json` `engines`
(Node `>=26.13.0`, npm `>=11.20.0`), pinned exactly by `.nvmrc` and enforced
at install time through `.npmrc`. Clean installs print `npm warn install-scripts` prompts for `electron-winstaller` and `fsevents` - allowlist notices from the host npm policy, not project defects.

**Production Build**

```bash
npm run build
```

Creates the `dist/` directory with:

- `index.html`, the entry HTML file.
- `js/`, JavaScript bundles - `index.js` entry, `sequencer.js` worker, `export.js` lazy export chunk.
- `css/`, the bundled stylesheet.
- `media/`, emitted assets grouped by type - `svg/`, `png/`, `font/`, plus `icon/` holding the application icons.
- `worker.js`, the service worker at the bundle root.
- Static assets from `public/`.

The build command does not bump the version. To bump the version and build, run `npm run bump` instead.

The Vite build configuration in `vite.config.ts` emits deterministic asset filenames without content hashes - `js/[name].js` for app and worker bundles, `css/[name][extname]` for stylesheets, and `media/<type>/[name][extname]` for emitted assets routed by extension - which keeps the packaged Electron file layout stable. The build also defines `__APP_VERSION__` from `package.json` for in-app display.

## Service Worker Cache

The production build registers a service worker at `/worker.js` that keeps the application available offline. The cache name carries the application version (`dosound-tracker-<version>`), baked into `dist/worker.js` during the build by the `version-service-worker-cache` plugin, so each deploy installs a fresh cache and the activate handler removes the previous version's entries.

All same-origin requests use a network-first strategy: the worker fetches the deployed asset, updates the cache, and falls back to the cached copy only when the network is unavailable. Returning clients therefore always receive the current build. Navigation requests fall back to `/index.html` when offline.

Every production build also injects a restrictive `Content-Security-Policy` meta tag into `dist/index.html` - the directive list is defined by the `inject-content-security-policy` plugin in `vite.config.ts` and ships to both web deploys and the packaged Electron bundle.

## Electron Distribution

The desktop build wraps the same bundle in Electron and is packaged with `electron-builder`.

```bash
npm run electron:build
```

Outputs to `release/`:

- macOS: `.dmg` and `.zip` for Intel and Apple Silicon.
- Windows: NSIS installer and `.zip`.
- Linux: AppImage and `.tar.gz`.

**Release Integrity**

Each desktop build writes `SHA256SUMS-<platform>.txt` into `release/` through the `afterAllArtifactBuild` hook in `scripts/afterAllArtifactBuild.cjs`. The file lists one SHA-256 line per produced artifact in `sha256sum` format and is returned to electron-builder so it is published beside the artifacts. Recipients verify a download with `shasum -a 256 -c SHA256SUMS-<platform>.txt`.

**Code Signing Evaluation**

Desktop binaries are unsigned today: macOS builds carry the documented quarantine workaround, and Windows and Linux builds ship without a signature. Signing was evaluated and left as a procurement decision outside this change - macOS requires a paid Apple Developer Program membership with notarization, and Windows requires a purchased OV or EV certificate. The published checksums provide verifiable integrity in the meantime.

**macOS Note**

Binaries are not code-signed. After downloading the `.dmg`, macOS may mark it as coming from an unidentified developer.

If that happens, open Terminal in the folder where the file was downloaded and run:

```bash
xattr -dr com.apple.quarantine dosound-tracker-X.Y.Z-mac-arm64.dmg
```

Adjust the file name if a different version was downloaded.

After this, open the `.dmg` and install as usual.

## Download Page

Electron desktop builds can be downloaded from the project home page: https://dosound.alyx.pl

## Web Hosting

The application is a static single-page application. The live deployment is the project home page above - the `dist/` output deploys to any static file host without additional configuration.

# Deployment

## Build Output

**Production Build**

```bash
npm run build
```

Creates the `dist/` directory with:

- `index.html`, the entry HTML file.
- `assets/`, JavaScript bundles, CSS, and fonts.
- Static assets from `public/`.

The build command does not bump the version. To bump the version and build, run `npm run bump` instead.

**Build Optimisation**

- Code splitting by route or feature.
- Tree shaking for unused code.
- Asset compression with gzip and brotli.
- Optional source maps for debugging.
- Deterministic filenames without content hashes for Electron compatibility.

The Vite build configuration is defined in `vite.config.ts`.

## Service Worker Cache

The production build registers a service worker at `/sw.js` that keeps the application available offline. The cache name carries the application version (`dosound-tracker-<version>`), baked into `dist/sw.js` during the build, so each deploy installs a fresh cache and the activate handler removes the previous version's entries.

All same-origin requests use a network-first strategy: the worker fetches the deployed asset, updates the cache, and falls back to the cached copy only when the network is unavailable. Returning clients therefore always receive the current build. Navigation requests fall back to `/index.html` when offline.

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

## Static Hosting

The application is a static single-page application that can be deployed to any static hosting service.

| Platform     | Instructions                              |
| ------------ | ----------------------------------------- |
| Vercel       | Connect Git repo, auto-deploy on push     |
| Netlify      | Drag `dist/` folder or use CLI            |
| GitHub Pages | Use `gh-pages` branch or Actions          |
| AWS S3       | Sync `dist/` to S3 bucket with CloudFront |
| Azure Static | Use Azure CLI or GitHub Actions           |

**Vercel Deployment**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Netlify Deployment**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

## Docker Deployment

Optional Docker configuration for containerised deployment:

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

Build and run:

```bash
docker build -t dosound-tracker .
docker run -p 8080:80 dosound-tracker
```

## Configuration

**Environment Variables**

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `VITE_APP_TITLE`   | Application title (default `DOSOUND Tracker`)     |
| `VITE_APP_VERSION` | Version shown in UI (sourced from `package.json`) |

Define these in an `.env` file for local development, or in hosting platform settings for production.

## Performance Considerations

**CDN Usage**

- Serve static assets via CDN for global distribution.
- Configure long cache headers for versioned assets.
- Use the `immutable` cache directive for hashed filenames.

**Compression**

Enable Brotli or gzip compression:

```nginx
gzip on;
gzip_types text/plain text/css application/javascript application/json;
gzip_min_length 1000;
```

**Security Headers**

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Health Check

Simple health endpoint for container orchestrators. The `index.html` file serves as a health check; if it returns 200, the service is healthy.

```bash
curl -f http://localhost:80/index.html || exit 1
```

## Logging

Client-side logs are available in browser DevTools. There are no server-side logs for static hosting.

For analytics, integrate with services such as:

- Google Analytics 4 for page views and events.
- Sentry for error tracking.
- A custom analytics endpoint.

## Rollback

Versioned deployments enable instant rollback:

- Vercel and Netlify: use the dashboard to promote a previous deployment.
- AWS S3: versioned buckets allow restoring previous versions.
- Docker: tag images with version numbers and roll back by tag.

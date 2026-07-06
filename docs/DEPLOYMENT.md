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

The build command also runs the automated version bump script (`scripts/bump-version.mjs`) before the core build.

**Build Optimisation**

- Code splitting by route or feature.
- Tree shaking for unused code.
- Asset compression with gzip and brotli.
- Optional source maps for debugging.
- Deterministic filenames without content hashes for Electron compatibility.

The Vite build configuration is defined in `vite.config.ts`.

## Electron Distribution

The desktop build wraps the same bundle in Electron and is packaged with `electron-builder`.

```bash
npm run electron:build
```

Outputs to `release/`:

- macOS: `.dmg` and `.zip` for Intel and Apple Silicon.
- Windows: NSIS installer and `.zip`.
- Linux: AppImage and `.tar.gz`.

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
RUN npm run build:core

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

| Variable                | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `VITE_APP_TITLE`        | Application title (default `DOSOUND Tracker`)     |
| `VITE_APP_VERSION`      | Version shown in UI (sourced from `package.json`) |

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

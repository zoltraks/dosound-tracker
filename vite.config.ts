import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import packageJson from './package.json' with { type: 'json' };

// Restrictive CSP injected into dist/index.html on build only. The packaged
// Electron app loads dist/index.html over file://, so connect-src lists the
// file: scheme for the bundled-document fetches. style-src keeps
// 'unsafe-inline' because React style attributes and generated table
// alignment styles count as inline style.
const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self' data:; connect-src 'self' file:; " +
  "worker-src 'self'; manifest-src 'self'; object-src 'none'; " +
  "base-uri 'self'; form-action 'none'";

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'inject-content-security-policy',
      apply: 'build',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />\n  </head>`,
        );
      },
    },
    {
      name: 'version-service-worker-cache',
      apply: 'build',
      closeBundle() {
        const swPath = resolve(import.meta.dirname, 'dist', 'worker.js');
        const source = readFileSync(swPath, 'utf8');
        writeFileSync(swPath, source.replaceAll('__APP_VERSION__', packageJson.version));
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  server: {
    port: 8008,
    host: true,
  },
  preview: {
    port: 8008,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Deterministic filenames without content hashes
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? '';
          if (name.endsWith('.css')) return 'css/[name][extname]';
          if (name.endsWith('.svg')) return 'media/svg/[name][extname]';
          if (name.endsWith('.png')) return 'media/png/[name][extname]';
          if (/\.(woff2?|ttf|otf|eot)$/.test(name)) return 'media/font/[name][extname]';
          return 'media/[name][extname]';
        },
      },
    },
  },
  worker: {
    // Ensure worker bundles (like the sequencer worklet) also get stable filenames
    // without random hashes.
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
});

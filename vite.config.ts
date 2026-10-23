import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import packageJson from './package.json' with { type: 'json' };

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'version-service-worker-cache',
      apply: 'build',
      closeBundle() {
        const swPath = resolve(__dirname, 'dist', 'sw.js');
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
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  worker: {
    // Ensure worker bundles (like sequencerWorker) also get stable filenames
    // without random hashes.
    format: 'es',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

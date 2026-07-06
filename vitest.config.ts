import { defineConfig, mergeConfig } from 'vitest/config';
import { resolve } from 'node:path';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts', './test/setup-localstorage.ts'],
      include: ['test/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'test/', 'e2e/', 'src/**/*.d.ts'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
      onConsoleLog(log, type) {
        if (
          type === 'stderr' &&
          log.includes('Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored.')
        ) {
          return false;
        }
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  })
);

import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

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
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.d.ts',
          'src/types/electronApi.ts', // Type declarations for the preload API.
          'src/main.tsx', // Browser bootstrap exercised by the Playwright smoke suite.
        ],
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
          log.includes(
            'Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored.',
          )
        ) {
          return false;
        }
      },
    },
  }),
);

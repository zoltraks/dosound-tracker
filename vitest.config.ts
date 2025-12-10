import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup-localstorage.ts'],
      onConsoleLog(log, type) {
        if (
          type === 'stderr' &&
          log.includes('Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored.')
        ) {
          return false;
        }
      },
    },
  })
);

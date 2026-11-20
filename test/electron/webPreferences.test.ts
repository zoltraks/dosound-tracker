// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const mainSource = readFileSync(new URL('../../electron/main.cjs', import.meta.url), 'utf8');

describe('Electron window webPreferences', () => {
  it('pins the renderer sandbox explicitly beside the isolation flags', () => {
    try {
      const webPreferences = mainSource.match(/webPreferences:\s*\{([^}]*)\}/)?.[1] ?? '';
      expect(webPreferences).toContain('sandbox: true');
      expect(webPreferences).toContain('contextIsolation: true');
      expect(webPreferences).toContain('nodeIntegration: false');
    } catch (error) {
      console.log('webPreferences block not found in electron/main.cjs');
      throw error;
    }
  });
});

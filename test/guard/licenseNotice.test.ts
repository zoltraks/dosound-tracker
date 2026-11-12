import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../..');

// MIT distribution requires the license text to ship with the bundle:
// public/LICENSE is the verbatim copy the Vite build emits as dist/LICENSE,
// and the electron-builder files list ships the root LICENSE inside the
// packaged app. A drifted copy or a dropped manifest entry silently removes
// the notice from every artifact.
describe('license notice distribution', () => {
  it('public/LICENSE is byte-identical to the root LICENSE', () => {
    try {
      const root = fs.readFileSync(path.join(ROOT_DIR, 'LICENSE'));
      const bundled = fs.readFileSync(path.join(ROOT_DIR, 'public', 'LICENSE'));
      expect(bundled.equals(root)).toBe(true);
    } catch (error) {
      console.log('license parity mismatch');
      throw error;
    }
  });

  it('electron-builder files list ships the root LICENSE', () => {
    try {
      const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8')) as {
        build?: { files?: string[] };
      };
      expect(manifest.build?.files).toContain('LICENSE');
    } catch (error) {
      console.log('files-list mismatch');
      throw error;
    }
  });
});

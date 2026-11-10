// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

interface PermissionsModule {
  isAppOrigin(url: unknown): boolean;
  isMidiAllowed(permission: unknown, url: unknown): boolean;
  isExternalHttpUrl(url: unknown): boolean;
}

const require = createRequire(import.meta.url);
const permissionsPath = require.resolve('../../electron/permissions.cjs');
const bundleIndexUrl = pathToFileURL(
  path.join(path.dirname(permissionsPath), '..', 'dist', 'index.html'),
).href;
const { isAppOrigin, isMidiAllowed, isExternalHttpUrl } =
  require('../../electron/permissions.cjs') as PermissionsModule;

describe('Electron MIDI permission policy', () => {
  it('grants midi for the packaged bundle index', () => {
    expect(isAppOrigin(bundleIndexUrl)).toBe(true);
    expect(isMidiAllowed('midi', bundleIndexUrl)).toBe(true);
  });

  it('grants midi for the development server origin', () => {
    expect(isMidiAllowed('midi', 'http://localhost:8008/')).toBe(true);
    expect(isMidiAllowed('midi', 'http://localhost:8008/index.html')).toBe(true);
  });

  it('denies midi for a foreign file origin', () => {
    const foreignFileUrls = [
      'file:///private/etc/passwd',
      'file:///tmp/foreign.html',
      pathToFileURL(path.join(path.dirname(permissionsPath), '..', 'dist', 'foreign.html')).href,
      'file://remote-host/share/index.html',
    ];
    for (const url of foreignFileUrls) {
      expect(isAppOrigin(url)).toBe(false);
      expect(isMidiAllowed('midi', url)).toBe(false);
    }
  });

  it('denies a file URL that only resembles the bundle path', () => {
    const electronDir = path.dirname(permissionsPath);
    const siblingIndexUrl = pathToFileURL(path.join(electronDir, 'index.html')).href;
    expect(isAppOrigin(siblingIndexUrl)).toBe(false);
  });

  it('denies midi for a foreign origin', () => {
    expect(isMidiAllowed('midi', 'https://example.com/')).toBe(false);
    expect(isMidiAllowed('midi', 'http://localhost:8009/')).toBe(false);
    expect(isMidiAllowed('midi', 'https://localhost:8008.evil.com/')).toBe(false);
    expect(isAppOrigin('http://localhost:8008.evil.com/')).toBe(false);
    expect(isAppOrigin('https://example.com/')).toBe(false);
  });

  it('never grants midiSysex', () => {
    expect(isMidiAllowed('midiSysex', bundleIndexUrl)).toBe(false);
    expect(isMidiAllowed('midiSysex', 'http://localhost:8008/')).toBe(false);
  });

  it('denies malformed and empty URLs', () => {
    expect(isMidiAllowed('midi', '')).toBe(false);
    expect(isMidiAllowed('midi', null)).toBe(false);
    expect(isMidiAllowed('midi', undefined)).toBe(false);
    expect(isMidiAllowed('midi', 'not a url')).toBe(false);
    expect(isAppOrigin(42)).toBe(false);
  });

  it('denies unrelated permissions even on the app origin', () => {
    expect(isMidiAllowed('media', bundleIndexUrl)).toBe(false);
    expect(isMidiAllowed('notifications', 'http://localhost:8008/')).toBe(false);
  });
});

describe('Electron external link policy', () => {
  it('delegates http and https links to the system browser', () => {
    expect(isExternalHttpUrl('https://dosound.alyx.pl')).toBe(true);
    expect(isExternalHttpUrl('http://example.com/page')).toBe(true);
    expect(isExternalHttpUrl('HTTPS://EXAMPLE.COM')).toBe(true);
  });

  it('rejects non-external schemes and non-strings', () => {
    expect(isExternalHttpUrl('file:///app/dist/index.html')).toBe(false);
    expect(isExternalHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isExternalHttpUrl('data:text/html,<b>x</b>')).toBe(false);
    expect(isExternalHttpUrl('')).toBe(false);
    expect(isExternalHttpUrl(null)).toBe(false);
    expect(isExternalHttpUrl(42)).toBe(false);
  });
});

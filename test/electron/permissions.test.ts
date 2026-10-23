import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

interface PermissionsModule {
  isAppOrigin(url: unknown): boolean;
  isMidiAllowed(permission: unknown, url: unknown): boolean;
}

const require = createRequire(import.meta.url);
const { isAppOrigin, isMidiAllowed } =
  require('../../electron/permissions.cjs') as PermissionsModule;

describe('Electron MIDI permission policy', () => {
  it('grants midi for the packaged file origin', () => {
    expect(isMidiAllowed('midi', 'file:///Users/app/dist/index.html')).toBe(true);
  });

  it('grants midi for the development server origin', () => {
    expect(isMidiAllowed('midi', 'http://localhost:8008/')).toBe(true);
    expect(isMidiAllowed('midi', 'http://localhost:8008/index.html')).toBe(true);
  });

  it('denies midi for a foreign origin', () => {
    expect(isMidiAllowed('midi', 'https://example.com/')).toBe(false);
    expect(isMidiAllowed('midi', 'http://localhost:8009/')).toBe(false);
    expect(isMidiAllowed('midi', 'https://localhost:8008.evil.com/')).toBe(false);
  });

  it('never grants midiSysex', () => {
    expect(isMidiAllowed('midiSysex', 'file:///Users/app/dist/index.html')).toBe(false);
    expect(isMidiAllowed('midiSysex', 'http://localhost:8008/')).toBe(false);
  });

  it('denies malformed and empty URLs', () => {
    expect(isMidiAllowed('midi', '')).toBe(false);
    expect(isMidiAllowed('midi', null)).toBe(false);
    expect(isMidiAllowed('midi', undefined)).toBe(false);
    expect(isAppOrigin(42)).toBe(false);
  });

  it('denies unrelated permissions even on the app origin', () => {
    expect(isMidiAllowed('media', 'file:///Users/app/dist/index.html')).toBe(false);
    expect(isMidiAllowed('notifications', 'http://localhost:8008/')).toBe(false);
  });
});

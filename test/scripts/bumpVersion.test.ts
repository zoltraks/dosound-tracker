// @vitest-environment node

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// bump-version.mjs resolves package.json and package-lock.json relative to
// its own directory, so each case copies the script into a scratch fixture
// and runs it as a real subprocess - the same CLI path npm run bump takes.

const scriptSource = path.resolve(__dirname, '../../scripts/bump-version.mjs');

const fixtureDirs: string[] = [];

afterEach(() => {
  while (fixtureDirs.length) {
    fs.rmSync(fixtureDirs.pop()!, { recursive: true, force: true });
  }
});

const makeFixture = (version: unknown) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'bump-version-'));
  fixtureDirs.push(fixture);
  fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
  fs.copyFileSync(scriptSource, path.join(fixture, 'scripts', 'bump-version.mjs'));
  fs.writeFileSync(
    path.join(fixture, 'package.json'),
    JSON.stringify({ name: 'fixture', version }, null, 2) + '\n',
  );
  fs.writeFileSync(
    path.join(fixture, 'package-lock.json'),
    JSON.stringify(
      { name: 'fixture', version, packages: { '': { name: 'fixture', version } } },
      null,
      2,
    ) + '\n',
  );
  return fixture;
};

const runBump = (fixture: string) =>
  spawnSync(process.execPath, [path.join(fixture, 'scripts', 'bump-version.mjs')], {
    encoding: 'utf8',
  });

const readVersions = (fixture: string) => {
  const pkg = JSON.parse(fs.readFileSync(path.join(fixture, 'package.json'), 'utf8')) as {
    version: string;
  };
  const lock = JSON.parse(fs.readFileSync(path.join(fixture, 'package-lock.json'), 'utf8')) as {
    version: string;
    packages: Record<string, { version?: string }>;
  };
  return { pkg: pkg.version, lock: lock.version, lockRoot: lock.packages['']?.version };
};

describe('bump-version script', () => {
  it('increments the patch number and syncs the lockfile', () => {
    const fixture = makeFixture('1.2.3');
    const result = runBump(fixture);
    try {
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Bumped version from 1.2.3 to 1.2.4');
      expect(readVersions(fixture)).toEqual({ pkg: '1.2.4', lock: '1.2.4', lockRoot: '1.2.4' });
    } catch (error) {
      console.log('bump output:', result.stdout, result.stderr);
      throw error;
    }
  });

  it('rolls patch 9 over into the minor number', () => {
    const fixture = makeFixture('1.2.9');
    const result = runBump(fixture);
    try {
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Bumped version from 1.2.9 to 1.3.0');
      expect(readVersions(fixture).pkg).toBe('1.3.0');
    } catch (error) {
      console.log('rollover output:', result.stdout, result.stderr);
      throw error;
    }
  });

  it('rolls minor 9 over into the major number', () => {
    const fixture = makeFixture('1.9.9');
    const result = runBump(fixture);
    try {
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Bumped version from 1.9.9 to 2.0.0');
      expect(readVersions(fixture).pkg).toBe('2.0.0');
    } catch (error) {
      console.log('major rollover output:', result.stdout, result.stderr);
      throw error;
    }
  });

  it('falls back to 0.0.1 when the recorded version is not X.Y.Z', () => {
    const fixture = makeFixture('not-a-version');
    const result = runBump(fixture);
    try {
      expect(result.status).toBe(0);
      const versions = readVersions(fixture);
      expect(versions.pkg).toBe('0.0.1');
      expect(versions.lock).toBe('0.0.1');
      expect(versions.lockRoot).toBe('0.0.1');
    } catch (error) {
      console.log('fallback output:', result.stdout, result.stderr);
      throw error;
    }
  });
});

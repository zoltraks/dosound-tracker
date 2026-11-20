// @vitest-environment node

import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

interface ArtifactBuildContext {
  artifactPaths: string[];
  outDir: string;
  platformToTargets: Map<{ name: string }, unknown>;
}

type AfterAllArtifactBuild = (context: ArtifactBuildContext) => Promise<string[]>;

const require = createRequire(import.meta.url);
const afterAllArtifactBuild =
  require('../../scripts/afterAllArtifactBuild.cjs') as AfterAllArtifactBuild;

const fixtureDirs: string[] = [];

afterEach(() => {
  while (fixtureDirs.length) {
    fs.rmSync(fixtureDirs.pop()!, { recursive: true, force: true });
  }
});

const makeFixture = () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'artifact-build-'));
  fixtureDirs.push(fixture);
  const outDir = path.join(fixture, 'release');
  fs.mkdirSync(outDir, { recursive: true });
  const first = path.join(outDir, 'app-1.0.0-linux-amd64.AppImage');
  const second = path.join(outDir, 'app-1.0.0-linux-amd64.deb');
  fs.writeFileSync(first, 'first-artifact-bytes');
  fs.writeFileSync(second, 'second-artifact-bytes');
  return { fixture, outDir, first, second };
};

const sha256 = (file: string) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

describe('afterAllArtifactBuild checksum writer', () => {
  it('writes a SHA256SUMS file joining platform names and returns it', async () => {
    const { outDir, first, second } = makeFixture();
    const platformToTargets = new Map<{ name: string }, unknown>([
      [{ name: 'linux' }, ['AppImage']],
      [{ name: 'windows' }, ['nsis']],
    ]);
    const result = await afterAllArtifactBuild({
      artifactPaths: [first, second],
      outDir,
      platformToTargets,
    });
    try {
      const checksumPath = path.join(outDir, 'SHA256SUMS-linux-windows.txt');
      expect(result).toEqual([first, second, checksumPath]);
      const expected =
        `${sha256(first)}  ${path.basename(first)}\n` +
        `${sha256(second)}  ${path.basename(second)}\n`;
      expect(fs.readFileSync(checksumPath, 'utf8')).toBe(expected);
    } catch (error) {
      console.log('checksum result:', JSON.stringify(result));
      throw error;
    }
  });

  it('names the checksum file after a single platform without a separator', async () => {
    const { outDir, first } = makeFixture();
    const platformToTargets = new Map<{ name: string }, unknown>([[{ name: 'linux' }, ['deb']]]);
    const result = await afterAllArtifactBuild({
      artifactPaths: [first],
      outDir,
      platformToTargets,
    });
    try {
      const checksumPath = path.join(outDir, 'SHA256SUMS-linux.txt');
      expect(result).toEqual([first, checksumPath]);
      expect(fs.existsSync(checksumPath)).toBe(true);
    } catch (error) {
      console.log('single-platform result:', JSON.stringify(result));
      throw error;
    }
  });
});

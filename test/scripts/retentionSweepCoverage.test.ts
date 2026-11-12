// @vitest-environment node

import { describe, it, expect, afterEach, vi } from 'vitest';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

interface Version {
  major: number;
  minor: number;
  patch: number;
}

interface RetentionSweepModule {
  parseVersion(text: string): Version | null;
  versionToString(version: Version): string;
  compareVersions(a: Version, b: Version): number;
  versionTokenFromName(name: string): Version | null;
  leadingVersionDir(name: string): Version | null;
  dateFromName(name: string): string | null;
  monthFromName(name: string): string | null;
  classifyVersionDir(name: string, boundary: Version): { action: string; reason: string };
  classifyFlatFile(
    name: string,
    boundary: Version,
    familyStart: string,
  ): { action: string; reason: string; boundaryDay?: boolean; needsReview?: boolean };
  contentVersionRefs(text: string, boundary: Version): string[];
  planSweep(input: {
    currentVersion: Version;
    familyStart: string;
    versionedListings: Record<string, string[]>;
    flatListings: Record<string, string[]>;
    readContent: (path: string) => string | null;
    activeDocs: Record<string, string>;
  }): {
    boundary: { version: string; familyStart: string };
    moves: Array<{ from: string; to: string; role: string; kind: string; reason: string }>;
    stays: Array<{ path: string; role: string; reason: string }>;
    provisions: string[];
    collisions: string[];
    gitkeep: Array<{ dir: string; action: string }>;
    linkHits: Array<{ doc: string; match: string; replacement: string }>;
    repointCandidates: Array<{ doc: string; match: string; replacement: string }>;
    boundaryDay: Array<{ file: string; references: string[] }>;
    anomalies: Array<{ path: string; issue: string }>;
  };
}

const require = createRequire(import.meta.url);
const sweep = require('../../scripts/retention-sweep.mjs') as RetentionSweepModule;
const scriptPath = require.resolve('../../scripts/retention-sweep.mjs');
const boundary160: Version = { major: 1, minor: 6, patch: 0 };

const run = (fixture: string, args: string[] = []) =>
  spawnSync(process.execPath, [scriptPath, '--root', fixture, ...args], { encoding: 'utf8' });

const writeFile = (dir: string, relative: string, content: string) => {
  const file = path.join(dir, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

const commitAll = (dir: string, date: string, message: string) => {
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync(
    'git',
    ['-C', dir, '-c', 'user.email=test@test', '-c', 'user.name=test', 'commit', '-m', message],
    {
      env: {
        ...process.env,
        GIT_AUTHOR_DATE: `${date}T12:00:00`,
        GIT_COMMITTER_DATE: `${date}T12:00:00`,
      },
    },
  );
};

const fixtureDirs: string[] = [];

afterEach(() => {
  while (fixtureDirs.length) {
    fs.rmSync(fixtureDirs.pop()!, { recursive: true, force: true });
  }
});

const makeFixture = () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'retention-cov-'));
  fixtureDirs.push(fixture);
  return fixture;
};

const gitInit = (dir: string) => {
  execFileSync('git', ['-C', dir, 'init', '-q']);
};

describe('retention sweep coverage - pure helpers', () => {
  it('classifies the remaining token, date, and ordering paths', () => {
    try {
      expect(sweep.parseVersion('no-version-here')).toBeNull();
      expect(sweep.compareVersions({ major: 1, minor: 5, patch: 9 }, boundary160)).toBeLessThan(0);
      expect(sweep.compareVersions({ major: 1, minor: 6, patch: 1 }, boundary160)).toBeGreaterThan(
        0,
      );
      expect(sweep.versionTokenFromName('window-abc.md')).toBeNull();
      expect(sweep.monthFromName('undated-notes.md')).toBeNull();
      expect(sweep.dateFromName('lessons.md')).toBeNull();
    } catch (error) {
      console.log('pure-helper mismatch');
      throw error;
    }
  });

  it('keeps flat files with current-family tokens and within-family dates', () => {
    try {
      const later = sweep.classifyFlatFile(
        'lessons-2026-11-10-window-1.7.0.md',
        boundary160,
        '2026-11-11',
      );
      expect(later.action).toBe('stay');
      expect(later.reason).toContain('current or later family');
      const within = sweep.classifyFlatFile(
        'lessons-2026-11-12-topic.md',
        boundary160,
        '2026-11-11',
      );
      expect(within.action).toBe('stay');
      expect(within.reason).toContain('within current family');
      const undated = sweep.classifyFlatFile('scratch.md', boundary160, '2026-11-11');
      expect(undated.action).toBe('stay');
      expect(undated.needsReview).toBe(true);
    } catch (error) {
      console.log('flat-stay mismatch');
      throw error;
    }
  });

  it('plans boundary-day keeps, anomalies, and gitkeep removal', () => {
    const boundaryFile = 'docs/lesson/lessons-2026-11-11-boundary.md';
    const contents: Record<string, string> = {
      [boundaryFile]: 'touched 1.5.6 and 1.4.0 during the window',
    };
    const plan = sweep.planSweep({
      currentVersion: boundary160,
      familyStart: '2026-11-11',
      versionedListings: {
        report: ['1.6.0'],
        'report:files': ['.gitkeep'],
        review: ['1.6.0'],
      },
      flatListings: {
        lesson: ['lessons-2026-11-11-boundary.md', 'notes-window-150.md', 'undated-scratch.md'],
      },
      readContent: (file) => contents[file] ?? null,
      activeDocs: { 'docs/GUIDELINES.md': 'no moved path here' },
    });
    try {
      expect(plan.boundaryDay).toEqual([{ file: boundaryFile, references: ['1.4.0', '1.5.6'] }]);
      expect(plan.anomalies).toContainEqual({
        path: 'docs/lesson/notes-window-150.md',
        issue: 'retiring file has no date for the archive group',
      });
      expect(plan.anomalies).toContainEqual({
        path: 'docs/lesson/undated-scratch.md',
        issue: 'flat file without a date',
      });
      expect(plan.gitkeep).toEqual([{ dir: 'docs/report', action: 'remove' }]);
      expect(plan.linkHits).toEqual([]);
      expect(plan.provisions).toEqual([...plan.provisions].sort());
    } catch (error) {
      console.log('plan-edge mismatch', JSON.stringify(plan));
      throw error;
    }
  });

  it('reports repoint candidates only for staying flat files', () => {
    const stayingDir = 'docs/change/1.6.0';
    const stayingFlat = 'docs/lesson/lessons-2026-11-12-kept.md';
    const plan = sweep.planSweep({
      currentVersion: boundary160,
      familyStart: '2026-11-11',
      versionedListings: { change: ['1.4.0', '1.6.0'] },
      flatListings: { lesson: ['lessons-2026-11-12-kept.md'] },
      readContent: (file) =>
        file === stayingFlat ? 'indexed in docs/change/1.4.0' : 'docs/change/1.4.0',
      activeDocs: undefined as unknown as Record<string, string>,
    });
    try {
      expect(plan.stays.map((stay) => stay.path)).toContain(stayingDir);
      expect(plan.repointCandidates).toEqual([
        {
          doc: stayingFlat,
          match: 'docs/change/1.4.0',
          replacement: 'docs/archive/change/1.4.0',
        },
      ]);
    } catch (error) {
      console.log('repoint-filter mismatch', JSON.stringify(plan));
      throw error;
    }
  });

  it('produces an empty plan when nothing moves', () => {
    const plan = sweep.planSweep({
      currentVersion: boundary160,
      familyStart: '2026-11-11',
      versionedListings: {},
      flatListings: {},
      readContent: () => null,
      activeDocs: {},
    });
    try {
      expect(plan.moves).toEqual([]);
      expect(plan.stays).toEqual([]);
      expect(plan.provisions).toEqual([]);
      expect(plan.gitkeep).toEqual([]);
      expect(plan.linkHits).toEqual([]);
      expect(plan.repointCandidates).toEqual([]);
      expect(plan.boundaryDay).toEqual([]);
      expect(plan.anomalies).toEqual([]);
    } catch (error) {
      console.log('empty-plan mismatch');
      throw error;
    }
  });
});

const buildFixture = () => {
  const fixture = makeFixture();
  gitInit(fixture);
  writeFile(fixture, 'package.json', JSON.stringify({ version: '1.5.9' }));
  writeFile(fixture, 'docs/change/1.4.0/rec.md', '# record\n');
  writeFile(fixture, 'docs/plan/1.5.9/p.md', '# plan\n');
  writeFile(fixture, 'docs/report/1.5.9/r.md', '# report\n');
  writeFile(fixture, 'docs/review/.gitkeep', '');
  writeFile(fixture, 'docs/lesson/lessons-2026-11-10-old.md', 'old\n');
  writeFile(fixture, 'docs/lesson/notes-window-150.md', 'compact retiree\n');
  writeFile(fixture, 'docs/decision/2026-11-09-minimatch.md', 'd\n');
  writeFile(fixture, 'docs/GUIDELINES.md', 'see docs/change/1.4.0/rec.md\n');
  writeFile(fixture, 'public/MANUAL.md', '# manual\n');
  writeFile(fixture, 'README.md', '# readme\n');
  commitAll(fixture, '2026-11-10', 'seed');
  writeFile(fixture, 'docs/change/1.6.0/rec.md', '# current\n');
  writeFile(fixture, 'docs/review/1.6.0/r.md', '# review\n');
  writeFile(fixture, 'docs/lesson/lessons-2026-11-11-boundary.md', 'touched 1.5.6\n');
  writeFile(fixture, 'docs/lesson/lessons-2026-11-12-kept.md', 'indexed in docs/change/1.4.0\n');
  writeFile(fixture, 'docs/lesson/undated-scratch.md', 'scratch\n');
  writeFile(fixture, 'docs/decision/2026-11-12-new.md', 'n\n');
  commitAll(fixture, '2026-11-11', 'add 1.6.0 artifacts');
  writeFile(fixture, 'package.json', JSON.stringify({ version: '1.6.0' }));
  commitAll(fixture, '2026-11-12', 'Version 1.6.0 close the window.');
  return fixture;
};

describe('retention sweep coverage - subprocess', () => {
  it('prints the dry-run plan, emits json, then applies with repoints', () => {
    const fixture = buildFixture();

    const dry = run(fixture);
    try {
      expect(dry.status).toBe(0);
      expect(dry.stdout).toContain('Dry-run only');
      expect(dry.stdout).toContain('Family start: 2026-11-11');
      expect(dry.stdout).toContain('docs/change/1.4.0 -> docs/archive/change/1.4.0');
      expect(dry.stdout).toContain('.gitkeep place: docs/plan');
      expect(dry.stdout).toContain('.gitkeep place: docs/report');
      expect(dry.stdout).toContain('.gitkeep remove: docs/review');
      expect(dry.stdout).toContain('Link hit in docs/GUIDELINES.md');
      expect(dry.stdout).toContain('Staying-file reference in');
      expect(dry.stdout).toContain('Boundary-day keep:');
      expect(dry.stdout).toContain('Anomaly: docs/lesson/notes-window-150.md');
      expect(dry.stdout).toContain('Anomaly: docs/lesson/undated-scratch.md');
      expect(dry.stdout).toContain('Provisions:');
    } catch (error) {
      console.log('dry-run output:', dry.stdout, dry.stderr);
      throw error;
    }

    const json = run(fixture, ['--json']);
    try {
      expect(json.status).toBe(0);
      const plan = JSON.parse(json.stdout);
      expect(plan.boundary).toEqual({ version: '1.6.0', familyStart: '2026-11-11' });
      expect(plan.moves.map((move: { to: string }) => move.to)).toContain(
        'docs/archive/lesson/2026-11/lessons-2026-11-10-old.md',
      );
      expect(plan.boundaryDay[0].references).toEqual(['1.5.6']);
      expect(fs.existsSync(path.join(fixture, 'docs/change/1.4.0/rec.md'))).toBe(true);
    } catch (error) {
      console.log('json output:', json.stdout, json.stderr);
      throw error;
    }

    const applied = run(fixture, ['--repoint']);
    try {
      expect(applied.status).toBe(0);
      expect(applied.stdout).toContain('with staying-file repoints');
      expect(fs.existsSync(path.join(fixture, 'docs/archive/change/1.4.0/rec.md'))).toBe(true);
      expect(fs.existsSync(path.join(fixture, 'docs/plan/.gitkeep'))).toBe(true);
      expect(fs.existsSync(path.join(fixture, 'docs/report/.gitkeep'))).toBe(true);
      expect(fs.existsSync(path.join(fixture, 'docs/review/.gitkeep'))).toBe(false);
      expect(
        fs.existsSync(path.join(fixture, 'docs/archive/lesson/2026-11/lessons-2026-11-10-old.md')),
      ).toBe(true);
      const kept = fs.readFileSync(
        path.join(fixture, 'docs/lesson/lessons-2026-11-12-kept.md'),
        'utf8',
      );
      expect(kept).toContain('docs/archive/change/1.4.0');
      const guidelines = fs.readFileSync(path.join(fixture, 'docs/GUIDELINES.md'), 'utf8');
      expect(guidelines).toContain('docs/archive/change/1.4.0');
    } catch (error) {
      console.log('apply output:', applied.stdout, applied.stderr);
      throw error;
    }
  });

  it('aborts the apply when an archive destination already exists', () => {
    const fixture = buildFixture();
    writeFile(fixture, 'docs/archive/change/1.4.0/existing.md', 'occupied\n');
    commitAll(fixture, '2026-11-12', 'pre-existing archive');

    const result = run(fixture, ['--apply']);
    try {
      expect(result.status).toBe(1);
      expect(result.stdout).toContain('COLLISIONS');
      expect(result.stderr).toContain('collisions');
      expect(fs.existsSync(path.join(fixture, 'docs/change/1.4.0/rec.md'))).toBe(true);
    } catch (error) {
      console.log('collision output:', result.stdout, result.stderr);
      throw error;
    }
  });

  it('fails when the root is not a git repository', () => {
    const fixture = makeFixture();
    writeFile(fixture, 'package.json', JSON.stringify({ version: '1.6.0' }));
    writeFile(fixture, 'docs/change/1.4.0/rec.md', '# record\n');

    const result = run(fixture);
    try {
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('retention-sweep: git');
    } catch (error) {
      console.log('no-git output:', result.stdout, result.stderr);
      throw error;
    }
  });

  it('fails when package.json carries no X.Y.Z version', () => {
    const fixture = makeFixture();
    gitInit(fixture);
    writeFile(fixture, 'package.json', JSON.stringify({ version: 'abc' }));
    commitAll(fixture, '2026-11-12', 'seed');

    const result = run(fixture);
    try {
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('not X.Y.Z');
    } catch (error) {
      console.log('bad-version output:', result.stdout, result.stderr);
      throw error;
    }
  });

  it('fails when the family start cannot be resolved', () => {
    const fixture = makeFixture();
    gitInit(fixture);
    writeFile(fixture, 'package.json', JSON.stringify({ version: '1.6.0' }));
    writeFile(fixture, 'docs/change/1.4.0/rec.md', '# record\n');
    commitAll(fixture, '2026-11-12', 'seed only');

    const result = run(fixture);
    try {
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('family start');
    } catch (error) {
      console.log('no-family output:', result.stdout, result.stderr);
      throw error;
    }
  });
});

describe('retention sweep coverage - in-process runs', () => {
  const runInProcess = async (fixture: string, args: string[] = []) => {
    vi.resetModules();
    const originalArgv = process.argv;
    const originalExit = process.exitCode;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.argv = [process.execPath, scriptPath, '--root', fixture, ...args];
    try {
      // The .mjs script carries no type declarations; the vite-module import
      // (not require) is required so v8 coverage instruments the re-run main().
      // @ts-expect-error - no declaration file for the plain ESM script.
      await import('../../scripts/retention-sweep.mjs');
      return {
        exit: process.exitCode ?? 0,
        stdout: logSpy.mock.calls.map((call) => call.join(' ')).join('\n'),
        stderr: errSpy.mock.calls.map((call) => call.join(' ')).join('\n'),
      };
    } finally {
      process.argv = originalArgv;
      process.exitCode = originalExit ?? 0;
      logSpy.mockRestore();
      errSpy.mockRestore();
    }
  };

  it('prints the dry-run plan and the json form in-process', async () => {
    const fixture = buildFixture();

    const dry = await runInProcess(fixture);
    try {
      expect(dry.exit).toBe(0);
      expect(dry.stdout).toContain('Dry-run only');
      expect(dry.stdout).toContain('Family start: 2026-11-11');
      expect(dry.stdout).toContain('.gitkeep remove: docs/review');
      expect(dry.stdout).toContain('Link hit in docs/GUIDELINES.md');
      expect(dry.stdout).toContain('Boundary-day keep:');
      expect(dry.stdout).toContain('Anomaly: docs/lesson/notes-window-150.md');
    } catch (error) {
      console.log('in-process dry output:', dry.stdout, dry.stderr);
      throw error;
    }

    const json = await runInProcess(fixture, ['--json']);
    try {
      expect(json.exit).toBe(0);
      const plan = JSON.parse(json.stdout);
      expect(plan.boundary.familyStart).toBe('2026-11-11');
    } catch (error) {
      console.log('in-process json output:', json.stdout, json.stderr);
      throw error;
    }
  });

  it('applies the plan in-process with and without repoints', async () => {
    const repointed = await runInProcess(buildFixture(), ['--repoint']);
    try {
      expect(repointed.exit).toBe(0);
      expect(repointed.stdout).toContain('with staying-file repoints');
    } catch (error) {
      console.log('repoint output:', repointed.stdout, repointed.stderr);
      throw error;
    }

    const fixture = buildFixture();
    const applied = await runInProcess(fixture, ['--apply']);
    try {
      expect(applied.exit).toBe(0);
      expect(applied.stdout).toContain('without staying-file repoints');
      expect(fs.existsSync(path.join(fixture, 'docs/archive/change/1.4.0/rec.md'))).toBe(true);
      const kept = fs.readFileSync(
        path.join(fixture, 'docs/lesson/lessons-2026-11-12-kept.md'),
        'utf8',
      );
      expect(kept).toContain('indexed in docs/change/1.4.0');
    } catch (error) {
      console.log('apply output:', applied.stdout, applied.stderr);
      throw error;
    }
  });

  it('aborts an in-process apply on archive collisions', async () => {
    const fixture = buildFixture();
    writeFile(fixture, 'docs/archive/change/1.4.0/existing.md', 'occupied\n');
    commitAll(fixture, '2026-11-12', 'pre-existing archive');

    const result = await runInProcess(fixture, ['--apply']);
    try {
      expect(result.exit).toBe(1);
      expect(result.stdout).toContain('COLLISIONS');
      expect(result.stderr).toContain('collisions');
      expect(fs.existsSync(path.join(fixture, 'docs/change/1.4.0/rec.md'))).toBe(true);
    } catch (error) {
      console.log('in-process collision output:', result.stdout, result.stderr);
      throw error;
    }
  });

  it('reports the three gather failures in-process', async () => {
    const noGit = makeFixture();
    writeFile(noGit, 'package.json', JSON.stringify({ version: '1.6.0' }));
    writeFile(noGit, 'docs/change/1.4.0/rec.md', '# record\n');
    const gitless = await runInProcess(noGit);
    try {
      expect(gitless.exit).toBe(1);
      expect(gitless.stderr).toContain('retention-sweep: git');
    } catch (error) {
      console.log('gitless output:', gitless.stdout, gitless.stderr);
      throw error;
    }

    const badVersion = makeFixture();
    gitInit(badVersion);
    writeFile(badVersion, 'package.json', JSON.stringify({ version: 'abc' }));
    commitAll(badVersion, '2026-11-12', 'seed');
    const versioned = await runInProcess(badVersion);
    try {
      expect(versioned.exit).toBe(1);
      expect(versioned.stderr).toContain('not X.Y.Z');
    } catch (error) {
      console.log('version output:', versioned.stdout, versioned.stderr);
      throw error;
    }

    const noFamily = makeFixture();
    gitInit(noFamily);
    writeFile(noFamily, 'package.json', JSON.stringify({ version: '1.6.0' }));
    writeFile(noFamily, 'docs/change/1.4.0/rec.md', '# record\n');
    commitAll(noFamily, '2026-11-12', 'seed only');
    const family = await runInProcess(noFamily);
    try {
      expect(family.exit).toBe(1);
      expect(family.stderr).toContain('family start');
    } catch (error) {
      console.log('family output:', family.stdout, family.stderr);
      throw error;
    }
  });

  it('prints a quiet plan when nothing retires and the bump commit is absent', async () => {
    const fixture = makeFixture();
    gitInit(fixture);
    writeFile(fixture, 'package.json', JSON.stringify({ version: '1.6.0' }));
    writeFile(fixture, 'docs/change/1.6.0/rec.md', '# record\n');
    writeFile(fixture, 'docs/lesson/lessons-2026-11-11-boundary.md', 'no old versions\n');
    commitAll(fixture, '2026-11-11', 'seed current family only');

    const result = await runInProcess(fixture);
    try {
      expect(result.exit).toBe(0);
      expect(result.stdout).toContain('bump n/a');
      expect(result.stdout).toContain('Moves (0)');
      expect(result.stdout).toContain('no completed-family versions');
      expect(result.stdout).not.toContain('Provisions:');
      expect(result.stdout).not.toContain('Anomaly:');
    } catch (error) {
      console.log('quiet output:', result.stdout, result.stderr);
      throw error;
    }
  });
});

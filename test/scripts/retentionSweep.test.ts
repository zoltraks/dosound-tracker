// @vitest-environment node

import { describe, it, expect, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

interface Version {
  major: number;
  minor: number;
  patch: number;
}

interface Verdict {
  action: 'retire' | 'stay';
  reason: string;
  boundaryDay?: boolean;
  needsReview?: boolean;
}

interface SweepPlan {
  boundary: { version: string; familyStart: string };
  moves: Array<{ from: string; to: string; role: string; kind: string; reason: string }>;
  stays: Array<{ path: string; role: string; reason: string }>;
  provisions: string[];
  collisions: string[];
  gitkeep: Array<{ dir: string; action: 'place' | 'remove' }>;
  linkHits: Array<{ doc: string; match: string; replacement: string }>;
  repointCandidates: Array<{ doc: string; match: string; replacement: string }>;
  boundaryDay: Array<{ file: string; references: string[] }>;
  anomalies: Array<{ path: string; issue: string }>;
}

interface RetentionSweepModule {
  parseVersion(text: string): Version | null;
  versionToString(version: Version): string;
  compareVersions(a: Version, b: Version): number;
  versionTokenFromName(name: string): Version | null;
  leadingVersionDir(name: string): Version | null;
  dateFromName(name: string): string | null;
  monthFromName(name: string): string | null;
  classifyVersionDir(name: string, boundary: Version): Verdict;
  classifyFlatFile(name: string, boundary: Version, familyStart: string): Verdict;
  contentVersionRefs(text: string, boundary: Version): string[];
  planSweep(input: {
    currentVersion: Version;
    familyStart: string;
    versionedListings: Record<string, string[]>;
    flatListings: Record<string, string[]>;
    readContent: (path: string) => string | null;
    activeDocs: Record<string, string>;
  }): SweepPlan;
}

const require = createRequire(import.meta.url);
const sweep = require('../../scripts/retention-sweep.mjs') as RetentionSweepModule;
const scriptPath = require.resolve('../../scripts/retention-sweep.mjs');
const repoRoot = path.resolve(__dirname, '../..');
const boundary160: Version = { major: 1, minor: 6, patch: 0 };

describe('retention sweep classification', () => {
  it('parses dotted and compact version tokens from file names', () => {
    try {
      const cases: Array<[string, string | null]> = [
        ['lessons-2026-11-12-window-1.5.9.md', '1.5.9'],
        ['lessons-2026-11-10-window-146-sdlc.md', '1.4.6'],
        ['lessons-2026-11-10-window-150-sdlc.md', '1.5.0'],
        ['lessons-2026-11-10-1.4.5-window.md', '1.4.5'],
        ['2026-11-09-minimatch-advisory-residual.md', null],
        ['lessons-2026-11-11-undo-redo.md', null],
      ];
      for (const [name, expected] of cases) {
        const token = sweep.versionTokenFromName(name);
        expect(token ? sweep.versionToString(token) : null).toBe(expected);
      }
      expect(sweep.versionToString(sweep.leadingVersionDir('1.2.4-configuration')!)).toBe('1.2.4');
      expect(sweep.leadingVersionDir('notes')).toBeNull();
    } catch (error) {
      console.log('token cases failed');
      throw error;
    }
  });

  it('retires versioned directories below the current family', () => {
    expect(sweep.classifyVersionDir('1.5.9', boundary160).action).toBe('retire');
    expect(sweep.classifyVersionDir('1.4.0', boundary160).action).toBe('retire');
    expect(sweep.classifyVersionDir('1.2.4-configuration', boundary160).action).toBe('retire');
  });

  it('keeps the current family and later windows', () => {
    for (const name of ['1.6.0', '1.6.2', '1.7.0', '1.8.0']) {
      expect(sweep.classifyVersionDir(name, boundary160).action).toBe('stay');
    }
    expect(sweep.classifyVersionDir('notes', boundary160).action).toBe('stay');
  });

  it('retires flat files by version token regardless of date', () => {
    const verdict = sweep.classifyFlatFile(
      'lessons-2026-11-13-window-1.5.3.md',
      boundary160,
      '2026-11-11',
    );
    expect(verdict.action).toBe('retire');
    expect(verdict.reason).toContain('1.5.3');
    const compact = sweep.classifyFlatFile(
      'lessons-2026-11-10-window-150-sdlc.md',
      boundary160,
      '2026-11-11',
    );
    expect(compact.action).toBe('retire');
  });

  it('retires flat files dated before the family start', () => {
    const verdict = sweep.classifyFlatFile(
      'lessons-2026-11-10-session-review.md',
      boundary160,
      '2026-11-11',
    );
    expect(verdict.action).toBe('retire');
    expect(verdict.reason).toContain('before family start');
  });

  it('keeps boundary-day files and surfaces their version references', () => {
    const verdict = sweep.classifyFlatFile(
      'lessons-2026-11-11-undo-redo.md',
      boundary160,
      '2026-11-11',
    );
    expect(verdict.action).toBe('stay');
    expect(verdict.boundaryDay).toBe(true);
    const refs = sweep.contentVersionRefs(
      'see docs/plan/1.5.6/ and version 1.6.0 work',
      boundary160,
    );
    expect(refs).toEqual(['1.5.6']);
  });

  it('reconciles .gitkeep markers in both directions', () => {
    const plan = sweep.planSweep({
      currentVersion: { major: 1, minor: 6, patch: 0 },
      familyStart: '2026-11-11',
      versionedListings: {
        change: ['1.4.0', '1.6.0'],
        plan: ['1.5.9'],
        report: ['1.4.5'],
        'report:files': ['.gitkeep'],
      },
      flatListings: {},
      readContent: () => null,
      activeDocs: {},
    });
    const marker = (dir: string) => plan.gitkeep.find((entry) => entry.dir === dir)?.action;
    try {
      expect(marker('docs/plan')).toBe('place');
      expect(marker('docs/report')).toBe('place');
      expect(marker('docs/change')).toBeUndefined();
    } catch (error) {
      console.log('gitkeep plan:', JSON.stringify(plan.gitkeep));
      throw error;
    }
  });

  it('reports link hits and staying-file repoint candidates separately', () => {
    const staying = 'docs/lesson/lessons-2026-11-12-kept.md';
    const plan = sweep.planSweep({
      currentVersion: { major: 1, minor: 6, patch: 0 },
      familyStart: '2026-11-11',
      versionedListings: { change: ['1.4.0'] },
      flatListings: { lesson: ['lessons-2026-11-12-kept.md'] },
      readContent: (file) => (file === staying ? 'indexed in docs/change/1.4.0' : null),
      activeDocs: { 'docs/GUIDELINES.md': 'example path docs/change/1.4.0/x.md' },
    });
    try {
      expect(plan.moves).toEqual([
        expect.objectContaining({ from: 'docs/change/1.4.0', to: 'docs/archive/change/1.4.0' }),
      ]);
      expect(plan.linkHits).toEqual([
        {
          doc: 'docs/GUIDELINES.md',
          match: 'docs/change/1.4.0',
          replacement: 'docs/archive/change/1.4.0',
        },
      ]);
      expect(plan.repointCandidates).toEqual([
        { doc: staying, match: 'docs/change/1.4.0', replacement: 'docs/archive/change/1.4.0' },
      ]);
      expect(plan.provisions).toContain('docs/archive/change');
    } catch (error) {
      console.log('plan:', JSON.stringify(plan));
      throw error;
    }
  });
});

describe('retention sweep apply', () => {
  const fixtureDirs: string[] = [];

  afterEach(() => {
    while (fixtureDirs.length) {
      fs.rmSync(fixtureDirs.pop()!, { recursive: true, force: true });
    }
  });

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

  const writeFile = (dir: string, relative: string, content: string) => {
    const file = path.join(dir, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };

  it('executes the sweep end to end inside a fixture repository', () => {
    fs.mkdirSync(path.join(repoRoot, 'work'), { recursive: true });
    const fixture = fs.mkdtempSync(path.join(repoRoot, 'work', 'retention-'));
    fixtureDirs.push(fixture);
    execFileSync('git', ['-C', fixture, 'init', '-q']);
    writeFile(fixture, 'package.json', JSON.stringify({ version: '1.5.9' }));
    writeFile(fixture, 'docs/change/1.4.0/rec.md', '# record\n');
    writeFile(fixture, 'docs/review/1.5.9/r.md', '# review\n');
    writeFile(fixture, 'docs/lesson/lessons-2026-11-10-old.md', 'old\n');
    writeFile(fixture, 'docs/lesson/lessons-2026-11-12-new.md', 'new\n');
    writeFile(fixture, 'docs/decision/2026-11-09-minimatch.md', 'd\n');
    writeFile(fixture, 'docs/report/.gitkeep', '');
    commitAll(fixture, '2026-11-10', 'seed');
    writeFile(fixture, 'docs/change/1.6.0/rec.md', '# current\n');
    commitAll(fixture, '2026-11-11', 'add 1.6.0 artifact');
    writeFile(fixture, 'package.json', JSON.stringify({ version: '1.6.0' }));
    commitAll(fixture, '2026-11-12', 'Version 1.6.0 close the window.');

    const run = spawnSync(process.execPath, [scriptPath, '--root', fixture, '--apply'], {
      encoding: 'utf8',
    });
    try {
      expect(run.status).toBe(0);
      expect(fs.existsSync(path.join(fixture, 'docs/archive/change/1.4.0/rec.md'))).toBe(true);
      expect(fs.existsSync(path.join(fixture, 'docs/change/1.4.0'))).toBe(false);
      expect(fs.existsSync(path.join(fixture, 'docs/change/1.6.0/rec.md'))).toBe(true);
      expect(fs.existsSync(path.join(fixture, 'docs/archive/review/1.5.9/r.md'))).toBe(true);
      expect(fs.existsSync(path.join(fixture, 'docs/review/.gitkeep'))).toBe(true);
      expect(fs.existsSync(path.join(fixture, 'docs/report/.gitkeep'))).toBe(true);
      expect(
        fs.existsSync(path.join(fixture, 'docs/archive/lesson/2026-11/lessons-2026-11-10-old.md')),
      ).toBe(true);
      expect(fs.existsSync(path.join(fixture, 'docs/lesson/lessons-2026-11-12-new.md'))).toBe(true);
      expect(
        fs.existsSync(path.join(fixture, 'docs/archive/decision/2026-11/2026-11-09-minimatch.md')),
      ).toBe(true);
    } catch (error) {
      console.log('apply output:', run.stdout, run.stderr);
      throw error;
    }
  });
});

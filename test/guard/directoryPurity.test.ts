import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../..');

// Directories-only rule from SPECIFICATION.md "Source Directory Structure":
// a source directory that contains subdirectories does not hold files
// directly. The recorded exemptions live at the two tree roots - the src/
// entry files and the test/ runner setup modules referenced through
// setupFiles in vitest.config.ts.
const ROOT_FILE_EXEMPTIONS: Record<string, string[]> = {
  src: ['main.tsx', 'App.tsx', 'index.css', 'App.css'],
  test: ['setup.ts', 'setup-localstorage.ts'],
};

const collectMixedDirectories = (rootName: string): string[] => {
  const root = path.join(ROOT_DIR, rootName);
  const exemptions = new Set(ROOT_FILE_EXEMPTIONS[rootName]);
  const violations: string[] = [];

  const walk = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const subdirs = entries.filter((entry) => entry.isDirectory());
    if (subdirs.length === 0) {
      return;
    }
    const files = entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
      .map((entry) => entry.name)
      .filter((name) => dir !== root || !exemptions.has(name));
    if (files.length > 0) {
      violations.push(
        `${path.relative(ROOT_DIR, dir)} holds files beside subdirectories: ${files.join(', ')}`,
      );
    }
    for (const subdir of subdirs) {
      walk(path.join(dir, subdir.name));
    }
  };

  walk(root);
  return violations;
};

describe('directory purity guard', () => {
  it('keeps branch directories free of files outside the recorded exemptions', () => {
    const violations = Object.keys(ROOT_FILE_EXEMPTIONS).flatMap(collectMixedDirectories);

    expect(violations).toEqual([]);
  });
});

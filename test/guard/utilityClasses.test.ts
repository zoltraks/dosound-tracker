import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '../../src');

// Utility-framework class tokens (Tailwind-style) match no rule in this
// project's stylesheets - they silently no-op. A dead `h-3 w-3` left lucide
// icons at their 24px default inside 16px controls, overflowing the row and
// inflating the instrument list's scrollable area. Size icon components via
// their own API (`size` prop) instead.
//
// The matcher flags dashed tokens ending in a number, fraction, or `px`
// (`h-3`, `w-3`, `rotate-90`, `p-4`, `mt-2`, `gap-0`, `z-10`, `space-x-2`)
// and the bare layout words - this project's class names are semantic and
// never end in a digit, so the numeric suffix cannot false-positive.
const UTILITY_TOKEN = /^[a-zA-Z]+(?:-[a-zA-Z]+)*-(?:\d+(?:\.\d+)?|\d+\/\d+|px)$/;

const BARE_UTILITY_TOKEN =
  /^(?:flex|inline-flex|grid|inline-grid|hidden|block|inline|inline-block|absolute|relative|fixed|sticky|static|visible|invisible|truncate|sr-only|not-sr-only|grow|shrink)$/;

const CLASSNAME_ATTR = /className=\{?\s*(?:"([^"]*)"|'([^']*)'|`([^`]*)`)\s*\}?/g;

const collectSourceFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
};

const lineNumberAt = (source: string, index: number): number =>
  source.slice(0, index).split('\n').length;

describe('utility class guard', () => {
  it('finds no utility-framework tokens in className attributes', () => {
    const violations: string[] = [];

    for (const file of collectSourceFiles(SRC_DIR)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(CLASSNAME_ATTR)) {
        const literal = match[1] ?? match[2] ?? match[3] ?? '';
        // Strip ${...} interpolations from template literals before
        // tokenising - only the literal words can carry dead classes.
        const text = literal.replace(/\$\{[^}]*\}/g, ' ');
        for (const token of text.split(/\s+/)) {
          if (token && (UTILITY_TOKEN.test(token) || BARE_UTILITY_TOKEN.test(token))) {
            const rel = path.relative(SRC_DIR, file);
            violations.push(`${rel}:${lineNumberAt(source, match.index ?? 0)} ${token}`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

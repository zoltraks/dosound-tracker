// @vitest-environment node

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../..');

type LicenseVerdict = 'allowlist' | 'dev-exception' | 'violation';

interface LockPackage {
  license?: string;
  dev?: boolean;
  devOptional?: boolean;
  optional?: boolean;
}

// The allowlist lives in COPYRIGHTS.md "Dependency Licensing" - the guard
// reads the document so a license the prose does not name is a violation
// even when this file would otherwise accept it. Prose names like
// "Apache 2.0" or "Boost" normalize onto SPDX identifiers, and "Boost"
// carries the SPDX alias BSL-1.0.
const SPDX_ALIASES: Record<string, string[]> = {
  boost: ['bsl10'],
};

const normalize = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const readAllowlist = (): Set<string> => {
  const copyrights = fs.readFileSync(path.join(ROOT_DIR, 'docs', 'COPYRIGHTS.md'), 'utf8');
  const match = copyrights.match(/Permitted open-source licenses:\s*([^\n]+)/);
  if (!match) {
    throw new Error('Permitted open-source licenses line not found in docs/COPYRIGHTS.md');
  }
  const allowlist = new Set(
    match[1]
      .replace(/\.\s*$/, '')
      .split(',')
      .map((entry) => normalize(entry)),
  );
  for (const [name, aliases] of Object.entries(SPDX_ALIASES)) {
    if (allowlist.has(name)) {
      for (const alias of aliases) {
        allowlist.add(alias);
      }
    }
  }
  return allowlist;
};

// MPL-2.0 is permitted for dev-only build tooling that never ships inside
// the application bundle - the documented exception in COPYRIGHTS.md.
const MPL_DEV_ONLY = 'MPL-2.0';

const classifyLicense = (
  expression: string | undefined,
  dev: boolean,
  allowlist: Set<string>,
): LicenseVerdict => {
  const licenses = (expression ?? '')
    .match(/[A-Za-z0-9][A-Za-z0-9.+-]*/g)
    ?.filter((token) => !/^(OR|AND|WITH)$/i.test(token));
  if (!licenses || licenses.length === 0) {
    return 'violation';
  }
  const covers = (spdx: string): boolean => {
    if (spdx === MPL_DEV_ONLY) {
      return dev;
    }
    return allowlist.has(normalize(spdx));
  };
  const allowed = /\bOR\b/i.test(expression ?? '') ? licenses.some(covers) : licenses.every(covers);
  if (!allowed) {
    return 'violation';
  }
  return licenses.length === 1 && licenses[0] === MPL_DEV_ONLY ? 'dev-exception' : 'allowlist';
};

const census = (): { violations: string[]; histogram: Record<LicenseVerdict, number> } => {
  const allowlist = readAllowlist();
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package-lock.json'), 'utf8')) as {
    packages: Record<string, LockPackage>;
  };
  const violations: string[] = [];
  const histogram: Record<LicenseVerdict, number> = {
    allowlist: 0,
    'dev-exception': 0,
    violation: 0,
  };
  for (const [packagePath, pkg] of Object.entries(lock.packages)) {
    if (!packagePath.startsWith('node_modules')) {
      continue;
    }
    const dev = Boolean(pkg.dev || pkg.devOptional);
    const verdict = classifyLicense(pkg.license, dev, allowlist);
    histogram[verdict] += 1;
    if (verdict === 'violation') {
      violations.push(
        `${packagePath}: ${pkg.license ?? '<undeclared>'} (${dev ? 'dev' : 'production'})`,
      );
    }
  }
  return { violations, histogram };
};

describe('license allowlist census', () => {
  it('resolves every installed package to the allowlist or a documented exception', () => {
    const { violations } = census();
    try {
      expect(violations).toEqual([]);
    } catch (error) {
      console.log('license violations:', violations);
      throw error;
    }
  });

  it('keeps the MPL dev-only tooling exception green', () => {
    const lock = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package-lock.json'), 'utf8')) as {
      packages: Record<string, LockPackage>;
    };
    const mplEntries = Object.entries(lock.packages).filter(
      ([packagePath, pkg]) =>
        packagePath.startsWith('node_modules') && pkg.license === MPL_DEV_ONLY,
    );
    try {
      expect(mplEntries.length).toBeGreaterThan(0);
      for (const [, pkg] of mplEntries) {
        expect(Boolean(pkg.dev || pkg.devOptional)).toBe(true);
      }
    } catch (error) {
      console.log(
        'MPL-2.0 outside the dev tooling exception:',
        mplEntries.filter(([, pkg]) => !pkg.dev && !pkg.devOptional).map(([p]) => p),
      );
      throw error;
    }
  });
});

describe('license classification', () => {
  const allowlist = readAllowlist();

  it('parses the allowlist from COPYRIGHTS.md', () => {
    expect(allowlist.size).toBeGreaterThan(0);
    expect(allowlist.has(normalize('MIT'))).toBe(true);
  });

  it('passes an SPDX OR expression when any alternative is allowed', () => {
    expect(classifyLicense('(MIT OR CC0-1.0)', false, allowlist)).toBe('allowlist');
    expect(classifyLicense('WTFPL OR ISC', false, allowlist)).toBe('allowlist');
    expect(classifyLicense('GPL-3.0-only OR MIT', false, allowlist)).toBe('allowlist');
  });

  it('fails a license the allowlist does not name', () => {
    expect(classifyLicense('GPL-3.0-only', false, allowlist)).toBe('violation');
    expect(classifyLicense('LGPL-3.0-only OR GPL-3.0-only', false, allowlist)).toBe('violation');
  });

  it('keeps MPL-2.0 behind the dev-only boundary', () => {
    expect(classifyLicense(MPL_DEV_ONLY, true, allowlist)).toBe('dev-exception');
    expect(classifyLicense(MPL_DEV_ONLY, false, allowlist)).toBe('violation');
  });

  it('flags a package with no declared license', () => {
    expect(classifyLicense(undefined, true, allowlist)).toBe('violation');
    expect(classifyLicense('', false, allowlist)).toBe('violation');
  });

  it('maps the documented Boost name onto SPDX BSL-1.0', () => {
    expect(classifyLicense('BSL-1.0', false, allowlist)).toBe('allowlist');
  });
});

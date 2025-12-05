import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = resolve(__dirname, '..', 'package.json');

try {
  const raw = readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(raw);

  const current = typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  const parts = current.split('.').map((part) => parseInt(part, 10));

  let major = Number.isFinite(parts[0]) ? parts[0] : 0;
  let minor = Number.isFinite(parts[1]) ? parts[1] : 0;
  let patch = Number.isFinite(parts[2]) ? parts[2] : 0;

  patch += 1;

  if (patch > 9) {
    patch = 0;
    minor += 1;
  }

  if (minor > 9) {
    minor = 0;
    major += 1;
  }

  const nextVersion = `${major}.${minor}.${patch}`;

  pkg.version = nextVersion;

  writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

  console.log(`Bumped version from ${current} to ${nextVersion}`);
} catch (error) {
  console.error('Failed to bump version:', error);
  // Do not fail the build if version bump fails
}

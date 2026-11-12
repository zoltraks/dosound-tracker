#!/usr/bin/env node
// Document Retention sweep for dosound-tracker - encodes the procedure recorded
// in docs/WORKFLOW.md under "Document Retention". Dry-run by default; --apply
// executes the plan, --repoint rewrites staying-file references to moved paths,
// and --json emits the machine-readable plan. The script never commits.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootFlagIndex = process.argv.indexOf('--root');
const ROOT = resolve(rootFlagIndex >= 0 ? process.argv[rootFlagIndex + 1] : join(__dirname, '..'));
const DOCS_DIR = join(ROOT, 'docs');

const VERSIONED_ROLES = ['change', 'plan', 'refactoring', 'discard', 'report', 'review'];
const FLAT_ROLES = ['decision', 'lesson'];
const ACTIVE_DOC_GLOBS = ['docs/*.md', 'public/*.md', 'README.md'];

const parseVersion = (text) => {
  const match = String(text).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
};

const versionToString = (version) => `${version.major}.${version.minor}.${version.patch}`;

const compareVersions = (a, b) => a.major - b.major || a.minor - b.minor || a.patch - b.patch;

const versionTokenFromName = (name) => {
  const dotted = parseVersion(name);
  if (dotted) return dotted;
  const compact = name.match(/window-(\d)(\d)(\d)/);
  if (compact) {
    return { major: Number(compact[1]), minor: Number(compact[2]), patch: Number(compact[3]) };
  }
  return null;
};

const leadingVersionDir = (name) => {
  const match = name.match(/^(\d+\.\d+\.\d+)/);
  return match ? parseVersion(match[1]) : null;
};

const dateFromName = (name) => {
  const match = name.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

const monthFromName = (name) => {
  const date = dateFromName(name);
  return date ? date.slice(0, 7) : null;
};

// A versioned directory retires when its leading version token sits below the
// current family boundary X.Y.0. Directories without a leading token stay and
// are surfaced as unversioned.
const classifyVersionDir = (name, boundaryVersion) => {
  const version = leadingVersionDir(name);
  if (!version) return { action: 'stay', reason: 'unversioned directory name' };
  if (compareVersions(version, boundaryVersion) < 0) {
    return {
      action: 'retire',
      reason: `family ${versionToString(version)} below boundary`,
      version,
    };
  }
  return {
    action: 'stay',
    reason: `family ${versionToString(version)} at or above boundary`,
    version,
  };
};

// Flat files retire by embedded version token first, then by date before the
// family start. A file dated exactly on the family start stays and is flagged
// as a boundary-day keep for review.
const classifyFlatFile = (name, boundaryVersion, familyStart) => {
  const token = versionTokenFromName(name);
  if (token && compareVersions(token, boundaryVersion) < 0) {
    return { action: 'retire', reason: `version token ${versionToString(token)}` };
  }
  const date = dateFromName(name);
  if (token) {
    return {
      action: 'stay',
      reason: `version token ${versionToString(token)} in current or later family`,
    };
  }
  if (!date) return { action: 'stay', reason: 'no date in name', needsReview: true };
  if (date < familyStart) return { action: 'retire', reason: `date ${date} before family start` };
  if (date === familyStart) {
    return { action: 'stay', reason: `boundary-day file dated ${date}`, boundaryDay: true };
  }
  return { action: 'stay', reason: `date ${date} within current family` };
};

const contentVersionRefs = (text, boundaryVersion) => {
  const refs = new Set();
  for (const match of text.matchAll(/\d+\.\d+\.\d+/g)) {
    const version = parseVersion(match[0]);
    if (version && compareVersions(version, boundaryVersion) < 0) {
      refs.add(versionToString(version));
    }
  }
  return [...refs].sort();
};

// Build the full sweep plan from gathered inputs. readContent(path) returns a
// file's text for staying files and is injected so the function stays pure.
const planSweep = ({
  currentVersion,
  familyStart,
  versionedListings,
  flatListings,
  readContent,
  activeDocs,
}) => {
  const boundaryVersion = { major: currentVersion.major, minor: currentVersion.minor, patch: 0 };
  const plan = {
    boundary: { version: versionToString(currentVersion), familyStart },
    moves: [],
    stays: [],
    provisions: new Set(),
    collisions: [],
    gitkeep: [],
    linkHits: [],
    repointCandidates: [],
    boundaryDay: [],
    anomalies: [],
  };

  for (const role of VERSIONED_ROLES) {
    const dirs = versionedListings[role] || [];
    const retiring = [];
    for (const name of dirs) {
      const verdict = classifyVersionDir(name, boundaryVersion);
      if (verdict.action === 'retire') {
        const from = `docs/${role}/${name}`;
        const to = `docs/archive/${role}/${name}`;
        plan.moves.push({ from, to, role, kind: 'dir', reason: verdict.reason });
        retiring.push(name);
        plan.provisions.add(`docs/archive/${role}`);
      } else {
        plan.stays.push({ path: `docs/${role}/${name}`, role, reason: verdict.reason });
      }
    }
    // .gitkeep reconciliation for the swept role directory itself.
    const remaining = dirs.filter((name) => !retiring.includes(name));
    const marker = (versionedListings[`${role}:files`] || []).includes('.gitkeep');
    if (remaining.length === 0 && dirs.length > 0) {
      plan.gitkeep.push({ dir: `docs/${role}`, action: 'place' });
    } else if (remaining.length > 0 && marker) {
      plan.gitkeep.push({ dir: `docs/${role}`, action: 'remove' });
    }
  }

  for (const role of FLAT_ROLES) {
    const files = flatListings[role] || [];
    for (const name of files) {
      const verdict = classifyFlatFile(name, boundaryVersion, familyStart);
      if (verdict.action === 'retire') {
        const month = monthFromName(name);
        if (!month) {
          plan.anomalies.push({
            path: `docs/${role}/${name}`,
            issue: 'retiring file has no date for the archive group',
          });
          continue;
        }
        const from = `docs/${role}/${name}`;
        const to = `docs/archive/${role}/${month}/${name}`;
        plan.moves.push({ from, to, role, kind: 'file', reason: verdict.reason });
        plan.provisions.add(`docs/archive/${role}/${month}`);
      } else {
        const stay = { path: `docs/${role}/${name}`, role, reason: verdict.reason };
        plan.stays.push(stay);
        if (verdict.boundaryDay) {
          const content = readContent(stay.path) || '';
          plan.boundaryDay.push({
            file: stay.path,
            references: contentVersionRefs(content, boundaryVersion),
          });
        }
        if (verdict.needsReview)
          plan.anomalies.push({ path: stay.path, issue: 'flat file without a date' });
      }
    }
  }

  // Link check over the active document set for references to moved paths.
  const movedPaths = plan.moves.map((move) => ({ from: move.from, to: move.to }));
  for (const [doc, text] of Object.entries(activeDocs || {})) {
    for (const { from, to } of movedPaths) {
      if (text.includes(from)) {
        plan.linkHits.push({ doc, match: from, replacement: to });
      }
    }
  }
  // Staying-file references are reported separately - rewriting them needs
  // --repoint because narrative mentions describe where a file lived at the time.
  for (const stay of plan.stays.filter((item) => FLAT_ROLES.includes(item.role))) {
    const text = readContent(stay.path) || '';
    for (const { from, to } of movedPaths) {
      if (text.includes(from)) {
        plan.repointCandidates.push({ doc: stay.path, match: from, replacement: to });
      }
    }
  }

  // Archive collisions abort - never clobber an existing destination.
  for (const move of plan.moves) {
    if (existsSync(join(ROOT, move.to))) plan.collisions.push(move.to);
  }

  plan.provisions = [...plan.provisions].sort();
  return plan;
};

const git = (args) => {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
};

const listDirNames = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

const listFileNames = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
    : [];

const resolveFamilyStart = (currentVersion) => {
  const { major, minor } = currentVersion;
  const bumpPattern = `^Version ${major}\\.${minor}\\.0`;
  const bumpDate = git(['log', '--format=%cs', `--grep=${bumpPattern}`, '-1']) || null;
  const artifactDates = git([
    'log',
    '--diff-filter=A',
    '--format=%cs',
    '--',
    `docs/*/${major}.${minor}.*`,
  ])
    .split('\n')
    .filter(Boolean);
  const earliestArtifact = artifactDates.length ? artifactDates.sort()[0] : null;
  const dates = [bumpDate, earliestArtifact].filter(Boolean).sort();
  if (!dates.length) return { familyStart: null, bumpDate, earliestArtifact };
  return { familyStart: dates[0], bumpDate, earliestArtifact };
};

const gatherInputs = () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const currentVersion = parseVersion(pkg.version);
  if (!currentVersion) throw new Error(`package.json version is not X.Y.Z: ${pkg.version}`);

  const { familyStart, bumpDate, earliestArtifact } = resolveFamilyStart(currentVersion);
  if (!familyStart) {
    throw new Error(
      `could not resolve the ${versionToString(currentVersion)} family start - no bump commit and no committed artifacts found`,
    );
  }

  const versionedListings = {};
  for (const role of VERSIONED_ROLES) {
    const dir = join(DOCS_DIR, role);
    versionedListings[role] = listDirNames(dir);
    versionedListings[`${role}:files`] = listFileNames(dir);
  }
  const flatListings = {};
  for (const role of FLAT_ROLES) flatListings[role] = listFileNames(join(DOCS_DIR, role));

  const activeDocs = {};
  for (const glob of ACTIVE_DOC_GLOBS) {
    const dir = dirname(join(ROOT, glob));
    const pattern = new RegExp(
      '^' + glob.split('/').pop().replace('.', '\\.').replace('*', '.*') + '$',
    );
    for (const name of listFileNames(dir).filter((name) => pattern.test(name))) {
      activeDocs[relative(ROOT, join(dir, name))] = readFileSync(join(dir, name), 'utf8');
    }
  }

  return {
    currentVersion,
    familyStart,
    bumpDate,
    earliestArtifact,
    versionedListings,
    flatListings,
    activeDocs,
  };
};

const readRepoFile = (path) => readFileSync(join(ROOT, path), 'utf8');

const applyPlan = (plan, { repoint }) => {
  for (const dir of plan.provisions) mkdirSync(join(ROOT, dir), { recursive: true });
  for (const move of plan.moves) git(['mv', move.from, move.to]);
  for (const marker of plan.gitkeep) {
    const markerPath = join(ROOT, marker.dir, '.gitkeep');
    if (marker.action === 'place' && !existsSync(markerPath)) writeFileSync(markerPath, '');
    if (marker.action === 'remove' && existsSync(markerPath)) rmSync(markerPath);
  }
  const repointTargets = [...plan.linkHits];
  if (repoint) repointTargets.push(...plan.repointCandidates);
  const byDoc = new Map();
  for (const hit of repointTargets) {
    if (!byDoc.has(hit.doc)) byDoc.set(hit.doc, []);
    byDoc.get(hit.doc).push(hit);
  }
  for (const [doc, hits] of byDoc) {
    const filePath = join(ROOT, doc);
    let text = readFileSync(filePath, 'utf8');
    for (const hit of hits) text = text.split(hit.match).join(hit.replacement);
    writeFileSync(filePath, text, 'utf8');
  }
};

const printPlan = (plan, meta) => {
  console.log(
    `Boundary: version ${plan.boundary.version}, family ${plan.boundary.version.split('.').slice(0, 2).join('.')}.*`,
  );
  console.log(
    `Family start: ${plan.boundary.familyStart} (bump ${meta.bumpDate || 'n/a'}, earliest artifact ${meta.earliestArtifact || 'n/a'})`,
  );
  const byRole = (list) =>
    VERSIONED_ROLES.concat(FLAT_ROLES)
      .map((role) => `${role}: ${list.filter((item) => item.role === role).length}`)
      .join(', ');
  console.log(`Moves (${plan.moves.length}): ${byRole(plan.moves)}`);
  for (const move of plan.moves) console.log(`  ${move.from} -> ${move.to}  [${move.reason}]`);
  console.log(`Stays (${plan.stays.length}): ${byRole(plan.stays)}`);
  for (const stay of plan.stays) console.log(`  ${stay.path}  [${stay.reason}]`);
  if (plan.provisions.length) console.log(`Provisions: ${plan.provisions.join(', ')}`);
  if (plan.gitkeep.length) {
    for (const marker of plan.gitkeep) console.log(`.gitkeep ${marker.action}: ${marker.dir}`);
  }
  if (plan.collisions.length) {
    console.log(`COLLISIONS - destinations already exist: ${plan.collisions.join(', ')}`);
  }
  for (const hit of plan.linkHits)
    console.log(`Link hit in ${hit.doc}: ${hit.match} -> ${hit.replacement}`);
  for (const hit of plan.repointCandidates)
    console.log(
      `Staying-file reference in ${hit.doc}: ${hit.match} -> ${hit.replacement} (needs --repoint)`,
    );
  for (const item of plan.boundaryDay) {
    console.log(
      `Boundary-day keep: ${item.file} references ${item.references.join(', ') || 'no completed-family versions'}`,
    );
  }
  for (const anomaly of plan.anomalies) console.log(`Anomaly: ${anomaly.path} - ${anomaly.issue}`);
};

const main = () => {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply') || args.includes('--repoint');
  const repoint = args.includes('--repoint');
  const json = args.includes('--json');

  const inputs = gatherInputs();
  const plan = planSweep({ ...inputs, readContent: readRepoFile });

  if (json) {
    console.log(
      JSON.stringify(
        { meta: { bumpDate: inputs.bumpDate, earliestArtifact: inputs.earliestArtifact }, ...plan },
        null,
        2,
      ),
    );
    return;
  }
  printPlan(plan, inputs);

  if (!apply) {
    console.log('\nDry-run only - pass --apply to execute the moves.');
    return;
  }
  if (plan.collisions.length) {
    console.error('Aborting: archive collisions must be resolved first.');
    process.exitCode = 1;
    return;
  }
  applyPlan(plan, { repoint });
  console.log(
    `\nApplied: ${plan.moves.length} moves, ${plan.gitkeep.length} .gitkeep actions, ${repoint ? 'with' : 'without'} staying-file repoints. Left uncommitted for review.`,
  );
};

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(`retention-sweep: ${error.message}`);
    process.exitCode = 1;
  }
}

export {
  parseVersion,
  versionToString,
  compareVersions,
  versionTokenFromName,
  leadingVersionDir,
  dateFromName,
  monthFromName,
  classifyVersionDir,
  classifyFlatFile,
  contentVersionRefs,
  planSweep,
};

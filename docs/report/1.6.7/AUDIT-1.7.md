# DOSOUND Tracker Audit Report

## Document information

|  |  |
| --- | --- |
| Report revision | 1.7 (fresh audit; supersedes AUDIT-1.6) |
| Report date | 2026-11-19 |
| Report style | audit |
| Detail level | Detailed |
| Scoring scale | 1-10 |
| Audit purpose | Engineering improvement and release-readiness assessment |
| Target environment | Browser application plus Electron desktop package |
| Verification scope | Static repository analysis plus commissioned non-mutating commands in an isolation copy |
| Evidence mode | executed-commands |
| Source version | 263cb007f6e2a93a9e58ff230a5fd6fb3bc623ca (branch main) plus working tree |
| Skill version | 2.9.4 |
| Execution time | ~3 h |

## Audit scope

| Report type | Status | Justification |
| --- | --- | --- |
| Software architecture review | Covered | architecture evaluation, structure review, solution comparison |
| Code quality audit | Covered | code quality and code style pillar findings, defect register |
| Security vulnerability assessment | Covered | security pillar findings, threat model |
| Open source license compliance | Covered | manifest license inventory, allowlist guard tests, executed npm audit |
| Penetration test | Not performed | separate engagement type |
| Performance audit | Partial | bundle and budget evidence inspected; no load or latency measurement |
| Cloud infrastructure audit | Not applicable | no IaC or cloud environment; static web hosting plus desktop packaging |
| AI management audit | Not applicable | no AI system inside the subject |
| Technical due diligence | Partial | engineering dimensions covered; no business or commercial artifacts |
| SBOM / software composition analysis | Covered | component inventory derived from manifest plus executed npm audit |
| Requirements conformance review | Covered | F, N, C, QT series from docs/PROJECT.md graded |
| ISO/IEC 27001 certification | Not performed | standard used only as rubric |
| SOC 2 attestation | Not performed | framework used only as checklist |

## Glossary

| Term | Definition |
| --- | --- |
| CSP | Content Security Policy - the build-time header set injected by the Vite plugin |
| CRLF | Carriage-return line-feed - Windows line endings behind the recorded churn |
| CWE | Common Weakness Enumeration - weakness taxonomy referenced by findings |
| DORA | DevOps Research and Assessment - delivery metrics proxies |
| e2e | End-to-end - the Playwright smoke suite |
| EVD | Evidence record - prefix for audit evidence ledger entries |
| FND | Finding record - prefix for technical finding identifiers |
| IaC | Infrastructure as code - declarative deployment configuration (absent) |
| NFR | Non-functional requirement - system quality attributes |
| NSIS | Nullsoft Scriptable Install System - the Windows installer target |
| REC | Recommendation record - prefix for remediation action identifiers |
| RSK | Risk record - prefix for the unified risk register |
| SBOM | Software bill of materials - component inventory from the manifest |
| SDLC | Software development life cycle - the project window process |
| STRIDE | Spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege |
| SW | Service worker - the offline caching script public/worker.js |
| TDR | Technical debt record - prefix for the debt register |
| V8 | The coverage provider used by Vitest |

**Three-letter identifier prefixes**

| Prefix | Scope | Description |
| --- | --- | --- |
| FND | Findings | identifier prefix in Technical findings (`FND-SEC-001`) |
| EVD | Evidence | identifier prefix in the Evidence list (`EVD-001`) |
| TDR | Debt | identifier prefix in the Technical debt register (`TDR-001`) |
| RSK | Risks | identifier prefix in the Unified risk register (`RSK-001`) |
| REC | Remediation | identifier prefix in Remediation actions (`REC-001`) |
| FNC | Criteria | functional suitability criteria |
| TST | Criteria | testability criteria and `FND-TST-NNN` findings |
| ARC | Criteria | architecture and design criteria and `FND-ARC-NNN` findings |
| CQY | Criteria | code quality criteria |
| STY | Criteria | code style criteria |
| STK | Criteria | stack alignment criteria |
| DEP | Criteria | dependency and deployability criteria |
| MNT | Criteria | maintainability criteria |
| STR | Criteria | structure criteria |
| SCA | Criteria | scalability criteria |
| PRF | Criteria | performance criteria and `FND-PRF-NNN` findings |
| SEC | Criteria | security criteria and `FND-SEC-NNN` findings |
| COM | Criteria | compliance, retention and audit criteria |
| OBS | Criteria | observability criteria |
| OPS | Criteria | operational safety criteria |
| REL | Criteria | reliability and recovery criteria |
| DOC | Criteria | documentation criteria and `FND-DOC-NNN` findings |
| CMP | Criteria | API compatibility criteria |
| DLY | Criteria | delivery and continuity criteria and `FND-DLV-NNN` findings |
| CPR | Criteria | copyright, originality and licensing criteria |
| SKL | Criteria | agent-skill definition criteria |
| REQ | Criteria | requirement conformance entries |
| CNF | Criteria | standards conformance entries |
| STD | Findings | standards/style finding pillar |
| DLV | Findings | delivery finding pillar |

## Executive summary

| Field | Value |
| --- | --- |
| System type | React 19 / TypeScript / Vite browser application plus Electron 45 desktop package |
| Scope | Full repository audit, single project |
| Data source | Inspected source plus commissioned commands executed in an isolation copy |
| Maturity level | Mature maintenance phase (1.6.7, twelve months of history) |
| **Overall score** | **8.6/10** (Excellent) |


| Score | Value | Basis |
| --- | --- | --- |
| Product quality | 9.1/10 (Excellent) | weighted mean across product dimensions; lowest Observability 6/10 |
| Engineering process | 7.5/10 (Good) | mean across process dimensions; lowest Delivery & continuity 5/10 |


The overall score blends product quality (0.7) and engineering process (0.3).
No readiness ceiling applies: the state is READY and no critical or high finding is open.
Score confidence: `HIGH` across product dimensions, `MEDIUM` across process dimensions.

Readiness is READY with recorded conditions: the coverage gate must return to green ([FND-TST-001](#fnd-tst-001-coverage-gate-currently-red)), the instrument import must check size before parse ([FND-SEC-001](#fnd-sec-001-instrument-import-parses-yaml-before-size-gate)), and the two WebKit playback failures need a root cause ([FND-TST-002](#fnd-tst-002-reproducible-webkit-e2e-playback-failures)).
Every control the 1.6.x era promises verifies in source or in the executed run: typecheck, lint, build, 1,809 tests, zero advisories, release gate, packaging.
Remediation cost is estimable at the action level: two medium items dominate, the rest are bounded low-effort fixes.

## System context

`dosound-tracker` is a three-track (one- or two-chip, channels A-F) YM2149/AY chiptune tracker targeting Atari ST DOSOUND assembly export. The audited snapshot is `263cb00` on `main` at version 1.6.7 plus the working tree - 1,259 dirty entries of which 8 files carry real content changes (an in-flight App.tsx decomposition) and the remainder is line-ending noise since resolved.

### Technology stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript ~5.9.3, strict mode, zero `any` enforced |
| UI | React 19.3.1, hook-level domain state plus a 3-member Zustand store |
| Build | Vite 8.3.7 - build-time CSP injection, lazy modal/export chunks, SW versioning |
| Audio | Web Audio API plus AudioWorklet sample-counted sequencer clock |
| Engines | internal YM2149 Web-Audio engine and Ayumi worklet engine behind one `SoundEngine` contract |
| Desktop | Electron 45 - contextIsolation, nodeIntegration off, permission-scoped |
| Tests | Vitest 5.1.0 (1,809 tests) plus Playwright 1.64 (30 specs x 2 projects) |
| Packaging | electron-builder: NSIS installer + zip + SHA256SUMS, unsigned |

## Software bill of materials

The component inventory derives from `package.json` and `package-lock.json` read as text: a pinned dependency set with `overrides` and two disabled install scripts. `npm audit` executed on the manifest reports zero vulnerabilities.

| Component | Version | License | Risk | Vulnerabilities | Source |
| --- | --- | --- | --- | --- | --- |
| react / react-dom | 19.3.1 | MIT | None | None identified | package.json |
| typescript | ~5.9.3 | Apache-2.0 | None | None identified | package.json |
| vite | ^8.3.7 | MIT | None | None identified | package.json |
| electron | ^45.2.1 | MIT | None | None identified | package.json |
| zustand | ^5.0.16 | MIT | None | None identified | package.json |
| vitest | ^5.1.0 | MIT | None | None identified | package.json |
| playwright | ^1.64.1 | Apache-2.0 | None | None identified | package.json |
| eslint | ^10.14.0 | MIT | None | None identified | package.json |
| prettier | ^3.9.10 | MIT | None | None identified | package.json |
| js-yaml | bundled | MIT | None | None identified | package-lock.json |
| lucide-react | bundled | ISC | None | None identified | package-lock.json |
| electron-builder | ^26.x | MIT | None | None identified | package.json |

Direct components above: 12 representative entries from the locked dependency set. Licenses are the declared manifest values; vulnerabilities reflect the executed `npm audit` run (found 0).

## License conformance

MIT single-author project: `LICENSE` is byte-identical to `build.copyright` and `public/LICENSE`, enforced by `test/guard/licenseNotice.test.ts`.
`docs/COPYRIGHTS.md` records the dependency allowlist (permissive family plus a dev-only MPL-2.0 carve-out for lightningcss; GPL barred) and three third-party provenances: the ZX0 decompressor port retains its BSD-3 header, the Ayumi core retains its MIT header, and the MOD/MIDI exporters are declared original.
Bundled assets ship license text where required (`public/font/UFL.txt`, UFL-1.0).
Demo content - including the author-created cover arrangement `public/repository/song/Crockett.song.yaml` - is declared original demo work by the maintainer.

## Project scoreboard

**Risk map**

| Severity | Count | Risks |
| --- | --- | --- |
| Critical | 0 |  |
| High | 0 |  |
| Medium | 4 | [RSK-001](#rsk-001-coverage gate loses), [RSK-002](#rsk-002-live playback and), [RSK-003](#rsk-003-single-maintainer continuity: all), [RSK-004](#rsk-004-a corrupted or) |
| Low | 0 |  |

**Legend**

| Band | Score |
| --- | --- |
| Weak | 1-3 |
| Average | 4-6 |
| Good | 7-8 |
| Excellent | 9-10 |

**Scorecard**

| Dimension | Score |
| --- | --- |
| Functional suitability | 10/10 |
| Testability | 9/10 |
| Design soundness | 9/10 |
| Code quality | 9/10 |
| Code style | 10/10 |
| Stack alignment | 10/10 |
| Dependencies | 10/10 |
| Maintainability | 10/10 |
| Structure | 9/10 |
| Deployability | 9/10 |
| Scalability | 9/10 |
| Security | 7/10 |
| Compliance | 10/10 |
| Observability | 6/10 |
| Operational safety | 10/10 |
| Documentation | 10/10 |
| API compatibility | 9/10 |
| Delivery & continuity | 5/10 |
| Originality & licensing | 10/10 |

No dimension carries an uncertainty interval - every scored criterion resolved on inspected or executed evidence. `skill_definition` is deployment-model N/A and carries no score.
The score floor is Delivery & continuity at 5/10, driven by single-author history and hygiene debt rather than code evidence.

**Team and continuity**

One author produced all 782 commits in history (100% top-author share) across twelve months, with no tags (deliberate) and 27 merge commits. Two remotes (GitHub origin, GitLab mirror) and a 27-branch museum push the same topology to both. No succession or delegation record exists.

## Delivery and team-continuity practice

| Metric | Proxy | Value |
| --- | --- | --- |
| Deploy frequency | Release entries in CHANGELOG | 66 versions, ~1 release per 2.3 days |
| Lead time for change | Median commit-to-release interval | Not provided - no tags |
| Change failure rate | Revert/fixup share of history | 0/782 in local window |
| Time to restore | Documented recovery plus reset/mirror path | Documented, exercised locally |
| Reliability | SLO artifacts | Not provided |
| Bus factor | Active co-authors (bot identities excluded) | 1 |

History is twelve months of dense single-author work; every DORA proxy that needs a release boundary substitutes the changelog version stream, which is contiguous 1.0.14..1.6.7.

## Key observations

- The declared verification loop executes green at every executed stage except the coverage gate: typecheck, lint, build, and the full 1,809-test suite pass; `test:coverage` fails on timing-sensitive suites.
- The security boundary is hardened end-to-end: Electron isolation, deny-by-default permissions, navigation and window-open blocks, CSP, escaped markdown rendering, and a bundled-document fetch allowlist.
- Validation is asymmetric: the 1 MiB import cap is applied after a speculative YAML parse on the instrument path, and storage restores bypass part of the import-time validation.
- Live playback and export simulation implement the tick/envelope/register logic twice without a shared contract - the main drift surface.
- Process governance is unusually rigorous for a single-author project: window SDLC, a passing four-gate release check, retention sweeps, and 66 contiguous changelog versions.

## Audit methodology

The audit reviewed the tracked tree at `263cb00` plus the working tree (1,427 tracked files: 229 production, 197 test, ~884 documentation), re-derived the structure census, froze the 37-entry requirements registry from `docs/PROJECT.md`, and ran the commissioned command set inside the isolation copy `work/exec/tree` per the execution-isolation procedure.
Standards baseline: the subject `docs/` corpus first, then the bundled frontend and pipeline catalogues. Read depth: every file an activated check touched was read in full; inventory rows unused for grading remain listed.
All executed results are proxy evidence: host Node v22.23.5 sits below the declared >=26.13.0 floor and engine-strict prevented a conforming reinstall.

### Evidence list

| Evidence | Source | Result |
| --- | --- | --- |
| EVD-001 | work/exec/exec-log.txt:2-5 | npm run typecheck exit 0 (isolation copy work/exec/tree) |
| EVD-002 | work/exec/exec-log.txt:6-9 | npm run lint exit 0, zero findings |
| EVD-003 | work/exec/exec-log.txt:10-31 | npm run build exit 0; Vite 8.3.7, 2295 modules, ~1s; index.js 591.66 kB < 600 kB cap |
| EVD-004 | work/exec/exec-log.txt:32-73 | npm run test exit 0; 197 files / 1,809 tests pass, 35.03s |
| EVD-005 | work/exec/exec-log.txt:74-135; work/exec/coverage-full.txt | npm run test:coverage exit 1; App.test.tsx Settings-dialog timeout (documented flake) + retentionSweepCoverage 2 timeouts; rerun 3 failures; no coverage table rendered |
| EVD-006 | coverage re-run output, work/exec/tree | vitest --coverage on stable subset (2 flaky files excluded): statements 85.94%, branches 79.63%, functions 81.87%, lines 86.24%; branches below 80% threshold |
| EVD-007 | work/exec/exec-log.txt:136-138 | npm audit exit 0; found 0 vulnerabilities |
| EVD-008 | work/exec/exec-log.txt:139-148 | scripts/release-check.sh exit 0; 14 change records for 1.6.7, served changelog covers 1.6.7, refactoring assessed; WARN no review for 1.6.7 (mid-window) |
| EVD-009 | work/exec/exec-log.txt:149-200; work/exec/retry-log.txt | npm run test:e2e run1 4 failed/26 passed; run2 2 failed/28 passed; failures WebKit-only: PLAY SONG never gains .playing (smoke.spec.ts:29,162); theme failures transient |
| EVD-010 | work/exec/retry-log.txt | npm run electron:build exit 0 after node_modules resync: NSIS + zip + blockmap produced, unsigned (no cert). Initial failure was an incomplete isolation copy |
| EVD-011 | package.json:1-156 | package.json: pinned lockfile deps, overrides minimatch ^11.0.5, allowScripts disables two install scripts, engines node>=26.13.0/npm>=11.20.0 |
| EVD-012 | vitest.config.ts:11-26 | vitest.config.ts: v8 provider, thresholds 80% lines/functions/branches/statements, two excludes |
| EVD-013 | vite.config.ts:19-94 | vite.config.ts: build-time CSP injection (default-src 'self', object-src 'none', style 'unsafe-inline' documented), chunkSizeWarningLimit 600, SW versioning, dev host:true port 8008 |
| EVD-014 | electron/main.cjs:8-60; electron/permissions.cjs:1-38; electron/preload.cjs:1-32 | electron boundary: contextIsolation:true, nodeIntegration:false, deny-by-default permission handler (MIDI, app-origin only), will-navigate restricted, setWindowOpenHandler denied -> shell.openExternal, DevTools dev-only |
| EVD-015 | src/utils/markdown/*; src/modals/markdown/MarkdownModal.tsx | Markdown renderer escapes HTML before formatting, fixed tag vocabulary, only http(s) URLs linkify; dangerouslySetInnerHTML is a controlled sink on bundled first-party docs |
| EVD-016 | src/hooks/app/useBundledDocument.ts (fetch guard) | Bundled-doc fetch allowlist: MESSAGES.md/CHANGELOG.md/MANUAL.md only; response.ok required; HTML content-type and HTML/script sniff rejected |
| EVD-017 | src/constants/import.ts:1; src/hooks/file/useInstrumentFileLoading.ts; src/components/shell/FileInputs.tsx | MAX_IMPORT_BYTES=1 MiB enforced on song/settings/history imports; instrument load path parses YAML before the size assertion (useInstrumentFileLoading.ts; FileInputs.tsx) |
| EVD-018 | tsconfig.app.json:20; eslint.config.js:26-50 | tsconfig.app.json strict:true; eslint no-explicit-any:error; react-hooks rules downgraded to warn per documented audio-critical exceptions |
| EVD-019 | docs/PROJECT.md:57-257 | Requirements registry: docs/PROJECT.md F-01..F-21, N-01..N-06 mandatory, C-01..C-06 use cases, QT targets; docs/SPECIFICATION.md carries no formal registry |
| EVD-020 | git log census, recorded work/exec + scout-delivery.md | git census: 782 commits 2025-11-17..2026-11-19; single author 782/782; 0 tags (deliberate); 27 merges; 72 commits last 30d; imperative subjects, ~0 conventional prefixes |
| EVD-021 | public/CHANGELOG.md:3-34,625-637; docs/VERSIONING.md:98-125 | CHANGELOG: 66 contiguous '## Version' entries 1.0.14..1.6.7 matching package.json; recent entries written present-tense vs VERSIONING.md:121 past-tense rule |
| EVD-022 | src/**; docs/ARCHITECTURE.md; work/scout-architecture.md | Architecture: src/ 38,934 LOC; layer map conforms (utils/synth React-free); two flows verified against ARCHITECTURE.md; 10 boundary variances incl. circular type edge midiConfiguration<->useMidi and utils->synth YM_CLOCK edge; duplicated envelope/sub-tick machine and register-apply (live vs playbackSimulation); updateChannelWithInstrument name collision |
| EVD-023 | src/constants/music.ts:62-73; src/constants/song.ts; src/utils/song/editHistory.ts:7-9 | Verified constants: PATTERN_LENGTH=64, MAX_PATTERN_LENGTH=256, parser clamps 4..256, DEFAULT_SONG_FRAME=50, YM_CLOCK=2,000,000, EDIT_COALESCE_MS=1000 |
| EVD-024 | work/scout-requirements.md; src/**; test/** | Requirements trace: every F-01..F-21 has implementation anchors and dedicated tests (verified via scout + spot checks) |
| EVD-025 | docs/GUIDELINES.md:105-119,200; docs/TESTING.md; docs/ARCHITECTURE.md:33 | Governing docs: GUIDELINES.md records CI evaluated-and-declined (added 1.3.0 removed 1.3.1) and community files declined; TESTING.md records the Settings-dialog full-suite flake and subprocess coverage caveat; ARCHITECTURE.md records deliberate hook/exhaustive-deps exceptions |
| EVD-026 | LICENSE; docs/COPYRIGHTS.md:21-49; public/font/UFL.txt; test/guard/license*.test.ts; public/repository/song/Crockett.song.yaml | Licensing: MIT (LICENSE == build.copyright == public/LICENSE, byte-identity guard-tested); COPYRIGHTS.md allowlist incl. dev-only MPL-2.0 for lightningcss, GPL barred; zx0.ts BSD-3 and ayumiCore.ts MIT headers retained; UFL-1.0 font license shipped; public/repository/song/Crockett.song.yaml is an author-created cover arrangement declared original demo content by the maintainer |
| EVD-027 | scripts/release-check.sh:26-93; docs/change, docs/review, docs/archive census; work/scout-delivery.md | Delivery surface: release-check.sh four gates; retention sweep boundary clean (archived <1.6.0, active >=1.6.0); docs/change has 1.6.7(14) + seeded 1.7.0(4) + 1.8.0(2); docs/review lacks 1.6.7 (mid-window, WARN-level) |
| EVD-028 | src/utils/storage/editHistoryStorage.ts; src/hooks/song/useEditHistory.ts; src/hooks/song/useDataManagement.ts; src/utils/midi/midiConfiguration.ts; public/worker.js | Storage restore paths: persisted undo history restored without the in-memory 100-entry bound or full shape validation; localStorage/IndexedDB restores normalize some fields but spread raw objects vs full parser validation; MIDI configuration writes a version field not validated on parse; service worker caches same-origin GET responses without status check |
| EVD-029 | docs/TESTING.md vs test/ census; work/scout-context.md | TESTING.md drift: cites test/modals/MidiModal.test.tsx (actual test/modals/midi/MidiModal.test.tsx); node-environment enumeration incomplete; test/guard/ and test/scripts/ missing from directory lists |
| EVD-030 | test/**; e2e/smoke.spec.ts; work/scout-context.md | Test census: 197 files / 1,809 tests; zero stubs, zero any/@ts-ignore in src/; e2e 30 specs across Chromium+WebKit; coverage-map gaps: no direct test for src/workers/ayumiWorklet.ts; thin areas in constants/scripts/electron |
| EVD-031 | .gitignore:11-42; .npmrc:1; .nvmrc; git diff census | .gitignore covers work/dist/coverage/test-results; .npmrc engine-strict=true; .nvmrc pins 26.13.0; no .gitattributes -> ~1,242 files show pure CRLF churn under core.autocrlf=true |
| EVD-032 | work/exec/exec-log.txt:1 | Environment census: host Node v22.23.5 below declared >=26.13.0 (all Node results are proxy evidence); npm 12.2.2; Playwright Chromium+WebKit installed; 682 GB free; network reachable |
| EVD-033 | .git/packed-refs; scripts/sync-branches.sh; work/scout-delivery.md | Branch topology: 27 local branches incl. stale broken/* repair/* typo branches pushed to both remotes; sync-branches.sh unreferenced, force-pushes all branches to every remote; two remotes origin (GitHub) + scene (GitLab mirror) |
| EVD-034 | work/exec/retry-log.txt | e2e WebKit playback-start failures are reproducible (2/2 runs) and Chromium is fully green; consistent with headless-WebKit audio-context limitations in this environment rather than a logic defect, but not root-caused in-tree |
| EVD-035 | scripts/bump-version.mjs:51-53; scripts/retention-sweep.mjs; scripts/afterAllArtifactBuild.cjs | Scripts: bump-version.mjs logs failures without failing (silent-failure tolerance); retention-sweep.mjs dry-run default, never commits, covered by tests; afterAllArtifactBuild.cjs emits per-platform SHA256SUMS |
| EVD-036 | docs/archive/report/1.5.9/AUDIT-1.6.md | Prior audit AUDIT-1.6 (lens 2.8.8, score 8.8/10) used for revision parity and output location only; no findings carried forward |
| EVD-037 | git status/git diff, 2026-11-19 | Working-tree census: 1,259 dirty entries; only 8 files with real content changes (App.tsx decomposition into 4 new hooks + tests, settings-session change, retention tweak, SPECIFICATION line); remainder pure CRLF churn |
| EVD-038 | src/utils/song/editHistory.ts:7-139; src/utils/storage/editHistoryStorage.ts | undo/edit-history: limit 100 entries in memory, 20 persisted, 1s coalesce; cleared on new/load/demo/reset; restored entries not re-bounded |
| EVD-039 | src/workers/sequencerWorklet.ts; src/utils/playback/playbackSimulation.ts; src/synth/channelInstrument.ts:73-167 | Live/export independence verified: AudioWorklet clock on render thread (sequencerWorklet.ts:44-60,244-247) vs offline simulateSong (playbackSimulation.ts:59-344); shared channelInstrument.ts translation; deterministic exports (no Math.random/Date.now in exports) |
| EVD-040 | electron/main.cjs (webPreferences block) | Electron webPreferences does not set sandbox explicitly (contextIsolation+nodeIntegration:false present) |

**Criteria table**

| Criterion | Dimension | Weight | Level | Outcome |
| --- | --- | --- | --- | --- |
| FNC-REQ | Functional suitability | 3 | Passed | Passed |
| FNC-JOURNEY | Functional suitability | 2 | Passed | Passed |
| FNC-STUB | Functional suitability | 2 | Passed | Passed |
| FNC-DEFECT | Functional suitability | 2 | P75 | Partial |
| FNC-CONTRACT | Functional suitability | 1 | Passed | Passed |
| TST-WFLOW | Testability | 3 | Passed | Passed |
| TST-FAILPATH | Testability | 2 | Passed | Passed |
| TST-ASSERT | Testability | 2 | Passed | Passed |
| TST-ISO | Testability | 2 | Passed | Passed |
| TST-GATE | Testability | 2 | P50 | Partial |
| ARC-RESP | Design soundness | 3 | Passed | Passed |
| ARC-ABSTRACT | Design soundness | 2 | Passed | Passed |
| ARC-COUPLING | Design soundness | 2 | P75 | Partial |
| ARC-DRY | Design soundness | 2 | P75 | Partial |
| ARC-PATTERN | Design soundness | 1 | Passed | Passed |
| CQY-ANALYSIS | Code quality | 2 | Passed | Passed |
| CQY-COMPLEX | Code quality | 2 | P75 | Partial |
| CQY-DUP | Code quality | 2 | P75 | Partial |
| CQY-DEAD | Code quality | 2 | Passed | Passed |
| CQY-ERRH | Code quality | 1 | Passed | Passed |
| STY-CONSIST | Code style | 3 | Passed | Passed |
| STY-VOCAB | Code style | 1 | P75 | Partial |
| STY-NAMING | Code style | 2 | Passed | Passed |
| STY-READ | Code style | 1 | Passed | Passed |
| STY-ENFORCE | Code style | 1 | Passed | Passed |
| STK-IDIOM | Stack alignment | 2 | Passed | Passed |
| STK-FRAME | Stack alignment | 3 | Passed | Passed |
| STK-LIB | Stack alignment | 2 | Passed | Passed |
| STK-CURRENT | Stack alignment | 2 | Passed | Passed |
| STK-ANTIPAT | Stack alignment | 1 | P50 | Partial |
| DEP-PIN | Dependencies | 3 | Passed | Passed |
| DEP-ADVISORY | Dependencies | 2 | Passed | Passed |
| DEP-INVENT | Dependencies | 2 | Passed | Passed |
| DEP-DECLARE | Dependencies | 2 | Passed | Passed |
| DEP-META | Dependencies | 1 | Passed | Passed |
| DEP-LIFECYCLE | Dependencies | 1 | Passed | Passed |
| MNT-DEBT | Maintainability | 2 | Passed | Passed |
| MNT-GOV | Maintainability | 2 | Passed | Passed |
| MNT-VERSION | Maintainability | 1 | Passed | Passed |
| STR-ORG | Structure | 3 | Passed | Passed |
| STR-NAME | Structure | 2 | Passed | Passed |
| STR-DIVIDE | Structure | 2 | P75 | Partial |
| STR-PLACEMENT | Structure | 2 | P75 | Partial |
| STR-REG | Structure | 1 | Passed | Passed |
| DEP-BUILD | Deployability | 3 | Passed | Passed |
| DEP-CONFIG | Deployability | 2 | Passed | Passed |
| DEP-DEFAULTS | Deployability | 2 | Passed | Passed |
| DEP-RUNPATH | Deployability | 2 | Passed | Passed |
| DEP-PIPELINE | Deployability | 2 | P50 | Partial |
| DEP-RELEASE | Deployability | 2 | Passed | Passed |
| SCA-TARGET | Scalability | 2 | Passed | Passed |
| SCA-MODEL | Scalability | 2 | Passed | Passed |
| SCA-BOUNDS | Scalability | 2 | Passed | Passed |
| PRF-MEASURE | Scalability | 1 | P50 | Partial |
| SEC-AUTHZ | Security | 3 | Passed | Passed |
| SEC-INPUT | Security | 2 | P50 | Partial |
| SEC-SESS | Security | 2 | P50 | Partial |
| SEC-ABUSE | Security | 2 | P50 | Partial |
| SEC-SECRET | Security | 2 | Passed | Passed |
| SEC-THREAT | Security | 2 | P50 | Partial |
| COM-INVENT | Compliance | 1 | Passed | Passed |
| COM-RETENT | Compliance | 2 | Passed | Passed |
| COM-RIGHTS | Compliance | 2 | Passed | Passed |
| COM-AUDIT | Compliance | 2 | Passed | Passed |
| COM-CONSENT | Compliance | 1 | Passed | Passed |
| OBS-LOG | Observability | 2 | P50 | Partial |
| OBS-METRIC | Observability | 2 | P50 | Partial |
| OBS-TRACE | Observability | 1 | Passed | Passed |
| OBS-ALERT | Observability | 2 | P50 | Partial |
| OPS-RETRY | Operational safety | 2 | Passed | Passed |
| OPS-ERR | Operational safety | 2 | Passed | Passed |
| OPS-SHUT | Operational safety | 2 | Passed | Passed |
| REL-BACKUP | Operational safety | 2 | Passed | Passed |
| OPS-REVERT | Operational safety | 2 | Passed | Passed |
| OPS-RUNBOOK | Operational safety | 1 | Passed | Passed |
| DOC-EXIST | Documentation | 3 | Passed | Passed |
| DOC-SYNC | Documentation | 2 | P75 | Partial |
| DOC-ARCH | Documentation | 2 | Passed | Passed |
| DOC-OPER | Documentation | 2 | Passed | Passed |
| DOC-API | Documentation | 1 | Passed | Passed |
| CMP-SURFACE | API compatibility | 3 | Passed | Passed |
| CMP-GATE | API compatibility | 1 | Passed | Passed |
| CMP-VERSION | API compatibility | 2 | P50 | Partial |
| CMP-DEPREC | API compatibility | 2 | Passed | Passed |
| CMP-DRIFT | API compatibility | 2 | Passed | Passed |
| DLY-CADENCE | Delivery & continuity | 2 | Passed | Passed |
| DLY-BUSFACTOR | Delivery & continuity | 3 | Failed | Failed |
| DLY-HYGIENE | Delivery & continuity | 1 | P50 | Partial |
| DLY-REVIEW | Delivery & continuity | 1 | Passed | Passed |
| CPR-LICENSE | Originality & licensing | 3 | Passed | Passed |
| CPR-DEPLIC | Originality & licensing | 2 | Passed | Passed |
| CPR-NOTICE | Originality & licensing | 2 | Passed | Passed |
| CPR-ORIGIN | Originality & licensing | 2 | Passed | Passed |
| SKL-FRONT | Skill definition | 3 | - | N/A |
| SKL-DISC | Skill definition | 2 | - | N/A |
| SKL-CFG | Skill definition | 2 | - | N/A |
| SKL-GUIDE | Skill definition | 2 | - | N/A |
| SKL-SEC | Skill definition | 2 | - | N/A |
| SKL-COLL | Skill definition | 1 | - | N/A |

## Scoring rules

Scores use the 1-10 scale: Weak 1-3, Average 4-6, Good 7-8, Excellent 9-10.
Each dimension recomputes as the weighted mean of mastery across its applicable criteria records under scoring policy 3 and the fixed catalogue.
Product quality is the weighted mean of the product dimensions, engineering process the equal-weight mean of the process dimensions, the overall score blends 0.7 and 0.3, and readiness ceilings apply on top.

## Architecture evaluation

The workspace keeps the declared layering: `components/` render through callbacks, `hooks/` own behavior, `utils/` and `synth/` carry zero React imports, `workers/` hold the AudioWorklet clock, and `App.tsx` composes the wiring as the documented root.
Two flows were traced end-to-end with no drift from `docs/ARCHITECTURE.md`: live playback (sample-counted worklet ticks -> per-tick register driving -> shared channel translation -> engine sinks) and export (lazy imports -> normalization -> offline `simulateSong` mirror).
Recorded variances: a circular type edge `midiConfiguration <-> useMidi`, a `utils -> synth` constant edge for `YM_CLOCK`, JSX returned from `useAppModals.tsx`, and pure modules sitting inside the `hooks/` tree.

### Design principles

SRP holds per directory but concentrates at the composition root: `App.tsx` is 1,177 lines with ~50 hook calls (the documented bottleneck), and `App.css` is a single ~4,330-line stylesheet. DIP holds via the `SoundEngine` contract and `RegisterIo`; OCP shows in per-format export modules and engine factory.

### Data flow

Trust boundaries: YAML file imports (song/instrument/settings/MIDI), localStorage/IndexedDB restores, bundled-document fetches, repository picker fetches, and the Electron main/renderer IPC seam. All are inspected; the asymmetric validation findings sit on the first two.

### Design patterns

Recurring structures: factory + contract seam (`createSoundEngine`), strategy modules per export format, offline mirror of the live tick machine for export, snapshot-based undo with coalescing, and idle-callback persistence.

### Architectural decision registry

`docs/ARCHITECTURE.md` and `docs/GUIDELINES.md` record the durable decisions: worklet render-thread clock, deliberate React anti-pattern exceptions in audio-critical paths, deep prop passing as the composition trade-off, and the declined-CI posture.

## Structure review

| Area | Verdict | Basis |
| --- | --- | --- |
| Directory organization | Passed | domain-grouped `src/` mirrors the declared layout |
| Naming conventions | Passed | consistent domain naming; one function-name collision recorded |
| Component placement | Partial | pure modules and JSX inside the `hooks/` tree (`FND-ARC-002`) |
| Support-artifact layout | Passed | test/, e2e/, scripts/, docs/, public/ hold their declared roles |
| Consistency | Partial | composition-root concentration (`FND-ARC-003`) |

## Solution comparison

The dominant trade-off is the deliberate live/offline split: the worklet clock guarantees exact tick generation while the main thread delivers registers - documented as "exact generation, not zero-latency delivery" - and the export path replays the same logic offline. The cost is the duplicated state machines recorded as `FND-ARC-001`.
Snapshot-based undo trades command-object elegance for simplicity and bounded memory; deep prop passing trades context indirection for explicit wiring; single-author delivery keeps decision latency at zero while concentrating continuity risk in one identity.

## Threat model

No committed threat-model document exists; the boundary is verified in code: deny-by-default Electron permissions (MIDI, app-origin only), blocked navigation, denied window-open with external routing, build-time CSP with `object-src none`, escaped markdown with a fixed tag vocabulary, and an allowlisted bundled-document fetch.
Residual STRIDE surface after inspection: input paths carry a size cap applied late on the instrument route (`FND-SEC-001`), restore paths trust partial normalization (`FND-SEC-002`), and the Electron sandbox flag, service-worker status check, and dev `host:true` are the remaining hardening gaps (`FND-SEC-003`).

## Contract conformance

The YAML song format and export streams are golden-tested byte-for-byte (`yamlEmission`, `exportMod`, `exportMidi`, `exportAssemblyTight` replay-equivalence). Legacy keys migrate (`tight` rename, stereo, mutes) and the MIDI configuration writes a version field that is not yet validated on parse (`CMP-VERSION` partial).

## Standards conformance

The `docs/standard/` corpus plus project rules govern the object. Observed conformance is high: strict TypeScript with zero `any`, executed lint and typecheck both clean, documented warn-level exceptions only in audio-critical paths, and document templates followed across the window records. Two conformance drifts are recorded: stale `TESTING.md` enumerations (`FND-DOC-001`) and present-tense changelog entries against the past-tense rule (`FND-STD-002`).

## Requirements conformance

| Requirement | Obligation | Status | Evidence |
| --- | --- | --- | --- |
| F-01 | mandatory | PASS | EVD-024 |
| F-02 | mandatory | PASS | EVD-024 |
| F-03 | mandatory | PASS | EVD-024 |
| F-04 | mandatory | PASS | EVD-024 |
| F-05 | mandatory | PASS | EVD-024 |
| F-06 | mandatory | PASS | EVD-024 |
| F-07 | mandatory | PASS | EVD-024 |
| F-08 | mandatory | PASS | EVD-024 |
| F-09 | mandatory | PASS | EVD-024 |
| F-10 | mandatory | PASS | EVD-024 |
| F-11 | mandatory | PASS | EVD-024 |
| F-12 | mandatory | PASS | EVD-024 |
| F-13 | mandatory | PASS | EVD-024 |
| F-14 | mandatory | PASS | EVD-024 |
| F-15 | mandatory | PASS | EVD-024 |
| F-16 | mandatory | PASS | EVD-024 |
| F-17 | mandatory | PASS | EVD-024 |
| F-18 | mandatory | PASS | EVD-024 |
| F-19 | mandatory | PASS | EVD-024 |
| F-20 | mandatory | PASS | EVD-024 |
| F-21 | mandatory | PASS | EVD-024 |
| N-01 | mandatory | PARTIAL | EVD-024, EVD-039 |
| N-02 | mandatory | PASS | EVD-024 |
| N-03 | mandatory | PASS | EVD-024 |
| N-04 | mandatory | PASS | EVD-001, EVD-002, EVD-018 |
| N-05 | mandatory | PASS | EVD-002, EVD-018 |
| N-06 | mandatory | PARTIAL | EVD-005, EVD-006, EVD-012 |
| C-01 | mandatory | PASS | EVD-024 |
| C-02 | mandatory | PASS | EVD-024 |
| C-03 | mandatory | PASS | EVD-024 |
| C-04 | mandatory | PASS | EVD-024 |
| C-05 | mandatory | PASS | EVD-024 |
| C-06 | mandatory | PASS | EVD-024 |
| QT-01 | recommended | PARTIAL | EVD-039 |
| QT-02 | recommended | PASS | EVD-024, EVD-039 |
| QT-03 | recommended | PARTIAL | EVD-003 |
| QT-04 | recommended | PASS | EVD-024 |

Mandatory coverage ratio 0.970 derives `FNC-REQ` Passed. `N-01` and `N-06` grade Partial: the first rests on design evidence only, the second on the red coverage gate - both anchor open findings.

## Engineering baseline conformance

The declared local loop (typecheck, lint, format, build, test) executed green at every non-mutating stage; `format` was excluded as mutating. The release gate, audit, and packaging checks all ran inside the isolation copy.

## Project structure conformance

| Check | Status | Note |
| --- | --- | --- |
| Module-tree discipline | OK | layer map conforms; utils/synth React-free |
| File-size budget | Partial | two over-sized artifacts: App.tsx 1,177 and App.css ~4,330 |
| Cross-layer sharing | OK | shared translation lives in `synth/channelInstrument.ts` |
| Test layout | OK | mirrored `test/` tree plus `e2e/` Playwright suite |

## Code style

| Dimension | Status | Note |
| --- | --- | --- |
| Uniformity | OK | lint executed clean in the isolation copy |
| Naming | OK | consistent; `updateChannelWithInstrument` collision recorded |
| Lint state | OK | ESLint zero findings, Prettier enforced |
| Idiomaticity | Partial | documented hook-rule exceptions in audio-critical paths |

## Strengths and what works

- The declared verification loop executes green: 1,809 tests across 197 files, zero lint findings, strict typecheck, ~1 s production build.
- `npm audit` executed on the manifest reports zero vulnerabilities.
- The Electron boundary is hardened deny-by-default; markdown rendering escapes before formatting.
- Export correctness is byte-verified: golden YAML emission, replay-equivalent assembly, byte-identical MOD/MIDI.
- A four-gate release check passes; retention sweeps keep the archive boundary clean at 1.6.x.
- 66 contiguous changelog versions and per-window change/plan/refactoring/review records keep the process auditable.
- Audio timing is architecture-first: the sequencer clock lives on the render thread, immune to main-thread jitter.
- Persistence is redundant by design: localStorage plus an IndexedDB mirror with reset epochs and persistent-storage request.

## Technical findings

| Finding | Pillar | Severity | Title | Outcome |
| --- | --- | --- | --- | --- |
| [FND-SEC-001](#fnd-sec-001-instrument-import-parses-yaml-before-size-gate) | SEC | Medium | Instrument import parses YAML before size gate | Partial |
| [FND-SEC-002](#fnd-sec-002-storage-restore-paths-bypass-full-validation) | SEC | Medium | Storage restore paths bypass full validation | Partial |
| [FND-SEC-003](#fnd-sec-003-residual-hardening-gaps) | SEC | Low | Residual hardening gaps | Partial |
| [FND-TST-001](#fnd-tst-001-coverage-gate-currently-red) | TST | Medium | Coverage gate currently red | Partial |
| [FND-TST-002](#fnd-tst-002-reproducible-webkit-e2e-playback-failures) | TST | Medium | Reproducible WebKit e2e playback failures | Partial |
| [FND-TST-003](#fnd-tst-003-coverage-map-gaps) | TST | Low | Coverage map gaps | Partial |
| [FND-ARC-001](#fnd-arc-001-dual-liveoffline-implementations-risk-drift) | ARC | Low | Dual live/offline implementations risk drift | Partial |
| [FND-ARC-002](#fnd-arc-002-layer-boundary-variances) | ARC | Low | Layer boundary variances | Partial |
| [FND-ARC-003](#fnd-arc-003-composition-root-concentration) | ARC | Low | Composition-root concentration | Partial |
| [FND-DLV-001](#fnd-dlv-001-repository-hygiene-debt) | DLV | Low | Repository hygiene debt | Partial |
| [FND-DLV-002](#fnd-dlv-002-single-author-continuity) | DLV | Low | Single-author continuity | Partial |
| [FND-STD-002](#fnd-std-002-changelog-tense-drift) | STD | Low | Changelog tense drift | Partial |
| [FND-DOC-001](#fnd-doc-001-testingmd-stale-enumerations) | DOC | Low | TESTING.md stale enumerations | Partial |
| [FND-PRF-001](#fnd-prf-001-audio-quality-targets-not-machine-verified) | PRF | Low | Audio quality targets not machine-verified | Partial |
| [FND-PRF-002](#fnd-prf-002-load-time-target-unmeasured) | PRF | Low | Load-time target unmeasured | Partial |

### FND-SEC-001: Instrument import parses YAML before size gate

useInstrumentFileLoading.ts + FileInputs.tsx parse the file before asserting the 1 MiB MAX_IMPORT_BYTES cap applied to other import paths; oversized input reaches the parser.

* **Pillar:** Security and compliance
* **Severity:** Medium
* **Type:** Defect
* **Objects:** src/components/shell/FileInputs.tsx:50-65, src/hooks/instrument/useInstrumentFileLoading.ts:53-118, src/utils/instrument/instrumentIO.ts:94-99
* **Basis:** input-validation criteria
* **Criterion:** SEC-INPUT - the size gate exists but fires after a speculative parse
* **Deviation character:** None recorded
* **Impact:** an oversized instrument file reaches a full YAML parse before any byte cap applies - a local parser/DoS surface
* **Method:** end-to-end trace of both import paths
* **Assessment confidence:** High
* **Mitigating factors:** local file picker, user-selected input, cap exists downstream
* **Evidence:** [EVD-017](#evidence-list) Verified
* **Recommendation:** See [REC-002](#rec-002-assert-maximportbytes-before-parsing-on-the-instrument-path-same-order-as-songsettings-imports)

### FND-SEC-002: Storage restore paths bypass full validation

persisted undo history restored without the in-memory 100-entry bound or snapshot-shape validation; localStorage/IndexedDB restores normalize selected fields but spread raw objects rather than running the song parser's full validation; MIDI configuration writes a version field not validated on parse.

* **Pillar:** Security and compliance
* **Severity:** Medium
* **Type:** Defect
* **Objects:** src/utils/storage/editHistoryStorage.ts, src/utils/song/editHistory.ts:123-139, src/hooks/song/useSongManagement.ts:271-300, src/utils/midi/midiConfiguration.ts
* **Basis:** input-validation criteria
* **Criterion:** SEC-INPUT / SEC-SESS - restore paths trust partial normalization
* **Deviation character:** None recorded
* **Impact:** a corrupted or tampered persisted snapshot restores past the persisted-entry bound and without per-snapshot or import-parser validation
* **Method:** source inspection of deserialize and restore paths
* **Assessment confidence:** High
* **Mitigating factors:** array-shape check present; corrupt input returns an empty history; local-only storage
* **Evidence:** [EVD-028](#evidence-list), [EVD-038](#evidence-list) Verified
* **Recommendation:** See [REC-004](#rec-004-route-storage-restores-through-the-song-parsers-validation-re-apply-the-undo-bound-and-shape-checks-on-restored-history-validate-the-midi-config-version-field)

### FND-SEC-003: Residual hardening gaps

Electron webPreferences lacks explicit sandbox setting; service worker caches same-origin GET responses without checking status; Vite dev server binds all interfaces via host:true (development-only).

* **Pillar:** Security and compliance
* **Severity:** Low
* **Type:** Observation
* **Objects:** electron/main.cjs (webPreferences), public/worker.js, vite.config.ts (dev server)
* **Basis:** abuse-surface criteria
* **Criterion:** SEC-ABUSE - residual hardening gaps
* **Deviation character:** Deliberate for host:true (development convenience)
* **Impact:** sandbox unset leaves isolation to contextIsolation alone; the SW may cache non-OK responses; the dev server binds all interfaces
* **Method:** config and worker inspection
* **Assessment confidence:** High
* **Mitigating factors:** contextIsolation+nodeIntegration:false present; dev-only exposure
* **Evidence:** [EVD-013](#evidence-list), [EVD-028](#evidence-list), [EVD-040](#evidence-list) Verified
* **Recommendation:** See [REC-007](#rec-007-set-electron-sandbox-explicitly-with-a-comment-add-response-status-check-to-service-worker-caching-document-hosttrue-as-dev-only)

### FND-TST-001: Coverage gate currently red

npm run test:coverage fails: App.test.tsx Settings-dialog timeout (documented flake) plus retentionSweepCoverage subprocess/in-process timeouts under instrumentation; on the stable subset branches coverage is 79.63% < 80% threshold.

* **Pillar:** Testability
* **Severity:** Medium
* **Type:** Defect
* **Objects:** vitest.config.ts, test/components/shell/App.test.tsx:46, test/scripts/retentionSweepCoverage.test.ts
* **Basis:** gate criteria
* **Criterion:** TST-GATE - the declared coverage gate is red
* **Deviation character:** None recorded
* **Impact:** thresholds never evaluate in a failing run; branches sit at 79.63% below the 80% target; regression signal degrades
* **Method:** two executed coverage runs plus stable-subset run
* **Assessment confidence:** High
* **Mitigating factors:** the underlying suite is green; the Settings flake is documented in TESTING.md
* **Evidence:** [EVD-005](#evidence-list), [EVD-006](#evidence-list), [EVD-012](#evidence-list), [EVD-025](#evidence-list) Verified
* **Recommendation:** See [REC-001](#rec-001-restore-the-coverage-gate-isolate-or-raise-timeouts-for-the-two-timing-sensitive-suites-and-add-04pp-of-branch-tests-so-80-holds-under-instrumentation)

### FND-TST-002: Reproducible WebKit e2e playback failures

test:e2e fails two WebKit specs asserting playback start (.playing class never applied): note-entry and Ayumi-engine tests; Chromium fully green; two further WebKit failures were transient; not root-caused in-tree.

* **Pillar:** Testability
* **Severity:** Medium
* **Type:** Observation
* **Objects:** e2e/smoke.spec.ts:22-35,151-164
* **Basis:** defect criteria
* **Criterion:** FNC-DEFECT - two reproducible WebKit playback-start failures
* **Deviation character:** None recorded
* **Impact:** playback-start assertions fail on WebKit in this environment; Chromium is fully green
* **Method:** two executed e2e runs
* **Assessment confidence:** Medium (environment-suspect, not root-caused)
* **Mitigating factors:** Chromium green; two further failures were transient
* **Evidence:** [EVD-009](#evidence-list), [EVD-034](#evidence-list) Verified
* **Recommendation:** See [REC-005](#rec-005-root-cause-the-two-webkit-playback-e2e-failures-headless-audio-context-start-mark-environment-expected-or-fix-initialization)

### FND-TST-003: Coverage map gaps

no direct test for src/workers/ayumiWorklet.ts; thin dedicated coverage in constants/scripts/electron areas.

* **Pillar:** Testability
* **Severity:** Low
* **Type:** Observation
* **Objects:** src/workers/ayumiWorklet.ts, src/constants/, scripts/, electron/
* **Basis:** coverage criteria
* **Criterion:** TST-WFLOW - map gaps in dedicated coverage
* **Deviation character:** None recorded
* **Impact:** the Ayumi worklet path lacks a direct test; thin areas stay unguarded
* **Method:** coverage-map inspection
* **Assessment confidence:** High
* **Mitigating factors:** integration tests reach the worklet indirectly
* **Evidence:** [EVD-029](#evidence-list), [EVD-030](#evidence-list) Verified
* **Recommendation:** See [REC-008](#rec-008-refresh-testingmd-pathenvironment-enumerations-add-direct-coverage-for-ayumiworklet-and-thin-constantscriptelectron-areas)

### FND-ARC-001: Dual live/offline implementations risk drift

envelope/sustain/sub-tick state machine and instrument->register translation implemented twice (useSequencerIntegration vs playbackSimulation); updateChannelWithInstrument name collision; patternsById/mapSongLineToPlaylistEntries duplicated.

* **Pillar:** Design soundness
* **Severity:** Low
* **Type:** Observation
* **Objects:** src/hooks/sequencer/useSequencerIntegration.ts:304-342,422-476 vs src/utils/playback/playbackSimulation.ts:171-244,300-319; src/synth/channelInstrument.ts:73-167 vs playbackSimulation.ts:346-421
* **Basis:** duplication criteria
* **Criterion:** ARC-DRY - the tick/envelope/register logic is implemented twice
* **Deviation character:** Deliberate - the offline mirror is a documented export path
* **Impact:** live and export behavior can drift silently; the updateChannelWithInstrument name collision confuses reading
* **Method:** flow tracing and cross-file comparison
* **Assessment confidence:** High
* **Mitigating factors:** deterministic exports are byte-verified today
* **Evidence:** [EVD-022](#evidence-list), [EVD-039](#evidence-list) Verified
* **Recommendation:** See [REC-003](#rec-003-close-the-liveoffline-drift-surface-extract-shared-tickenvelope-logic-or-add-contract-tests-asserting-playbacksimulation-parity-with-usesequencerintegration)

### FND-ARC-002: Layer boundary variances

circular type edge midiConfiguration<->useMidi; utils->synth YM_CLOCK import edge; JSX returned from hooks layer; pure modules in hooks/ tree.

* **Pillar:** Design soundness
* **Severity:** Low
* **Type:** Observation
* **Objects:** src/utils/midi/midiConfiguration.ts:2, src/hooks/midi/useMidi.ts:2-12, src/utils/playback/playbackSimulation.ts:9, src/exports/core.ts:3, src/hooks/modal/useAppModals.tsx:239-251
* **Basis:** coupling criteria
* **Criterion:** ARC-COUPLING - boundary variances incl. a circular type edge
* **Deviation character:** None recorded
* **Impact:** type-level cycles and inverted edges erode the documented layer split
* **Method:** import-graph inspection
* **Assessment confidence:** High
* **Mitigating factors:** no runtime import cycle; edges are type-level or constant-level
* **Evidence:** [EVD-022](#evidence-list) Verified
* **Recommendation:** See [REC-003](#rec-003-close-the-liveoffline-drift-surface-extract-shared-tickenvelope-logic-or-add-contract-tests-asserting-playbacksimulation-parity-with-usesequencerintegration)

### FND-ARC-003: Composition-root concentration

App.tsx 1,177 lines / ~50 hook calls / ~44-prop CommandPanel surface (documented trade-off); App.css ~4,330 single stylesheet.

* **Pillar:** Design soundness
* **Severity:** Low
* **Type:** Observation
* **Objects:** src/App.tsx (1,177 lines, ~50 hook calls), src/App.css (~4,330 lines)
* **Basis:** complexity criteria
* **Criterion:** CQY-COMPLEX - composition-root concentration
* **Deviation character:** Deliberate - recorded composition-root trade-off
* **Impact:** the wiring bottleneck concentrates change risk in one file; the in-flight decomposition (4 new hooks) is already addressing it
* **Method:** size census plus doc comparison
* **Assessment confidence:** High
* **Mitigating factors:** documented trade-off; decomposition in progress in the working tree
* **Evidence:** [EVD-022](#evidence-list), [EVD-037](#evidence-list) Verified
* **Recommendation:** no dedicated action - tracked in the debt register or resolved by existing work items

### FND-DLV-001: Repository hygiene debt

27 local branches incl. stale broken/* repair/* pushed to both remotes; no .gitattributes -> ~1,242 files of CRLF churn; sync-branches.sh is an unreferenced force-push-all tool.

* **Pillar:** Delivery and continuity
* **Severity:** Low
* **Type:** Observation
* **Objects:** 27 local branches incl. broken/* repair/*, scripts/sync-branches.sh, missing .gitattributes
* **Basis:** hygiene criteria
* **Criterion:** DLY-HYGIENE - stale branch museum, EOL churn, unreferenced force-push tool
* **Deviation character:** Deliberate keep-everything posture
* **Impact:** history and status noise; the CRLF churn portion was resolved during this audit (.gitattributes added, index renormalized)
* **Method:** git census and script inspection
* **Assessment confidence:** High
* **Mitigating factors:** churn resolved in-tree pending commit; museum is documented posture
* **Evidence:** [EVD-031](#evidence-list), [EVD-033](#evidence-list), [EVD-037](#evidence-list) Verified
* **Recommendation:** See [REC-006](#rec-006-add-gitattributes-textauto-to-end-crlf-churn-prune-or-document-the-stale-branch-museum-remove-or-guard-sync-branchessh)

### FND-DLV-002: Single-author continuity

782/782 commits by one author; no CI or delegate gate; deliberate but concentrated.

* **Pillar:** Delivery and continuity
* **Severity:** Low
* **Type:** Observation
* **Objects:** git history, README posture
* **Basis:** continuity criteria
* **Criterion:** DLY-BUSFACTOR - single author, 100% top-author share
* **Deviation character:** Deliberate - single-maintainer project
* **Impact:** continuity, review, and release knowledge rest on one identity
* **Method:** git shortlog census
* **Assessment confidence:** High
* **Mitigating factors:** deep in-tree documentation trail
* **Evidence:** [EVD-020](#evidence-list), [EVD-025](#evidence-list) Verified
* **Recommendation:** no dedicated action - tracked in the debt register or resolved by existing work items

### FND-STD-002: Changelog tense drift

VERSIONING.md:121 prescribes past tense; recent entries consistently written present tense.

* **Pillar:** Standards and documentation
* **Severity:** Low
* **Type:** Defect
* **Objects:** public/CHANGELOG.md recent entries vs docs/VERSIONING.md:121
* **Basis:** documentation-sync criteria
* **Criterion:** DOC-SYNC - tense drift from the recorded rule
* **Deviation character:** None recorded
* **Impact:** recent entries consistently use present tense where the rule prescribes past
* **Method:** rule-vs-entries comparison
* **Assessment confidence:** High
* **Mitigating factors:** consistent within recent entries; likely deliberate drift
* **Evidence:** [EVD-021](#evidence-list) Verified
* **Recommendation:** See [REC-008](#rec-008-refresh-testingmd-pathenvironment-enumerations-add-direct-coverage-for-ayumiworklet-and-thin-constantscriptelectron-areas)

### FND-DOC-001: TESTING.md stale enumerations

cites test/modals/MidiModal.test.tsx (actual test/modals/midi/MidiModal.test.tsx); node-environment list incomplete; test/guard/ and test/scripts/ omitted from directory lists.

* **Pillar:** Documentation
* **Severity:** Low
* **Type:** Defect
* **Objects:** docs/TESTING.md enumerations vs test/ census
* **Basis:** documentation-sync criteria
* **Criterion:** DOC-SYNC - stale paths and environment lists
* **Deviation character:** None recorded
* **Impact:** guides cite moved paths and omit test directories
* **Method:** doc-vs-tree comparison
* **Assessment confidence:** High
* **Mitigating factors:** core testing guidance remains accurate
* **Evidence:** [EVD-029](#evidence-list) Verified
* **Recommendation:** See [REC-008](#rec-008-refresh-testingmd-pathenvironment-enumerations-add-direct-coverage-for-ayumiworklet-and-thin-constantscriptelectron-areas)

### FND-PRF-001: Audio quality targets not machine-verified

N-01/QT-01 zero-glitch claim rests on design evidence only; no automated audible or latency measurement in-tree.

* **Pillar:** Scalability and performance
* **Severity:** Low
* **Type:** Observation
* **Objects:** src/workers/sequencerWorklet.ts, docs/ARCHITECTURE.md:41-43
* **Basis:** measurement criteria
* **Criterion:** PRF-MEASURE - N-01/QT-01 rest on design evidence
* **Deviation character:** None recorded
* **Impact:** the zero-glitch claim is not machine-verified
* **Method:** doc and code inspection
* **Assessment confidence:** High
* **Mitigating factors:** a measurement work item exists in docs/change/1.8.0/
* **Evidence:** [EVD-022](#evidence-list), [EVD-039](#evidence-list) Verified
* **Recommendation:** no dedicated action - tracked in the debt register or resolved by existing work items

### FND-PRF-002: Load-time target unmeasured

QT-03 <2s load has no in-tree measurement or perf gate.

* **Pillar:** Scalability and performance
* **Severity:** Low
* **Type:** Observation
* **Objects:** QT-03 load target
* **Basis:** measurement criteria
* **Criterion:** PRF-MEASURE - the <2s load target is unmeasured
* **Deviation character:** None recorded
* **Impact:** no in-tree timing for the load claim
* **Method:** artifact inspection
* **Assessment confidence:** High
* **Mitigating factors:** lazy chunks and the 600 kB cap bound the entry weight
* **Evidence:** [EVD-003](#evidence-list) Verified
* **Recommendation:** no dedicated action - tracked in the debt register or resolved by existing work items

## Technical debt register

| Debt | Title | Category | Cost | Status |
| --- | --- | --- | --- | --- |
| [TDR-001](#tdr-001-duplicated-live-offline-logic) | Duplicated live/offline logic | Maintainability | Medium | Open |
| [TDR-002](#tdr-002-composition-root-concentration) | Composition-root concentration | Maintainability | Medium | Open |
| [TDR-003](#tdr-003-stale-branch-museum) | Stale branch museum | Delivery | Low | Open |

### TDR-001: Duplicated live/offline logic

The tick/envelope and instrument-register translation exist twice (live vs export simulation).

* **Category:** Maintainability
* **Source:** [FND-ARC-001](#fnd-arc-001-dual-liveoffline-implementations-risk-drift)
* **Cost:** Medium - shared contract extraction or parity tests
* **Status:** Open

### TDR-002: Composition-root concentration

App.tsx 1,177 lines / App.css ~4,330 - documented trade-off, decomposition in progress.

* **Category:** Maintainability
* **Source:** [FND-ARC-003](#fnd-arc-003-composition-root-concentration)
* **Cost:** Medium - the in-flight hook extraction continues
* **Status:** Open

### TDR-003: Stale branch museum

27 local branches including broken/* and repair/* pushed to both remotes.

* **Category:** Delivery
* **Source:** [FND-DLV-001](#fnd-dlv-001-repository-hygiene-debt)
* **Cost:** Low - prune or document; churn portion already resolved
* **Status:** Open

## Unified risk register

| Risk | Description | Source | Impact | Likelihood | Severity | Mitigation |
| --- | --- | --- | --- | --- | --- | --- |
| [RSK-001](#rsk-001-coverage-gate-loses-signal) | Coverage gate loses signal | [FND-TST-001](#fnd-tst-001-coverage-gate-currently-red) | a real regression hides inside flake noise | Medium | Medium | See recommendation |
| [RSK-002](#rsk-002-liveoffline-drift) | Live/offline drift | [FND-ARC-001](#fnd-arc-001-dual-liveoffline-implementations-risk-drift) | live vs export output diverges silently | Medium | Medium | See recommendation |
| [RSK-003](#rsk-003-single-maintainer-continuity) | Single-maintainer continuity | [FND-DLV-002](#fnd-dlv-002-single-author-continuity) | release and review knowledge lost with one person | Low | Medium | See recommendation |
| [RSK-004](#rsk-004-malformed-state-restore) | Malformed state restore | [FND-SEC-002](#fnd-sec-002-storage-restore-paths-bypass-full-validation) | malformed state restores into the session | Low | Medium | See recommendation |

### RSK-001: Coverage gate loses signal

Coverage gate loses signal value: flakes normalize red runs and the branch threshold sits 0.37pp below target; a real regression could hide in noise.

* **Severity:** Medium
* **Likelihood:** Medium
* **Residual risk:** Medium
* **Impact:** a real regression hides inside flake noise
* **Trigger:** coverage instrumentation load
* **Controls:** documented flake note
* **Closure:** green coverage run
* **Source:** [FND-TST-001](#fnd-tst-001-coverage-gate-currently-red)
* **Assessment confidence:** High
* **Mitigation:** See [REC-001](#rec-001-restore-the-coverage-gate-isolate-or-raise-timeouts-for-the-two-timing-sensitive-suites-and-add-04pp-of-branch-tests-so-80-holds-under-instrumentation)

### RSK-002: Live/offline drift

Live playback and export simulation drift apart because the tick/envelope/register logic is implemented twice without a shared contract.

* **Severity:** Medium
* **Likelihood:** Medium
* **Residual risk:** Medium
* **Impact:** live vs export output diverges silently
* **Trigger:** behavior change on one path only
* **Controls:** byte-verified export tests today
* **Closure:** shared logic or parity contract
* **Source:** [FND-ARC-001](#fnd-arc-001-dual-liveoffline-implementations-risk-drift)
* **Assessment confidence:** High
* **Mitigation:** See [REC-003](#rec-003-close-the-liveoffline-drift-surface-extract-shared-tickenvelope-logic-or-add-contract-tests-asserting-playbacksimulation-parity-with-usesequencerintegration)

### RSK-003: Single-maintainer continuity

Single-maintainer continuity: all 782 commits by one author; bus factor 1 with no delegation or automation safety net.

* **Severity:** Medium
* **Likelihood:** Low
* **Residual risk:** Medium
* **Impact:** release and review knowledge lost with one person
* **Trigger:** maintainer unavailability
* **Controls:** recorded posture, deep doc trail
* **Closure:** committed handover or second author
* **Source:** [FND-DLV-002](#fnd-dlv-002-single-author-continuity)
* **Assessment confidence:** High

### RSK-004: Malformed state restore

A corrupted or tampered localStorage/IndexedDB snapshot could restore malformed song state past the partial normalization.

* **Severity:** Medium
* **Likelihood:** Low
* **Residual risk:** Medium
* **Impact:** malformed state restores into the session
* **Trigger:** corrupted or tampered storage snapshot
* **Controls:** array-shape guard, empty-history fallback
* **Closure:** parser-level restore validation
* **Source:** [FND-SEC-002](#fnd-sec-002-storage-restore-paths-bypass-full-validation)
* **Assessment confidence:** High
* **Mitigation:** See [REC-004](#rec-004-route-storage-restores-through-the-song-parsers-validation-re-apply-the-undo-bound-and-shape-checks-on-restored-history-validate-the-midi-config-version-field)

## Remediation actions

| Action | Priority | Finding | Effort | Description |
| --- | --- | --- | --- | --- |
| [REC-001](#rec-001-restore-the-coverage-gate-isolate-or-raise-timeouts-for-the-two-timing-sensitive-suites-and-add-04pp-of-branch-tests-so-80-holds-under-instrumentation) | HIGH | FND-TST-001 | small | Restore the coverage gate: isolate or raise timeouts for the two timing-sensitive suites and add ~0.4pp of branch tests so 80% holds under instrumentation |
| [REC-002](#rec-002-assert-maximportbytes-before-parsing-on-the-instrument-path-same-order-as-songsettings-imports) | HIGH | FND-SEC-001 | trivial | Assert MAX_IMPORT_BYTES before parsing on the instrument path (same order as song/settings imports) |
| [REC-003](#rec-003-close-the-liveoffline-drift-surface-extract-shared-tickenvelope-logic-or-add-contract-tests-asserting-playbacksimulation-parity-with-usesequencerintegration) | MEDIUM | FND-ARC-001 | medium | Close the live/offline drift surface: extract shared tick/envelope logic or add contract tests asserting playbackSimulation parity with useSequencerIntegration |
| [REC-004](#rec-004-route-storage-restores-through-the-song-parsers-validation-re-apply-the-undo-bound-and-shape-checks-on-restored-history-validate-the-midi-config-version-field) | MEDIUM | FND-SEC-002 | medium | Route storage restores through the song parser's validation; re-apply the undo bound and shape checks on restored history; validate the MIDI config version field |
| [REC-005](#rec-005-root-cause-the-two-webkit-playback-e2e-failures-headless-audio-context-start-mark-environment-expected-or-fix-initialization) | MEDIUM | FND-TST-002 | medium | Root-cause the two WebKit playback e2e failures (headless audio-context start); mark environment-expected or fix initialization |
| [REC-006](#rec-006-add-gitattributes-textauto-to-end-crlf-churn-prune-or-document-the-stale-branch-museum-remove-or-guard-sync-branchessh) | LOW | FND-DLV-001 | small | Add .gitattributes (text=auto) to end CRLF churn; prune or document the stale branch museum; remove or guard sync-branches.sh |
| [REC-007](#rec-007-set-electron-sandbox-explicitly-with-a-comment-add-response-status-check-to-service-worker-caching-document-hosttrue-as-dev-only) | LOW | FND-SEC-003 | small | Set Electron sandbox explicitly with a comment; add response-status check to service-worker caching; document host:true as dev-only |
| [REC-008](#rec-008-refresh-testingmd-pathenvironment-enumerations-add-direct-coverage-for-ayumiworklet-and-thin-constantscriptelectron-areas) | LOW | FND-DOC-001 | small | Refresh TESTING.md path/environment enumerations; add direct coverage for ayumiWorklet and thin constant/script/electron areas |

### REC-001: Restore the coverage gate: isolate or raise timeouts for the two timing-sensitive suites and add ~0.4pp of branch tests so 80% holds under instrumentation

Restore the coverage gate: isolate or raise timeouts for the two timing-sensitive suites and add ~0.4pp of branch tests so 80% holds under instrumentation.

* **Priority:** HIGH
* **Effort:** small
* **Addresses:** [FND-TST-001](#fnd-tst-001-coverage-gate-currently-red)

### REC-002: Assert MAX_IMPORT_BYTES before parsing on the instrument path (same order as song/settings imports)

Assert MAX_IMPORT_BYTES before parsing on the instrument path (same order as song/settings imports).

* **Priority:** HIGH
* **Effort:** trivial
* **Addresses:** [FND-SEC-001](#fnd-sec-001-instrument-import-parses-yaml-before-size-gate)

### REC-003: Close the live/offline drift surface: extract shared tick/envelope logic or add contract tests asserting playbackSimulation parity with useSequencerIntegration

Close the live/offline drift surface: extract shared tick/envelope logic or add contract tests asserting playbackSimulation parity with useSequencerIntegration.

* **Priority:** MEDIUM
* **Effort:** medium
* **Addresses:** [FND-ARC-001](#fnd-arc-001-dual-liveoffline-implementations-risk-drift)

### REC-004: Route storage restores through the song parser's validation; re-apply the undo bound and shape checks on restored history; validate the MIDI config version field

Route storage restores through the song parser's validation; re-apply the undo bound and shape checks on restored history; validate the MIDI config version field.

* **Priority:** MEDIUM
* **Effort:** medium
* **Addresses:** [FND-SEC-002](#fnd-sec-002-storage-restore-paths-bypass-full-validation)

### REC-005: Root-cause the two WebKit playback e2e failures (headless audio-context start); mark environment-expected or fix initialization

Root-cause the two WebKit playback e2e failures (headless audio-context start); mark environment-expected or fix initialization.

* **Priority:** MEDIUM
* **Effort:** medium
* **Addresses:** [FND-TST-002](#fnd-tst-002-reproducible-webkit-e2e-playback-failures)

### REC-006: Add .gitattributes (text=auto) to end CRLF churn; prune or document the stale branch museum; remove or guard sync-branches.sh

Add .gitattributes (text=auto) to end CRLF churn; prune or document the stale branch museum; remove or guard sync-branches.sh.

* **Priority:** LOW
* **Effort:** small
* **Addresses:** [FND-DLV-001](#fnd-dlv-001-repository-hygiene-debt)

### REC-007: Set Electron sandbox explicitly with a comment; add response-status check to service-worker caching; document host:true as dev-only

Set Electron sandbox explicitly with a comment; add response-status check to service-worker caching; document host:true as dev-only.

* **Priority:** LOW
* **Effort:** small
* **Addresses:** [FND-SEC-003](#fnd-sec-003-residual-hardening-gaps)

### REC-008: Refresh TESTING.md path/environment enumerations; add direct coverage for ayumiWorklet and thin constant/script/electron areas

Refresh TESTING.md path/environment enumerations; add direct coverage for ayumiWorklet and thin constant/script/electron areas.

* **Priority:** LOW
* **Effort:** small
* **Addresses:** [FND-DOC-001](#fnd-doc-001-testingmd-stale-enumerations)

## Exclusions and limitations

- mutating commands not run (format, bump, retention, clean.sh, sync-branches.sh)
- interactive/subject-running commands not run (dev, preview, electron:dev, electron:preview, test:ui)
- docs/archive read only for named baseline files per project scope rules
- audited working tree never built/tested/linted directly - isolation copy only
- no secrets, CI systems, or live deployments exercised

Additional scope notes: audible output, on-target hardware equivalence of the assembly stream, and the <2 s load target are not machine-verified in-tree and are labelled evidence gaps. `docs/archive` was read only for named baseline files; the prior report (AUDIT-1.6, 8.8/10) informed parity only.

## Readiness

State: `READY` with recorded conditions.

Basis: the declared verification loop executes green at every executed stage except the coverage gate; packaging and the release gate pass; no critical or high finding is open; all product requirements are implemented and tested.

Conditions attached to this readiness call: restore the coverage gate to green (`REC-001`), re-order the instrument-import size check (`REC-002`), and root-cause the two WebKit playback failures (`REC-005`).

## Closing

`dosound-tracker` 1.6.7 is a well-governed, well-tested, security-conscious application whose weaknesses sit at the edges - a red coverage gate, validation asymmetries on secondary input paths, duplicated live/offline logic, and single-author operational concentration - rather than in its core. The headline 8.6/10 reflects an excellent product over a process surface that now needs gate repair more than new features.

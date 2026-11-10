# dosound-tracker - Lens audit report

## Document Information

|                    |                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Report Revision    | 1.2                                                                                                |
| Report Date        | 2026-10-24                                                                                         |
| Report Style       | audit                                                                                              |
| Detail Level       | Detailed                                                                                           |
| Evaluation Scale   | 1-10                                                                                               |
| Language           | English                                                                                            |
| Audit Purpose      | engineering improvement                                                                            |
| Target Environment | Desktop application via Electron, browser single-page application on static hosting, Web Audio API |
| Verification Scope | static repository analysis (code, configuration, documentation, git history) - no execution        |
| Evidence Mode      | source-only                                                                                        |
| Subject Revision   | `a364b06af648f1e6576656f43e84f5db11179b29` (main, clean)                                           |
| Skill Version      | 2.4.2                                                                                              |
| Time taken         | 11:30                                                                                              |

## Audit Type Coverage

| Report type                                       | Status    | Rationale                                                                                            |
| ------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| Software Architecture Review                      | Covered   | Structure, layering, state domains, and data flow inspected from source and documents                |
| Code Quality Audit                                | Covered   | Source files, configuration, tests, and documented standards inspected                               |
| Security Vulnerability Assessment                 | Covered   | Electron boundary, [HTML](#glossary) rendering sinks, file parsing, and permission handling assessed |
| Open Source License Compliance Review             | Covered   | License file, policy document, ported-component attribution, and lockfile fields inspected           |
| Penetration Test                                  | Not done  | Source-only audit, live exploitation is a separately commissioned engagement                         |
| Performance Audit                                 | Partially | Timing design and stated targets inspected, no load or latency measurement performed                 |
| Cloud Infrastructure Audit                        | Partially | Static hosting guidance and packaging configuration inspected, no live environment available         |
| Technical Due Diligence                           | Partially | Engineering and delivery dimensions covered, business inputs not supplied                            |
| [SBOM](#glossary) / Software Composition Analysis | Covered   | Manifest-derived inventory produced from `package.json` and `package-lock.json`                      |
| [ISO/IEC](#glossary) 27001 Certification          | Not done  | The standard is not assessed, no certification claim is made                                         |
| [SOC](#glossary) 2 Attestation Examination        | Not done  | The framework is not assessed, no attestation claim is made                                          |

## Glossary

| Term                                     | Definition                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| ADR                                      | Architecture Decision Record, a recorded design decision                 |
| AI                                       | Artificial Intelligence                                                  |
| API                                      | Application Programming Interface                                        |
| ASVS                                     | OWASP Application Security Verification Standard                         |
| BSD                                      | Berkeley Software Distribution license family                            |
| CI                                       | Continuous Integration                                                   |
| CI/CD                                    | Continuous Integration and Continuous Delivery or Deployment             |
| CISQ                                     | Consortium for Information and Software Quality                          |
| CSP                                      | Content Security Policy                                                  |
| CVSS                                     | Common Vulnerability Scoring System                                      |
| CWE                                      | Common Weakness Enumeration                                              |
| DFD                                      | Data Flow Diagram                                                        |
| DOM                                      | Document Object Model                                                    |
| DORA                                     | DevOps Research and Assessment                                           |
| E2E                                      | End-to-End testing                                                       |
| [EVD](#evd-evidence-identifier)          | Evidence identifier used by this report                                  |
| [FND](#fnd-finding-identifier)           | Finding identifier, pillar-prefixed                                      |
| GPL                                      | GNU General Public License, the copyleft class the project policy bars   |
| HTML                                     | HyperText Markup Language                                                |
| IPC                                      | Inter-Process Communication                                              |
| ISC                                      | Internet Software Consortium license name                                |
| ISO                                      | International Organization for Standardization                           |
| JSON                                     | JavaScript Object Notation                                               |
| MIDI                                     | Musical Instrument Digital Interface                                     |
| MIT                                      | Massachusetts Institute of Technology license family                     |
| N/A                                      | Not applicable status token                                              |
| NFR                                      | Non-Functional Requirement                                               |
| NIST                                     | National Institute of Standards and Technology                           |
| OWASP                                    | Open Worldwide Application Security Project                              |
| P1-P4                                    | Recommendation priorities, P1 highest to P4 lowest                       |
| [PAR](#par-validation-record-identifier) | Validation Record checklist identifier                                   |
| PSG                                      | Programmable Sound Generator, the sound-chip class the project emulates  |
| PWA                                      | Progressive Web Application                                              |
| [REC](#rec-recommendation-identifier)    | Remediation roadmap identifier                                           |
| RPO                                      | Recovery Point Objective                                                 |
| [RSK](#rsk-risk-identifier)              | Unified Risk Register identifier                                         |
| RTO                                      | Recovery Time Objective                                                  |
| SBOM                                     | Software Bill of Materials                                               |
| SDLC                                     | Software Development Life Cycle                                          |
| SLO                                      | Service Level Objective                                                  |
| SOC                                      | System and Organization Controls                                         |
| SPA                                      | Single-Page Application                                                  |
| SPDX                                     | Software Package Data Exchange license identifier format                 |
| STRIDE                                   | Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation |
| [TDR](#tdr-debt-identifier)              | Technical Debt Register identifier                                       |
| UI                                       | User Interface                                                           |
| URL                                      | Uniform Resource Locator                                                 |
| VGM                                      | Video Game Music sound-logging file format                               |
| WAV                                      | Waveform Audio File Format                                               |
| WTFPL                                    | Permissive public-domain-equivalent license                              |
| XBIOS                                    | Extended BIOS, the Atari ST low-level system interface                   |
| YAML                                     | YAML Ain't Markup Language                                               |
| YM2149                                   | The Yamaha sound-chip model the project emulates                         |
| ZX0                                      | The compression format and algorithm family used by the MAX exporter     |

**Identifier triplets**

| Triplet | Scope     | Description                                                    |
| ------- | --------- | -------------------------------------------------------------- |
| FND     | Findings  | Detailed Technical Findings identifier prefix (`FND-SEC-001`)  |
| EVD     | Evidence  | Verification And Evidence Ledger identifier prefix (`EVD-001`) |
| TDR     | Debt      | Technical Debt Register identifier prefix (`TDR-001`)          |
| RSK     | Risks     | Unified Risk Register identifier prefix (`RSK-001`)            |
| REC     | Roadmap   | Actionable Remediation Roadmap identifier prefix (`REC-001`)   |
| PAR     | Checklist | Validation Record checklist identifier (`PAR-1`)               |
| ARC     | Criteria  | Architecture criteria and `FND-ARC-NNN` findings               |
| CQY     | Criteria  | Code Quality criteria and `FND-CQY-NNN` findings               |
| SEC     | Criteria  | Security criteria and `FND-SEC-NNN` findings                   |
| INF     | Criteria  | Infrastructure criteria and `FND-INF-NNN` findings             |
| AIP     | Criteria  | AI Provenance criteria and `FND-AIP-NNN` findings              |
| CPR     | Criteria  | Copyrights criteria and `FND-CPR-NNN` findings                 |
| STR     | Criteria  | Structure criteria and `FND-STR-NNN` findings                  |
| DLY     | Criteria  | Delivery practice and continuity criteria                      |
| TST     | Criteria  | Testing and pipeline coverage criteria                         |
| MNT     | Criteria  | Maintainability and documentation-sync criteria                |
| STY     | Criteria  | In-code naming, style, readability criteria                    |
| DEP     | Criteria  | Dependencies and delivery pipeline criteria                    |
| REL     | Criteria  | Reliability and data-integrity criteria                        |
| FNC     | Criteria  | Functional completeness and correctness criteria               |

### EVD (Evidence identifier)

The ledger row identifier used throughout this report, one row per material observation or unrun check.

### FND (Finding identifier)

The pillar-prefixed finding identifier, where the middle token names the finding pillar.

### PAR (Validation Record identifier)

The checklist row identifier in the Validation Record, `PAR-1` through `PAR-27` plus consistency rows.

### REC (Recommendation identifier)

The roadmap identifier, one per remediation action, each resolving a defined `FND` entry.

### RSK (Risk identifier)

The Unified Risk Register identifier, each tracing to one source `FND` entry.

### TDR (Debt identifier)

The Technical Debt Register identifier, recording cost already present rather than future risk.

## Executive Summary

`1-10` scale: `1-3 Poor · 4-6 Average · 7-8 Good · 9-10 Excellent`

| Field          | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| System type    | codebase                                                                                    |
| Scope          | Full source tree, configuration, documentation, tests, git history of dosound-tracker 1.2.9 |
| Source basis   | inspected code, configuration, documentation, and Git history                               |
| Maturity level | Pre-production                                                                              |
| Overall score  | 6.0/10 (Average)                                                                            |

Lowest-scoring dimensions: Testability 4/10, Delivery & Continuity 4/10.

DOSOUND Tracker is a browser and desktop chiptune tracker that emulates the [YM2149](#glossary) sound chip and
exports songs to Atari ST assembly, [VGM](#glossary), [WAV](#glossary), and a compressed MAX binary format.

The codebase shows disciplined engineering: strict TypeScript with zero `any` usage, typed linting,
a documented verification loop, a layered export pipeline, a dedicated sequencer Web Worker for
audio timing, and an unusually thorough documentation corpus.

The dominant gaps are verification depth and delivery infrastructure: the 80 percent coverage gate
is self-documented as failing, no continuous-integration automation exists, the configured
end-to-end suite is empty, and no git tags or release anchors exist in the repository.

One contributor accounts for all 713 commits on the audited branch, giving a `High`
contributor-concentration rating.

This report covers the engineering audit types.

No penetration test or compliance certification was performed.

License classification found no copyleft conflict: all declared dependency licenses are
permissive-class, and 219 of 592 resolved components carry no declared license in the lockfile.

**Coverage and risk flags**

Thirteen risks were registered.

None rates CRITICAL or HIGH on the residual scale.

Six rate MEDIUM, two of them carrying HIGH impact at LOW likelihood (single-maintainer
concentration, markdown-injection surface).

The audit found no CRITICAL findings and one HIGH-severity non-security finding (orchestrator
concentration).

**Production Readiness Threshold**

`Production-ready` would require the documented verification loop to pass with current evidence:
`npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` green on the audited revision,
`npm run test:coverage` meeting the 80 percent thresholds declared in `vitest.config.ts`, the
stale-asset delivery defect behind [RSK-002](#rsk-002-redeploys-serve-stale-or-skewed-web-assets) closed with a verified fix, and the song-persistence
durability gap behind [RSK-013](#rsk-013-song-data-lost-on-storage-eviction-or-profile-reset) addressed or accepted.

No stakeholder-approved acceptance criteria were supplied, so the proposed gates above are the
audit's reconstruction from the project's own documents and remain unconfirmed by the owner.

Readiness state: `Pending evidence` - every documented check exists but none was executed under
this audit, and the project's own `TESTING.md` states the coverage command currently fails.

Production sign-off is pending: verification ownership is `NOT SPECIFIED` and closure evidence
does not exist.

**Readiness Cost**

`INSUFFICIENT INFORMATION` - no effort estimates, staffing, or rate inputs were supplied.

The roadmap expresses remediation size as High/Medium/Low effort bands only.

The largest known work items are closing the documented coverage gap ([REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths)), standing up a
continuous-integration gate ([REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop)), and decomposing the 2640-line central orchestrator
([REC-007](#rec-007-stage-the-orchestrator-decomposition)).

## System Context

DOSOUND Tracker is a chiptune music editor for the AY/YM sound chip family (YM2149 PSG) used in
the Atari ST.

It runs as a React 19 single-page application bundled with rolldown-vite and ships as a desktop
application through Electron 42.

The product targets retro-computing composers and exports songs into the DOSOUND assembly format
of the Atari ST XBIOS subsystem, plus [VGM](#glossary), [WAV](#glossary), binary dump, and the project's own compressed MAX
format.

### Technology Stack

| Layer           | Technology                                                                         |
| --------------- | ---------------------------------------------------------------------------------- |
| Language        | TypeScript 5.9 strict mode, two CommonJS Electron entry files                      |
| [UI](#glossary) | React 19 functional components, Zustand 4 single store, plain CSS                  |
| Audio           | Custom YM2149 emulator on Web Audio API, 50 Hz sequencer Web Worker                |
| Data formats    | [YAML](#glossary) songs via js-yaml, localStorage persistence, MAX/VGM/WAV/ASM/BIN |
| Desktop shell   | Electron 42, context isolation on, node integration off, narrow [IPC](#glossary)   |
| Build           | rolldown-vite 7 (npm override substituting `vite`), electron-builder               |
| Test            | Vitest 4 + jsdom + Testing Library, Playwright configured, 258 cases               |
| Tooling         | ESLint 9 flat config, Prettier 3, `tsc -b`, service worker offline                 |

### Renderer And Orchestration

`src/App.tsx` is the single orchestrator: 2640 lines of state, wiring, and layout.

Twenty-seven presentational components render panels and modals, and thirty-two hooks carry the
behavior surface - data management, playback, [MIDI](#glossary), keyboard, modals, file operations, and
sequencer integration.

### Audio Engine

`src/synth/` holds the [YM2149](#glossary) register-level emulator, the `SoundDriver` event generator, the
`SequencerEngine`, and the `EventOptimizer`.

`src/workers/sequencerWorker.ts` runs the 50 Hz VBLANK timer off the render thread, and
audio-rate state lives in refs by design to keep React renders out of the timing path.

### Export Pipeline

`src/exports/core.ts` normalizes song data, and per-format modules (`asm`, `bin`, `max`, `vgm`,
`wav`) produce the target representation, including a ZX0-compressed MAX stream.

### Desktop Shell

`electron/main.cjs` creates one `BrowserWindow` with `contextIsolation: true` and
`nodeIntegration: false`, and `electron/preload.cjs` exposes a narrow close-flow and
runtime-info bridge.

### Persistence And Content

Song and instrument state auto-persist to `localStorage` under keys declared in
`src/utils/storageKeys.ts`.

`public/MESSAGES.md` supplies rotating editor tips, `public/repository/` ships bundled song and
instrument content, and `public/MANUAL.md` is the composer manual.

## Software Bill of Materials

This is a manifest-derived component inventory at the audited revision, not a shipped-artifact
[SBOM](#glossary) and not a claim of [SPDX](#glossary) or CycloneDX conformance.

| Component                         | Version | Ecosystem | Relationship | License          | License Risk | Advisory Checked | Source File                     |
| --------------------------------- | ------- | --------- | ------------ | ---------------- | ------------ | ---------------- | ------------------------------- |
| js-yaml                           | 4.x     | npm       | direct       | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| lucide-react                      | 0.460.x | npm       | direct       | [ISC](#glossary) | None flagged | N                | package.json, package-lock.json |
| react                             | 19.x    | npm       | direct       | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| react-dom                         | 19.x    | npm       | direct       | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| zustand                           | 4.x     | npm       | direct       | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| electron                          | 42.x    | npm       | dev          | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| electron-builder                  | 26.x    | npm       | dev          | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| vite (rolldown-vite substitution) | 7.2.2   | npm       | dev          | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| typescript                        | 5.9.x   | npm       | dev          | Apache-2.0       | None flagged | N                | package.json, package-lock.json |
| eslint + typescript-eslint        | 9.x/8.x | npm       | dev          | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| vitest + coverage-v8              | 4.x     | npm       | dev          | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| @playwright/test                  | 1.48.x  | npm       | dev          | Apache-2.0       | None flagged | N                | package.json, package-lock.json |
| transitive (578 packages)         | various | npm       | transitive   | See below        | See below    | N                | package-lock.json               |

The lockfile resolves 592 packages: 270 [MIT](#glossary), 41 [ISC](#glossary), 21 BSD-3-Clause, 15 Apache-2.0, 8
BSD-2-Clause, 2 MIT-0, and single instances of CC-BY-4.0, CC0-1.0, [WTFPL](#glossary), and WTFPL OR dual
variants, with 219 packages carrying no license field ([EVD-007](#verification-and-evidence-ledger)).

Nine packages resolve under BlueOak-1.0.0, a permissive class outside the project's declared
whitelist, and the undeclared set is recorded as `Unknown` ([FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set)).

No advisory report is committed, so every `Advisory Checked` cell is `N` and vulnerability
status is `UNKNOWN` ([EVD-023](#verification-and-evidence-ledger)).

## License Compliance Review

The project is MIT-licensed (`LICENSE` at root, [MIT](#glossary) declared in `package.json`).

The policy in `docs/COPYRIGHTS.md` permits [MIT](#glossary), Apache-2.0, BSD-2-Clause, BSD-3-Clause, [ISC](#glossary), and
Boost, and bars [GPL](#glossary).

The resolved license set is permissive-class throughout: no [GPL](#glossary), AGPL, LGPL, SSPL, or other
copyleft class appears in the lockfile census.

The observed classes exceed the policy whitelist in five names - BlueOak-1.0.0 (9 packages),
CC-BY-4.0, CC0-1.0, [WTFPL](#glossary), and MIT-0 - which are permissive but not whitelisted, recorded as
[FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set).

The 219 undeclared-license packages are mostly transitive development tooling and are recorded
`Unknown`, also inside [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set).

The [ZX0](#glossary) compressor in `src/utils/zx0.ts` is a BSD-3-Clause port of Einar Saukas's Salvador
implementation with in-file attribution, but `docs/COPYRIGHTS.md` does not carry the attribution
required by the project's own third-party rule, recorded as [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file).

No vendored dependency directories exist in the tree, `node_modules` is untracked, and no
`NOTICE` or `THIRD_PARTY` inventory exists, so redistribution relies on the lockfile alone.

## Health Dashboard

| Severity | Count | Identifiers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH     | 0     | none on the residual scale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| MEDIUM   | 6     | [RSK-001](#rsk-001-regressions-merge-undetected-without-ci-enforcement), [RSK-002](#rsk-002-redeploys-serve-stale-or-skewed-web-assets), [RSK-003](#rsk-003-maintainer-unavailability-halts-all-delivery), [RSK-004](#rsk-004-orchestrator-growth-compounds-change-defects), [RSK-005](#rsk-005-injected-markup-renders-through-the-markdown-sinks), [RSK-006](#rsk-006-ui-regressions-reach-releases-without-e2e-checks)                                                                                        |
| LOW      | 7     | [RSK-007](#rsk-007-license-policy-non-conformance-surfaces-late), [RSK-008](#rsk-008-dead-test-file-implies-coverage-that-does-not-run), [RSK-009](#rsk-009-tampered-or-mismatched-binaries-reach-users-unverified), [RSK-010](#rsk-010-stale-documented-figures-mislead-change-planning), [RSK-011](#rsk-011-device-permission-granted-beyond-the-intended-origin), [RSK-012](#rsk-012-undisclosed-generated-code-lands-without-trace), [RSK-013](#rsk-013-song-data-lost-on-storage-eviction-or-profile-reset) |

[RSK-003](#rsk-003-maintainer-unavailability-halts-all-delivery) and [RSK-005](#rsk-005-injected-markup-renders-through-the-markdown-sinks) carry `HIGH` impact with `LOW` likelihood, landing at `MEDIUM` residual.

| Area                   | Rating   | Key evidence                                                                                                                   |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Documentation          | Strong   | 12-file source-of-truth corpus plus per-version change, plan, and refactoring records                                          |
| Test suite             | Weak     | 50 test files and ~258 cases, coverage gate documented failing, [E2E](#glossary) directory empty, one dead file                |
| Security posture       | Adequate | Electron isolation flags set, narrow [IPC](#glossary), two [HTML](#glossary) sinks, unscoped device grant, no [CSP](#glossary) |
| Build & release        | Weak     | Deterministic builds, no [CI](#glossary), no tags, unsigned installers, static cache name                                      |
| Dependency hygiene     | Moderate | Lockfile v3, permissive license set, 37 percent undeclared licenses, no advisory evidence                                      |
| Contributor continuity | Fragile  | 713/713 commits by one author, no continuity owner named                                                                       |

## Delivery Practice & Team Continuity

The repository holds 713 commits on the audited branch over 2025-11-17 to 2026-10-23, all by
one author ([EVD-002](#verification-and-evidence-ledger), [EVD-003](#verification-and-evidence-ledger)).

Commit cadence is bursty: dense activity in November-December 2025, a July 2026 cluster, and an
October 2026 cluster, with quiet intervals between.

Release anchoring is absent: `git tag -l` returns zero tags, and no release branches mark
shipped states ([EVD-004](#verification-and-evidence-ledger)).

The changelog at `public/CHANGELOG.md` records versioned entries through 1.2.9, and the
`bump-version.mjs` script automates numbering, so releases exist as artifacts but live entirely
outside the git tag namespace.

[DORA](#glossary) proxies are all `NOT SPECIFIED`: no tags, no deployment records, no incident data, and no
lead-time measurement exist to measure against.

Contributor concentration rates `High` (100 percent single-author, single point of failure on
knowledge and availability).

| Continuity element    | State                                                                   |
| --------------------- | ----------------------------------------------------------------------- |
| Contributor diversity | 100 percent single author, `High` concentration                         |
| Release anchoring     | No git tags, changelog and version script exist                         |
| Knowledge records     | Strong `docs/` corpus including per-version change and plan directories |
| [CI/CD](#glossary)    | None - no workflow files exist                                          |
| Onboarding            | README plus `docs/` set are complete and navigable                      |

## High-Level Observations

- The project's own documents form a strong governance set - a verification loop, a permitted-license list, audio-critical linting exceptions, and naming conventions are all written down - but the coverage command currently fails and no [CI](#glossary) configuration exists to run any of it ([FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop), [FND-INF-004](#fnd-inf-004-coverage-gate-is-documented-as-failing-and-unverified-in-source)).
- `src/App.tsx` at 2640 lines is the central orchestrator and concentrates composition, state, and event wiring in one file - a documented deliberate trade-off and the largest single maintenance risk ([FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk)).
- The web build ships a service worker with a fixed cache name and cache-first asset strategy, so a redeployed build may serve previous assets to returning users ([FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)).
- The configured Playwright suite is empty and one committed test file is excluded by the runner's own include glob, so the effective verification surface is thinner than the documents claim ([FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes), [FND-CQY-002](#fnd-cqy-002-no-end-to-end-specs-exist-despite-configured-playwright)).
- License hygiene is policy-consistent in class (all permissive) but not in declaration: 219 of 592 resolved packages carry no license field, and five resolved classes exceed the project's own permitted list ([FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set)).

## Auditing Methodology

This audit was produced by the Lens skill (`lens-skill`, version 2.4.2) in `source-only` evidence mode.

Source, configuration, documentation, and git history were inspected.

The subject was never built, executed, tested, deployed, or connected to any live system.

Package manifests and the lockfile were parsed mechanically for the [SBOM](#glossary) and license review.

Git history, file trees, and naming shapes were enumerated with `git` and filesystem commands as recorded in the evidence ledger below.

No external authority research was needed beyond the bundled stack digests because every partition resolved to a declared standard or a shipped baseline.

**Constraints**

- No execution: every runtime claim is `NOT RUN` or `UNKNOWN` and listed under Limitations and Unknowns.
- Restricted directories per `docs/GUIDELINES.md`: `docs/change/`, `docs/plan/`, `docs/archive/`, `docs/refactoring/`, `docs/feature/`, and `docs/prompt/` were enumerated at directory level only. Their contents were not read. `docs/report/` contents were read only to locate previous audit reports and external reports, which this workflow requires.
- `dist/`, `release/`, `node_modules/`, and `coverage/` are generated or dependency trees and are excluded from every denominator. `work/` is gitignored and holds only this audit's scratch files.

**Criteria table**

| Criterion   | Family | Applicability | Criticality | Method                                          | Sufficiency                                              |
| ----------- | ------ | ------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------- |
| ARC-COHES   | ARC    | applicable    | high        | file-size and wiring census                     | change blast radius bounded by file responsibility       |
| DLY-CONT    | DLY    | applicable    | medium      | git author census plus continuity-doc check     | delivery does not hinge on one person                    |
| TST-COV     | TST    | applicable    | high        | threshold config plus documented-gap inspection | declared coverage gate passes                            |
| TST-DEAD    | TST    | applicable    | medium      | include-glob versus tracked-file census         | every committed test artifact is collectible             |
| TST-E2E     | TST    | applicable    | high        | declared-suite directory census                 | configured e2e surface contains specs                    |
| MNT-DOC     | MNT    | applicable    | medium      | documented-figure versus measured census        | source-of-truth figures match the tree                   |
| STY-REASON  | STY    | applicable    | low         | escape-hatch census                             | non-null assertions carry `REASON:` comments             |
| STY-COMMENT | STY    | applicable    | low         | comment-pattern census                          | forbidden comment shapes are absent                      |
| STY-ALIAS   | STY    | applicable    | low         | import-shape census                             | declared import convention holds or the standard changes |
| STY-TEST    | STY    | applicable    | low         | test-name versus subject census                 | test file names identify the module they exercise        |
| SEC-INJ     | SEC    | applicable    | high        | rendering-sink and control census               | injection surface carries layered controls               |
| SEC-PERM    | SEC    | applicable    | high        | permission-handler inspection                   | device grants scope to the intended origin               |
| SEC-INPUT   | SEC    | applicable    | high        | parse-path trace                                | untrusted file input is parsed and validated before use  |
| DEP-CI      | DEP    | applicable    | high        | pipeline-file census                            | declared gates run automatically on change               |
| DEP-CACHE   | DEP    | applicable    | medium      | cache-strategy inspection                       | invalidation tracks the deployed version                 |
| DEP-SIGN    | DEP    | applicable    | low         | packaging-config inspection                     | released artifacts carry tamper evidence                 |
| REL-DURA    | REL    | applicable    | high        | persistence-path inspection                     | song data survives storage eviction and reinstall        |
| AIP-TRACE   | AIP    | applicable    | low         | metadata and documentation inspection           | provenance is attributable per change                    |
| CPR-LIC     | CPR    | applicable    | high        | lockfile license census                         | resolved classes stay inside the declared policy         |
| CPR-ATTR    | CPR    | applicable    | low         | attribution census                              | third-party code appears in the declared notice file     |

No post-freeze applicability changes occurred.

**Reference standards**

The governing baseline is the project's own documentation set: `docs/GUIDELINES.md`,
`docs/standard/ts-react-development.md`, `docs/TESTING.md`, `docs/COPYRIGHTS.md`, and
`docs/WORKFLOW.md`.

Bundled digests consulted for stack and purpose baselines: the TypeScript/React engineering
conventions and Electron desktop-security guidance under the skill's `references/stacks/` corpus
and `references/topics/` purpose digests.

Severity derives from the impact-likelihood matrix defined in the Unified Risk Register
methodology, not from [CVSS](#glossary) scoring, [CVSS](#glossary) vectors are not assigned because no runtime or
exploitation evidence exists.

### Verification And Evidence Ledger

| Evidence | Check / Source                                 | Result                                                                                   | Type        | Artifact                                               |
| -------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| EVD-001  | `git rev-parse HEAD`, `git status`             | `a364b06` on `main`, clean tree at origin tip                                            | Observation | repository root                                        |
| EVD-002  | `git shortlog -sne --all`                      | 756 commits, one author, 100 percent share                                               | Observation | git history                                            |
| EVD-003  | `git rev-list --count HEAD`                    | 713 commits on the audited branch                                                        | Observation | git history                                            |
| EVD-004  | `git tag -l`                                   | zero tags, no release anchors                                                            | Observation | git history                                            |
| EVD-005  | `scripts/scan-structure.py` census             | 478 tracked files: 147 production, 50 test, 231 doc                                      | Observation | repository tree                                        |
| EVD-006  | `package.json` read                            | version 1.2.9, 5 direct prod deps, rolldown-vite override                                | Observation | `package.json`                                         |
| EVD-007  | `package-lock.json` license census             | 592 packages, 219 undeclared, five classes outside the policy whitelist                  | Observation | `package-lock.json`                                    |
| EVD-008  | `electron/main.cjs` read                       | isolation flags set, `midi` and `midiSysex` granted to any origin                        | Observation | `electron/main.cjs`                                    |
| EVD-009  | `electron/preload.cjs` read                    | narrow `contextBridge` surface: close flow plus runtime info                             | Observation | `electron/preload.cjs`                                 |
| EVD-010  | `songParser.ts`, `validation.ts` read          | `yaml.load` then `validateSongData` structural checks on every parse                     | Observation | `src/utils/songParser.ts:143`                          |
| EVD-011  | `dangerouslySetInnerHTML` census               | 2 sinks fed by custom `renderMarkdown`: `MarkdownModal.tsx:29`, `EnvelopeSection.tsx:98` | Observation | `src/utils/markdown.ts`                                |
| EVD-012  | `vitest.config.ts` read                        | include `test/**/*.{test,spec}.{ts,tsx}`, 80 percent thresholds on all four              | Observation | `vitest.config.ts`                                     |
| EVD-013  | `e2e/` census plus `playwright.config.ts` read | directory holds only `.gitkeep`, config and `test:e2e` script exist                      | Observation | `e2e/`, `playwright.config.ts`                         |
| EVD-014  | `git ls-files test` versus include glob        | `test/utils/exportMax.test` lacks the `.ts` extension, never collected                   | Observation | `test/utils/exportMax.test`                            |
| EVD-015  | `git ls-files` OS-artifact census              | `test/.DS_Store` tracked despite the `.gitignore` entry                                  | Observation | `test/.DS_Store`                                       |
| EVD-016  | `docs/TESTING.md` read                         | `npm run test:coverage` documented as failing until thresholds are met                   | Observation | `docs/TESTING.md:233`                                  |
| EVD-017  | `tsconfig.app.json`, `eslint.config.js` read   | `strict: true`, `no-explicit-any` error, hook warnings intentional                       | Observation | `tsconfig.app.json`, `eslint.config.js`                |
| EVD-018  | `@/` alias census                              | zero alias imports, 43 relative imports inside `App.tsx` alone                           | Observation | `src/App.tsx`, `tsconfig.app.json`                     |
| EVD-019  | non-null assertion census                      | `main.tsx:5`, `zx0.ts:124`, `zx0.ts:184` lack `REASON:` comments                         | Observation | `src/main.tsx`, `src/utils/zx0.ts`                     |
| EVD-020  | comment-pattern census                         | duplicated numbered section comment at `useMidi.ts:53-54`                                | Observation | `src/hooks/useMidi.ts`                                 |
| EVD-021  | `ARCHITECTURE.md` versus `package.json`        | document states Electron 39, manifest resolves `^42.0.0`                                 | Observation | `docs/ARCHITECTURE.md`, `package.json`                 |
| EVD-022  | `public/js/sw.js` read                         | static `CACHE_NAME` `v1`, cache-first strategy for all GET assets                        | Observation | `public/js/sw.js`                                      |
| EVD-023  | verification plan                              | NOT RUN: typecheck, lint, format, build, test, coverage, e2e, `npm audit`                | Observation | `package.json` scripts                                 |
| EVD-024  | README plus fixture-name census                | [AI](#glossary) authorship declared, GPT/GROK/SWE fixture names, `docs/prompt/` logs     | Observation | `README.md`, `test/fixtures/`                          |
| EVD-025  | `zx0.ts` header versus `COPYRIGHTS.md`         | BSD-3 attribution in source header, absent from the notice file                          | Observation | `src/utils/zx0.ts`, `docs/COPYRIGHTS.md`               |
| EVD-026  | test-name census versus standard               | standard wants `PascalCase.test.ts`, test files are camelCase                            | Observation | `docs/standard/ts-react-development.md`                |
| EVD-027  | persistence census                             | song and instrument persist only to `localStorage` keys                                  | Observation | `src/utils/storageKeys.ts`, `useDataManagement.ts:127` |
| EVD-028  | test-case census                               | 258 `it(`/`test(` cases across 50 test files                                             | Observation | `test/`                                                |
| EVD-029  | README plus `DEPLOYMENT.md` read               | macOS artifacts unsigned, quarantine workaround documented                               | Observation | `README.md`, `docs/DEPLOYMENT.md`                      |
| EVD-030  | `docs/` inventory                              | 12-file source-of-truth set plus `standard/`, `template/`, `change/`, `plan/`            | Observation | `docs/`                                                |
| EVD-031  | `useMessageSystem.ts` read                     | `MESSAGES.md` fetched as text and rendered through `renderMarkdown`                      | Observation | `src/hooks/useMessageSystem.ts:22`                     |
| EVD-032  | App.tsx size census                            | 2640 lines, largest file, next largest 688 lines                                         | Observation | `src/App.tsx`                                          |

Read depth: every cited source file was fully read except where a row records a census or grep-level count, in which case the counting command is the stated method and the files were sampled.

## Scoring Rubrics

Scores use the 1-10 scale with bands `1-3 Poor`, `4-6 Average`, `7-8 Good`, `9-10 Excellent`.

Each dimension scores from its criterion outcomes weighted by criticality, with `UNKNOWN` and
`N/A` criteria excluded from the denominator.

The overall is the arithmetic mean of applicable dimensions, and the lowest-scoring applicable
dimension is always named beside it.

**[ISO/IEC](#glossary) 25010:2023 crosswalk**

This is a coverage mapping, not a conformance claim.

| [ISO](#glossary) characteristic | Audit coverage                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Functional suitability          | Parse-path and export-pipeline inspection, FNC-PARSE family                                             |
| Performance efficiency          | Timing architecture inspection only, no measurement, PRF gap named                                      |
| Compatibility                   | Format contracts ([YAML](#glossary), MAX, [VGM](#glossary), [WAV](#glossary)) and Electron IPC boundary |
| Interaction capability          | Component and navigation inspection, no usability testing                                               |
| Reliability                     | Persistence-path, worker-timing, and error-handling inspection                                          |
| Security                        | Permission handling, injection sinks, dependency census                                                 |
| Maintainability                 | Structure, style, standards, and documentation conformance                                              |
| Safety                          | Not assessed - the product carries no hazard surface                                                    |
| Portability                     | Electron packaging and web build configuration                                                          |

Unmapped or unresolved characteristics are named, not implied.

## Architectural Assessment

### What Works

The audio pipeline is deliberately engineered for timing: a dedicated Web Worker owns the 50 Hz
tick, audio-rate state lives in refs instead of React state, and the [YM2149](#glossary) emulator, event
driver, and sequencer are cleanly separated in `src/synth/` and `src/workers/`.

The export pipeline is layered: `exports/core.ts` normalizes song data once, and each format
module consumes the same normalized model, so a parser fix propagates to every format.

The Electron boundary is minimal and hardened: `contextIsolation: true`, `nodeIntegration:
false`, and a preload surface of exactly five members.

State domains are explicitly reasoned: one Zustand store for cross-panel [UI](#glossary) state, App-level
state for the song model, and hook-local refs for audio-rate data, matching the documented
three-domain decision.

### What Needs Attention

`src/App.tsx` concentrates orchestration in a single 2640-line file: 30-plus `useState` calls,
dozens of effects, and prop fan-out across every panel.

The file works, and the docs defend the trade-off, but every cross-cutting change now touches
the same hotspot, compounding review and regression risk ([FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk)).

`src/utils/` holds 46 modules and acts as a catch-all: parsing, persistence, [MIDI](#glossary) helpers,
timing, compression, formatting, and instrument logic share one bucket, weakening the
responsibility-per-directory rule the project's own standard declares.

The `@/` path alias exists in `tsconfig` and `vitest` but is unused, while deep relative
imports proliferate, so the declared import convention is dead configuration ([FND-CQY-006](#fnd-cqy-006-configured--import-alias-is-unused)).

### Design Principles

Single responsibility holds at module level and fails at file level inside `App.tsx`.

Dependency direction is sound: [UI](#glossary) depends on hooks and utils, utils depend on constants and
types, nothing in `synth/` or `exports/` reaches back into React.

The codebase deliberately relaxes React-purity rules in audio paths and documents why, which is
a principled deviation rather than drift.

### Data Flow Diagram

Trust boundaries: the Electron main/renderer [IPC](#glossary) channel, the [YAML](#glossary) file import path, the
`MESSAGES.md` fetch into [HTML](#glossary) rendering, `localStorage` persistence, the service-worker cache,
and the Web MIDI device boundary.

```
+-----------+   YAML file    +----------------+   validateSongData   +-------------+
| User file | -------------> | songParser.ts  | -------------------> | Song model  |

+-----------+                +----------------+                      +-------------+
+-----------+   fetch text   +----------------+   renderMarkdown     +-------------+
| MESSAGES  | -------------> |useMessageSystem| -------------------> | HTML sinks  |

+-----------+                +----------------+                      +-------------+
+-----------+   IPC (narrow) +----------------+                      +-------------+
| Renderer  | -------------> | preload.cjs    | -------------------> | main.cjs    |

+-----------+                +----------------+                      +-------------+
+-----------+   read/write   +----------------+                      +-------------+
| Song model| -------------> | localStorage   |                      | (no backup) |

+-----------+                +----------------+                      +-------------+
```

The [YAML](#glossary) boundary is the only unauthenticated-input path and it carries validation.

The [MIDI](#glossary) boundary grants device access to any origin in the Electron permission handler, not
to the requesting origin's identity ([FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)).

### Design Patterns

Recurring structure exists: a generic `useLocalStorageState` hook consolidates the
read/write/ignore pattern, a `logger` singleton centralizes leveled logging, an
`ErrorBoundary` class isolates render failures, and `exports/core.ts` implements a
normalize-then-format template method.

The patterns are applied consistently where they exist.

### Architecture Decision Records

`docs/ARCHITECTURE.md` carries an Architectural Decisions section recording the no-undo/redo
choice, the three-state-domain model, and the audio-critical linting exceptions.

`docs/GUIDELINES.md` adds the memorisation convention that routes new rules to owning documents.

Decision recording is present and governed, though decisions live inside documents rather than
as numbered [ADR](#glossary) files.

## Structure Review

| Area                       | Verdict | Basis                                                                            |
| -------------------------- | ------- | -------------------------------------------------------------------------------- |
| Directory organization     | PASS    | `components/`, `hooks/`, `synth/`, `exports/`, `utils/`, `workers/` map to roles |
| Naming conventions         | PARTIAL | Source names follow casing rules, test files diverge from the test-name rule     |
| Component placement        | PARTIAL | `utils/` is a 46-file catch-all, domain types live inside `SoundDriver.ts`       |
| Supporting-artifact layout | PASS    | `docs/` corpus organized, `work/` and `release/` gitignored, fixtures co-located |
| Consistency                | PARTIAL | Focused small files overall, one 2640-line outlier concentrates wiring           |

The physical layout matches the declared module boundaries and the React/TypeScript baseline.

Deviations are bounded: the `utils/` catch-all, the orchestrator outlier, the tracked
`.DS_Store`, and the extensionless test file.

## Trade-off Analysis

| Trade-off                                      | Constraint                                         | Stance       | Assessment                                                    |
| ---------------------------------------------- | -------------------------------------------------- | ------------ | ------------------------------------------------------------- |
| Monolithic orchestrator vs decomposition       | Audio timing stability vs change blast radius      | Deliberate   | Acceptable at current size, bounded by staged decomposition   |
| localStorage persistence vs file-backed        | Autosave simplicity vs durability and portability  | Default      | Eviction and profile-loss risk accepted without a backup path |
| Custom markdown renderer vs dependency         | Small surface vs injection hardening               | Deliberate   | Reasonable for first-party content, needs layered controls    |
| Hook-warning suppression vs lint strictness    | Audio-path render timing vs mechanical enforcement | Deliberate   | Documented and scoped, an accepted and principled deviation   |
| No [CI](#glossary) vs manual verification loop | Single-author workflow vs enforced gates           | Undocumented | Loop is strong on paper but unenforced and unverifiable       |
| Cache-first service worker vs freshness        | Offline availability vs stale-asset exposure       | Undocumented | Simple strategy fits an offline tool, needs versioned name    |

Each trade-off is evaluated against the constraint the project states, not against generic
practice.

## Threat Model

Boundaries assessed per [STRIDE](#glossary): [YAML](#glossary) file import, [HTML](#glossary) rendering of fetched markdown,
Electron IPC, `localStorage` persistence, service-worker cache, and the Web MIDI device
interface.

| Boundary                 | Threat                                | Control present                                            | Outcome         |
| ------------------------ | ------------------------------------- | ---------------------------------------------------------- | --------------- |
| [YAML](#glossary) import | Tampering - malformed song files      | `js-yaml` safe load plus `validateSongData`                | Mitigated       |
| [YAML](#glossary) import | DoS - oversized or hostile document   | No size limit or depth guard inspected                     | Open (LOW risk) |
| Markdown render          | Tampering - injected markup via sinks | `escapeHtml` only, no [CSP](#glossary) or sanitizer review | Partial         |
| Markdown render          | Info disclosure - first-party content | Static `MESSAGES.md`, no user content                      | Low             |
| Electron IPC             | Elevation - renderer reaching main    | Narrow preload, contextIsolation, nodeIntegration          | Mitigated       |
| Device access            | Spoofing - grant not scoped to origin | Permission handler allows `midi`/`midiSysex` all           | Open            |
| Persistence              | Tampering - localStorage mutation     | Same-origin store, app-controlled keys                     | Low             |
| Service worker           | Tampering - stale or poisoned cache   | Same-origin fetch only, static cache name                  | Partial         |

Every material threat row traces to a finding: the unscoped device grant is [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin), the
renderer hardening gap is [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth), and the cache weakness is [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys).

No disclosure threat carries secret material: the tree holds no credentials, tokens, or
connection strings (no `secret`, `password`, or `api_key` literals in source).

The unmitigated threats are LOW-to-MEDIUM residual and none reaches network-facing
exploitability: this is a local desktop application with no remote attack surface beyond file
import and fetched first-party content.

## Standards Conformance

The project carries a documented standard at `docs/standard/ts-react-development.md` covering
language, structure, naming, testing, tooling, and error handling.

Conformance is high on the mechanical rules and lower on the process rules.

| Rule                                            | Verdict | Evidence                                                                       |
| ----------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| TypeScript strict mode                          | PASS    | `tsconfig.app.json` `strict: true`, zero `any` in `src/`                       |
| Functional components only                      | PASS    | All `src/components/` are functional except the declared `ErrorBoundary` class |
| File naming conventions                         | PARTIAL | Sources conform, test files are camelCase against `PascalCase.test.ts`         |
| Absolute `@/` imports over deep relative        | FAIL    | Alias configured, zero uses, 43 relative imports in `App.tsx`                  |
| `REASON:` on non-null assertions                | PARTIAL | Three sites lack the comment, three others carry it                            |
| No numbered or section-restating comments       | PARTIAL | Duplicated numbered comment persists in `useMidi.ts:53-54`                     |
| Empty catches carry `// ignore`                 | PASS    | Every inspected empty catch block carries the marker                           |
| `console.log` out of production code            | PASS    | One `console.log` and four console calls total in `src/`                       |
| ESLint and Prettier enforced in [CI](#glossary) | FAIL    | No [CI](#glossary) configuration exists, enforcement is manual                 |
| No JavaScript in source directories             | PARTIAL | `electron/*.cjs` and `scripts/*.mjs` are JavaScript entry/tooling              |
| Test organization mirrors source                | PARTIAL | Mirror exists under `test/`, one file misplaced by extension                   |
| Domain-specific error classes                   | PASS    | `ValidationError` in `src/utils/validation.ts`                                 |
| Error boundaries for component isolation        | PASS    | `ErrorBoundary` mounted at the App root                                        |

The named external best practices the standard invokes - React hooks guidance, the TypeScript
handbook - are followed in the inspected surfaces, with the documented audio-critical exceptions
recorded in `docs/GUIDELINES.md`.

## Engineering Baseline Conformance

The subject ships TypeScript/React source covered by the bundled stack baseline, and an
Electron desktop shell covered by the desktop-application purpose digest.

| Baseline item                     | Verdict | Basis                                                         |
| --------------------------------- | ------- | ------------------------------------------------------------- |
| Strict compiler and lint pipeline | PASS    | `strict: true`, flat ESLint with typed rules, Prettier        |
| Test runner with coverage gate    | PARTIAL | Vitest plus 80 percent thresholds, gate documented as failing |
| Desktop isolation flags           | PASS    | `contextIsolation`, `nodeIntegration: false`, narrow preload  |
| Deterministic packaging           | PARTIAL | electron-builder configured, artifacts unsigned               |
| Secret-free tracked tree          | PASS    | No credential literals found in `src/`, `electron/`, configs  |
| Offline/runtime hygiene           | PARTIAL | Service worker exists, static cache name weakens invalidation |

## Structure Conformance

Conformance verdicts by partition, governed by the project's own naming and layout rules plus
the React/TypeScript baseline in `references/naming-and-layout.md`.

| Partition         | Convention                        | Status | Evidence                                    |
| ----------------- | --------------------------------- | ------ | ------------------------------------------- |
| `src/components/` | `PascalCase.tsx`                  | PASS   | 27 files conform                            |
| `src/hooks/`      | `useCamelCase.ts`                 | PASS   | 32 files conform                            |
| `src/utils/`      | `camelCase.ts`                    | PASS   | 46 files conform in casing, volume diverges |
| `src/modals/`     | `PascalCase.tsx`                  | PASS   | Files conform                               |
| `src/synth/`      | `PascalCase.ts` domain modules    | PASS   | `YM2149.ts`, `SoundDriver.ts` conform       |
| `test/`           | `PascalCase.test.ts` per standard | FAIL   | camelCase names plus one extensionless file |
| `electron/`       | CommonJS entry files              | PASS   | `main.cjs`, `preload.cjs` appropriate       |

## Code Style

Convention tiers: T1 for TypeScript production and test partitions (project-declared standard),
T3 for the CommonJS Electron and script surfaces (ecosystem idiom).

| Lens                     | Status  | Basis                                                   |
| ------------------------ | ------- | ------------------------------------------------------- |
| Identifier naming        | PASS    | Casing census conforms in every TypeScript partition    |
| Forbidden constructs     | PASS    | Zero `any`, near-zero `console.log`                     |
| Convention enforcement   | PARTIAL | Test naming, uncommented assertions, dead alias diverge |
| Readability and comments | PARTIAL | One duplicated numbered comment found                   |

Census: identifier-shape conformance is uniformly high, all `PascalCase`/`camelCase` partitions
conform, `any` count is zero, and `console.log` is near-absent ([EVD-017](#verification-and-evidence-ledger), [EVD-018](#verification-and-evidence-ledger), [EVD-019](#verification-and-evidence-ledger)).

The deviations are narrow and citable: test-file naming against the declared test convention
([FND-STR-001](#fnd-str-001-test-file-names-diverge-from-the-declared-test-name-convention)), three uncommented non-null assertions ([FND-CQY-004](#fnd-cqy-004-non-null-assertions-lack-the-required-reason-comments)), and the duplicated numbered
comment ([FND-CQY-005](#fnd-cqy-005-numbered-and-duplicated-section-comment-in-usemidits)).

Domain-terse names (`YM2149`, register constants, `R7`-style semantics) are accepted as
idiomatic and not flagged.

## Agent Guidance Conformance

The subject carries a structured agent-guidance set: `docs/GUIDELINES.md` declares itself the
central source of truth for AI-assisted development, with `docs/standard/`,
`docs/WORKFLOW.md`, `docs/TESTING.md`, `docs/VERSIONING.md`, and `docs/REFACTORING.md` as
topic owners.

| Artifact                             | Role                          | Status  | Notes                                    |
| ------------------------------------ | ----------------------------- | ------- | ---------------------------------------- |
| `docs/GUIDELINES.md`                 | Entry route, central rules    | Present | Complete with memorisation routing table |
| `docs/standard/ts-react-development` | Stack conventions             | Present | Single stack standard, well scoped       |
| `docs/WORKFLOW.md`                   | Day-to-day procedure          | Present | Verification-loop contract               |
| `docs/TESTING.md`                    | Verification gates            | Present | Declares the known coverage gap          |
| `docs/COPYRIGHTS.md`                 | License and originality rules | Present | Whitelist narrower than resolved set     |
| `docs/template/`                     | Change-request/plan templates | Present | Used by `change/` and `plan/`            |
| `AGENTS.md` / `SKILL.md`             | Agent entry points            | Absent  | No top-level agent entry file            |

Topology is coherent: one entry document, per-topic owners, an explicit no-scan rule for
restricted directories, and an instruction to update the index when documents change.

## Strengths & What's Working

- **Strict TypeScript with zero `any`**. `tsconfig.app.json` sets `strict: true` and ESLint
  enforces `no-explicit-any` as an error, with zero occurrences measured in `src/`.

- **Timing-aware audio architecture**. `src/workers/sequencerWorker.ts` owns the 50 Hz tick off
  the render thread, and audio-rate state lives in refs by documented design.

- **Hardened Electron boundary**. `contextIsolation: true`, `nodeIntegration: false`, and a
  five-member `contextBridge` preload surface.

- **Layered export pipeline**. `src/exports/core.ts` normalizes once, five format modules share
  the normalized model, including a faithful ZX0-compressed MAX stream.

- **Documented governance corpus**. A 12-file source-of-truth set, per-version change and plan
  directories, templates, and an explicit memorisation convention.

- **Defensive file-input boundary**. Every song load passes `yaml.load` then
  `validateSongData`, rejecting malformed structures before use.

- **Disciplined error surfaces**. `ErrorBoundary` isolation, a leveled `logger` singleton, and
  `// ignore`-marked intentional empty catches throughout.

- **Honest self-reporting**. `docs/TESTING.md` documents the failing coverage gate itself, and
  the README openly declares AI-assisted authorship.

## Detailed Technical Findings

| Finding                                                                                          | Pillar                              | Severity | Title                                                                             | Result  | Status | Change | Verification |
| ------------------------------------------------------------------------------------------------ | ----------------------------------- | -------- | --------------------------------------------------------------------------------- | ------- | ------ | ------ | ------------ |
| [FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk)   | Architecture & Design               | HIGH     | 2640-line central orchestrator concentrates wiring and change risk                | PARTIAL | Open   | New    |              |
| [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)                      | Architecture & Design               | MEDIUM   | Single-author contributor concentration is High                                   | FAIL    | Open   | New    |              |
| [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)                       | Code Quality                        | MEDIUM   | Tracked extensionless test file never executes                                    | FAIL    | Open   | New    |              |
| [FND-CQY-002](#fnd-cqy-002-no-end-to-end-specs-exist-despite-configured-playwright)              | Code Quality                        | MEDIUM   | No end-to-end specs exist despite configured Playwright                           | FAIL    | Open   | New    |              |
| [FND-CQY-003](#fnd-cqy-003-documentation-figures-have-drifted-from-the-code)                     | Code Quality                        | LOW      | Documentation figures have drifted from the code                                  | PARTIAL | Open   | New    |              |
| [FND-CQY-004](#fnd-cqy-004-non-null-assertions-lack-the-required-reason-comments)                | Code Quality                        | LOW      | Non-null assertions lack the required `REASON:` comments                          | PARTIAL | Open   | New    |              |
| [FND-CQY-005](#fnd-cqy-005-numbered-and-duplicated-section-comment-in-usemidits)                 | Code Quality                        | LOW      | Numbered and duplicated section comment in `useMidi.ts`                           | PARTIAL | Open   | New    |              |
| [FND-CQY-006](#fnd-cqy-006-configured--import-alias-is-unused)                                   | Code Quality                        | LOW      | Configured `@/` import alias is unused                                            | FAIL    | Open   | New    |              |
| [FND-CQY-007](#fnd-cqy-007-os-artifact-testds_store-is-tracked)                                  | Code Quality                        | LOW      | OS artifact `test/.DS_Store` is tracked                                           | FAIL    | Open   | New    |              |
| [FND-CQY-008](#fnd-cqy-008-song-persistence-relies-solely-on-localstorage)                       | Code Quality                        | MEDIUM   | Song persistence relies solely on localStorage                                    | PARTIAL | Open   | New    |              |
| [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                 | Security & Compliance               | MEDIUM   | Custom HTML rendering surface lacks defense in depth                              | PARTIAL | Open   | New    |              |
| [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)         | Security & Compliance               | MEDIUM   | [MIDI](#glossary) permission grant is not scoped to the requesting origin         | FAIL    | Open   | New    |              |
| [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)     | Infrastructure & [CI/CD](#glossary) | MEDIUM   | No automated [CI](#glossary) gate exists for the documented verification loop     | FAIL    | Open   | New    |              |
| [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)                | Infrastructure & [CI/CD](#glossary) | MEDIUM   | Service worker can serve stale assets after redeploys                             | PARTIAL | Open   | New    |              |
| [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)                           | Infrastructure & [CI/CD](#glossary) | LOW      | Desktop artifacts are distributed unsigned                                        | PARTIAL | Open   | New    |              |
| [FND-INF-004](#fnd-inf-004-coverage-gate-is-documented-as-failing-and-unverified-in-source)      | Infrastructure & [CI/CD](#glossary) | MEDIUM   | Coverage gate is documented as failing and unverified in-source                   | FAIL    | Open   | New    |              |
| [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable) | AI Provenance & Code Origin         | LOW      | [AI](#glossary) provenance is disclosed but per-change compliance is unmeasurable | PARTIAL | Open   | New    |              |
| [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set)           | Copyrights & Originality            | MEDIUM   | License policy whitelist is narrower than the resolved set                        | PARTIAL | Open   | New    |              |
| [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file)   | Copyrights & Originality            | LOW      | [ZX0](#glossary) third-party attribution is absent from the central notice file   | PARTIAL | Open   | New    |              |
| [FND-STR-001](#fnd-str-001-test-file-names-diverge-from-the-declared-test-name-convention)       | Structure & Organization            | LOW      | Test file names diverge from the declared test-name convention                    | FAIL    | Open   | New    |              |

### FND-ARC-001: 2640-line central orchestrator concentrates wiring and change risk

- **Pillar:** Architecture & Design
- **Severity:** HIGH
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/App.tsx`
- **Basis:** Inspected
- **Criterion:** ARC-COHES
- **Description:** `App.tsx` is 2640 lines holding composition, song and [UI](#glossary) state, modal wiring, and dozens of effects. The next-largest file is 688 lines, so the concentration is an order of magnitude above the codebase's own grain.
- **Impact:** Every cross-cutting change converges on one hotspot, compounding review load and regression surface. The blast radius of any edit is the whole application shell.
- **Recommendation:** Stage a decomposition into domain containers (playback, instruments, modals, files) behind the documented trade-off, per [REC-007](#rec-007-stage-the-orchestrator-decomposition).
- **Method:** File-size census and wiring inspection.
- **Verified:** yes - line count and structure inspected.
- **Runtime confirmed:** no - source-only audit.
- **Confidence:** HIGH - directly measured.
- **Mitigating factors:** The concentration is a documented deliberate trade-off in `ARCHITECTURE.md`, and hooks already carry most behavior.
- **Evidence:** [EVD-005](#verification-and-evidence-ledger), [EVD-018](#verification-and-evidence-ledger), [EVD-032](#verification-and-evidence-ledger)

### FND-ARC-002: Single-author contributor concentration is High

- **Pillar:** Architecture & Design
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** repository history
- **Basis:** Inspected
- **Criterion:** DLY-CONT
- **Description:** `git shortlog` attributes all 713 commits on the audited branch to one author. No continuity owner, co-maintainer, or delegation record exists.
- **Impact:** Maintainer unavailability halts all delivery and leaves the audio-critical conventions, which exist mostly in one person's working knowledge, unrecoverable in practice.
- **Recommendation:** Name a continuity owner and capture the audio-tuning rationale as runbook notes, per [REC-012](#rec-012-name-a-continuity-owner).
- **Method:** Git author census.
- **Verified:** yes - history enumerated.
- **Runtime confirmed:** not applicable - process dimension.
- **Confidence:** HIGH - complete history inspected.
- **Mitigating factors:** The `docs/` corpus is unusually complete and records rationale, partially offsetting knowledge loss.
- **Evidence:** [EVD-002](#verification-and-evidence-ledger), [EVD-003](#verification-and-evidence-ledger), [EVD-030](#verification-and-evidence-ledger)

### FND-CQY-001: Tracked extensionless test file never executes

- **Pillar:** Code Quality
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `test/utils/exportMax.test`
- **Basis:** Inspected
- **Criterion:** TST-DEAD
- **Description:** `test/utils/exportMax.test` contains a full MAX-export suite but carries no `.ts` extension, so the vitest include glob `test/**/*.{test,spec}.{ts,tsx}` never collects it. The file is committed dead code that looks like coverage.
- **Impact:** The MAX exporter tests silently do not run, regressions in [ZX0](#glossary) chunk layout pass unnoticed while the file implies otherwise.
- **Recommendation:** Rename to `exportMax.test.ts` or merge into the sibling suite, per [REC-005](#rec-005-rename-or-merge-the-extensionless-test-file).
- **Method:** Include-glob versus tracked-file census.
- **Verified:** yes - filename and glob compared.
- **Runtime confirmed:** no - collection not executed.
- **Confidence:** HIGH - mechanical exclusion.
- **Mitigating factors:** `test/utils/exportMax.test.ts` exists and covers part of the surface.
- **Evidence:** [EVD-012](#verification-and-evidence-ledger), [EVD-014](#verification-and-evidence-ledger)

### FND-CQY-002: No end-to-end specs exist despite configured Playwright

- **Pillar:** Code Quality
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `e2e/`, `playwright.config.ts`
- **Basis:** Inspected
- **Criterion:** TST-E2E
- **Description:** `playwright.config.ts` and the `test:e2e` script are configured, and `TESTING.md` lists six intended end-to-end flows, but `e2e/` holds only `.gitkeep`.
- **Impact:** No user-flow verification exists, [UI](#glossary) regressions in playback, export, and persistence reach releases unchecked.
- **Recommendation:** Add a Playwright smoke suite for the documented flows, per [REC-006](#rec-006-add-a-playwright-smoke-suite-for-the-documented-flows).
- **Method:** Declared-suite directory census.
- **Verified:** yes - directory enumerated.
- **Runtime confirmed:** no.
- **Confidence:** HIGH.
- **Mitigating factors:** Unit and component coverage is otherwise substantial at 258 cases.
- **Absence:** No documented rationale - the config and documents envisage the suite.
- **Evidence:** [EVD-013](#verification-and-evidence-ledger), [EVD-016](#verification-and-evidence-ledger), [EVD-028](#verification-and-evidence-ledger)

### FND-CQY-003: Documentation figures have drifted from the code

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `docs/ARCHITECTURE.md`
- **Basis:** Inspected
- **Criterion:** MNT-DOC
- **Description:** `ARCHITECTURE.md` states Electron 39 while `package.json` resolves `^42.0.0`. The version figure survived three major dependency bumps without an update pass.
- **Impact:** Stale figures mislead change planning and audits that trust declared stack versions.
- **Recommendation:** Refresh documented figures and add a per-release documentation pass, per [REC-004](#rec-004-refresh-documented-figures-add-a-per-release-doc-pass).
- **Method:** Documented-figure versus manifest comparison.
- **Verified:** yes - values compared.
- **Runtime confirmed:** not applicable.
- **Confidence:** HIGH.
- **Mitigating factors:** The corpus is otherwise current and actively maintained.
- **Evidence:** [EVD-021](#verification-and-evidence-ledger)

### FND-CQY-004: Non-null assertions lack the required `REASON:` comments

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `src/main.tsx:5`, `src/utils/zx0.ts:124`, `src/utils/zx0.ts:184`
- **Basis:** Inspected
- **Criterion:** STY-REASON
- **Description:** The standard requires a `// REASON:` comment on every non-null assertion. Three sites assert without one, including the application entry point.
- **Impact:** Escape hatches lose their justification trail and invite silent propagation of the pattern.
- **Recommendation:** Add `REASON:` comments or remove the assertions, per [REC-016](#rec-016-add-reason-comments-or-remove-the-assertions).
- **Method:** Assertion census.
- **Verified:** yes.
- **Runtime confirmed:** not applicable.
- **Confidence:** HIGH.
- **Mitigating factors:** Only three sites and the idiom is otherwise respected.
- **Evidence:** [EVD-019](#verification-and-evidence-ledger)

### FND-CQY-005: Numbered and duplicated section comment in `useMidi.ts`

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `src/hooks/useMidi.ts:53-54`
- **Basis:** Inspected
- **Criterion:** STY-COMMENT
- **Description:** Two adjacent lines repeat `// 2. Configuration Management`, a numbered section marker the standard forbids, duplicated verbatim.
- **Impact:** Residual marker noise contradicts the comment policy and signals an unmerged edit.
- **Recommendation:** Remove the comment pair, per [REC-017](#rec-017-remove-the-duplicated-numbered-comment).
- **Method:** Comment-pattern census.
- **Verified:** yes.
- **Runtime confirmed:** not applicable.
- **Confidence:** HIGH.
- **Mitigating factors:** Bounded to two lines in one file.
- **Evidence:** [EVD-020](#verification-and-evidence-ledger)

### FND-CQY-006: Configured `@/` import alias is unused

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `tsconfig.app.json`, `vitest.config.ts`, `src/`
- **Basis:** Inspected
- **Criterion:** STY-ALIAS
- **Description:** The `@/` path alias is configured in tsconfig and vitest, and the standard prefers it over deep relative imports, yet zero source files use it, `App.tsx` alone holds 43 relative imports.
- **Impact:** The declared convention is dead configuration, deep relative paths keep accumulating.
- **Recommendation:** Adopt the alias or remove it and amend the standard, per [REC-018](#rec-018-adopt-the--alias-or-remove-it-from-config).
- **Method:** Import-shape census.
- **Verified:** yes - grep census.
- **Runtime confirmed:** not applicable.
- **Confidence:** HIGH.
- **Mitigating factors:** Relative imports resolve correctly, the alias is convenience, not correctness.
- **Evidence:** [EVD-018](#verification-and-evidence-ledger)

### FND-CQY-007: OS artifact `test/.DS_Store` is tracked

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `test/.DS_Store`
- **Basis:** Inspected
- **Criterion:** STY-TEST
- **Description:** A macOS `.DS_Store` file is committed under `test/` although `.gitignore` lists the pattern.
- **Impact:** Harmless but noisy, it predates or bypasses the ignore rule and invites further OS litter.
- **Recommendation:** Untrack the file, per [REC-019](#rec-019-untrack-testds_store).
- **Method:** Tracked-file census.
- **Verified:** yes - `git ls-files`.
- **Runtime confirmed:** not applicable.
- **Confidence:** HIGH.
- **Mitigating factors:** Single file, no functional effect.
- **Evidence:** [EVD-015](#verification-and-evidence-ledger)

### FND-CQY-008: Song persistence relies solely on localStorage

- **Pillar:** Code Quality
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/utils/storageKeys.ts`, `src/hooks/useDataManagement.ts:127`
- **Basis:** Inspected
- **Criterion:** REL-DURA
- **Description:** Song and instrument data auto-persist to `localStorage` keys only. Browser storage is evictable under quota pressure and disappears on profile reset or origin data clearing, and no backup or redundancy exists.
- **Impact:** A user's compositions can vanish without a file save, the manual export path is the only recovery and depends on user discipline.
- **Recommendation:** Add redundancy - periodic file-save reminders, File System Access persistence, or IndexedDB with export, per [REC-020](#rec-020-add-a-redundant-persistence-path-or-save-reminder).
- **Method:** Persistence-path inspection.
- **Verified:** yes - storage calls traced.
- **Runtime confirmed:** no - eviction behavior not exercised.
- **Confidence:** MEDIUM - durability loss is plausible, not demonstrated.
- **Mitigating factors:** Manual YAML export exists, and Electron's storage is more durable than a shared browser profile.
- **Evidence:** [EVD-027](#verification-and-evidence-ledger)

### FND-SEC-001: Custom HTML rendering surface lacks defense in depth

- **Pillar:** Security & Compliance
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/utils/markdown.ts`, `src/modals/MarkdownModal.tsx:29`, `src/components/EnvelopeSection.tsx:98`
- **Basis:** Inspected
- **Criterion:** SEC-INJ
- **Description:** A hand-rolled markdown-to-HTML renderer feeds two `dangerouslySetInnerHTML` sinks (the markdown modal and the envelope notes panel). `escapeHtml` covers the five entity classes and links carry `rel="noreferrer"`, but no [CSP](#glossary), sanitizer, or second-layer control exists. CWE-79-adjacent injection surface, equivalent static rule `typescript-eslint` community XSS checks - no direct bundled rule fires on `dangerouslySetInnerHTML`.
- **Impact:** If rendered content ever includes file-derived or user-controlled text, markup injection becomes script execution inside the Electron renderer.
- **Recommendation:** Constrain sinks to first-party content, add a [CSP](#glossary), and consider a vetted sanitizer, per [REC-008](#rec-008-harden-the-markdown-rendering-path).
- **Method:** Rendering-sink and control census.
- **Verified:** yes - sinks and renderer inspected.
- **Runtime confirmed:** no - exploitation not attempted.
- **Confidence:** MEDIUM - the control gap is confirmed, exploitability is not.
- **Mitigating factors:** Rendered content is first-party `MESSAGES.md` fetched statically, no remote content is loaded.
- **Evidence:** [EVD-011](#verification-and-evidence-ledger), [EVD-031](#verification-and-evidence-ledger)

### FND-SEC-002: MIDI permission grant is not scoped to the requesting origin

- **Pillar:** Security & Compliance
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `electron/main.cjs` permission handlers
- **Basis:** Inspected
- **Criterion:** SEC-PERM
- **Description:** `setPermissionRequestHandler` and `setPermissionCheckHandler` grant `midi` and `midiSysex` unconditionally - any origin or content loaded into the window receives device access, including sysex the app never requests (`sysex: false`).
- **Impact:** Any content that reaches the window - a compromised dependency, a loaded file [URL](#glossary) - inherits hardware [MIDI](#glossary) access beyond the app's own needs.
- **Recommendation:** Scope grants to the app's origin and drop `midiSysex`, per [REC-009](#rec-009-scope-the-midi-permission-grant-to-the-app-origin).
- **Method:** Permission-handler inspection.
- **Verified:** yes - handler logic read.
- **Runtime confirmed:** no.
- **Confidence:** HIGH - grant logic is unambiguous.
- **Mitigating factors:** The window loads only local files in production and the app itself uses `sysex: false`.
- **Evidence:** [EVD-008](#verification-and-evidence-ledger), [EVD-009](#verification-and-evidence-ledger)

### FND-INF-001: No automated CI gate exists for the documented verification loop

- **Pillar:** Infrastructure & CI/CD
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** repository root, `.github/` absent
- **Basis:** Inspected
- **Criterion:** DEP-CI
- **Description:** The standard requires ESLint and Prettier enforced in [CI](#glossary) and `TESTING.md` defines a five-step verification loop, yet no workflow file, pipeline config, or badge exists. Release scripts (`bump-version.mjs`, electron-builder) are the only automation signals.
- **Impact:** The loop's enforcement depends on local discipline, regressions can merge and release undetected.
- **Recommendation:** Add a [CI](#glossary) workflow running the documented loop, per [REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop).
- **Method:** Pipeline-file census.
- **Verified:** yes - tree enumerated.
- **Runtime confirmed:** not applicable.
- **Confidence:** HIGH.
- **Mitigating factors:** The loop is fully scripted and runnable locally, the docs are explicit about order.
- **Absence:** Undetermined - release scripts exist but no pipeline was ever committed.
- **Evidence:** [EVD-005](#verification-and-evidence-ledger), [EVD-016](#verification-and-evidence-ledger), [EVD-017](#verification-and-evidence-ledger)

### FND-INF-002: Service worker can serve stale assets after redeploys

- **Pillar:** Infrastructure & CI/CD
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `public/js/sw.js`
- **Basis:** Inspected
- **Criterion:** DEP-CACHE
- **Description:** `CACHE_NAME` is a static `dosound-tracker-cache-v1`, and the fetch handler serves any cached GET asset cache-first. A redeployed build keeps serving previous assets to returning clients until the cache is cleared.
- **Impact:** Users run skewed code after releases - stale bundles against new [HTML](#glossary) or vice versa.
- **Recommendation:** Version the cache name per build and reorder to network-first for hashed assets, per [REC-003](#rec-003-version-the-service-worker-cache-per-build).
- **Method:** Cache-strategy inspection.
- **Verified:** yes - handler read.
- **Runtime confirmed:** no.
- **Confidence:** HIGH - strategy is deterministic.
- **Mitigating factors:** Navigation requests are network-first, softening entry-point staleness.
- **Evidence:** [EVD-022](#verification-and-evidence-ledger)

### FND-INF-003: Desktop artifacts are distributed unsigned

- **Pillar:** Infrastructure & CI/CD
- **Severity:** LOW
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `package.json` build config, `README.md`
- **Basis:** Inspected
- **Criterion:** DEP-SIGN
- **Description:** electron-builder produces DMG/NSIS/AppImage artifacts, and the README documents that macOS binaries are unsigned with a quarantine-removal workaround. No checksums or signatures are published.
- **Impact:** Users cannot verify artifact integrity or provenance, the workaround normalizes bypassing OS protections.
- **Recommendation:** Publish release checksums and evaluate signing, per [REC-013](#rec-013-publish-release-checksums-then-evaluate-signing).
- **Method:** Packaging-config and README inspection.
- **Verified:** yes - configuration and notice read.
- **Runtime confirmed:** not applicable.
- **Confidence:** HIGH.
- **Mitigating factors:** The limitation is disclosed openly and the distribution channel is the project site.
- **Evidence:** [EVD-029](#verification-and-evidence-ledger)

### FND-INF-004: Coverage gate is documented as failing and unverified in-source

- **Pillar:** Infrastructure & CI/CD
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `vitest.config.ts`, `docs/TESTING.md:233`
- **Basis:** Inspected
- **Criterion:** TST-COV
- **Description:** Thresholds of 80 percent are configured on all four metrics, and `TESTING.md` states `npm run test:coverage` fails until they are met. No committed coverage report exists, so current coverage is `UNKNOWN` and the gate is unenforced.
- **Impact:** The riskiest paths - parsing, export, sequencer - have no verified coverage floor.
- **Recommendation:** Close the coverage gap on highest-risk paths and commit or gate the report, per [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths).
- **Method:** Threshold config plus documented-gap inspection.
- **Verified:** yes - declaration inspected.
- **Runtime confirmed:** no - suite not executed.
- **Confidence:** MEDIUM - gap is documented, actual coverage unmeasured.
- **Mitigating factors:** The project itself documents the gap as known work.
- **Evidence:** [EVD-012](#verification-and-evidence-ledger), [EVD-016](#verification-and-evidence-ledger), [EVD-028](#verification-and-evidence-ledger)

### FND-AIP-001: AI provenance is disclosed but per-change compliance is unmeasurable

- **Pillar:** AI Provenance & Code Origin
- **Severity:** LOW
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `README.md`, `test/fixtures/`, `docs/prompt/`
- **Basis:** Inspected
- **Criterion:** AIP-TRACE
- **Description:** The README declares AI-assisted authorship ("Windsurf and GPT 5.1"), fixture filenames carry GPT/GROK/SWE markers, and `docs/prompt/` archives historical prompts. No per-change disclosure convention or commit-trailer policy exists, so the fraction of AI-authored code is unmeasurable.
- **Impact:** Provenance review controls exist on paper but cannot be measured per change.
- **Recommendation:** Adopt a per-change AI-disclosure convention, per [REC-014](#rec-014-adopt-a-per-change-ai-disclosure-convention).
- **Method:** Metadata and documentation inspection.
- **Verified:** yes - declarations inspected.
- **Runtime confirmed:** not applicable.
- **Confidence:** MEDIUM - disclosure confirmed, per-change coverage unmeasurable.
- **Mitigating factors:** Disclosure itself exceeds common practice, originality rules are documented.
- **Provenance basis:** Declared
- **Evidence:** [EVD-024](#verification-and-evidence-ledger)

### FND-CPR-001: License policy whitelist is narrower than the resolved set

- **Pillar:** Copyrights & Originality
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `docs/COPYRIGHTS.md`, `package-lock.json`
- **Basis:** Inspected
- **Criterion:** CPR-LIC
- **Description:** The policy permits [MIT](#glossary), Apache-2.0, BSD-2/3-Clause, [ISC](#glossary), and Boost. The resolved set adds BlueOak-1.0.0 (9 packages), CC-BY-4.0, CC0-1.0, [WTFPL](#glossary), and MIT-0 - all permissive but outside the whitelist - plus 219 packages with no declared license.
- **Impact:** Policy conformance is undecidable for the undeclared set, and whitelisted classes do not match the project's actual dependency posture.
- **Recommendation:** Reconcile the whitelist with the resolved set or amend the policy, per [REC-010](#rec-010-reconcile-the-license-whitelist-with-the-resolved-set).
- **Method:** Lockfile license census.
- **Verified:** yes - fields enumerated.
- **Runtime confirmed:** not applicable.
- **Confidence:** MEDIUM - class counts are exact, package-level obligations unassessed.
- **Mitigating factors:** All observed classes are permissive, the undeclared set is mostly dev tooling.
- **Evidence:** [EVD-007](#verification-and-evidence-ledger)

### FND-CPR-002: ZX0 third-party attribution is absent from the central notice file

- **Pillar:** Copyrights & Originality
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `docs/COPYRIGHTS.md`, `src/utils/zx0.ts`
- **Basis:** Inspected
- **Criterion:** CPR-ATTR
- **Description:** The [ZX0](#glossary) compressor is a BSD-3-Clause port with correct in-file attribution to Einar Saukas, but `COPYRIGHTS.md` - which requires documenting third-party assets - does not mention it.
- **Impact:** The central license inventory understates third-party content, redistribution relies on reading source headers.
- **Recommendation:** Record the [ZX0](#glossary) attribution in `COPYRIGHTS.md`, per [REC-011](#rec-011-record-the-zx0-attribution-in-copyrightsmd).
- **Method:** Attribution census.
- **Verified:** yes - both files read.
- **Runtime confirmed:** not applicable.
- **Confidence:** HIGH.
- **Mitigating factors:** The in-file header is complete and correct.
- **Evidence:** [EVD-025](#verification-and-evidence-ledger)

### FND-STR-001: Test file names diverge from the declared test-name convention

- **Pillar:** Structure & Organization
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `test/`
- **Basis:** Inspected
- **Criterion:** STY-TEST
- **Description:** The standard declares `PascalCase.test.ts` test names while all committed test files are camelCase (`exportWav.test.ts`, `songParser.test.ts`), and `docs/GUIDELINES.md` separately requires camelCase for non-component TypeScript - the two documents disagree.
- **Impact:** The naming rule is unenforceable as written and the docs conflict.
- **Recommendation:** Align the standard with the actual convention and rename outliers, per [REC-015](#rec-015-align-test-naming-and-the-declared-convention).
- **Method:** Test-name versus standard census.
- **Verified:** yes - filenames enumerated.
- **Runtime confirmed:** not applicable.
- **Confidence:** MEDIUM - divergence confirmed, which document governs is ambiguous.
- **Mitigating factors:** Files are consistently camelCase, the standard is the outlier.
- **Evidence:** [EVD-026](#verification-and-evidence-ledger), [EVD-015](#verification-and-evidence-ledger)

## Technical Debt Register

| Debt                                              | Item                          | Category        | Source                                                                                         | Cost        | Delay                | Status |
| ------------------------------------------------- | ----------------------------- | --------------- | ---------------------------------------------------------------------------------------------- | ----------- | -------------------- | ------ |
| [TDR-001](#tdr-001-central-orchestrator-monolith) | Central orchestrator monolith | Maintainability | [FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk) | HIGH effort | Compounding per edit | Open   |
| [TDR-002](#tdr-002-dead-and-divergent-test-files) | Dead and divergent test files | Maintainability | [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)                     | LOW effort  | Masked coverage      | Open   |
| [TDR-003](#tdr-003-documentation-figure-drift)    | Documentation figure drift    | Maintainability | [FND-CQY-003](#fnd-cqy-003-documentation-figures-have-drifted-from-the-code)                   | LOW effort  | Recurs each release  | Open   |

### TDR-001: Central orchestrator monolith

- **Category:** Maintainability
- **Source:** [FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk)
- **Description:** `App.tsx` at 2640 lines concentrates orchestration that would otherwise decompose into domain containers, the debt is structural, growing with every feature merged into it.
- **Cost:** HIGH - staged extraction across several component boundaries, each needing regression checks against audio timing.
- **Delay:** Compounding - each new feature enlarges the hotspot and raises the future extraction cost.
- **Status:** Open

### TDR-002: Dead and divergent test files

- **Category:** Maintainability
- **Source:** [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)
- **Description:** `test/utils/exportMax.test` is collected by no runner, and test naming diverges from the declared convention (see [FND-STR-001](#fnd-str-001-test-file-names-diverge-from-the-declared-test-name-convention)).
- **Cost:** LOW - a rename or merge plus a standard alignment.
- **Delay:** Slow - the dead file keeps implying coverage that never runs.
- **Status:** Open

### TDR-003: Documentation figure drift

- **Category:** Maintainability
- **Source:** [FND-CQY-003](#fnd-cqy-003-documentation-figures-have-drifted-from-the-code)
- **Description:** Version-pinned figures in the docs (Electron 39 vs resolved 42) lag the manifest.
- **Cost:** LOW - a per-release refresh pass.
- **Delay:** Recurs at each release until a check exists.
- **Status:** Open

## Unified Risk Register

Severity derives from the impact-likelihood matrix below, not [CVSS](#glossary).

| Risk                                                                       | Description                                                      | Source                                                                                           | Impact | Likelihood | Severity | Mitigation                                 |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ | ---------- | -------- | ------------------------------------------ |
| [RSK-001](#rsk-001-regressions-merge-undetected-without-ci-enforcement)    | Regressions merge undetected without [CI](#glossary) enforcement | [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)     | MEDIUM | MEDIUM     | MEDIUM   | [CI](#glossary) workflow for declared loop |
| [RSK-002](#rsk-002-redeploys-serve-stale-or-skewed-web-assets)             | Redeploys serve stale or skewed web assets                       | [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)                | MEDIUM | MEDIUM     | MEDIUM   | Versioned cache name                       |
| [RSK-003](#rsk-003-maintainer-unavailability-halts-all-delivery)           | Maintainer unavailability halts all delivery                     | [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)                      | HIGH   | LOW        | MEDIUM   | Continuity owner                           |
| [RSK-004](#rsk-004-orchestrator-growth-compounds-change-defects)           | Orchestrator growth compounds change defects                     | [FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk)   | MEDIUM | MEDIUM     | MEDIUM   | Staged decomposition                       |
| [RSK-005](#rsk-005-injected-markup-renders-through-the-markdown-sinks)     | Injected markup renders through the markdown sinks               | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                 | HIGH   | LOW        | MEDIUM   | Layered controls plus [CSP](#glossary)     |
| [RSK-006](#rsk-006-ui-regressions-reach-releases-without-e2e-checks)       | [UI](#glossary) regressions reach releases without e2e checks    | [FND-CQY-002](#fnd-cqy-002-no-end-to-end-specs-exist-despite-configured-playwright)              | MEDIUM | MEDIUM     | MEDIUM   | Playwright smoke suite                     |
| [RSK-007](#rsk-007-license-policy-non-conformance-surfaces-late)           | License policy non-conformance surfaces late                     | [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set)           | MEDIUM | LOW        | LOW      | Whitelist reconciliation                   |
| [RSK-008](#rsk-008-dead-test-file-implies-coverage-that-does-not-run)      | Dead test file implies coverage that does not run                | [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)                       | LOW    | MEDIUM     | LOW      | Rename or merge file                       |
| [RSK-009](#rsk-009-tampered-or-mismatched-binaries-reach-users-unverified) | Tampered or mismatched binaries reach users unverified           | [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)                           | MEDIUM | LOW        | LOW      | Checksums, evaluate signing                |
| [RSK-010](#rsk-010-stale-documented-figures-mislead-change-planning)       | Stale documented figures mislead change planning                 | [FND-CQY-003](#fnd-cqy-003-documentation-figures-have-drifted-from-the-code)                     | LOW    | MEDIUM     | LOW      | Per-release doc pass                       |
| [RSK-011](#rsk-011-device-permission-granted-beyond-the-intended-origin)   | Device permission granted beyond the intended origin             | [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)         | MEDIUM | LOW        | LOW      | Origin-scoped grant                        |
| [RSK-012](#rsk-012-undisclosed-generated-code-lands-without-trace)         | Undisclosed generated code lands without trace                   | [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable) | LOW    | LOW        | LOW      | Disclosure convention                      |
| [RSK-013](#rsk-013-song-data-lost-on-storage-eviction-or-profile-reset)    | Song data lost on storage eviction or profile reset              | [FND-CQY-008](#fnd-cqy-008-song-persistence-relies-solely-on-localstorage)                       | MEDIUM | LOW        | LOW      | Persistence redundancy                     |

### RSK-001: Regressions merge undetected without CI enforcement

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - the loop exists but only runs when invoked manually.
- **Residual:** LOW after a CI workflow lands.
- **Status:** Open
- **Description:** No pipeline runs the documented verification loop, conformance relies on local discipline.
- **Impact:** Lint, format, type, or test regressions merge and ship undetected.
- **Trigger:** Any commit merged without a local loop run.
- **Controls:** The loop is scripted in `package.json` and documented in `TESTING.md`.
- **Mitigation:** A [CI](#glossary) workflow running typecheck, lint, format check, build, and tests.
- **Closure:** A workflow file exists and its status gates merges.
- **Source:** [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)
- **Confidence:** HIGH - absence is mechanically confirmed.

### RSK-002: Redeploys serve stale or skewed web assets

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - every redeploy under the static cache name.
- **Residual:** LOW with a versioned cache name.
- **Status:** Open
- **Description:** Cache-first asset serving under a fixed `CACHE_NAME` lets old assets survive new releases.
- **Impact:** Users run mixed-version code, producing faults misattributed to the app.
- **Trigger:** Any deployment to the static host.
- **Controls:** Navigate path is network-first.
- **Mitigation:** Version the cache per build, prefer network-first for versioned assets.
- **Closure:** A release serves only current assets on a returning client.
- **Source:** [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)
- **Confidence:** HIGH - deterministic from the handler source.

### RSK-003: Maintainer unavailability halts all delivery

- **Severity:** MEDIUM
- **Likelihood:** LOW - single point of failure with no named backup.
- **Residual:** MEDIUM - concentration cannot transfer fully.
- **Status:** Open
- **Description:** All commits trace to one author, no continuity owner exists.
- **Impact:** Delivery, releases, and audio-tuning knowledge halt if the maintainer is unavailable.
- **Trigger:** Maintainer unavailability or attrition.
- **Controls:** Strong docs corpus records most rationale.
- **Mitigation:** Name a continuity owner, add runbook notes for audio tuning.
- **Closure:** A named owner with access and onboarding evidence.
- **Source:** [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)
- **Confidence:** HIGH - complete history shows one author.

### RSK-004: Orchestrator growth compounds change defects

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - the file grows with every feature.
- **Residual:** MEDIUM until decomposition lands.
- **Status:** Open
- **Description:** The 2640-line orchestrator keeps absorbing wiring, raising the odds a change breaks unrelated behavior.
- **Impact:** Regressions in unrelated panels from edits in one hotspot.
- **Trigger:** Any feature or fix touching `App.tsx`.
- **Controls:** Hooks carry much of the behavior already.
- **Mitigation:** Staged decomposition per [REC-007](#rec-007-stage-the-orchestrator-decomposition).
- **Closure:** Orchestrator responsibilities sit in bounded units.
- **Source:** [FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk)
- **Confidence:** HIGH - size measured, growth trend observed between audits.

### RSK-005: Injected markup renders through the markdown sinks

- **Severity:** MEDIUM
- **Likelihood:** LOW - current content is first-party and static.
- **Residual:** LOW with CSP and a constrained source set.
- **Status:** Open
- **Description:** Two `dangerouslySetInnerHTML` sinks render custom-marked-up content with only `escapeHtml` between input and [DOM](#glossary).
- **Impact:** Script execution in the renderer if a non-first-party string ever reaches the path.
- **Trigger:** Content source widening or a parser escape gap.
- **Controls:** `escapeHtml`, `rel="noreferrer"`, first-party content.
- **Mitigation:** [CSP](#glossary), vetted sanitizer, or DOM-only rendering.
- **Closure:** A [CSP](#glossary) exists and sinks are bounded to trusted sources.
- **Source:** [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)
- **Confidence:** MEDIUM - gap confirmed, no exploitation path demonstrated.

### RSK-006: UI regressions reach releases without e2e checks

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - no user-flow verification exists at all.
- **Residual:** LOW once smoke specs run in CI.
- **Status:** Open
- **Description:** The configured Playwright suite is empty, so playback, export, and persistence flows are unverified end to end.
- **Impact:** Broken user flows ship inside an otherwise green unit suite.
- **Trigger:** Any UI-affecting change before release.
- **Controls:** 258 unit/component cases cover logic below the [UI](#glossary) seam.
- **Mitigation:** Playwright specs for the six documented flows.
- **Closure:** The `test:e2e` script runs green on a release candidate.
- **Source:** [FND-CQY-002](#fnd-cqy-002-no-end-to-end-specs-exist-despite-configured-playwright)
- **Confidence:** HIGH - directory is verifiably empty.

### RSK-007: License policy non-conformance surfaces late

- **Severity:** LOW
- **Likelihood:** LOW - all observed classes are permissive.
- **Residual:** LOW.
- **Status:** Open
- **Description:** Resolved license classes exceed the declared whitelist and 219 packages are undeclared, so conformance is undecidable without manual review.
- **Impact:** A non-permissive class could enter unnoticed at a later bump.
- **Trigger:** A dependency or policy change without license review.
- **Controls:** Policy document exists and bars [GPL](#glossary).
- **Mitigation:** Reconcile the whitelist, add a manifest-level check.
- **Closure:** Resolved classes sit inside policy or the policy records them.
- **Source:** [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set)
- **Confidence:** MEDIUM.

### RSK-008: Dead test file implies coverage that does not run

- **Severity:** LOW
- **Likelihood:** MEDIUM - the file sits in the suite tree permanently.
- **Residual:** LOW.
- **Status:** Open
- **Description:** The extensionless suite is committed but never collected.
- **Impact:** MAX export regressions pass while the file suggests otherwise.
- **Trigger:** Any reader counting `test/utils/` files as running tests.
- **Controls:** A sibling `exportMax.test.ts` covers part of the surface.
- **Mitigation:** Rename or merge the file.
- **Closure:** The file is collected or removed.
- **Source:** [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)
- **Confidence:** HIGH.

### RSK-009: Tampered or mismatched binaries reach users unverified

- **Severity:** LOW
- **Likelihood:** LOW - requires artifact tampering or a bad mirror.
- **Residual:** LOW with published checksums.
- **Status:** Open
- **Description:** Unsigned artifacts ship with no checksums to verify against.
- **Impact:** A tampered binary installs with no user-visible signal.
- **Trigger:** Artifact substitution in transit or on a mirror.
- **Controls:** Distribution only via the project site.
- **Mitigation:** Publish per-release checksums, evaluate signing.
- **Closure:** Checksums published beside each artifact.
- **Source:** [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)
- **Confidence:** HIGH - configuration and notice inspected.

### RSK-010: Stale documented figures mislead change planning

- **Severity:** LOW
- **Likelihood:** MEDIUM - figures drift at each dependency bump.
- **Residual:** LOW.
- **Status:** Open
- **Description:** Version-pinned doc figures lag the manifest.
- **Impact:** Plans and audits built on stale stack claims.
- **Trigger:** Any version bump that skips the docs pass.
- **Controls:** The corpus is actively maintained otherwise.
- **Mitigation:** A per-release documentation refresh step.
- **Closure:** Documented figures match the manifest at release.
- **Source:** [FND-CQY-003](#fnd-cqy-003-documentation-figures-have-drifted-from-the-code)
- **Confidence:** HIGH.

### RSK-011: Device permission granted beyond the intended origin

- **Severity:** LOW
- **Likelihood:** LOW - only local content loads in production.
- **Residual:** LOW.
- **Status:** Open
- **Description:** `midi`/`midiSysex` grants are unconditional in the Electron permission handlers.
- **Impact:** Any content reaching the window inherits hardware [MIDI](#glossary) access.
- **Trigger:** A dependency or load path that reaches the window.
- **Controls:** `contextIsolation`, no remote content in production.
- **Mitigation:** Scope grants to the app origin, drop `midiSysex`.
- **Closure:** Handler checks origin before granting.
- **Source:** [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)
- **Confidence:** HIGH.

### RSK-012: Undisclosed generated code lands without trace

- **Severity:** LOW
- **Likelihood:** LOW - disclosure culture is established.
- **Residual:** LOW.
- **Status:** Open
- **Description:** [AI](#glossary) authorship is declared globally but not attributable per change.
- **Impact:** Provenance cannot be verified where it matters - at commit granularity.
- **Trigger:** Any AI-authored change without a marker.
- **Controls:** README declaration, prompt archives, originality rules.
- **Mitigation:** A per-change disclosure convention.
- **Closure:** Commits carry a provenance marker or the policy records why not.
- **Source:** [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)
- **Confidence:** MEDIUM.

### RSK-013: Song data lost on storage eviction or profile reset

- **Severity:** LOW
- **Likelihood:** LOW - eviction is uncommon in the Electron profile.
- **Residual:** MEDIUM without a redundant store.
- **Status:** Open
- **Description:** Compositions persist only to `localStorage`, which is evictable and clears with site data.
- **Impact:** Unsaved work is lost with no recovery path.
- **Trigger:** Quota pressure, profile reset, or cache clearing.
- **Controls:** Manual YAML export exists.
- **Mitigation:** Redundant persistence or save reminders.
- **Closure:** A second storage path or periodic export prompt exists.
- **Source:** [FND-CQY-008](#fnd-cqy-008-song-persistence-relies-solely-on-localstorage)
- **Confidence:** MEDIUM - durability loss plausible, not demonstrated.

## Actionable Remediation Roadmap

| Rec                                                                       | Priority        | Finding                                                                                          | Recommendation                                                 | Impact | Effort | Complexity | Verification                                               |
| ------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------ | ------ | ---------- | ---------------------------------------------------------- |
| [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths)      | [P1](#glossary) | [FND-INF-004](#fnd-inf-004-coverage-gate-is-documented-as-failing-and-unverified-in-source)      | Close the coverage gap on the highest-risk paths               | HIGH   | HIGH   | MEDIUM     | `test:coverage` meets 80 percent on all four               |
| [REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop)             | [P1](#glossary) | [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)     | Add a [CI](#glossary) workflow for the documented loop         | HIGH   | MEDIUM | LOW        | Workflow runs green on a pushed commit                     |
| [REC-003](#rec-003-version-the-service-worker-cache-per-build)            | [P2](#glossary) | [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)                | Version the service-worker cache per build                     | MEDIUM | LOW    | LOW        | Returning client loads only current assets                 |
| [REC-004](#rec-004-refresh-documented-figures-add-a-per-release-doc-pass) | [P2](#glossary) | [FND-CQY-003](#fnd-cqy-003-documentation-figures-have-drifted-from-the-code)                     | Refresh documented figures, add a per-release doc pass         | MEDIUM | LOW    | LOW        | Doc figures match manifest at next release                 |
| [REC-005](#rec-005-rename-or-merge-the-extensionless-test-file)           | [P2](#glossary) | [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)                       | Rename or merge the extensionless test file                    | MEDIUM | LOW    | LOW        | File is collected by `npm test`                            |
| [REC-006](#rec-006-add-a-playwright-smoke-suite-for-the-documented-flows) | [P2](#glossary) | [FND-CQY-002](#fnd-cqy-002-no-end-to-end-specs-exist-despite-configured-playwright)              | Add a Playwright smoke suite for the documented flows          | HIGH   | MEDIUM | MEDIUM     | `test:e2e` runs green                                      |
| [REC-007](#rec-007-stage-the-orchestrator-decomposition)                  | [P2](#glossary) | [FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk)   | Stage the orchestrator decomposition                           | HIGH   | HIGH   | HIGH       | Bounded units replace App-level wiring                     |
| [REC-008](#rec-008-harden-the-markdown-rendering-path)                    | [P2](#glossary) | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                 | Harden the markdown rendering path                             | MEDIUM | MEDIUM | MEDIUM     | [CSP](#glossary) present, sinks bounded to trusted content |
| [REC-009](#rec-009-scope-the-midi-permission-grant-to-the-app-origin)     | [P3](#glossary) | [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)         | Scope the [MIDI](#glossary) permission grant to the app origin | MEDIUM | LOW    | LOW        | Handler rejects grants from foreign origins                |
| [REC-010](#rec-010-reconcile-the-license-whitelist-with-the-resolved-set) | [P3](#glossary) | [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set)           | Reconcile the license whitelist with the resolved set          | MEDIUM | LOW    | LOW        | Resolved classes sit inside policy                         |
| [REC-011](#rec-011-record-the-zx0-attribution-in-copyrightsmd)            | [P3](#glossary) | [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file)   | Record the [ZX0](#glossary) attribution in `COPYRIGHTS.md`     | LOW    | LOW    | LOW        | Notice file names [ZX0](#glossary) and its license         |
| [REC-012](#rec-012-name-a-continuity-owner)                               | [P3](#glossary) | [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)                      | Name a continuity owner                                        | MEDIUM | LOW    | LOW        | Owner named with repository access                         |
| [REC-013](#rec-013-publish-release-checksums-then-evaluate-signing)       | [P3](#glossary) | [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)                           | Publish release checksums, then evaluate signing               | MEDIUM | MEDIUM | LOW        | Checksums published beside each artifact                   |
| [REC-014](#rec-014-adopt-a-per-change-ai-disclosure-convention)           | [P4](#glossary) | [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable) | Adopt a per-change AI-disclosure convention                    | LOW    | LOW    | LOW        | Commits carry the convention marker                        |
| [REC-015](#rec-015-align-test-naming-and-the-declared-convention)         | [P3](#glossary) | [FND-STR-001](#fnd-str-001-test-file-names-diverge-from-the-declared-test-name-convention)       | Align test naming and the declared convention                  | LOW    | LOW    | LOW        | Standard and filenames agree                               |
| [REC-016](#rec-016-add-reason-comments-or-remove-the-assertions)          | [P4](#glossary) | [FND-CQY-004](#fnd-cqy-004-non-null-assertions-lack-the-required-reason-comments)                | Add `REASON:` comments or remove the assertions                | LOW    | LOW    | LOW        | Every non-null assertion justified                         |
| [REC-017](#rec-017-remove-the-duplicated-numbered-comment)                | [P4](#glossary) | [FND-CQY-005](#fnd-cqy-005-numbered-and-duplicated-section-comment-in-usemidits)                 | Remove the duplicated numbered comment                         | LOW    | LOW    | LOW        | No forbidden comment shapes remain                         |
| [REC-018](#rec-018-adopt-the--alias-or-remove-it-from-config)             | [P4](#glossary) | [FND-CQY-006](#fnd-cqy-006-configured--import-alias-is-unused)                                   | Adopt the `@/` alias or remove it from config                  | LOW    | LOW    | LOW        | Alias used or config cleaned                               |
| [REC-019](#rec-019-untrack-testds_store)                                  | [P4](#glossary) | [FND-CQY-007](#fnd-cqy-007-os-artifact-testds_store-is-tracked)                                  | Untrack `test/.DS_Store`                                       | LOW    | LOW    | LOW        | `git ls-files` shows no OS artifacts                       |
| [REC-020](#rec-020-add-a-redundant-persistence-path-or-save-reminder)     | [P2](#glossary) | [FND-CQY-008](#fnd-cqy-008-song-persistence-relies-solely-on-localstorage)                       | Add a redundant persistence path or save reminder              | HIGH   | MEDIUM | MEDIUM     | Song survives a cleared localStorage                       |

### REC-001: Close the coverage gap on the highest-risk paths

- **Priority:** P1
- **Finding:** [FND-INF-004](#fnd-inf-004-coverage-gate-is-documented-as-failing-and-unverified-in-source)
- **Postcondition:** `npm run test:coverage` passes the 80 percent thresholds with results committed or gated.
- **Description:** Grow tests on parsing, export, and sequencer paths until the configured gate passes, then keep it enforced.
- **Impact:** Verified coverage floor on the riskiest logic.
- **Effort:** HIGH - the gap spans core modules.
- **Complexity:** MEDIUM - testable units exist, wiring the gate is simple.
- **Verification:** `npm run test:coverage` exits 0 with all four metrics at or above 80.

### REC-002: Add a CI workflow for the documented loop

- **Priority:** P1
- **Finding:** [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)
- **Postcondition:** A pipeline runs typecheck, lint, format check, build, and tests on every push.
- **Description:** Encode the `TESTING.md` loop in a workflow file so enforcement stops depending on local discipline.
- **Impact:** Regressions are caught at merge time.
- **Effort:** MEDIUM - scripts already exist, only the pipeline is missing.
- **Complexity:** LOW - standard Node CI shape.
- **Verification:** A pushed commit shows the workflow green end to end.

### REC-003: Version the service-worker cache per build

- **Priority:** P2
- **Finding:** [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)
- **Postcondition:** The cache name embeds the build version and stale caches are evicted on activate.
- **Description:** Derive `CACHE_NAME` from the app version or build hash so redeploys invalidate automatically.
- **Impact:** Returning users always receive the deployed build.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** A redeploy serves only current assets on a previously-visited client.

### REC-004: Refresh documented figures, add a per-release doc pass

- **Priority:** P2
- **Finding:** [FND-CQY-003](#fnd-cqy-003-documentation-figures-have-drifted-from-the-code)
- **Postcondition:** Version-pinned doc figures match the manifest at every release.
- **Description:** Correct the Electron version (and audit other pinned figures), then add a docs-refresh step to the bump procedure.
- **Impact:** Documents stay trustworthy.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** No declared stack version differs from `package.json` at release.

### REC-005: Rename or merge the extensionless test file

- **Priority:** P2
- **Finding:** [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)
- **Postcondition:** Every committed test artifact is collected by the runner.
- **Description:** Rename `exportMax.test` to `exportMax.test.ts` or fold its cases into the sibling suite.
- **Impact:** The MAX suite actually runs.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** `npm test` collects and runs the cases.

### REC-006: Add a Playwright smoke suite for the documented flows

- **Priority:** P2
- **Finding:** [FND-CQY-002](#fnd-cqy-002-no-end-to-end-specs-exist-despite-configured-playwright)
- **Postcondition:** The six `TESTING.md` flows exist as specs and `npm run test:e2e` is green.
- **Description:** Implement the documented e2e flows - launch, note entry, playback, instrument edit, export, save/load, theme - as Playwright specs.
- **Impact:** User-flow regressions are caught before release.
- **Effort:** MEDIUM.
- **Complexity:** MEDIUM - audio playback needs deterministic handling.
- **Verification:** `npm run test:e2e` exits 0 on a clean build.

### REC-007: Stage the orchestrator decomposition

- **Priority:** P2
- **Finding:** [FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk)
- **Postcondition:** App-level wiring is split into bounded domain containers with unchanged behavior.
- **Description:** Extract playback, instrument, modal, and file concerns into containers/hooks in staged slices, preserving the documented audio-timing constraints.
- **Impact:** Change blast radius shrinks per slice.
- **Effort:** HIGH - the file holds 30-plus states and cross-cutting effects.
- **Complexity:** HIGH - audio-critical paths must not regress.
- **Verification:** Each slice passes the full verification loop plus manual audio playback testing.

### REC-008: Harden the markdown rendering path

- **Priority:** P2
- **Finding:** [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)
- **Postcondition:** Rendering sinks carry a [CSP](#glossary) and a bounded content source.
- **Description:** Restrict sinks to first-party content, add a restrictive [CSP](#glossary) for the packaged app, or replace the custom renderer with a vetted sanitizer.
- **Impact:** The injection surface gains a second layer.
- **Effort:** MEDIUM.
- **Complexity:** MEDIUM - a strict [CSP](#glossary) must not break the app.
- **Verification:** A [CSP](#glossary) header/policy exists and markup outside the allowed grammar cannot reach the [DOM](#glossary).

### REC-009: Scope the MIDI permission grant to the app origin

- **Priority:** P3
- **Finding:** [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)
- **Postcondition:** The handler grants `midi` only for the app's own origin and never `midiSysex`.
- **Description:** Check the requesting origin/frame in both permission handlers and drop the unused sysex grant.
- **Impact:** Device access matches the app's actual surface.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** A foreign origin's permission request is denied.

### REC-010: Reconcile the license whitelist with the resolved set

- **Priority:** P3
- **Finding:** [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set)
- **Postcondition:** Every resolved license class is inside policy or the policy names it deliberately.
- **Description:** Add the observed permissive classes (BlueOak, CC-BY, CC0, [WTFPL](#glossary), MIT-0) to the whitelist or require a review for undeclared-license packages.
- **Impact:** Policy becomes decidable against the actual tree.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** A lockfile census shows zero classes outside policy.

### REC-011: Record the ZX0 attribution in `COPYRIGHTS.md`

- **Priority:** P3
- **Finding:** [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file)
- **Postcondition:** `COPYRIGHTS.md` names the [ZX0](#glossary) port, its author, and BSD-3-Clause.
- **Description:** Add the attribution the project's own rule requires.
- **Impact:** The central notice matches reality.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** `COPYRIGHTS.md` contains the [ZX0](#glossary) entry.

### REC-012: Name a continuity owner

- **Priority:** P3
- **Finding:** [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)
- **Postcondition:** A second person holds repository access and an onboarding record exists.
- **Description:** Designate a backup maintainer and capture the audio-tuning rationale as runbook notes.
- **Impact:** Delivery survives maintainer unavailability.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** The owner is named in project documentation.

### REC-013: Publish release checksums, then evaluate signing

- **Priority:** P3
- **Finding:** [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)
- **Postcondition:** Each published artifact carries a checksum, signing is evaluated.
- **Description:** Generate SHA-256 checksums at build time and publish them beside the DMG/NSIS/AppImage files.
- **Impact:** Users can verify artifact integrity.
- **Effort:** MEDIUM.
- **Complexity:** LOW.
- **Verification:** A checksum file verifies against each release artifact.

### REC-014: Adopt a per-change AI-disclosure convention

- **Priority:** P4
- **Finding:** [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)
- **Postcondition:** AI-authored changes are attributable at commit granularity.
- **Description:** Add a commit-trailer or change-request field marking AI-assisted work.
- **Impact:** Provenance becomes measurable.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Recent commits carry the marker or the policy records the convention.

### REC-015: Align test naming and the declared convention

- **Priority:** P3
- **Finding:** [FND-STR-001](#fnd-str-001-test-file-names-diverge-from-the-declared-test-name-convention)
- **Postcondition:** The standard, `GUIDELINES.md`, and filenames state one convention.
- **Description:** Amend the standard to camelCase test names (matching practice) or rename files, resolve the two-document conflict.
- **Impact:** The naming rule is enforceable again.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** No filename disagrees with the governing document.

### REC-016: Add `REASON:` comments or remove the assertions

- **Priority:** P4
- **Finding:** [FND-CQY-004](#fnd-cqy-004-non-null-assertions-lack-the-required-reason-comments)
- **Postcondition:** Every non-null assertion carries `REASON:` or is eliminated.
- **Description:** Justify or remove the three bare assertions.
- **Impact:** Escape hatches keep their audit trail.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Census returns zero uncommented assertions.

### REC-017: Remove the duplicated numbered comment

- **Priority:** P4
- **Finding:** [FND-CQY-005](#fnd-cqy-005-numbered-and-duplicated-section-comment-in-usemidits)
- **Postcondition:** No numbered or section-restating comments remain.
- **Description:** Delete the `// 2. Configuration Management` pair in `useMidi.ts`.
- **Impact:** Comment policy is fully honored.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Grep finds no numbered section markers.

### REC-018: Adopt the `@/` alias or remove it from config

- **Priority:** P4
- **Finding:** [FND-CQY-006](#fnd-cqy-006-configured--import-alias-is-unused)
- **Postcondition:** The alias is either used conventionally or deleted.
- **Description:** Migrate imports to `@/` per the standard, or remove the alias and amend the standard.
- **Impact:** Declared convention matches reality.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Alias usage exists or the config no longer declares it.

### REC-019: Untrack `test/.DS_Store`

- **Priority:** P4
- **Finding:** [FND-CQY-007](#fnd-cqy-007-os-artifact-testds_store-is-tracked)
- **Postcondition:** No OS artifacts are committed.
- **Description:** `git rm --cached` the file, it is already ignored for the future.
- **Impact:** Tree hygiene.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** `git ls-files` shows no `.DS_Store`.

### REC-020: Add a redundant persistence path or save reminder

- **Priority:** P2
- **Finding:** [FND-CQY-008](#fnd-cqy-008-song-persistence-relies-solely-on-localstorage)
- **Postcondition:** Song data survives a cleared `localStorage`.
- **Description:** Add periodic export reminders, File System Access persistence, or IndexedDB mirroring with an export path.
- **Impact:** Composition loss risk drops.
- **Effort:** MEDIUM.
- **Complexity:** MEDIUM - UX must stay unobtrusive.
- **Verification:** A cleared store leaves recoverable song data.

## Recommendation Classification

| Rec                                                                       | Recommendation                                                 | Class       | Basis                              |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------- | ---------------------------------- |
| [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths)      | Close the coverage gap on the highest-risk paths               | Recommended | Blocks readiness gate              |
| [REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop)             | Add a [CI](#glossary) workflow for the documented loop         | Recommended | Blocks readiness gate              |
| [REC-003](#rec-003-version-the-service-worker-cache-per-build)            | Version the service-worker cache per build                     | Recommended | Correctness of delivery            |
| [REC-004](#rec-004-refresh-documented-figures-add-a-per-release-doc-pass) | Refresh documented figures, add a per-release doc pass         | Recommended | Cheap, recurring value             |
| [REC-005](#rec-005-rename-or-merge-the-extensionless-test-file)           | Rename or merge the extensionless test file                    | Recommended | Trivial fix for masked coverage    |
| [REC-006](#rec-006-add-a-playwright-smoke-suite-for-the-documented-flows) | Add a Playwright smoke suite for the documented flows          | Recommended | Documents already demand it        |
| [REC-007](#rec-007-stage-the-orchestrator-decomposition)                  | Stage the orchestrator decomposition                           | Recommended | Largest maintainability win        |
| [REC-008](#rec-008-harden-the-markdown-rendering-path)                    | Harden the markdown rendering path                             | Recommended | Layered control for a live sink    |
| [REC-009](#rec-009-scope-the-midi-permission-grant-to-the-app-origin)     | Scope the [MIDI](#glossary) permission grant to the app origin | Recommended | Cheap principle-of-least-privilege |
| [REC-010](#rec-010-reconcile-the-license-whitelist-with-the-resolved-set) | Reconcile the license whitelist with the resolved set          | Recommended | Policy conformance                 |
| [REC-011](#rec-011-record-the-zx0-attribution-in-copyrightsmd)            | Record the [ZX0](#glossary) attribution in `COPYRIGHTS.md`     | Recommended | Own rule requires it               |
| [REC-012](#rec-012-name-a-continuity-owner)                               | Name a continuity owner                                        | Optional    | Organizational, not code           |
| [REC-013](#rec-013-publish-release-checksums-then-evaluate-signing)       | Publish release checksums, then evaluate signing               | Recommended | Integrity evidence for users       |
| [REC-014](#rec-014-adopt-a-per-change-ai-disclosure-convention)           | Adopt a per-change AI-disclosure convention                    | Optional    | Provenance hygiene                 |
| [REC-015](#rec-015-align-test-naming-and-the-declared-convention)         | Align test naming and the declared convention                  | Recommended | Resolves doc conflict              |
| [REC-016](#rec-016-add-reason-comments-or-remove-the-assertions)          | Add `REASON:` comments or remove the assertions                | Optional    | Style conformance                  |
| [REC-017](#rec-017-remove-the-duplicated-numbered-comment)                | Remove the duplicated numbered comment                         | Optional    | Style conformance                  |
| [REC-018](#rec-018-adopt-the--alias-or-remove-it-from-config)             | Adopt the `@/` alias or remove it from config                  | Optional    | Convention cleanup                 |
| [REC-019](#rec-019-untrack-testds_store)                                  | Untrack `test/.DS_Store`                                       | Recommended | Trivial hygiene                    |
| [REC-020](#rec-020-add-a-redundant-persistence-path-or-save-reminder)     | Add a redundant persistence path or save reminder              | Recommended | Protects user data                 |

## Scope Exclusions

- **Dynamic/runtime penetration testing** - `NOT PERFORMED` by default. No live exploitation was attempted, security findings carry source-level evidence only. A scoped penetration test is a separately commissioned engagement.

- **Organizational and team interviews, business-fit assessment** - `NOT PERFORMED` by default. The report covers engineering dimensions of technical due diligence, not the interview-based pillars.

- **Compliance certification and attestation** - the report is not an [ISO/IEC](#glossary) 27001 certification, not a [SOC](#glossary) 2 attestation, and not a PCI-DSS conformance assessment. Referenced standards serve as scoring rubrics and coverage checklists only.

- **Live deployment environment** - `NOT INSPECTED`. No hosted runtime, server, or production environment exists to inspect, the Electron shell and static hosting config were assessed at source level.

- **`docs/change/`, `docs/plan/`, `docs/archive/`, `docs/refactoring/`, `docs/feature/`, `docs/prompt/`** - `EXCLUDED BY SCOPE` per `docs/GUIDELINES.md`, enumerated at directory level only, contents unread. `docs/report/` was read only for earlier report files and external reports.

- **OWASP Top 10 (2025) coverage statement** - assessed at source level: A03 Injection (markdown sinks), A05 Security Misconfiguration (permission grants, cache). `NOT ASSESSED` by scope: A01, A02, A04, A06-A10 - a local desktop app carries no server-side auth, session, or SSRF surface, and no dynamic verification ran.

- **Omitted conditional sections** - API Contract Conformance (no [API](#glossary) exposed or consumed), Skill Definition Conformance (no `SKILL.md` or agent-skill artifacts), AI System Assessment (no [AI](#glossary) components), API Compatibility & Versioning Discipline (application, not a reusable library), the prior-report comparison section (a fresh audit was requested), Executed Evidence Log (source-only mode).

## Limitations and Unknowns

| Item                               | Type        | Reason                                         | Resolution                                                                                         |
| ---------------------------------- | ----------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Verification loop execution        | Unrun check | Requires execution, out of audit scope         | `npm run typecheck && npm run lint && npm run build && npm test`                                   |
| Coverage measurement               | Unrun check | Requires execution, documented as failing      | `npm run test:coverage`                                                                            |
| End-to-end suite                   | Unrun check | No specs exist to run                          | `npm run test:e2e` after [REC-006](#rec-006-add-a-playwright-smoke-suite-for-the-documented-flows) |
| Dependency advisory scan           | Unrun check | Requires network/execution, out of audit scope | `npm audit`                                                                                        |
| Audio timing behavior              | Unknown     | Runtime property, no execution                 | Manual playback test on real hardware                                                              |
| Actual license obligations         | Unknown     | 219 undeclared packages                        | Per-package declaration review                                                                     |
| Injection exploitability           | Unknown     | Theoretical only, no runtime validation        | Scoped penetration test                                                                            |
| [DORA](#glossary) delivery metrics | Unknown     | No tags, incidents, or lead-time data          | Release tagging practice                                                                           |
| Readiness cost                     | Unknown     | No effort, staffing, or rate inputs            | Stakeholder-supplied estimates                                                                     |

## Operator Verification Handoff

| Claim                                 | Command / Procedure                                              | Pass Criteria                           | Resolves                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Verification loop is green            | `npm run typecheck && npm run lint && npm run build && npm test` | Zero errors and zero warnings           | [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop) |
| Coverage gate passes                  | `npm run test:coverage`                                          | All four metrics at or above 80 percent | [FND-INF-004](#fnd-inf-004-coverage-gate-is-documented-as-failing-and-unverified-in-source)  |
| Dead test file collected              | `npm test -- test/utils/exportMax`                               | Suite lists the file's cases            | [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)                   |
| e2e flows pass                        | `npm run test:e2e`                                               | All specs green                         | [FND-CQY-002](#fnd-cqy-002-no-end-to-end-specs-exist-despite-configured-playwright)          |
| Service worker serves fresh assets    | Deploy, reload a returning client                                | Only current assets served              | [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)            |
| Markdown sinks reject injected markup | Render a hostile fixture through the path                        | No script execution                     | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)             |
| Permission grant respects origin      | Request `midi` from a foreign origin                             | Request denied                          | [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)     |
| Dependency vulnerabilities            | `npm audit`                                                      | No unmitigated advisories               | [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-set)       |
| Persistence survives storage clearing | Clear localStorage, relaunch                                     | Song data recoverable                   | [FND-CQY-008](#fnd-cqy-008-song-persistence-relies-solely-on-localstorage)                   |

## Re-audit And Follow-up Plan

| Finding                                                                                        | Priority        | Verification Owner | Closure Evidence                           | Target Re-audit Trigger |
| ---------------------------------------------------------------------------------------------- | --------------- | ------------------ | ------------------------------------------ | ----------------------- |
| [FND-INF-004](#fnd-inf-004-coverage-gate-is-documented-as-failing-and-unverified-in-source)    | [P1](#glossary) | NOT SPECIFIED      | Passing coverage run output                | Next release            |
| [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)   | [P1](#glossary) | NOT SPECIFIED      | Workflow file plus green run               | Next release            |
| [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)              | [P2](#glossary) | NOT SPECIFIED      | Versioned cache in `sw.js`                 | Next release            |
| [FND-CQY-003](#fnd-cqy-003-documentation-figures-have-drifted-from-the-code)                   | [P2](#glossary) | NOT SPECIFIED      | Doc figures matching manifest              | Next release            |
| [FND-CQY-001](#fnd-cqy-001-tracked-extensionless-test-file-never-executes)                     | [P2](#glossary) | NOT SPECIFIED      | Collected test file                        | Next release            |
| [FND-CQY-002](#fnd-cqy-002-no-end-to-end-specs-exist-despite-configured-playwright)            | [P2](#glossary) | NOT SPECIFIED      | Passing e2e suite                          | Next release            |
| [FND-ARC-001](#fnd-arc-001-2640-line-central-orchestrator-concentrates-wiring-and-change-risk) | [P2](#glossary) | NOT SPECIFIED      | Decomposed orchestrator below bounded size | Next release            |
| [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)               | [P2](#glossary) | NOT SPECIFIED      | [CSP](#glossary) plus bounded sink sources | Next release            |
| [FND-CQY-008](#fnd-cqy-008-song-persistence-relies-solely-on-localstorage)                     | [P2](#glossary) | NOT SPECIFIED      | Redundant persistence path                 | Next release            |

Sign-off gates: production sign-off stays pending until [RSK-001](#rsk-001-regressions-merge-undetected-without-ci-enforcement) and [RSK-002](#rsk-002-redeploys-serve-stale-or-skewed-web-assets) close with verified
evidence, no `RSK` is Closed in this revision.

A manifest or lockfile change triggers an SBOM-drift re-audit.

A `HIGH` or `CRITICAL` network-facing finding remaining `Theoretical` after remediation planning
triggers a scoped live penetration test - none currently qualifies.

## Validation Record

| Check            | Result           | Evidence / Justification                                                                                                                                                                                                       |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PAR-1            | APPLIED          | Both SEC findings carry weakness context (CWE-79-adjacent surface, unscoped device grant)                                                                                                                                      |
| PAR-2            | APPLIED          | Severity-matrix note present under methodology and risk register                                                                                                                                                               |
| PAR-3            | APPLIED          | [ISO/IEC](#glossary) 25010:2023 crosswalk rendered as coverage mapping, not conformance                                                                                                                                        |
| PAR-4            | APPLIED          | [TDR](#tdr-debt-identifier) separates remediation cost from cost of delay                                                                                                                                                      |
| PAR-5            | APPLIED          | EVD-002/EVD-003 git census surfaced as Team & Continuity                                                                                                                                                                       |
| PAR-6            | APPLIED          | Lockfile-derived inventory produced at EVD-006/EVD-007                                                                                                                                                                         |
| PAR-7            | APPLIED          | Limitations and Unknowns lists every unrun check                                                                                                                                                                               |
| PAR-8            | APPLIED          | This self-check table enumerates all checks                                                                                                                                                                                    |
| PAR-9            | APPLIED          | Standards re-derived for the React/TypeScript/Electron stack and project's own T1 docs                                                                                                                                         |
| PAR-10           | APPLIED          | Glossary indexes the acronyms used, body occurrences link to it                                                                                                                                                                |
| PAR-11           | APPLIED          | Coverage matrix present after Document Information, consistent with Scope Exclusions                                                                                                                                           |
| PAR-12           | APPLIED          | Every [SBOM](#glossary) row carries a license or `Unknown`                                                                                                                                                                     |
| PAR-13           | APPLIED          | Every ledger row and every finding carries an Observation or Concern tag                                                                                                                                                       |
| PAR-14           | APPLIED          | No HIGH or CRITICAL Security finding exists, Exploitability fields omitted per contract                                                                                                                                        |
| PAR-15           | APPLIED          | Delivery section present, [DORA](#glossary) proxies `NOT SPECIFIED`, concentration rated High                                                                                                                                  |
| PAR-16           | [N/A](#glossary) | Report language is English, single-language output                                                                                                                                                                             |
| PAR-17           | APPLIED          | Agent Guidance Conformance inventories the guidance artifacts and baselines                                                                                                                                                    |
| PAR-18           | APPLIED          | Recommendation Classification lists every [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths) through [REC-020](#rec-020-add-a-redundant-persistence-path-or-save-reminder) exactly once                      |
| PAR-19           | APPLIED          | Guidance-set topology assessed in Agent Guidance Conformance                                                                                                                                                                   |
| PAR-20           | APPLIED          | Structure Review carries the five verdict rows                                                                                                                                                                                 |
| PAR-21           | APPLIED          | Code Style present with resolved tiers per partition                                                                                                                                                                           |
| PAR-22           | APPLIED          | Style findings quantify and cite `file:line` anchors                                                                                                                                                                           |
| PAR-23           | APPLIED          | Style judgements cite resolved tiers (T1/T3) and census denominators                                                                                                                                                           |
| PAR-24           | APPLIED          | Naming-quality judgements carry MEDIUM or lower confidence                                                                                                                                                                     |
| PAR-25           | APPLIED          | Census excludes `dist/`, `release/`, `node_modules/`, `coverage/`                                                                                                                                                              |
| PAR-26           | APPLIED          | No bulk-rename recommendation for ecosystem purity alone                                                                                                                                                                       |
| PAR-27           | APPLIED          | Linters/formatters appear only as `NOT RUN` rows or Method suggestions                                                                                                                                                         |
| Cross-references | APPLIED          | Every [RSK](#rsk-risk-identifier) cites a defined [FND](#fnd-finding-identifier), every [REC](#rec-recommendation-identifier) cites a defined [FND](#fnd-finding-identifier), every [TDR](#tdr-debt-identifier) cites a source |
| Criterion refs   | APPLIED          | Every finding's Criterion resolves to a declared criteria-table row                                                                                                                                                            |
| Count checks     | APPLIED          | 20 findings, 13 risks, 20 recommendations, 3 debt items reconcile across tables                                                                                                                                                |
| Conditional      | APPLIED          | Every conditional section evaluated, omissions justified in Scope Exclusions                                                                                                                                                   |
| Formatting       | APPLIED          | Headings at `###` maximum, tables script-aligned, no semicolons in prose                                                                                                                                                       |
| Parity baseline  | APPLIED          | Capability set diffed against `docs/report/1.2.8/AUDIT-1.1.md` revision 1.1 - all its capabilities applied or justified here                                                                                                   |

## References

| Reference                                               | Publisher or Author          | Used In                                   |
| ------------------------------------------------------- | ---------------------------- | ----------------------------------------- |
| Project's own documentation set                         | dosound-tracker              | Standards, Baseline, Guidance conformance |
| Agent Skills / Lens bundled stack digests               | lens-skill corpus            | Engineering Baseline, Code Style          |
| [ISO/IEC](#glossary) 25010:2023 quality model           | [ISO/IEC](#glossary)         | Scoring Rubrics crosswalk                 |
| OWASP Top 10 (2025)                                     | [OWASP](#glossary)           | Scope Exclusions coverage statement       |
| [DORA](#glossary) software delivery performance metrics | [DORA](#glossary) (dora.dev) | Delivery Practice & Team Continuity       |
| [ZX0](#glossary) / Salvador reference implementation    | Einar Saukas                 | License Compliance Review                 |
| Electron security guidance                              | OpenJS / Electron project    | Desktop shell assessment                  |
| [CISQ/SQALE](#glossary) technical-debt cost model       | [CISQ](#glossary)            | Technical Debt Register                   |

[dosound-tracker repository](https://github.com/zoltraks/dosound-tracker)

[ISO/IEC 25010](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010)

[OWASP Top 10](https://owasp.org/Top10/)

[DORA metrics](https://dora.dev/)

[ZX0 compressor](https://github.com/einar-saukas/ZX0)

[Electron security](https://www.electronjs.org/docs/latest/tutorial/security)

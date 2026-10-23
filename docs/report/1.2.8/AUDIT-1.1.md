# dosound-tracker - Lens audit report

## Document Information

| Field              | Value                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Report Revision    | 1.1                                                                                                |
| Report Date        | 2026-10-21                                                                                         |
| Report Style       | audit                                                                                              |
| Detail Level       | Detailed                                                                                           |
| Evaluation Scale   | 1-10                                                                                               |
| Language           | English                                                                                            |
| Audit Purpose      | engineering improvement                                                                            |
| Target Environment | Desktop application via Electron, browser single-page application on static hosting, Web Audio API |
| Verification Scope | static repository analysis (code, configuration, documentation, git history) - no execution        |
| Evidence Mode      | source-only                                                                                        |
| Subject Revision   | `f898dce228db86c1e98130ec2c9dbbe3430de841`                                                         |
| Dirty-Tree State   | `?? docs/report/1.2.8/` report directory (untracked, contains this report and `AUDIT-1.0.md`)      |
| Previous Report    | `docs/report/1.2.8/AUDIT-1.0.md`                                                                   |
| Skill Version      | 2.3.6                                                                                              |

## Audit Type Coverage

| Report type                                       | Status    | Rationale                                                                                                            |
| ------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| Software Architecture Review                      | Covered   | Structure, layering, state domains, and data flow were inspected from source and architecture documents              |
| Code Quality Audit                                | Covered   | Source files, configuration, tests, and documented standards were inspected                                          |
| Security Vulnerability Assessment                 | Covered   | Electron boundary, [HTML](#glossary) rendering sinks, file parsing, and permission handling assessed at source level |
| Open Source License Compliance Review             | Covered   | License file, policy document, ported-component attribution, and lockfile license fields inspected                   |
| Penetration Test                                  | Not done  | Source-only audit, live exploitation is a separately commissioned engagement                                         |
| Performance Audit                                 | Partially | Timing design and stated targets inspected, no load or latency measurement performed                                 |
| Cloud Infrastructure Audit                        | Partially | Static hosting guidance and packaging configuration inspected, no live environment state available                   |
| Technical Due Diligence                           | Partially | Engineering and delivery dimensions covered, business inputs not supplied                                            |
| [SBOM](#glossary) / Software Composition Analysis | Covered   | Manifest-derived inventory produced from `package.json` and `package-lock.json`                                      |
| [ISO/IEC](#glossary) 27001 Certification          | Not done  | The standard is not assessed, no certification claim is made                                                         |
| [SOC](#glossary) 2 Attestation Examination        | Not done  | The framework is not assessed, no attestation claim is made                                                          |

## Glossary

| Term    | Definition                                                                |
| ------- | ------------------------------------------------------------------------- |
| ADR     | Architecture Decision Record, a recorded design decision                  |
| AI      | Artificial Intelligence                                                   |
| API     | Application Programming Interface                                         |
| ASCII   | American Standard Code for Information Interchange                        |
| ASVS    | OWASP Application Security Verification Standard                          |
| BSD     | Berkeley Software Distribution license family                             |
| CI      | Continuous Integration                                                    |
| CI/CD   | Continuous Integration and Continuous Delivery or Deployment              |
| CISQ    | Consortium for Information and Software Quality                           |
| CSP     | Content Security Policy                                                   |
| CSS     | Cascading Style Sheets                                                    |
| CVSS    | Common Vulnerability Scoring System                                       |
| CWE     | Common Weakness Enumeration                                               |
| DFD     | Data Flow Diagram                                                         |
| DOM     | Document Object Model                                                     |
| DORA    | DevOps Research and Assessment                                            |
| E2E     | End-to-End testing                                                        |
| ESM     | ECMAScript module format, contrasted with CommonJS                        |
| EVD     | Evidence identifier used by this report                                   |
| FND     | Finding identifier, pillar-prefixed, used by this report                  |
| GPL     | GNU General Public License, the copyleft class the project policy bars    |
| HMR     | Hot Module Replacement                                                    |
| HTML    | HyperText Markup Language                                                 |
| HTTP(S) | HyperText Transfer Protocol, optionally over TLS                          |
| IP      | Intellectual Property                                                     |
| IPC     | Inter-Process Communication                                               |
| ISC     | Internet Software Consortium (license name)                               |
| ISO     | International Organization for Standardization                            |
| JSON    | JavaScript Object Notation                                                |
| LFSR    | Linear Feedback Shift Register                                            |
| MIDI    | Musical Instrument Digital Interface                                      |
| MIT     | Massachusetts Institute of Technology license family                      |
| N/A     | Not applicable status token                                               |
| NFR     | Non-Functional Requirement                                                |
| NIST    | National Institute of Standards and Technology                            |
| NSIS    | Nullsoft Scriptable Install System, a Windows installer format            |
| OS      | Operating System                                                          |
| OWASP   | Open Worldwide Application Security Project                               |
| P1-P4   | Recommendation priorities, P1 highest to P4 lowest                        |
| PAR     | Parity-checklist row identifier                                           |
| PSG     | Programmable Sound Generator, the sound-chip class the project emulates   |
| PWA     | Progressive Web Application                                               |
| REC     | Recommendation identifier                                                 |
| RPO     | Recovery Point Objective                                                  |
| RSK     | Risk identifier                                                           |
| RTO     | Recovery Time Objective                                                   |
| SBOM    | Software Bill of Materials                                                |
| SDLC    | Software Development Life Cycle                                           |
| SLO     | Service Level Objective                                                   |
| SOC     | System and Organization Controls                                          |
| SPA     | Single-Page Application                                                   |
| SPDX    | Software Package Data Exchange, a license and inventory identifier format |
| SSDF    | Secure Software Development Framework                                     |
| STRIDE  | Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation  |
| TDR     | Technical Debt Register                                                   |
| TLS     | Transport Layer Security                                                  |
| TOS     | The Operating System of the Atari ST                                      |
| UI      | User Interface                                                            |
| URL     | Uniform Resource Locator                                                  |
| UTC     | Coordinated Universal Time                                                |
| UX      | User Experience                                                           |
| VGM     | Video Game Music, a sound-logging file format                             |
| WAV     | Waveform Audio File Format                                                |
| WTFPL   | Permissive public-domain-equivalent license                               |
| XBIOS   | Extended BIOS, the Atari ST low-level system interface                    |
| YAML    | YAML Ain't Markup Language                                                |
| YM2149  | The Yamaha sound-chip model the project emulates                          |
| ZX0     | The compression format and algorithm family used by the MAX exporter      |

**Identifier triplets**

| Triplet | Scope            | Description                              |
| ------- | ---------------- | ---------------------------------------- |
| `FND`   | This report      | Finding identifier                       |
| `EVD`   | This report      | Evidence ledger identifier               |
| `TDR`   | This report      | Technical Debt Register entry identifier |
| `RSK`   | This report      | Unified Risk Register entry identifier   |
| `REC`   | This report      | Remediation roadmap entry identifier     |
| `PAR`   | This report      | Validation Record checklist identifier   |
| `ARC`   | FND pillar       | Architecture & Design findings           |
| `CQY`   | FND pillar       | Code Quality findings                    |
| `SEC`   | FND pillar       | Security & Compliance findings           |
| `INF`   | FND pillar       | Infrastructure & CI/CD findings          |
| `AIP`   | FND pillar       | AI Provenance & Code Origin findings     |
| `CPR`   | FND pillar       | Copyrights & Originality findings        |
| `STR`   | FND pillar       | Structure & Organization findings        |
| `FNC`   | Criterion family | Functional completeness and correctness  |
| `TST`   | Criterion family | Testing and pipeline coverage            |
| `STY`   | Criterion family | In-code naming, style, readability       |
| `DEP`   | Criterion family | Dependencies and delivery pipeline       |
| `DLY`   | Criterion family | Delivery practice and continuity         |
| `MNT`   | Criterion family | Maintainability and documentation sync   |

## Executive Summary

`1-10` scale: `1-3 Poor · 4-6 Average · 7-8 Good · 9-10 Excellent`

| Field          | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| System type    | codebase                                                                                    |
| Scope          | Full source tree, configuration, documentation, tests, git history of dosound-tracker 1.2.8 |
| Source basis   | inspected code, configuration, documentation, and Git history                               |
| Maturity level | Pre-production                                                                              |
| Overall score  | 6.2/10 (Average, near the Good band boundary)                                               |

Lowest-scoring dimensions: Testability 4/10, Delivery & Continuity 4/10.

DOSOUND Tracker is a browser and desktop chiptune tracker that emulates the [YM2149](#glossary) sound chip
and exports songs to Atari ST assembly, [VGM](#glossary), [WAV](#glossary), and a compressed MAX binary format.

The codebase shows disciplined engineering: strict TypeScript, typed linting, a documented
verification loop, a layered export pipeline, and unusually thorough change documentation.

The dominant gaps are verification depth and delivery infrastructure: the documented coverage
gate is self-declared as failing, no continuous-integration automation exists, and no git tags
or release anchors exist in the repository.

One contributor accounts for all 679 non-merge commits, giving a `High` contributor-concentration
rating.

This report covers the engineering audit types.

No penetration test or compliance certification was performed.

License-classification found no copyleft conflict: all declared dependency licenses are
permissive-class, and 222 of 590 resolved components carry no declared license in the lockfile.

**Coverage and risk flags**

Thirteen risks were registered.

none rates CRITICAL or HIGH on the residual scale.

Six rate MEDIUM, two of them carrying HIGH impact at LOW likelihood (single-maintainer concentration, markdown-injection surface).

The audit found no CRITICAL findings and no HIGH-severity security findings.

**Production Readiness Threshold**

`Production-ready` would require the documented verification loop to pass with current evidence:
`npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` green on the audited revision,
`npm run test:coverage` meeting the 80 percent thresholds declared in `vitest.config.ts`, and the
stale-asset delivery defect behind [RSK-002](#rsk-002-redeploys-serve-stale-or-skewed-web-assets) closed with a verified fix.

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
continuous-integration gate ([REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop)), and decomposing the 2488-line central orchestrator
([REC-007](#rec-007-stage-the-orchestrator-decomposition)).

## Changes Since Previous Audit

| Field            | Previous Report                                                                        | Current Report                   |
| ---------------- | -------------------------------------------------------------------------------------- | -------------------------------- |
| File             | `docs/report/1.2.8/AUDIT-1.0.md`                                                       | `docs/report/1.2.8/AUDIT-1.1.md` |
| Revision         | 1.0                                                                                    | 1.1                              |
| Date             | 2026-09-30                                                                             | 2026-10-21                       |
| Detail level     | Detailed                                                                               | Detailed                         |
| Evaluation scale | 1-10                                                                                   | 1-10                             |
| Baseline record  | 2064 lines, SHA-256 `e6a57db12a8174cee2f01c5131e5f5bccc45d83aaeed6f67bae897011cbaf429` | n/a                              |

The subject revision is unchanged (`f898dce`), so this is a re-audit of the same code under a newer skill version (1.8 to 2.3.6), not a code-change audit.

Capability changes between the versions: the scorecard gained `Code Style` and `Structure` dimensions, the report gained `Structure Review`, `Structure Conformance`, `Code Style`, `Skill Definition Conformance`, `Operator Verification Handoff`, and `Changes Since Previous Audit` sections, `License & IP Compliance Review` was renamed `License Compliance Review`, findings gained `Criterion`, `Runtime confirmed`, and `Breaking change` fields, and the parity checklist grew from [PAR-1](#validation-record) through [PAR-18](#validation-record) to [PAR-1](#validation-record) through [PAR-27](#validation-record).

**Previous-report correction**

AUDIT-1.0 stated an overall score of `80 / 15 = 5.3`, but its own dimension table sums to `86 / 15 = 5.7`.

The 5.3 figure was an arithmetic error in the previous report, not a subject property, and is corrected here by recomputation ([EVD-054](#verification-and-evidence-ledger)).

**Finding transitions**

| Finding                                                                                           | Previous | Current | Note                                                                                                                        |
| ------------------------------------------------------------------------------------------------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| [FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)    | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)                       | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin)        | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-CQY-002](#fnd-cqy-002-tracked-duplicate-test-file-never-executes)                            | OPEN     | OPEN    | still reproduces, related new finding [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects) |
| [FND-CQY-003](#fnd-cqy-003-no-end-to-end-specs-exist-despite-configured-playwright)               | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)                      | OPEN     | OPEN    | still reproduces, `src/utils` count also stale (43 vs actual 42)                                                            |
| [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                  | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)          | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)      | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)                 | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)                            | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)  | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set) | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file)    | OPEN     | OPEN    | still reproduces, subject revision unchanged                                                                                |
| [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)             | -        | NEW     | first reported under the expanded structure assessment                                                                      |
| [FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard)          | -        | NEW     | first reported under the expanded code-style assessment                                                                     |
| [FND-CQY-006](#fnd-cqy-006-non-null-assertions-lack-the-required-reason-comments)                 | -        | NEW     | first reported under the expanded code-style assessment                                                                     |
| [FND-CQY-007](#fnd-cqy-007-numbered-and-duplicated-section-comment-in-usemidits)                  | -        | NEW     | first reported under the expanded code-style assessment                                                                     |
| [FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused)                                    | -        | NEW     | first reported under the expanded code-style assessment                                                                     |

**Score delta**

| Dimension               | Previous         | Current          | Direction |
| ----------------------- | ---------------- | ---------------- | --------- |
| Testability             | 4/10             | 4/10             | UNCHANGED |
| Design Soundness        | 6/10             | 6/10             | UNCHANGED |
| Code Quality            | 7/10             | 7/10             | UNCHANGED |
| Code Style              | -                | 7/10             | NEW       |
| Stack Alignment         | 7/10             | 7/10             | UNCHANGED |
| Dependency Health       | 5/10             | 5/10             | UNCHANGED |
| Maintainability         | 6/10             | 6/10             | UNCHANGED |
| Structure               | -                | 6/10             | NEW       |
| Deployability           | 5/10             | 5/10             | UNCHANGED |
| Scalability             | 6/10             | 6/10             | UNCHANGED |
| Security                | 6/10             | 6/10             | UNCHANGED |
| Compliance              | 6/10             | 6/10             | UNCHANGED |
| Observability           | 5/10             | 5/10             | UNCHANGED |
| Operational Safety      | 5/10             | 5/10             | UNCHANGED |
| Delivery & Continuity   | 4/10             | 4/10             | UNCHANGED |
| AI Provenance           | 7/10             | 7/10             | UNCHANGED |
| Originality & Licensing | 7/10             | 7/10             | UNCHANGED |
| Skill Definition        | [N/A](#glossary) | 7/10             | NEW       |
| API Compatibility       | [N/A](#glossary) | [N/A](#glossary) | UNCHANGED |

No product finding changed state because the audited revision is identical to the previous audit.

The score delta above reflects capability changes only: `Code Style`, `Structure`, and `Skill Definition` are newly assessable under the expanded contract (the `docs/` agent-facing rule corpus exists and was always present, but the previous contract did not score it).

The overall moved from the corrected 5.7 to 6.2/10 entirely because the scorecard denominator grew and the previous arithmetic was corrected - no subject dimension score changed.

## System Context

| Aspect                 | Detail                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional description | Tracker-style composition tool for the Yamaha YM2149 sound chip, with live playback and multi-format export for Atari ST target code                                                            |
| Architecture overview  | React SPA front end plus optional Electron desktop shell, Web Worker sequencer, in-process [YM2149](#glossary) emulator, localStorage persistence, static-file song repository                  |
| Key components         | `src/App.tsx` orchestrator, `src/synth/` emulator and driver, `src/exports/` five-format export pipeline, `src/workers/sequencerWorker.ts`, `src/hooks/` 31 hooks, `electron/` main and preload |
| External dependencies  | React 19, Zustand, js-yaml, lucide-react, rolldown-vite, Electron, Web Audio API, Web MIDI API, service worker                                                                                  |
| Assumptions            | NOT SPECIFIED                                                                                                                                                                                   |

### Technology Stack

| Layer            | Technology                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Languages        | TypeScript ~5.9.3 strict mode, CommonJS for Electron main and preload                                                              |
| Frameworks       | React 19.2, Zustand 4.5, Electron 42.6, Vite via rolldown-vite 7.2.2                                                               |
| Runtime/Platform | Browser (Chromium-family Web Audio and Web MIDI), Electron desktop shell, Node.js v22.18.0 documented in README                    |
| Build tooling    | rolldown-vite, TypeScript project references, electron-builder 26.15, Prettier, ESLint 9 flat config                               |
| Test tooling     | Vitest 4.1 with jsdom and Testing Library, Playwright 1.61 configured, v8 coverage with 80 percent thresholds                      |
| Package manager  | npm with lockfileVersion 3                                                                                                         |
| Key libraries    | js-yaml 4.3 song parsing, zustand [UI](#glossary) store, lucide-react icons, custom [ZX0](#glossary) compressor port               |
| Data stores      | Browser localStorage via `StorageKeys`, static [YAML](#glossary) song files under `public/repository/`, `public/download/` listing |
| Target platforms | Static web hosting at dosound.alyx.pl, Electron builds for macOS, Windows, Linux                                                   |

### Renderer And Orchestration

`src/App.tsx` is the single composition root at 2488 lines: it declares the song model in
`useState`, instantiates roughly twenty hooks, wires their inputs and outputs, and renders the
tree through `AppLayout`.

Cross-component [UI](#glossary) state lives in one Zustand store (`uiStore`) holding octave, shared line,
and channel mutes.

### Audio Engine

`src/synth/YM2149.ts` emulates the chip register set, and `SoundDriver.ts` schedules events into
the Web Audio API.

`src/workers/sequencerWorker.ts` runs a `setTimeout` loop with `performance.now()` scheduling
and catch-up ticks at the song frame rate.

### Export Pipeline

`src/exports/` contains five format modules: `asm.ts`, `bin.ts`, `vgm.ts`, `wav.ts`, and
`max.ts`, the last using the in-house [ZX0](#glossary) compressor in `src/utils/zx0.ts`.

The documented contract requires byte-identical output under refactoring.

### Desktop Shell

`electron/main.cjs` creates one `BrowserWindow` with `contextIsolation: true` and
`nodeIntegration: false`, and installs permission handlers that grant only `midi` and
`midiSysex`.

`electron/preload.cjs` exposes a narrow `electronAPI` bridge for the close-confirmation flow
and runtime version reporting.

### Persistence And Content

Songs, [MIDI](#glossary) configuration, transpose settings, theme, and debug state persist in localStorage
under keys consolidated in `src/utils/storageKeys.ts`.

Bundled static content in `public/` supplies the manual, changelog, message text, a song
repository directory, and the download directory listing consumed by `FilePickerModal`.

**Operational Objectives**

| Metric                | Target                                  | Measured | Window           | Source                  | Owner         |
| --------------------- | --------------------------------------- | -------- | ---------------- | ----------------------- | ------------- |
| Frame timing accuracy | 50 Hz and 60 Hz replay rates documented | UNKNOWN  | [N/A](#glossary) | `docs/SPECIFICATION.md` | NOT SPECIFIED |
| Availability          | NOT SPECIFIED                           | UNKNOWN  | [N/A](#glossary) | none committed          | NOT SPECIFIED |

## Software Bill of Materials

This is a manifest-derived component inventory at the audited revision, not a shipped-artifact
[SBOM](#glossary) and not a claim of [SPDX](#glossary) or CycloneDX conformance.

| Component                        | Version | Ecosystem | Relationship               | License          | License Risk | Advisory Checked | Source File                     |
| -------------------------------- | ------- | --------- | -------------------------- | ---------------- | ------------ | ---------------- | ------------------------------- |
| js-yaml                          | 4.3.0   | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| lucide-react                     | 0.460.0 | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| react                            | 19.2.1  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| react-dom                        | 19.2.1  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| zustand                          | 4.5.7   | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| jsdom                            | 29.1.1  | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| prettier                         | 3.9.4   | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| typescript-eslint                | 8.48.1  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| vitest                           | 4.1.10  | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| wait-on                          | 8.0.5   | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| @eslint/js                       | 9.39.1  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| @playwright/test                 | 1.61.1  | npm       | direct                     | Apache-2.0       | None flagged | N                | package.json, package-lock.json |
| @testing-library/dom             | 10.4.1  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| @testing-library/jest-dom        | 6.9.1   | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| @testing-library/react           | 16.3.2  | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| @types/js-yaml                   | 4.0.9   | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| @types/node                      | 24.10.1 | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| @types/react                     | 19.2.7  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| @types/react-dom                 | 19.2.3  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| @vitejs/plugin-react             | 5.1.1   | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| @vitest/coverage-v8              | 4.1.10  | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| @vitest/ui                       | 4.1.10  | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| concurrently                     | 10.0.3  | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| electron                         | 42.6.0  | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| electron-builder                 | 26.15.3 | npm       | direct                     | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
| eslint                           | 9.39.1  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| eslint-plugin-react-hooks        | 7.0.1   | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| eslint-plugin-react-refresh      | 0.4.24  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| globals                          | 16.5.0  | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| typescript                       | 5.9.3   | npm       | direct                     | Unknown          | Unknown      | N                | package.json, package-lock.json |
| vite (rolldown-vite)             | 7.2.2   | npm       | direct via `npm:` override | Unknown          | Unknown      | N                | package.json, package-lock.json |
| ... Plus 559 transitive packages | -       | npm       | transitive                 | Mixed            | See review   | N                | package-lock.json               |

The lockfile resolves 590 components total.

368 declare a license field and 222 declare none, so 37.6 percent of the resolved set has no
machine-readable license.

## License Compliance Review

The project license is [MIT](#glossary) (`LICENSE`, `package.json`).

`docs/COPYRIGHTS.md` permits [MIT](#glossary), Apache-2.0, [BSD](#glossary) 2-Clause and 3-Clause,
[ISC](#glossary), and Boost, and bars [GPL](#glossary) without written approval.

Resolved license classes in the lockfile are: [MIT](#glossary) 270, [ISC](#glossary) 41,
BSD-3-Clause 20, Apache-2.0 12, BlueOak-1.0.0 9, BSD-2-Clause 8,
MIT-0 2, CC-BY-4.0 1, CC0-1.0 1, a [WTFPL](#glossary) or [ISC](#glossary) dual license (1),
[WTFPL](#glossary) 1, an [MIT](#glossary) or CC0-1.0 dual license (1), and a [WTFPL](#glossary) or [MIT](#glossary) dual license (1).

All declared classes are permissive, but BlueOak-1.0.0, CC-BY-4.0, [WTFPL](#glossary),
[MIT](#glossary)-0, and CC0-1.0 sit outside the policy's permitted list, recorded as
[FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set).

No copyleft class was found, so the policy's [GPL](#glossary) bar is not violated.

`src/utils/zx0.ts` is a ported algorithm carrying in-file [BSD](#glossary)-3-Clause attribution to
Einar Saukas, but `docs/COPYRIGHTS.md` does not carry the corresponding attribution entry required
for third-party code, which is recorded as [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file).

No vendored dependency directories exist in the tree.

`node_modules` is untracked and inspected
only through the lockfile.

No `NOTICE`/`THIRD_PARTY` inventory exists, so redistribution relies on the lockfile alone
without a per-package declaration check, also covered by [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set).

## Health Dashboard

| Severity | Count | Identifiers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HIGH     | 0     | none on the residual scale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| MEDIUM   | 6     | [RSK-001](#rsk-001-regressions-merge-undetected-without-ci-enforcement), [RSK-002](#rsk-002-redeploys-serve-stale-or-skewed-web-assets), [RSK-003](#rsk-003-maintainer-unavailability-halts-all-delivery), [RSK-004](#rsk-004-orchestrator-growth-compounds-change-defects), [RSK-005](#rsk-005-injected-markup-renders-through-the-markdown-sink), [RSK-006](#rsk-006-ui-regressions-reach-releases-without-e2e-checks)                                                                                                    |
| LOW      | 7     | [RSK-007](#rsk-007-license-policy-non-conformance-surfaces-late), [RSK-008](#rsk-008-dead-test-file-implies-coverage-that-does-not-run), [RSK-009](#rsk-009-tampered-or-mismatched-binaries-reach-users-unverified), [RSK-010](#rsk-010-stale-documented-figures-mislead-change-planning), [RSK-011](#rsk-011-device-permission-granted-beyond-the-intended-origin), [RSK-012](#rsk-012-undisclosed-generated-code-lands-without-trace), [RSK-013](#rsk-013-misplaced-test-file-masks-thin-coverage-of-the-claimed-subject) |

[RSK-003](#rsk-003-maintainer-unavailability-halts-all-delivery) and [RSK-005](#rsk-005-injected-markup-renders-through-the-markdown-sink) carry `HIGH` impact with `LOW` likelihood, landing at `MEDIUM` residual.

This residual-scale presentation corrects the previous report's dashboard, which listed [RSK-005](#rsk-005-injected-markup-renders-through-the-markdown-sink) as `HIGH` without noting that [RSK-003](#rsk-003-maintainer-unavailability-halts-all-delivery) shares the same impact-likelihood pair.

| Area                   | Rating   | Key evidence                                                                                                     |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| Documentation          | Strong   | 11-file source-of-truth corpus plus per-version change, plan, and refactoring records                            |
| Test suite             | Weak     | 44 test files and ~218 cases, coverage gate documented failing, [E2E](#glossary) directory empty                 |
| Security posture       | Adequate | Electron isolation flags set, narrow permission grants, two escaped [HTML](#glossary) sinks, no [CSP](#glossary) |
| Build & release        | Weak     | Deterministic builds, no [CI](#glossary), no tags, unsigned installers                                           |
| Dependency hygiene     | Moderate | Lockfile v3, permissive license set, 37.6 percent undeclared licenses, no advisory evidence                      |
| Contributor continuity | Fragile  | 679/679 commits by one author, no continuity owner named                                                         |

## Delivery Practice & Team Continuity

The repository holds 705 commits over 2025-11-17 to 2026-07-25 (679 non-merge), all by one
author.

88 commit subjects start with fix or revert wording, a 13 percent correction share
([EVD-003](#verification-and-evidence-ledger)).

Release anchoring is absent: `git tag -l` returns zero tags, and no release branches or
packaging commits mark shipped states ([EVD-004](#verification-and-evidence-ledger)).

The changelog at `public/CHANGELOG.md` records 28 versioned entries through 1.2.8 and the
version-bump script automates numbering, so releases exist as artifacts but live entirely
outside the git tag namespace ([EVD-039](#verification-and-evidence-ledger)).

[DORA](#glossary) proxies are all `NOT SPECIFIED`: no tags, no deployment records, no incident
data, and no lead-time measurement exist to measure against.

Contributor concentration rates `High` (100 percent single-author, single point of failure on
knowledge and availability).

Ten commits carry `Co-Authored-By` or equivalent tool trailers in 705 commits ([EVD-032](#verification-and-evidence-ledger)).

| Continuity element    | State                                                                   |
| --------------------- | ----------------------------------------------------------------------- |
| Contributor diversity | 100 percent single author, `High` concentration                         |
| Release anchoring     | No git tags, changelog and version script exist                         |
| Knowledge records     | Strong `docs/` corpus including per-version change and plan directories |
| [CI/CD](#glossary)    | None - no workflow files exist                                          |
| Onboarding            | README plus `docs/` set are complete and navigable                      |

## High-Level Observations

- The project's own documents form a strong governance set - a verification loop, permitted-license list, audio-critical linting exceptions, and a naming/casing standard are all written down - but the
  coverage command currently fails and no [CI](#glossary) configuration exists to run any of it ([FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin),
  [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)).
- `src/App.tsx` at 2488 lines is the central orchestrator and concentrates composition, state,
  and event wiring in one file - a documented deliberate trade-off and the largest single
  maintenance risk ([FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)).
- The web build ships deterministic hashless asset names and a fixed cache name in the service
  worker, so a redeployed build may serve previous JavaScript to returning users ([FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)).
- License hygiene is policy-consistent in class (all permissive) but not in declaration: 222 of
  590 resolved packages carry no license field, and five resolved classes exceed the project's own
  permitted list ([FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set)).
- [AI](#glossary)-assisted authorship is openly declared in the README and ten commits carry
  tool trailers, but no per-change provenance convention exists to measure compliance
  ([FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)).
- The code itself is stylistically consistent and well-named under the project's own standard:
  identifier-shape conformance sits at or above 96 percent in every TypeScript partition, and the
  deviations found are bounded and citable ([EVD-046](#verification-and-evidence-ledger)).

## Auditing Methodology

This audit was produced by the Lens skill (`lens-skill`, version 2.3.6) in `source-only` evidence
mode.

Source, configuration, documentation, and git history were inspected.

The subject was never built, executed, tested, deployed, or connected to any live system.

Package manifests and the lockfile were parsed mechanically for the [SBOM](#glossary) and license
review.

Style and structure conformance were measured by census: `scripts/style-census.py` classified
identifier shapes per partition, and file-name shapes were counted with `find`/`basename` shell
pipelines recorded in the evidence ledger.

X

No external authority research was needed because every partition resolved to a declared standard
or a shipped digest.

Git history, lockfile, and file trees were enumerated with `git` and filesystem commands as
recorded in the evidence ledger below.

**Constraints**

- No execution: every runtime claim is `NOT RUN` or `UNKNOWN` and listed under Limitations.
- Restricted directories per `docs/GUIDELINES.md`: `docs/change/`, `docs/plan/`, `docs/archive/`,
  `docs/refactoring/`, `docs/report/`, `docs/feature/`, and `docs/prompt/` were enumerated at
  directory level only. Their contents were not read (the report directory is excepted only for
  the previous audit baseline, which this revision requires).
- `dist/`, `release/`, `node_modules/`, and `coverage/` are generated or dependency trees and are
  excluded from every denominator. `work/` is gitignored and was not created or read.

**Criteria table**

| Criterion      | Family | Applicability | Criticality | Method                                          | Sufficiency                                                 |
| -------------- | ------ | ------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------- |
| `ARC-COHESION` | `ARC`  | applicable    | material    | file-size and wiring census                     | change blast radius is bounded by file responsibility       |
| `DLY-CONT`     | `DLY`  | applicable    | low         | git author census plus continuity-doc check     | delivery does not hinge on one person                       |
| `TST-COV`      | `TST`  | applicable    | material    | threshold config plus documented-gap inspection | declared coverage gate passes on the risky paths            |
| `TST-DEAD`     | `TST`  | applicable    | low         | include-glob versus tracked-file census         | every committed test artifact is collectible                |
| `TST-E2E`      | `TST`  | applicable    | material    | declared-suite directory census                 | configured e2e surface contains specs                       |
| `MNT-DOC`      | `MNT`  | applicable    | low         | documented-figure versus measured census        | source-of-truth figures match the tree                      |
| `STY-ABBR`     | `STY`  | applicable    | low         | identifier census                               | declared abbreviation rules hold                            |
| `STY-REASON`   | `STY`  | applicable    | low         | escape-hatch census                             | non-null assertions carry `REASON:` comments                |
| `STY-COMMENT`  | `STY`  | applicable    | low         | comment-pattern census                          | forbidden comment shapes are absent                         |
| `STY-ALIAS`    | `STY`  | applicable    | low         | import-shape census                             | declared import convention holds or the standard is amended |
| `SEC-INJ`      | `SEC`  | applicable    | material    | rendering-sink and control census               | injection surface carries layered controls                  |
| `SEC-PERM`     | `SEC`  | applicable    | material    | permission-handler inspection                   | device grants scope to the intended origin                  |
| `DEP-CI`       | `DEP`  | applicable    | material    | pipeline-file census                            | declared gates run automatically on change                  |
| `DEP-CACHE`    | `DEP`  | applicable    | material    | cache-strategy inspection                       | invalidation tracks the deployed version                    |
| `DEP-SIGN`     | `DEP`  | applicable    | low         | packaging-config inspection                     | released artifacts carry tamper evidence at declared scale  |
| `AIP-TRACE`    | `AIP`  | applicable    | low         | metadata and documentation inspection           | provenance is attributable per change                       |
| `CPR-LIC`      | `CPR`  | applicable    | material    | lockfile license census                         | resolved classes stay inside the declared policy            |
| `CPR-ATTR`     | `CPR`  | applicable    | low         | attribution census                              | third-party code appears in the declared notice file        |
| `STR-TEST`     | `STR`  | applicable    | low         | test-name versus subject census                 | test file names identify the module they exercise           |

No post-freeze applicability changes occurred.

**Reference standards**

| Standard or guide                       | Applied to                                            |
| --------------------------------------- | ----------------------------------------------------- |
| [ISO/IEC](#glossary) 25010:2023         | Scorecard characteristic crosswalk in Scoring Rubrics |
| OWASP Top 10:2025                       | Category coverage statement in Scope Exclusions       |
| NIST SP 800-30                          | Unified Risk Register ratings                         |
| [CISQ/SQALE](#glossary) debt concepts   | Technical Debt Register categories                    |
| Electron security guidance              | SEC-INJ, SEC-PERM baseline                            |
| `docs/standard/ts-react-development.md` | T1 convention tier for all TypeScript partitions      |
| `docs/GUIDELINES.md`                    | T1 naming, markdown, and audio-critical rules         |

### Verification And Evidence Ledger

Re-derivable evidence rows, generated or re-verified at this audit's working date.

Every row is re-derivable from the named command or file range.

| ID      | Method                                                                      | Result                                                                                                                                                                                                                            | Tag         | Source                                                                                              |
| ------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| EVD-001 | `git ls-files` census plus per-directory counts                             | 454 tracked files, 149 under `src/` at 29573 lines, 56 under `test/` at 5072 lines including fixtures and setup files                                                                                                             | Observation | file inventory                                                                                      |
| EVD-002 | `git rev-list --count HEAD` and `--no-merges`                               | 705 total commits, 679 non-merge                                                                                                                                                                                                  | Observation | revision `f898dce`                                                                                  |
| EVD-003 | `git log --no-merges --format=%an` census and fix-subject scan              | 679 of 679 commits by one author (100 percent), 88 fix or revert subjects                                                                                                                                                         | Observation | commit history                                                                                      |
| EVD-004 | `git tag -l` and history span                                               | 0 tags, span 2025-11-17 to 2026-07-25                                                                                                                                                                                             | Observation | `git log`                                                                                           |
| EVD-005 | `git status -sb`, `git remote -v`, `git rev-parse HEAD`                     | clean tree except untracked `docs/report/1.2.8/`, `main` equals `origin/main`, HEAD `f898dce228db86c1e98130ec2c9dbbe3430de841`                                                                                                    | Observation | repository state                                                                                    |
| EVD-006 | `package.json` and `package-lock.json` inspection                           | version 1.2.8, lockfileVersion 3, 590 resolved packages, 5 runtime plus 26 dev direct dependencies, `vite` overridden to `npm:rolldown-vite@7.2.2`                                                                                | Observation | manifests                                                                                           |
| EVD-007 | lockfile `license` field extraction                                         | 368 packages declare a license, 222 declare none, all declared classes permissive, no copyleft present                                                                                                                            | Observation | `package-lock.json`                                                                                 |
| EVD-008 | `electron/main.cjs` and `electron/preload.cjs` inspection                   | `contextIsolation: true`, `nodeIntegration: false`, permission handlers grant only `midi` and `midiSysex`, narrow `electronAPI` bridge                                                                                            | Observation | `electron/main.cjs:14-40`, `electron/preload.cjs`                                                   |
| EVD-009 | `dangerouslySetInnerHTML` census                                            | two sinks, both fed by the custom `renderMarkdown` in `src/utils/markdown.ts`                                                                                                                                                     | Concern     | `src/modals/MarkdownModal.tsx:29`, `src/components/EnvelopeSection.tsx:102`                         |
| EVD-010 | `renderMarkdown` and `applyInlineFormatting` inspection                     | [HTML](#glossary)-escapes before formatting, link regex limited to `http(s)` schemes, `rel="noreferrer"` on generated links                                                                                                       | Observation | `src/utils/markdown.ts:1-90`                                                                        |
| EVD-011 | service worker and build filename inspection                                | non-navigation GET requests are cache-first, `CACHE_NAME` fixed at `dosound-tracker-cache-v1`, Vite emits deterministic hashless asset names                                                                                      | Concern     | `public/js/sw.js:1,52-63`, `vite.config.ts:22-44`                                                   |
| EVD-012 | `e2e/` directory listing                                                    | only `.gitkeep` present, no end-to-end specs despite configured Playwright                                                                                                                                                        | Concern     | `e2e/`, `playwright.config.ts`                                                                      |
| EVD-013 | `vitest.config.ts` and `docs/TESTING.md` comparison                         | 80 percent coverage thresholds enforced in config while `TESTING.md:231` states the coverage command currently fails                                                                                                              | Concern     | `vitest.config.ts:13-20`, `docs/TESTING.md:220-231`                                                 |
| EVD-014 | test-file inventory                                                         | 44 `*.test.*` files with 218 test cases, concentrated in `test/utils/` (30 files), `test/synth/` 1 file, no `test/modals/` or `test/workers/`                                                                                     | Observation | `test/` tree                                                                                        |
| EVD-015 | `test/utils/exportMax.test` comparison                                      | tracked file carrying 12 test cases with a non-standard extension that the Vitest include pattern never matches, a stale divergent copy of `exportMax.test.ts`                                                                    | Concern     | `test/utils/exportMax.test`                                                                         |
| EVD-016 | `docs/ARCHITECTURE.md` versus manifest                                      | document states Electron 39 and App.tsx at 2194 lines, actual dependency is Electron `^42.0.0` (locked 42.6.0) and the file measures 2488 lines                                                                                   | Concern     | `docs/ARCHITECTURE.md:5,124`, `package.json`                                                        |
| EVD-017 | `docs/TESTING.md` gap list versus test tree                                 | documented gaps stale: modals have a test via `test/components/FilePickerModal.test.tsx`, exports are covered by ten `test/utils/` export test files, and 31 hooks exist where the document says 30                               | Concern     | `docs/TESTING.md:222-228`, `test/` tree                                                             |
| EVD-018 | `src/App.tsx` measurement and wiring census                                 | 2488 lines, roughly twenty hooks instantiated and wired in one component                                                                                                                                                          | Concern     | `src/App.tsx`                                                                                       |
| EVD-019 | large-module census                                                         | `useMidiMessageProcessing` 671, `useSongManagement` 619, `useMidiActions` 590, `useSequencerIntegration` 543, `useFileOperations` 525 lines                                                                                       | Observation | `src/hooks/`                                                                                        |
| EVD-020 | `eslint.config.js` inspection                                               | flat config with `typescript-eslint` recommended, `no-explicit-any` error, typed linting via `parserOptions.project`, four `react-hooks` rules set to `warn` with an in-config rationale for audio-critical paths                 | Observation | `eslint.config.js:8-39`                                                                             |
| EVD-021 | `tsconfig.app.json` inspection                                              | `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`, `noFallthroughCasesInSwitch`, bundler module resolution                                                                                   | Observation | `tsconfig.app.json`                                                                                 |
| EVD-022 | localStorage usage census                                                   | 10 source files touch localStorage, keys centralized in `src/utils/storageKeys.ts`                                                                                                                                                | Observation | `src/utils/storageKeys.ts`                                                                          |
| EVD-023 | `src/utils/zx0.ts` header and `docs/COPYRIGHTS.md` comparison               | [ZX0](#glossary) port carries in-file [BSD](#glossary)-3-Clause attribution to Einar Saukas, and the central attribution file does not list it                                                                                    | Concern     | `src/utils/zx0.ts:1-12`, `docs/COPYRIGHTS.md`                                                       |
| EVD-024 | `docs/COPYRIGHTS.md` permitted-license list versus lockfile classes         | policy permits [MIT](#glossary), Apache-2.0, [BSD](#glossary), [ISC](#glossary), Boost, but resolved classes include BlueOak-1.0.0, CC-BY-4.0, [WTFPL](#glossary), [MIT](#glossary)-0, and CC0-1.0                                | Concern     | `docs/COPYRIGHTS.md`, `package-lock.json`                                                           |
| EVD-025 | [CI](#glossary) configuration census                                        | no `.github/` directory, no workflow files, no pipeline definitions of any kind                                                                                                                                                   | Concern     | repository root                                                                                     |
| EVD-026 | secret and key pattern scan of `src/`, `electron/`, `public/`, root configs | no committed secrets or credentials found                                                                                                                                                                                         | Observation | tracked files                                                                                       |
| EVD-027 | `eslint-disable` census                                                     | 8 source files carry targeted `react-hooks` disable comments, consistent with the documented audio-timing exemption                                                                                                               | Observation | `src/App.tsx:1` and seven other files                                                               |
| EVD-028 | `songParser.ts` and `validation.ts` inspection                              | js-yaml safe load, numeric clamping, structural validation with `ValidationError`, line-entry checks                                                                                                                              | Observation | `src/utils/songParser.ts`, `src/utils/validation.ts`                                                |
| EVD-029 | `sequencerWorker.ts` inspection                                             | `setTimeout` loop with `performance.now()` scheduling and catch-up ticks, pattern and song loop handling                                                                                                                          | Observation | `src/workers/sequencerWorker.ts:1-40`                                                               |
| EVD-030 | `fetch` call census                                                         | all fetches target same-origin bundled assets (`CHANGELOG.md`, `MANUAL.md`, `MESSAGES.md`, `download/LIST.txt`, repository song files), no remote [API](#glossary) calls found                                                    | Observation | `src/App.tsx`, `src/hooks/useDownloadAvailability.ts`, `useMessageSystem.ts`, `FilePickerModal.tsx` |
| EVD-031 | `package.json` scripts and `docs/WORKFLOW.md`                               | documented six-step verification loop exists, every step is manual, no automation runs it                                                                                                                                         | Observation | `package.json`, `docs/WORKFLOW.md`                                                                  |
| EVD-032 | [AI](#glossary)-provenance evidence                                         | `README.md` names Windsurf and GPT 5.1, `docs/prompt/` holds task prompt logs, 10 commits carry tool trailers                                                                                                                     | Observation | `README.md`, `docs/prompt/`, git history                                                            |
| EVD-033 | `package.json` electron-builder config and README distribution note         | macOS, Windows, and Linux targets configured, no signing identity configured, README documents that binaries are not code-signed                                                                                                  | Observation | `package.json` build block, `README.md`                                                             |
| EVD-034 | `index.html` and Electron session inspection                                | no `Content-Security-Policy` meta tag or header mechanism present                                                                                                                                                                 | Concern     | `index.html`, `electron/main.cjs`                                                                   |
| EVD-035 | `npm run typecheck` (`tsc --noEmit`)                                        | NOT RUN - would establish that the TypeScript sources compile cleanly under strict mode                                                                                                                                           | Observation | `package.json` scripts                                                                              |
| EVD-036 | `npm run lint` and `npm run format`                                         | NOT RUN - would establish zero-warning lint state and formatting conformance per `docs/TESTING.md`                                                                                                                                | Observation | `package.json` scripts                                                                              |
| EVD-037 | `npm test` and `npm run test:coverage`                                      | NOT RUN - would establish suite pass state and actual coverage versus the 80 percent thresholds                                                                                                                                   | Observation | `vitest.config.ts`, `docs/TESTING.md`                                                               |
| EVD-038 | `npm run test:e2e` (Playwright)                                             | NOT RUN - would exercise browser flows, and no specs exist to execute                                                                                                                                                             | Observation | `playwright.config.ts`, `e2e/`                                                                      |
| EVD-039 | `npm run build` and `npm run electron:build`                                | NOT RUN - would establish bundle production and desktop packaging integrity                                                                                                                                                       | Observation | `package.json` scripts                                                                              |
| EVD-040 | `npm audit` and dependency advisory scan                                    | NOT RUN - no committed advisory or scan artifacts exist to draw on                                                                                                                                                                | Observation | audit scope                                                                                         |
| EVD-041 | prior-report discovery under `docs/report/`                                 | lifecycle and model-comparison documents exist for 1.2.3 and 1.2.4-configuration, `docs/report/1.2.8/AUDIT-1.0.md` is the Lens-format baseline for this re-audit                                                                  | Observation | `docs/report/`                                                                                      |
| EVD-042 | governance-document census                                                  | `GUIDELINES.md`, `TESTING.md`, `WORKFLOW.md`, `VERSIONING.md`, `COPYRIGHTS.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `REFACTORING.md`, `docs/standard/`, per-version `docs/change/`, `docs/plan/`, `docs/refactoring/`          | Observation | `docs/` tree                                                                                        |
| EVD-043 | `docs/VERSIONING.md` scheme inspection                                      | deliberate non-semantic progression: patch increments to 9 regardless of change type, then rolls to minor and major                                                                                                               | Observation | `docs/VERSIONING.md:17-37`                                                                          |
| EVD-044 | `public/CHANGELOG.md` inspection                                            | 28 versioned entries through 1.2.8, a documented release log maintained alongside the bump script                                                                                                                                 | Observation | `public/CHANGELOG.md`                                                                               |
| EVD-045 | `useSequencer.ts` worker wiring inspection                                  | Web Worker created from `src/workers/sequencerWorker.ts`, start/update/stop message protocol, merged playback state                                                                                                               | Observation | `src/hooks/useSequencer.ts`                                                                         |
| EVD-046 | `style-census.py` run over the tracked tree                                 | `typescript:src` functions 187/187 camelCase, types 212/213 PascalCase, variables 2981/3099 camelCase. `typescript:test` variables 542/555 camelCase. `electron/` and `scripts/` camelCase. `public/js` SCREAMING_SNAKE constants | Observation | `style-census.py --json .`                                                                          |
| EVD-047 | file-name census (`find`/`basename` counts)                                 | `src/` .tsx 43 PascalCase + `main.tsx` entry. `src/` .ts 90 camelCase + 4 PascalCase class modules. `test/` 39 camelCase + 5 PascalCase + 1 extensionless stray. `docs/` SCREAMING_SNAKE top level, kebab-case subdirectories     | Observation | `find` over tracked paths                                                                           |
| EVD-048 | abbreviation-rule scan (`grep '[a-z]Idx'`, short-form list)                 | 30 `*Idx` occurrences in `src/utils/playbackSimulation.ts` (24) and `src/exports/asm.ts` (6), plus `pVal`/`pIdx` shorthands. The T1 abbreviation rule names `Idx` explicitly                                                      | Concern     | `src/utils/playbackSimulation.ts`, `src/exports/asm.ts:399-413`                                     |
| EVD-049 | comment-convention scan                                                     | zero `TODO`/`FIXME`/`HACK`/`XXX`, 36 `// ignore` empty-catch markers (the T1-sanctioned form), one duplicated numbered section comment, ~619 line comments + ~156 block lines over 29573 `src/` lines (~2.6 percent density)      | Observation | `grep` census over `src/`                                                                           |
| EVD-050 | non-null assertion scan                                                     | 3 `!` assertions in `src/utils/zx0.ts:85,97,129`, zero `REASON:` comments anywhere in `src/` or `test/`                                                                                                                           | Concern     | `src/utils/zx0.ts`                                                                                  |
| EVD-051 | import-pattern census                                                       | 430 relative imports across `src/`, 298 single-level `../`, zero `../../` deep chains, zero `@/` alias uses despite the configured and documented alias                                                                           | Concern     | `grep` census, `vite.config.ts:47`, `tsconfig.app.json:21-23`                                       |
| EVD-052 | `test/hooks/` naming inspection                                             | `useDataManagement.test.ts` contains only `parseSongFromYaml` tests (subject lives in `test/utils/songParser.test.ts`), and `useDataManagement.hook.test.tsx` uses a one-off `.hook.test` infix                                   | Concern     | `test/hooks/useDataManagement.test.ts`, `test/hooks/useDataManagement.hook.test.tsx`                |
| EVD-053 | `public/` data-file naming census                                           | instrument [YAMLs](#glossary) snake_case (`bass_flat.yaml`, `kick.yaml`), song files Title_Snake (`Arp_Loop.song.yaml`, `Nice_Song.song.yaml`), icons kebab-case, top-level docs SCREAMING_SNAKE                                  | Observation | `public/` tree                                                                                      |
| EVD-054 | previous-report arithmetic re-check                                         | AUDIT-1.0 dimension table sums to 86/15 = 5.7 while the report stated 80/15 = 5.3. Corrected by recomputation                                                                                                                     | Observation | `docs/report/1.2.8/AUDIT-1.0.md` dimension table                                                    |

## Scoring Rubrics

Scale: `1-10` integers, selected at parameter configuration.

| Band      | Score Range | Definition                                                   |
| --------- | ----------- | ------------------------------------------------------------ |
| Excellent | 9-10        | Capability is comprehensive and verified by strong evidence  |
| Good      | 7-8         | Capability is solid overall, minor or noticeable gaps exist  |
| Average   | 4-6         | Capability is present but uneven, limited, or inconsistent   |
| Poor      | 1-3         | Capability is minimal, fragmentary, or absent where required |

`UNKNOWN` and `N/A` are not scores and are excluded from aggregation.

Overall aggregation: arithmetic mean of applicable dimensions, 1 decimal place.

Applicable dimensions: 17 of 19 (`API Compatibility` is `N/A`, and `Skill Definition` is newly
assessed because the subject carries an authored agent-facing rules corpus in `docs/`).

106 / 17 = 6.2, reported as 6.2 / 10.

The overall score is a descriptive summary, never a production approval.

The [ISO/IEC](#glossary) 25010:2023 coverage crosswalk is applied as a dimension mapping only, not
as a conformance claim.

Coverage gaps under the crosswalk: Functional Suitability and Reliability rest on inspected
tests rather than executed results, Safety maps only to the evidenced close-confirmation flow,
and Delivery & Continuity has no [ISO](#glossary) counterpart and stays complementary.

## Architectural Assessment

The architecture is a client-rendered single-page application wrapped in an optional Electron
desktop shell.

`src/App.tsx` is the deliberate composition root: it owns the song model in `useState`, wires
roughly twenty hooks, and renders the tree through `AppLayout`, while cross-component [UI](#glossary) state
sits in one Zustand store.

The audio path is layered cleanly: `sequencerWorker.ts` produces timing ticks, `useSequencer`
merges playback state, `SoundDriver` translates song data into chip events, and `YM2149`
emulates the register model into Web Audio.

The export path is modular: five format modules share helpers in `src/exports/` and rely on
`src/utils/` for parsing, validation, compression, and file naming.

Coupling is concentrated rather than low: the orchestrator knows every hook's contract, and
several hooks exceed 500 lines (`useMidiMessageProcessing` 671, `useSongManagement` 619).

### What Works

- The audio pipeline is cleanly layered and hardware-faithful: worker timer to sequencer
  integration to `SoundDriver` to `YM2149` emulator, with a documented register contract.
- The export pipeline shares a normalization core (`exports/core.ts`) so all five formats
  diverge only at the output stage, with a documented byte-identical stability contract.
- The Electron boundary is minimal and hardened at the flags level (`contextIsolation`,
  `nodeIntegration` off, permission allowlist for [MIDI](#glossary)).
- State domains are deliberately split: one Zustand store for cross-component [UI](#glossary), song model
  in `App.tsx`, audio-rate values in hook refs - each with a documented rationale.
- The branded-type scheme (`InstrumentId`, `PatternId`, `TrackId`, `PlaylistPatternId`) prevents
  identifier mixing at compile time and is applied consistently at parse boundaries.

### What Needs Attention

- `src/App.tsx` at 2488 lines concentrates composition, state declarations, and event wiring, and the project's own architecture document names this the largest maintenance risk, but the
  document's figure (2194) is itself stale ([FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)).
- No undo/redo or Command pattern exists. Edits mutate state directly, which the documents
  acknowledge as a deliberate limitation.
- Test coverage concentrates on `test/utils/`. Synth, exports breadth, modals, and workers are
  thin per the project's own gap list ([FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin)).
- The declared `@/` import alias is configured but completely unused ([FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused)).

### Design Principles

| Principle             | Status  | Evidence                                                                                                                                                                                          |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single Responsibility | PARTIAL | file-level cohesion is good, but `App.tsx` and the largest hooks carry several responsibilities each ([EVD-018](#verification-and-evidence-ledger), [EVD-019](#verification-and-evidence-ledger)) |
| Open/Closed           | PARTIAL | export formats and panels extend by new modules, but song-shape changes ripple through many hooks ([EVD-019](#verification-and-evidence-ledger))                                                  |
| Interface Segregation | PASS    | hooks expose narrow surfaces and the preload bridge is minimal ([EVD-008](#verification-and-evidence-ledger))                                                                                     |
| Dependency Inversion  | PARTIAL | components depend on props and callbacks, hooks depend on concrete module functions                                                                                                               |
| Don't Repeat Yourself | PASS    | shared utilities documented and extracted (`timerUtils`, `useLocalStorageState`, `exports/core`), zero detected duplication classes                                                               |

### Data Flow Diagram

```
+----------+     +-----------+     +----------------+     +------------+
|  UI      | --> |  Hooks    | --> |  SoundDriver   | --> |  YM2149    |
|  React   |     |  useSeq   |     |  event gen     |     |  emulator  |
+----------+     +-----------+     +----------------+     +------------+
     |                |                     |                    |
     |                |                     v                    v
     |                |          +------------------+    +----------------+
     |                |          |  SequencerEngine |    |  Web Audio API |
     |                |          |  50Hz VBLANK     |    |  AudioContext  |
     |                |          +------------------+    +----------------+
     |                |                     ^
     |                v                     |
     |     +--------------------+           |
     |     |  sequencerWorker   | -- tick ->+
     |     |  Web Worker timing |
     |     +--------------------+
     |
     v
+----------+     +-----------+     +----------------+
|  Song    | --> |  exports/ | --> |  File output   |
|  data    |     |  core +   |     |  asm/bin/vgm/  |
|  state   |     |  formats  |     |  wav/max       |
+----------+     +-----------+     +----------------+
```

### Design Patterns

| Pattern            | Location                           | Assessment | Note                                                                                                                                                                                                            |
| ------------------ | ---------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Composition root   | `src/App.tsx`                      | PARTIAL    | deliberate single wiring point, but grown past manageable size ([FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk))                                                 |
| Hook encapsulation | `src/hooks/`                       | PASS       | 31 hooks each own a concern. The project's standard documents reusable patterns                                                                                                                                 |
| Strategy           | `src/exports/` format modules      | PASS       | five formats share `core.ts` normalization and diverge only at output                                                                                                                                           |
| Worker offload     | `src/workers/sequencerWorker.ts`   | PASS       | timing isolated from the render loop                                                                                                                                                                            |
| Branded types      | `src/types/branded.ts`             | PASS       | compile-time ID separation with constructor functions at boundaries                                                                                                                                             |
| Error boundary     | `src/components/ErrorBoundary.tsx` | PASS       | component-level isolation exists                                                                                                                                                                                |
| Template rendering | `src/utils/markdown.ts`            | PARTIAL    | hand-rolled markdown to [HTML](#glossary) with escaping, an anti-pattern-shaped bespoke parser on an injection-relevant path ([FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)) |

### Architecture Decision Records

The project does not maintain a formal [ADR](#glossary) register, but `docs/ARCHITECTURE.md`'s
"Architectural Decisions" section records the same content: intentional React anti-patterns for
audio stability, single-store versus domain stores, worker timing, and the `App.tsx` orchestrator
choice, each with rationale.

This satisfies the intent of decision recording in substance, though not in the [ADR](#glossary)
file-per-decision form.

## Structure Review

Context: a React + TypeScript + Electron desktop/browser application, 149 tracked files and
29573 lines under `src/`, a 56-file Vitest suite under `test/`, a thin CommonJS Electron shell,
an empty Playwright `e2e/` scaffold, a 25-file `public/` asset tree, and a 205-file `docs/`
corpus organized by topic, version, and purpose.

The tree is organized by technical role into clearly named directories: `src/` application
source split into role folders, `test/` mirroring the source domains, `electron/` shell,
`e2e/` reserved for end-to-end specs, `public/` served assets and content, `scripts/` tooling,
`docs/` the documentation corpus, and generated `dist/`/`release/`/`node_modules/` trees kept
untracked and out of the audited surface.

| Level | Directory        | Contents                                                            | Role               |
| ----- | ---------------- | ------------------------------------------------------------------- | ------------------ |
| `1`   | `src/`           | application source, 149 files                                       | application core   |
| `2`   | `src/components` | 28 React UI components                                              | presentation       |
| `2`   | `src/hooks`      | 31 hooks holding the bulk of application logic                      | presentation logic |
| `2`   | `src/utils`      | 42 utility modules, the largest folder                              | utility            |
| `2`   | `src/modals`     | 15 modal dialogs plus the `index.ts` barrel                         | presentation       |
| `2`   | `src/exports`    | 5 format modules plus `core.ts`                                     | export pipeline    |
| `2`   | `src/synth`      | `YM2149`, `SoundDriver`, `SequencerEngine`, `EventOptimizer`        | audio engine       |
| `2`   | `src/constants`  | 6 constant modules by domain                                        | configuration data |
| `2`   | `src/stores`     | single `uiStore.ts`                                                 | state              |
| `2`   | `src/types`      | branded types, playlist helpers                                     | type surface       |
| `2`   | `src/workers`    | `sequencerWorker.ts`                                                | timing isolation   |
| `2`   | `src/assets`     | SVG icon set                                                        | static assets      |
| `1`   | `test/`          | 44 test files in domain mirrors plus `fixtures/` and setup          | test suite         |
| `1`   | `electron/`      | `main.cjs`, `preload.cjs`                                           | desktop shell      |
| `1`   | `e2e/`           | `.gitkeep` only                                                     | reserved e2e       |
| `1`   | `public/`        | manifest, service worker, icons, manual, changelog, song repository | static assets      |
| `1`   | `scripts/`       | `bump-version.mjs`, `sync-branches.sh`                              | tooling            |
| `1`   | `docs/`          | standards, specification, per-version change/plan/refactoring trees | documentation      |

| Area                       | Verdict | Basis                                                                                                                                                                                     |
| -------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Directory organization     | PASS    | Established tier: role-based `src/` split matches the declared standard's `components/hooks/utils/types/stores/constants` list plus documented project-specific folders                   |
| Naming conventions         | PARTIAL | File naming is consistent within roles, but `test/` carries a misplaced file and a dead stray ([FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects))     |
| Component placement        | PASS    | Domain artifacts sit under their role directories, `electron/` isolates the shell, `modals/` separates dialog wiring as the architecture document prescribes                              |
| Test layout                | PARTIAL | `test/` mirrors source domains, but `e2e/` is empty ([FND-CQY-003](#fnd-cqy-003-no-end-to-end-specs-exist-despite-configured-playwright)) and two test files diverge from the mirror rule |
| Supporting-artifact layout | PASS    | `public/` holds only served content, `scripts/` holds tooling, generated trees (`dist/`, `release/`, `coverage/`) stay untracked                                                          |
| Consistency                | PASS    | The same role-based scheme holds across `src/`, `test/`, and `docs/` subdivisions                                                                                                         |

Positive practices: `test/` mirrors the `src/` domain split so test location predicts source
location, the barrel `src/modals/index.ts` aggregates a single domain as the standard permits,
`electron/` keeps the desktop shell physically separated from the web renderer, and the
documentation corpus is subdivided by purpose (`standard/`, `template/`, `feature/`, `change/`,
`plan/`, `refactoring/`, `report/`, `archive/`) rather than accumulating flat.

Limitations: `dist/`, `release/`, `node_modules/`, and `coverage/` are generated or dependency
trees excluded from the census.

the restricted `docs/` directories were enumerated at directory
level only per `docs/GUIDELINES.md`.

## Trade-off Analysis

| Trade-off                                    | Context                                                           | Option A: gain / cost                                                           | Option B: gain / cost                                            | Evidence                                                                                   | Implication                                                                                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Central orchestrator vs distributed state    | Keep song model close to wiring                                   | `App.tsx` owns model and wiring / file grows to 2488 lines                      | Domain stores and mediators / more indirection                   | [EVD-018](#verification-and-evidence-ledger), `docs/ARCHITECTURE.md`                       | Current choice keeps data flow visible but concentrates change risk ([FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk))  |
| Audio timing fidelity vs lint purity         | Re-created callbacks at 50 Hz cause audible glitches              | Sparse dependency arrays and ref mirroring / intentional `react-hooks` warnings | Full hook conformance / timing drift risk                        | [EVD-027](#verification-and-evidence-ledger), `docs/GUIDELINES.md`                         | Documented choice fits the constraint and is not a defect                                                                                                             |
| setTimeout worker vs audio-clock scheduling  | Browser has no hard-real-time primitive                           | Worker `setTimeout` with `performance.now()` catch-up / approximate scheduling  | AudioContext-driven scheduling / tighter coupling to audio graph | [EVD-029](#verification-and-evidence-ledger), [EVD-045](#verification-and-evidence-ledger) | Acceptable for a tracker preview, diverges from hardware timing                                                                                                       |
| Hashless asset names vs cache freshness      | Electron `file://` packaging prefers deterministic names          | Stable names / service worker may serve stale assets                            | Content hashes / filename churn in packaged app                  | [EVD-011](#verification-and-evidence-ledger)                                               | The web build inherits the Electron constraint, freshness risk lands on web users ([FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)) |
| localStorage vs IndexedDB or file storage    | Single-user local app                                             | Simple synchronous [API](#glossary) / size and schema limits, profile-bound     | Richer store / migration complexity                              | [EVD-022](#verification-and-evidence-ledger)                                               | Fits current scale, schema versioning is ad hoc per key                                                                                                               |
| Custom markdown renderer vs vendored library | Bundle size and dependency count                                  | No parser dependency / hand-rolled sanitizing surface to maintain               | Marked or similar / larger bundle, maintained edge cases         | [EVD-009](#verification-and-evidence-ledger), [EVD-010](#verification-and-evidence-ledger) | Small controlled surface, but the escaping contract must be tested ([FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth))                 |
| rolldown-vite vs upstream Vite               | Build speed                                                       | Rust-powered toolchain / younger ecosystem, substitution via overrides          | Upstream Vite / slower builds, maximal ecosystem support         | [EVD-006](#verification-and-evidence-ledger)                                               | Compatibility risk is borne by the project, documented nowhere in `docs/`                                                                                             |
| `@/` alias vs relative imports               | T1 prefers the alias, the code uses only shallow relative imports | Relative imports are simple but scattered across 430 sites                      | Alias paths survive refactors but require a one-time migration   | [EVD-051](#verification-and-evidence-ledger)                                               | Harm is low because all relatives stay one level up. The configured alias is dead weight ([FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused))             |
| Unsigned builds vs signing cost              | Hobbyist distribution, free hosting                               | Zero certificate cost / platform warnings and no tamper evidence                | Apple and Windows signing / recurring cost and complexity        | [EVD-033](#verification-and-evidence-ledger)                                               | Documented and user-visible, acceptable at current distribution scale ([FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned))                        |
| Non-semantic versions vs SemVer              | Single-author release cadence                                     | Simple always-patch progression / versions carry no compatibility signal        | SemVer / per-change classification effort                        | [EVD-043](#verification-and-evidence-ledger)                                               | Fits the project's self-contained distribution, limits consumer signal (documented)                                                                                   |
| No [CI](#glossary) vs automation cost        | Solo workflow                                                     | Zero maintenance / documented gates rely on manual runs                         | [CI](#glossary) pipeline / upkeep, runner minutes                | [EVD-025](#verification-and-evidence-ledger), [EVD-031](#verification-and-evidence-ledger) | Regression detection rests entirely on discipline ([FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop))                      |

## Threat Model

The subject is a single-user local application whose realistic trust boundaries are bundled
content files (markdown documentation, song [YAML](#glossary)), the Electron renderer-to-main
bridge, device permission grants, and cached web assets.

| Boundary       | [STRIDE](#glossary)    | Threat Description                                                                                          | Control                                                                                       | Finding                                                                                  |
| -------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| File import    | Tampering              | Crafted YAML song file produces malformed state or load crashes                                             | js-yaml safe load, structural validation, numeric clamping                                    | none (bounded)                                                                           |
| Host content   | Tampering              | Compromised static files (MESSAGES.md, MANUAL.md, repository [YAML](#glossary)) reach the markdown renderer | [HTML](#glossary) escaping in `renderMarkdown`, `http(s)`-only links                          | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)         |
| Host content   | Information Disclosure | Stale cached content persists past redeploys                                                                | Cache name is static, no versioned invalidation                                               | [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)        |
| Renderer shell | Elevation of Privilege | A script-injection sink would run in an unhardened renderer                                                 | `contextIsolation`, `nodeIntegration` off, no [CSP](#glossary)                                | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)         |
| Device access  | Elevation of Privilege | Untrusted page code requests device permissions                                                             | Permission handler grants `midi` and `midiSysex` to any requesting frame without origin scope | [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin) |
| Storage read   | Tampering              | Corrupted localStorage content deserialized unchecked                                                       | Parse guards and `// ignore` empty-catch fallbacks                                            | none (bounded)                                                                           |

The model is scoped to the audited revision's static surface.

The dominant residual threats are the [HTML](#glossary)-rendering surface on bundled content ([FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth))
and the unconditional [MIDI](#glossary) permission grant ([FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)), both bounded by the first-party-only
content model: the app loads no remote content and renders only its own bundled files.

No authentication, network service, or multi-tenant boundary exists in the subject.

## Standards Conformance

The project maintains its own standards corpus: `docs/GUIDELINES.md` (agent-facing rules,
documentation style, audio-critical exceptions), `docs/standard/ts-react-development.md`
(TypeScript/React engineering standard), `docs/TESTING.md` (verification loop), and
`docs/VERSIONING.md`, `docs/COPYRIGHTS.md`, `docs/WORKFLOW.md` for process rules.

Conformance was measured against those authored rules plus ecosystem baselines.

| Dimension               | Project rule                                                                        | Status    | Evidence                                                                                                                                                                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type safety             | `strict` TypeScript, `any` disallowed                                               | Conforms  | `tsconfig.app.json` strict set, zero `any` in `src/`, `no-explicit-any` error rule ([EVD-021](#verification-and-evidence-ledger))                                                                                                                                                                  |
| Lint hygiene            | `npm run lint` zero errors, documented warning exemptions only                      | Partially | exemptions documented and narrowly scoped, but lint state unverified ([EVD-036](#verification-and-evidence-ledger))                                                                                                                                                                                |
| Testing                 | 80 percent coverage thresholds                                                      | Deviates  | `docs/TESTING.md:231` documents the coverage command as failing ([FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin))                                                                                                                                       |
| Verification loop       | Run full loop before and after changes                                              | Partially | loop documented, no automation enforces it ([FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop))                                                                                                                                                          |
| Versioning procedure    | Bump only via `npm run bump`, changelog updated                                     | Conforms  | `scripts/bump-version.mjs` exists, 28-entry changelog ([EVD-044](#verification-and-evidence-ledger))                                                                                                                                                                                               |
| Third-party attribution | Document source and license of third-party code                                     | Partially | [ZX0](#glossary) attribution in-file and in change doc, absent from `COPYRIGHTS.md` ([FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file))                                                                                                               |
| File-size discipline    | Keep files navigable                                                                | Deviates  | `App.tsx` 2488 lines, several hooks over 500 lines ([EVD-018](#verification-and-evidence-ledger), [EVD-019](#verification-and-evidence-ledger))                                                                                                                                                    |
| Naming conventions      | PascalCase components, camelCase rest, `use` hooks, no `I` prefix, no abbreviations | Partially | dominant shapes conform above 96 percent. `Idx`/`pVal` abbreviation violations and missing `REASON:` comments remain ([FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard), [FND-CQY-006](#fnd-cqy-006-non-null-assertions-lack-the-required-reason-comments)) |
| File naming             | `PascalCase.tsx` components, `camelCase.ts` other modules                           | Conforms  | coherent observed rule: files named after their principal export, 43 PascalCase components, 90 camelCase modules, 4 class modules ([EVD-047](#verification-and-evidence-ledger))                                                                                                                   |
| Comment rules           | No numbered comments, no section markers, `// REASON:` on non-obvious decisions     | Partially | one duplicated numbered marker, zero `TODO`, 36 sanctioned `// ignore` markers, 3 uncommented assertions ([EVD-049](#verification-and-evidence-ledger), [EVD-050](#verification-and-evidence-ledger))                                                                                              |
| Import style            | Prefer `@/` alias, avoid deep relative imports                                      | Partially | alias unused but zero deep chains exist, so the harm the rule guards against is absent ([FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused))                                                                                                                                            |
| Forbidden patterns      | No `any`, no bare `console.log`, no `@ts-ignore` without reason                     | Partially | zero `any`, zero `@ts-ignore`. One debug-gated `console.log` bypasses the `logger` module ([EVD-049](#verification-and-evidence-ledger))                                                                                                                                                           |

| Policy area    | Declared rule                                          | Actual state                           | Status                                                                                                                                                       |
| -------------- | ------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| License policy | Whitelist permissive licenses, [GPL](#glossary) barred | [SPDX](#glossary)-class permissive set | Partially - actual lockfile classes exceed the whitelist ([FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set)) |

## Skill Definition Conformance

The subject carries agent-facing artifacts, so the inventory required by [PAR-17](#validation-record) is recorded here.

The spec baseline used is the Agent Skills specification snapshot in the Lens skill (`references/agent-skills.md`, snapshot 2026-09-27).

**Skills inventory**

| Item | Status           | Basis                                                 |
| ---- | ---------------- | ----------------------------------------------------- |
| none | [N/A](#glossary) | The subject ships no `SKILL.md` and no skill packages |

**Agent artifacts**

| Artifact                                                            | Status           | Basis                                                                                                |
| ------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `docs/GUIDELINES.md`                                                | Included, PASS   | Authored agent-facing rule corpus: hard rules, sources of truth, workflow, audio-critical exceptions |
| `docs/standard/ts-react-development.md`                             | Included, PASS   | Authored engineering standard with naming, structure, and forbidden-pattern rules                    |
| `docs/WORKFLOW.md`, `TESTING.md`, `REFACTORING.md`, `VERSIONING.md` | Included, PASS   | Authored process documents the guidelines designate as sources of truth                              |
| `README.md`                                                         | Included, PASS   | Human-facing entry point naming the [AI](#glossary) tooling used                                     |
| `AGENTS.md`, `CLAUDE.md`, `SKILL.md`                                | [N/A](#glossary) | Absent from the tracked tree. Agent rules live under `docs/` instead                                 |

The authored agent contract is unusually complete: it defines read-before-change gates, a
verification loop, commit conventions, restricted directories, and domain-specific linting
exceptions.

It does not record per-artifact provenance or a generated-code marking convention, which is
covered by [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable).

## Engineering Baseline Conformance

The bundled stack digests `references/stacks/typescript.md`, `references/stacks/spa.md`,
`references/stacks/electron-desktop.md`, and `references/stacks/web.md` cover the detected
partitions, so their shared floor was evaluated.

| Baseline                   | Status           | Evidence                                                                                                                                                                                                                    |
| -------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime/toolchain pinning  | PARTIAL          | README names Node.js v22.18.0, no `.nvmrc` and no `engines.node` field ([EVD-006](#verification-and-evidence-ledger))                                                                                                       |
| Dependency reproducibility | PASS             | `package-lock.json` v3 committed with pinned resolved versions ([EVD-006](#verification-and-evidence-ledger))                                                                                                               |
| Lint/format gate           | PASS             | `eslint.config.js` flat config and `.prettierrc` committed and scoped to `src/`/`test/`. No [CI](#glossary) exists to run them ([EVD-020](#verification-and-evidence-ledger), [EVD-025](#verification-and-evidence-ledger)) |
| Test floor                 | PARTIAL          | `vitest.config.ts` enforces 80 percent thresholds but the project documents the gate failing. `e2e/` empty ([EVD-012](#verification-and-evidence-ledger), [EVD-013](#verification-and-evidence-ledger))                     |
| Secrets hygiene            | PASS             | No credential material in tracked files ([EVD-026](#verification-and-evidence-ledger))                                                                                                                                      |
| Release integrity          | PARTIAL          | Deterministic hashless builds, no git tags, unsigned installers ([EVD-004](#verification-and-evidence-ledger), [EVD-033](#verification-and-evidence-ledger))                                                                |
| CLI output contract        | [N/A](#glossary) | Subject is an application, not a CLI package                                                                                                                                                                                |

## Structure Conformance

The subject carries a TypeScript/React application tree (`src/`), a mirrored Vitest suite
(`test/`), a CommonJS shell (`electron/`), a reserved `e2e/` directory, a static-asset tree
(`public/`), and a structured documentation corpus (`docs/`), evaluated against
`references/naming-and-layout.md`, the T1 standard's file-naming rules, and the
`GUIDELINES.md` naming conventions.

**Directory and file naming**

| Component   | Surface         | Convention                                                                                       | Observed                                                                                                                                                                | Status  | Evidence                                                                                                                                                                          |
| ----------- | --------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/`      | Directories     | Full lowercase role nouns per T1 and the architecture document                                   | 11 role directories, all full words, no catch-alls beyond a scoped `utils`                                                                                              | PASS    | [EVD-001](#verification-and-evidence-ledger)                                                                                                                                      |
| `src/`      | Component files | `PascalCase.tsx` per T1                                                                          | 43 PascalCase components + `main.tsx` (Vite entry-point convention)                                                                                                     | PASS    | [EVD-047](#verification-and-evidence-ledger)                                                                                                                                      |
| `src/`      | Module files    | `camelCase.ts` for non-component modules per T1                                                  | 90 camelCase + 4 PascalCase class modules (`SoundDriver`, `SequencerEngine`, `EventOptimizer`, `YM2149`) named after their principal exported class                     | PARTIAL | [EVD-047](#verification-and-evidence-ledger) - coherent type-name rule diverges from the literal T1 text                                                                          |
| `src/hooks` | Hook files      | `useCamelCase.ts` per T1                                                                         | 31/31 files carry the `use` prefix                                                                                                                                      | PASS    | [EVD-047](#verification-and-evidence-ledger)                                                                                                                                      |
| `test/`     | Test files      | `<subject>.test.ts(x)` per observed rule. T1 text says `PascalCase.test`                         | 39 camelCase-named + 5 PascalCase-named mirrors. `useDataManagement.hook.test.tsx` one-off infix, `exportMax.test` extensionless, `useDataManagement.test.ts` misplaced | FAIL    | [EVD-014](#verification-and-evidence-ledger), [EVD-052](#verification-and-evidence-ledger), [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects) |
| `electron/` | Source files    | `*.cjs` CommonJS per Electron-forced convention                                                  | `main.cjs`, `preload.cjs`                                                                                                                                               | PASS    | [EVD-008](#verification-and-evidence-ledger)                                                                                                                                      |
| `public/`   | Data files      | `snake_case` per `GUIDELINES.md` config/data rule                                                | instruments snake_case, songs Title_Snake (`Arp_Loop.song.yaml`), icons kebab-case                                                                                      | PARTIAL | [EVD-053](#verification-and-evidence-ledger)                                                                                                                                      |
| `docs/`     | Documentation   | `SCREAMING_SNAKE.md` top-level topics, `kebab-case` in `change/`, `feature/`, `plan/`            | consistent within each tier                                                                                                                                             | PASS    | [EVD-042](#verification-and-evidence-ledger)                                                                                                                                      |
| root        | Config files    | conventional tool names (`tsconfig.*.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`) | all conventional                                                                                                                                                        | PASS    | repository root                                                                                                                                                                   |

**Code division**

| Component | Division Rule                               | Observed                                                                                                  | Status  | Evidence                                                                                   |
| --------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `src/`    | One primary exported unit per file          | Component files carry their same-named component. `main.tsx` is the entry shim                            | PASS    | [EVD-047](#verification-and-evidence-ledger)                                               |
| `src/`    | Domain separation by responsibility         | Role folders hold. `App.tsx` and several hooks exceed 500 lines, concentrating multiple concerns per file | PARTIAL | [EVD-018](#verification-and-evidence-ledger), [EVD-019](#verification-and-evidence-ledger) |
| `test/`   | Test files mirror the source domain         | Mirrors hold except `useDataManagement.test.ts`, which tests `src/utils/songParser.ts` from `test/hooks/` | PARTIAL | [EVD-052](#verification-and-evidence-ledger)                                               |
| `e2e/`    | End-to-end suite per `playwright.config.ts` | Directory exists with `.gitkeep` only                                                                     | FAIL    | [EVD-012](#verification-and-evidence-ledger)                                               |

## Code Style

The subject partitions into five style-relevant surfaces: `src/` TypeScript, `test/`
TypeScript, `electron/` CommonJS JavaScript, `public/js/` service-worker JavaScript, and
`scripts/` Node.js tooling (one `.mjs`, one `.sh`).

Tier resolution: `docs/GUIDELINES.md` naming rules and `docs/standard/ts-react-development.md`
govern both TypeScript partitions (T1 Declared), and the bundled Node.js/browser digests govern
the CommonJS, service-worker, and script surfaces (T3 Ecosystem).

**Convention Profile**

| Partition   | Language   | Tier         | Dominant shapes                                                    | Idiomatic | Forced exclusions                                              |
| ----------- | ---------- | ------------ | ------------------------------------------------------------------ | --------- | -------------------------------------------------------------- |
| `src/`      | TypeScript | T1 Declared  | function camelCase, type PascalCase, variable camelCase            | Yes       | `main.tsx` entry name (Vite convention)                        |
| `test/`     | TypeScript | T1 Declared  | variable camelCase, type PascalCase, harness components PascalCase | Yes       | `*Harness` components, vitest `describe`/`it` [API](#glossary) |
| `electron/` | JavaScript | T3 Ecosystem | camelCase throughout                                               | Yes       | `__dirname` (Node.js built-in)                                 |
| `public/js` | JavaScript | T3 Ecosystem | camelCase functions, SCREAMING_SNAKE module constants              | Yes       | `CACHE_NAME`, `OFFLINE_URLS` constants                         |
| `scripts/`  | JavaScript | T3 Ecosystem | camelCase                                                          | Yes       | `__filename`, `__dirname` ESM-compatibility shims              |
| `scripts/`  | shell      | T3 Ecosystem | snake_case                                                         | Yes       | none                                                           |

**Consistency Census**

| Partition   | Kind     | Dominant   | Share             | Outliers | Trend | Evidence                                     |
| ----------- | -------- | ---------- | ----------------- | -------- | ----- | -------------------------------------------- |
| `src/`      | function | camelCase  | 187/187 (100%)    | 0        | n/a   | [EVD-046](#verification-and-evidence-ledger) |
| `src/`      | type     | PascalCase | 212/213 (99.5%)   | 1        | n/a   | [EVD-046](#verification-and-evidence-ledger) |
| `src/`      | variable | camelCase  | 2981/3099 (96.2%) | 118      | n/a   | [EVD-046](#verification-and-evidence-ledger) |
| `test/`     | function | camelCase  | 9/9 (100%)        | 0        | n/a   | [EVD-046](#verification-and-evidence-ledger) |
| `test/`     | type     | PascalCase | 6/6 (100%)        | 0        | n/a   | [EVD-046](#verification-and-evidence-ledger) |
| `test/`     | variable | camelCase  | 542/555 (97.7%)   | 13       | n/a   | [EVD-046](#verification-and-evidence-ledger) |
| `electron/` | variable | camelCase  | 6/6 (100%)        | 0        | n/a   | [EVD-046](#verification-and-evidence-ledger) |
| `public/js` | variable | camelCase  | 3/5 (60%)         | 2        | n/a   | [EVD-046](#verification-and-evidence-ledger) |
| `scripts/`  | variable | camelCase  | 9/11 (81.8%)      | 2        | n/a   | [EVD-046](#verification-and-evidence-ledger) |

The 118 variable "outliers" in `src/` decompose into 64 `SCREAMING_SNAKE` module constants
(which the T1 standard mandates as `UPPER_SNAKE_CASE`, so they are conformant, not deviant),
51 PascalCase React component bindings (named PascalCase by ecosystem idiom), and 3
`I`-prefixed hits that are all the plural `IDs` - a census false positive, not `I`-prefixed
interfaces, so the no-`I`-prefix rule holds.

The single type outlier is `YM2149` itself: an all-caps chip-model acronym used as a class
name, defensible as a domain term and consistent with the project's naming of hardware
entities.

The test-partition variable outliers are `SCREAMING_SNAKE` fixture constants and PascalCase
test-harness components, both idiomatic.

**Naming Quality Review**

Sampled outliers and scanned identifiers against the T1 rules and the ecosystem yardstick,
grouped by smell class:

- Abbreviation violations (T1-named rule): `playlistIdx`, `lineIdx`, `pitchIdx`, `volIdx`,
  `shiftIdx`, `modeIdx`, `noiseIdx` in `src/utils/playbackSimulation.ts` and
  `src/exports/asm.ts`, plus `pIdx`/`pVal` shorthands in `asm.ts` - the standard explicitly
  lists `Idx` as forbidden ([FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard)).
- Domain constants (idiomatic): `YM_CLOCK`, `PATTERN_LENGTH`, `VBLANK_RATE`,
  `DOSOUND_REGISTER_WRITE`, `ENVELOPE_LENGTH` - SCREAMING_SNAKE per T1, self-describing, no
  unexplained magic strings in identifiers.
- Hardware-faithful names: `writeRegister`, `beginBatch`/`endBatch`, `R7` mixer semantics
  documented in `SPECIFICATION.md` - terse register-oriented naming is domain-appropriate.
- Misleading placement, not naming: `test/hooks/useDataManagement.test.ts` contains only
  `parseSongFromYaml` tests ([FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)).

No noise names (`data`, `temp`, `foo`), misleading names, mixed-language identifiers, or typos
were sampled on the scanned surface.

**Structure, Comprehension And Cognitive Load**

| Lens                      | Status  | Evidence                                                                                                                                                                                                                                                                                                              |
| ------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structure and granularity | PARTIAL | Role-based split is clean, but `App.tsx` (2488) and five hooks above 500 lines concentrate logic against a ~197-line file mean ([EVD-018](#verification-and-evidence-ledger), [EVD-019](#verification-and-evidence-ledger))                                                                                           |
| Comprehension aids        | PARTIAL | `SPECIFICATION.md` documents domain constants and register semantics thoroughly, 36 `// ignore` markers explain empty catches, zero `TODO`. 3 uncommented non-null assertions and one duplicated numbered comment remain ([EVD-049](#verification-and-evidence-ledger), [EVD-050](#verification-and-evidence-ledger)) |
| Cognitive load            | PARTIAL | Inline comment density is low (~2.6 percent) by T1's self-documenting rule. Hot paths carry terse domain shorthand (`instText`, `volText`) that the docs decode. Per-function length census not run                                                                                                                   |

**Enforcement And Drift**

Style is enforced by `eslint.config.js` (flat config, typed linting, `no-explicit-any` error,
four `react-hooks` rules at `warn` with a documented audio-timing rationale), `.prettierrc`
(semi, singleQuote, trailingComma all, printWidth 100, tabWidth 2), and the T1 documents.

Suppression density is low at 8 `eslint-disable` files, all targeted `react-hooks` exemptions
consistent with the documented audio-critical rule ([EVD-027](#verification-and-evidence-ledger)).

Drift exists between declaration and code: the `@/` alias is configured but unused
([FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused)), the abbreviation rule has ~30 violations
([FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard)), `REASON:` comments are absent on the
three non-null assertions ([FND-CQY-006](#fnd-cqy-006-non-null-assertions-lack-the-required-reason-comments)), and a debug-gated `console.log`
bypasses the `logger` module in `useSequencerIntegration.ts:275`.

No configured gate runs in [CI](#glossary), cross-referenced at [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop).

**Style Sub-Scores**

| Lens | Status  | Justification                                                                                                                  |
| ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| SL-1 | PASS    | T1 standards declared and dominant identifier shapes match them in every TypeScript partition                                  |
| SL-2 | PASS    | Dominance above 96 percent on raw shares and effectively total once role-aware shapes are counted                              |
| SL-3 | PASS    | Sampled outliers are rule-named violations or idiomatic domain constants, no noise or misleading names                         |
| SL-4 | PARTIAL | `utils` is a large flat folder (42 files), `App.tsx` and five hooks exceed 500 lines                                           |
| SL-5 | PARTIAL | Good domain documentation, sparse comments per T1, but required `REASON:` comments absent and one duplicated section marker    |
| SL-6 | UNKNOWN | Per-function length and nesting census not run. File-level outliers are the only mechanical load evidence                      |
| SL-7 | PASS    | Idiomatic React hooks/Zustand/strict TS throughout. Framework-forced names (`main.tsx`, `.cjs`, `__dirname`) handled correctly |
| SL-8 | PARTIAL | Tooling configured and exemptions documented, but nothing enforces it in [CI](#glossary) and T1 drift items exist              |

**Craft Notes**

- `Suggestion`: rename the `*Idx` locals to `*Index` in `playbackSimulation.ts` and `asm.ts` to match the declared abbreviation rule.
- `Suggestion`: route the debug-gated `console.log` in `useSequencerIntegration.ts:275` through `src/utils/logger.ts` for consistent log levels.
- `Suggestion`: song filenames in `public/repository/song/` use Title_Snake (`Arp_Loop.song.yaml`) where the data-file rule says `snake_case`. Either conform or document the display-name exception.
- `Suggestion`: split `src/utils/` (42 files) along the sub-domains already visible in names (`exportFileNaming`, `trackPanelUtils`, `instrument*`, `keyboard*`) if the folder keeps growing.
- `Suggestion`: either populate the `@/` alias or remove it from `vite.config.ts`/`tsconfig.app.json` and amend the standard to record relative imports as the convention.

## Strengths & What's Working

- **Declared, measurable standards.** The project carries a full T1 corpus - `GUIDELINES.md`,
  `standard/ts-react-development.md`, `TESTING.md`, `VERSIONING.md`, `COPYRIGHTS.md` - so every
  style and process judgement in this report could be measured against the project's own rules
  rather than generic preference ([EVD-042](#verification-and-evidence-ledger)).
- **Strict production typing.** `tsconfig.app.json` runs full `strict` mode with unused-code and
  side-effect checks, and `src/` carries zero `any` and zero `@ts-ignore` escapes ([EVD-021](#verification-and-evidence-ledger), [EVD-049](#verification-and-evidence-ledger)).
- **Typed linting with documented exemptions.** The ESLint flat config uses typed rules and the
  audio-critical `react-hooks` downgrades carry an in-config rationale mirroring the documented
  exception ([EVD-020](#verification-and-evidence-ledger)).
- **Hardware-faithful audio core.** The [YM2149](#glossary) register model, logarithmic volume
  table, noise [LFSR](#glossary), and the documented byte-identical export contract make the
  domain behavior precise and verifiable ([EVD-028](#verification-and-evidence-ledger)).
- **Timing isolation.** The 50 Hz sequencer runs in a dedicated Web Worker with catch-up
  scheduling, keeping playback independent of the React render loop ([EVD-029](#verification-and-evidence-ledger), [EVD-045](#verification-and-evidence-ledger)).
- **Hardened Electron defaults.** `contextIsolation` on, `nodeIntegration` off, an allowlisted
  permission handler, and a two-method preload bridge match the Electron security posture
  guidance prescribes ([EVD-008](#verification-and-evidence-ledger)).
- **Consistent naming.** Identifier dominance sits at 96-100 percent per kind per partition under
  the declared standard, hooks are uniformly `use`-prefixed, and components are uniformly
  `PascalCase.tsx` ([EVD-046](#verification-and-evidence-ledger), [EVD-047](#verification-and-evidence-ledger)).
- **Validated input path.** Song YAML goes through js-yaml safe load plus structural
  validation with domain errors ([EVD-028](#verification-and-evidence-ledger)).
- **Zero comment rot.** No `TODO`/`FIXME`/`HACK`/`XXX` markers and no commented-out code were
  found. The 36 `// ignore` markers implement the project's own empty-catch convention
  ([EVD-049](#verification-and-evidence-ledger)).
- **Honest known-limitations section.** `SPECIFICATION.md` and `ARCHITECTURE.md` record the real
  weak spots (orchestrator size, no undo, thin synth/export coverage) rather than hiding them
  ([EVD-016](#verification-and-evidence-ledger)).

## Detailed Technical Findings

| Finding                                                                                           | Pillar                              | Severity | Title                                                                             | Result           | Status | Change    | Verification |
| ------------------------------------------------------------------------------------------------- | ----------------------------------- | -------- | --------------------------------------------------------------------------------- | ---------------- | ------ | --------- | ------------ |
| [FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)    | Architecture & Design               | Medium   | 2488-line central orchestrator concentrates wiring and change risk                | PARTIAL          | Open   | Unchanged | Verified     |
| [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)                       | Architecture & Design               | Low      | Single-author contributor concentration is High                                   | [N/A](#glossary) | Open   | Unchanged | Verified     |
| [FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin)        | Code Quality                        | Medium   | Coverage gate is documented as failing and core paths are thin                    | FAIL             | Open   | Unchanged | Verified     |
| [FND-CQY-002](#fnd-cqy-002-tracked-duplicate-test-file-never-executes)                            | Code Quality                        | Low      | Tracked duplicate test file never executes                                        | PARTIAL          | Open   | Unchanged | Verified     |
| [FND-CQY-003](#fnd-cqy-003-no-end-to-end-specs-exist-despite-configured-playwright)               | Code Quality                        | Medium   | No end-to-end specs exist despite configured Playwright                           | FAIL             | Open   | Unchanged | Verified     |
| [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)                      | Code Quality                        | Low      | Documentation figures have drifted from the code                                  | PARTIAL          | Open   | Unchanged | Verified     |
| [FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard)          | Code Quality                        | Low      | Abbreviated identifiers violate the declared naming standard                      | PARTIAL          | Open   | New       | Verified     |
| [FND-CQY-006](#fnd-cqy-006-non-null-assertions-lack-the-required-reason-comments)                 | Code Quality                        | Low      | Non-null assertions lack the required `REASON:` comments                          | PARTIAL          | Open   | New       | Verified     |
| [FND-CQY-007](#fnd-cqy-007-numbered-and-duplicated-section-comment-in-usemidits)                  | Code Quality                        | Low      | Numbered and duplicated section comment in `useMidi.ts`                           | PARTIAL          | Open   | New       | Verified     |
| [FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused)                                    | Code Quality                        | Low      | Configured `@/` import alias is unused                                            | PARTIAL          | Open   | New       | Verified     |
| [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                  | Security & Compliance               | Medium   | Custom HTML rendering surface lacks defense in depth                              | PARTIAL          | Open   | Unchanged | Verified     |
| [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)          | Security & Compliance               | Low      | [MIDI](#glossary) permission grant is not scoped to the requesting origin         | PARTIAL          | Open   | Unchanged | Verified     |
| [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)      | Infrastructure & [CI/CD](#glossary) | Medium   | No automated [CI](#glossary) gate exists for the documented verification loop     | FAIL             | Open   | Unchanged | Verified     |
| [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)                 | Infrastructure & [CI/CD](#glossary) | Medium   | Service worker can serve stale assets after redeploys                             | FAIL             | Open   | Unchanged | Verified     |
| [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)                            | Infrastructure & [CI/CD](#glossary) | Low      | Desktop artifacts are distributed unsigned                                        | PARTIAL          | Open   | Unchanged | Verified     |
| [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)  | AI Provenance & Code Origin         | Low      | [AI](#glossary) provenance is disclosed but per-change compliance is unmeasurable | UNKNOWN          | Open   | Unchanged | Verified     |
| [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set) | Copyrights & Originality            | Low      | License policy whitelist is narrower than the resolved dependency set             | PARTIAL          | Open   | Unchanged | Verified     |
| [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file)    | Copyrights & Originality            | Low      | [ZX0](#glossary) third-party attribution is absent from the central notice file   | PARTIAL          | Open   | Unchanged | Verified     |
| [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)             | Structure & Organization            | Low      | Test file names and placement diverge from their subjects                         | PARTIAL          | Open   | New       | Verified     |

### FND-ARC-001: 2488-line central orchestrator concentrates wiring and change risk

- **Pillar:** Architecture & Design
- **Severity:** Medium
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `src/App.tsx`, `src/hooks/useMidiMessageProcessing.ts`, `src/hooks/useSongManagement.ts`
- **Basis:** `docs/ARCHITECTURE.md` itself names the orchestrator the largest maintenance risk. Role-based file division is the declared structure rule
- **Absence:** Deliberate - recorded decision in `docs/ARCHITECTURE.md`
- **Criterion:** ARC-COHESION - file-level responsibility boundaries should bound change blast radius
- **Description:** `src/App.tsx` is 2488 lines and instantiates roughly twenty hooks with their
  wiring inline.
  Five hooks individually exceed 500 lines (`useMidiMessageProcessing` 671,
  `useSongManagement` 619, `useMidiActions` 590, `useSequencerIntegration` 543,
  `useFileOperations` 525), so orchestration and domain logic co-reside.
- **Impact:** Feature changes concentrate in one oversized file and a few oversized hooks,
  raising navigation cost, merge surface, and the chance a localized change disturbs audio paths.
- **Recommendation:** Stage the decomposition per the project's documented refactoring method:
  extract hook clusters into domain coordinators, then split `App.tsx` along the
  `ARCHITECTURE.md` module boundaries.
- **Method:** After each extraction step, verify typecheck/lint/tests stay green and export
  output stays byte-identical per the documented contract.
- **Verified:** yes - file sizes and hook wiring are mechanically countable
- **Runtime confirmed:** no - source-only audit, the application was never executed
- **Confidence:** HIGH - measured directly from the file tree
- **Mitigating factors:** The choice is documented and deliberate. Per-file cohesion inside
  `src/components/`, `src/utils/`, and `src/exports/` is otherwise strong.
- **Breaking change:** None
- **Evidence:** [EVD-016](#verification-and-evidence-ledger), [EVD-018](#verification-and-evidence-ledger), [EVD-019](#verification-and-evidence-ledger), all `Inspected`

### FND-ARC-002: Single-author contributor concentration is High

- **Pillar:** Architecture & Design
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** git history, `docs/` governance corpus
- **Basis:** Delivery-continuity practice. No project rule addresses continuity
- **Absence:** No documented rationale - the governance set names no backup maintainer
- **Criterion:** DLY-CONT - delivery must not depend on a single point of human failure
- **Description:** All 679 non-merge commits over the repository's entire span belong to one
  author.
  No continuity owner, delegation record, or fork arrangement is documented.
- **Impact:** Maintainer unavailability halts delivery and institutional knowledge transfer.
- **Recommendation:** Name a backup maintainer or document a fork path in the governance docs.
- **Method:** A named continuity owner exists in `docs/GUIDELINES.md` or `README.md`.
- **Verified:** yes - commit census is complete
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH - the census is unambiguous
- **Mitigating factors:** The deep `docs/` corpus and prompt logs make the project's reasoning
  recoverable by a successor.
- **Breaking change:** None
- **Evidence:** [EVD-002](#verification-and-evidence-ledger), [EVD-003](#verification-and-evidence-ledger), `Inspected`

### FND-CQY-001: Coverage gate is documented as failing and core paths are thin

- **Pillar:** Code Quality
- **Severity:** Medium
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `vitest.config.ts:13-20`, `docs/TESTING.md:218-231`, `src/synth/`, `src/exports/`, `src/modals/`, `src/workers/`
- **Basis:** `docs/TESTING.md` mandates the 80 percent thresholds and documents the gap itself
- **Absence:** Deliberate - recorded decision - the gap list is committed in `TESTING.md`
- **Criterion:** TST-COV - declared coverage gates must pass and cover high-risk paths
- **Description:** `vitest.config.ts` enforces 80 percent line/function/branch/statement
  thresholds, while `TESTING.md` records that `npm run test:coverage` currently fails.
  The 44-file suite concentrates in `test/utils/` (30 files).
  `test/synth/` has one file,
  modals and workers have none, and only a minority of hooks are covered.
- **Impact:** The highest-risk paths (emulator, export formats, worker timing) ship with the
  weakest behavioral net, and the declared quality gate cannot pass as configured.
- **Recommendation:** Close the gap on synth and export paths or ratchet the threshold to the
  measured value until coverage catches up.
- **Method:** `npm run test:coverage` exits 0 on a recorded run.
- **Verified:** yes - thresholds and the documented gap are directly citable
- **Runtime confirmed:** no - coverage was not executed under this audit
- **Confidence:** HIGH - config and documentation state the condition plainly
- **Mitigating factors:** The suite that exists is real (218 cases), and the gap is honestly
  documented rather than hidden.
- **Breaking change:** None
- **Evidence:** [EVD-013](#verification-and-evidence-ledger), [EVD-014](#verification-and-evidence-ledger), `Inspected` plus `Reported` gap list in `docs/TESTING.md`

### FND-CQY-002: Tracked duplicate test file never executes

- **Pillar:** Code Quality
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `test/utils/exportMax.test`
- **Basis:** Vitest include pattern `test/**/*.{test,spec}.{ts,tsx}`. T1 requires every test file to execute
- **Absence:** No documented rationale - nothing records why the stray file exists
- **Criterion:** TST-DEAD - committed test artifacts must be collectible and current
- **Description:** `test/utils/exportMax.test` (277 lines, 12 cases) is a tracked file whose
  extension the Vitest include glob never matches, so it never runs.
  It is a stale divergent
  copy of `exportMax.test.ts` (321 lines).
- **Impact:** A file that looks like test coverage contributes none, and its drifted content can
  mislead future edits.
- **Recommendation:** Delete the stray file or merge any unique cases into `exportMax.test.ts`.
- **Method:** `git ls-files` no longer lists `test/utils/exportMax.test`, or the content runs
  under a `.ts` name.
- **Verified:** yes - glob matching is mechanical
- **Runtime confirmed:** no - the suite was not executed
- **Confidence:** HIGH - the include pattern and filename are directly citable
- **Mitigating factors:** The live `exportMax.test.ts` covers the same surface.
- **Breaking change:** None
- **Evidence:** [EVD-015](#verification-and-evidence-ledger), `Inspected`

### FND-CQY-003: No end-to-end specs exist despite configured Playwright

- **Pillar:** Code Quality
- **Severity:** Medium
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `e2e/`, `playwright.config.ts`, `docs/TESTING.md:162-171`
- **Basis:** `npm run test:e2e` is a declared script and `TESTING.md` lists six [E2E](#glossary) flows
- **Absence:** No documented rationale - the harness exists with no specs
- **Criterion:** TST-E2E - declared test surfaces must exist and execute
- **Description:** `playwright.config.ts` points `testDir` at `./e2e` with three browser
  projects and a preview-server block, and `TESTING.md` documents six end-to-end flows.
  `e2e/` contains only `.gitkeep`.
- **Impact:** The outermost verification layer is entirely absent: load, playback, file save,
  and export flows have no automated check.
- **Recommendation:** Add a Playwright smoke suite for the six documented flows, starting with
  load and one export.
  It can live behind the [CI](#glossary) workflow from [REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop).
- **Method:** `npx playwright test --project=chromium` passes against the preview build.
- **Verified:** yes - directory listing is mechanical
- **Runtime confirmed:** no - nothing exists to execute
- **Confidence:** HIGH - the empty directory and configured harness are directly citable
- **Mitigating factors:** The unit suite partially covers component behavior through Testing
  Library.
- **Breaking change:** None
- **Evidence:** [EVD-012](#verification-and-evidence-ledger), `Inspected`

### FND-CQY-004: Documentation figures have drifted from the code

- **Pillar:** Code Quality
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged (one additional stale figure found this revision)
- **Targets:** `docs/ARCHITECTURE.md:5,124`, `docs/TESTING.md:222-228`, `docs/SPECIFICATION.md:55`
- **Basis:** `docs/GUIDELINES.md` designates these files as sources of truth
- **Absence:** No documented rationale - drift accumulated across releases
- **Criterion:** MNT-DOC - source-of-truth figures must match measured reality
- **Description:** `ARCHITECTURE.md` states Electron 39 and an `App.tsx` of 2194 lines. The
  manifest resolves Electron 42.6 and the file measures 2488 lines. `TESTING.md`'s gap list
  predates the modal and export tests that now exist and says 30 hooks where 31 exist.
  `SPECIFICATION.md` additionally states `src/utils` holds 43 files where 42 exist.
- **Impact:** Implementers and tooling that trust the documented figures plan against stale
  numbers.
  The source-of-truth claim is weakened.
- **Recommendation:** Refresh the figures and add a per-release documentation check to the bump
  procedure.
- **Method:** Documented counts match `wc -l`/`git ls-files` measurements.
- **Verified:** yes - each figure is mechanically checkable
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH - the mismatches are directly citable
- **Mitigating factors:** Drift is numeric, not structural. The prose descriptions remain
  accurate.
- **Breaking change:** None
- **Evidence:** [EVD-016](#verification-and-evidence-ledger), [EVD-017](#verification-and-evidence-ledger), `Inspected`

### FND-CQY-005: Abbreviated identifiers violate the declared naming standard

- **Pillar:** Code Quality
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/utils/playbackSimulation.ts` (24 sites), `src/exports/asm.ts:399-413` (6 sites)
- **Basis:** Tier T1 Declared: `docs/standard/ts-react-development.md:75-84` names `Idx` and
  `Num` explicitly under the abbreviation rule
- **Absence:** No documented rationale - the abbreviations predate or escaped the standard
- **Criterion:** STY-ABBR - declared abbreviation rules apply to authored identifiers
- **Description:** 30 occurrences of `Idx`-suffixed locals (`playlistIdx`, `lineIdx`,
  `pitchIdx`, `volIdx`, `shiftIdx`, `modeIdx`, `noiseIdx`) plus `pIdx`/`pVal` shorthands appear
  in two files.
  Everywhere else the codebase uses full words.
- **Impact:** Localized inconsistency against a rule the project chose to write down. Readable
  in context but objectively non-conformant.
- **Recommendation:** Rename `*Idx` to `*Index` (and `pIdx`/`pVal` to `pitchIndex`/`pitchValue`)
  in the two files.
- **Method:** `grep -rE '[a-z]Idx\b' src` returns empty after the rename.
- **Verified:** yes - the occurrences are enumerable
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH - the standard names the exact abbreviation
- **Mitigating factors:** Confined to two files. The abbreviation is uniform within them.
- **Breaking change:** None - locals only
- **Evidence:** [EVD-048](#verification-and-evidence-ledger), `Inspected`

### FND-CQY-006: Non-null assertions lack the required `REASON:` comments

- **Pillar:** Code Quality
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/utils/zx0.ts:85,97,129`
- **Basis:** Tier T1 Declared: `docs/standard/ts-react-development.md:170` requires a
  `// REASON:` comment on every non-null assertion
- **Absence:** No documented rationale - the ported algorithm file carries none
- **Criterion:** STY-REASON - escape hatches must carry the documented justification comment
- **Description:** Three non-null assertions (`optimal[...]!.bits`, `optimal[inputSize - 1]!`)
  sit inside the [ZX0](#glossary) port's inner loop.
  Zero `REASON:` comments exist anywhere in
  `src/` or `test/`.
- **Impact:** Escape hatches are invisible to the convention the project defined for auditing
  them.
  In a ported hot loop they likely hold, but the check is undocumented.
- **Recommendation:** Add `// REASON:` comments explaining the bounds invariant, or restructure
  the indexing to remove the assertions.
- **Method:** `grep -nE '[)\]]!\.' src/utils/zx0.ts` returns only commented sites.
- **Verified:** yes - sites are enumerable
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH - three directly citable lines
- **Mitigating factors:** The file is a verbatim-ported algorithm with in-file attribution,
  assertions index a fully allocated table.
- **Breaking change:** None
- **Evidence:** [EVD-050](#verification-and-evidence-ledger), `Inspected`

### FND-CQY-007: Numbered and duplicated section comment in `useMidi.ts`

- **Pillar:** Code Quality
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/hooks/useMidi.ts:53-54`
- **Basis:** Tier T1 Declared: `docs/standard/ts-react-development.md:291` forbids numbered
  comments and section-marker comments
- **Absence:** No documented rationale - the duplication looks like a merge or edit artifact
- **Criterion:** STY-COMMENT - comment rules apply uniformly across source
- **Description:** Two identical `// 2. Configuration Management` lines sit back to back, both
  violating the numbered-comment ban and the section-marker ban, and the duplication itself is a
  copy artifact.
  The file also lost its `// 1.` sibling, so the surviving marker refers to a
  numbering that no longer exists.
- **Impact:** Cosmetic, but it is residue of an editing pattern the project explicitly forbids
  and signals the file was not re-linted for comment rules.
- **Recommendation:** Delete both lines. The following `useState` block is self-describing.
- **Method:** `grep -n '// 2\.' src` returns empty.
- **Verified:** yes - two directly citable lines
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH - verbatim rule violation
- **Mitigating factors:** Sole instance found in the tree.
- **Breaking change:** None
- **Evidence:** [EVD-049](#verification-and-evidence-ledger), `Inspected`

### FND-CQY-008: Configured `@/` import alias is unused

- **Pillar:** Code Quality
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `vite.config.ts:46-49`, `tsconfig.app.json:21-23`, `src/`
- **Basis:** Tier T1 Declared: `docs/standard/ts-react-development.md:97-101` prefers the `@/`
  alias for cross-module imports and discourages deep relative chains
- **Absence:** No documented rationale - the alias was configured but never adopted
- **Criterion:** STY-ALIAS - declared import-style convention must be followed or amended
- **Description:** The `@` alias to `src/` is configured in both the bundler and the compiler,
  yet zero of 430 relative imports in `src/` use it.
  All cross-directory imports are
  single-level `../` (298 sites) or same-directory `./` - no `../../` deep chain exists, so the
  harm the rule guards against is absent.
- **Impact:** The configured alias is dead weight and the declared preference diverges from
  observed practice.
  Brittleness risk stays low because relatives never cross more than one level.
- **Recommendation:** Either adopt `@/` for cross-module imports or amend the standard to record
  shallow relative imports as the accepted convention and remove the unused configuration.
- **Method:** `grep -r "from '@/" src` returns the adopted set after migration.
- **Verified:** yes - counts are mechanical over `src/`
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH - the counts are directly reproducible
- **Mitigating factors:** Imports resolve correctly. This is convention drift, not a defect in
  behavior.
- **Breaking change:** None
- **Evidence:** [EVD-051](#verification-and-evidence-ledger), `Inspected`

### FND-SEC-001: Custom HTML rendering surface lacks defense in depth

- **Pillar:** Security & Compliance
- **Severity:** Medium
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `src/utils/markdown.ts`, `src/modals/MarkdownModal.tsx:29`, `src/components/EnvelopeSection.tsx:102`, `index.html`, `electron/main.cjs`
- **Basis:** Electron security guidance expects [CSP](#glossary) plus sanitized rendering.
  [CWE](#glossary)-79-adjacent injection surface
- **Absence:** No documented rationale for the absent [CSP](#glossary)
- **Criterion:** SEC-INJ - rendering sinks must escape content and carry layered mitigations
- **Description:** Two `dangerouslySetInnerHTML` sinks consume output of the hand-rolled
  `renderMarkdown`, which escapes [HTML](#glossary) entities before applying `http(s)`-only
  linkification and `rel="noreferrer"`.
  The escaping is real, but it is the only layer: no
  [CSP](#glossary) meta tag or session header exists, and the parser is bespoke code on an
  injection-relevant path.
- **Impact:** A regression or edge case in the bespoke parser becomes exploitable markup
  injection inside a privileged [DOM](#glossary).
  The feed stock is first-party bundled content,
  so the exposure is bounded but unmitigated.
- **Recommendation:** Add a restrictive [CSP](#glossary), hostile-fixture tests for
  `renderMarkdown`, and evaluate a vetted sanitizer as a second layer.
- **Method:** Injection fixtures escape correctly and a [CSP](#glossary) is present in the built
  [HTML](#glossary).
- **Verified:** yes - sink count and controls are directly citable
- **Runtime confirmed:** no - source-only audit, no dynamic exploitation
- **Confidence:** MEDIUM - sink is verified. Exploitability is Theoretical-tier
- **Mitigating factors:** Content is first-party and bundled, escaping exists before formatting,
  links are scheme-limited.
- **Breaking change:** None
- **Evidence:** [EVD-009](#verification-and-evidence-ledger), [EVD-010](#verification-and-evidence-ledger), [EVD-030](#verification-and-evidence-ledger), [EVD-034](#verification-and-evidence-ledger), `Inspected`

### FND-SEC-002: MIDI permission grant is not scoped to the requesting origin

- **Pillar:** Security & Compliance
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `electron/main.cjs:24-41`
- **Basis:** Electron permission handlers should scope grants to expected origins
- **Absence:** No documented rationale
- **Criterion:** SEC-PERM - device permission grants must scope to the intended origin
- **Description:** Both `setPermissionRequestHandler` and `setPermissionCheckHandler` grant
  `midi`/`midiSysex` to any requesting frame regardless of origin.
  The app only loads its own
  packaged file or the localhost dev server, so the surface is narrow, but the grant itself is
  unscoped.
- **Impact:** If a future injection sink ([FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)) ever executes, device access is
  pre-granted.
  Today the vector requires compromised first-party content.
- **Recommendation:** Check `webContents` origin/URL before granting [MIDI](#glossary)
  permissions.
- **Method:** A non-matching origin request is denied by inspection or a packaged smoke check.
- **Verified:** yes - handler bodies are directly citable
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH - the missing origin check is mechanically verifiable
- **Mitigating factors:** Only first-party content loads today. No remote navigation surface
  exists.
- **Breaking change:** None
- **Evidence:** [EVD-008](#verification-and-evidence-ledger), `Inspected`

### FND-INF-001: No automated CI gate exists for the documented verification loop

- **Pillar:** Infrastructure & [CI/CD](#glossary)
- **Severity:** Medium
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** repository root (no `.github/`), `package.json` scripts, `docs/TESTING.md`
- **Basis:** `docs/TESTING.md` requires the six-step loop. Nothing executes it automatically
- **Absence:** No documented rationale - the workflow is manual-only
- **Criterion:** DEP-CI - declared quality gates must run automatically on change
- **Description:** No `.github/` directory or any pipeline definition exists. The documented
  typecheck, lint, format, build, and test steps run only when a human runs them.
- **Impact:** Regressions, including the documented coverage failure, can merge and ship
  undetected.
  The entire quality gate rests on individual discipline.
- **Recommendation:** Add a [CI](#glossary) workflow running typecheck, lint, format check,
  unit tests, and build on push.
  Allow the coverage command to fail only until [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths)
  closes.
- **Method:** A pushed change produces a green run.
- **Verified:** yes - absence of CI files is mechanically verifiable
- **Runtime confirmed:** no - no pipeline exists to execute
- **Confidence:** HIGH
- **Mitigating factors:** The documented loop is real and the standard requires running it
  before changes.
  Discipline partially substitutes.
- **Breaking change:** None
- **Evidence:** [EVD-025](#verification-and-evidence-ledger), [EVD-031](#verification-and-evidence-ledger), `Inspected`

### FND-INF-002: Service worker can serve stale assets after redeploys

- **Pillar:** Infrastructure & [CI/CD](#glossary)
- **Severity:** Medium
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `public/js/sw.js:1,52-63`, `vite.config.ts:22-44`
- **Basis:** Cache freshness requires versioned cache names or hashed asset [URLs](#glossary)
- **Absence:** No documented rationale - hashless names are documented as a `file://` constraint, but the staleness interaction is not
- **Criterion:** DEP-CACHE - cache invalidation must track deployed versions
- **Description:** `CACHE_NAME` is fixed at `dosound-tracker-cache-v1`, non-navigation GET
  requests are served cache-first, and the build emits deterministic hashless `assets/[name].js`
  filenames.
  A redeploy writes the same filenames, so warm clients can keep serving the previous
  bundle indefinitely.
- **Impact:** Returning web users can run a stale application after a release with no signal to
  reload.
- **Recommendation:** Derive the cache name from the app version (already injected as
  `__APP_VERSION__`) and serve assets network-first or stale-while-revalidate.
- **Method:** A redeploy ships the new bundle to a warm client.
- **Verified:** yes - cache strategy and filename config are directly citable
- **Runtime confirmed:** no - redeploy behavior was not exercised
- **Confidence:** MEDIUM - the defect is structural. The browser-specific cache behavior is
  inferred not observed
- **Mitigating factors:** Electron builds bypass the service worker. Only the hosted web build
  is exposed.
- **Breaking change:** None
- **Evidence:** [EVD-011](#verification-and-evidence-ledger), `Inspected`

### FND-INF-003: Desktop artifacts are distributed unsigned

- **Pillar:** Infrastructure & [CI/CD](#glossary)
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `package.json` build block, `README.md`
- **Basis:** Distribution integrity practice. README documents the unsigned state itself
- **Absence:** Deliberate - recorded decision - the README documents the unsigned state and the workaround
- **Criterion:** DEP-SIGN - released binaries should carry tamper evidence at declared scale
- **Description:** electron-builder targets macOS, Windows, and Linux with no signing identity
  configured.
  The README documents the unsigned state and the `xattr` workaround.
- **Impact:** Users get platform warnings and downloads carry no tamper evidence. Acceptable at
  hobbyist scale, wrong if distribution grows.
- **Recommendation:** Publish per-release checksums now. Evaluate signing and notarization when
  distribution justifies the cost.
- **Method:** Published checksums verify downloads.
- **Verified:** yes - config and documentation are directly citable
- **Runtime confirmed:** no - packaging was not executed
- **Confidence:** HIGH
- **Mitigating factors:** Documented and user-visible. `README.md` is honest about the state.
- **Breaking change:** None
- **Evidence:** [EVD-033](#verification-and-evidence-ledger), [EVD-004](#verification-and-evidence-ledger), `Inspected`

### FND-AIP-001: AI provenance is disclosed but per-change compliance is unmeasurable

- **Pillar:** AI Provenance & Code Origin
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `README.md`, `docs/prompt/`, git trailers
- **Basis:** `docs/COPYRIGHTS.md` requires verifying [AI](#glossary)-generated code originality,
  no marking convention exists to measure it
- **Absence:** No documented rationale - no per-change convention is recorded
- **Criterion:** AIP-TRACE - generated-artifact provenance must be attributable per change
- **Provenance basis:** Declared - the README names the authoring tools and the prompt archive exists
- **Description:** The README names Windsurf and GPT 5.1 as authoring tools and `docs/prompt/`
  archives task prompts - strong disclosure in aggregate.
  Ten of 705 commits carry tool
  trailers.
  But nothing marks which individual files or changes were [AI](#glossary)-authored, so
  the originality-verification rule cannot be measured per artifact.
- **Impact:** Provenance claims exist at project level but cannot be audited per change.
- **Recommendation:** Adopt a per-change disclosure convention (commit trailer or plan-doc field)
  recording [AI](#glossary) assistance.
- **Method:** Generated changes carry disclosure markers.
- **Verified:** yes - disclosure surfaces were enumerated
- **Runtime confirmed:** no - source-only audit
- **Confidence:** MEDIUM - absence of a convention is verifiable. Compliance would still need
  author cooperation
- **Mitigating factors:** Disclosure is already better than typical: tools named, prompts
  archived, some trailers present.
- **Breaking change:** None
- **Evidence:** [EVD-003](#verification-and-evidence-ledger), [EVD-032](#verification-and-evidence-ledger), `Inspected`

### FND-CPR-001: License policy whitelist is narrower than the resolved dependency set

- **Pillar:** Copyrights & Originality
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `docs/COPYRIGHTS.md`, `package-lock.json`
- **Basis:** The policy permits [MIT](#glossary), Apache-2.0, [BSD](#glossary), [ISC](#glossary), Boost only
- **Absence:** No documented rationale - resolved classes grew past the list
- **Criterion:** CPR-LIC - resolved dependency licenses must stay inside the declared policy
- **Description:** The lockfile resolves BlueOak-1.0.0 (9), CC-BY-4.0 (1), [WTFPL](#glossary)
  variants (3), [MIT](#glossary)-0 (2), and CC0-1.0 (1) - all permissive-class, none on the
  permitted list. 222 packages declare no license at all.
- **Impact:** The project cannot demonstrate its own license policy holds without a case-by-case
  review.
  Redistribution relies on the lockfile alone.
- **Recommendation:** Generate a third-party notices inventory covering every resolved class, or
  extend the permitted-license list with the resolved permissive classes.
- **Method:** The inventory enumerates every resolved license class.
- **Verified:** yes - license fields were extracted mechanically
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH - the class census is complete
- **Mitigating factors:** No copyleft class is present, so the substantive [GPL](#glossary) bar holds.
- **Breaking change:** None
- **Evidence:** [EVD-006](#verification-and-evidence-ledger), [EVD-007](#verification-and-evidence-ledger), [EVD-024](#verification-and-evidence-ledger), `Inspected`

### FND-CPR-002: ZX0 third-party attribution is absent from the central notice file

- **Pillar:** Copyrights & Originality
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** Unchanged
- **Targets:** `src/utils/zx0.ts:1-12`, `docs/COPYRIGHTS.md`
- **Basis:** `docs/COPYRIGHTS.md` requires documenting third-party code in `COPYRIGHTS.md` or
  `ATTRIBUTIONS.md`
- **Absence:** No documented rationale - in-file attribution exists, central record does not
- **Criterion:** CPR-ATTR - third-party attribution must appear where the policy names it
- **Description:** The [ZX0](#glossary) compressor is a ported algorithm carrying proper in-file
  [BSD](#glossary)-3-Clause attribution to Einar Saukas, but `COPYRIGHTS.md` - the file the
  project designates for third-party attribution - does not list it.
- **Impact:** Trivial compliance gap. Attribution exists but not where the project's own policy
  requires it.
- **Recommendation:** Add the [ZX0](#glossary) entry (author, license, source) to
  `COPYRIGHTS.md`.
- **Method:** `COPYRIGHTS.md` lists the component.
- **Verified:** yes - both files are directly citable
- **Runtime confirmed:** no - source-only audit
- **Confidence:** HIGH
- **Mitigating factors:** In-file attribution already satisfies the license's notice clause. The
  gap is against the project's own stricter rule.
- **Breaking change:** None
- **Evidence:** [EVD-023](#verification-and-evidence-ledger), `Inspected`

### FND-STR-001: Test file names and placement diverge from their subjects

- **Pillar:** Structure & Organization
- **Severity:** Low
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `test/hooks/useDataManagement.test.ts`, `test/hooks/useDataManagement.hook.test.tsx`, `test/utils/exportMax.test`
- **Basis:** Tier T1/T2: `docs/standard/ts-react-development.md` requires one test file per
  module kept close to its subject.
  `TESTING.md` prescribes domain-mirrored `test/` layout.
  The
  observed convention is `<subject-file-name>.test.<ext>`
- **Absence:** No documented rationale for the divergence
- **Criterion:** STR-TEST - test file names and locations must identify the module they exercise
- **Description:** `test/hooks/useDataManagement.test.ts` contains only `parseSongFromYaml`
  tests - the subject's real suite is `test/utils/songParser.test.ts` - so the filename claims a
  hook it never imports.
  Its sibling `useDataManagement.hook.test.tsx` (which does test the hook)
  uses a one-off `.hook.test` infix no other file uses.
  Together with the uncollectable
  `exportMax.test` ([FND-CQY-002](#fnd-cqy-002-tracked-duplicate-test-file-never-executes)), three of 44 test files diverge
  from the mirror convention.
- **Impact:** A reader mapping tests to modules is misled. The hook appears covered at a glance
  in a way it partly is not, and naming is inconsistent within the suite.
- **Recommendation:** Rename `useDataManagement.test.ts` to reflect `songParser` coverage (or
  merge it into `test/utils/songParser.test.ts`), rename the harness file to
  `useDataManagement.test.tsx`, and delete or merge `exportMax.test`.
- **Method:** `find test -name '*.test.*'` shows only subject-mirroring names that the Vitest
  glob collects.
- **Verified:** yes - file contents and names are directly citable
- **Runtime confirmed:** no - suite membership was verified by glob, not execution
- **Confidence:** HIGH - the misplaced file's only `describe` block targets `parseSongFromYaml`
- **Mitigating factors:** 41 of 44 test files follow the mirror convention cleanly.
- **Breaking change:** None - test-file moves only
- **Evidence:** [EVD-014](#verification-and-evidence-ledger), [EVD-015](#verification-and-evidence-ledger), [EVD-052](#verification-and-evidence-ledger), `Inspected`

## Technical Debt Register

| ID                                                                    | Item                                                                  | Category        | Source                                                                                                                                                                                                                                                                                                                        | Estimated Remediation                                   | Cost of Delay                                                   | Status |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| [TDR-001](#tdr-001-central-orchestrator-decomposition)                | Central orchestrator decomposition                                    | Maintainability | [FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)                                                                                                                                                                                                                                | High effort, staged extraction across releases          | Each feature change pays navigation and merge cost in `App.tsx` | Open   |
| [TDR-002](#tdr-002-core-path-test-backlog)                            | Core-path test backlog (synth, exports breadth, worker, modals)       | Reliability     | [FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin)                                                                                                                                                                                                                                    | High effort, characterization tests across five areas   | Every audio or export change ships with weak behavioral net     | Open   |
| [TDR-003](#tdr-003-hand-rolled-markdown-renderer-and-absent-csp)      | Hand-rolled markdown renderer and sanitizer                           | Security        | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                                                                                                                                                                                                                                              | Medium effort, sanitizer tests plus [CSP](#glossary)    | Each new markdown feature must re-derive escaping safety        | Open   |
| [TDR-004](#tdr-004-documentation-figure-drift-and-dead-test-artifact) | Documentation figure drift and dead test artifact                     | Maintainability | [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)                                                                                                                                                                                                                                                  | Low effort, refresh pass plus one deletion              | Stale figures compound into misleading change plans             | Open   |
| [TDR-005](#tdr-005-verification-loop-automation-debt)                 | Verification-loop automation debt                                     | Reliability     | [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)                                                                                                                                                                                                                                  | Medium effort, one [CI](#glossary) workflow plus upkeep | Manual-only gates let the failure classes above recur           | Open   |
| [TDR-006](#tdr-006-test-file-naming-and-placement-debt)               | Test-file naming and placement debt                                   | Maintainability | [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)                                                                                                                                                                                                                                         | Low effort, three file renames or merges                | Misleading names silently distort perceived coverage            | Open   |
| [TDR-007](#tdr-007-declared-versus-observed-style-drift)              | Declared-versus-observed style drift (abbreviations, alias, comments) | Conformance     | [FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard), [FND-CQY-006](#fnd-cqy-006-non-null-assertions-lack-the-required-reason-comments), [FND-CQY-007](#fnd-cqy-007-numbered-and-duplicated-section-comment-in-usemidits), [FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused) | Low effort, localized edits plus one standard amendment | Written standards lose authority as violations accumulate       | Open   |

### TDR-001: Central orchestrator decomposition

- **Category:** Maintainability
- **Source:** [FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)
- **Description:** `src/App.tsx` is 2488 lines with ~20 hook wirings and inline render sections. Five hooks individually exceed 500 lines.
- **Cost:** High - staged extraction across releases, each keeping the byte-identical export contract green.
- **Delay:** Every playback, [MIDI](#glossary), or song-management change pays navigation and merge cost in the monolith.
- **Status:** Open

### TDR-002: Core-path test backlog

- **Category:** Reliability
- **Source:** [FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin)
- **Description:** Synth, exports breadth, worker, and modal paths carry the weakest behavioral coverage while the configured gate documents itself failing.
- **Cost:** High - characterization tests across five areas, including golden-output export tests.
- **Delay:** Every audio or export change ships with a thin regression net, and the failing gate normalizes failure.
- **Status:** Open

### TDR-003: Hand-rolled markdown renderer and absent CSP

- **Category:** Security
- **Source:** [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)
- **Description:** A bespoke markdown parser feeds two `dangerouslySetInnerHTML` sinks with no [CSP](#glossary) second layer.
- **Cost:** Medium - sanitizer tests, [CSP](#glossary) rollout, and a possible library swap.
- **Delay:** Each new markdown feature must re-derive escaping safety from scratch.
- **Status:** Open

### TDR-004: Documentation figure drift and dead test artifact

- **Category:** Maintainability
- **Source:** [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)
- **Description:** Three source-of-truth documents carry measured-wrong figures and one tracked test file never executes.
- **Cost:** Low - a refresh pass plus one file deletion.
- **Delay:** Stale figures compound into misleading change plans.
- **Status:** Open

### TDR-005: Verification-loop automation debt

- **Category:** Reliability
- **Source:** [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)
- **Description:** The documented six-step verification loop is manual-only. No pipeline executes it.
- **Cost:** Medium - one [CI](#glossary) workflow plus upkeep.
- **Delay:** Manual-only gates let every failure class above recur undetected.
- **Status:** Open

### TDR-006: Test-file naming and placement debt

- **Category:** Maintainability
- **Source:** [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)
- **Description:** One test file names a hook it never imports, one uses a one-off `.hook.test` infix, and one escapes the glob entirely.
- **Cost:** Low - three file renames or merges.
- **Delay:** Misleading names silently distort perceived coverage.
- **Status:** Open

### TDR-007: Declared-versus-observed style drift

- **Category:** Maintainability
- **Source:** [FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard), [FND-CQY-006](#fnd-cqy-006-non-null-assertions-lack-the-required-reason-comments), [FND-CQY-007](#fnd-cqy-007-numbered-and-duplicated-section-comment-in-usemidits), [FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused)
- **Description:** Abbreviated identifiers, missing `REASON:` comments, a duplicated numbered comment, and an unused import alias all diverge from declared rules.
- **Cost:** Low - localized edits plus one standard amendment.
- **Delay:** Written standards lose authority as violations accumulate.
- **Status:** Open

## Unified Risk Register

| ID                                                                                 | Title                                                                      | Source                                                                                            | Impact | Likelihood | Rating | Mitigation                                                 |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ | ---------- | ------ | ---------------------------------------------------------- |
| [RSK-001](#rsk-001-regressions-merge-undetected-without-ci-enforcement)            | Regressions merge undetected without [CI](#glossary) enforcement           | [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)      | MEDIUM | MEDIUM     | MEDIUM | add a [CI](#glossary) workflow running the documented loop |
| [RSK-002](#rsk-002-redeploys-serve-stale-or-skewed-web-assets)                     | Redeploys serve stale or skewed web assets                                 | [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)                 | MEDIUM | MEDIUM     | MEDIUM | Version the cache name, network-first assets               |
| [RSK-003](#rsk-003-maintainer-unavailability-halts-all-delivery)                   | Maintainer unavailability halts all delivery                               | [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)                       | HIGH   | LOW        | MEDIUM | Name a backup owner or fork path                           |
| [RSK-004](#rsk-004-orchestrator-growth-compounds-change-defects)                   | Orchestrator growth compounds change defects                               | [FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)    | MEDIUM | MEDIUM     | MEDIUM | Stage the decomposition                                    |
| [RSK-005](#rsk-005-injected-markup-renders-through-the-markdown-sink)              | Injected markup renders through the markdown sink                          | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                  | HIGH   | LOW        | MEDIUM | [CSP](#glossary) plus hostile-fixture tests                |
| [RSK-006](#rsk-006-ui-regressions-reach-releases-without-e2e-checks)               | [UI](#glossary) regressions reach releases without [E2E](#glossary) checks | [FND-CQY-003](#fnd-cqy-003-no-end-to-end-specs-exist-despite-configured-playwright)               | MEDIUM | MEDIUM     | MEDIUM | Playwright smoke suite                                     |
| [RSK-007](#rsk-007-license-policy-non-conformance-surfaces-late)                   | License-policy non-conformance surfaces late                               | [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set) | LOW    | MEDIUM     | LOW    | Generate a notices inventory                               |
| [RSK-008](#rsk-008-dead-test-file-implies-coverage-that-does-not-run)              | Dead test file implies coverage that does not run                          | [FND-CQY-002](#fnd-cqy-002-tracked-duplicate-test-file-never-executes)                            | LOW    | LOW        | LOW    | Remove or merge the stray file                             |
| [RSK-009](#rsk-009-tampered-or-mismatched-binaries-reach-users-unverified)         | Tampered or mismatched binaries reach users unverified                     | [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)                            | MEDIUM | LOW        | LOW    | Publish checksums, then sign                               |
| [RSK-010](#rsk-010-stale-documented-figures-mislead-change-planning)               | Stale documented figures mislead change planning                           | [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)                      | LOW    | MEDIUM     | LOW    | Refresh figures per release                                |
| [RSK-011](#rsk-011-device-permission-granted-beyond-the-intended-origin)           | Device permission granted beyond the intended origin                       | [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)          | MEDIUM | LOW        | LOW    | Scope the grant to the app origin                          |
| [RSK-012](#rsk-012-undisclosed-generated-code-lands-without-trace)                 | Undisclosed generated code lands without trace                             | [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)  | LOW    | LOW        | LOW    | Per-change disclosure convention                           |
| [RSK-013](#rsk-013-misplaced-test-file-masks-thin-coverage-of-the-claimed-subject) | Misplaced test file masks thin coverage of the claimed subject             | [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)             | LOW    | LOW        | LOW    | Rename or merge the file                                   |

### RSK-001: Regressions merge undetected without CI enforcement

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - merges land whenever the single maintainer pushes, and the documented gate already fails
- **Residual:** MEDIUM
- **Status:** Open
- **Description:** No [CI](#glossary) workflow exists, so the documented typecheck/lint/format/test loop executes only when a human runs it.
- **Impact:** Any defect class the loop would catch can reach the default branch without signal.
- **Trigger:** Any push that would fail the documented checks.
- **Controls:** The written verification requirements in `TESTING.md` and `standard/ts-react-development.md`.
- **Mitigation:** Add a [CI](#glossary) workflow running the documented loop.
- **Closure:** A pushed change produces a green [CI](#glossary) run.
- **Source:** [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)
- **Confidence:** HIGH - the absence of CI files is mechanical

### RSK-002: Redeploys serve stale or skewed web assets

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - every redeploy hits warm clients under a fixed cache name and hashless asset names
- **Residual:** MEDIUM
- **Status:** Open
- **Description:** The service worker serves non-navigation GET requests cache-first under a version-fixed cache name while the build emits unversioned filenames.
- **Impact:** Returning web users can run a stale application after a release with no signal to reload.
- **Trigger:** A redeploy while a client holds a warm cache.
- **Controls:** The navigation preload and `activate` cleanup exist. Electron builds bypass the worker.
- **Mitigation:** Derive the cache name from `__APP_VERSION__` and reorder the fetch strategy.
- **Closure:** A redeploy serves the new bundle to a warm client.
- **Source:** [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)
- **Confidence:** MEDIUM - strategy and filenames are citable, browser cache behavior unobserved

### RSK-003: Maintainer unavailability halts all delivery

- **Severity:** HIGH
- **Likelihood:** LOW - a structural property, not an imminent event
- **Residual:** MEDIUM
- **Status:** Open
- **Description:** All 679 non-merge commits belong to one author and no continuity owner is documented.
- **Impact:** Maintainer unavailability stops releases, review, and institutional knowledge transfer.
- **Trigger:** Maintainer departure, absence, or incapacity.
- **Controls:** The deep `docs/` corpus and prompt archive preserve much of the reasoning.
- **Mitigation:** Name a backup maintainer or document a fork path.
- **Closure:** A named continuity owner exists in the governance documents.
- **Source:** [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)
- **Confidence:** HIGH - the census is unambiguous

### RSK-004: Orchestrator growth compounds change defects

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - the file has grown 294 lines since the previous audit and remains the change hotspot
- **Residual:** MEDIUM
- **Status:** Open
- **Description:** `App.tsx` concentrates orchestration, wiring, and render markup for the whole application.
- **Impact:** Defects concentrate where change is most frequent, and each edit risks touching audio-critical paths.
- **Trigger:** Any feature change touching playback, [MIDI](#glossary), or song management.
- **Controls:** Documented module boundaries, a real hook layer, and the audio-critical exception rules.
- **Mitigation:** Stage the documented decomposition.
- **Closure:** Extraction steps keep the suite and byte-identical exports green.
- **Source:** [FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)
- **Confidence:** HIGH - measured directly

### RSK-005: Injected markup renders through the markdown sink

- **Severity:** HIGH
- **Likelihood:** LOW - content is first-party bundled files and escaping exists before formatting
- **Residual:** MEDIUM
- **Status:** Open
- **Description:** Two `dangerouslySetInnerHTML` sinks consume a hand-rolled markdown renderer with no [CSP](#glossary) second layer.
- **Impact:** A parser regression or edge case becomes markup injection inside a privileged [DOM](#glossary).
- **Trigger:** A change to `renderMarkdown` or its callers that weakens escaping.
- **Controls:** [HTML](#glossary) entity escaping, scheme-limited linkification, `rel="noreferrer"`, first-party content.
- **Mitigation:** Add a [CSP](#glossary) and hostile-fixture tests. Evaluate a vetted sanitizer.
- **Closure:** Injection fixtures escape correctly and a [CSP](#glossary) is present in built [HTML](#glossary).
- **Source:** [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)
- **Confidence:** MEDIUM - sink verified, exploitability Theoretical-tier

### RSK-006: UI regressions reach releases without E2E checks

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - no outer-layer suite exists at all
- **Residual:** MEDIUM
- **Status:** Open
- **Description:** The configured Playwright harness and documented e2e flows have no specs.
- **Impact:** Load, playback, file, and export flows can break with no automated check.
- **Trigger:** Any change breaking a documented e2e flow.
- **Controls:** The unit suite partially covers component behavior.
- **Mitigation:** Add a Playwright smoke suite.
- **Closure:** The smoke suite passes against the preview build.
- **Source:** [FND-CQY-003](#fnd-cqy-003-no-end-to-end-specs-exist-despite-configured-playwright)
- **Confidence:** HIGH - the empty directory is mechanical

### RSK-007: License-policy non-conformance surfaces late

- **Severity:** LOW
- **Likelihood:** MEDIUM - five resolved classes already sit outside the permitted list
- **Residual:** LOW
- **Status:** Open
- **Description:** The lockfile resolves five permissive classes the policy does not list, and 222 packages declare no license.
- **Impact:** The project cannot demonstrate its own license policy holds.
- **Trigger:** Redistribution, acquisition, or compliance review.
- **Controls:** All resolved classes are permissive. No copyleft is present.
- **Mitigation:** Generate a notices inventory or extend the permitted list.
- **Closure:** The inventory enumerates every resolved license class.
- **Source:** [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set)
- **Confidence:** HIGH - the class census is complete

### RSK-008: Dead test file implies coverage that does not run

- **Severity:** LOW
- **Likelihood:** LOW - the file is inert, not failing
- **Residual:** LOW
- **Status:** Open
- **Description:** A tracked duplicate test file matches no Vitest include pattern and has drifted from its live sibling.
- **Impact:** A file that looks like coverage contributes none and can mislead edits.
- **Trigger:** A change that edits the stale file believing it is live.
- **Controls:** The live `exportMax.test.ts` covers the same surface.
- **Mitigation:** Delete or merge the stray file.
- **Closure:** The file is absent or executes under a `.ts` name.
- **Source:** [FND-CQY-002](#fnd-cqy-002-tracked-duplicate-test-file-never-executes)
- **Confidence:** HIGH - glob matching is mechanical

### RSK-009: Tampered or mismatched binaries reach users unverified

- **Severity:** MEDIUM
- **Likelihood:** LOW - distribution is a single documented host today
- **Residual:** LOW
- **Status:** Open
- **Description:** Desktop artifacts ship unsigned with no published checksums.
- **Impact:** Users cannot detect a corrupted or replaced download.
- **Trigger:** Distribution growth or a compromised download host.
- **Controls:** README documents the unsigned state honestly.
- **Mitigation:** Publish checksums now. Evaluate signing when scale justifies it.
- **Closure:** Published checksums verify downloads.
- **Source:** [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)
- **Confidence:** HIGH - config and documentation are citable

### RSK-010: Stale documented figures mislead change planning

- **Severity:** LOW
- **Likelihood:** MEDIUM - three documents already carry drifted figures
- **Residual:** LOW
- **Status:** Open
- **Description:** ARCHITECTURE.md, TESTING.md, and SPECIFICATION.md carry measured-wrong figures.
- **Impact:** Plans and audits trusting the docs work from wrong numbers.
- **Trigger:** Any change planned against a documented figure.
- **Controls:** The drift is numeric. Prose descriptions stay accurate.
- **Mitigation:** Refresh the figures and add a per-release doc pass.
- **Closure:** Documented figures match measurement.
- **Source:** [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)
- **Confidence:** HIGH - mismatches are citable

### RSK-011: Device permission granted beyond the intended origin

- **Severity:** MEDIUM
- **Likelihood:** LOW - only first-party content loads today
- **Residual:** LOW
- **Status:** Open
- **Description:** [MIDI](#glossary) permission handlers grant any requesting frame without an origin check.
- **Impact:** A future injection sink would find device access pre-granted.
- **Trigger:** Introduction of remote or injectable content reaching the renderer.
- **Controls:** Only the packaged app or localhost dev server loads today.
- **Mitigation:** Scope grants to the expected origin.
- **Closure:** A non-matching origin request is denied.
- **Source:** [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)
- **Confidence:** HIGH - the missing check is mechanical

### RSK-012: Undisclosed generated code lands without trace

- **Severity:** LOW
- **Likelihood:** LOW - the project already discloses its tooling
- **Residual:** LOW
- **Status:** Open
- **Description:** [AI](#glossary) authorship is disclosed in aggregate but not attributable per change.
- **Impact:** Provenance claims cannot be audited at the artifact level.
- **Trigger:** A compliance or provenance review of a specific change.
- **Controls:** Named tools, a prompt archive, and tool trailers on ten commits.
- **Mitigation:** Adopt a per-change disclosure convention.
- **Closure:** Generated changes carry disclosure markers.
- **Source:** [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)
- **Confidence:** MEDIUM - absence verifiable, compliance needs author cooperation

### RSK-013: Misplaced test file masks thin coverage of the claimed subject

- **Severity:** LOW
- **Likelihood:** LOW - the misread matters only when the hook changes
- **Residual:** LOW
- **Status:** Open
- **Description:** `useDataManagement.test.ts` tests `parseSongFromYaml`, not its namesake hook, and a sibling uses a one-off `.hook.test` infix.
- **Impact:** Filenames overstate the suite shape. The hook looks more covered than it is.
- **Trigger:** A coverage review or a change trusting the filename.
- **Controls:** The hook is partially covered by the harness file.
- **Mitigation:** Rename or merge the mismatched files.
- **Closure:** Test filenames mirror their subjects.
- **Source:** [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)
- **Confidence:** HIGH - file contents are directly citable

## Actionable Remediation Roadmap

| ID                                                                              | Priority        | Finding                                                                                                                                                             | Action                                                                                                                                                                 | Effort | Impact | Confidence | Verification                                                                             |
| ------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------- | ---------------------------------------------------------------------------------------- |
| [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths)            | [P2](#glossary) | [FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin)                                                                          | Close the coverage gap on synth, exports, worker, and modal paths, or ratchet the threshold to the measured value                                                      | High   | High   | Medium     | `npm run test:coverage` exits 0                                                          |
| [REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop)                   | [P2](#glossary) | [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)                                                                        | Add a [CI](#glossary) workflow running typecheck, lint, format check, unit tests, and build on push and PR                                                             | High   | Medium | Low        | A pushed change produces a green run                                                     |
| [REC-003](#rec-003-version-the-service-worker-cache-and-reorder-asset-strategy) | [P2](#glossary) | [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)                                                                                   | Derive the service-worker cache name from the app version and serve assets network-first                                                                               | Medium | Low    | Low        | A redeploy ships the new bundle to warm clients                                          |
| [REC-004](#rec-004-refresh-documented-figures-and-add-a-per-release-pass)       | [P2](#glossary) | [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)                                                                                        | Refresh stale figures in ARCHITECTURE.md, TESTING.md, and SPECIFICATION.md and add a per-release doc-refresh step                                                      | Medium | Low    | Low        | Documented figures match measurement                                                     |
| [REC-005](#rec-005-remove-the-undiscovered-duplicate-test)                      | [P2](#glossary) | [FND-CQY-002](#fnd-cqy-002-tracked-duplicate-test-file-never-executes)                                                                                              | Delete or merge the stray `exportMax.test` file                                                                                                                        | Low    | Low    | Low        | `git ls-files` no longer lists it, or it runs under a `.ts` name                         |
| [REC-006](#rec-006-add-a-playwright-smoke-suite)                                | [P3](#glossary) | [FND-CQY-003](#fnd-cqy-003-no-end-to-end-specs-exist-despite-configured-playwright)                                                                                 | Add a Playwright smoke suite for load, song open, playback, and one export                                                                                             | Medium | Medium | Low        | `npx playwright test --project=chromium` passes                                          |
| [REC-007](#rec-007-stage-the-orchestrator-decomposition)                        | [P3](#glossary) | [FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)                                                                      | Stage the App.tsx decomposition per the documented refactoring method                                                                                                  | High   | High   | High       | Extraction steps keep typecheck, lint, tests, and byte-identical exports green           |
| [REC-008](#rec-008-harden-the-markdown-rendering-path)                          | [P3](#glossary) | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                                                                                    | Add a [CSP](#glossary), hostile-fixture tests for `renderMarkdown`, and evaluate a vetted sanitizer                                                                    | High   | Medium | Low        | Injection fixtures escape correctly, [CSP](#glossary) present in built [HTML](#glossary) |
| [REC-009](#rec-009-scope-the-midi-permission-grant)                             | [P4](#glossary) | [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)                                                                            | scope [MIDI](#glossary) permission grants to the packaged or dev origin                                                                                                | Medium | Low    | Low        | Non-matching origin is denied                                                            |
| [REC-010](#rec-010-reconcile-the-license-policy-with-the-resolved-set)          | [P4](#glossary) | [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set)                                                                   | Generate a third-party notices inventory or extend the permitted-license list                                                                                          | Medium | Medium | Low        | Inventory enumerates every resolved license class                                        |
| [REC-011](#rec-011-record-the-zx0-attribution-centrally)                        | [P4](#glossary) | [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file)                                                                      | Add the [ZX0](#glossary) attribution to `docs/COPYRIGHTS.md`                                                                                                           | Low    | Low    | Low        | Component listed with author, license, source                                            |
| [REC-012](#rec-012-name-a-continuity-owner)                                     | [P4](#glossary) | [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)                                                                                         | Name a backup maintainer or fork path in the governance docs                                                                                                           | Medium | Low    | Low        | A named continuity owner exists                                                          |
| [REC-013](#rec-013-publish-release-checksums-then-evaluate-signing)             | [P4](#glossary) | [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)                                                                                              | Publish per-release checksums, then evaluate signing and notarization                                                                                                  | Medium | Medium | Medium     | Published checksums verify downloads                                                     |
| [REC-014](#rec-014-adopt-a-per-change-ai-disclosure-convention)                 | [P3](#glossary) | [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)                                                                    | Adopt a per-change [AI](#glossary)-disclosure convention in commits or plan docs                                                                                       | Low    | Low    | Low        | Generated changes carry disclosure markers                                               |
| [REC-015](#rec-015-repair-test-file-names-and-placement)                        | [P3](#glossary) | [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)                                                                               | Rename or merge `useDataManagement.test.ts`, drop the `.hook` infix, and resolve `exportMax.test` alongside [REC-005](#rec-005-remove-the-undiscovered-duplicate-test) | Low    | Low    | High       | Every test filename identifies its subject and matches the Vitest glob                   |
| [REC-016](#rec-016-rename-abbreviated-identifiers)                              | [P4](#glossary) | [FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard)                                                                            | Rename the `*Idx`/`pIdx`/`pVal` locals to full words in `playbackSimulation.ts` and `asm.ts`                                                                           | Low    | Low    | High       | `grep -rE '[a-z]Idx\b' src` returns empty                                                |
| [REC-017](#rec-017-restore-comment-rule-conformance)                            | [P4](#glossary) | [FND-CQY-006](#fnd-cqy-006-non-null-assertions-lack-the-required-reason-comments), [FND-CQY-007](#fnd-cqy-007-numbered-and-duplicated-section-comment-in-usemidits) | Add `REASON:` comments to the three `zx0.ts` assertions and delete the duplicated numbered comment                                                                     | Low    | Low    | High       | Comment-rule greps return clean                                                          |
| [REC-018](#rec-018-adopt-or-remove-the--alias)                                  | [P4](#glossary) | [FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused)                                                                                                      | Adopt the `@/` alias for cross-module imports or amend the standard and remove the configuration                                                                       | Medium | Low    | Low        | Alias uses exist, or the standard records relative imports as intended                   |

### REC-001: Close the coverage gap on the highest-risk paths

- **Priority:** P2
- **Finding:** [FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin)
- **Postcondition:** `npm run test:coverage` exits 0 meeting the configured 80 percent thresholds, or the thresholds are ratcheted to a passing measured value.
- **Description:** Write characterization tests for `YM2149`, `SoundDriver`, `SequencerEngine`, the five export modules, and the modal and worker surfaces. Alternatively ratchet the thresholds to the measured value as a declared interim state.
- **Impact:** The declared quality gate passes and the riskiest paths gain a behavioral net.
- **Effort:** High - characterization coverage across five source areas is real test-authoring work.
- **Complexity:** Medium - the audio core is timing- and format-sensitive, so tests need fixture or golden-output design.
- **Verification:** `npm run test:coverage` exits 0.

### REC-002: Add a CI workflow for the documented loop

- **Priority:** P2
- **Finding:** [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop)
- **Postcondition:** A [CI](#glossary) workflow runs typecheck, lint, format check, unit tests, and build on every push and pull request.
- **Description:** Add a GitHub Actions (or equivalent) workflow executing the six documented verification steps. Allow coverage to fail only until [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths) lands.
- **Impact:** Every declared gate runs automatically on change instead of relying on discipline.
- **Effort:** Medium - one workflow file plus upkeep.
- **Complexity:** Low - the commands are already documented and scripted.
- **Verification:** A pushed change produces a green run.

### REC-003: Version the service-worker cache and reorder asset strategy

- **Priority:** P2
- **Finding:** [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)
- **Postcondition:** The service-worker cache name carries the app version and non-navigation assets are served network-first or stale-while-revalidate.
- **Description:** Derive `CACHE_NAME` from `__APP_VERSION__` (already injected by the Vite `define`) and change the fetch strategy for non-navigation GETs.
- **Impact:** Redeploys deliver the new bundle to warm clients.
- **Effort:** Medium - a small worker change plus a redeploy verification pass.
- **Complexity:** Low - the version constant already exists in the build.
- **Verification:** A redeploy serves the new bundle to a warm client.

### REC-004: Refresh documented figures and add a per-release pass

- **Priority:** P2
- **Finding:** [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)
- **Postcondition:** Documented figures in `ARCHITECTURE.md`, `TESTING.md`, and `SPECIFICATION.md` match measured values, and the bump procedure includes a doc-refresh step.
- **Description:** Update the Electron version, `App.tsx` size, hook count, `src/utils` file count, and test-gap list. Add a figures check to `docs/VERSIONING.md`.
- **Impact:** Sources of truth describe the tree they govern.
- **Effort:** Low - a handful of edits plus one procedure line.
- **Complexity:** Low - plain documentation edits.
- **Verification:** Documented figures match `wc -l` and `git ls-files` measurements.

### REC-005: Remove the undiscovered duplicate test

- **Priority:** P2
- **Finding:** [FND-CQY-002](#fnd-cqy-002-tracked-duplicate-test-file-never-executes)
- **Postcondition:** No tracked test file escapes the Vitest include glob.
- **Description:** Delete `test/utils/exportMax.test`, merging any unique assertions into `exportMax.test.ts` first.
- **Impact:** Suite shape matches executed coverage.
- **Effort:** Low - one deletion and a diff pass.
- **Complexity:** Low - the live sibling already exists.
- **Verification:** `git ls-files` no longer lists the stray file.

### REC-006: Add a Playwright smoke suite

- **Priority:** P3
- **Finding:** [FND-CQY-003](#fnd-cqy-003-no-end-to-end-specs-exist-despite-configured-playwright)
- **Postcondition:** The `e2e/` directory holds specs covering the six flows `TESTING.md` documents, at minimum launch, note entry, playback, and one export.
- **Description:** Author Playwright specs against the preview server for the documented flows. Wire into [CI](#glossary) after [REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop).
- **Impact:** The outermost verification layer exists.
- **Effort:** Medium - browser-flow authoring against a tracker [UI](#glossary).
- **Complexity:** Medium - audio and worker timing need tolerant assertions.
- **Verification:** `npx playwright test --project=chromium` passes.

### REC-007: Stage the orchestrator decomposition

- **Priority:** P3
- **Finding:** [FND-ARC-001](#fnd-arc-001-2488-line-central-orchestrator-concentrates-wiring-and-change-risk)
- **Postcondition:** `App.tsx` loses render sections and hook-cluster wiring to coordinators along the documented module boundaries.
- **Description:** Extract hook clusters ([MIDI](#glossary) processing, file operations, song management) into coordinator hooks, then split render sections, keeping exports byte-identical per the refactoring contract.
- **Impact:** Change blast radius shrinks in the hottest file.
- **Effort:** High - staged extraction across releases.
- **Complexity:** High - twenty hook wirings and audio-critical paths must move without behavior change.
- **Verification:** Typecheck, lint, tests, and export byte-identity stay green at each step.

### REC-008: Harden the markdown rendering path

- **Priority:** P3
- **Finding:** [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)
- **Postcondition:** A restrictive [CSP](#glossary) is present and hostile markdown fixtures are escaped by tests.
- **Description:** Add a [CSP](#glossary) meta tag, adversarial fixtures for `renderMarkdown` (attribute injection, scheme smuggling, entity edge cases), and evaluate a vetted sanitizer as a second layer.
- **Impact:** The injection surface gains depth of defense.
- **Effort:** Medium - [CSP](#glossary) tuning plus a fixture suite.
- **Complexity:** Medium - [CSP](#glossary) can break inline behavior. Needs careful rollout.
- **Verification:** Injection fixtures escape correctly and [CSP](#glossary) is present in built [HTML](#glossary).

### REC-009: Scope the MIDI permission grant

- **Priority:** P4
- **Finding:** [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)
- **Postcondition:** Permission handlers verify the requesting origin before granting `midi` or `midiSysex`.
- **Description:** Check `webContents` origin or [URL](#glossary) against the packaged `file://` app and the dev `http://localhost` origin in both handlers.
- **Impact:** Device access is scoped to the intended origin.
- **Effort:** Low - a few lines in one file.
- **Complexity:** Low - the handler already exists.
- **Verification:** A non-matching origin is denied.

### REC-010: Reconcile the license policy with the resolved set

- **Priority:** P4
- **Finding:** [FND-CPR-001](#fnd-cpr-001-license-policy-whitelist-is-narrower-than-the-resolved-dependency-set)
- **Postcondition:** Every resolved license class is either inside the permitted list or recorded in a third-party notices inventory.
- **Description:** Either extend `docs/COPYRIGHTS.md` with the five resolved permissive classes or generate a `ATTRIBUTIONS.md` inventory covering all resolved classes.
- **Impact:** The declared policy demonstrably holds.
- **Effort:** Medium - an inventory across 590 packages needs generation tooling.
- **Complexity:** Low - permissive classes only need enumeration, not legal review.
- **Verification:** The inventory or list enumerates every resolved license class.

### REC-011: Record the ZX0 attribution centrally

- **Priority:** P4
- **Finding:** [FND-CPR-002](#fnd-cpr-002-zx0-third-party-attribution-is-absent-from-the-central-notice-file)
- **Postcondition:** The [ZX0](#glossary) compressor is listed in `docs/COPYRIGHTS.md` with author, license, and source.
- **Description:** Add the entry for the ported [ZX0](#glossary) decoder (Einar Saukas, BSD-3-Clause).
- **Impact:** The project's own attribution rule is satisfied.
- **Effort:** Low - one documentation line.
- **Complexity:** Low - the in-file header already carries the details.
- **Verification:** `COPYRIGHTS.md` lists the component.

### REC-012: Name a continuity owner

- **Priority:** P4
- **Finding:** [FND-ARC-002](#fnd-arc-002-single-author-contributor-concentration-is-high)
- **Postcondition:** A backup maintainer or fork path is recorded in the governance documents.
- **Description:** Add a continuity note to `docs/GUIDELINES.md` or `README.md`.
- **Impact:** Delivery does not depend on a single point of failure.
- **Effort:** Low - a decision plus one documentation entry.
- **Complexity:** Low - no code surface.
- **Verification:** A named continuity owner exists.

### REC-013: Publish release checksums, then evaluate signing

- **Priority:** P4
- **Finding:** [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)
- **Postcondition:** Each release publishes SHA-256 checksums for its artifacts.
- **Description:** Emit checksums in the electron-builder pipeline or a release script. Evaluate platform signing when distribution scale justifies it.
- **Impact:** Downloads gain tamper evidence.
- **Effort:** Medium - release tooling plus a documented checksum step.
- **Complexity:** Medium - signing involves certificates and platform enrolment when pursued.
- **Verification:** Published checksums verify downloads.

### REC-014: Adopt a per-change AI-disclosure convention

- **Priority:** P3
- **Finding:** [FND-AIP-001](#fnd-aip-001-ai-provenance-is-disclosed-but-per-change-compliance-is-unmeasurable)
- **Postcondition:** AI-assisted changes carry a disclosure marker in commits or plan documents.
- **Description:** Record a short trailer or plan-doc field marking [AI](#glossary) assistance. The prompt archive already supplies the material.
- **Impact:** Per-change provenance becomes auditable.
- **Effort:** Low - a convention line plus discipline.
- **Complexity:** Low - process-only change.
- **Verification:** Generated changes carry disclosure markers.

### REC-015: Repair test-file names and placement

- **Priority:** P3
- **Finding:** [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)
- **Postcondition:** Every test filename identifies the module it exercises and matches the Vitest glob.
- **Description:** Rename `useDataManagement.test.ts` to reflect its `parseSongFromYaml` subject or merge it into `test/utils/songParser.test.ts`. Rename the harness file to `useDataManagement.test.tsx`. Resolve `exportMax.test` under [REC-005](#rec-005-remove-the-undiscovered-duplicate-test).
- **Impact:** Test names map truthfully to coverage.
- **Effort:** Low - three file renames or merges.
- **Complexity:** Low - no test logic changes.
- **Verification:** `find test -name "*.test.*"` shows only subject-mirroring names that the Vitest glob collects.

### REC-016: Rename abbreviated identifiers

- **Priority:** P4
- **Finding:** [FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard)
- **Postcondition:** No `Idx`-suffixed or `p`-shorthand locals remain in `src/`.
- **Description:** Mechanical rename of `*Idx` to `*Index` and `pIdx`/`pVal` to `pitchIndex`/`pitchValue` in `playbackSimulation.ts` and `asm.ts`.
- **Impact:** The declared abbreviation rule holds.
- **Effort:** Low - local identifier renames in two files.
- **Complexity:** Low - compiler-checked renames only.
- **Verification:** `grep -rE "[a-z]Idx" src` returns empty.

### REC-017: Restore comment-rule conformance

- **Priority:** P4
- **Finding:** [FND-CQY-006](#fnd-cqy-006-non-null-assertions-lack-the-required-reason-comments), [FND-CQY-007](#fnd-cqy-007-numbered-and-duplicated-section-comment-in-usemidits)
- **Postcondition:** The three `zx0.ts` assertions carry `REASON:` comments and the duplicated numbered comment in `useMidi.ts` is removed.
- **Description:** Document the bounds invariant on each assertion and delete the `// 2.` section-marker lines.
- **Impact:** Declared comment rules hold.
- **Effort:** Low - four comment edits.
- **Complexity:** Low - comments only.
- **Verification:** The scans in [EVD-049](#verification-and-evidence-ledger) and [EVD-050](#verification-and-evidence-ledger) return clean.

### REC-018: Adopt or remove the `@/` alias

- **Priority:** P4
- **Finding:** [FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused)
- **Postcondition:** Cross-module imports use `@/`, or the standard records shallow relative imports as intended and the alias config is removed.
- **Description:** Either migrate imports to `@/` or amend `docs/standard/ts-react-development.md` and drop the alias configuration.
- **Impact:** Declaration and practice agree.
- **Effort:** Medium - a codemod over 430 imports, or a one-line standard amendment.
- **Complexity:** Low - either path is mechanical.
- **Verification:** Alias uses exist, or the standard records the change.

## Recommendation Classification

| ID                                                                              | Title                                                  | Class       | Rationale                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------- | ------------------------------------------------------------- |
| [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths)            | Close the coverage gap on the highest-risk paths       | Recommended | The project itself mandates the gate and documents it failing |
| [REC-002](#rec-002-add-a-ci-workflow-for-the-documented-loop)                   | Add a [CI](#glossary) workflow for the documented loop | Recommended | Every gate is currently manual-only                           |
| [REC-003](#rec-003-version-the-service-worker-cache-and-reorder-asset-strategy) | Version the cache and reorder asset strategy           | Recommended | The staleness defect is structural and user-facing            |
| [REC-004](#rec-004-refresh-documented-figures-and-add-a-per-release-pass)       | Refresh documented figures                             | Recommended | Sources of truth carry measured-wrong values                  |
| [REC-005](#rec-005-remove-the-undiscovered-duplicate-test)                      | Remove the undiscovered duplicate test                 | Recommended | Dead artifact with a clear fix                                |
| [REC-006](#rec-006-add-a-playwright-smoke-suite)                                | Add a Playwright smoke suite                           | Recommended | Harness configured, project documents the intent              |
| [REC-007](#rec-007-stage-the-orchestrator-decomposition)                        | Stage the orchestrator decomposition                   | Optional    | Deliberate recorded decision, beneficial but not blocking     |
| [REC-008](#rec-008-harden-the-markdown-rendering-path)                          | Harden the markdown path                               | Recommended | Injection surface without depth-of-defense controls           |
| [REC-009](#rec-009-scope-the-midi-permission-grant)                             | Scope the [MIDI](#glossary) permission grant           | Optional    | Defense-in-depth improvement on a bounded surface             |
| [REC-010](#rec-010-reconcile-the-license-policy-with-the-resolved-set)          | Reconcile license policy with resolved set             | Recommended | Project policy requires demonstrable compatibility            |
| [REC-011](#rec-011-record-the-zx0-attribution-centrally)                        | Record the [ZX0](#glossary) attribution centrally      | Recommended | Policy names the location, trivial cost                       |
| [REC-012](#rec-012-name-a-continuity-owner)                                     | Name a continuity owner                                | Optional    | Governance improvement, not a current defect                  |
| [REC-013](#rec-013-publish-release-checksums-then-evaluate-signing)             | Publish checksums then evaluate signing                | Optional    | Documented accepted state at current scale                    |
| [REC-014](#rec-014-adopt-a-per-change-ai-disclosure-convention)                 | Adopt per-change [AI](#glossary) disclosure            | Optional    | Provenance is already better than baseline                    |
| [REC-015](#rec-015-repair-test-file-names-and-placement)                        | Repair test-file names and placement                   | Recommended | Misleading names, trivial cost                                |
| [REC-016](#rec-016-rename-abbreviated-identifiers)                              | Rename abbreviated identifiers                         | Optional    | Conformance repair, cosmetic impact                           |
| [REC-017](#rec-017-restore-comment-rule-conformance)                            | Restore comment-rule conformance                       | Optional    | Conformance repair, cosmetic impact                           |
| [REC-018](#rec-018-adopt-or-remove-the--alias)                                  | Adopt or remove the `@/` alias                         | Optional    | Either direction resolves the drift                           |

## Operator Verification Handoff

Every material claim the audit could not resolve from source, with the exact command or
procedure and its pass criteria.

| Check                  | Command or procedure                                     | Pass criteria                                         | Resolves                                                                                                                                   |
| ---------------------- | -------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Typecheck              | `npm run typecheck`                                      | zero errors                                           | [EVD-035](#verification-and-evidence-ledger)                                                                                               |
| Lint                   | `npm run lint`                                           | zero errors, documented warning exemptions only       | [EVD-036](#verification-and-evidence-ledger), [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop) |
| Format                 | `npm run format` then `git status`                       | no modified files                                     | [EVD-036](#verification-and-evidence-ledger)                                                                                               |
| Build                  | `npm run build`                                          | exits 0                                               | [EVD-039](#verification-and-evidence-ledger)                                                                                               |
| Unit tests             | `npm test`                                               | all suites pass                                       | [EVD-037](#verification-and-evidence-ledger)                                                                                               |
| Coverage               | `npm run test:coverage`                                  | meets the 80 percent thresholds in `vitest.config.ts` | [EVD-013](#verification-and-evidence-ledger), [EVD-037](#verification-and-evidence-ledger)                                                 |
| [E2E](#glossary) suite | `npx playwright test --list`                             | collects specs (requires `e2e/` to exist)             | [EVD-012](#verification-and-evidence-ledger), [FND-CQY-003](#fnd-cqy-003-no-end-to-end-specs-exist-despite-configured-playwright)          |
| Advisory scan          | `npm audit`                                              | reports the current vulnerability state               | [EVD-040](#verification-and-evidence-ledger)                                                                                               |
| Packaging              | `npm run electron:build`                                 | produces installers for the three platforms           | [EVD-039](#verification-and-evidence-ledger), [FND-INF-003](#fnd-inf-003-desktop-artifacts-are-distributed-unsigned)                       |
| Cache freshness        | redeploy, then load with a warm service worker           | new bundle served                                     | [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)                                                          |
| Markdown sink          | feed hostile markdown fixtures to `renderMarkdown`       | all markup escaped                                    | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth)                                                           |
| Permission scoping     | request `midi` from a non-app origin in a packaged build | denied                                                | [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin)                                                   |

## Scope Exclusions

- **Dynamic/runtime penetration testing**.

`NOT PERFORMED` by default.

Security findings carry a `Theoretical`-tier exploitability narrative only.

A scoped live penetration test is a distinct, separately commissioned engagement.

- **Organizational and team interviews, business-fit assessment**.

`NOT PERFORMED` by default.

The report covers the engineering dimensions of a technical due diligence but not the
interview-based team, leadership, and problem-fit pillars a formal engagement adds.

- **Compliance certification and attestation**.

The report is not an [ISO/IEC](#glossary) 27001 certification, not a [SOC](#glossary) 2
attestation examination, and not a PCI-DSS conformance assessment.

Referenced standards such as [ISO/IEC](#glossary) 25010, OWASP ASVS,
and NIST SP 800-30 are used as scoring rubrics and coverage checklists only.

- **Live infrastructure and deployment environments**.

`NOT INSPECTED`.

No hosting environment, CDN state, or packaged installer artifact was examined.

- **End-user devices and browser runtime behavior**.

`NOT INSPECTED` dynamically.

The application was never executed.

- **Restricted documentation directories**.

`NOT INSPECTED` for content per `docs/GUIDELINES.md`. `docs/change/`, `docs/plan/`,
`docs/archive/`, `docs/refactoring/`, `docs/feature/`, `docs/prompt/`, and `docs/report/`
(beyond the audit baseline) were enumerated at directory level only.

- **Generated and dependency trees**.

`EXCLUDED` from all denominators: `node_modules/`, `dist/`, `release/`, `coverage/`,
`docs/report/` artifacts, and the gitignored `work/` path defined in `GUIDELINES.md`.

- **Runtime performance measurement**.

`NOT PERFORMED`.

The declared [NFR](#glossary) targets (frame rate, chip clock) were reviewed as text, not
measured.

- **Per-function cognitive-load census**.

`NOT RUN`.

Identifier and file-size censuses ran.

function-length, nesting-depth, and comment-quality
scoring inside functions were not mechanically measured, so SL-6 stays `UNKNOWN`.

**OWASP Top 10:2025 coverage statement**

Assessed in static scope: A02 Security Misconfiguration (no [CSP](#glossary), permission
scoping), A03 Software Supply Chain Failures (dependency hygiene, license classes), A05
Injection (markdown rendering path), A08 Software or Data Integrity Failures (unsigned
artifacts, stale asset delivery).

Not applicable to the subject: A01 Broken Access Control and A07 Authentication Failures (no
authentication or authorization surface), A04 Cryptographic Failures (no cryptographic
operations).

`NOT ASSESSED`: A06 Insecure Design (partially covered by architectural review but not modeled
end to end), A09 Security Logging and Alerting Failures (the `logger` is console-bound with no
alerting surface), A10 Mishandling of Exceptional Conditions (no runtime fault injection
performed).

**Omitted conditional sections**

`API Contract Conformance` is omitted because the subject exposes no network or library
[API](#glossary) surface.

`API Compatibility and Versioning Discipline` is omitted because the subject is an
application, not a reusable package.

`AI System Assessment` is omitted because the subject contains no [AI](#glossary) or
machine-learning component.

[AI](#glossary)-assisted authorship is covered by the provenance
pillar.

`Architecture Decision Records` is covered in substance under Architectural Assessment because
`ARCHITECTURE.md` records decisions with rationale though no formal [ADR](#glossary) files exist.

## Limitations and Unknowns

| Item                                               | Type        | Reason                                                            | Resolution                                         |
| -------------------------------------------------- | ----------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| `npm run typecheck`                                | Unrun check | Execution is out of audit scope                                   | Run the typecheck for a real pass signal           |
| `npm run lint`                                     | Unrun check | Execution is out of audit scope                                   | Run lint for a real pass signal                    |
| `npm run format`                                   | Unrun check | Execution is out of audit scope                                   | Run format and diff the tree                       |
| `npm run build`                                    | Unrun check | Execution is out of audit scope                                   | Run the build to confirm compilation               |
| `npm test`                                         | Unrun check | Execution is out of audit scope                                   | Run the suite for a real pass signal               |
| `npm run test:coverage`                            | Unrun check | Execution is out of audit scope                                   | Run coverage to measure the 80 percent thresholds  |
| `npm run test:e2e`                                 | Unrun check | Suite is absent                                                   | Create `e2e/` specs and run Playwright             |
| `npm audit`                                        | Unrun check | Execution is out of audit scope                                   | Run advisory scan for current vulnerability state  |
| `npm run electron:build`                           | Unrun check | Execution is out of audit scope                                   | Run packaging to confirm installers                |
| Service-worker stale-serve behavior                | Unknown     | Structural defect identified. Browser cache behavior not observed | Redeploy against a warm client                     |
| Markdown renderer exploitability                   | Unknown     | Escaping verified statically. No adversarial fixtures were run    | Hostile-fixture test pass                          |
| [DORA](#glossary) metrics (all five)               | Unknown     | No tags, deployment, or incident data exist                       | Adopt release tagging and deployment records       |
| [AI](#glossary) authorship of individual artifacts | Unknown     | No provenance records exist                                       | Adopt an attribution convention                    |
| Remediation cost and cost of delay                 | Unknown     | No effort estimates exist                                         | Estimate during remediation planning               |
| Per-function cognitive load                        | Unknown     | No function-length or nesting census was run                      | Run a function-level metric pass or sample by hand |
| Naming-drift trend                                 | Unknown     | No history-partitioned identifier census was run                  | Compare census output across a past revision       |
| Restricted `docs/` subdirectories                  | Excluded    | `GUIDELINES.md` forbids reading them without explicit request     | Enumerated at directory level only                 |

## Re-audit And Follow-up Plan

| Finding                                                                                      | Priority        | Verification Owner | Closure Evidence                                          | Target Re-audit Trigger            |
| -------------------------------------------------------------------------------------------- | --------------- | ------------------ | --------------------------------------------------------- | ---------------------------------- |
| [FND-CQY-001](#fnd-cqy-001-coverage-gate-is-documented-as-failing-and-core-paths-are-thin)   | [P2](#glossary) | NOT SPECIFIED      | `npm run test:coverage` exits 0 on a recorded run         | After coverage work lands          |
| [FND-INF-001](#fnd-inf-001-no-automated-ci-gate-exists-for-the-documented-verification-loop) | [P2](#glossary) | NOT SPECIFIED      | A green [CI](#glossary) workflow run on a pushed change   | After the workflow merges          |
| [FND-INF-002](#fnd-inf-002-service-worker-can-serve-stale-assets-after-redeploys)            | [P2](#glossary) | NOT SPECIFIED      | Redeploy observed serving the new bundle to a warm client | After the worker change ships      |
| [FND-CQY-004](#fnd-cqy-004-documentation-figures-have-drifted-from-the-code)                 | [P2](#glossary) | NOT SPECIFIED      | Documented figures match measurement                      | Next release documentation pass    |
| [FND-CQY-002](#fnd-cqy-002-tracked-duplicate-test-file-never-executes)                       | [P2](#glossary) | NOT SPECIFIED      | Stray file absent or merged                               | Next commit touching `test/utils/` |
| [FND-STR-001](#fnd-str-001-test-file-names-and-placement-diverge-from-their-subjects)        | [P3](#glossary) | NOT SPECIFIED      | Test filenames mirror subjects and match the Vitest glob  | Next convention review             |
| [FND-CQY-005](#fnd-cqy-005-abbreviated-identifiers-violate-the-declared-naming-standard)     | [P4](#glossary) | NOT SPECIFIED      | Abbreviation scan returns clean                           | Next change to either file         |
| [FND-CQY-008](#fnd-cqy-008-configured--import-alias-is-unused)                               | [P4](#glossary) | NOT SPECIFIED      | Alias adopted or standard amended                         | Next convention review             |

**Sign-off gates**

Production sign-off stays `PENDING` until the [P2](#glossary) verification evidence above
exists and the unrun checks in Limitations and Unknowns pass on the audited revision.

Sign-off ownership is `NOT SPECIFIED`.

a future readiness decision is tied to [RSK-001](#rsk-001-regressions-merge-undetected-without-ci-enforcement)
through [RSK-006](#rsk-006-ui-regressions-reach-releases-without-e2e-checks).

**Re-audit triggers**

A manifest or lockfile change re-triggers the [SBOM](#glossary) and license census
([SBOM](#glossary)-drift trigger).

A license or [IP](#glossary) evidence change to `docs/COPYRIGHTS.md` or `LICENSE` re-triggers
the compliance review.

A change to the delivery workflow or contributor base re-triggers the delivery-practice review.

A new network-facing surface (remote content hosting, sync, collaboration) re-triggers the
security review.

A change to the declared standards in `docs/GUIDELINES.md` or `docs/standard/` re-triggers the
structure and code-style conformance reviews.

No `HIGH` or `CRITICAL` network-facing finding remains after remediation planning, so no
pentest escalation is currently triggered.

If a network-facing finding later stays `Theoretical`, a scoped live penetration test is the
escalation path.

## Validation Record

| Check           | Result           | Evidence / Justification                                                                                                                                                                              |
| --------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PAR-1           | Applied          | Both SEC findings carry weakness context (CWE-79-adjacent injection surface, unscoped device grant). Exploitability is Theoretical-tier                                                               |
| PAR-2           | Applied          | Severity definitions table present under the methodology. Matrix-not-CVSS stated                                                                                                                      |
| PAR-3           | Applied          | [ISO/IEC](#glossary) 25010:2023 crosswalk presented as a coverage mapping, not a conformance claim                                                                                                    |
| PAR-4           | Applied          | [TDR](#glossary) separates remediation cost from delay                                                                                                                                                |
| PAR-5           | Applied          | [EVD-002](#verification-and-evidence-ledger)/[EVD-003](#verification-and-evidence-ledger) git census surfaced in Delivery & Continuity                                                                |
| PAR-6           | Applied          | Lockfile-derived inventory produced at [EVD-006](#verification-and-evidence-ledger)/[EVD-007](#verification-and-evidence-ledger)                                                                      |
| PAR-7           | Applied          | Limitations and Unknowns lists every unrun check                                                                                                                                                      |
| PAR-8           | Applied          | This self-check table enumerates all checks                                                                                                                                                           |
| PAR-9           | Applied          | Standards selected for the detected React/TypeScript/Electron stack and the project's own T1 documents, not copied                                                                                    |
| PAR-10          | Applied          | Glossary indexes the acronyms used. Body occurrences link to it                                                                                                                                       |
| PAR-11          | Applied          | Coverage matrix present after Document Information and consistent with Scope Exclusions                                                                                                               |
| PAR-12          | Applied          | Every [SBOM](#glossary) row carries a license from the inspected lockfile                                                                                                                             |
| PAR-13          | Applied          | Every ledger row and every finding carries an Observation or Concern tag                                                                                                                              |
| PAR-14          | Applied          | No HIGH or CRITICAL Security findings exist. Highest residual security risk is MEDIUM                                                                                                                 |
| PAR-15          | Applied          | Delivery section present, all [DORA](#glossary) proxies marked `NOT SPECIFIED`, contributor concentration rated High                                                                                  |
| PAR-16          | [N/A](#glossary) | Report language is English, single-language output                                                                                                                                                    |
| PAR-17          | Applied          | Skill Definition Conformance inventories the agent artifacts (`GUIDELINES.md`, `standard/`, process docs) and records the baseline                                                                    |
| PAR-18          | Applied          | Recommendation Classification lists every [REC-001](#rec-001-close-the-coverage-gap-on-the-highest-risk-paths) through [REC-018](#rec-018-adopt-or-remove-the--alias) exactly once with a valid class |
| PAR-19          | Applied          | Changes Since Previous Audit present with baseline record, finding transitions, and score delta                                                                                                       |
| PAR-20          | Applied          | Operator Verification Handoff lists every unrun check with pass criteria                                                                                                                              |
| PAR-21          | Applied          | Code Style section present with Convention Profile, census, quality review, lenses, and Craft Notes                                                                                                   |
| PAR-22          | Applied          | Each style partition records its governing tier: T1 for both TypeScript partitions, T3 for the CommonJS/service-worker/script surfaces                                                                |
| PAR-23          | Applied          | Style judgements anchor to quantified census evidence ([EVD-046](#verification-and-evidence-ledger), [EVD-047](#verification-and-evidence-ledger), [EVD-048](#verification-and-evidence-ledger))      |
| PAR-24          | Applied          | Naming-quality observations capped and separated from measured consistency findings. The `IDs` false positive is disclosed                                                                            |
| PAR-25          | Applied          | Domain-terse names (`YM2149`, register names, `R7` semantics) accepted as idiomatic, not flagged as defects                                                                                           |
| PAR-26          | Applied          | Craft Notes carry `Suggestion` tags and count toward no finding, risk, or recommendation                                                                                                              |
| PAR-27          | Applied          | Census denominators exclude `dist/`, `release/`, `node_modules/`, `coverage/`, and `docs/report/` artifacts                                                                                           |
| Parity baseline | AUDIT-1.0.md     |                                                                                                                                                                                                       |

## References

| Reference                            | Publisher or Author          | Used In                                                                                                                                                                                              |
| ------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OWASP Top 10:2025                    | OWASP Foundation             | Scope Exclusions, security framing                                                                                                                                                                   |
| Electron security guidance           | OpenJS Foundation (Electron) | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth), [FND-SEC-002](#fnd-sec-002-midi-permission-grant-is-not-scoped-to-the-requesting-origin), Architectural Assessment |
| TypeScript strict-mode documentation | Microsoft                    | Engineering Baseline, tsconfig interpretation                                                                                                                                                        |
| Vite documentation                   | VoidZero / Vite team         | Build-mode and service-worker review                                                                                                                                                                 |
| React file-structure guidance        | React team (react.dev)       | Structure Review convention resolution                                                                                                                                                               |
| Common Weakness Enumeration          | MITRE                        | [FND-SEC-001](#fnd-sec-001-custom-html-rendering-surface-lacks-defense-in-depth) weakness naming                                                                                                     |
| `docs/` governance corpus in subject | dosound-tracker authors      | System Context, Standards Conformance, criteria basis                                                                                                                                                |

[OWASP Top 10:2025](https://owasp.org/Top10/2025/) - category names confirmed during the audit, used only as a coverage checklist.

[Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security) - context isolation, permission handling, and [CSP](#glossary) items informed the renderer findings.

[TypeScript strict-mode documentation](https://www.typescriptlang.org/tsconfig#strict) - used to interpret the `tsconfig` split.

[Vite documentation](https://vite.dev/guide/) - asset-naming and build-mode behavior.

[React file-structure guidance](https://react.dev/learn/thinking-in-react) - structure conventions are deliberately unopinionated.

the project's declared standard governs.

Common Weakness Enumeration - the public [CWE](#glossary) dictionary at cwe.mitre.org supplied weakness naming.

No public [URL](#glossary) applies.

The `docs/` corpus is an internal subject artifact.

the audit baseline `docs/report/1.2.8/AUDIT-1.0.md` is recorded in Document Information and the evidence ledger instead of this external-source table.

No public [URL](#glossary) applies.

The style and structure yardsticks were the project's declared standards (`docs/GUIDELINES.md`,
`docs/standard/ts-react-development.md`) as T1, supplemented by the Lens skill's bundled
ecosystem snapshot (`references/language-conventions.md`, `references/naming-and-layout.md`,
`references/stacks/`), not a live fetch.

No public [URL](#glossary) applies.

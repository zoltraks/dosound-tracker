# dosound-tracker Software Audit Report

## Document Information

|                    |                                                                                                    |
|--------------------|----------------------------------------------------------------------------------------------------|
| Report Revision    | 1.0                                                                                                |
| Report Date        | 2026-09-30                                                                                         |
| Detail Level       | Detailed                                                                                           |
| Evaluation Scale   | 1-10                                                                                               |
| Language           | English                                                                                            |
| Audit Purpose      | Engineering improvement                                                                            |
| Target Environment | Desktop application via Electron, browser single-page application on static hosting, Web Audio API |
| Verification Scope | static repository analysis (code, configuration, documentation, git history) - no execution        |
| Subject Revision   | `f898dce228db86c1e98130ec2c9dbbe3430de841`                                                         |
| Skill Version      | 1.8                                                                                                |
| Time taken         | 00:35                                                                                              |

## Audit Type Coverage & Assurance Matrix

|  | Report type                                   | Status         | Rationale                                                                                                                                   |
|--|-----------------------------------------------|----------------|---------------------------------------------------------------------------------------------------------------------------------------------|
|  | Software Architecture Review                  | Covered        | Structure, layering, state domains, and data flow were inspected from source and architecture documents                                     |
|  | Code Quality Audit                            | Covered        | Source files, configuration, tests, and documented standards were inspected                                                                 |
|  | Security Vulnerability Assessment             | Covered        | Electron boundary, [HTML](#glossary) rendering sinks, file parsing, and permission handling assessed at source level                        |
|  | Open Source License Compliance Review         | Covered        | License file, policy document, ported-component attribution, and lockfile license fields inspected                                          |
|  | Penetration Test                              | Not done       | Source-only audit, live exploitation is a separately commissioned engagement                                                                |
|  | Performance Audit                             | Partially      | Timing design and stated targets inspected, no load or latency measurement performed                                                        |
|  | Cloud Infrastructure Audit                    | Partially      | Static hosting guidance and packaging configuration inspected, no live environment state available                                          |
|  | AI Governance Audit                           | Not Applicable | The subject embeds no [AI](#glossary) model or [AI](#glossary) runtime, AI-assisted authorship is assessed in the provenance pillar instead |
|  | Technical Due Diligence                       | Partially      | Engineering and delivery dimensions covered, business inputs not supplied                                                                   |
|  | [SBOM](#sbom) / Software Composition Analysis | Covered        | Manifest-derived inventory produced from `package.json` and `package-lock.json`                                                             |
|  | [ISO/IEC](#glossary) 27001 Certification      | Not done       | The standard is not assessed, no certification claim is made                                                                                |
|  | [SOC](#glossary) 2 Attestation Examination    | Not done       | The framework is not assessed, no attestation claim is made                                                                                 |

## Glossary

| Term              | Definition                                                                |
|-------------------|---------------------------------------------------------------------------|
| ADR               | Architecture Decision Record, a recorded design decision                  |
| AI                | Artificial Intelligence                                                   |
| API               | Application Programming Interface                                         |
| ASCII             | American Standard Code for Information Interchange                        |
| ASVS              | OWASP Application Security Verification Standard                          |
| BSD               | Berkeley Software Distribution license family                             |
| CI                | Continuous Integration                                                    |
| CI/CD             | Continuous Integration and Continuous Delivery or Deployment              |
| CISQ              | Consortium for Information and Software Quality                           |
| CSP               | Content Security Policy                                                   |
| CSS               | Cascading Style Sheets                                                    |
| CVSS              | Common Vulnerability Scoring System                                       |
| [CWE](#cwe)       | Common Weakness Enumeration                                               |
| DFD               | Data Flow Diagram                                                         |
| DOM               | Document Object Model                                                     |
| [DORA](#dora)     | DevOps Research and Assessment                                            |
| E2E               | End to End, the outermost test layer                                      |
| [EVD](#evd)       | Evidence identifier used in this report's ledger                          |
| [FND](#fnd)       | Finding identifier, pillar-prefixed                                       |
| GoF               | Gang of Four, the classic design-pattern catalog                          |
| HTML              | HyperText Markup Language                                                 |
| HTTP(S)           | HyperText Transfer Protocol, optionally over TLS                          |
| IPC               | Inter-Process Communication                                               |
| ISO               | International Organization for Standardization                            |
| JSON              | JavaScript Object Notation                                                |
| MIDI              | Musical Instrument Digital Interface                                      |
| MIT               | Massachusetts Institute of Technology license family                      |
| N/A               | Not applicable status token                                               |
| NFR               | Non-Functional Requirement                                                |
| NIST              | National Institute of Standards and Technology                            |
| NSIS              | Nullsoft Scriptable Install System, a Windows installer format            |
| OS                | Operating System                                                          |
| OWASP             | Open Worldwide Application Security Project                               |
| P1-P4             | Recommendation priorities, P1 highest to P4 lowest                        |
| [PAR](#par)       | Parity-checklist row identifier                                           |
| PSG               | Programmable Sound Generator, the sound-chip class the project emulates   |
| PWA               | Progressive Web Application                                               |
| [REC](#rec)       | Recommendation identifier                                                 |
| RPO               | Recovery Point Objective                                                  |
| [RSK](#rsk)       | Risk identifier                                                           |
| RTO               | Recovery Time Objective                                                   |
| [SBOM](#sbom)     | Software Bill of Materials                                                |
| SDLC              | Software Development Life Cycle                                           |
| SLO               | Service Level Objective                                                   |
| SOC               | System and Organization Controls                                          |
| SPA               | Single-Page Application                                                   |
| SPDX              | Software Package Data Exchange, a license and inventory identifier format |
| SSDF              | Secure Software Development Framework                                     |
| [STRIDE](#stride) | Spoofing, Tampering, Repudiation, Information Disclosure, DoS, Elevation  |
| [TDR](#tdr)       | Technical Debt Register                                                   |
| TLS               | Transport Layer Security                                                  |
| TOS               | The Operating System of the Atari ST                                      |
| UI                | User Interface                                                            |
| URL               | Uniform Resource Locator                                                  |
| UTC               | Coordinated Universal Time                                                |
| UX                | User Experience                                                           |
| VGM               | Video Game Music, a sound-logging file format                             |
| WAV               | Waveform Audio File Format                                                |
| XBIOS             | Extended BIOS, the Atari ST low-level system interface                    |
| YAML              | YAML Ain't Markup Language                                                |
| YM2149            | The Yamaha sound-chip model the project emulates                          |
| ZX0               | The compression format and algorithm family used by the MAX exporter      |

### CWE

Common Weakness Enumeration, the MITRE taxonomy of software weakness types.

Security findings in this report carry a CWE identifier or a justified alternative.

### DORA

DevOps Research and Assessment, the program that defined the standard delivery metrics.

The metrics are used here as delivery-practice proxies only.

### EVD

Evidence identifier in the Verification And Evidence Ledger.

Each row cites a re-derivable source or an explicitly recorded `NOT RUN` state.

### FND

Finding identifier, numbered per pillar such as `ARC` for Architecture or `SEC` for Security.

Identifiers apply within this report and are reassigned on later revisions.

### PAR

Parity-checklist row identifier in the Validation Record.

Rows PAR-1 through PAR-18 are mandatory core checklist items for a Detailed report.

### REC

Recommendation identifier in the remediation roadmap.

Every recommendation references at least one finding.

### RSK

Risk identifier in the Unified Risk Register.

Every risk references at least one source finding.

### SBOM

Software Bill of Materials, the inventory of components a piece of software contains.

The inventory in this report is source-derived from the npm manifest and lockfile.

### STRIDE

The Microsoft threat-classification mnemonic: Spoofing, Tampering, Repudiation, Information
Disclosure, Denial of Service, and Elevation of Privilege.

Used to enumerate the trust-boundary threat surface in the Threat Model section.

### TDR

Technical Debt Register identifier.

Debt items record accumulated structural cost already present in the codebase.

## Executive Summary

`1-3 Poor · 4-6 Average · 7-8 Good · 9-10 Excellent`

| Field          | Value                                                                                       |
|----------------|---------------------------------------------------------------------------------------------|
| System type    | codebase                                                                                    |
| Scope          | Full source tree, configuration, documentation, tests, git history of dosound-tracker 1.2.8 |
| Source basis   | inspected code                                                                              |
| Maturity level | Pre-production                                                                              |
| Overall score  | 5.3/10 (Average)                                                                            |

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

**Production Readiness Threshold**

`Production-ready` would require the documented verification loop to pass with current evidence:
`npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` green on the audited revision,
`npm run test:coverage` meeting the 80 percent thresholds declared in `vitest.config.ts`, and the
stale-asset delivery defect behind RSK-002 closed with a verified fix.

No stakeholder-approved acceptance criteria were supplied, so the proposed gates above are the
audit's reconstruction from the project's own documents and remain unconfirmed by the owner.

Readiness state: `Pending evidence` - every documented check exists but none was executed under
this audit, and the project's own `TESTING.md` states the coverage command currently fails.

Production sign-off is pending: verification ownership is `NOT SPECIFIED` and closure evidence
does not exist.

**Readiness Cost**

`INSUFFICIENT INFORMATION` - no effort estimates, staffing, or rate inputs were supplied.

The roadmap expresses remediation size as High/Medium/Low effort bands only.

The largest known work items are closing the documented coverage gap (REC-001), standing up a
continuous-integration gate (REC-002), and decomposing the 2488-line central orchestrator
(REC-007).

## System Context

| Aspect                 | Detail                                                                                                                                                                                          |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Functional description | Tracker-style composition tool for the Yamaha YM2149 sound chip, with live playback and multi-format export for Atari ST target code                                                            |
| Architecture overview  | React SPA front end plus optional Electron desktop shell, Web Worker sequencer, in-process [YM2149](#glossary) emulator, localStorage persistence, static-file song repository                  |
| Key components         | `src/App.tsx` orchestrator, `src/synth/` emulator and driver, `src/exports/` five-format export pipeline, `src/workers/sequencerWorker.ts`, `src/hooks/` 31 hooks, `electron/` main and preload |
| External dependencies  | React 19, Zustand, js-yaml, lucide-react, rolldown-vite, Electron, Web Audio API, Web MIDI API, service worker                                                                                  |
| Assumptions            | NOT SPECIFIED                                                                                                                                                                                   |

### Technology Stack

| Layer            | Technology                                                                                                                                        |
|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Languages        | TypeScript ~5.9.3 strict mode, CommonJS for Electron main and preload                                                                             |
| Frameworks       | React 19.2, Zustand 4.5, Electron 42.6, Vite via rolldown-vite 7.2.2                                                                              |
| Runtime/Platform | Browser (Chromium-family Web Audio and Web MIDI), Electron desktop shell, Node.js v22.18.0 documented in README                                   |
| Build tooling    | rolldown-vite, TypeScript project references, electron-builder 26.15, Prettier, ESLint 9 flat config                                              |
| Test tooling     | Vitest 4.1 with jsdom and Testing Library, Playwright 1.61 configured, v8 coverage with 80 percent thresholds                                     |
| Package manager  | npm with lockfileVersion 3                                                                                                                        |
| Key libraries    | js-yaml 4.3 song parsing, zustand [UI](#glossary) store, lucide-react icons, custom [ZX0](#glossary) compressor port                              |
| Data stores      | Browser localStorage via `StorageKeys`, static [YAML](#glossary) song files under `public/repository/`, `public/download/` distribution directory |
| Target platforms | Static web hosting at dosound.alyx.pl, Electron builds for macOS, Windows, Linux                                                                  |

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
|-----------------------|-----------------------------------------|----------|------------------|-------------------------|---------------|
| Frame timing accuracy | 50 Hz and 60 Hz replay rates documented | UNKNOWN  | [N/A](#glossary) | `docs/SPECIFICATION.md` | NOT SPECIFIED |
| Availability          | NOT SPECIFIED                           | UNKNOWN  | [N/A](#glossary) | none committed          | NOT SPECIFIED |

## Software Bill of Materials

This is a manifest-derived component inventory at the audited revision, not a shipped-artifact
[SBOM](#sbom) and not a claim of [SPDX](#glossary) or CycloneDX conformance.

|  | Component                        | Version   | Ecosystem | Relationship                           | License          | License Risk | Advisory Checked | Source File                     |
|--|----------------------------------|-----------|-----------|----------------------------------------|------------------|--------------|------------------|---------------------------------|
|  | js-yaml                          | 4.3.0     | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | lucide-react                     | 0.460.0   | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | react                            | 19.2.1    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | react-dom                        | 19.2.1    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | zustand                          | 4.5.7     | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | @eslint/js                       | 9.39.1    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | @playwright/test                 | 1.61.1    | npm       | direct                                 | Apache-2.0       | None flagged | N                | package.json, package-lock.json |
|  | @testing-library/dom             | 10.4.1    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | @testing-library/jest-dom        | 6.9.1     | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | @testing-library/react           | 16.3.2    | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | @types/js-yaml                   | 4.0.9     | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | @types/node                      | 24.10.1   | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | @types/react                     | 19.2.7    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | @types/react-dom                 | 19.2.3    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | @vitejs/plugin-react             | 5.1.1     | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | @vitest/coverage-v8              | 4.1.10    | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | @vitest/ui                       | 4.1.10    | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | concurrently                     | 10.0.3    | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | electron                         | 42.6.0    | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | electron-builder                 | 26.15.3   | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | eslint                           | 9.39.1    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | eslint-plugin-react-hooks        | 7.0.1     | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | eslint-plugin-react-refresh      | 0.4.24    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | globals                          | 16.5.0    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | jsdom                            | 29.1.1    | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | prettier                         | 3.9.4     | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | typescript                       | 5.9.3     | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | typescript-eslint                | 8.48.1    | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | vite (rolldown-vite)             | 7.2.2     | npm       | direct                                 | Unknown          | Unknown      | N                | package.json, package-lock.json |
|  | vitest                           | 4.1.10    | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | wait-on                          | 8.0.5     | npm       | direct                                 | [MIT](#glossary) | None flagged | N                | package.json, package-lock.json |
|  | [ZX0](#glossary) (Salvador port) | v2 format | generic   | direct, vendored in `src/utils/zx0.ts` | BSD-3-Clause     | None flagged | N                | src/utils/zx0.ts header         |

Direct components: 32 (5 runtime dependencies, 26 development dependencies, 1 vendored source
component).

Transitive components: 559 resolved entries in `package-lock.json`.

Total resolved packages: 590, of which 368 carry a declared license field and 222 do not.

Notable transitive entries: `caniuse-lite` under CC-BY-4.0 (development-time data package),
`mdn-data` under CC0-1.0, `sanitize-filename` under WTFPL OR ISC, `truncate-utf8-bytes` under
WTFPL, nine packages under BlueOak-1.0.0, two under MIT-0, and one each under `(MIT OR CC0-1.0)`
and `(WTFPL OR MIT)`.

No manifest-lockfile drift was observed: the declared direct set resolves against the lockfile.

`vite` is declared as `npm:rolldown-vite@7.2.2` through an `overrides` entry, so the resolved
bundler is the rolldown-vite package, not upstream Vite.

## License & IP Compliance Review

|  | License class   | Components | Notes                                                                                                                                                                                            |
|--|-----------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|  | Permissive      | 368        | [MIT](#glossary) 270, ISC 41, BSD-3-Clause 20, Apache-2.0 12, BlueOak-1.0.0 9, BSD-2-Clause 8, MIT-0 2, CC0-1.0 1, WTFPL family 3, dual permissive 2, CC-BY-4.0 1                                |
|  | Weak-copyleft   | 0          | none declared                                                                                                                                                                                    |
|  | Strong-copyleft | 0          | none declared                                                                                                                                                                                    |
|  | Proprietary     | 0          | none declared                                                                                                                                                                                    |
|  | Unknown         | 222        | 37.6 percent of resolved components carry no license field in the lockfile, including direct components react, react-dom, vite, typescript, zustand, lucide-react, eslint, and typescript-eslint |

No copyleft conflict was found: no strong-copyleft component is linked into the distributed
work, and the project's own license is [MIT](#glossary) with a committed `LICENSE` file.

The vendored [ZX0](#glossary) compressor carries its BSD-3-Clause copyright notice and attribution in the
file header at `src/utils/zx0.ts`, and the change record `docs/change/1.2.7/max-export.md`
documents the license check performed when porting it.

The attribution is not yet listed in `docs/COPYRIGHTS.md`, the file the project policy names
for third-party attribution, which is recorded as FND-CPR-002.

The 222 undetermined licenses are a license-hygiene gap, not a violation: the project cannot
demonstrate per-component compliance against the permitted-license list in `docs/COPYRIGHTS.md`
without a per-package declaration check, recorded as FND-CPR-001.

A `THIRD-PARTY-NOTICES` file or an [SBOM](#sbom) export with license fields would resolve the Unknown
share.

## Health Dashboard

**Risk Map**

| Impact   | LOW | MEDIUM                                      | HIGH |
|----------|-----|---------------------------------------------|------|
| CRITICAL |     |                                             |      |
| HIGH     |     | RSK-005                                     |      |
| MEDIUM   |     | RSK-001, RSK-002, RSK-003, RSK-004, RSK-006 |      |
| LOW      |     | RSK-007, RSK-009, RSK-010                   |      |

RSK-008 carries `LOW` impact and `LOW` likelihood.

**Scorecard Summary**

Bands: `Excellent` 9-10, `Good` 7-8, `Average` 4-6, `Poor` 1-3.

| Dimension               | Score | Notes                                                                                              |
|-------------------------|-------|----------------------------------------------------------------------------------------------------|
| Testability             | 4/10  | Real unit layer, documented failing coverage gate, no [E2E](#glossary) specs, no [CI](#glossary)   |
| Design Soundness        | 6/10  | Documented architecture and deliberate trade-offs, 2488-line orchestrator                          |
| Code Quality            | 7/10  | Strict TypeScript and typed lint, documentation drift items remain                                 |
| Stack Alignment         | 7/10  | Idiomatic React 19 and strict TS, documented intentional anti-patterns                             |
| Dependency Health       | 5/10  | Small direct set with lockfile, 37.6 percent undetermined licenses, no advisory evidence           |
| Maintainability         | 6/10  | Strong process documentation against concentrated orchestration                                    |
| Deployability           | 5/10  | Multi-platform packaging, unsigned artifacts, service-worker staleness risk                        |
| Scalability             | 6/10  | Local single-user model, worker offload, limited [NFR](#glossary) evidence                         |
| Security                | 6/10  | Sound Electron defaults, custom [HTML](#glossary) renderer, no [CSP](#glossary), unsigned releases |
| Compliance              | 6/10  | [MIT](#glossary) license and explicit policy, policy-versus-lockfile gap                           |
| Observability           | 5/10  | Leveled categorized logger, console-bound, no external sink                                        |
| Operational Safety      | 5/10  | Close-confirmation flow, no rollback or recovery evidence                                          |
| Delivery & Continuity   | 4/10  | Steady cadence, 100 percent single-author concentration, zero tags                                 |
| AI Provenance           | 7/10  | Named tooling disclosure, prompt logs, policy, sparse trailers                                     |
| Originality & Licensing | 7/10  | Documented emulation provenance, attributed port, policy mismatch                                  |

Omitted `N/A` dimensions: `Skill Definition` - the repository contains no agent-facing artifacts,
and `API Compatibility` - the subject is an application, not a reusable library or package.

**Team & Continuity**

One author accounts for 100 percent of the 679 non-merge commits over about 8.3 months, with no
tags and no committed release anchors (EVD-002, EVD-003, EVD-004).

## Delivery Practice & Team Continuity

Git history is available and in scope.

705 total commits, 679 non-merge commits, 26 merge commits.

History span: 2025-11-17 to 2026-07-25.

All 679 non-merge commits share one author, so contributor concentration is `High`
(a single-author project is always `High` per the rubric).

Concentration is a continuity-risk fact, not a judgment of any person.

|  | [DORA](#dora) metric            | Result          | Basis                                      |
|--|---------------------------------|-----------------|--------------------------------------------|
|  | Change lead time                | `NOT SPECIFIED` | Proxy needs tags, commits are not releases |
|  | Deployment frequency            | `NOT SPECIFIED` | No tags or release markers exist in git    |
|  | Failed deployment recovery time | `NOT SPECIFIED` | Requires incident and deployment data      |
|  | Change fail rate                | `NOT SPECIFIED` | Requires incident and rollback data        |
|  | Deployment rework rate          | `NOT SPECIFIED` | Requires production incident data          |

88 commit subjects mention fix, revert, or bug work, but commit subjects are not a rework metric
(EVD-003).

`public/CHANGELOG.md` records 28 versioned entries up to 1.2.8, a documented release log kept
outside the git tag namespace (EVD-039).

`docs/VERSIONING.md` documents a deliberate non-semantic progression: the patch number
increments up to 9 regardless of change type, then rolls into minor and major.

Ten commits carry `Co-Authored-By` or equivalent tool trailers in 705 commits (EVD-032).

Reviewer diversity is `NOT SPECIFIED`, pull-request review data does not live in the repository.

Support, cost, and supplier-obligation evidence is `UNKNOWN` (none supplied).

## High-Level Observations

| Observation                                                                         |
|-------------------------------------------------------------------------------------|
| The documented verification loop is sound on paper but has no automated enforcement |
| A 2488-line orchestrator concentrates change risk in one file                       |
| The service worker can serve stale assets after redeploys                           |
| The dependency license policy is stricter than the resolved dependency set          |
| Provenance documentation for AI-assisted development is unusually thorough          |

**The documented verification loop is sound on paper but has no automated enforcement**

`docs/TESTING.md` and `docs/WORKFLOW.md` define a six-step zero-warning verification loop, and
`vitest.config.ts` enforces 80 percent coverage thresholds, yet `TESTING.md` itself states the
coverage command currently fails and no [CI](#glossary) configuration exists to run any of it (FND-CQY-001,
FND-INF-001).

**A 2488-line orchestrator concentrates change risk in one file**

`src/App.tsx` wires roughly twenty hooks and the song model together in a single component that
the project's own architecture document names as the largest maintenance risk (FND-ARC-001).

**The service worker can serve stale assets after redeploys**

The production service worker caches non-navigation requests cache-first under a fixed
`dosound-tracker-cache-v1` name while `vite.config.ts` emits deterministic hashless asset
filenames, so a redeployed build may serve previous JavaScript to returning users (FND-INF-002).

**The dependency license policy is stricter than the resolved dependency set**

`docs/COPYRIGHTS.md` permits [MIT](#glossary), Apache-2.0, [BSD](#glossary), ISC, and Boost, but the lockfile resolves
components under BlueOak-1.0.0, CC-BY-4.0, WTFPL, MIT-0, and CC0-1.0, and 222 components carry
no declared license at all (FND-CPR-001).

**Provenance documentation for AI-assisted development is unusually thorough**

The README names the tools used (Windsurf and GPT 5.1), `docs/prompt/` retains the task prompts,
and `docs/change/` plus `docs/plan/` hold per-version change requests and implementation plans
(FND-AIP-001).

## Auditing Methodology

This audit is source-only.

No builds, tests, linters, scanners, generators, package installation, or runtime execution
were performed against the subject.

Inspection consisted of `git ls-files` and `git log` censuses, direct reading of all governing
documents, configuration files, Electron boundary code, parsers, storage, rendering sinks,
workers, and the export pipeline, plus license-field extraction from `package-lock.json`.

The audit uses evidence-based reasoning across 18 core assessment categories grouped into six
pillars, plus conditional assessments (data flow, design patterns, threat model, standards
conformance, architecture decision records) applied where the subject warrants them.

- **Architecture & Design** - Design principles, maintainability, change management, documentation, non-functional requirements
- **Code Quality** - Testing, code quality, stack best practices
- **Security & Compliance** - Security, compliance and data protection
- **Infrastructure & [CI/CD](#glossary)** - Dependencies, deployment, rollback, observability, error handling, operational readiness
- **AI Provenance & Code Origin** - Explicit attribution, generated-artifact validation, and [SDLC](#glossary) evidence, without authorship inference from style
- **Copyrights & Originality** - Code originality, license compliance, attribution, dependency license compatibility
- **API Compatibility & Versioning Discipline** - Conditional pillar, not applied because the subject is an application, not a reusable library or package

**Audit evidence statement**

This audit inspected 149 source files under `src/`, 56 tracked files under `test/`, and the
root configuration set, excluding files listed in `.gitignore` and any content under
`node_modules/`, `dist/`, `release/`, and `coverage/`.

Git commit history was reviewed across the full 705-commit span.

No documented check results such as [CI](#glossary) output, coverage reports, or scan artifacts were supplied
or committed, all findings are based on static inspection.

**Reference standards**

- [ISO/IEC](#glossary) 25010:2023 product-quality crosswalk, as a scorecard mapping only.
- [CWE](#cwe), for the security-finding weakness classification.
- NIST SP 800-30, for the risk-register process.
- [STRIDE](#stride), for threat-model enumeration.
- [ISO](#glossary) 19011 and the NIST Risk Management Framework monitor step, for the re-audit plan.
- [DORA](#dora) metric definitions, for delivery proxies.
- [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security), for the desktop-shell boundary review.
- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks), for the hook-pattern assessment context.
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) and [TSConfig reference](https://www.typescriptlang.org/tsconfig), for stack-conformance checks.
- [OWASP Top 10](https://owasp.org/Top10/), as an awareness taxonomy for the web-facing surface.
- npm SemVer documentation, for versioning-practice context.
- [CISQ](#glossary) and SQALE cost model, for the technical-debt register structure.

**Verification And Evidence Ledger**

| Evidence | Check / Source                                                              | Result                                                                                                                                                                                                                   | Type        | Artifact                                                                    |
|----------|-----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------|
| EVD-001  | `git ls-files` census plus per-directory counts                             | 454 tracked files, 149 under `src/` at 29573 lines, 56 under `test/` at 5072 lines including fixtures and setup files                                                                                                    | Observation | file inventory                                                              |
| EVD-002  | `git rev-list --count HEAD` and `--no-merges`                               | 705 total commits, 679 non-merge                                                                                                                                                                                         | Observation | revision `f898dce`                                                          |
| EVD-003  | `git log --no-merges --format=%an` census and fix-subject scan              | 679 of 679 commits by one author (100 percent), 88 fix or revert subjects                                                                                                                                                | Observation | commit history                                                              |
| EVD-004  | `git tag -l` and history span                                               | 0 tags, span 2025-11-17 to 2026-07-25                                                                                                                                                                                    | Observation | `git log`                                                                   |
| EVD-005  | `git status -sb`, `git remote -v`, `git rev-parse HEAD`                     | clean tree, `main` equals `origin/main`, HEAD `f898dce228db86c1e98130ec2c9dbbe3430de841`                                                                                                                                 | Observation | repository state                                                            |
| EVD-006  | `package.json` and `package-lock.json` inspection                           | version 1.2.8, lockfileVersion 3, 590 resolved packages, 5 runtime plus 26 dev direct dependencies, `vite` overridden to `npm:rolldown-vite@7.2.2`                                                                       | Observation | manifests                                                                   |
| EVD-007  | lockfile `license` field extraction                                         | 368 packages declare a license, 222 declare none, all declared classes permissive, no copyleft present                                                                                                                   | Observation | `package-lock.json`                                                         |
| EVD-008  | `electron/main.cjs` and `electron/preload.cjs` inspection                   | `contextIsolation: true`, `nodeIntegration: false`, permission handlers grant only `midi` and `midiSysex`, narrow `electronAPI` bridge                                                                                   | Observation | `electron/main.cjs:14-40`, `electron/preload.cjs`                           |
| EVD-009  | `dangerouslySetInnerHTML` census                                            | two sinks, both fed by the custom `renderMarkdown` in `src/utils/markdown.ts`                                                                                                                                            | Concern     | `src/modals/MarkdownModal.tsx:29`, `src/components/EnvelopeSection.tsx:102` |
| EVD-010  | `renderMarkdown` and `applyInlineFormatting` inspection                     | HTML-escapes before formatting, link regex limited to `http(s)` schemes, `rel="noreferrer"` on generated links                                                                                                           | Observation | `src/utils/markdown.ts:1-20`                                                |
| EVD-011  | service worker and build filename inspection                                | non-navigation GET requests are cache-first, `CACHE_NAME` fixed at `dosound-tracker-cache-v1`, Vite emits deterministic hashless asset names                                                                             | Concern     | `public/js/sw.js:52-63`, `vite.config.ts` build output block                |
| EVD-012  | `e2e/` directory listing                                                    | only `.gitkeep` present, no end-to-end specs despite configured Playwright                                                                                                                                               | Concern     | `e2e/`, `playwright.config.ts`                                              |
| EVD-013  | `vitest.config.ts` and `docs/TESTING.md` comparison                         | 80 percent coverage thresholds enforced in config while `TESTING.md:231` states the coverage command currently fails                                                                                                     | Concern     | `vitest.config.ts:13-20`, `docs/TESTING.md:220-231`                         |
| EVD-014  | test-file inventory                                                         | 44 `*.test.*` files with about 218 test cases, concentrated in `test/utils/` (30 files), `test/synth/` 1 file, no `test/modals/` or `test/workers/`                                                                      | Observation | `test/` tree                                                                |
| EVD-015  | `test/utils/exportMax.test` comparison                                      | tracked file carrying 12 test cases with a non-standard extension that the Vitest include pattern never matches, a stale divergent copy of `exportMax.test.ts`                                                           | Concern     | `test/utils/exportMax.test`                                                 |
| EVD-016  | `docs/ARCHITECTURE.md` versus manifest                                      | document states Electron 39 and App.tsx at 2194 lines, actual dependency is Electron `^42.0.0` (locked 42.6.0) and the file measures 2488 lines                                                                          | Concern     | `docs/ARCHITECTURE.md:5,124`, `package.json`                                |
| EVD-017  | `docs/TESTING.md` gap list versus test tree                                 | documented gaps stale: modals have a test via `test/components/FilePickerModal.test.tsx`, exports are covered by ten `test/utils/` export test files, and 31 hooks exist where the document says 30                      | Concern     | `docs/TESTING.md:222-228`, `test/` tree                                     |
| EVD-018  | `src/App.tsx` measurement and wiring census                                 | 2488 lines, roughly twenty hooks instantiated and wired in one component                                                                                                                                                 | Concern     | `src/App.tsx`                                                               |
| EVD-019  | large-module census                                                         | `useMidiMessageProcessing` 671, `useSongManagement` 619, `useMidiActions` 590, `useSequencerIntegration` 543, `useFileOperations` 525 lines                                                                              | Observation | `src/hooks/`                                                                |
| EVD-020  | `eslint.config.js` inspection                                               | flat config with `typescript-eslint` recommended, `no-explicit-any` error, typed linting via `parserOptions.project`, four `react-hooks` rules set to `warn` with an in-config rationale for audio-critical paths        | Observation | `eslint.config.js`                                                          |
| EVD-021  | `tsconfig.app.json` inspection                                              | `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`, `noFallthroughCasesInSwitch`, bundler module resolution                                                                          | Observation | `tsconfig.app.json`                                                         |
| EVD-022  | localStorage usage census                                                   | 10 source files touch localStorage, keys centralized in `src/utils/storageKeys.ts`                                                                                                                                       | Observation | `src/utils/storageKeys.ts`                                                  |
| EVD-023  | `src/utils/zx0.ts` header and `docs/COPYRIGHTS.md` comparison               | [ZX0](#glossary) port carries in-file BSD-3-Clause attribution to Einar Saukas, and the central attribution file does not list it                                                                                        | Concern     | `src/utils/zx0.ts:1-12`, `docs/COPYRIGHTS.md`                               |
| EVD-024  | `docs/COPYRIGHTS.md` permitted-license list versus lockfile classes         | policy permits [MIT](#glossary), Apache-2.0, [BSD](#glossary), ISC, Boost, but resolved classes include BlueOak-1.0.0, CC-BY-4.0, WTFPL, MIT-0, and CC0-1.0                                                              | Concern     | `docs/COPYRIGHTS.md`, `package-lock.json`                                   |
| EVD-025  | [CI](#glossary) configuration census                                        | no `.github/` directory, no workflow files, no pipeline definitions of any kind                                                                                                                                          | Concern     | repository root                                                             |
| EVD-026  | secret and key pattern scan of `src/`, `electron/`, `public/`, root configs | no committed secrets or credentials found                                                                                                                                                                                | Observation | tracked files                                                               |
| EVD-027  | `eslint-disable` census                                                     | 8 source files carry targeted `react-hooks` disable comments, consistent with the documented audio-timing exemption                                                                                                      | Observation | `src/App.tsx:1` and seven other files                                       |
| EVD-028  | `songParser.ts` and `validation.ts` inspection                              | js-yaml safe load, numeric clamping, structural validation with `ValidationError`, line-entry checks                                                                                                                     | Observation | `src/utils/songParser.ts:137-200`, `src/utils/validation.ts`                |
| EVD-029  | `sequencerWorker.ts` inspection                                             | `setTimeout` loop with `performance.now()` scheduling and catch-up ticks, pattern and song loop handling                                                                                                                 | Observation | `src/workers/sequencerWorker.ts:1-40`                                       |
| EVD-030  | `fetch` call census                                                         | all fetches target same-origin bundled assets (`CHANGELOG.md`, `MANUAL.md`, `MESSAGES.md`, `download/LIST.txt`, repository song files), no remote [API](#glossary) calls found                                           | Observation | `src/App.tsx:807,831,962,1000`, `src/hooks/useDownloadAvailability.ts:15`   |
| EVD-031  | `package.json` scripts and `docs/WORKFLOW.md`                               | documented six-step verification loop exists, every step is manual, no automation runs it                                                                                                                                | Observation | `package.json`, `docs/WORKFLOW.md`                                          |
| EVD-032  | AI-provenance evidence                                                      | `README.md:38` names Windsurf and GPT 5.1, `docs/prompt/` holds task prompt logs, 10 commits carry tool trailers                                                                                                         | Observation | `README.md`, `docs/prompt/`, git history                                    |
| EVD-033  | `package.json` electron-builder config and README distribution note         | macOS, Windows, and Linux targets configured, no signing identity configured, README documents that binaries are not code-signed                                                                                         | Observation | `package.json` build block, `README.md`                                     |
| EVD-034  | `index.html` and Electron session inspection                                | no `Content-Security-Policy` meta tag or header mechanism present                                                                                                                                                        | Concern     | `index.html`, `electron/main.cjs`                                           |
| EVD-035  | `npm run typecheck` (`tsc --noEmit`)                                        | NOT RUN - would establish that the TypeScript sources compile cleanly under strict mode                                                                                                                                  | Observation | `package.json` scripts                                                      |
| EVD-036  | `npm run lint` and `npm run format`                                         | NOT RUN - would establish zero-warning lint state and formatting conformance per `docs/TESTING.md`                                                                                                                       | Observation | `package.json` scripts                                                      |
| EVD-037  | `npm test` and `npm run test:coverage`                                      | NOT RUN - would establish suite pass state and actual coverage versus the 80 percent thresholds                                                                                                                          | Observation | `vitest.config.ts`, `docs/TESTING.md`                                       |
| EVD-038  | `npm run test:e2e` (Playwright)                                             | NOT RUN - would exercise browser flows, and no specs exist to execute                                                                                                                                                    | Observation | `playwright.config.ts`, `e2e/`                                              |
| EVD-039  | `npm run build` and `npm run electron:build`                                | NOT RUN - would establish bundle production and desktop packaging integrity                                                                                                                                              | Observation | `package.json` scripts                                                      |
| EVD-040  | `npm audit` and dependency advisory scan                                    | NOT RUN - no committed advisory or scan artifacts exist to draw on                                                                                                                                                       | Observation | audit scope                                                                 |
| EVD-041  | prior-report discovery under `docs/report/`                                 | lifecycle and model-comparison documents exist for 1.2.3 and 1.2.4-configuration, none is a Lens-format audit baseline                                                                                                   | Observation | `docs/report/`                                                              |
| EVD-042  | governance-document census                                                  | `GUIDELINES.md`, `TESTING.md`, `WORKFLOW.md`, `VERSIONING.md`, `COPYRIGHTS.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, `REFACTORING.md`, `docs/standard/`, per-version `docs/change/`, `docs/plan/`, `docs/refactoring/` | Observation | `docs/` tree                                                                |
| EVD-043  | `docs/VERSIONING.md` scheme inspection                                      | deliberate non-semantic progression: patch increments to 9 regardless of change type, then rolls to minor and major                                                                                                      | Observation | `docs/VERSIONING.md:17-37`                                                  |
| EVD-044  | `public/CHANGELOG.md` inspection                                            | 28 versioned entries through 1.2.8, a documented release log maintained alongside the bump script                                                                                                                        | Observation | `public/CHANGELOG.md`                                                       |
| EVD-045  | `useSequencer.ts` worker wiring inspection                                  | Web Worker created from `src/workers/sequencerWorker.ts`, start/update/stop message protocol, merged playback state                                                                                                      | Observation | `src/hooks/useSequencer.ts:114-130`                                         |

Ledger notes: revision `f898dce228db86c1e98130ec2c9dbbe3430de841`, clean working tree, audit
date 2026-09-30.

Every row is re-derivable from the named command or file range.

**Severity definitions**

| Severity | Meaning                  | Readiness Treatment       |
|----------|--------------------------|---------------------------|
| CRITICAL | Critical contextual risk | Gate resolution           |
| HIGH     | Major contextual risk    | Gate resolution           |
| MEDIUM   | Material contained risk  | Track and plan            |
| LOW      | Limited contextual risk  | Proportionate improvement |

Severity derives from the impact/likelihood matrix, not [CVSS](#glossary).

## Scoring Rubrics

Scale: `1-10` integers, selected at parameter configuration.

| Band      | Score Range | Definition                                                   |
|-----------|-------------|--------------------------------------------------------------|
| Excellent | 9-10        | Capability is comprehensive and verified by strong evidence  |
| Good      | 7-8         | Capability is solid overall, minor or noticeable gaps exist  |
| Average   | 4-6         | Capability is present but uneven, limited, or inconsistent   |
| Poor      | 1-3         | Capability is minimal, fragmentary, or absent where required |

Per-score meanings follow the same matrix in `synthesis/project-scorecard.md`.

`UNKNOWN` and `N/A` are not scores and are excluded from aggregation.

Overall aggregation: arithmetic mean of applicable dimensions, 1 decimal place.

Applicable dimensions: 15 of 17 (`Skill Definition` and `API Compatibility` are `N/A`).

80 / 15 = 5.3, reported as 5.3 / 10.

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

Layered audio pipeline with an explicit timing boundary in a dedicated Web Worker.

A single source of truth for storage keys, a leveled logger, and format modules that isolate
each export contract.

Documented architectural decisions that name the intentional React anti-patterns instead of
letting them masquerade as defects.

### What Needs Attention

The composition root is a 2488-line file that the project's own architecture document calls the
single largest maintenance risk.

Business logic is distributed across large hooks with implicit cross-hook dependencies wired in
`App.tsx`, which raises the blast radius of any state-shape change.

No undo/redo or command abstraction exists, so edit history and auditability rely on the song
file itself (FND-ARC-001).

### Design Principles

| Principle             | Status  | Evidence                                                                                                                                                         |
|-----------------------|---------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Single Responsibility | PARTIAL | file-level cohesion is good, but `App.tsx` and the largest hooks carry several responsibilities each (EVD-018, EVD-019)                                          |
| Open/Closed           | PARTIAL | export formats and panels extend by new modules, but song-shape changes ripple through many hooks (EVD-019)                                                      |
| Liskov Substitution   | PASS    | shared types such as `Song` and branded identifier types keep substitutable contracts                                                                            |
| Interface Segregation | PASS    | hooks expose narrow surfaces and the preload bridge is minimal (EVD-008)                                                                                         |
| Dependency Inversion  | PARTIAL | concrete hook composition is the model, no injection seams are needed at this scale, worker and driver are swappable in principle                                |
| DRY                   | PARTIAL | utilities are well factored, but validation and normalization logic is split between `songParser.ts`, `validation.ts`, and `songIO.ts` with overlapping concerns |

### Data Flow Diagram

Level-0 context view:

```
╭───────────────╮        keyboard, files, MIDI        ╭────────────────────╮
│               │ ─────────────────────────────────> │                    │
│     User      │                                      │  DOSOUND Tracker   │
│               │ <───────────────────────────────── │  (SPA + Electron)  │
╰───────────────╯   audio out, exported artifacts     ╰────────────────────╯
                                                             ^         │
                                          bundled YAML/docs  │         │  localStorage
                                                             │         v
                                        ╭────────────────────╯  ╭──────────────╮
                                        │  Static web host /    │              │
                                        │  packaged resources   │  Browser     │
                                        │  (MESSAGES.md,        │  profile     │
                                        │   repository/,        │  storage     │
                                        │   download/, docs)    │              │
                                        ╰──────────────────────╯  ╰──────────────╯
```

Level-1 decomposition:

```
fetch('MESSAGES.md'|docs)      FileReader (.yaml/.yml)
        │                              │
        v                              v
╭───────────────╮            ╭───────────────────╮        ╭──────────────╮
│               │            │                   │  Song  │              │
│ renderMarkdown│            │  songParser /     │ -----> │ localStorage │
│ -> innerHTML  │            │  validation       │  model │ via Storage  │
│               │            │                   │        │ Keys         │
╰───────┬───────╯            ╰─────────┬─────────╯        ╰──────────────╯
        │                              │ Song state
        │ HTML                         v
        v                     ╭───────────────────╮  start/update/stop   ╭───────────────────╮
        DOM                   │                   │ -------------------> │                   │
                              │  App.tsx hooks    │                      │ sequencerWorker   │
        ╭───────────────╮     │  + uiStore        │ <------------------- │ (setTimeout loop) │
        │               │ <--- │                   │      tick messages   │                   │
        │  Export       │ Song │                   │                      ╰───────────────────╯
        │  modules      │ data │        │          │                              │
        │  (asm/bin/vgm │      │        v          v                              │ tick
        │   /wav/max)   │      │ ╭────────────╮  ╭──────────────╮                 v
        ╰───────┬───────╯      │ │uiStore     │  │ SoundDriver  │        ╭───────────────────╮
                │              │ │(Zustand)   │  │ -> YM2149    │ -----> │                   │
                v              │ ╰────────────╯  │  registers   │ audio  │ Web Audio API     │
        ╭───────────────╮      │                 ╰──────────────╯        │                   │
        │               │      │                                       ╰───────────────────╯
        │ file download │      │
        │ (Blob URL)    │      │
        ╰───────────────╯      │
```

Trust boundaries:

| Boundary          | From                              | To                                   | Crossing Control                                                               |
|-------------------|-----------------------------------|--------------------------------------|--------------------------------------------------------------------------------|
| Host content      | Static web host or packaged files | Renderer fetch and markdown renderer | [HTML](#glossary) escaping in `renderMarkdown`, `http(s)`-only link generation |
| User files        | File picker / clipboard           | `songParser.ts`, `instrumentIO.ts`   | js-yaml safe load, clamping, structural validation                             |
| Renderer-main     | `electronAPI` preload bridge      | Electron main process                | `contextIsolation`, `nodeIntegration` off, four-method bridge                  |
| Device access     | Web MIDI permission request       | Operating system [MIDI](#glossary)   | Electron permission handler allows `midi` and `midiSysex` only                 |
| Local persistence | Renderer state                    | localStorage                         | Key consolidation via `StorageKeys`, schema migration in `useSongManagement`   |
| Cache             | Network responses                 | Service worker cache                 | Same-origin GET only, cache-first for assets                                   |
| Export output     | Song state                        | Downloaded artifacts                 | Deterministic encoders, byte-identical contract documented                     |

### Design Patterns

| Pattern            | Location                                                      | Assessment | Description                                                                                                                                |
|--------------------|---------------------------------------------------------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| Composition root   | `src/App.tsx`                                                 | PARTIAL    | deliberate single wiring point, but grown past manageable size (FND-ARC-001)                                                               |
| Store              | `src/stores/uiStore.ts`                                       | PASS       | single Zustand store scoped to cross-component [UI](#glossary) state                                                                       |
| Worker offload     | `src/workers/sequencerWorker.ts`, `src/hooks/useSequencer.ts` | PASS       | timing loop isolated from [UI](#glossary) thread with typed message protocol                                                               |
| Singleton          | `src/utils/logger.ts`                                         | PASS       | one leveled logger instance, console-bound                                                                                                 |
| Strategy           | `src/exports/` format modules                                 | PASS       | interchangeable export strategies behind a shared shape                                                                                    |
| Adapter            | `src/utils/songParser.ts`, `src/utils/songIO.ts`              | PASS       | [YAML](#glossary) document to domain model with clamping and normalization                                                                 |
| Facade             | `src/hooks/` layer                                            | PARTIAL    | hooks facade subsystems, but several facades carry their own business logic                                                                |
| Command            | none                                                          | FAIL       | no command or undo abstraction, edits mutate state directly (documented decision)                                                          |
| Template rendering | `src/utils/markdown.ts`                                       | PARTIAL    | hand-rolled markdown to [HTML](#glossary) with escaping, an anti-pattern-shaped bespoke parser on an injection-relevant path (FND-SEC-001) |

### Architecture Decision Records

The project is production-bound and carries significant design decisions, recorded mostly in
`docs/ARCHITECTURE.md` and per-version `docs/change/` and `docs/plan/` files rather than formal
[ADR](#glossary) documents.

| Decision                                         | Location                                     | ADR Status |
|--------------------------------------------------|----------------------------------------------|------------|
| App.tsx as central orchestrator                  | `docs/ARCHITECTURE.md` decisions section     | Recorded   |
| Single Zustand store vs domain stores            | `docs/ARCHITECTURE.md` decisions section     | Recorded   |
| Intentional React anti-patterns for audio timing | `docs/ARCHITECTURE.md`, `docs/GUIDELINES.md` | Recorded   |
| No undo/redo or command pattern                  | `docs/ARCHITECTURE.md` known limitations     | Recorded   |
| rolldown-vite substitution for Vite              | `package.json` overrides                     | Missing    |
| Deterministic hashless asset filenames           | `vite.config.ts`, `docs/DEPLOYMENT.md`       | Recorded   |
| Non-semantic version progression                 | `docs/VERSIONING.md`                         | Recorded   |
| [ZX0](#glossary) port vendored into `src/utils/` | `docs/change/1.2.7/max-export.md`            | Recorded   |
| Custom markdown renderer instead of a library    | `src/utils/markdown.ts`                      | Missing    |
| Fixed service-worker cache name                  | `public/js/sw.js`                            | Missing    |

### Industry Baseline Comparison

Typical production React/Electron desktop applications show the following, compared with this
subject:

- Continuous integration running lint, typecheck, and tests on every push - absent here
  (FND-INF-001).
- Content Security Policy on Electron renderers - absent here (FND-SEC-001).
- Signed desktop installers for public distribution - absent here and disclosed in the README
  (FND-INF-003).
- Cache-versioned service workers or hashed asset names - neither is present (FND-INF-002).
- End-to-end smoke coverage for critical flows - configured but unpopulated (FND-CQY-003).
- Centralized third-party notices - partially present through the license policy but no notice
  file exists (FND-CPR-001, FND-CPR-002).

## Trade-off Analysis

| Trade-off                                    | Context                                                  | Option A: gain / cost                                                           | Option B: gain / cost                                            | Evidence                        | Implication                                                                                     |
|----------------------------------------------|----------------------------------------------------------|---------------------------------------------------------------------------------|------------------------------------------------------------------|---------------------------------|-------------------------------------------------------------------------------------------------|
| Central orchestrator vs distributed state    | Keep song model close to wiring                          | `App.tsx` owns model and wiring / file grows to 2488 lines                      | Domain stores and mediators / more indirection                   | EVD-018, `docs/ARCHITECTURE.md` | Current choice keeps data flow visible but concentrates change risk (FND-ARC-001)               |
| Audio timing fidelity vs lint purity         | Re-created callbacks at 50 Hz cause audible glitches     | Sparse dependency arrays and ref mirroring / intentional `react-hooks` warnings | Full hook conformance / timing drift risk                        | EVD-027, `docs/GUIDELINES.md`   | Documented choice fits the constraint and is not a defect                                       |
| setTimeout worker vs audio-clock scheduling  | Browser has no hard-real-time primitive                  | Worker `setTimeout` with `performance.now()` catch-up / approximate scheduling  | AudioContext-driven scheduling / tighter coupling to audio graph | EVD-029, EVD-045                | Acceptable for a tracker preview, diverges from hardware timing                                 |
| Hashless asset names vs cache freshness      | Electron `file://` packaging prefers deterministic names | Stable names / service worker may serve stale assets                            | Content hashes / filename churn in packaged app                  | EVD-011                         | The web build inherits the Electron constraint, freshness risk lands on web users (FND-INF-002) |
| localStorage vs IndexedDB or file storage    | Single-user local app                                    | Simple synchronous [API](#glossary) / size and schema limits, profile-bound     | Richer store / migration complexity                              | EVD-022                         | Fits current scale, schema versioning is ad hoc per key                                         |
| Custom markdown renderer vs vendored library | Bundle size and dependency count                         | No parser dependency / hand-rolled sanitizing surface to maintain               | Marked or similar / larger bundle, maintained edge cases         | EVD-009, EVD-010                | Small controlled surface, but the escaping contract must be tested (FND-SEC-001)                |
| rolldown-vite vs upstream Vite               | Build speed                                              | Rust-powered toolchain / younger ecosystem, substitution via overrides          | Upstream Vite / slower builds, maximal ecosystem support         | EVD-006                         | Compatibility risk is borne by the project, documented nowhere in `docs/`                       |
| Unsigned builds vs signing cost              | Hobbyist distribution, free hosting                      | Zero certificate cost / platform warnings and no tamper evidence                | Apple and Windows signing / recurring cost and complexity        | EVD-033                         | Documented and user-visible, acceptable at current distribution scale (FND-INF-003)             |
| Non-semantic versions vs SemVer              | Single-author release cadence                            | Simple always-patch progression / versions carry no compatibility signal        | SemVer / per-change classification effort                        | EVD-043                         | Fits the project's self-contained distribution, limits consumer signal (documented)             |
| No [CI](#glossary) vs automation cost        | Solo workflow                                            | Zero maintenance / documented gates rely on manual runs                         | [CI](#glossary) pipeline / upkeep, runner minutes                | EVD-025, EVD-031                | Regression detection rests entirely on discipline (FND-INF-001)                                 |

## Threat Model

The system crosses several trust boundaries despite having no network service: bundled host
content, user-supplied song files, the Electron renderer-to-main bridge, [MIDI](#glossary) device access,
local storage, the service-worker cache, and downloaded export artifacts.

| Boundary          | [STRIDE](#stride)      | Threat Description                                                                                                    | Control                                                                                         | Finding     |
|-------------------|------------------------|-----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|-------------|
| Host content      | Tampering              | Compromised static files (MESSAGES.md, MANUAL.md, repository [YAML](#glossary)) reach the markdown renderer or parser | [HTML](#glossary) escaping in `renderMarkdown`, `http(s)`-only links, js-yaml safe load         | FND-SEC-001 |
| Host content      | Information Disclosure | Stale cached content persists past redeploys                                                                          | Cache name is static, no versioned invalidation                                                 | FND-INF-002 |
| User files        | Tampering              | Malformed or hostile [YAML](#glossary) song or instrument files parsed from disk                                      | Safe YAML load plus clamping and validation in `songParser.ts`                                  |             |
| User files        | Denial of Service      | Crafted oversized [YAML](#glossary) or regex-stressing markdown stalls the renderer                                   | No explicit size or parse-time bound                                                            |             |
| Renderer-main     | Elevation of Privilege | Renderer reaches Node or [OS](#glossary) capabilities                                                                 | `contextIsolation: true`, `nodeIntegration: false`, four-method preload bridge                  |             |
| Renderer-main     | Spoofing               | Arbitrary `ipcRenderer` calls beyond the exposed bridge                                                               | Bridge exposes only close-confirmation and runtime-info methods                                 |             |
| Device access     | Elevation of Privilege | Untrusted page code requests device permissions                                                                       | Permission handler grants `midi` and `midiSysex` to any requesting frame without origin scoping | FND-SEC-002 |
| Local persistence | Information Disclosure | Song data and settings readable by other same-origin content                                                          | None, standard localStorage model, no sensitive data classes present                            |             |
| Local persistence | Tampering              | Stale or foreign localStorage schema breaks song load                                                                 | Schema detection and migration in `useSongManagement.ts`                                        |             |
| Cache             | Denial of Service      | Corrupted cache blocks updates                                                                                        | Navigation is network-first with cache fallback                                                 |             |
| Export output     | Repudiation            | Exported artifacts cannot be traced to a tool version                                                                 | `__APP_VERSION__` compiled in, no embedded provenance in output formats                         |             |

No [STRIDE](#stride) category at an existing boundary was omitted. Categories with no plausible threat are
absorbed into the rows above rather than left blank.

The dominant residual threats are the HTML-rendering surface on bundled content (FND-SEC-001)
and the unconditional [MIDI](#glossary) permission grant (FND-SEC-002), both bounded by the first-party-only
content model.

## Standards Conformance

The project carries a dense, well-maintained standards corpus.

| Document                 | Path                                    | Stack Coverage                                                   |
|--------------------------|-----------------------------------------|------------------------------------------------------------------|
| Engineering standards    | `docs/standard/ts-react-development.md` | TypeScript, React, state, testing, tooling                       |
| Change and quality rules | `docs/GUIDELINES.md`                    | verification discipline, audio-timing exemptions, refactor rules |
| Testing gates            | `docs/TESTING.md`                       | verification loop, coverage targets, [E2E](#glossary) commands   |
| Daily workflow           | `docs/WORKFLOW.md`                      | operational steps, baseline requirements                         |
| Versioning               | `docs/VERSIONING.md`                    | bump procedure, changelog rules                                  |
| Copyright policy         | `docs/COPYRIGHTS.md`                    | originality, permitted licenses, attribution rules               |
| Architecture record      | `docs/ARCHITECTURE.md`                  | module boundaries, state domains, decisions, limitations         |
| Refactoring method       | `docs/REFACTORING.md`                   | byte-identical export contract, per-version assessment docs      |

**Code conformance**

| Area                    | Standard Rule                                                  | Status    | Evidence                                                                                          |
|-------------------------|----------------------------------------------------------------|-----------|---------------------------------------------------------------------------------------------------|
| Language strictness     | TypeScript strict mode, no plain JS sources                    | Conforms  | `tsconfig.app.json` strict plus additional checks, all `src/` sources are `.ts`/`.tsx`            |
| Functional components   | Functional components only                                     | Conforms  | no class components found in `src/`                                                               |
| Lint hygiene            | `npm run lint` zero errors, documented warning exemptions only | Partially | exemptions documented and narrowly scoped, but lint state unverified (EVD-036)                    |
| Formatting              | Prettier config applied                                        | Partially | `.prettierrc` present, `format` script exists, current conformance unverified                     |
| Testing                 | 80 percent coverage thresholds                                 | Deviates  | `docs/TESTING.md:231` documents the coverage command as failing (FND-CQY-001)                     |
| Verification loop       | Run full loop before and after changes                         | Partially | loop documented, no automation enforces it (FND-INF-001)                                          |
| Versioning procedure    | Bump only via `npm run bump`, changelog updated                | Conforms  | `scripts/bump-version.mjs` exists, 28-entry changelog (EVD-044)                                   |
| Third-party attribution | Document source and license of third-party code                | Partially | [ZX0](#glossary) attribution in-file and in change doc, absent from `COPYRIGHTS.md` (FND-CPR-002) |
| File-size discipline    | Keep files navigable                                           | Deviates  | `App.tsx` 2488 lines, several hooks over 500 lines (EVD-018, EVD-019)                             |
| Temporary files         | Use `work/` for temporary artifacts                            | Conforms  | `.gitignore` honors `/work/`, no stray temp files tracked                                         |

**Standards quality**

| Area             | Standards Position                                        | External Best Practice                                 | Alignment                                                              |
|------------------|-----------------------------------------------------------|--------------------------------------------------------|------------------------------------------------------------------------|
| React hooks      | Warn-level rules with documented audio exemptions         | React Rules of Hooks                                   | Partially                                                              |
| Versioning       | Patch-then-rollover progression regardless of change type | SemVer meaning-laden versions                          | Diverges                                                               |
| Testing bar      | 80 percent coverage thresholds across all metrics         | Vitest defaults are unthresholded, project is stricter | Aligned in intent, currently unmet                                     |
| License policy   | Whitelist permissive licenses, GPL barred                 | SPDX-class permissive set                              | Partially - actual lockfile classes exceed the whitelist (FND-CPR-001) |
| Export stability | Byte-identical export contract under refactoring          | Golden-file testing practice                           | Aligned - [VGM](#glossary) fixtures exist in `test/fixtures/`          |

## Strengths & What's Working

- **Strict TypeScript with real teeth**. `tsconfig.app.json` enables `strict`,
  `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`, and
  `noFallthroughCasesInSwitch`, and no `any` or `@ts-ignore` occurrences exist in `src/`
  (EVD-021).
- **Typed linting with documented intent**. The flat ESLint config runs `typescript-eslint`
  recommended with `parserOptions.project`, `no-explicit-any` as error, and keeps the four
  audio-sensitive `react-hooks` rules at `warn` with the rationale written into the config
  (EVD-020).
- **Genuinely layered audio architecture**. Timing lives in a dedicated Web Worker, chip
  emulation in `YM2149.ts`, and scheduling in `SoundDriver.ts`, matching the documented data
  flow (EVD-029, EVD-045).
- **Conservative Electron boundary**. `contextIsolation` on, `nodeIntegration` off, permission
  handlers that default-deny, and a four-method preload bridge - this is the posture the
  Electron security guidance prescribes (EVD-008).
- **Input handling is defensive**. [YAML](#glossary) loads through the safe loader, numeric fields are
  clamped into documented ranges, and structural errors raise a typed `ValidationError`
  (EVD-028).
- **Process documentation is exceptional for a project this size**. Standards, workflow,
  testing gates, versioning, copyright policy, architecture decisions, per-version change
  requests, implementation plans, and refactoring assessments all exist and cross-reference
  each other (EVD-042).
- **Provenance hygiene beats most peer projects**. The README names the [AI](#glossary) toolchain,
  `docs/prompt/` preserves the task prompts, and the change/plan/refactoring trees retain the
  design context per version (EVD-032).
- **The export pipeline carries its own safety contract**. Byte-identical output under
  refactoring is a documented requirement, and ten export-focused test files plus [VGM](#glossary) golden
  fixtures exercise it (EVD-014).
- **Distribution covers three operating systems**. electron-builder targets macOS, Windows
  NSIS/zip, and Linux AppImage/tar.gz from one config, with a maintained 28-entry changelog
  (EVD-033, EVD-044).

## Detailed Technical Findings

| Finding     | Pillar                              | Severity | Title                                                                             | Result           | Status | Change | Verification |
|-------------|-------------------------------------|----------|-----------------------------------------------------------------------------------|------------------|--------|--------|--------------|
| FND-ARC-001 | Architecture & Design               | MEDIUM   | 2488-line central orchestrator concentrates wiring and change risk                | PARTIAL          | Open   | New    |              |
| FND-ARC-002 | Architecture & Design               | LOW      | Single-author contributor concentration is High                                   | [N/A](#glossary) | Open   | New    |              |
| FND-CQY-001 | Code Quality                        | MEDIUM   | Coverage gate is documented as failing and core paths are thin                    | FAIL             | Open   | New    |              |
| FND-CQY-002 | Code Quality                        | LOW      | Tracked duplicate test file never executes                                        | PARTIAL          | Open   | New    |              |
| FND-CQY-003 | Code Quality                        | MEDIUM   | No end-to-end specs exist despite configured Playwright                           | FAIL             | Open   | New    |              |
| FND-CQY-004 | Code Quality                        | LOW      | Documentation figures have drifted from the code                                  | PARTIAL          | Open   | New    |              |
| FND-SEC-001 | Security & Compliance               | MEDIUM   | Custom HTML rendering surface lacks defense in depth                              | PARTIAL          | Open   | New    |              |
| FND-SEC-002 | Security & Compliance               | LOW      | [MIDI](#glossary) permission grant is not scoped to the requesting origin         | PARTIAL          | Open   | New    |              |
| FND-INF-001 | Infrastructure & [CI/CD](#glossary) | MEDIUM   | No automated [CI](#glossary) gate exists for the documented verification loop     | FAIL             | Open   | New    |              |
| FND-INF-002 | Infrastructure & [CI/CD](#glossary) | MEDIUM   | Service worker can serve stale assets after redeploys                             | FAIL             | Open   | New    |              |
| FND-INF-003 | Infrastructure & [CI/CD](#glossary) | LOW      | Desktop artifacts are distributed unsigned                                        | PARTIAL          | Open   | New    |              |
| FND-AIP-001 | AI Provenance & Code Origin         | LOW      | [AI](#glossary) provenance is disclosed but per-change compliance is unmeasurable | PARTIAL          | Open   | New    |              |
| FND-CPR-001 | Copyrights & Originality            | LOW      | License policy whitelist is narrower than the resolved dependency set             | PARTIAL          | Open   | New    |              |
| FND-CPR-002 | Copyrights & Originality            | LOW      | [ZX0](#glossary) third-party attribution is absent from the central notice file   | PARTIAL          | Open   | New    |              |

### FND-ARC-001: 2488-line central orchestrator concentrates wiring and change risk

* **Pillar:** Architecture & Design
* **Severity:** Medium
* **Type:** Concern
* **Security:** [N/A](#glossary) - structural finding, not a weakness
* **Status:** Open
* **Change:** New
* **Targets:** `src/App.tsx`, `src/hooks/useMidiMessageProcessing.ts`, `src/hooks/useSongManagement.ts`, `src/hooks/useMidiActions.ts`, `src/hooks/useSequencerIntegration.ts`
* **Basis:** `docs/ARCHITECTURE.md:124` names `App.tsx` as the single largest maintenance risk, and the file has grown 294 lines past the documented figure
* **Absence:** Deliberate - recorded decision - `docs/ARCHITECTURE.md` decisions section documents the orchestrator choice and its trade-off
* **Description:** `src/App.tsx` is 2488 lines and instantiates roughly twenty hooks, declares the
  song model in `useState`, and wires every cross-hook dependency manually. Supporting hooks
  are themselves large: `useMidiMessageProcessing` 671, `useSongManagement` 619,
  `useMidiActions` 590, `useSequencerIntegration` 543 lines. Cross-hook dependencies are
  implicit and exist only through the wiring in the orchestrator.
* **Impact:** any change to song shape, playback state, or modal flow must be traced through a
  very large file and several large hooks, raising the probability of incomplete edits and
  merge-impossible refactors. The architecture document already calls this the top
  maintainability risk.
* **Recommendation:** extract cohesive domains in stages per the project's own `docs/REFACTORING.md`
  method: first pull pure wiring groups ([MIDI](#glossary) chain, file operations, modal manager) into
  container components or facade hooks with explicit typed contracts, keep the audio-timing
  exemptions intact, and guard each step with the existing unit and fixture tests plus a
  byte-identical export check.
* **Method:** after each extraction, `npm run typecheck`, `npm run lint`, and `npm test` stay
  green and a reference song export is byte-identical to the pre-change output.
* **Verified:** yes - measured from source, behavior not executed
* **Confidence:** HIGH - line counts and hook wiring are directly measurable
* **Mitigating factors:** the choice is documented with its rationale, the store hook split
  already exists for [UI](#glossary) state, and `AppLayout` separates rendering from wiring
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-016, EVD-018, EVD-019, all `Inspected`

### FND-ARC-002: Single-author contributor concentration is High

* **Pillar:** Architecture & Design
* **Severity:** Low
* **Type:** Observation
* **Security:** [N/A](#glossary) - continuity fact, not a weakness
* **Status:** Open
* **Change:** New
* **Targets:** repository history, `docs/` governance set
* **Basis:** the delivery-practice rubric rates a single-author project `High` concentration
* **Absence:** Undetermined - no record states whether the single-author setup is a deliberate choice
* **Description:** all 679 non-merge commits across the 8.3-month history are attributed to one
  author, and no second contributor, reviewer, or co-maintainer appears in the commit stream.
* **Impact:** maintainer unavailability halts review, merge, release, and documentation upkeep
  until a fork or handoff occurs.
* **Recommendation:** name a backup maintainer or organizational handoff path in the governance
  documents, and consider enabling GitHub codeowners or review assignment to create a review
  trail that does not live only in commits.
* **Method:** a named continuity contact or owner appears in `docs/` or repository settings.
* **Verified:** yes - complete commit-author census
* **Confidence:** HIGH - direct census of all non-merge commits
* **Mitigating factors:** the project documents itself thoroughly, which lowers the handoff cost
  even though it does not lower the concentration
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-002, EVD-003, `Inspected`

### FND-CQY-001: Coverage gate is documented as failing and core paths are thin

* **Pillar:** Code Quality
* **Severity:** Medium
* **Type:** Concern
* **Security:** [N/A](#glossary) - quality-gate finding
* **Status:** Open
* **Change:** New
* **Targets:** `vitest.config.ts`, `docs/TESTING.md`, `test/` tree
* **Basis:** the project sets 80 percent coverage thresholds and documents that the coverage
  command currently fails
* **Absence:** Undetermined - the documented gap list records the state but no rationale for it
* **Description:** `vitest.config.ts` enforces 80 percent thresholds for lines, functions,
  branches, and statements, and `docs/TESTING.md:231` states the coverage command will fail
  until coverage reaches them. The 44 test files carry about 218 cases concentrated in
  `test/utils/`, while `test/synth/` holds one file, no `test/modals/` or `test/workers/`
  directory exists, and most of the 31 hooks are untested.
* **Impact:** the highest-risk code (chip emulation, sequencer timing, export encoders, worker
  loop) has the thinnest behavioral safety net, and the project's own gate is documented red.
* **Recommendation:** add characterization tests for `SoundDriver` event generation,
  `sequencerWorker` catch-up math, each export encoder's byte layout, and modal interactions,
  or lower the threshold to the measured value with a ratchet policy documented in
  `TESTING.md`.
* **Method:** `npm run test:coverage` exits 0 against the committed thresholds.
* **Verified:** yes - config and documentation inspected, suite not executed
* **Confidence:** HIGH for the documented failure statement, MEDIUM for the unmeasured actual
  coverage figure
* **Mitigating factors:** export-focused tests and [VGM](#glossary) golden fixtures already exist, and the
  gap is explicitly documented rather than hidden
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-013, EVD-014, `Inspected` plus `Reported` gap list in `docs/TESTING.md`

### FND-CQY-002: Tracked duplicate test file never executes

* **Pillar:** Code Quality
* **Severity:** Low
* **Type:** Concern
* **Security:** [N/A](#glossary) - repository hygiene finding
* **Status:** Open
* **Change:** New
* **Targets:** `test/utils/exportMax.test`
* **Basis:** the Vitest include pattern is `test/**/*.{test,spec}.{ts,tsx}`, which requires a
  final extension
* **Absence:** Undetermined - no record explains why the stale copy was committed
* **Description:** `test/utils/exportMax.test` is a tracked 11 KB file holding 12 test cases
  with an older variant of the MAX delimiter assertions than `exportMax.test.ts`. Because the
  filename ends in `.test` rather than `.test.ts`, Vitest never discovers it.
* **Impact:** the file presents as a test but contributes no signal, and its divergent
  assertions can mislead anyone auditing MAX-export coverage.
* **Recommendation:** delete the stray file or merge any unique assertions into
  `exportMax.test.ts`.
* **Method:** `git ls-files test/` no longer lists `exportMax.test`, or the file carries a
  `.ts` extension and runs.
* **Verified:** yes - filename and include pattern compared directly
* **Confidence:** HIGH - the include pattern is mechanical
* **Mitigating factors:** the canonical `.ts` file exists with stronger assertions, so no
  coverage is actually lost
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-015, `Inspected`

### FND-CQY-003: No end-to-end specs exist despite configured Playwright

* **Pillar:** Code Quality
* **Severity:** Medium
* **Type:** Concern
* **Security:** [N/A](#glossary) - verification-gap finding
* **Status:** Open
* **Change:** New
* **Targets:** `e2e/`, `playwright.config.ts`, `docs/TESTING.md`
* **Basis:** the project configures Chromium, Firefox, and WebKit projects plus a preview
  server and documents [E2E](#glossary) commands and sample flows
* **Absence:** No documented rationale - the harness exists but no spec ever landed
* **Description:** `e2e/` contains only `.gitkeep`. `docs/TESTING.md` documents `npm run
  test:e2e` and lists flows such as save/load and theme switching, but no spec file exists to
  run them.
* **Impact:** integration defects across the wiring layer (modals, file dialogs, playback
  controls, export downloads) have no automated detection path.
* **Recommendation:** add a minimal smoke suite covering app load, song load from the bundled
  repository, playback start/stop, and one export download, then wire it into the [CI](#glossary) workflow
  from REC-002.
* **Method:** `npx playwright test --project=chromium` runs at least one spec green.
* **Verified:** yes - directory listing and config inspected
* **Confidence:** HIGH - absence verified by census
* **Mitigating factors:** the manual verification loop exists, and `docs/TESTING.md` lists the
  intended flows, so the harness decision is made and only specs are missing
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-012, `Inspected`

### FND-CQY-004: Documentation figures have drifted from the code

* **Pillar:** Code Quality
* **Severity:** Low
* **Type:** Observation
* **Security:** [N/A](#glossary) - documentation-consistency finding
* **Status:** Open
* **Change:** New
* **Targets:** `docs/ARCHITECTURE.md`, `docs/TESTING.md`
* **Basis:** project documents are treated as sources of truth by `docs/GUIDELINES.md`
* **Absence:** Undetermined - no record states whether the stale figures are tolerated drift
* **Description:** `docs/ARCHITECTURE.md:5` states Electron 39 while `package.json` declares
  `^42.0.0` and locks 42.6.0, and the same file states `App.tsx` is 2194 lines while it
  measures 2488. `docs/TESTING.md`'s gap list says modals have no tests although
  `FilePickerModal.test.tsx` exists, says exports need tests although ten export test files
  exist, and counts 30 hooks while the directory holds 31.
* **Impact:** future change work that trusts the documented figures plans against a smaller
  orchestrator and a different dependency floor than reality.
* **Recommendation:** refresh the cited figures as part of each release's documentation pass,
  or drop brittle absolute numbers in favor of approximate ranges.
* **Method:** the named figures match measured values at the next release.
* **Verified:** yes - figures compared against manifest and file measurements
* **Confidence:** HIGH - direct comparisons
* **Mitigating factors:** the drift is a side effect of an otherwise exemplary documentation
  practice, and the substantive claims (the orchestrator is the top risk) remain directionally
  true
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-016, EVD-017, `Inspected`

### FND-SEC-001: Custom HTML rendering surface lacks defense in depth

* **Pillar:** Security & Compliance
* **Severity:** Medium
* **Type:** Concern
* **Security:** CWE-79 - improper neutralization of input during web page generation, partially
  mitigated by escaping. The equivalent automated checks are `eslint-plugin-no-unsanitized`
  sink rules, not yet enabled
* **Status:** Open
* **Change:** New
* **Targets:** `src/utils/markdown.ts`, `src/modals/MarkdownModal.tsx:29`,
  `src/components/EnvelopeSection.tsx:102`, `index.html`
* **Basis:** Electron security guidance recommends a [CSP](#glossary), and hand-rolled sanitizers are a
  recognized injection surface
* **Absence:** Undetermined - no record states why a bespoke renderer was chosen over a vetted
  library
* **Description:** two components inject `renderMarkdown` output via `dangerouslySetInnerHTML`.
  The renderer escapes [HTML](#glossary) characters before applying bold, italic, code, and table
  formatting, and generates links only for `http(s)` [URLs](#glossary) with `rel="noreferrer"`. No
  `Content-Security-Policy` meta tag or header mechanism exists, and the custom escaping has
  no dedicated adversarial test coverage.
* **Impact:** a malformed document or a subtle escaping gap (for example a table-cell or
  code-span edge case) could inject markup into the [DOM](#glossary). Today the only inputs are bundled
  first-party files, so exploitation requires a content-compromise precondition.
* **Recommendation:** add a restrictive [CSP](#glossary) (`default-src 'self'` with explicit allowances) to
  `index.html`, add sanitizer-focused tests with hostile markdown inputs, and consider
  replacing the custom renderer with a vetted sanitizer-plus-parser stack.
* **Method:** hostile-fixture tests confirm script and attribute injection is escaped, and the
  [CSP](#glossary) is observable in the built `dist/index.html`.
* **Verified:** yes - sink census and renderer source inspected
* **Confidence:** MEDIUM - the escaping logic reads correctly, but no execution exercised
  edge cases and content sources could broaden
* **Mitigating factors:** inputs are bundled first-party files only, escaping runs before all
  formatting, and link generation is scheme-restricted. The equivalent analyzer rules are not
  enabled in the ESLint config
* **Exploitability:** [N/A](#glossary) - internal rendering path fed by bundled content, not directly
  network-facing
* **Evidence:** EVD-009, EVD-010, EVD-030, EVD-034, `Inspected`

### FND-SEC-002: MIDI permission grant is not scoped to the requesting origin

* **Pillar:** Security & Compliance
* **Severity:** Low
* **Type:** Observation
* **Security:** CWE-862 - the permission decision omits an origin or embedder check, though the
  packaged window only loads first-party content
* **Status:** Open
* **Change:** New
* **Targets:** `electron/main.cjs:24-41`
* **Basis:** permission handlers are the documented gate for device access in Electron
* **Absence:** Undetermined - no record states whether origin-scoping the grant was considered
* **Description:** `setPermissionRequestHandler` and `setPermissionCheckHandler` return `true`
  for `midi` and `midiSysex` for any requesting frame, and `false` otherwise. No check of the
  requesting `webContents` origin or [URL](#glossary) is performed.
* **Impact:** if dev-mode ever loads a non-local [URL](#glossary) or a subframe requests the permission,
  [MIDI](#glossary) access is granted without scoping. In the packaged `loadFile` path the exposure is
  minimal.
* **Recommendation:** bind the grant to the expected origin (`file://` packaged root or
  `http://localhost:8008` in dev) before allowing the permission.
* **Method:** a non-matching origin requesting `midi` receives a denial.
* **Verified:** yes - handler logic inspected directly
* **Confidence:** HIGH - the decision logic is six lines and unambiguous
* **Mitigating factors:** packaged mode loads only the bundled file, dev mode loads localhost,
  and all other permissions are denied
* **Exploitability:** [N/A](#glossary) - LOW severity, narrative required only for HIGH/CRITICAL
* **Evidence:** EVD-008, `Inspected`

### FND-INF-001: No automated CI gate exists for the documented verification loop

* **Pillar:** Infrastructure & [CI/CD](#glossary)
* **Severity:** Medium
* **Type:** Concern
* **Security:** [N/A](#glossary) - process gap, not a weakness
* **Status:** Open
* **Change:** New
* **Targets:** repository root, `docs/TESTING.md`, `docs/WORKFLOW.md`, `package.json`
* **Basis:** `TESTING.md` and `WORKFLOW.md` define a mandatory six-step verification loop with
  zero-error and zero-warning exit criteria
* **Absence:** No documented rationale - no decision record explains the absence of automation
* **Description:** no `.github/` directory, workflow file, or pipeline definition exists. Every
  gate (`typecheck`, `lint`, `format`, `build`, `test`, coverage, e2e, packaging) is a manual
  invocation, and the documented-failing coverage command has no automated detector.
* **Impact:** regressions in any layer land without detection until someone runs the loop
  locally. The stale-documentation and dead-test findings demonstrate the class.
* **Recommendation:** add a [CI](#glossary) workflow running `npm run typecheck`, `npm run lint`,
  `prettier --check`, `npm test`, and `npm run build` on push and pull request, with the
  coverage command allowed to fail only until REC-001 closes.
* **Method:** a pushed commit produces a green run for the full loop on the platform.
* **Verified:** yes - absence verified by full file census
* **Confidence:** HIGH - no [CI](#glossary) config exists anywhere in the tracked tree
* **Mitigating factors:** the manual loop is unusually well documented, and the bump script
  embeds a build step
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-025, EVD-031, `Inspected`

### FND-INF-002: Service worker can serve stale assets after redeploys

* **Pillar:** Infrastructure & [CI/CD](#glossary)
* **Severity:** Medium
* **Type:** Concern
* **Security:** [N/A](#glossary) - deployment-freshness defect
* **Status:** Open
* **Change:** New
* **Targets:** `public/js/sw.js`, `vite.config.ts`, `src/main.tsx:10-17`
* **Basis:** cache-first asset strategies require content-addressed names or a versioned cache
  to stay coherent
* **Absence:** No documented rationale - `DEPLOYMENT.md` mentions the [PWA](#glossary) behavior but not the
  staleness interaction
* **Description:** the service worker caches navigations network-first but answers all other
  same-origin GET requests cache-first under the fixed name `dosound-tracker-cache-v1`, while
  the Vite build emits deterministic hashless filenames (`assets/[name].js`). A redeployed
  build produces the same [URLs](#glossary) with new content, but returning clients continue to receive the
  cached previous bundle. The cache name is not derived from `__APP_VERSION__`.
* **Impact:** web users can run a stale application indefinitely after an update, and an updated
  `index.html` (network-first) can pair with an old `main.js`, producing version skew.
* **Recommendation:** derive the cache name from the app version or build hash, and switch the
  asset branch to network-first with cache fallback, or emit hashed names for the web build
  only while keeping deterministic names for Electron packaging.
* **Method:** deploy a rebuilt bundle and observe the client fetch the new `main.js` without
  manual cache clearing.
* **Verified:** yes - worker logic and build config compared directly, runtime not executed
* **Confidence:** MEDIUM - the reasoning follows the caching semantics exactly, but service
  worker behavior was not observed live
* **Mitigating factors:** navigations are network-first so [HTML](#glossary) updates propagate, and Electron
  builds bypass the service worker entirely
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-011, `Inspected`

### FND-INF-003: Desktop artifacts are distributed unsigned

* **Pillar:** Infrastructure & [CI/CD](#glossary)
* **Severity:** Low
* **Type:** Observation
* **Security:** [N/A](#glossary) - distribution-integrity observation, partially mitigated by [HTTPS](#glossary) hosting
  disclosure
* **Status:** Open
* **Change:** New
* **Targets:** `package.json` electron-builder config, `README.md` downloads section
* **Basis:** platform conventions expect signed installers for distributed desktop software
* **Absence:** Deliberate - recorded decision - the README discloses unsigned binaries to users
* **Description:** no signing identity, certificate, or notarization configuration exists in
  the electron-builder block, and the README tells macOS users the binaries are not
  code-signed and how to proceed. No git tag or checksum publication anchors a released
  artifact to a revision.
* **Impact:** users cannot verify artifact provenance beyond transport trust to the hosting
  site, and Gatekeeper/SmartScreen warnings train users to bypass security prompts.
* **Recommendation:** when distribution volume justifies it, add macOS signing plus
  notarization and Windows signing. In the interim, publish SHA-256 checksums per release on
  the download page.
* **Method:** `codesign -dv` or equivalent verifies a signature, or a checksum file matches the
  downloaded artifact.
* **Verified:** yes - config and README inspected
* **Confidence:** HIGH - absence of signing config is verifiable and the README confirms it
* **Mitigating factors:** distribution is a hobbyist-scale direct-download channel over [HTTPS](#glossary),
  and the unsigned status is honestly disclosed
* **Exploitability:** [N/A](#glossary) - not network-facing code, distribution integrity observation only
* **Evidence:** EVD-033, EVD-004, `Inspected`

### FND-AIP-001: AI provenance is disclosed but per-change compliance is unmeasurable

* **Pillar:** AI Provenance & Code Origin
* **Severity:** Low
* **Type:** Observation
* **Security:** [N/A](#glossary) - provenance fact
* **Status:** Open
* **Change:** New
* **Targets:** `README.md:38`, `docs/prompt/`, `docs/COPYRIGHTS.md`, git history
* **Basis:** `docs/COPYRIGHTS.md` requires verifying the originality of AI-generated code and
  never accepting output that resembles existing projects
* **Absence:** No documented rationale - no record explains the absence of per-change disclosure
* **Description:** the README states the project was made using Windsurf and GPT 5.1,
  `docs/prompt/1.0-1.2/` retains the per-task prompts, and ten commits carry tool-attribution
  trailers among 705. No artifact maps which specific files or hunks were generated, so the
  originality-verification requirement cannot be checked per change.
* **Impact:** provenance is knowable at project level but not at file level, and the
  originality rule's enforcement cannot be demonstrated.
* **Recommendation:** adopt a per-change disclosure convention (commit trailer or plan-doc note
  naming the tool when substantial generated code lands) so future audits can scope it.
* **Method:** new commits that introduce generated code carry a disclosure trailer or doc
  reference.
* **Verified:** yes - attribution text, prompt logs, and trailer census inspected
* **Confidence:** MEDIUM - the disclosures are verified. Whether undisclosed assistance exists
  cannot be determined from source
* **Mitigating factors:** prompt logs and per-version change and plan documents preserve more
  provenance context than most projects keep, and no style-based authorship inference was used
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-003, EVD-032, `Inspected`

### FND-CPR-001: License policy whitelist is narrower than the resolved dependency set

* **Pillar:** Copyrights & Originality
* **Severity:** Low
* **Type:** Concern
* **Security:** [N/A](#glossary) - license-policy conformance finding
* **Status:** Open
* **Change:** New
* **Targets:** `docs/COPYRIGHTS.md`, `package-lock.json`
* **Basis:** the policy permits [MIT](#glossary), Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, and Boost, and
  requires verifying license compatibility before use
* **Absence:** No documented rationale - no record explains the whitelist and lockfile mismatch
* **Description:** the lockfile resolves 590 packages of which 368 declare a license field:
  [MIT](#glossary) 270, ISC 41, BSD-3-Clause 20, Apache-2.0 12, BlueOak-1.0.0 9, BSD-2-Clause 8, MIT-0 2,
  CC0-1.0 1, WTFPL 1, WTFPL OR ISC 1, (MIT OR CC0-1.0) 1, (WTFPL OR MIT) 1, CC-BY-4.0 1.
  BlueOak-1.0.0, CC-BY-4.0, WTFPL, MIT-0, and CC0-1.0 are outside the permitted list, and 222
  components declare no license at all. All are development-time or tooling packages. The five
  runtime dependencies themselves carry [MIT](#glossary) or undetermined declarations.
* **Impact:** the project cannot demonstrate per-component conformance to its own license
  policy, and a reviewer cannot confirm whitelist coverage without repeating this inspection.
* **Recommendation:** either extend the permitted list with the observed permissive classes or
  add a `THIRD-PARTY-NOTICES`-style inventory generated at release time that records each
  resolved license.
* **Method:** a committed inventory or an updated policy enumerates every resolved license
  class.
* **Verified:** yes - license fields extracted from the lockfile directly
* **Confidence:** HIGH for declared fields, LOW for the 222 undetermined entries whose licenses
  are not recorded in the lockfile
* **Mitigating factors:** no copyleft class exists anywhere in the resolved set, and all
  out-of-whitelist classes are permissive or attribution-style licenses in development-time
  dependencies
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-006, EVD-007, EVD-024, `Inspected`

### FND-CPR-002: ZX0 third-party attribution is absent from the central notice file

* **Pillar:** Copyrights & Originality
* **Severity:** Low
* **Type:** Observation
* **Security:** [N/A](#glossary) - attribution-consistency finding
* **Status:** Open
* **Change:** New
* **Targets:** `src/utils/zx0.ts:1-12`, `docs/COPYRIGHTS.md`
* **Basis:** the copyright policy requires attributing third-party assets in `COPYRIGHTS.md` or
  an `ATTRIBUTIONS.md` file
* **Absence:** Undetermined - whether the central-file omission is deliberate is unrecorded
* **Description:** `src/utils/zx0.ts` is a TypeScript port of Einar Saukas's Salvador ZX0
  implementation under BSD-3-Clause, with copyright notice and source [URL](#glossary) preserved in the
  file header, and the change record documents the license check. `docs/COPYRIGHTS.md` does
  not list the component.
* **Impact:** the policy's stated attribution location does not enumerate the project's only
  vendored component, so a reader consulting the central file gets an incomplete picture.
* **Recommendation:** add the [ZX0](#glossary) entry (author, license, source [URL](#glossary)) to `docs/COPYRIGHTS.md`.
* **Method:** the component appears in the attribution file at the next documentation pass.
* **Verified:** yes - header text and policy file compared directly
* **Confidence:** HIGH - both documents are directly citable
* **Mitigating factors:** the in-file notice satisfies the BSD-3-Clause retention requirement
  on its own, and the port's provenance is documented in the change record
* **Exploitability:** [N/A](#glossary) - not a security finding
* **Evidence:** EVD-023, `Inspected`

## Technical Debt Register

| Debt    | Item                                                            | Category        | Source      | Cost                                                    | Delay                                                           | Status |
|---------|-----------------------------------------------------------------|-----------------|-------------|---------------------------------------------------------|-----------------------------------------------------------------|--------|
| TDR-001 | Central orchestrator decomposition                              | Maintainability | FND-ARC-001 | High effort, staged extraction across releases          | Each feature change pays navigation and merge cost in `App.tsx` | Open   |
| TDR-002 | Core-path test backlog (synth, exports breadth, worker, modals) | Reliability     | FND-CQY-001 | High effort, characterization tests across five areas   | Every audio or export change ships with weak behavioral net     | Open   |
| TDR-003 | Hand-rolled markdown renderer and sanitizer                     | Security        | FND-SEC-001 | Medium effort, sanitizer tests plus [CSP](#glossary)    | Each new markdown feature must re-derive escaping safety        | Open   |
| TDR-004 | Documentation figure drift and dead test artifact               | Maintainability | FND-CQY-004 | Low effort, refresh pass plus one deletion              | Stale figures compound into misleading change plans             | Open   |
| TDR-005 | Verification-loop automation debt                               | Reliability     | FND-INF-001 | Medium effort, one [CI](#glossary) workflow plus upkeep | Manual-only gates let the failure classes above recur           | Open   |

### TDR-001: Central orchestrator decomposition

* **Category:** Maintainability
* **Source:** FND-ARC-001
* **Description:** `App.tsx` holds wiring for roughly twenty hooks plus the song model in 2488
  lines. The file's growth rate (2194 documented to 2488 measured) shows the debt is still
  accruing
* **Cost:** High - several staged extractions with typed hook contracts, spread across
  releases. The effort estimate is `INSUFFICIENT INFORMATION` for precise sizing
* **Delay:** Medium ongoing - every feature touching song state pays navigation and merge cost
* **Status:** Open

### TDR-002: Core-path test backlog

* **Category:** Reliability
* **Source:** FND-CQY-001
* **Description:** the documented 80 percent gate fails, and the thinnest coverage sits on the
  highest-risk paths: [YM2149](#glossary) emulation, `SoundDriver` event generation, worker timing math,
  and modal flows
* **Cost:** High - characterization tests against current behavior, including byte-level export
  assertions. The precise estimate is `INSUFFICIENT INFORMATION`
* **Delay:** Medium ongoing - refactor safety and the byte-identical export contract rest on a
  partial net
* **Status:** Open

### TDR-003: Hand-rolled markdown renderer

* **Category:** Security
* **Source:** FND-SEC-001
* **Description:** `renderMarkdown` is a bespoke escape-plus-format pipeline feeding
  `dangerouslySetInnerHTML`. Every added syntax feature must re-derive the escaping contract
* **Cost:** Medium - hostile-fixture tests and a [CSP](#glossary) are cheap. A vetted sanitizer replacement
  is the larger option
* **Delay:** Low ongoing - the feature set is stable, but each extension carries injection
  review cost
* **Status:** Open

### TDR-004: Documentation drift and dead artifacts

* **Category:** Maintainability
* **Source:** FND-CQY-004
* **Description:** absolute figures in `ARCHITECTURE.md` and `TESTING.md` lag the code, and a
  stale duplicate test file sits tracked but unexecuted
* **Cost:** Low - a refresh pass and one deletion
* **Delay:** Low ongoing - figures will keep drifting unless the update step is proceduralized
* **Status:** Open

### TDR-005: Verification automation debt

* **Category:** Reliability
* **Source:** FND-INF-001
* **Description:** the documented six-step loop has no [CI](#glossary) runner, so conformance depends on
  discipline alone
* **Cost:** Medium - one workflow file plus occasional runner maintenance
* **Delay:** Medium ongoing - each manual-only release carries regression-escape risk
* **Status:** Open

## Unified Risk Register

| Risk    | Description                                                                | Source      | Impact | Likelihood | Severity | Mitigation                                   |
|---------|----------------------------------------------------------------------------|-------------|--------|------------|----------|----------------------------------------------|
| RSK-001 | Regressions merge undetected without [CI](#glossary) enforcement           | FND-INF-001 | MEDIUM | MEDIUM     | MEDIUM   | Add CI running the documented loop           |
| RSK-002 | Redeploys serve stale or skewed web assets                                 | FND-INF-002 | MEDIUM | MEDIUM     | MEDIUM   | Version the cache name, network-first assets |
| RSK-003 | Maintainer unavailability halts all delivery                               | FND-ARC-002 | HIGH   | LOW        | MEDIUM   | Name a backup owner or fork path             |
| RSK-004 | Orchestrator growth compounds change defects                               | FND-ARC-001 | MEDIUM | MEDIUM     | MEDIUM   | Stage the decomposition                      |
| RSK-005 | Injected markup renders through the markdown sink                          | FND-SEC-001 | HIGH   | LOW        | MEDIUM   | [CSP](#glossary) plus hostile-fixture tests  |
| RSK-006 | [UI](#glossary) regressions reach releases without [E2E](#glossary) checks | FND-CQY-003 | MEDIUM | MEDIUM     | MEDIUM   | Playwright smoke suite                       |
| RSK-007 | License-policy non-conformance surfaces late                               | FND-CPR-001 | LOW    | MEDIUM     | LOW      | Generate a notices inventory                 |
| RSK-008 | Dead test file implies coverage that does not run                          | FND-CQY-002 | LOW    | LOW        | LOW      | Remove or merge the stray file               |
| RSK-009 | Tampered or mismatched binaries reach users unverified                     | FND-INF-003 | MEDIUM | LOW        | LOW      | Publish checksums, then sign                 |
| RSK-010 | Stale documented figures mislead change planning                           | FND-CQY-004 | LOW    | MEDIUM     | LOW      | Refresh figures per release                  |
| RSK-011 | Device permission granted beyond the intended origin                       | FND-SEC-002 | MEDIUM | LOW        | LOW      | Scope the grant to the app origin            |
| RSK-012 | Undisclosed generated code lands without trace                             | FND-AIP-001 | LOW    | LOW        | LOW      | Per-change disclosure convention             |

### RSK-001: Regressions merge undetected without CI enforcement

* **Severity:** MEDIUM
* **Likelihood:** MEDIUM - plausible under normal operation, the documented failing coverage
  command already demonstrates one unenforced gate
* **Residual:** LOW after a mandatory PR-time workflow
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** every quality gate is manual, so lint errors, type errors, test failures,
  and coverage regressions can land unnoticed between releases
* **Impact:** contained outages or defect releases discovered only at next manual run
* **Trigger:** a change lands without the author running the full loop
* **Controls:** documented zero-warning bar, bump script embeds a build
* **Mitigation:** REC-002 adds the [CI](#glossary) workflow
* **Closure:** a green workflow run exists for a pushed change
* **Source:** FND-INF-001
* **Confidence:** HIGH - absence verified by census

### RSK-002: Redeploys serve stale or skewed web assets

* **Severity:** MEDIUM
* **Likelihood:** MEDIUM - occurs on any redeploy for users with a warm cache
* **Residual:** LOW after versioned cache naming or network-first assets
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** the cache-first asset strategy plus hashless filenames means a returning
  client can indefinitely run a previous bundle, and a fresh `index.html` can pair with an old
  script
* **Impact:** users run outdated or internally skewed application builds
* **Trigger:** a site redeploy reaches a client that has the asset cached
* **Controls:** navigations are network-first. No asset-version invalidation exists
* **Mitigation:** REC-003 versions the cache or reorders the strategy
* **Closure:** a redeploy observed to ship the new bundle to a warm client
* **Source:** FND-INF-002
* **Confidence:** MEDIUM - semantics reasoned statically, no live service-worker run

### RSK-003: Maintainer unavailability halts all delivery

* **Severity:** MEDIUM
* **Likelihood:** LOW - requires the single maintainer to become unavailable
* **Residual:** MEDIUM - a named owner reduces but does not remove the dependency
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** 100 percent of commits come from one author, so review, release, and
  incident response have one path
* **Impact:** major delivery halt until a fork or handoff
* **Trigger:** maintainer unavailability
* **Controls:** thorough documentation lowers the handoff threshold
* **Mitigation:** REC-012 names a continuity owner
* **Closure:** a documented second owner or fork path exists
* **Source:** FND-ARC-002
* **Confidence:** HIGH - complete author census

### RSK-004: Orchestrator growth compounds change defects

* **Severity:** MEDIUM
* **Likelihood:** MEDIUM - the file grew 294 lines past its documented size in one interval
* **Residual:** MEDIUM - decomposition reduces blast radius gradually
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** concentrated wiring makes each state-shape change traverse the largest file
  in the codebase, raising the chance of partial edits
* **Impact:** contained defects in wiring, playback, or modal flow
* **Trigger:** any cross-hook change
* **Controls:** documented trade-off, existing unit tests
* **Mitigation:** REC-007 stages the extraction
* **Closure:** wiring groups extracted behind typed contracts
* **Source:** FND-ARC-001
* **Confidence:** HIGH - measured directly

### RSK-005: Injected markup renders through the markdown sink

* **Severity:** MEDIUM
* **Likelihood:** LOW - inputs are bundled first-party files, so a content-compromise
  precondition applies
* **Residual:** LOW after [CSP](#glossary) plus tests, absent after a vetted sanitizer
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** a gap in the custom escape pipeline could let crafted markdown emit active
  markup into `dangerouslySetInnerHTML` sinks
* **Impact:** markup injection in the renderer, script execution bounded by context isolation
* **Trigger:** hostile or malformed bundled or future user-supplied markdown
* **Controls:** [HTML](#glossary) escaping before formatting, `http(s)`-only links, `noreferrer`, context
  isolation, no `nodeIntegration`
* **Mitigation:** REC-008 adds [CSP](#glossary) and adversarial tests
* **Closure:** hostile-fixture tests pass and a [CSP](#glossary) is present
* **Source:** FND-SEC-001
* **Confidence:** MEDIUM - static reasoning only, sink inputs could broaden

### RSK-006: UI regressions reach releases without E2E checks

* **Severity:** MEDIUM
* **Likelihood:** MEDIUM - modal and flow changes are untested end to end
* **Residual:** LOW after a maintained smoke suite
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** configured-but-empty Playwright harness leaves the full wiring path
  (modals, file dialogs, playback, download) unverified
* **Impact:** user-visible regressions escape between manual checks
* **Trigger:** a [UI](#glossary) or wiring change between manual verifications
* **Controls:** component and hook unit tests cover fragments
* **Mitigation:** REC-006 adds the smoke suite
* **Closure:** `playwright test` runs specs green in [CI](#glossary)
* **Source:** FND-CQY-003
* **Confidence:** HIGH - absence verified by census

### RSK-007: License-policy non-conformance surfaces late

* **Severity:** LOW
* **Likelihood:** MEDIUM - the deviation already exists in the lockfile
* **Residual:** LOW after an inventory or policy update
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** resolved licenses include classes outside the permitted whitelist and 222
  components are undetermined, so the project cannot currently demonstrate policy conformance
* **Impact:** limited - all observed classes are permissive and dev-scoped, but undemonstrated
  compliance is a review gap
* **Trigger:** a compliance review or a new non-whitelisted direct dependency
* **Controls:** the policy document itself
* **Mitigation:** REC-010 generates the notices inventory
* **Closure:** a committed inventory enumerates every resolved license
* **Source:** FND-CPR-001
* **Confidence:** HIGH for declared classes, LOW for undetermined entries

### RSK-008: Dead test file implies coverage that does not run

* **Severity:** LOW
* **Likelihood:** LOW - cosmetic unless someone audits MAX coverage by filename
* **Residual:** NONE after deletion
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** a tracked but undiscovered test file suggests test depth the runner never
  executes
* **Impact:** cosmetic and review-confusion cost
* **Trigger:** a reader counts test files rather than executed tests
* **Controls:** the canonical `.ts` twin carries stronger assertions
* **Mitigation:** REC-005 removes or merges it
* **Closure:** file removed or merged
* **Source:** FND-CQY-002
* **Confidence:** HIGH - include pattern is mechanical

### RSK-009: Tampered or mismatched binaries reach users unverified

* **Severity:** LOW
* **Likelihood:** LOW - requires hosting compromise or artifact mix-up
* **Residual:** LOW after checksum publication, lower after signing
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** unsigned installers with no published checksums give users no independent
  provenance check
* **Impact:** a compromised artifact is indistinguishable to a downloader
* **Trigger:** hosting compromise or mistaken artifact publication
* **Controls:** [HTTPS](#glossary) transport, honest unsigned-status disclosure
* **Mitigation:** REC-013 publishes checksums, then signing when justified
* **Closure:** published checksums match downloads
* **Source:** FND-INF-003
* **Confidence:** HIGH - absence of signing config is verified

### RSK-010: Stale documented figures mislead change planning

* **Severity:** LOW
* **Likelihood:** MEDIUM - drift already observed and the docs carry absolute figures
* **Residual:** LOW after a per-release refresh step
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** version numbers, file sizes, and gap lists in governing docs lag the code,
  feeding wrong inputs into planning
* **Impact:** limited planning distortion
* **Trigger:** any change sized or scoped from the stale figures
* **Controls:** the docs themselves flag their own drift classes
* **Mitigation:** REC-004 adds a per-release figure refresh
* **Closure:** documented figures match measurement
* **Source:** FND-CQY-004
* **Confidence:** HIGH - direct comparison

### RSK-011: Device permission granted beyond the intended origin

* **Severity:** LOW
* **Likelihood:** LOW - packaged content is first-party only, the gap matters in dev or
  subframe scenarios
* **Residual:** NONE after origin scoping
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** the permission handler allows [MIDI](#glossary) and Sysex for any requesting frame
  without checking the requester
* **Impact:** unintended [MIDI](#glossary) access if non-local content ever loads
* **Trigger:** dev-mode [URL](#glossary) change or a future subframe
* **Controls:** default-deny for all other permissions, first-party-only content
* **Mitigation:** REC-009 scopes the grant
* **Closure:** non-matching origin receives denial
* **Source:** FND-SEC-002
* **Confidence:** HIGH - six lines of decision logic

### RSK-012: Undisclosed generated code lands without trace

* **Severity:** LOW
* **Likelihood:** LOW - cannot be measured, prompt-log practice suggests otherwise
* **Residual:** LOW after a disclosure convention
* **Status:** Open
* **Owner:** NOT SPECIFIED
* **Description:** project-level [AI](#glossary) disclosure exists, but no per-change provenance marker
  lets a later audit scope generated content
* **Impact:** limited traceability for originality verification
* **Trigger:** a generated change lands without a trailer or doc note
* **Controls:** README disclosure, prompt logs, originality policy
* **Mitigation:** REC-014 adds the convention
* **Closure:** generated changes carry disclosure markers
* **Source:** FND-AIP-001
* **Confidence:** LOW - undisclosed assistance is unmeasurable by definition

## Actionable Remediation Roadmap

| Rec     | Priority        | Finding     | Recommendation                                                                                                    | Impact | Effort | Complexity | Verification                                                                             |
|---------|-----------------|-------------|-------------------------------------------------------------------------------------------------------------------|--------|--------|------------|------------------------------------------------------------------------------------------|
| REC-001 | [P2](#glossary) | FND-CQY-001 | Close the coverage gap on synth, exports, worker, and modal paths, or ratchet the threshold to the measured value | High   | High   | Medium     | `npm run test:coverage` exits 0                                                          |
| REC-002 | [P2](#glossary) | FND-INF-001 | Add a [CI](#glossary) workflow running typecheck, lint, format check, unit tests, and build on push and PR        | High   | Medium | Low        | A pushed change produces a green run                                                     |
| REC-003 | [P2](#glossary) | FND-INF-002 | Derive the service-worker cache name from the app version and serve assets network-first                          | Medium | Low    | Low        | A redeploy ships the new bundle to warm clients                                          |
| REC-004 | [P2](#glossary) | FND-CQY-004 | Refresh stale figures in ARCHITECTURE.md and TESTING.md and add a per-release doc-refresh step                    | Medium | Low    | Low        | Documented figures match measurement                                                     |
| REC-005 | [P2](#glossary) | FND-CQY-002 | Delete or merge the stray `exportMax.test` file                                                                   | Low    | Low    | Low        | `git ls-files` no longer lists it, or it runs under a `.ts` name                         |
| REC-006 | [P3](#glossary) | FND-CQY-003 | Add a Playwright smoke suite for load, song open, playback, and one export                                        | Medium | Medium | Low        | `npx playwright test --project=chromium` passes                                          |
| REC-007 | [P3](#glossary) | FND-ARC-001 | Stage the App.tsx decomposition per the documented refactoring method                                             | High   | High   | High       | Extraction steps keep typecheck, lint, tests, and byte-identical exports green           |
| REC-008 | [P3](#glossary) | FND-SEC-001 | Add a [CSP](#glossary), hostile-fixture tests for `renderMarkdown`, and evaluate a vetted sanitizer               | High   | Medium | Low        | Injection fixtures escape correctly, [CSP](#glossary) present in built [HTML](#glossary) |
| REC-009 | [P4](#glossary) | FND-SEC-002 | Scope MIDI permission grants to the packaged or dev origin                                                        | Medium | Low    | Low        | Non-matching origin is denied                                                            |
| REC-010 | [P4](#glossary) | FND-CPR-001 | Generate a third-party notices inventory or extend the permitted-license list                                     | Medium | Medium | Low        | Inventory enumerates every resolved license class                                        |
| REC-011 | [P4](#glossary) | FND-CPR-002 | Add the [ZX0](#glossary) attribution to `docs/COPYRIGHTS.md`                                                      | Low    | Low    | Low        | Component listed with author, license, source                                            |
| REC-012 | [P4](#glossary) | FND-ARC-002 | Name a backup maintainer or fork path in the governance docs                                                      | Medium | Low    | Low        | A named continuity owner exists                                                          |
| REC-013 | [P4](#glossary) | FND-INF-003 | Publish per-release checksums, then evaluate signing and notarization                                             | Medium | Medium | Medium     | Published checksums verify downloads                                                     |
| REC-014 | [P3](#glossary) | FND-AIP-001 | Adopt a per-change AI-disclosure convention in commits or plan docs                                               | Low    | Low    | Low        | Generated changes carry disclosure markers                                               |

### REC-001: Close the coverage gap on the highest-risk paths

* **Priority:** [P2](#glossary)
* **Finding:** FND-CQY-001
* **Description:** add characterization tests for `SoundDriver` event generation, worker
  catch-up math, each export encoder's byte layout, and modal flows, or set the thresholds to
  the measured value plus a ratchet so the gate is green now and tightens over time
* **Impact:** the project's own quality gate becomes honest and the riskiest code gains a net
* **Effort:** High - five coverage areas, byte-level assertions
* **Complexity:** Medium - isolated modules, golden fixtures already exist
* **Verification:** `npm run test:coverage` exits 0

### REC-002: Add a CI workflow for the documented loop

* **Priority:** [P2](#glossary)
* **Finding:** FND-INF-001
* **Description:** create a push-and-PR workflow running `npm run typecheck`, `npm run lint`,
  `prettier --check`, `npm test`, and `npm run build`, with coverage allowed to fail until
  REC-001 closes
* **Impact:** every future change gets an enforced gate instead of relying on discipline
* **Effort:** Medium - one workflow file plus minor iteration
* **Complexity:** Low - standard [CI](#glossary) for a Node project
* **Verification:** a pushed commit produces a green pipeline run

### REC-003: Version the service-worker cache and reorder asset strategy

* **Priority:** [P2](#glossary)
* **Finding:** FND-INF-002
* **Description:** bind `CACHE_NAME` to `__APP_VERSION__` or a build hash so `activate` purges
  the old cache, and switch non-navigation requests to network-first with cache fallback, or
  emit hashed asset names for the web build while keeping deterministic names for Electron
* **Impact:** redeploys reach users reliably instead of serving stale bundles
* **Effort:** Low - a few lines in `sw.js` or a split build config
* **Complexity:** Low - self-contained worker change
* **Verification:** a redeployed build reaches a warm client without manual cache clearing

### REC-004: Refresh documented figures and add a per-release pass

* **Priority:** [P2](#glossary)
* **Finding:** FND-CQY-004
* **Description:** correct the Electron version, App.tsx size, hook count, and the stale gap
  list in `ARCHITECTURE.md` and `TESTING.md`, and add a doc-figure refresh line to the bump
  procedure
* **Impact:** planning inputs match reality
* **Effort:** Low - one editing pass plus a checklist line
* **Complexity:** Low - documentation only
* **Verification:** cited figures match measurement at the next release

### REC-005: Remove the undiscovered duplicate test file

* **Priority:** [P2](#glossary)
* **Finding:** FND-CQY-002
* **Description:** delete `test/utils/exportMax.test` or merge any unique assertions into
  `exportMax.test.ts`
* **Impact:** removes a false coverage signal
* **Effort:** Low - one deletion
* **Complexity:** Low - none
* **Verification:** `git ls-files test/` no longer lists the stray name

### REC-006: Add a Playwright smoke suite

* **Priority:** [P3](#glossary)
* **Finding:** FND-CQY-003
* **Description:** implement the documented flows (load, open a song from the repository,
  start and stop playback, trigger one export) as specs under `e2e/` and wire them into [CI](#glossary)
  after REC-002
* **Impact:** integration regressions gain an automated detector
* **Effort:** Medium - a handful of specs against jsdom-free browser flows
* **Complexity:** Low - harness is already configured
* **Verification:** `npx playwright test --project=chromium` runs green

### REC-007: Stage the orchestrator decomposition

* **Priority:** [P3](#glossary)
* **Finding:** FND-ARC-001
* **Description:** extract cohesive wiring groups ([MIDI](#glossary) chain, file operations, modal
  management) into container components or facade hooks with typed contracts, preserving the
  audio-timing exemptions and verifying byte-identical exports at each step, following the
  documented refactoring method
* **Impact:** the largest maintenance-risk file shrinks and cross-hook contracts become
  explicit
* **Effort:** High - multiple staged extractions
* **Complexity:** High - touches the composition root of the whole app
* **Verification:** typecheck, lint, unit tests, and a golden export stay green per stage

### REC-008: Harden the markdown rendering path

* **Priority:** [P3](#glossary)
* **Finding:** FND-SEC-001
* **Description:** add a restrictive [CSP](#glossary) meta tag to `index.html`, add hostile-fixture tests
  against `renderMarkdown` covering script tags, attribute injection, table cells, and code
  spans, and evaluate replacing the custom renderer with a vetted parser-plus-sanitizer
* **Impact:** the injection surface gains defense in depth and regression tests
* **Effort:** Medium - [CSP](#glossary) plus a test matrix, larger if a library swap is chosen
* **Complexity:** Low - localized to `markdown.ts` and `index.html`
* **Verification:** hostile fixtures render escaped output and `dist/index.html` carries the
  [CSP](#glossary)

### REC-009: Scope the MIDI permission grant

* **Priority:** [P4](#glossary)
* **Finding:** FND-SEC-002
* **Description:** check the requesting origin inside `setPermissionRequestHandler` and
  `setPermissionCheckHandler` so `midi` and `midiSysex` are granted only to the packaged
  `file://` content or the dev localhost [URL](#glossary)
* **Impact:** device access is bound to intended content
* **Effort:** Low - a few lines in `electron/main.cjs`
* **Complexity:** Low - single-handler change
* **Verification:** a request from a non-matching origin is denied

### REC-010: Reconcile the license policy with the resolved set

* **Priority:** [P4](#glossary)
* **Finding:** FND-CPR-001
* **Description:** either extend `docs/COPYRIGHTS.md`'s permitted list to cover the observed
  permissive classes or generate a third-party notices file at release time that records every
  resolved license
* **Impact:** license conformance becomes demonstrable rather than assumed
* **Effort:** Medium - an inventory-generation step or a policy revision plus review
* **Complexity:** Low - documentation plus one generation step
* **Verification:** the committed artifact or policy lists every resolved license class

### REC-011: Record the ZX0 attribution in the central file

* **Priority:** [P4](#glossary)
* **Finding:** FND-CPR-002
* **Description:** add the [ZX0](#glossary) component (author Einar Saukas, BSD-3-Clause, source [URL](#glossary)) to
  `docs/COPYRIGHTS.md` or a new `ATTRIBUTIONS.md`
* **Impact:** the policy's named attribution location becomes complete
* **Effort:** Low - a few lines
* **Complexity:** Low - documentation only
* **Verification:** the component appears in the attribution file

### REC-012: Name a continuity owner

* **Priority:** [P4](#glossary)
* **Finding:** FND-ARC-002
* **Description:** record a backup maintainer, organizational owner, or fork path in the
  governance documents so the single-author concentration has a documented continuation path
* **Impact:** delivery survives maintainer unavailability
* **Effort:** Low - a documented decision
* **Complexity:** Low - governance text only
* **Verification:** a named owner or path exists in `docs/` or repository settings

### REC-013: Publish release checksums, then evaluate signing

* **Priority:** [P4](#glossary)
* **Finding:** FND-INF-003
* **Description:** publish SHA-256 checksums for each distributed artifact on the download
  page, and evaluate macOS notarization and Windows signing when distribution volume justifies
  the certificate cost
* **Impact:** users gain an independent integrity check today and full signing later
* **Effort:** Medium - checksum publication is small, signing involves certificates and
  notarization plumbing
* **Complexity:** Medium - release-process change
* **Verification:** published checksums match downloaded artifacts

### REC-014: Adopt a per-change AI-disclosure convention

* **Priority:** [P3](#glossary)
* **Finding:** FND-AIP-001
* **Description:** define in `docs/GUIDELINES.md` or `CONTRIBUTING`-equivalent docs that
  substantial generated code lands with a commit trailer or a plan-doc note naming the tool,
  so later audits can scope provenance per change
* **Impact:** originality verification becomes demonstrable per change
* **Effort:** Low - a convention line plus habit
* **Complexity:** Low - documentation plus discipline
* **Verification:** new generated changes carry the marker

## Recommendation Classification

| Rec     | Recommendation                                         | Class       | Basis                                                         |
|---------|--------------------------------------------------------|-------------|---------------------------------------------------------------|
| REC-001 | Close the coverage gap on the highest-risk paths       | Recommended | The project itself mandates the gate and documents it failing |
| REC-002 | Add a [CI](#glossary) workflow for the documented loop | Recommended | Every gate is currently manual-only                           |
| REC-003 | Version the cache and reorder asset strategy           | Recommended | The staleness defect is structural and user-facing            |
| REC-004 | Refresh documented figures                             | Recommended | Sources of truth carry measured-wrong values                  |
| REC-005 | Remove the undiscovered duplicate test                 | Recommended | Dead artifact with a clear fix                                |
| REC-006 | Add a Playwright smoke suite                           | Recommended | Harness configured, project documents the intent              |
| REC-007 | Stage the orchestrator decomposition                   | Optional    | Deliberate recorded decision, beneficial but not blocking     |
| REC-008 | Harden the markdown path                               | Recommended | Injection surface without depth-of-defense controls           |
| REC-009 | Scope the [MIDI](#glossary) permission grant           | Optional    | Defense-in-depth improvement on a bounded surface             |
| REC-010 | Reconcile license policy with resolved set             | Recommended | Project policy requires demonstrable compatibility            |
| REC-011 | Record the [ZX0](#glossary) attribution centrally      | Recommended | Policy names the location, trivial cost                       |
| REC-012 | Name a continuity owner                                | Optional    | Governance improvement, not a current defect                  |
| REC-013 | Publish checksums then evaluate signing                | Optional    | Documented accepted state at current scale                    |
| REC-014 | Adopt per-change [AI](#glossary) disclosure            | Optional    | Provenance is already better than baseline                    |

## Scope Exclusions

- **Operational runtime infrastructure** - `NOT INSPECTED`.

No live server, hosting configuration, or running deployment was inspected. Hosting guidance in
`docs/DEPLOYMENT.md` was read but the live environment state is unknown.

- **Third-party hosting provider implementation** - `NOT INSPECTED`.

The dosound.alyx.pl host is treated as a static-content boundary. Its configuration was not
provided.

- **End-user devices and browser clients** - `NOT INSPECTED`.

Runtime behavior on real hardware, browsers, and [MIDI](#glossary) devices was not exercised.

- **Dynamic/runtime penetration testing** - `NOT PERFORMED` by default.

Security findings carry `Theoretical`-tier reasoning at most. A scoped live penetration test is
a separately commissioned engagement.

- **Organizational and team interviews, business-fit assessment** - `NOT PERFORMED` by
  default.

The report covers the engineering dimensions of due diligence but not interview, leadership,
or problem-fit pillars.

- **Compliance certification and attestation** - `NOT PERFORMED`.

The report is not an [ISO/IEC](#glossary) 27001 certification, a [SOC](#glossary) 2 attestation, or a PCI-DSS assessment.
Referenced standards are rubrics only.

- **API Contract Conformance section** - omitted.

The subject exposes no network [API](#glossary). The Electron preload bridge and file-format contracts are
treated as internal boundaries rather than a public [API](#glossary).

- **Skill Definition Conformance section** - omitted.

The repository contains no `SKILL.md`, `AGENTS.md`, rules directory, plugin manifest, subagent
definition, instruction file, or MCP configuration.

- **AI System Assessment section** - omitted.

The project embeds no [AI](#glossary) model or runtime. AI-assisted authorship is assessed under the
AI Provenance pillar instead.

- **API Compatibility & Versioning Discipline section** - omitted.

The subject is a deployable application, not a reusable library or package.

- **Executables under `release/` and build output under `dist/`** - `EXCLUDED BY SCOPE`.

Ignored artifacts per `.gitignore`. Presence on disk was noted but contents were not audited
as source.

- **`node_modules/` contents** - `EXCLUDED BY SCOPE`.

License cells derive from lockfile declarations only. Vendored package contents were not
inspected.

- **OWASP Top 10 coverage statement** - the assessed categories are A03 (supply chain, via
  dependency and license review), A05 (security misconfiguration, via Electron and service
  worker review), and A08 (software and data integrity, via the download and cache review).
  A01, A02, A04, A06, A07, A09, and A10 are `NOT ASSESSED` because the subject has no
  authentication, no server-side components, and no queryable surfaces.

- **Changes Since Previous Audit** - omitted. No prior Lens-format audit exists for this
  subject.

## Limitations and Unknowns

| Item                                                                       | Type        | Reason                                                  | Resolution                                   |
|----------------------------------------------------------------------------|-------------|---------------------------------------------------------|----------------------------------------------|
| `npm run typecheck`                                                        | Unrun check | Requires execution, out of audit scope                  | Run `tsc --noEmit` on the audited revision   |
| `npm run lint` and `npm run format`                                        | Unrun check | Requires execution, out of audit scope                  | Run ESLint and `prettier --check`            |
| `npm test`                                                                 | Unrun check | Requires execution, out of audit scope                  | Run the Vitest suite                         |
| `npm run test:coverage`                                                    | Unrun check | Requires execution. Documentation reports it fails      | Run Vitest with v8 coverage                  |
| `npm run test:e2e`                                                         | Unrun check | No specs exist to execute                               | Add Playwright specs, then run               |
| `npm run build`                                                            | Unrun check | Requires execution, out of audit scope                  | Run `tsc -b && vite build`                   |
| `npm run electron:build`                                                   | Unrun check | Requires packaging execution                            | Run electron-builder                         |
| `npm audit` and advisory scan                                              | Unrun check | Scanner execution is out of scope, no committed results | Run `npm audit` or commit scan output        |
| Actual code coverage percentage                                            | Unknown     | Thresholds exist but no measured value is committed     | `npm run test:coverage` output               |
| Runtime behavior (audio timing, worker scheduling, service worker caching) | Unknown     | No execution performed                                  | Manual or automated runtime verification     |
| Deployment frequency and change lead time                                  | Unknown     | No tags or release markers in git                       | Tag releases or publish release metadata     |
| Reviewer diversity                                                         | Unknown     | Pull-request review data is not in the repository       | Platform review records                      |
| Support, cost, ownership obligations                                       | Unknown     | Business inputs not supplied                            | Stakeholder-provided context                 |
| Per-change [AI](#glossary) authorship scope                                | Unknown     | No per-file provenance markers exist                    | Disclosure convention or generation manifest |
| Live specification versions of referenced standards                        | Unknown     | Offline-capable inspection only                         | Re-check at re-audit time                    |

## Re-audit And Follow-up Plan

The roadmap contains [P2](#glossary) items, so a follow-up verification pass is warranted.

| Finding     | Priority        | Verification Owner | Closure Evidence                                          | Target Re-audit Trigger            |
|-------------|-----------------|--------------------|-----------------------------------------------------------|------------------------------------|
| FND-CQY-001 | [P2](#glossary) | NOT SPECIFIED      | `npm run test:coverage` exits 0 on a recorded run         | After coverage work lands          |
| FND-INF-001 | [P2](#glossary) | NOT SPECIFIED      | A green [CI](#glossary) workflow run on a pushed change   | After the workflow merges          |
| FND-INF-002 | [P2](#glossary) | NOT SPECIFIED      | Redeploy observed serving the new bundle to a warm client | After the worker change ships      |
| FND-CQY-004 | [P2](#glossary) | NOT SPECIFIED      | Documented figures match measurement                      | Next release documentation pass    |
| FND-CQY-002 | [P2](#glossary) | NOT SPECIFIED      | Stray file absent or merged                               | Next commit touching `test/utils/` |

Sign-off gates for a future readiness decision remain tied to RSK-001 through RSK-006: all six
`MEDIUM` risks need closed or accepted-with-owner treatment states before `Production-ready`
evidence exists.

SBOM-drift trigger: a re-audit is warranted when `package.json` or `package-lock.json` changes,
to re-run the license-classification pass.

Pentest-escalation trigger: no `HIGH` or `CRITICAL` network-facing finding remains
`Theoretical`, so no penetration-test escalation is indicated at this revision. If the
markdown renderer ever accepts remote or user-supplied content, a scoped review becomes
applicable.

A re-audit should also re-derive every risk-matrix placement rather than inherit these ratings.

## Validation Record

| Check                        | Result                                      | Evidence / Justification                                                                                                                                                                                                                                                                                |
|------------------------------|---------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| PAR-1                        | Applied                                     | Security findings carry CWE-79, CWE-862, or justified `N/A` in the Security field                                                                                                                                                                                                                       |
| PAR-2                        | Applied                                     | Severity clarification line states severity derives from the impact/likelihood matrix, not [CVSS](#glossary)                                                                                                                                                                                            |
| PAR-3                        | Applied                                     | [ISO/IEC](#glossary) 25010:2023 crosswalk appears in Scoring Rubrics as a mapping with coverage gaps named                                                                                                                                                                                              |
| PAR-4                        | Applied                                     | Technical Debt Register carries separate Cost and Delay columns per [CISQ/SQALE](#glossary)                                                                                                                                                                                                             |
| PAR-5                        | Applied                                     | `git log` author census ran. Team & Continuity line reports the High rating                                                                                                                                                                                                                             |
| PAR-6                        | Applied                                     | Component inventory produced from `package.json` plus `package-lock.json` per the npm procedure                                                                                                                                                                                                         |
| PAR-7                        | Applied                                     | Limitations and Unknowns lists every unrun check and unresolved token                                                                                                                                                                                                                                   |
| PAR-8                        | Applied                                     | This table is present and complete                                                                                                                                                                                                                                                                      |
| PAR-9                        | Applied                                     | References were re-derived from the TypeScript, React, and Electron stack rows                                                                                                                                                                                                                          |
| PAR-10                       | Applied                                     | Glossary indexes every acronym used, body occurrences link via the scripted pass                                                                                                                                                                                                                        |
| PAR-11                       | Applied                                     | Coverage matrix statuses match Scope Exclusions. The three `Not done` rows have exclusion bullets                                                                                                                                                                                                       |
| PAR-12                       | Applied                                     | Every [SBOM](#sbom) row has a License cell from an inspected declaration or `Unknown`, all direct components are manifest-sourced                                                                                                                                                                       |
| PAR-13                       | Applied                                     | Every [EVD](#evd) row and every finding carries an `Observation` or `Concern` tag                                                                                                                                                                                                                       |
| PAR-14                       | [N/A](#glossary)                            | No HIGH or CRITICAL Security finding exists, so no Exploitability narrative is required                                                                                                                                                                                                                 |
| PAR-15                       | Applied                                     | Delivery Practice section present, [DORA](#dora) proxies marked `NOT SPECIFIED` with reasons, bus-factor rating given                                                                                                                                                                                   |
| PAR-16                       | [N/A](#glossary)                            | Report language is English, no translation applies                                                                                                                                                                                                                                                      |
| PAR-17                       | [N/A](#glossary)                            | The subject holds no `SKILL.md` or agent-facing artifacts, recorded in Scope Exclusions                                                                                                                                                                                                                 |
| PAR-18                       | Applied                                     | Recommendation Classification lists every `REC-001` through `REC-014` exactly once with a valid class                                                                                                                                                                                                   |
| FND/RSK/REC cross-references | PASS                                        | Every `RSK` and `REC` row cites a defined `FND` identifier                                                                                                                                                                                                                                              |
| Register counts              | PASS                                        | 14 findings, 5 debt items, 12 risks, 14 recommendations reconcile across summary and detail blocks                                                                                                                                                                                                      |
| Conditional sections         | PASS                                        | Data Flow Diagram, Design Patterns, [ADR](#glossary) table, Threat Model, and Standards Conformance included. The four inapplicable conditionals are justified in Scope Exclusions                                                                                                                      |
| Formatting rules             | PASS                                        | Headings at most `###`, one blank line after headings, no semicolons outside code, ASCII-only prose punctuation, tables mechanically formatted                                                                                                                                                          |
| Parity baseline              | lens-skill `work/AUDIT-1.1.md` revision 1.1 | Capability diff: this report adds Technical Debt Register (debt exists here), Recommendation Classification fields per current spec, and omits Changes Since Previous Audit (first audit) and Skill Definition Conformance (no agent artifacts). The baseline predates the current finding-field schema |

## References

| Reference                                           | Publisher or Author      | Used In                                 |
|-----------------------------------------------------|--------------------------|-----------------------------------------|
| TypeScript Handbook and TSConfig reference          | Microsoft                | Standards Conformance, stack assessment |
| React documentation and Rules of Hooks              | React team               | Stack assessment, Design Principles     |
| Electron documentation and security guidance        | OpenJS Foundation        | Electron boundary review, Threat Model  |
| npm SemVer documentation                            | npm                      | Versioning-practice context             |
| OWASP Top 10 (2025)                                 | [OWASP](#glossary)       | Scope Exclusions coverage statement     |
| [CWE](#cwe) and MITRE root-cause mapping guidance   | MITRE                    | Security finding classification         |
| FIRST CVSS v4.0 documentation                       | FIRST                    | Severity-metric separation note         |
| NIST SP 800-30                                      | [NIST](#glossary)        | Unified Risk Register method            |
| [STRIDE](#stride) threat model                      | Microsoft                | Threat Model enumeration                |
| [ISO/IEC](#glossary) 25010:2023                     | [ISO](#glossary)         | Scorecard crosswalk mapping             |
| [ISO](#glossary) 19011                              | [ISO](#glossary)         | Re-audit plan method                    |
| NIST Risk Management Framework monitor step         | [NIST](#glossary)        | Re-audit plan method                    |
| [DORA](#dora) metric definitions                    | [DORA](#dora) (dora.dev) | Delivery Practice proxies               |
| [CISQ/SQALE](#glossary) technical-debt cost model   | [CISQ](#glossary)        | Technical Debt Register cost separation |
| CISA SBOM Minimum Elements (2026)                   | CISA                     | [SBOM](#sbom) completeness touchstone   |
| eslint-plugin-security and no-unsanitized rule maps | ESLint community         | Analyzer cross-reference for CWE-79     |
| Agent Skills audit taxonomy corpus                  | Lens skill `references/` | Audit Type Coverage & Assurance Matrix  |

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) and
  [TSConfig reference](https://www.typescriptlang.org/tsconfig), consulted for strict-mode and
  compiler-option conformance, accessed 2026-09-30.
- [React Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks), consulted for the
  hook-exemption assessment context, accessed 2026-09-30.
- [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security),
  consulted for context isolation, sandbox, [CSP](#glossary), and permission-handler review, accessed
  2026-09-30.
- [npm SemVer documentation](https://docs.npmjs.com/about-semantic-versioning), consulted for
  versioning-scheme comparison, accessed 2026-09-30.
- [OWASP Top 10](https://owasp.org/Top10/), used as the coverage-statement taxonomy, accessed
  2026-09-30.
- [MITRE CWE](https://cwe.mitre.org/), used for CWE-79 and CWE-862 classification, accessed
  2026-09-30.
- [FIRST CVSS v4.0 user guide](https://www.first.org/cvss/v4.0/user-guide), consulted to keep
  vulnerability scoring separate from the Lens risk matrix, accessed 2026-09-30.
- NIST SP 800-30 risk-assessment process, applied to the risk register structure.
- [STRIDE](#stride) per Microsoft threat-modeling practice, applied to the trust-boundary enumeration.
- [ISO/IEC](#glossary) 25010:2023 product-quality characteristics, applied as the scorecard crosswalk only.
- [ISO](#glossary) 19011 audit follow-up practice and the NIST RMF monitor step, applied to the re-audit
  plan.
- [DORA](#dora) delivery metrics per dora.dev, applied as delivery-practice proxies.
- [CISQ/SQALE](#glossary) cost-of-quality model, applied to the debt register's cost-versus-delay split.
- CISA 2026 Minimum Elements for a Software Bill of Materials, used as the completeness
  touchstone for the license-coverage gap.
- [eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security) and
  `eslint-plugin-no-unsanitized`, named as the equivalent automated checks for CWE-79 that are
  not yet enabled in the project's ESLint config.

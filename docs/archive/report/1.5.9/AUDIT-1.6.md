# DOSOUND Tracker Audit Report

## Document Information

|                    |                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Report Revision    | 1.6                                                                                                                         |
| Report Date        | 2026-11-12                                                                                                                  |
| Report Style       | Audit                                                                                                                       |
| Detail Level       | Detailed                                                                                                                    |
| Evaluation Scale   | 1-10                                                                                                                        |
| Audit Purpose      | Engineering improvement and release readiness assessment                                                                    |
| Target Environment | Development host: macOS arm64, Node v26.13.0, [npm](#glossary-index) 11.20.0, Node v26.13.0, [npm](#glossary-index) 11.20.0 |
| Verification Scope | Static repository analysis plus commissioned commands in isolation                                                          |
| Evidence Mode      | Executed commands                                                                                                           |
| Subject Revision   | Commit cef0d4259e00c2ae1e6d6f85847164ca1608223a (branch main)                                                               |
| Language           | English                                                                                                                     |
| Previous Report    | Path docs/report/1.4.5/AUDIT-1.5.md (revision floor only)                                                                   |
| Skill Version      | 2.8.8                                                                                                                       |
| Time taken         | 0:28                                                                                                                        |

## Contents

- [Audit Coverage](#audit-coverage)
- [Executive Summary](#executive-summary)
- [System Context](#system-context)
- [Software Bill of Materials](#software-bill-of-materials)
- [License Compliance](#license-compliance)
- [Health Dashboard](#health-dashboard)
- [Delivery Practice](#delivery-practice)
- [High-Level Observations](#high-level-observations)
- [Auditing Methodology](#auditing-methodology)
- [Scoring Rubrics](#scoring-rubrics)
- [Architectural Assessment](#architectural-assessment)
- [Structure Review](#structure-review)
- [Solution Comparison](#solution-comparison)
- [Threat Model](#threat-model)
- [Guidance Conformance](#guidance-conformance)
- [Standards Conformance](#standards-conformance)
- [Requirements Conformance](#requirements-conformance)
- [Baseline Conformance](#baseline-conformance)
- [Structure Conformance](#structure-conformance)
- [Code Style](#code-style)
- [Strengths and What's Working](#strengths-and-whats-working)
- [Technical Findings](#technical-findings)
- [Technical Debt Register](#technical-debt-register)
- [Unified Risk Register](#unified-risk-register)
- [Scope Exclusions](#scope-exclusions)
- [Known Limitations](#known-limitations)
- [Executed Evidence](#executed-evidence)
- [Evidence List](#evidence-list)
- [Validation Protocol](#validation-protocol)
- [Remediation Roadmap](#remediation-roadmap)
- [Reference Sources](#reference-sources)

## Audit Coverage

| Report type               | Status   | Rationale                                                       |
| ------------------------- | -------- | --------------------------------------------------------------- |
| Structural inventory      | Covered  | 1,215 tracked files inventoried and classified                  |
| Requirements conformance  | Covered  | 33 mandatory requirements extracted and graded                  |
| Criteria assessment       | Covered  | 99 fixed-catalogue criteria graded on evidence                  |
| Commissioned commands     | Covered  | Loop (typecheck, lint, format, test, build) plus e2e, all green |
| Dependency advisories     | Not done | Sweep not commissioned, DEP-ADVISORY UNKNOWN                    |
| Coverage measurement      | Not done | No coverage run commissioned, N-06 PARTIAL                      |
| Packaged Electron runtime | Not done | e2e exercises the browser bundle only                           |

## Glossary Index

| Term  | Definition                                                                   |
| ----- | ---------------------------------------------------------------------------- |
| API   | Application Programming Interface - the typed `ElectronApi` preload contract |
| ASM   | Assembly - the DOSOUND ASM export format for YM2149 register dumps           |
| BSD   | Berkeley Software Distribution - permissive license family in the census     |
| CC-BY | Creative Commons Attribution - license on one bundled asset                  |
| CC0   | Creative Commons Zero - public-domain dedication on one bundled asset        |
| CI/CD | Continuous Integration and Delivery - automated verification pipelines       |
| CPU   | Central Processing Unit - audio-thread budget unit                           |
| CSP   | Content Security Policy - browser-layer resource-origin restrictions         |
| CWE   | Common Weakness Enumeration - the finding-classification taxonomy used       |
| DSP   | Digital Signal Processing - the Ayumi sound-generation path                  |
| E2E   | End to End - the Playwright suite exercising real browser flows              |
| GPL   | GNU General Public License - copyleft license family, absent here            |
| IPC   | Inter-Process Communication - Electron main-renderer messaging               |
| ISC   | Internet Systems Consortium - permissive license in the census               |
| LAN   | Local Area Network - the dev-server binding exposure                         |
| MIDI  | Musical Instrument Digital Interface - live input and export format          |
| MIT   | Massachusetts Institute of Technology license - dominant census license      |
| MOD   | ProTracker module - the tracker-song export format                           |
| MPL   | Mozilla Public License - lightningcss binary license                         |
| npm   | Node Package Manager - dependency and script tooling                         |
| OS    | Operating System - desktop shell platform layer                              |
| PSF   | Python Software Foundation license - one dependency in the census            |
| PSG   | Programmable Sound Generator - the YM2149 chip family emulated               |
| RPO   | Recovery Point Objective - tolerable data loss measured as time              |
| RTO   | Recovery Time Objective - tolerable service-restore time                     |
| SBOM  | Software Bill of Materials - the dependency inventory section                |
| SLO   | Service Level Objective - measurable service-quality target                  |
| SPA   | Single Page Application - the frontend architecture shape                    |
| UFL   | Ubuntu Font License - bundled font license                                   |
| UI    | User Interface - the React component layer                                   |
| URL   | Uniform Resource Locator - repository-fetch and external-link targets        |
| VGM   | Video Game Music - chiptune register-log export format                       |
| WAV   | Waveform Audio - the rendered-audio export format                            |
| WTFPL | Do What You Want Public License - permissive license in the census           |
| YAML  | Yet Another Markup Language - song-file and config format                    |
| ZX0   | ZX0 compressor - ported compression routine with attribution                 |

**Identifier triplets**

| Triplet | Scope     | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| FND     | Findings  | Technical Findings identifier prefix (`FND-SEC-001`)    |
| EVD     | Evidence  | Evidence List identifier prefix (`EVD-001`)             |
| TDR     | Debt      | Technical Debt Register identifier prefix (`TDR-001`)   |
| RSK     | Risks     | Unified Risk Register identifier prefix (`RSK-001`)     |
| REC     | Roadmap   | Remediation Roadmap identifier prefix (`REC-001`)       |
| PAR     | Checklist | Protocol Audit Requirement identifier prefix (`PAR-1`)  |
| ARC     | Criteria  | Design-soundness criteria and `FND-ARC-NNN` findings    |
| CMP     | Criteria  | API-compatibility criteria                              |
| COM     | Criteria  | Compliance criteria                                     |
| CPR     | Criteria  | Originality and licensing criteria                      |
| CQY     | Criteria  | Code-quality criteria and `FND-CQY-NNN` findings        |
| DEP     | Criteria  | Dependency-health criteria                              |
| DLY     | Criteria  | Delivery-continuity criteria                            |
| DOC     | Criteria  | Documentation criteria                                  |
| FNC     | Criteria  | Functional-suitability criteria                         |
| MNT     | Criteria  | Maintainability criteria                                |
| OBS     | Criteria  | Observability criteria                                  |
| OPS     | Criteria  | Operational-safety criteria                             |
| PRF     | Criteria  | Scalability measurement criteria                        |
| REL     | Criteria  | Operational-safety reliability criteria                 |
| SCA     | Criteria  | Scalability target criteria                             |
| SEC     | Criteria  | Security criteria and `FND-SEC-NNN` findings            |
| SKL     | Criteria  | Skill-definition criteria                               |
| STK     | Criteria  | Stack-alignment criteria                                |
| STR     | Criteria  | Structure criteria and `FND-STR-NNN` findings           |
| STY     | Criteria  | Code-style criteria                                     |
| TST     | Criteria  | Testability criteria                                    |
| INF     | Pillar    | Infrastructure and CI/CD finding pillar (`FND-INF-NNN`) |

## Executive Summary

| Field             | Value                                              |
| ----------------- | -------------------------------------------------- |
| System type       | Production system (desktop chiptune tracker)       |
| Scope             | Whole repository at cef0d425, version window 1.5.9 |
| Source basis      | Inspected code plus executed commissioned commands |
| Maturity level    | Production-ready                                   |
| **Overall score** | **8.8/10 (Excellent)**                             |

| Score               | Value              | Basis                                          |
| ------------------- | ------------------ | ---------------------------------------------- |
| Product Quality     | 8.7/10 (Excellent) | tier-weighted mean of 17 applicable dimensions |
| Engineering Process | 9.0/10 (Excellent) | mean of 2 applicable process dimensions        |

The overall score blends product quality (0.7) and engineering process (0.3).
Lowest-scoring applicable dimensions: code_quality, deployability, scalability, security,
operational_safety, functional_suitability, delivery_continuity at 8/10.

DOSOUND Tracker is a three-track YM2149 chiptune tracker shipped as a Vite/React
[SPA](#glossary-index) and an
Electron desktop shell. This fresh audit inspected the full 1,215-file tree and executed the
commissioned loop (typecheck, lint, format-check, build, 1334 unit tests) plus the Playwright e2e
suite (30 tests) in an isolated copy. Every check passed on the first complete-copy run.

The codebase is disciplined: strict TypeScript with zero explicit `any`, enforced lint and format
gates, a mirrored test layout, a documented architecture, and strong Electron baseline isolation.
Fifteen open findings were recorded - none Critical or High. The two material items are an
unbounded instrument-import path that deviates from the project's own import-size convention, and
duplicated audio semantics between the live engine and the export simulation that can drift
exported output away from what the editor plays.

**Production Readiness Threshold.** READY. No CRITICAL or HIGH findings are open, [RSK-001](#rsk-001-export-vs-live-audio-divergence)
(live-vs-sim drift) and [RSK-003](#rsk-003-single-maintainer-continuity-loss)
(single-author continuity) are the conditions the next window should
attack. The single material UNKNOWN (DEP-ADVISORY) is an uncommissioned sweep carried as roadmap
item [REC-009](#rec-009-commission-advisory-sweep-and-optional-ci), not a release blocker.
Release can proceed, the P1/P2 roadmap items should land inside
the 1.5.9 window or the following one.

## System Context

DOSOUND Tracker is a single-project repository - a three-track chiptune tracker for the Yamaha
YM2149 PSG. It ships as a Vite-built React 19 single-page application (PWA) and as an Electron 45
desktop shell. Songs are authored in a pattern editor, persisted to [YAML](#glossary-index)
through js-yaml, played
Songs play through two engines behind `SoundEngine` (WebAudio YM2149, Ayumiine and an Ayumi DSP worklet),
and exported to nine formats including DOSOUND ASM, [VGM](#glossary-index),
[MOD](#glossary-index), [MIDI](#glossary-index), and [WAV](#glossary-index).

### Technology Stack

| Layer                        | Technology                    | Version                 |
| ---------------------------- | ----------------------------- | ----------------------- |
| Language                     | TypeScript (strict)           | 5.9.3                   |
| [UI](#glossary-index)        | React, React DOM              | 19.3.1                  |
| State                        | Zustand                       | 5.0.16                  |
| Build                        | Vite                          | 8.3.7                   |
| Desktop                      | Electron                      | 45.2.3                  |
| Unit tests                   | Vitest + jsdom                | 5.1.0                   |
| [E2E](#glossary-index) tests | Playwright                    | 1.65.0                  |
| Lint/format                  | ESLint / Prettier             | 10.14.0 / 3.9.10        |
| Serialization                | js-yaml                       | 5.5.0                   |
| Runtime floor                | Node / [npm](#glossary-index) | 26.13.0 / engine-strict |

## Software Bill of Materials

Production dependencies (5):

| Component | Version      | License                | Risk | Advisory    | Source            |
| --------- | ------------ | ---------------------- | ---- | ----------- | ----------------- |
| js-yaml   | 5.5.0        | [MIT](#glossary-index) | None | Not checked | package-lock.json |
| react     | 19.3.1       | [MIT](#glossary-index) | None | Not checked | package-lock.json |
| react-dom | 19.3.1       | [MIT](#glossary-index) | None | Not checked | package-lock.json |
| yaml      | (transitive) | [ISC](#glossary-index) | None | Not checked | package-lock.json |
| zustand   | 5.0.16       | [MIT](#glossary-index) | None | Not checked | package-lock.json |

Development dependencies (25): vite 8.3.7, typescript 5.9.3, vitest 5.1.0, playwright 1.65.0,
electron 45.2.3, eslint 10.14.0, prettier 3.9.10, electron-builder, lightningcss, and supporting
type/test packages - 570 packages total in the resolved tree, all exactly pinned by
package-lock.json v3.

Advisory status: no vulnerability sweep was commissioned. All resolved licenses are compatible with
[MIT](#glossary-index) distribution ([EVD-015](#evidence-list)).

## License Compliance

The project is MIT-licensed, LICENSE lists Zoltar X / New Generation while package.json
lists Filip G. as author, a benign mismatch.
The dependency license census is fully compatible: [MIT](#glossary-index) 423,
[ISC](#glossary-index) 42,
MPL-2.0 12, all lightningcss platform binaries, dev-only and matching the
upstream license declaration, plus single-instance MIT-0, PSF-2.0, Python-2.0,
CC-BY-4.0, CC0-1.0, [WTFPL](#glossary-index) variants, and 0BSD.
Ported code carries attribution headers
(ayumiCore.ts [MIT](#glossary-index) port of Ayumi, zx0.ts BSD-3 [ZX0](#glossary-index) port).
Bundled assets carry their licenses (Ubuntu font [UFL](#glossary-index).txt, SVG Repo markers), no
GPL-family obligations exist.

## Health Dashboard

**Risk Map**

| Impact            | Low                                                  | Medium                                                                                                                                                               | High                                                                                                       |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Likelihood High   | -                                                    | -                                                                                                                                                                    | -                                                                                                          |
| Likelihood Medium | [RSK-005](#rsk-005-stale-documentation-misdirection) | [RSK-004](#rsk-004-composition-root-change-blast-radius), [RSK-006](#rsk-006-unmeasured-performance-regressions), [RSK-008](#rsk-008-silent-release-script-failure)* | [RSK-001](#rsk-001-export-vs-live-audio-divergence), [RSK-003](#rsk-003-single-maintainer-continuity-loss) |
| Likelihood Low    | [RSK-002](#rsk-002-unbounded-instrument-file-parse)* | [RSK-007](#rsk-007-unautomated-verification-gate)                                                                                                                    | -                                                                                                          |

- [RSK-002](#rsk-002-unbounded-instrument-file-parse) sits at likelihood Low, impact Medium.
- [RSK-008](#rsk-008-silent-release-script-failure) is recorded Low/Low.

**Legend**

| Band      | Score |
| --------- | ----- |
| Poor      | 1-3   |
| Average   | 4-6   |
| Good      | 7-8   |
| Excellent | 9-10  |

**Scorecard Summary**

| Dimension               | Score |
| ----------------------- | ----- |
| Functional Suitability  | 8/10  |
| Testability             | 9/10  |
| Design Soundness        | 9/10  |
| Code Quality            | 8/10  |
| Code Style              | 10/10 |
| Stack Alignment         | 10/10 |
| Dependency Health       | 8/10  |
| Maintainability         | 9/10  |
| Structure               | 10/10 |
| Deployability           | 8/10  |
| Scalability             | 8/10  |
| Security                | 8/10  |
| Compliance              | 10/10 |
| Observability           | 10/10 |
| Operational Safety      | 8/10  |
| Documentation           | 9/10  |
| Delivery & Continuity   | 8/10  |
| Originality & Licensing | 10/10 |

Dependency Health carries a material-unknown cap (DEP-ADVISORY unassessed): uncapped 10, published 8.

**Team & Continuity**

802 commits by a single author ([EVD-014](#evidence-list)). No tags, version state lives in commits
and the changelog by documented convention. Continuity risk is the subject's largest structural
exposure ([FND-INF-005](#fnd-inf-005-single-author-delivery), [RSK-003](#rsk-003-single-maintainer-continuity-loss)).

## Delivery Practice

Delivery follows a versioned-window convention recorded in `docs/GUIDELINES.md`: sequential version
numbers, ASE change records, contiguous window reviews (1.4.0 through 1.5.8 observed),
`bump-version.mjs` mechanics, `release-check.sh` as the release gate, and `public/CHANGELOG.md`
updated at window close. HEAD is the Version-1.5.8 close commit, package.json carries 1.5.9 - the
current window is in flight, consistent with the changelog topping at 1.5.8.

Release artifacts are produced by electron-builder with checksums and distributed manually.
Binaries are unsigned - a documented posture, not an oversight. There is no in-tree CI, an archived
change record (`docs/archive/change/1.3.0/add-ci-workflow.md`) records automation as a deliberate
decision, and the local loop plus release-check.sh stands in as the manual gate
([FND-INF-003](#fnd-inf-003-no-automated-gate-on-change)). Three release-script defects were
confirmed
([FND-INF-001](#fnd-inf-001-release-scripts-swallowed-failure-rollover-defect-orphaned-helper)):
bump-version.mjs swallows failures with exit 0, release-check.sh mishandles patch-0 rollovers, and
an unreferenced sync-branches.sh force-pushes all branches.

## High-Level Observations

| Observation                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All six commissioned commands pass green in isolation - typecheck, lint, format-check, build, 1334 unit tests, 30 e2e tests (see Evidence List rows [EVD-002](#evidence-list) through [EVD-007](#evidence-list)).           |
| Electron baseline isolation is strong: contextIsolation, nodeIntegration disabled, origin-gated permissions, [CSP](#glossary-index) on build ([EVD-008](#evidence-list)).                                                   |
| The audio-critical path duplicates instrument/envelope semantics between live playback and export simulation with observable deltas ([FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths)). |
| One of six import paths skips the project's own size bound ([FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)).                                                                                |
| Composition root concentrates ~40 hooks and a ~100-prop modal params object ([FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)).                                                         |
| Documentation is extensive (756 files) with a small confirmed drift cluster ([FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)).                                                                                      |
| Dependency surface is minimal, exactly pinned, and license-clean ([EVD-015](#evidence-list), [EVD-016](#evidence-list)).                                                                                                    |
| Single-author delivery is the largest continuity exposure ([FND-INF-005](#fnd-inf-005-single-author-delivery)).                                                                                                             |

## Auditing Methodology

This audit ran under the Lens skill (development + improvement + verbose modes) as a fresh audit:
prior report AUDIT-1.5 established the revision floor only, no prior content was reused. Evidence
Evidence gathering combined the full inventory, five read-only scouts - file inventory,
architecture, context, security trace, delivery - targeted parent counter-checks of
scout claims, mechanical censuses (secrets, TODO/FIXME, explicit any, dead code, licenses, test placement),
a requirements registry frozen from docs/PROJECT.md, and the commissioned command set
run in an isolated ditto copy.

The fixed catalogue holds 99 criteria across 20 dimensions under scoring policy 3, 17 dimensions
are applicable and scored. The score channel grades each criterion on declared anchors
(PASS/P75/P50/P25/FAIL), findings bound mastery by severity. The table below lists every criterion
not scored PASS, with its outcome.

**Criteria table**

| Criteria      | Dimension              | Weight | Criticality | Outcome |
| ------------- | ---------------------- | ------ | ----------- | ------- |
| FNC-JOURNEY   | functional_suitability | 2      | high        | PARTIAL |
| FNC-DEFECT    | functional_suitability | 2      | high        | PARTIAL |
| FNC-CONTRACT  | functional_suitability | 1      | medium      | PARTIAL |
| TST-WFLOW     | testability            | 2      | high        | PASS    |
| TST-GATE      | testability            | 2      | medium      | PARTIAL |
| ARC-COUPLING  | design_soundness       | 2      | medium      | PARTIAL |
| ARC-DRY       | design_soundness       | 2      | medium      | PARTIAL |
| CQY-COMPLEX   | code_quality           | 2      | medium      | PARTIAL |
| CQY-DUP       | code_quality           | 2      | high        | PARTIAL |
| STY-READ      | code_style             | 1      | low         | PARTIAL |
| STK-ANTIPAT   | stack_alignment        | 1      | low         | PARTIAL |
| DEP-ADVISORY  | dependency_health      | 2      | high        | UNKNOWN |
| MNT-DEBT      | maintainability        | 2      | medium      | PARTIAL |
| STR-PLACEMENT | structure              | 2      | medium      | PARTIAL |
| DEP-DEFAULTS  | deployability          | 2      | high        | PARTIAL |
| DEP-PIPELINE  | deployability          | 2      | high        | PARTIAL |
| DEP-RELEASE   | deployability          | 2      | high        | PARTIAL |
| SCA-BOUNDS    | scalability            | 2      | high        | PARTIAL |
| PRF-MEASURE   | scalability            | 1      | medium      | PARTIAL |
| SEC-INPUT     | security               | 2      | high        | PARTIAL |
| SEC-THREAT    | security               | 2      | high        | PARTIAL |
| OPS-RETRY     | operational_safety     | 2      | high        | PARTIAL |
| OPS-REVERT    | operational_safety     | 2      | high        | PARTIAL |
| DOC-SYNC      | documentation          | 2      | high        | PARTIAL |
| DOC-ARCH      | documentation          | 2      | medium      | PARTIAL |
| DLY-BUSFACTOR | delivery_continuity    | 3      | high        | PARTIAL |

All other criteria: PASS. NOT_APPLICABLE with deployment-model basis: SEC-SESS, SEC-ABUSE,
COM-RIGHTS, COM-AUDIT, COM-CONSENT, OBS-METRIC, OBS-TRACE, OBS-ALERT, CMP-SURFACE, CMP-GATE,
CMP-VERSION, CMP-DEPREC, CMP-DRIFT, SKL-FRONT, SKL-DISC, SKL-CFG, SKL-GUIDE, SKL-SEC, SKL-COLL.

## Scoring Rubrics

Scores derive mechanically from the canonical model: criterion mastery from declared level anchors
(PASS=1.0, P75=0.75, P50=0.5, P25=0.25, FAIL=0), dimension mastery from weighted means with
evidence-backed substitution intervals, and open bounding findings capping mastery at 0.25 (HIGH),
0.5 (MEDIUM), or 0.75 (LOW). Product quality is the tier-weighted mean of applicable dimensions,
engineering process is the mean of process dimensions, the single score blends 0.7/0.3. Caps
applied: dependency_health material-unknown cap (8/10 ceiling) because DEP-ADVISORY is UNKNOWN. All
arithmetic was reproduced by `check-model.py --fix` ([PAR-08](#validation-protocol)).

## Architectural Assessment

The architecture is deliberately layered and matches its documented model (docs/ARCHITECTURE.md): a
React composition root wires domain-grouped hooks, pure transform modules under `src/utils/` and
`src/synth/` carry logic, two sound engines sit behind a `SoundEngine` contract with a
`createSoundEngine` factory, export formats hide behind a lazily imported barrel, Electron
main/preload forms a thin, permission-gated shell.

### Design Principles

- Separation of concerns: hooks orchestrate, utils transform, engines render audio. Verified
  against module roles ([EVD-017](#evidence-list), [EVD-031](#evidence-list)).
- Dependency direction: inward toward pure modules, with one noted type-only inversion -
  `src/utils/midi/midiConfiguration.ts` imports from `hooks/midi/useMidi.ts`.
- Interface boundaries: `SoundEngine` (soundEngine.ts:31-39) and the typed `ElectronApi` preload
  surface are narrow and explicit.
- State domains: Zustand stores plus hook-local state, persistence is centralized in
  `utils/storage/` with a documented exception list (one drift - InformationPanel, [FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)).
- Patterns: factory (engines), strategy (export strategies), adapter/facade
  (AyumiEngine and RegisterFile), undo memento, playback/edit bridges, and the
  stereo, engine, and period registries. Apt, not decorative
  ([EVD-031](#evidence-list)).

### Data Flow Diagram

User input enters through keyboard/MIDI and file pickers. File data crosses the main trust boundary
at [YAML](#glossary-index) import: song, settings, [MIDI](#glossary-index) configuration, and
clipboard paths enforce `assertImportSize`
against `MAX_IMPORT_BYTES` before `yaml.load`, the instrument-file path does not
([FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)). Repository
listing fetches compose [URLs](#glossary-index) via `buildHref` from LIST.txt content
([FND-SEC-004](#fnd-sec-004-buildhref-accepts--segments-in-listing-paths)). Audio ticks flow
main-thread worklet -> sequencer -> `useSequencerIntegration` -> `SoundEngine` -> register writes,
export ticks flow through `playbackSimulation`, the duplicated semantics path
([FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths)). Persistence
flows to localStorage plus an IndexedDB mirror (F-16), cleared by reset flows
([EVD-013](#evidence-list)). Electron privileges stay behind `contextBridge` with a 32-line typed
surface.

### Design Patterns

The pattern census is healthy and non-performative: the engine factory isolates WebAudio-vs-DSP
selection, the export strategy set (simple/complex/tight) parameterizes one emitter, the lazy
export barrel keeps format modules out of the initial chunk path (8 dynamic import sites in useExportOperations.ts),
branded types (InstrumentId, PatternId, PlaylistPatternId) prevent ID
confusion at compile time, the close-guard handshake is a small, correct protocol between main and
renderer. The one pattern-level weakness is structural duplication: live and simulation paths
implement the same audio semantics independently instead of sharing a module.

## Structure Review

React 19 + TypeScript strict single project, Vite-built, ~210 source files (~37.2k lines), Electron
shell, mirrored test tree.

| Level | Directory    | Contents                                                                            | Role                  |
| ----- | ------------ | ----------------------------------------------------------------------------------- | --------------------- |
| 1     | `src/`       | components, hooks, modals, synth, exports, utils, constants, types, workers, assets | Application source    |
| 1     | `electron/`  | main.cjs, preload.cjs, permissions.cjs                                              | Desktop shell         |
| 1     | `test/`      | mirrors src layout + fixtures                                                       | Unit/component suite  |
| 1     | `e2e/`       | smoke.spec.ts, helpers.ts                                                           | Playwright suite      |
| 1     | `scripts/`   | build/version/release helpers                                                       | Delivery automation   |
| 1     | `docs/`      | ASE records, manuals, specs                                                         | Documentation corpus  |
| 1     | `public/`    | bundled docs, fonts, repository [YAML](#glossary-index), worker.js                  | Shipped static assets |
| 2     | `src/hooks/` | 12 domain subdirs, 62 files                                                         | Orchestration layer   |
| 2     | `src/utils/` | 22 domain subdirs, 61 files                                                         | Pure transforms       |

| Area                       | Verdict   | Basis                                                                                     |
| -------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| Directory organization     | Passed    | Domain-grouped, mirrors docs, test tree mirrors src                                       |
| Naming conventions         | Passed    | use* hooks, PascalCase components, domain directories                                     |
| Component placement        | Passed    | Single-level feature placement, anomalies limited to test tree                            |
| Supporting-artifact layout | Passed    | fixtures/, e2e/, scripts/, docs/ cleanly separated                                        |
| Consistency                | Partially | Four test-placement anomalies ([FND-STR-001](#fnd-str-001-test-tree-placement-anomalies)) |

Positive practices: the no-loose-files convention holds, every module traces to a live importer,
the modal layer, engine factory, and export barrel register cleanly.

Limitations: docs/archive and docs/report restricted surfaces were inventoried by filename only.

## Solution Comparison

Two design alternatives were implicit in the observed trade-offs:

- Live-vs-sim duplication vs shared semantics module: the project chose independent
  implementations so export stays deterministic and engine-free, trading drift
  risk - observed deltas,
  [FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths) -
  for decoupling the export path from AudioContext. A shared pure module with
  thin adapters would keep determinism without duplication, golden live-vs-sim
  conformance tests are the lower-cost alternative.
- Composition root vs domain composition units: the single-root wiring keeps the dataflow legible
  in one file but concentrates change risk
  ([FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)). Splitting
  by domain (playback cluster, file-ops cluster, modal cluster) would bound blast radius at the cost
  of one more indirection layer.
- No-CI vs automated gate: a deliberate, recorded choice favoring a single-maintainer workflow, the
  local loop plus release-check.sh compensates but cannot fire on merge
  ([FND-INF-003](#fnd-inf-003-no-automated-gate-on-change)).

## Threat Model

Boundaries assessed: Electron main/renderer, [YAML](#glossary-index) file imports, repository
listing fetches,
clipboard, [MIDI](#glossary-index) devices, service worker cache, external links.

- Spoofing: no identity surface, app-origin checks gate permissions and navigation
  (main.cjs:25-48). No material threat.
- Tampering: will-navigate blocks off-origin navigation, will-redirect is unhandled
  ([FND-SEC-003](#fnd-sec-003-no-will-redirect-guard-http-urls-reach-openexternal)), LIST.txt-derived
  hrefs accept parent-directory segments
  ([FND-SEC-004](#fnd-sec-004-buildhref-accepts--segments-in-listing-paths)). Bounded: fetch targets
  are first-party assets.
- Repudiation: no audit-trail obligation for a local single-user app. No material threat.
- Information disclosure: no secrets in the tree ([EVD-011](#evidence-list)), persistence holds
  only user song/settings data, [CSP](#glossary-index) injected on build. No material threat.
- Denial of service: unbounded instrument-file parse can hang the renderer
  ([FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)), all other import
  paths are bounded.
- Elevation of privilege: contextIsolation + nodeIntegration off + origin-gated permissions +
  narrow preload, sandbox flag unset
  ([FND-SEC-002](#fnd-sec-002-browserwindow-sandbox-flag-not-set)), http [URLs](#glossary-index)
  reach openExternal
  ([FND-SEC-003](#fnd-sec-003-no-will-redirect-guard-http-urls-reach-openexternal)),
  app-close-confirmed [IPC](#glossary-index) is unconditionally callable.

## Guidance Conformance

The project ships agent guidance. README routes to `docs/GUIDELINES.md`, which declares
specific, and internally consistent except one item: the allowed-licenses list
a sources-of-truth table, workflow rules, and version conventions. It is current and
is narrower than the actual dependency licenses recorded in COPYRIGHTS.md
([FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)).

| Document           | Status  | Basis                                                                                 |
| ------------------ | ------- | ------------------------------------------------------------------------------------- |
| docs/GUIDELINES.md | Pass    | Current, specific, sources-of-truth table                                             |
| README.md routing  | Pass    | Agents routed to canonical guidance                                                   |
| License list       | Partial | Narrower than COPYRIGHTS.md ([FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)) |

Conformance: strong.

## Standards Conformance

Declared conventions: strict TypeScript, ESLint flat config, Prettier, Vitest 80% coverage
thresholds, the verification loop, ASE change records, work/ scratch convention, no-version-bump
rule. Executed evidence confirms typecheck, lint, and format gates pass clean, test placement
anomalies ([FND-STR-001](#fnd-str-001-test-tree-placement-anomalies)) and the unrun coverage
threshold ([FND-INF-006](#fnd-inf-006-coverage-thresholds-configured-but-never-run)) are the only
deviations observed.

| Standard           | Status  | Basis                                                                                            |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------ |
| Typecheck gate     | Pass    | Executed clean ([EVD-002](#evidence-list))                                                       |
| Lint gate          | Pass    | Executed clean ([EVD-003](#evidence-list))                                                       |
| Format gate        | Pass    | Executed clean ([EVD-004](#evidence-list))                                                       |
| Coverage threshold | Partial | Configured, never run ([FND-INF-006](#fnd-inf-006-coverage-thresholds-configured-but-never-run)) |
| Test placement     | Partial | Anomalies ([FND-STR-001](#fnd-str-001-test-tree-placement-anomalies))                            |

Conformance: strong.

## Requirements Conformance

33 mandatory requirements extracted from docs/PROJECT.md and graded against code, tests, and
executed evidence.

| Requirement | Statement                                                  | Status  | Basis                                                                                                                        |
| ----------- | ---------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| F-01        | Three-track composition                                    | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-02        | Pattern-based sequencing                                   | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-03        | Playlist and order management                              | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-04        | Instrument editor                                          | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-05        | Playback engines YM2149 and Ayumi                          | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-06        | DOSOUND assembly export                                    | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-07        | Export formats binary VGM MAX WAV dump instrument MOD MIDI | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-08        | File load and save                                         | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-09        | Keyboard input layer                                       | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-10        | Keyboard-based note input                                  | Partial | Function present, declared Ctrl+Space binding ships as Shift+Space ([FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)) |
| F-11        | [MIDI](#glossary-index) support                            | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-12        | Theme variants                                             | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-13        | Cross-platform delivery                                    | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-14        | Replay rate and chip clock control                         | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-15        | [MIDI](#glossary-index) integration                        | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-16        | Redundant persistence                                      | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-17        | Settings modal                                             | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-18        | Stereo layouts                                             | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-19        | Chip variants                                              | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-20        | Undo and redo                                              | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| F-21        | Track fragment selection                                   | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| N-01        | Audio performance                                          | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| N-02        | Timing accuracy                                            | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| N-03        | Export fidelity                                            | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| N-04        | Type safety                                                | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| N-05        | Code quality                                               | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| N-06        | Test coverage at least 80 percent                          | Partial | Thresholds configured, level unmeasured ([FND-INF-006](#fnd-inf-006-coverage-thresholds-configured-but-never-run))           |
| C-01        | Compose a song                                             | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| C-02        | Export for Atari ST                                        | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| C-03        | Edit an instrument                                         | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| C-04        | Save and load work                                         | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |
| C-05        | Record MIDI input                                          | Partial | Source-verified, not exercised end to end ([FND-ARC-002](#fnd-arc-002-midi-recording-path-verified-at-source-only))          |
| C-06        | Undo mistakes                                              | Pass    | Source and executed evidence ([EVD-007](#evidence-list), [EVD-030](#evidence-list))                                          |

Coverage ratio c = 0.955 over 33 graded mandatory requirements -> FNC-REQ PASS.

## Baseline Conformance

Against the bundled stack baseline for a TypeScript/React application, strict compiler flags on, no
explicit `any`, test framework configured with jsdom and setup files, e2e harness present, lockfile
committed, engine floors pinned via `.nvmrc` and `.npmrc` engine-strict, secrets absent,
[CSP](#glossary-index) on
shipped
artifact, dead code absent. Deviations from baseline hygiene: coverage unmeasured
([FND-INF-006](#fnd-inf-006-coverage-thresholds-configured-but-never-run)), no automated pipeline
(recorded decision, [FND-INF-003](#fnd-inf-003-no-automated-gate-on-change)).

| Baseline item             | Status  | Basis                                                                                 |
| ------------------------- | ------- | ------------------------------------------------------------------------------------- |
| Strict compiler, zero any | Pass    | Executed typecheck, census                                                            |
| Test harness and setup    | Pass    | vitest + jsdom + setup files                                                          |
| Lockfile committed        | Pass    | package-lock.json v3                                                                  |
| Runtime floors pinned     | Pass    | .nvmrc, .npmrc engine-strict                                                          |
| Automated pipeline        | Partial | Recorded decision, absent ([FND-INF-003](#fnd-inf-003-no-automated-gate-on-change))   |
| Coverage measurement      | Partial | Unmeasured ([FND-INF-006](#fnd-inf-006-coverage-thresholds-configured-but-never-run)) |

Conformance: strong.

## Structure Conformance

The observed structure conforms to the declared model in ARCHITECTURE.md and GUIDELINES.md:
domain-grouped hooks and utils, modals consumed by a registered container, engines behind the
factory, exports behind the barrel, electron/ minimal, tests mirroring source, docs in the ASE
layout, work/ scratch ignored. Deviations: four test-placement anomalies
([FND-STR-001](#fnd-str-001-test-tree-placement-anomalies)) and the type-only layering inversion in
midiConfiguration.ts.

| Check                      | Status  | Basis                                                                                |
| -------------------------- | ------- | ------------------------------------------------------------------------------------ |
| Declared model conformance | Pass    | Structure matches ARCHITECTURE.md and GUIDELINES.md                                  |
| Test-tree mirror           | Partial | Four placement anomalies ([FND-STR-001](#fnd-str-001-test-tree-placement-anomalies)) |
| Layering direction         | Partial | One type-only inversion in midiConfiguration.ts                                      |

Conformance: strong with bounded deviations.

## Code Style

Style is uniform and enforced: Prettier clean across the tree, ESLint 10 with zero diagnostics,
consistent naming (use* hooks, PascalCase components, domain directories), zero TODO/FIXME markers,
zero explicit `any`, console output centralized behind the leveled logger (22 importers) and the
documented debug mode. Readability is bounded by dense modules, App.tsx 1,081 lines,
useMidiMessageProcessing 691, asm.ts 687, and the single 4,178-line stylesheet
([FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)).

| Lens            | Status  | Basis                                                                                                                  |
| --------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| Formatting      | Pass    | Prettier check clean                                                                                                   |
| Naming          | Pass    | Consistent conventions, zero violations observed                                                                       |
| Lint discipline | Pass    | ESLint zero diagnostics, zero TODO markers                                                                             |
| Readability     | Partial | Dense hotspots bound legibility ([FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)) |

Conformance: strong.

## Strengths and What's Working

- The verification loop is real and green: strict typecheck, ESLint 10, Prettier, 1334 unit tests,
  30 e2e tests, and a clean build all pass on the first complete-copy run
  (see Evidence List rows [EVD-002](#evidence-list) through [EVD-007](#evidence-list)).
- Electron hardening is done right at the baseline: contextIsolation, nodeIntegration off,
  origin-gated permission handlers, denied window creation, will-navigate blocking, build-injected
  [CSP](#glossary-index), and a 32-line typed preload surface ([EVD-008](#evidence-list)).
- Import validation is a stated convention and is enforced on five of six entry paths via
  assertImportSize with MAX_IMPORT_BYTES ([EVD-010](#evidence-list)).
- The export surface is deep and contract-verified: nine formats behind a lazy barrel, with e2e
  magic-byte assertions and golden emission fixtures ([EVD-037](#evidence-list), [EVD-039](#evidence-list)).
- Persistence is redundant and lifecycle-complete: localStorage plus IndexedDB mirror, centralized
  keys, reset flows that clear residue ([EVD-013](#evidence-list)).
- The test suite mirrors the source tree and asserts byte-level behavior, not just shape
  ([EVD-021](#evidence-list)).
- Documentation is unusually strong for a solo project: ASE change records, contiguous window
  reviews, and a declared sources-of-truth table ([EVD-023](#evidence-list)).
- Dependency hygiene is exemplary: 30 declared deps all used, 570 resolved packages exactly pinned,
  licenses fully compatible ([EVD-015](#evidence-list), [EVD-016](#evidence-list)).
- Provenance is honest: ported-code attribution headers, asset licenses bundled, AI-assisted
  authorship disclosed in the README ([EVD-032](#evidence-list)).
- Dead code is genuinely absent - every src/ module traces to a live importer, including lazy and
  worker-bound paths ([EVD-018](#evidence-list)).

## Technical Findings

| Finding                                                                                       | Pillar                                    | Severity | Title                                                                   | Result                        | Verification |
| --------------------------------------------------------------------------------------------- | ----------------------------------------- | -------- | ----------------------------------------------------------------------- | ----------------------------- | ------------ |
| [FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)                                       | Architecture & Design                     | Low      | Documentation drift cluster                                             | confirmed defect              |              |
| [FND-ARC-002](#fnd-arc-002-midi-recording-path-verified-at-source-only)                       | Architecture & Design                     | Low      | [MIDI](#glossary-index) recording path verified at source only          | evidence gap                  | Confirmed    |
| [FND-STR-001](#fnd-str-001-test-tree-placement-anomalies)                                     | Structure & Organization                  | Low      | Test-tree placement anomalies                                           | confirmed defect              |              |
| [FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths)          | Code Quality                              | Medium   | Duplicated audio semantics between live and export paths                | confirmed structural weakness |              |
| [FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)          | Code Quality                              | Medium   | Composition-root concentration and large-module hotspots                | confirmed structural weakness |              |
| [FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)                | Security & Compliance                     | Medium   | Instrument-file import skips the import-size bound                      | confirmed defect              |              |
| [FND-SEC-002](#fnd-sec-002-browserwindow-sandbox-flag-not-set)                                | Security & Compliance                     | Low      | BrowserWindow sandbox flag not set                                      | confirmed defect              |              |
| [FND-SEC-003](#fnd-sec-003-no-will-redirect-guard-http-urls-reach-openexternal)               | Security & Compliance                     | Low      | No will-redirect guard, http [URLs](#glossary-index) reach openExternal | confirmed defect              |              |
| [FND-SEC-004](#fnd-sec-004-buildhref-accepts--segments-in-listing-paths)                      | Security & Compliance                     | Low      | buildHref accepts ".." segments in listing paths                        | configuration risk            |              |
| [FND-INF-001](#fnd-inf-001-release-scripts-swallowed-failure-rollover-defect-orphaned-helper) | Infrastructure & [CI/CD](#glossary-index) | Low      | Release scripts: swallowed failure, rollover defect, orphaned helper    | confirmed defect              |              |
| [FND-INF-002](#fnd-inf-002-no-performance-measurement-harness-or-budgets)                     | Infrastructure & [CI/CD](#glossary-index) | Low      | No performance-measurement harness or budgets                           | evidence gap                  | Confirmed    |
| [FND-INF-003](#fnd-inf-003-no-automated-gate-on-change)                                       | Infrastructure & [CI/CD](#glossary-index) | Low      | No automated gate on change                                             | evidence gap                  |              |
| [FND-INF-004](#fnd-inf-004-dev-server-binds-all-interfaces-by-default)                        | Infrastructure & [CI/CD](#glossary-index) | Low      | Dev server binds all interfaces by default                              | configuration risk            |              |
| [FND-INF-005](#fnd-inf-005-single-author-delivery)                                            | Infrastructure & [CI/CD](#glossary-index) | Medium   | Single-author delivery                                                  | confirmed structural weakness | Confirmed    |
| [FND-INF-006](#fnd-inf-006-coverage-thresholds-configured-but-never-run)                      | Infrastructure & [CI/CD](#glossary-index) | Low      | Coverage thresholds configured but never run                            | evidence gap                  | Confirmed    |

### FND-ARC-001: Documentation drift cluster

PROJECT.md F-10 declares Ctrl+Space note-off, the shipped binding is Shift+Space.

MANUAL.md:715 uses stale ARPEGGIO_MIN/MAX names.

The README export list omits [MOD](#glossary-index) and [MIDI](#glossary-index).

GUIDELINES.md:327 narrows the license list versus COPYRIGHTS.md.

ARCHITECTURE.md omits InformationPanel from the persistence exception list.

- **Pillar:** Architecture & Design
- **Severity:** Low
- **Type:** Concern
- **Targets:** docs/PROJECT.md, docs/MANUAL.md, README.md, docs/GUIDELINES.md, docs/ARCHITECTURE.md
- **Basis:** Inspected
- **Criteria:** DOC-SYNC
- **Impact:** Future work is guided by stale statements, users see an incomplete export list.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Fix the five statements ([REC-005](#rec-005-re-sync-the-five-documentation-drifts)).
- **Evidence:** [EVD-024](#evidence-list)
- **Recommendation:** [REC-005](#rec-005-re-sync-the-five-documentation-drifts)

### FND-ARC-002: MIDI recording path verified at source only

The [MIDI](#glossary-index) subsystem exists across a 691-line processing hook.

The commissioned e2e run does not exercise [MIDI](#glossary-index) recording.

No MIDI-capable fixture drives the path end to end.

- **Pillar:** Architecture & Design
- **Severity:** Low
- **Type:** Concern
- **Targets:** src/hooks/midi/, e2e/smoke.spec.ts
- **Basis:** Inspected
- **Criteria:** FNC-JOURNEY
- **Impact:** C-05 rests on source inspection rather than executed verification.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** Yes - exercised by commissioned evidence
- **Confidence:** Medium
- **Mitigation:** Add a [MIDI](#glossary-index) test harness ([REC-015](#rec-015-add-a-midi-test-harness)).
- **Evidence:** [EVD-034](#evidence-list), [EVD-007](#evidence-list)
- **Recommendation:** [REC-015](#rec-015-add-a-midi-test-harness)

### FND-STR-001: Test-tree placement anomalies

The file test/utils/song/useDataManagement.test.ts is misnamed.

It tests parseSongFromYaml fixtures, not the hook.

The file test/hooks/songManagement.test.ts spans three domains at hooks root.

Four cross-domain aggregators at test/utils root mirror no module.

- **Pillar:** Structure & Organization
- **Severity:** Low
- **Type:** Concern
- **Targets:** test/utils/song/, test/hooks/, test/utils/
- **Basis:** Inspected
- **Criteria:** STR-PLACEMENT
- **Impact:** Test discovery and mirroring conventions degrade.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Rename and relocate the files ([REC-007](#rec-007-restore-test-tree-mirroring)).
- **Evidence:** [EVD-022](#evidence-list)
- **Recommendation:** [REC-007](#rec-007-restore-test-tree-mirroring)

### FND-CQY-001: Duplicated audio semantics between live and export paths

Register translation exists in channelInstrument.ts and playbackSimulation.ts.

Envelope and sustain semantics are reimplemented in useSequencerIntegration.ts.

Observed deltas include mixer default 0x38 vs 0x3f and isNewNote write-through.

The file exports/wav.ts adds a third independent [DSP](#glossary-index) path.

- **Pillar:** Code Quality
- **Severity:** Medium
- **Type:** Concern
- **Targets:** src/synth/channelInstrument.ts, src/utils/playback/playbackSimulation.ts, src/exports/wav.ts
- **Basis:** Inspected
- **Criteria:** CQY-DUP
- **Impact:** Exports can silently diverge from what the editor plays.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Share semantics or add conformance tests ([REC-002](#rec-002-unify-live-and-simulation-audio-semantics)).
- **Evidence:** [EVD-020](#evidence-list)
- **Recommendation:** [REC-002](#rec-002-unify-live-and-simulation-audio-semantics)

### FND-CQY-002: Composition-root concentration and large-module hotspots

App.tsx is a 1,081-line root wiring about 40 hooks.

The hook useAppModals assembles a roughly 100-prop parameter object.

The hook useModalManager carries a 481-line close-priority dispatcher.

The file App.css is a single 4,178-line stylesheet.

- **Pillar:** Code Quality
- **Severity:** Medium
- **Type:** Concern
- **Targets:** src/App.tsx, src/hooks/modal/useAppModals.tsx, src/hooks/modal/useModalManager.ts, src/App.css
- **Basis:** Inspected
- **Criteria:** CQY-COMPLEX
- **Impact:** Change risk concentrates at the widest-blast-radius file.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Decompose by domain cluster ([REC-010](#rec-010-decompose-the-composition-root)).
- **Evidence:** [EVD-019](#evidence-list)
- **Recommendation:** [REC-010](#rec-010-decompose-the-composition-root)

### FND-SEC-001: Instrument-file import skips the import-size bound

The path useInstrumentFileLoading.ts:61 calls yaml.load before any size check.

Every sibling import path routes through assertImportSize with MAX_IMPORT_BYTES.

The sibling pattern lives at useDataManagement.ts:452.

- **Pillar:** Security & Compliance
- **Severity:** Medium
- **Type:** Concern
- **Security:** CWE-400 Uncontrolled Resource Consumption - unbounded parse of a caller-supplied file.
- **Targets:** src/hooks/instrument/useInstrumentFileLoading.ts:61
- **Basis:** Inspected
- **Criteria:** SEC-INPUT
- **Impact:** A large or hostile instrument file can hang the renderer during parse.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Apply assertImportSize before parsing ([REC-001](#rec-001-bound-the-instrument-file-import)).
- **Evidence:** [EVD-010](#evidence-list)
- **Recommendation:** [REC-001](#rec-001-bound-the-instrument-file-import)

### FND-SEC-002: BrowserWindow sandbox flag not set

The file electron/main.cjs:9-21 sets contextIsolation and nodeIntegration off.

The sandbox:true flag is not set.

The file preload.cjs uses only contextBridge and is sandbox-compatible.

- **Pillar:** Security & Compliance
- **Severity:** Low
- **Type:** Concern
- **Security:** CWE-693 Protection Mechanism Failure - sandbox hardening layer not enabled.
- **Targets:** electron/main.cjs:9-21
- **Basis:** Inspected
- **Criteria:** SEC-THREAT
- **Impact:** Renderer compromise retains more [OS](#glossary-index) access than necessary.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Enable sandbox:true ([REC-003](#rec-003-enable-electron-renderer-sandbox)).
- **Evidence:** [EVD-008](#evidence-list)
- **Recommendation:** [REC-003](#rec-003-enable-electron-renderer-sandbox)

### FND-SEC-003: No will-redirect guard, http URLs reach openExternal

The file main.cjs:44-48 blocks will-navigate outside the app origin.

No will-redirect handler is registered.

The helper isExternalHttpUrl admits http: [URLs](#glossary-index) routed to shell.openExternal.

- **Pillar:** Security & Compliance
- **Severity:** Low
- **Type:** Concern
- **Security:** CWE-346 Origin Validation Error - redirect hop escapes the origin check.
- **Targets:** electron/main.cjs:44-48, electron/permissions.cjs:34-36
- **Basis:** Inspected
- **Criteria:** SEC-THREAT
- **Impact:** A redirect could navigate off-origin, http links open externally.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Add redirect guard, restrict to https ([REC-011](#rec-011-guard-redirects-and-external-schemes)).
- **Evidence:** [EVD-008](#evidence-list)
- **Recommendation:** [REC-011](#rec-011-guard-redirects-and-external-schemes)

### FND-SEC-004: buildHref accepts ".." segments in listing paths

The module filePickerUtils.ts:9-21 builds fetch [URLs](#glossary-index) from LIST.txt segments.

Parent-directory and absolute segments are not rejected.

The input is first-party shipped content.

- **Pillar:** Security & Compliance
- **Severity:** Low
- **Type:** Concern
- **Security:** CWE-22 Path Traversal - unvalidated path segment composition.
- **Targets:** src/utils/file/filePickerUtils.ts:9-21
- **Basis:** Inspected
- **Criteria:** SEC-INPUT
- **Impact:** A tampered LIST.txt could steer fetches outside the repository directory.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Reject parent and absolute segments ([REC-004](#rec-004-reject-traversal-segments-in-buildhref)).
- **Evidence:** [EVD-012](#evidence-list)
- **Recommendation:** [REC-004](#rec-004-reject-traversal-segments-in-buildhref)

### FND-INF-001: Release scripts: swallowed failure, rollover defect, orphaned helper

The script bump-version.mjs catches errors and exits 0.

The script release-check.sh mishandles patch-0 rollovers in PREV_VERSION.

The script sync-branches.sh force-pushes all branches and is unreferenced.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Targets:** scripts/bump-version.mjs, scripts/release-check.sh, scripts/sync-branches.sh
- **Basis:** Inspected
- **Criteria:** DEP-RELEASE
- **Impact:** Failed bumps report success, rollover releases may misderive versions.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Fix exit propagation and derivation ([REC-006](#rec-006-harden-release-script-failure-handling)).
- **Evidence:** [EVD-026](#evidence-list), [EVD-025](#evidence-list)
- **Recommendation:** [REC-006](#rec-006-harden-release-script-failure-handling)

### FND-INF-002: No performance-measurement harness or budgets

The only performance signal is the build chunk-size warning.

The bundle dist/js/index.js measures 605.03 kB, gzip 172.04 kB.

No latency, [CPU](#glossary-index), or audio-thread budgets exist.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Targets:** dist/js/index.js, package.json test scripts
- **Basis:** Inspected
- **Criteria:** PRF-MEASURE
- **Impact:** Audio-thread and bundle regressions have no measured guardrail.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** Yes - exercised by commissioned evidence
- **Confidence:** Medium
- **Mitigation:** Add a bundle budget and timing probe ([REC-008](#rec-008-add-performance-budgets-and-probes)).
- **Evidence:** [EVD-005](#evidence-list)
- **Recommendation:** [REC-008](#rec-008-add-performance-budgets-and-probes)

### FND-INF-003: No automated gate on change

No CI configuration exists in the tree.

The archive record add-ci-workflow.md records the absence as a decision.

The local loop plus release-check.sh provides a manual gate.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Targets:** tree root, scripts/release-check.sh
- **Basis:** Inspected
- **Criteria:** TST-GATE
- **Impact:** Regressions depend on the maintainer running the loop manually.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** Medium
- **Mitigation:** Keep release-check.sh mandatory ([REC-009](#rec-009-commission-advisory-sweep-and-optional-ci)).
- **Evidence:** [EVD-027](#evidence-list)
- **Absence:** Deliberate - recorded decision
- **Recommendation:** [REC-009](#rec-009-commission-advisory-sweep-and-optional-ci)

### FND-INF-004: Dev server binds all interfaces by default

The file vite.config.ts:46-49 sets host:true on port 8008.

The dev server binds all interfaces by default.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Security:** CWE-668 Exposure of Resource to Wrong Sphere - dev server reachable beyond loopback.
- **Targets:** vite.config.ts:46-49
- **Basis:** Inspected
- **Criteria:** DEP-DEFAULTS
- **Impact:** Local-network peers can reach the dev server.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** No - not exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Scope to loopback or document ([REC-012](#rec-012-scope-the-dev-server-binding)).
- **Evidence:** [EVD-009](#evidence-list)
- **Recommendation:** [REC-012](#rec-012-scope-the-dev-server-binding)

### FND-INF-005: Single-author delivery

All 802 commits are authored by one person.

No tags and no CI exist.

Knowledge transfer relies on the documentation corpus.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** Medium
- **Type:** Concern
- **Targets:** git history
- **Basis:** Inspected
- **Criteria:** DLY-BUSFACTOR
- **Impact:** Continuity depends on one maintainer.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** Yes - exercised by commissioned evidence
- **Confidence:** High
- **Mitigation:** Record a steward handover plan ([REC-013](#rec-013-record-a-steward-handover-plan)).
- **Evidence:** [EVD-014](#evidence-list)
- **Recommendation:** [REC-013](#rec-013-record-a-steward-handover-plan)

### FND-INF-006: Coverage thresholds configured but never run

The file vitest.config.ts declares 80% thresholds at lines 15-20.

The [npm](#glossary-index) test script runs without coverage.

No coverage run was commissioned, the level is unmeasured.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Targets:** vitest.config.ts:15-20
- **Basis:** Inspected
- **Criteria:** TST-WFLOW
- **Impact:** The declared coverage floor is unverified.
- **Method:** Direct source inspection, census denominators in cited evidence
- **Confirmation:** Yes - exercised by commissioned evidence
- **Confidence:** Medium
- **Mitigation:** Wire coverage into the loop ([REC-014](#rec-014-wire-coverage-into-the-verification-loop)).
- **Evidence:** [EVD-006](#evidence-list), [EVD-021](#evidence-list)
- **Recommendation:** [REC-014](#rec-014-wire-coverage-into-the-verification-loop)

## Technical Debt Register

| TDR                                                                | Category        | Title                                          | Severity |
| ------------------------------------------------------------------ | --------------- | ---------------------------------------------- | -------- |
| [TDR-001](#tdr-001-live-vs-simulation-audio-semantics-duplication) | Maintainability | Live-vs-simulation audio semantics duplication | Medium   |
| [TDR-002](#tdr-002-composition-root-concentration)                 | Maintainability | Composition-root concentration                 | Medium   |
| [TDR-003](#tdr-003-modalmanager-pass-through-layer)                | Maintainability | ModalManager pass-through layer                | Low      |
| [TDR-004](#tdr-004-test-tree-placement-anomalies)                  | Maintainability | Test-tree placement anomalies                  | Low      |
| [TDR-005](#tdr-005-documentation-drift-cluster)                    | Maintainability | Documentation drift cluster                    | Low      |
| [TDR-006](#tdr-006-release-script-defects)                         | Reliability     | Release-script defects                         | Low      |

### TDR-001: Live-vs-simulation audio semantics duplication

Instrument and envelope semantics exist in both the live path and the export simulation.

- **Category:** Maintainability
- **Severity:** Medium
- **Source:** [FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths)
- **Remediation cost:** Shared module or conformance tests, medium effort.
- **Cost of delay:** Audio changes must land twice, deltas already diverge.

### TDR-002: Composition-root concentration

App.tsx wires about 40 hooks across 1,081 lines, and App.css is a single 4,178-line sheet.

- **Category:** Maintainability
- **Severity:** Medium
- **Source:** [FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)
- **Remediation cost:** Decompose by domain cluster, medium effort.
- **Cost of delay:** Every feature change carries the widest blast radius.

### TDR-003: ModalManager pass-through layer

ModalManager.tsx forwards roughly 459 lines of props between useAppModals and ModalContainer.

- **Category:** Maintainability
- **Severity:** Low
- **Source:** Direct observation
- **Remediation cost:** Collapse or regenerate the pass-through, small effort.
- **Cost of delay:** Every modal change edits a duplicated wiring surface.

### TDR-004: Test-tree placement anomalies

One misnamed test file, one misplaced suite, and four aggregators break the mirror convention.

- **Category:** Maintainability
- **Severity:** Low
- **Source:** [FND-STR-001](#fnd-str-001-test-tree-placement-anomalies)
- **Remediation cost:** Rename and relocate files, small effort.
- **Cost of delay:** Test discovery degrades as misplaced files accumulate.

### TDR-005: Documentation drift cluster

Five statements no longer match shipped behavior across five documents.

- **Category:** Maintainability
- **Severity:** Low
- **Source:** [FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)
- **Remediation cost:** Edit five statements, small effort.
- **Cost of delay:** Future work is guided by stale statements.

### TDR-006: Release-script defects

The script bump-version.mjs swallows failures and release-check.sh mishandles rollovers.
The helper sync-branches.sh is orphaned.

- **Category:** Reliability
- **Severity:** Low
- **Source:** [FND-INF-001](#fnd-inf-001-release-scripts-swallowed-failure-rollover-defect-orphaned-helper)
- **Remediation cost:** Fix exits and derivation, small effort.
- **Cost of delay:** The next release window can silently produce a bad gate outcome.

## Unified Risk Register

| Risk                                                     | Title                                | Severity | Likelihood | Impact | Source                                                                                        |
| -------------------------------------------------------- | ------------------------------------ | -------- | ---------- | ------ | --------------------------------------------------------------------------------------------- |
| [RSK-001](#rsk-001-export-vs-live-audio-divergence)      | Export-vs-live audio divergence      | High     | Medium     | High   | [FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths)          |
| [RSK-002](#rsk-002-unbounded-instrument-file-parse)      | Unbounded instrument-file parse      | Medium   | Low        | Medium | [FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)                |
| [RSK-003](#rsk-003-single-maintainer-continuity-loss)    | Single-maintainer continuity loss    | High     | Medium     | High   | [FND-INF-005](#fnd-inf-005-single-author-delivery)                                            |
| [RSK-004](#rsk-004-composition-root-change-blast-radius) | Composition-root change blast radius | Medium   | Medium     | Medium | [FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)          |
| [RSK-005](#rsk-005-stale-documentation-misdirection)     | Stale documentation misdirection     | Low      | Medium     | Low    | [FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)                                       |
| [RSK-006](#rsk-006-unmeasured-performance-regressions)   | Unmeasured performance regressions   | Medium   | Medium     | Medium | [FND-INF-002](#fnd-inf-002-no-performance-measurement-harness-or-budgets)                     |
| [RSK-007](#rsk-007-unautomated-verification-gate)        | Unautomated verification gate        | Medium   | Low        | Medium | [FND-INF-003](#fnd-inf-003-no-automated-gate-on-change)                                       |
| [RSK-008](#rsk-008-silent-release-script-failure)        | Silent release-script failure        | Low      | Low        | Low    | [FND-INF-001](#fnd-inf-001-release-scripts-swallowed-failure-rollover-defect-orphaned-helper) |

### RSK-001: Export-vs-live audio divergence

Export formats silently diverge from live playback as the duplicated audio semantics drift.

- **Severity:** High
- **Likelihood:** Medium
- **Residual:** High
- **Impact:** High
- **Trigger:** Any future change to envelope, sustain, or register translation semantics.
- **Controls:** Emission golden tests cover export output, not live-vs-sim equivalence.
- **Closure:** Source finding closed with verification evidence.
- **Source:** [FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths)
- **Confidence:** High
- **Mitigation:** Unify the shared semantics or add live-vs-sim golden conformance tests.
- **Status:** Open

### RSK-002: Unbounded instrument-file parse

A large or malformed instrument file freezes the renderer during unbounded [YAML](#glossary-index) parse.

- **Severity:** Medium
- **Likelihood:** Low
- **Residual:** Medium
- **Impact:** Medium
- **Trigger:** The user selects a large or malformed [YAML](#glossary-index) instrument file.
- **Controls:** User selects files explicitly, parse is bounded by hardware only.
- **Closure:** Source finding closed with verification evidence.
- **Source:** [FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)
- **Confidence:** High
- **Mitigation:** Apply assertImportSize before yaml.load on the instrument import path.
- **Status:** Open

### RSK-003: Single-maintainer continuity loss

Delivery stops entirely if the single maintainer becomes unavailable.

- **Severity:** High
- **Likelihood:** Medium
- **Residual:** High
- **Impact:** High
- **Trigger:** The sole maintainer becomes unavailable.
- **Controls:** A 756-file documentation corpus preserves design intent.
- **Closure:** Source finding closed with verification evidence.
- **Source:** [FND-INF-005](#fnd-inf-005-single-author-delivery)
- **Confidence:** High
- **Mitigation:** Maintain the documentation corpus, consider a second committer or steward.
- **Status:** Open

### RSK-004: Composition-root change blast radius

Root-level concentration makes each feature change touch the widest-blast-radius file.

- **Severity:** Medium
- **Likelihood:** Medium
- **Residual:** Medium
- **Impact:** Medium
- **Trigger:** Any feature that adds a hook or modal to the composition root.
- **Controls:** ErrorBoundary and domain hooks bound the blast radius partially.
- **Closure:** Source finding closed with verification evidence.
- **Source:** [FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)
- **Confidence:** High
- **Mitigation:** Decompose App.tsx wiring into domain composition units.
- **Status:** Open

### RSK-005: Stale documentation misdirection

Stale docs misdirect future changes and misreport shipped behavior to users.

- **Severity:** Low
- **Likelihood:** Medium
- **Residual:** Low
- **Impact:** Low
- **Trigger:** Any change guided by the stale statements.
- **Controls:** The sources-of-truth table keeps one canonical statement per fact.
- **Closure:** Source finding closed with verification evidence.
- **Source:** [FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)
- **Confidence:** High
- **Mitigation:** Fix the five drift items, add doc-vs-code spot checks to window reviews.
- **Status:** Open

### RSK-006: Unmeasured performance regressions

Audio-thread and bundle-size regressions ship undetected without measurements.

- **Severity:** Medium
- **Likelihood:** Medium
- **Residual:** Medium
- **Impact:** Medium
- **Trigger:** Any change to audio scheduling or the dependency surface.
- **Controls:** The build chunk warning surfaces bundle size only.
- **Closure:** Source finding closed with verification evidence.
- **Source:** [FND-INF-002](#fnd-inf-002-no-performance-measurement-harness-or-budgets)
- **Confidence:** High
- **Mitigation:** Add a minimal perf probe, worklet timing and bundle budget, to the release loop.
- **Status:** Open

### RSK-007: Unautomated verification gate

Without an automated gate, a skipped local loop lets regressions reach release.

- **Severity:** Medium
- **Likelihood:** Low
- **Residual:** Medium
- **Impact:** Medium
- **Trigger:** A commit landing without the local verification loop.
- **Controls:** release-check.sh gates version bumps.
- **Closure:** Source finding closed with verification evidence.
- **Source:** [FND-INF-003](#fnd-inf-003-no-automated-gate-on-change)
- **Confidence:** High
- **Mitigation:** Keep release-check.sh mandatory in the version bump path.
- **Status:** Open

### RSK-008: Silent release-script failure

A swallowed bump failure or wrong rollover version produces a bad release silently.

- **Severity:** Low
- **Likelihood:** Low
- **Residual:** Low
- **Impact:** Low
- **Trigger:** The next version window close.
- **Controls:** Manual release review before artifact upload.
- **Closure:** Source finding closed with verification evidence.
- **Source:** [FND-INF-001](#fnd-inf-001-release-scripts-swallowed-failure-rollover-defect-orphaned-helper)
- **Confidence:** High
- **Mitigation:** Propagate failures in bump-version.mjs, fix the PREV_VERSION derivation.
- **Status:** Open

## Scope Exclusions

- Changes Since Previous Audit omitted - this is a fresh audit, AUDIT-1.5 set the revision floor
  only.
- API Contract Conformance, API Compatibility & Versioning Discipline, Skill Definition
  Conformance, AI System Assessment omitted - the subject is a standalone application with no
  published [API](#glossary-index), skill package, or AI system surface.
- Architecture Decision Records subsection omitted - the project records decisions in ASE change
  records, not ADRs.
- Contradiction Register omitted - no external or prior report asserting conflicting claims was
  consulted.
- Further Verification section folded into Known Limitations - executed-commands mode, unperformed
  checks are listed there.
- Packaged Electron runtime behavior excluded - the commissioned e2e exercises the browser bundle,
  not a packaged build.

## Known Limitations

- Dependency-advisory sweep not commissioned - DEP-ADVISORY is UNKNOWN, package currency is
  verified but vulnerability status is not (roadmap [REC-009](#rec-009-commission-advisory-sweep-and-optional-ci)).
- Coverage percentages unmeasured - vitest thresholds are configured at 80% but no coverage run was
  commissioned, N-06 graded PARTIAL.
- [MIDI](#glossary-index) recording path verified at source level only, no
  [MIDI](#glossary-index) fixture drives it in the commissioned
  suites.
- No performance-measurement harness exists, the only signals are the build chunk warning and e2e
  timings.
- The first isolation copy (openrsync) silently dropped ~11k files, it was rebuilt with ditto and
  all commands re-ran green. The truncation is a harness defect, not a subject defect.
- External automation cannot be ruled out - no in-tree CI exists, but a hosted pipeline outside the
  repository would not be visible to this audit.
- docs/archive and docs/report restricted surfaces were inventoried by filename only.

## Executed Evidence

Executed in an isolated copy at `work/audit-isolation/dst/`, a ditto copy excluding
`.git`, work/, and release artifacts. Subject tree compared clean afterwards.

| Check                        | Command                                          | Cwd                      | Tool & Version                                | Exit status | Result | Interpretation                                   |
| ---------------------------- | ------------------------------------------------ | ------------------------ | --------------------------------------------- | ----------- | ------ | ------------------------------------------------ |
| Environment census           | node --version, [npm](#glossary-index) --version | work/audit-isolation/dst | Node v26.13.0, [npm](#glossary-index) 11.20.0 | 0           | Pass   | Toolchain satisfies .nvmrc/.npmrc floors         |
| Typecheck                    | [npm](#glossary-index) run typecheck             | work/audit-isolation/dst | TypeScript 5.9.3                              | 0           | Pass   | Zero diagnostics                                 |
| Lint                         | [npm](#glossary-index) run lint                  | work/audit-isolation/dst | ESLint 10.14.0                                | 0           | Pass   | Zero diagnostics                                 |
| Format check                 | [npm](#glossary-index) run format:check          | work/audit-isolation/dst | Prettier 3.9.10                               | 0           | Pass   | All files formatted                              |
| Build                        | [npm](#glossary-index) run build                 | work/audit-isolation/dst | Vite 8.3.7                                    | 0           | Pass   | dist emitted, one chunk-size warning (605.03 kB) |
| Unit tests                   | [npm](#glossary-index) test                      | work/audit-isolation/dst | Vitest 5.1.0                                  | 0           | Pass   | 1334 tests, 0 failures                           |
| [E2E](#glossary-index) tests | [npm](#glossary-index) run test:e2e              | work/audit-isolation/dst | Playwright 1.65.0                             | 0           | Pass   | 30 tests, 0 failures                             |

## Evidence List

| Evidence | Basis | Type | Claims | Source |
| -------- | ----- | ---- | ------ | ------ |

| EVD-001 | Executed | Observation | DEP-BUILD, DEP-LIFECYCLE | Environment census for commissioned commands: Node v26.13.0 and [npm](#glossary-index) 11.20.0 satisfy the .nvmrc pin and .npmrc engine-strict floor, macOS arm64 host, ~26 GiB free disk. |

| EVD-002 | Executed | Observation | TST-WFLOW, CQY-ANALYSIS, STK-IDIOM | `npm run typecheck` (tsc --noEmit, TypeScript 5.9.3) exited 0 in the isolated copy. |

| EVD-003 | Executed | Observation | TST-WFLOW, CQY-ANALYSIS, STY-ENFORCE | `npm run lint` (ESLint 10.14.0) exited 0 with no diagnostics in the isolated copy. |

| EVD-004 | Executed | Observation | TST-WFLOW, STY-CONSIST, STY-ENFORCE | `npm run format:check` (Prettier 3.9.10) exited 0 - all checked files formatted. |

| EVD-005 | Executed | Observation | TST-WFLOW, DEP-BUILD, PRF-MEASURE | `npm run build` (tsc -b && vite build, Vite 8.3.7) exited 0. One warning: chunk larger than 600 kB after minification - dist/js/index.js 605.03 kB (gzip 172.04 kB). |

| EVD-006 | Executed | Observation | TST-WFLOW, TST-ASSERT, TST-FAILPATH, TST-ISO | `npm test` (Vitest 5.1.0, jsdom) ran 1334 tests across ~179 files: all passed in the isolated copy. |

| EVD-007 | Executed | Observation | TST-WFLOW, FNC-JOURNEY, TST-ASSERT | `npm run test:e2e` (Playwright 1.65.0) ran 30 browser tests: all passed, including export-format magic-byte assertions and note-entry/playlist/undo journeys. |

| EVD-008 | Inspected | Observation | SEC-THREAT, SEC-AUTHZ, OPS-SHUT | Electron main process: contextIsolation true, nodeIntegration false, backgroundThrottling false (electron/main.cjs:9-21), permission handlers gate every request except midi on app |

| EVD-009 | Inspected | Observation | SEC-THREAT, DEP-CONFIG, DEP-BUILD, DEP-DEFAULTS | Vite config injects a [CSP](#glossary-index) meta only on build (vite.config.ts:12-31), stamps **APP_VERSION** into the service worker at build (33-45), deploys worklet chunks as js/ayumi.js and js/s |

| EVD-010 | Inspected | Observation | SEC-INPUT, SCA-BOUNDS, FNC-DEFECT | Import-size enforcement: assertImportSize (utils/validation/importSize.ts) guards song, instrument-file repository, settings, MIDI-configuration, and clipboard parsing against MAX_ |

| EVD-011 | Inspected | Observation | SEC-SECRET | Secret-shape census over the whole tracked tree found no committed credentials, keys, or tokens. |

| EVD-012 | Inspected | Observation | SEC-INPUT, SEC-THREAT | DOM-sink census: no innerHTML/dangerouslySetInnerHTML/eval sinks in shipped source, React escaping covers rendered user content. buildHref (utils/file/filePickerUtils.ts:9-21) conc |

| EVD-013 | Inspected | Observation | COM-RETENT, REL-BACKUP, COM-INVENT, FNC-CONTRACT | Client-storage lifecycle: redundant persistence to localStorage plus IndexedDB mirror (F-16), storage keys centralized, clearApplicationStorage and reset flows dispose all keys - n |

| EVD-014 | Executed | Observation | DLY-CADENCE, DLY-BUSFACTOR, MNT-VERSION, DLY-HYGIENE | Git census: 802 commits, single author (Filip Golewski, 100%), zero tags, HEAD cef0d425 is the Version-1.5.8 window-close commit while package.json carries 1.5.9 (in-flight window) |

| EVD-015 | Inspected | Observation | DEP-PIN, DEP-INVENT, CPR-DEPLIC, DEP-LIFECYCLE | Dependency census: package-lock v3 pins 570 packages exactly, license census - [MIT](#glossary-index) 423, [ISC](#glossary-index) 42, Apache-2.0 28, BlueOak-1.0.0 20, BSD-3 19, BSD-2 13, MPL-2.0 12 (all lightningcss, d |

| EVD-016 | Inspected | Observation | DEP-DECLARE, DEP-META, STK-LIB, STK-CURRENT | Declared-dependency census: all 5 production + 25 dev dependencies are imported or configured, no missing direct deps. package.json carries author, [MIT](#glossary-index) license, engines floors cons |

| EVD-017 | Inspected | Observation | STR-ORG, STR-DIVIDE, ARC-RESP, STR-NAME | Module map: ~210 src files (~37.2k lines) in 12 domain-grouped hook dirs, 22 utils subdirs, components/modals/synth/exports/workers/constants/types/assets, 3-file electron/ shell, |

| EVD-018 | Inspected | Observation | CQY-DEAD, STR-REG | Dead-code census: every src/ module traced to a live importer, including lazy export barrel (8 dynamic imports in useExportOperations.ts) and worker ?worker&url imports, no unimple |

| EVD-019 | Inspected | Observation | ARC-COUPLING, CQY-COMPLEX, STK-ANTIPAT, STY-READ | Size hotspots: App.css 4,178 lines, App.tsx 1,081 (composition root, ~40 hook instantiations, 62 imports), useMidiMessageProcessing 691, asm.ts 687, useDataManagement 657, useSongM |

| EVD-020 | Inspected | Observation | CQY-DUP, ARC-DRY, MNT-DEBT | Duplication cluster: instrument-to-register translation duplicated between synth/channelInstrument.ts and utils/playback/playbackSimulation.ts, envelope/sustain semantics duplicate |

| EVD-021 | Inspected | Observation | TST-ISO, TST-ASSERT, TST-FAILPATH | Test suite census: ~179 files mirroring src layout, jsdom + localStorage mocks, audioContextStub double, 34 [YAML](#glossary-index) fixtures incl. golden emission snapshots asserting byte-level expor |

| EVD-022 | Inspected | Observation | STR-PLACEMENT | Test-placement anomalies: test/utils/song/useDataManagement.test.ts is misnamed (tests parseSongFromYaml, not the hook), test/hooks/songManagement.test.ts sits at hooks root spanni |

| EVD-023 | Inspected | Observation | DOC-EXIST, MNT-GOV, DLY-REVIEW, OPS-RUNBOOK | Documentation corpus: 756 tracked doc files - GUIDELINES.md sources-of-truth table, ARCHITECTURE.md, PROJECT.md (requirements baseline), SPECIFICATION.md, FORMAT.md, MANUAL.md, DEP |

| EVD-024 | Inspected | Observation | DOC-SYNC, DOC-ARCH, FNC-CONTRACT | Documentation drift cluster: docs/PROJECT.md F-10 declares Ctrl+Space note-off while shipped code uses Shift+Space (e2e asserts Shift+Space), MANUAL.md:715 uses stale ARPEGGIO_MIN/ |

| EVD-025 | Inspected | Observation | DEP-PIPELINE, DEP-RELEASE, DEP-RUNPATH, OPS-REVERT | Release machinery: electron-builder packaging + checksums, bump-version.mjs and release-check.sh gate version windows, binaries unsigned (documented posture), manual artifact distr |

| EVD-026 | Inspected | Observation | DEP-RELEASE | Release-script defects: scripts/bump-version.mjs catches errors and exits 0 (failure swallowed), scripts/release-check.sh PREV_VERSION fallback mishandles patch-0 rollovers, script |

| EVD-027 | Inspected | Observation | TST-GATE, DEP-PIPELINE | Automation census: no .github/, no CI config in tree, docs/archive/change/1.3.0/add-ci-workflow.md records a removed/absent workflow - absence is a recorded decision. Local verific |

| EVD-028 | Inspected | Observation | OBS-LOG, CQY-ERRH | Observability: utils/log/logger.ts defines leveled, categorized logging (ERROR/WARN/INFO/DEBUG x audio/midi/ui/storage/export/sequencer/system), adopted by 22 source files, remaini |

| EVD-029 | Inspected | Observation | CQY-ANALYSIS, FNC-STUB, STY-CONSIST, STK-IDIOM | Style/defect census: zero TODO/FIXME/HACK markers, zero explicit `any`, zero NotImplemented throws in shipped source, throw sites are genuine error paths. |

| EVD-030 | Inspected | Observation | FNC-REQ | Requirements registry: 33 mandatory requirements extracted from docs/PROJECT.md - F-01..F-21 features, N-01..N-06 non-functional, C-01..C-06 use cases, all graded against code and |

| EVD-031 | Inspected | Observation | ARC-ABSTRACT, ARC-PATTERN, STK-FRAME, STK-IDIOM | Architecture: SoundEngine contract with createSoundEngine factory (synth/soundEngine.ts:31-39), two engines (YM2149 WebAudio, Ayumi DSP worklet), RegisterFile mirror/batching, expo |

| EVD-032 | Inspected | Observation | CPR-NOTICE, CPR-ORIGIN, CPR-LICENSE, CPR-DEPLIC | Provenance: ayumiCore.ts carries Ayumi port attribution ([MIT](#glossary-index), via ayumi-js), zx0.ts carries [ZX0](#glossary-index) port attribution (BSD-3), SVG assets carry SVG Repo markers, public/font ships Ubunt |

| EVD-033 | Inspected | Observation | DEP-RUNPATH, OPS-RETRY, SCA-MODEL | Runtime surfaces: production service worker public/worker.js (network-first, version-stamped) registered only in production (main.tsx:9-14), PWA manifest + icons, Electron and brow |

| EVD-034 | Inspected | Observation | FNC-JOURNEY, ARC-RESP | [MIDI](#glossary-index) subsystem: useMidiMessageProcessing.ts (691 lines) handles decode/encode, device attach/detach, monitors, send queue, MidiDeviceSelect + MidiMonitorPanel UI, [MIDI](#glossary-index) config impor |

| EVD-035 | Executed | Observation | TST-WFLOW | Isolation note: the first isolation copy (openrsync) silently dropped ~11k files causing spurious vitest.config.ts/typecheck errors and a missing dist/cli.js - classified harness d |

| EVD-036 | Inspected | Observation | OPS-ERR, CQY-ERRH, STK-FRAME | Error handling: React ErrorBoundary wraps the composition root, error modals surface parse failures, [YAML](#glossary-index) parsing sits behind try/catch with metadata-warning callbacks (songParser. |

| EVD-037 | Inspected | Observation | ARC-PATTERN, DEP-BUILD, ARC-ABSTRACT | Export surface: 8 format modules behind a lazily imported barrel (exports/export.ts, 8 dynamic import sites in useExportOperations.ts), DOSOUND ASM with complex/tight strategies, b |

| EVD-038 | Inspected | Observation | OPS-SHUT, ARC-PATTERN | Lifecycle: undo snapshots (memento) for song/instrument/position edits, close-confirmation handshake prevents losing unsaved work in Electron, playback out-of-bounds loop guard at |

| EVD-039 | Inspected | Observation | TST-ASSERT, DOC-API | Contract verification: e2e asserts magic bytes for VGM/MAX/MOD/binary exports (smoke.spec.ts:179-215), FORMAT.md + SPECIFICATION.md document the export surface, emission fixtures a |

## Validation Protocol

| Check           | Result  | Justification                                                                                          |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| PAR-1           | Applied | Four SEC findings carry CWE IDs with rationale, no finding is unclassified                             |
| PAR-2           | Applied | Severity column derives from impact x likelihood, CVSS used only inside Security fields                |
| PAR-3           | Applied | Scoring Rubrics maps to the 20-dimension coverage model as a mapping only                              |
| PAR-4           | Applied | TDR blocks carry separate Remediation cost and Cost of delay fields                                    |
| PAR-5           | Applied | 802 commits, one author, surfaced in Health Dashboard Team & Continuity                                |
| PAR-6           | Applied | 570-package inventory derived from package-lock.json ([EVD-015](#evidence-list))                       |
| PAR-7           | Applied | Advisory sweep, coverage run, packaged-Electron runtime, and [MIDI](#glossary-index) e2e listed        |
| PAR-8           | Applied | This table - [PAR-1](#validation-protocol) through [PAR-33](#validation-protocol) plus parity baseline |
| PAR-9           | Applied | ASVS 5.0.0 and [CWE](#glossary-index) references re-derived for the TypeScript/Electron stack          |
| PAR-10          | Applied | Glossary Index present, register links applied by link-references.py                                   |
| PAR-11          | Applied | Coverage rows match Scope Exclusions, every Not done row disclaimed                                    |
| PAR-12          | Applied | All five direct dependencies carry manifest-sourced licenses                                           |
| PAR-13          | Applied | All 39 EVD rows and 15 findings carry type tags                                                        |
| PAR-14          | N/A     | N/A - no High or Critical findings exist                                                               |
| PAR-15          | Applied | Delivery Practice records cadence, gate posture, and the single-author rating                          |
| PAR-16          | N/A     | N/A - report is English                                                                                |
| PAR-17          | N/A     | N/A - subject ships no SKILL.md or agent-facing artifact surface                                       |
| PAR-18          | Applied | All 15 RECs classified Recommended or Optional exactly once                                            |
| PAR-19          | Applied | GUIDELINES.md and README routing listed with status                                                    |
| PAR-20          | Applied | Structure Review carries all five verdicts                                                             |
| PAR-21          | Applied | Code Style section resolves tiers per lint/format/naming/readability                                   |
| PAR-22          | N/A     | N/A - no style-consistency findings were raised                                                        |
| PAR-23          | N/A     | N/A - no style findings requiring a tiered Basis were raised                                           |
| PAR-24          | N/A     | N/A - no naming-quality findings were raised                                                           |
| PAR-25          | Applied | Lockfile, fixtures, and vendored ports excluded from style denominators                                |
| PAR-26          | Applied | No bulk-rename recommendations exist                                                                   |
| PAR-27          | Applied | Lint and format ran under commissioned evidence mode, disclosed as Executed                            |
| PAR-28          | Pass    | Six commissioned commands and all activated probes produced EVD rows                                   |
| PAR-29          | Pass    | Restricted docs surfaces recorded as Listed with justification in limitations                          |
| PAR-30          | Pass    | 33 requirements, one row each                                                                          |
| PAR-31          | Pass    | 15 summary rows, 15 blocks, reconciled                                                                 |
| PAR-32          | N/A     | N/A - no compression below Detailed occurred                                                           |
| PAR-33          | Pass    | Fresh audit, all EVD references resolve to this ledger                                                 |
| Parity baseline | Pass    | AUDIT-1.5 present, diffed for revision floor only, no content reused                                   |

## Remediation Roadmap

| Rec                                                           | Priority | Finding                                                                                       | Recommendation                                                                                 | Impact                                                            | Effort | Complexity | Breaking | Verification                                             |
| ------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------ | ---------- | -------- | -------------------------------------------------------- |
| [REC-001](#rec-001-bound-the-instrument-file-import)          | P1       | [FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)                | Apply assertImportSize before yaml.load in useInstrumentFileLoading.ts:61                      | Closes the only unbounded import path                             | S      | low        | None     | Unit test with an oversized instrument file              |
| [REC-002](#rec-002-unify-live-and-simulation-audio-semantics) | P2       | [FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths)          | Unify register and envelope semantics across live and simulation paths                         | Removes the drift vector on the audio path                        | M      | low        | None     | Golden live-vs-sim conformance output                    |
| [REC-003](#rec-003-enable-electron-renderer-sandbox)          | P2       | [FND-SEC-002](#fnd-sec-002-browserwindow-sandbox-flag-not-set)                                | Enable sandbox:true in BrowserWindow, the preload is already compatible                        | Defense in depth at near-zero cost                                | S      | low        | None     | Electron launch smoke                                    |
| [REC-004](#rec-004-reject-traversal-segments-in-buildhref)    | P3       | [FND-SEC-004](#fnd-sec-004-buildhref-accepts--segments-in-listing-paths)                      | Reject parent-directory and absolute segments in buildHref                                     | Constrains repository fetches to intended paths                   | S      | low        | None     | Unit test for parent and absolute segments               |
| [REC-005](#rec-005-re-sync-the-five-documentation-drifts)     | P3       | [FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)                                       | Fix the five drift items across PROJECT, MANUAL, README, GUIDELINES, ARCHITECTURE              | Docs re-sync with shipped behavior                                | S      | low        | None     | Doc diff against shipped behavior                        |
| [REC-006](#rec-006-harden-release-script-failure-handling)    | P3       | [FND-INF-001](#fnd-inf-001-release-scripts-swallowed-failure-rollover-defect-orphaned-helper) | Propagate non-zero exits and fix PREV_VERSION derivation, retire sync-branches.sh              | Release gate outcomes become trustworthy                          | S      | low        | None     | Dry-run bump on a fixture repo                           |
| [REC-007](#rec-007-restore-test-tree-mirroring)               | P4       | [FND-STR-001](#fnd-str-001-test-tree-placement-anomalies)                                     | Rename and relocate the anomalous test files to mirror their subjects                          | Restores test-tree discoverability                                | S      | low        | None     | Test discovery review                                    |
| [REC-008](#rec-008-add-performance-budgets-and-probes)        | P4       | [FND-INF-002](#fnd-inf-002-no-performance-measurement-harness-or-budgets)                     | Add a bundle-size budget and an audio-thread timing probe, consider chunk splitting            | Reference point for future perf drift detection                   | M      | low        | None     | Budget asserted in the build step                        |
| [REC-009](#rec-009-commission-advisory-sweep-and-optional-ci) | P4       | [FND-INF-003](#fnd-inf-003-no-automated-gate-on-change)                                       | Commission a periodic advisory sweep and optional lightweight CI for the local loop            | Closes the advisory UNKNOWN and the automation gap                | M      | low        | None     | Advisory sweep output in the next audit                  |
| [REC-010](#rec-010-decompose-the-composition-root)            | P3       | [FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)          | Decompose the composition root into domain units, playback, file ops, modal cluster            | Bounds change blast radius at the root                            | M      | low        | None     | Regression via the full suite plus manual smoke          |
| [REC-011](#rec-011-guard-redirects-and-external-schemes)      | P3       | [FND-SEC-003](#fnd-sec-003-no-will-redirect-guard-http-urls-reach-openexternal)               | Add a will-redirect origin check and restrict shell.openExternal to https schemes              | Closes the redirect navigation gap                                | S      | low        | None     | Electron launch plus redirect smoke                      |
| [REC-012](#rec-012-scope-the-dev-server-binding)              | P4       | [FND-INF-004](#fnd-inf-004-dev-server-binds-all-interfaces-by-default)                        | Scope the dev server to loopback or document the [LAN](#glossary-index) binding as intentional | Removes ambient [LAN](#glossary-index) exposure of the dev server | S      | low        | None     | Config diff plus dev-server launch                       |
| [REC-013](#rec-013-record-a-steward-handover-plan)            | P4       | [FND-INF-005](#fnd-inf-005-single-author-delivery)                                            | Record a steward handover plan and keep the doc corpus the onboarding path                     | Reduces single-maintainer continuity exposure                     | M      | low        | None     | Handover doc present in docs/.                           |
| [REC-014](#rec-014-wire-coverage-into-the-verification-loop)  | P3       | [FND-INF-006](#fnd-inf-006-coverage-thresholds-configured-but-never-run)                      | Wire npm run test:coverage into the verification loop or document the posture                  | Makes the declared 80% floor measurable                           | S      | low        | None     | Coverage output in the next audit                        |
| [REC-015](#rec-015-add-a-midi-test-harness)                   | P4       | [FND-ARC-002](#fnd-arc-002-midi-recording-path-verified-at-source-only)                       | Add a MIDI-capable test harness or fixture driving the recording path                          | Elevates C-05 to executed verification                            | M      | low        | None     | [MIDI](#glossary-index) recording exercised in the suite |

### REC-001: Bound the instrument-file import

Apply assertImportSize before yaml.load in useInstrumentFileLoading.ts:61.

- **Priority:** P1
- **Finding:** [FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)
- **Condition:** finding open
- **Impact:** Closes the only unbounded import path.
- **Effort:** S
- **Complexity:** low
- **Verification:** Unit test with an oversized instrument file.

### REC-002: Unify live and simulation audio semantics

Unify register and envelope semantics across live and simulation paths.

- **Priority:** P2
- **Finding:** [FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths)
- **Condition:** finding open
- **Impact:** Removes the drift vector on the audio path.
- **Effort:** M
- **Complexity:** low
- **Verification:** Golden live-vs-sim conformance output.

### REC-003: Enable Electron renderer sandbox

Enable sandbox:true in BrowserWindow, the preload is already compatible.

- **Priority:** P2
- **Finding:** [FND-SEC-002](#fnd-sec-002-browserwindow-sandbox-flag-not-set)
- **Condition:** finding open
- **Impact:** Defense in depth at near-zero cost.
- **Effort:** S
- **Complexity:** low
- **Verification:** Electron launch smoke.

### REC-004: Reject traversal segments in buildHref

Reject parent-directory and absolute segments in buildHref.

- **Priority:** P3
- **Finding:** [FND-SEC-004](#fnd-sec-004-buildhref-accepts--segments-in-listing-paths)
- **Condition:** finding open
- **Impact:** Constrains repository fetches to intended paths.
- **Effort:** S
- **Complexity:** low
- **Verification:** Unit test for parent and absolute segments.

### REC-005: Re-sync the five documentation drifts

Fix the five drift items across PROJECT, MANUAL, README, GUIDELINES, ARCHITECTURE.

- **Priority:** P3
- **Finding:** [FND-ARC-001](#fnd-arc-001-documentation-drift-cluster)
- **Condition:** finding open
- **Impact:** Docs re-sync with shipped behavior.
- **Effort:** S
- **Complexity:** low
- **Verification:** Doc diff against shipped behavior.

### REC-006: Harden release-script failure handling

Propagate non-zero exits and fix PREV_VERSION derivation, retire sync-branches.sh.

- **Priority:** P3
- **Finding:** [FND-INF-001](#fnd-inf-001-release-scripts-swallowed-failure-rollover-defect-orphaned-helper)
- **Condition:** finding open
- **Impact:** Release gate outcomes become trustworthy.
- **Effort:** S
- **Complexity:** low
- **Verification:** Dry-run bump on a fixture repo.

### REC-007: Restore test-tree mirroring

Rename and relocate the anomalous test files to mirror their subjects.

- **Priority:** P4
- **Finding:** [FND-STR-001](#fnd-str-001-test-tree-placement-anomalies)
- **Condition:** finding open
- **Impact:** Restores test-tree discoverability.
- **Effort:** S
- **Complexity:** low
- **Verification:** Test discovery review.

### REC-008: Add performance budgets and probes

Add a bundle-size budget and an audio-thread timing probe, consider chunk splitting.

- **Priority:** P4
- **Finding:** [FND-INF-002](#fnd-inf-002-no-performance-measurement-harness-or-budgets)
- **Condition:** finding open
- **Impact:** Reference point for future perf drift detection.
- **Effort:** M
- **Complexity:** low
- **Verification:** Budget asserted in the build step.

### REC-009: Commission advisory sweep and optional CI

Commission a periodic advisory sweep and optional lightweight CI for the local loop.

- **Priority:** P4
- **Finding:** [FND-INF-003](#fnd-inf-003-no-automated-gate-on-change)
- **Condition:** finding open
- **Impact:** Closes the advisory UNKNOWN and the automation gap.
- **Effort:** M
- **Complexity:** low
- **Verification:** Advisory sweep output in the next audit.

### REC-010: Decompose the composition root

Decompose the composition root into domain units, playback, file ops, modal cluster.

- **Priority:** P3
- **Finding:** [FND-CQY-002](#fnd-cqy-002-composition-root-concentration-and-large-module-hotspots)
- **Condition:** finding open
- **Impact:** Bounds change blast radius at the root.
- **Effort:** M
- **Complexity:** low
- **Verification:** Regression via the full suite plus manual smoke.

### REC-011: Guard redirects and external schemes

Add a will-redirect origin check and restrict shell.openExternal to https schemes.

- **Priority:** P3
- **Finding:** [FND-SEC-003](#fnd-sec-003-no-will-redirect-guard-http-urls-reach-openexternal)
- **Condition:** finding open
- **Impact:** Closes the redirect navigation gap.
- **Effort:** S
- **Complexity:** low
- **Verification:** Electron launch plus redirect smoke.

### REC-012: Scope the dev server binding

Scope the dev server to loopback or document the [LAN](#glossary-index) binding as intentional.

- **Priority:** P4
- **Finding:** [FND-INF-004](#fnd-inf-004-dev-server-binds-all-interfaces-by-default)
- **Condition:** finding open
- **Impact:** Removes ambient [LAN](#glossary-index) exposure of the dev server.
- **Effort:** S
- **Complexity:** low
- **Verification:** Config diff plus dev-server launch.

### REC-013: Record a steward handover plan

Record a steward handover plan and keep the doc corpus the onboarding path.

- **Priority:** P4
- **Finding:** [FND-INF-005](#fnd-inf-005-single-author-delivery)
- **Condition:** finding open
- **Impact:** Reduces single-maintainer continuity exposure.
- **Effort:** M
- **Complexity:** low
- **Verification:** Handover doc present in docs/.

### REC-014: Wire coverage into the verification loop

Wire npm run test:coverage into the verification loop or document the posture.

- **Priority:** P3
- **Finding:** [FND-INF-006](#fnd-inf-006-coverage-thresholds-configured-but-never-run)
- **Condition:** finding open
- **Impact:** Makes the declared 80% floor measurable.
- **Effort:** S
- **Complexity:** low
- **Verification:** Coverage output in the next audit.

### REC-015: Add a MIDI test harness

Add a MIDI-capable test harness or fixture driving the recording path.

- **Priority:** P4
- **Finding:** [FND-ARC-002](#fnd-arc-002-midi-recording-path-verified-at-source-only)
- **Condition:** finding open
- **Impact:** Elevates C-05 to executed verification.
- **Effort:** M
- **Complexity:** low
- **Verification:** [MIDI](#glossary-index) recording exercised in the suite.

### Recommendation Classification

| Rec                                                           | Class       | Basis                                                  |
| ------------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| [REC-001](#rec-001-bound-the-instrument-file-import)          | Recommended | Closes the only unbounded import path                  |
| [REC-002](#rec-002-unify-live-and-simulation-audio-semantics) | Recommended | Removes a drift vector on the audio-critical path      |
| [REC-003](#rec-003-enable-electron-renderer-sandbox)          | Recommended | Near-zero-cost Electron hardening                      |
| [REC-004](#rec-004-reject-traversal-segments-in-buildhref)    | Recommended | Cheap input-hardening on the listing-fetch path        |
| [REC-005](#rec-005-re-sync-the-five-documentation-drifts)     | Recommended | Doc sync prevents misdirected future work              |
| [REC-006](#rec-006-harden-release-script-failure-handling)    | Recommended | Release-gate trustworthiness                           |
| [REC-007](#rec-007-restore-test-tree-mirroring)               | Optional    | Cosmetic test-tree hygiene                             |
| [REC-008](#rec-008-add-performance-budgets-and-probes)        | Optional    | Establishes perf reference points, none measured today |
| [REC-009](#rec-009-commission-advisory-sweep-and-optional-ci) | Optional    | Closes the advisory UNKNOWN and the automation gap     |
| [REC-010](#rec-010-decompose-the-composition-root)            | Recommended | Bounds the widest blast radius in the codebase         |
| [REC-011](#rec-011-guard-redirects-and-external-schemes)      | Recommended | Cheap Electron navigation hardening                    |
| [REC-012](#rec-012-scope-the-dev-server-binding)              | Optional    | Ambient exposure only during development               |
| [REC-013](#rec-013-record-a-steward-handover-plan)            | Optional    | Docs already mitigate, steward plan adds resilience    |
| [REC-014](#rec-014-wire-coverage-into-the-verification-loop)  | Recommended | Makes a declared floor measurable                      |
| [REC-015](#rec-015-add-a-midi-test-harness)                   | Optional    | Source verification already establishes presence       |

### Follow-up Plan

| Finding                                                                              | Priority | Evidence                                          | Trigger                                                       |
| ------------------------------------------------------------------------------------ | -------- | ------------------------------------------------- | ------------------------------------------------------------- |
| [FND-SEC-001](#fnd-sec-001-instrument-file-import-skips-the-import-size-bound)       | P1       | Oversized-file unit test plus manual verification | [REC-001](#rec-001-bound-the-instrument-file-import)          |
| [FND-CQY-001](#fnd-cqy-001-duplicated-audio-semantics-between-live-and-export-paths) | P2       | Live-vs-sim golden conformance output             | [REC-002](#rec-002-unify-live-and-simulation-audio-semantics) |
| [FND-SEC-002](#fnd-sec-002-browserwindow-sandbox-flag-not-set)                       | P2       | Electron launch smoke plus config diff            | [REC-003](#rec-003-enable-electron-renderer-sandbox)          |

## Reference Sources

| Reference                                             | Publisher or Author | Used In                                    |
| ----------------------------------------------------- | ------------------- | ------------------------------------------ |
| docs/GUIDELINES.md                                    | dosound-tracker     | Methodology, conventions, sources of truth |
| docs/ARCHITECTURE.md                                  | dosound-tracker     | System Context, Architectural Assessment   |
| docs/PROJECT.md                                       | dosound-tracker     | Requirements Conformance                   |
| docs/SPECIFICATION.md, docs/FORMAT.md, docs/MANUAL.md | dosound-tracker     | Functional Suitability, Documentation      |
| docs/DEPLOYMENT.md, docs/TOOLING.md, docs/TESTING.md  | dosound-tracker     | Deployability, Operational Safety          |
| docs/COPYRIGHTS.md                                    | dosound-tracker     | License Compliance                         |
| OWASP ASVS 5.0.0                                      | OWASP               | Security control reference frame           |
| CWE-400, CWE-693, CWE-346, CWE-22, CWE-668            | MITRE               | Security classification                    |
| Lens criteria catalogue v4                            | Astra lens-skill    | Auditing Methodology, Scoring Rubrics      |

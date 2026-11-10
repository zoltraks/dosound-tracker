# DOSOUND Tracker Audit Report

## Document Information

| Field              | Value                                                                                  |
|--------------------|----------------------------------------------------------------------------------------|
| Report Style       | Audit                                                                                  |
| Report Revision    | 1.5                                                                                    |
| Report Date        | 2026-11-10                                                                             |
| Skill Version      | 2.8.4                                                                                  |
| Subject Revision   | 1.4.5 @ 48f25357e4866cff34c33c949e3751546831556e                                       |
| Dirty-Tree State   | 12 modified or added paths, instrument [YAMLs](#glossary-index), App.css, CommandPanel |
| Audit Purpose      | Engineering improvement and release readiness assessment                               |
| Evidence Mode      | Executed-commands                                                                      |
| Verification Scope | Source, configuration, documentation, history, commissioned commands                   |
| Detail Level       | Detailed                                                                               |
| Evaluation Scale   | 1-10                                                                                   |
| Language           | English                                                                                |
| Target Environment | Static SPA plus Electron desktop (Windows, macOS, Linux)                               |
| Time taken         | 0:20                                                                                   |

## Contents

- [Document Information](#document-information)
- [Audit Coverage](#audit-coverage)
- [Glossary Index](#glossary-index)
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
- [Validation Protocol](#validation-protocol)
- [Remediation Roadmap](#remediation-roadmap)
- [Reference Sources](#reference-sources)

## Audit Coverage

| Report type                                             | Status    | Rationale                                                                               |
|---------------------------------------------------------|-----------|-----------------------------------------------------------------------------------------|
| Software Architecture Review                            | Covered   | Source inspection covers structure, layering, and recorded decisions                    |
| Code Quality Audit                                      | Covered   | Inspection plus commissioned typecheck and lint runs                                    |
| Security Vulnerability Assessment                       | Covered   | Manual review, Electron surface model, executed npm audit                               |
| Open Source License Compliance                          | Covered   | Lockfile-derived inventory with license classification pass                             |
| Penetration Test                                        | Not done  | No execution against a running target, see Scope Exclusions                             |
| Performance Audit                                       | Partially | Stated targets reviewed in source, no load measurement                                  |
| Cloud Infrastructure Audit                              | Partially | Build and packaging configuration inspectable, no live state                            |
| Technical Due Diligence                                 | Partially | Engineering pillars covered, no interviews or business analysis                         |
| [SBOM](#glossary-index) / Software Composition Analysis | Covered   | Manifest and lockfile derived inventory, not a shipped-artifact [SBOM](#glossary-index) |
| Requirements Conformance Review                         | Covered   | PROJECT.md declares F/N/C requirement set, graded per row                               |
| ISO/IEC 27001 Certification                             | Not done  | Rubric used for scoring only, certification is a separate process                       |
| SOC 2 Attestation Examination                           | Not done  | Framework used as coverage checklist only                                               |

## Glossary Index

| Term   | Definition                                                             |
|--------|------------------------------------------------------------------------|
| ADR    | Architecture Decision Record, a documented design decision             |
| ASM    | Motorola 68000 assembly export format                                  |
| CSP    | Content Security Policy, browser directive set limiting resource loads |
| CWE    | Common Weakness Enumeration, a defect taxonomy                         |
| DORA   | DevOps Research and Assessment, delivery performance metrics           |
| GHSA   | GitHub Security Advisory identifier                                    |
| IPC    | Inter-Process Communication, Electron main-renderer channel            |
| LFSR   | Linear Feedback Shift Register, the YM2149 noise generator             |
| MAX    | Music Audio eXchange, a chunked chiptune interchange format            |
| MIDI   | Musical Instrument Digital Interface                                   |
| MPL    | Mozilla Public License, a file-level weak copyleft license             |
| NFR    | Non-Functional Requirement                                             |
| PSG    | Programmable Sound Generator, the YM2149 chip class                    |
| RPO    | Recovery Point Objective, maximum tolerable data loss                  |
| RTO    | Recovery Time Objective, maximum tolerable restore time                |
| SBOM   | Software Bill of Materials                                             |
| SLO    | Service Level Objective, a quantified availability target              |
| SRI    | Subresource Integrity, hash-pinned resource verification               |
| VBLANK | Vertical blanking interrupt, 50 Hz on PAL Atari ST                     |
| VGM    | Video Game Music register-capture format                               |
| YAML   | YAML Ain't Markup Language, the song and instrument file format        |
| ZX0    | A compact data compressor by Einar Saukas, BSD-3-Clause                |

**Identifier triplets**

| Triplet | Scope            | Description                             |
|---------|------------------|-----------------------------------------|
| FND     | Report-wide      | Technical finding identifier            |
| EVD     | Report-wide      | Evidence ledger row identifier          |
| TDR     | Report-wide      | Technical Debt Register entry           |
| RSK     | Report-wide      | Unified Risk Register entry             |
| REC     | Report-wide      | Remediation recommendation entry        |
| PAR     | Report-wide      | Validation Protocol checklist row       |
| FNC     | Criteria family  | Functional completeness and correctness |
| TST     | Criteria family  | Testing and testability                 |
| ARC     | Finding pillar   | Architecture and design findings        |
| CQY     | Finding pillar   | Code quality findings                   |
| SEC     | Finding pillar   | Security and compliance findings        |
| INF     | Finding pillar   | Infrastructure and delivery findings    |
| CPR     | Finding pillar   | Copyrights and licensing findings       |
| STR     | Finding pillar   | Structure and organization findings     |
| DEP     | Criteria family  | Dependency and deployability criteria   |
| DLY     | Criteria family  | Delivery and continuity criteria        |
| MNT     | Criteria family  | Maintainability criteria                |
| PRF     | Criteria family  | Performance measurement criteria        |
| CNF     | Criteria channel | Standards conformance criteria          |

## Executive Summary

| Dimension           | Score            |
|---------------------|------------------|
| Product Quality     | 7.0/10 (Good)    |
| Engineering Process | 6.0/10 (Average) |

Product Quality lowest dimension is Observability and Operational Safety at 5/10.
Engineering Process lowest is Delivery & Continuity at 3/10.

| Field             | Value                                                         |
|-------------------|---------------------------------------------------------------|
| **Overall score** | **6.7/10** (Average)                                          |
| System type       | Single-user desktop and web chiptune tracker                  |
| Scope             | Full source, configuration, documentation, and history audit  |
| Source basis      | Inspected plus four commissioned commands in an isolated copy |
| Maturity level    | Pre-production                                                |
| Readiness         | NOT READY - one open spec-violation gate                      |

The blended overall of 6.7 sits under a readiness ceiling of 6.0 while one
blocking gate stays open.

DOSOUND Tracker is a single-user chiptune tracker shipped as a static SPA and an
Electron desktop application. The codebase shows disciplined engineering: strict
TypeScript with zero `any` types, a clean lint run, 786 passing tests under a
commissioned vitest run, a domain-grouped module layout, and a thorough
governed documentation set.

One confirmed spec violation gates readiness: the unsaved-changes quit
confirmation advertised by the modal constants and the close-guard comment is
wired but unreachable, and the Electron close handler confirms unconditionally.
The defect is bounded by continuous autosave plus the IndexedDB mirror, so the
real exposure is a missing confirmation, not silent data loss.

Secondary concerns are the file-origin check that treats every `file://` URL as
an application origin, 15 moderate `minimatch` advisories confined to
devDependency tooling, MPL-2.0 dev packages outside the declared license policy,
no immutable release tags, single-author continuity, and the recorded
composition-root concentration in `App.tsx`.

## System Context

### Technology Stack

| Layer        | Evidence                                                                    |
|--------------|-----------------------------------------------------------------------------|
| Runtime      | React 19 SPA bundled by Vite 8 (rolldown), Electron 45 wrapper              |
| Language     | TypeScript strict mode, no `any`, bundler module resolution                 |
| State        | Single Zustand store plus hook-owned state and ref domains                  |
| Audio        | Web Audio API, dedicated sequencer Web Worker, YM2149 emulator              |
| Persistence  | localStorage, IndexedDB snapshot mirror, [YAML](#glossary-index) song files |
| Tests        | Vitest 4 (jsdom + node pragma), Playwright e2e, 786 unit tests              |
| Toolchain    | Node >=26.13.0, npm >=11.20.0, `.nvmrc` pin, `engine-strict`                |
| Distribution | electron-builder NSIS/dmg/AppImage, SHA256 sums hook, unsigned builds       |

The subject is a `frontend` primary nature with a `pipeline` secondary nature
for the six-format export engine. It is a deployable application, not a
reusable library, and carries no network listeners, no authentication surface,
and no hosted backend.

## Software Bill of Materials

Source-derived inventory from `package.json` and `package-lock.json` read as
text. Runtime and declared development manifests only, transitive entries
summarized.

| Component         | Version  | License    | Risk   | Advisory        | Source   |
|-------------------|----------|------------|--------|-----------------|----------|
| js-yaml           | ^4.3.2   | MIT        | None   | None identified | manifest |
| lucide-react      | ^1.67.0  | ISC        | None   | None identified | manifest |
| react             | ^19.3.1  | MIT        | None   | None identified | manifest |
| react-dom         | ^19.3.1  | MIT        | None   | None identified | manifest |
| zustand           | ^5.0.16  | MIT        | None   | None identified | manifest |
| electron          | ^45.2.1  | MIT        | None   | None identified | manifest |
| vite              | ^8.x     | MIT        | None   | None identified | manifest |
| vitest family     | ^4.1.12  | MIT        | None   | None identified | manifest |
| typescript-eslint | ^8.x     | MIT        | Review | Applicable      | manifest |
| eslint            | ^10.x    | MIT        | Review | Applicable      | manifest |
| electron-builder  | ^25/26.x | MIT        | Review | Applicable      | manifest |
| lightningcss      | bundled  | MPL-2.0    | Review | None identified | manifest |
| @playwright/test  | ^1.64.1  | Apache-2.0 | None   | None identified | manifest |

582 lockfile entries total: MIT 437, ISC 48, Apache-2.0 28, BSD 35, MPL-2.0 12,
BlueOak 11, other permissive 11. The `Applicable` advisory rows carry the open
`minimatch` chain per [FND-INF-001](#fnd-inf-001-moderate-dependency-advisories).
The MPL-2.0 `Review` row reflects the license-policy gap per
[FND-CPR-001](#fnd-cpr-001-mpl-20-dev-packages-outside-policy).

## License Compliance

| Class         | Count | Components                                     | Assessment              |
|---------------|-------|------------------------------------------------|-------------------------|
| Permissive    | 569   | MIT, ISC, Apache-2.0, BSD, BlueOak, CC0, WTFPL | Permitted list match    |
| Weak copyleft | 12    | lightningcss family, MPL-2.0, dev-only         | Outside declared policy |
| Copyleft      | 0     | None present                                   | Compliant               |
| Undeclared    | 0     | None present                                   | Compliant               |

The project license is MIT with a root `LICENSE` file, mirrored by the
electron-builder `build.copyright` field. The [ZX0](#glossary-index) compressor port retains its
BSD-3-Clause attribution in the source header per `COPYRIGHTS.md`. Twelve
MPL-2.0 packages sit outside the permitted-license list - a policy coverage gap,
not a linking conflict, since they are build tooling only.

## Health Dashboard

**Risk Map**

| Severity | Open findings                                                                                                                                                                                                                                                                                                                                |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Medium   | [FND-SEC-001](#fnd-sec-001-over-broad-file-origin-check), [FND-CQY-001](#fnd-cqy-001-dead-quit-confirm-modal-and-bypassed-guard), [FND-CQY-002](#fnd-cqy-002-thin-accessibility-surface), [FND-INF-001](#fnd-inf-001-moderate-dependency-advisories), [FND-ARC-001](#fnd-arc-001-composition-root-concentration)                             |
| Low      | [FND-INF-002](#fnd-inf-002-no-release-tags), [FND-INF-003](#fnd-inf-003-no-ci-pipeline), [FND-INF-004](#fnd-inf-004-diverged-branch-accumulation), [FND-INF-005](#fnd-inf-005-single-author-concentration), [FND-CPR-001](#fnd-cpr-001-mpl-20-dev-packages-outside-policy), [FND-INF-006](#fnd-inf-006-performance-targets-lack-measurement) |

Severity derives from the impact-likelihood matrix, not CVSS.

**Legend**

| Band      | Score |
|-----------|-------|
| Poor      | 1-3   |
| Average   | 4-6   |
| Good      | 7-8   |
| Excellent | 9-10  |

**Scorecard Summary**

| Dimension               | Score |
|-------------------------|-------|
| Functional Suitability  | 6/10  |
| Testability             | 6/10  |
| Design Soundness        | 7/10  |
| Code Quality            | 8/10  |
| Code Style              | 10/10 |
| Stack Alignment         | 9/10  |
| Dependency Health       | 9/10  |
| Maintainability         | 7/10  |
| Structure               | 10/10 |
| Deployability           | 6/10  |
| Scalability             | 8/10  |
| Security                | 6/10  |
| Compliance              | 7/10  |
| Observability           | 5/10  |
| Operational Safety      | 5/10  |
| Documentation           | 9/10  |
| Delivery & Continuity   | 3/10  |
| Originality & Licensing | 7/10  |
| Skill Definition        | 8/10  |

Scalability carries [6-8] for the unresolved measurement criterion.

**Team & Continuity**

100% of the last 200 non-merge commits carry a single author identity, per
[FND-INF-005](#fnd-inf-005-single-author-concentration). Mitigation: a thorough
documentation set.

## Delivery Practice

| Metric                | Value                                  | Basis                          |
|-----------------------|----------------------------------------|--------------------------------|
| Deployment frequency  | Multiple release commits per week      | Git-derived proxy, commit scan |
| Lead time for changes | Same-day for most changes              | Git-derived proxy              |
| Change failure rate   | Not specified                          | Telemetry unavailable          |
| Time to restore       | Not specified                          | Telemetry unavailable          |
| Release cadence       | ~25 released versions over 741 commits | Version-commit census          |
| Bus factor rating     | High concentration (single author)     | Author census, agent-bot n/a   |
| Merge review share    | Low (27 merges, self-integration)      | Merge census                   |

## High-Level Observations

The engineering floor is high: every static gate the repository declares was
re-executed and passed. The gaps concentrate in process automation and release
anchoring rather than code quality.

- Strict-mode TypeScript with `noUnusedLocals`, `noUnusedParameters`, and an
  lint run emitting zero warnings, [EVD-003](#auditing-methodology).
- The Electron security posture is deliberately hardened - context isolation,
  nodeIntegration off, origin-scoped [MIDI](#glossary-index) permission, navigation containment.
- Input handling is layered: a 1 MiB import bound, schema-shape checks, per-node
  type guards, and clamping throughout the [YAML](#glossary-index) path.
- The documentation governance is a strong asset: 15 owning
  documents, a standards library, and recorded decision routing.
- The two weakest dimensions are process-side: delivery continuity (single
  author, no tags, diverged branches) and operational surfaces that a local app
  only partially needs.

## Auditing Methodology

The audit ran the eight-phase Lens workflow: intake, parameter configuration
(fresh audit, `executed-commands` with four commissioned commands), scope
definition, evidence gathering, category assessment, synthesis, and validation.
All findings render from `work/audit-model.json`, checked mechanically by
`check-model.py`.

**Domain profile and probes**

Primary nature `frontend`, covering route and state boundary checks, secret-bearing
surface census, accessibility census, DOM-sink census, and the dead-feature check.
Secondary nature `pipeline`, covering input validation and partial-failure resume on
import paths. Cross-cutting probes: identifier trace, journey trace, stub census,
lifecycle completeness, defaults sweep, toolchain compatibility.

**Reference standards**

Baseline consultation order applied: the subject's own standards
(`docs/standard/` library, `SPECIFICATION.md` conventions) first, then bundled
skill digests, then no live fetch was needed. Stack references: TypeScript,
React, Electron, and real-time audio standards adopted by the repository.

**Criteria table**

| Criteria      | Dimension               | Outcome |
|---------------|-------------------------|---------|
| SEC-AUTHZ     | Security                | P50     |
| FNC-STUB      | Functional Suitability  | FAIL    |
| CNF-ACC       | Conformance             | P50     |
| DEP-ADVISORY  | Dependency Health       | P50     |
| DEP-RELEASE   | Deployability           | P50     |
| DEP-PIPELINE  | Deployability           | FAIL    |
| DLY-HYGIENE   | Delivery & Continuity   | P50     |
| DLY-BUSFACTOR | Delivery & Continuity   | FAIL    |
| CPR-DEPLIC    | Originality & Licensing | P50     |
| PRF-MEASURE   | Scalability             | Unknown |
| MNT-DEBT      | Maintainability         | P50     |

The fixed catalogue (v4, scoring policy 3) supplied 99 criteria entries, 84
resolved applicable, 15 `NOT_APPLICABLE` under deployment-model grounds covering
the library-only CMP family, the unauthored SKILL.md family, sessions, endpoints,
telemetry, scale model, and the consent surface. Each resolved entry carries a level within its
declared anchors.

**Read depth**

| Area            | Depth    | Justification                                   |
|-----------------|----------|-------------------------------------------------|
| docs/ pillars   | Full     | Governing documents, all read                   |
| src/ security   | Full     | Activated security probes                       |
| src/ core paths | Full     | Parser, worker, storage, markdown, exports core |
| src/ components | Sampled  | Census-level checks only                        |
| test/           | Sampled  | Structure census plus representative suites     |
| Restricted docs | Excluded | Repository read restrictions honored            |

**Evidence Ledger**

| Evidence | Source                    | Result                                                                     | Type        | Basis     |
|----------|---------------------------|----------------------------------------------------------------------------|-------------|-----------|
| EVD-001  | scan-structure census     | 849 files: 177 prod, 103 test, 515 doc, 27k LOC src                        | Observation | Inspected |
| EVD-002  | npm run typecheck         | exit 0, zero errors                                                        | Observation | Executed  |
| EVD-003  | npm run lint              | exit 0, zero warnings emitted                                              | Observation | Executed  |
| EVD-004  | npm test                  | exit 0, 99 files, 786 tests passed                                         | Observation | Executed  |
| EVD-005  | npm audit                 | exit 1, 15 moderate minimatch advisories, dev chains                       | Observation | Executed  |
| EVD-006  | package.json              | 5 runtime deps, engines floor, builder config                              | Observation | Inspected |
| EVD-007  | .nvmrc, .npmrc            | Node 26.13.0 pin, engine-strict, host satisfies floor                      | Observation | Inspected |
| EVD-008  | secrets sweep             | no secret material in tracked tree                                         | Observation | Inspected |
| EVD-009  | stub census               | zero TODO/FIXME/stub markers                                               | Observation | Inspected |
| EVD-010  | DOM-sink census           | 2 sinks, both TrustedHtml-fed                                              | Observation | Inspected |
| EVD-011  | bundledMarkdown.ts        | allowlist plus HTML-marker rejection                                       | Observation | Inspected |
| EVD-012  | electron/main.cjs         | isolation on, permission and navigation gates present                      | Observation | Inspected |
| EVD-013  | electron/permissions.cjs  | any file:// URL accepted as app origin                                     | Concern     | Inspected |
| EVD-014  | electron/preload.cjs      | 4-method contextBridge surface only                                        | Observation | Inspected |
| EVD-015  | vite.config.ts            | restrictive [CSP](#glossary-index) injected on build, deterministic naming | Observation | Inspected |
| EVD-016  | public/sw.js              | same-origin GET-only network-first worker                                  | Observation | Inspected |
| EVD-017  | import size path          | 1 MiB bound enforced pre- and post-read, tested                            | Observation | Inspected |
| EVD-018  | songParser + validation   | shape checks, clamping, typed error taxonomy                               | Observation | Inspected |
| EVD-019  | quit-guard trace          | modal unreachable, close handler confirms unconditionally                  | Concern     | Inspected |
| EVD-020  | package-lock licenses     | permissive set plus 12 MPL-2.0 dev packages                                | Observation | Inspected |
| EVD-021  | COPYRIGHTS.md vs lockfile | MPL-2.0 absent from permitted list                                         | Concern     | Inspected |
| EVD-022  | attribution check         | [ZX0](#glossary-index) BSD-3 notice retained, MIT LICENSE present          | Observation | Inspected |
| EVD-023  | git history census        | 741 commits, 0 tags, 100% single author, 15+ stale branches                | Observation | Inspected |
| EVD-024  | test census               | 99 files mirroring domain layout, mocks and pragma                         | Observation | Inspected |
| EVD-025  | e2e smoke spec            | 6 documented flows, chromium+webkit                                        | Observation | Inspected |
| EVD-026  | vitest.config.ts          | 80% coverage thresholds on all four counters                               | Observation | Inspected |
| EVD-027  | tsconfig                  | strict, noUnused*, zero `any` in src                                       | Observation | Inspected |
| EVD-028  | lint exception census     | 4 file-level + ~11 line-level documented disables                          | Observation | Inspected |
| EVD-029  | App.tsx                   | 1108-line orchestrator, ~50 hook imports                                   | Concern     | Inspected |
| EVD-030  | ErrorBoundary + logger    | boundary with retry, categorized logger in 20 files                        | Observation | Inspected |
| EVD-031  | accessibility census      | 27 aria-* uses across 6 component files                                    | Concern     | Inspected |
| EVD-032  | storage + mirror          | 24 central keys, IndexedDB mirror with graceful degradation                | Observation | Inspected |
| EVD-033  | sequencerWorker           | dedicated worker owns tick, position, message protocol                     | Observation | Inspected |
| EVD-034  | docs set                  | 15-file governed set, sources-of-truth map, standards library              | Observation | Inspected |
| EVD-035  | release path              | loop -> release-check -> audit -> bump -> changelog, unsigned              | Observation | Inspected |
| EVD-036  | CI census                 | no pipeline files, decline recorded in GUIDELINES                          | Observation | Inspected |
| EVD-037  | midi hot path             | byte parsing with clamps, cached debug flag                                | Observation | Inspected |
| EVD-038  | CHANGELOG                 | 1.4.5 entry matches manifest, advisory residual recorded                   | Observation | Inspected |
| EVD-039  | automation census         | signals: builder, bump, release-check, clean scripts                       | Observation | Inspected |
| EVD-040  | standards library         | 11 adopted standards with project deltas                                   | Observation | Inspected |
| EVD-041  | snapshot identity         | HEAD 48f2535 on main, 12 dirty paths                                       | Observation | Inspected |
| EVD-042  | remote refs census        | no remote URLs in shipped code                                             | Observation | Inspected |
| EVD-043  | export pipeline           | 6 formats share core, lazy chunks, zero-diff fixture tests                 | Observation | Inspected |
| EVD-044  | requirements registry     | F-01..F-16, N-01..N-06, C-01..C-05 extracted                               | Observation | Inspected |

## Scoring Rubrics

| Band      | Range | Meaning                                          |
|-----------|-------|--------------------------------------------------|
| Poor      | 1-3   | Material gaps block reliance                     |
| Average   | 4-6   | Usable with named limitations                    |
| Good      | 7-8   | Sound with bounded reservations                  |
| Excellent | 9-10  | Strong evidence supports the assessed capability |

Dimension scores are weight-averaged criteria mastery under scoring policy 3,
mapped `max(1, round(mastery * 10))`. The ISO/IEC 25010:2023 crosswalk is used
as a coverage mapping only, not a conformance claim. Product Quality is the
tier-weighted mean of eligible product dimensions (7.0, interval [6.8-7.0]).
Engineering Process is the equal-weight mean of eligible process dimensions
(6.0). The single blend `0.7*product + 0.3*process` computes 6.7 and is then
ceiling-capped to 6.0 by the `NOT READY` readiness state.

## Architectural Assessment

The architecture mirrors its documentation faithfully: two data paths
two data paths first: playback through a worker-driven sequencer into the YM2149
emulator, and a shared-core export pipeline. Three deliberate state domains follow:
single Zustand store, hook-owned state, and audio-rate refs, plus a composition
root in `App.tsx`.

### Design Principles

Responsibility boundaries are clean at the module level - every folder owns one
responsibility and `src/hooks/` plus `src/utils/` enforce a directories-only
domain-grouping rule. The concentration risk sits at the composition root,
where ~50 hooks wire implicitly through `App.tsx`. Dependency injection is
light: hooks receive typed parameter objects rather than interfaces, and
module-level imports are concrete throughout - acceptable at this scale, but it
keeps `ARC-ABSTRACT` at P50.

### Data Flow Diagram

Trusted boundaries: [YAML](#glossary-index) file import -> size and schema validation -> song
model, [MIDI](#glossary-index) input -> permission gate -> byte parsing with clamps, bundled
markdown -> allowlist fetch -> TrustedHtml render, Electron window ->
origin-gated permissions -> contextBridge API. Each boundary carries at least
one validating hop, with the file-origin check the weak point per
[FND-SEC-001](#fnd-sec-001-over-broad-file-origin-check).

### Architecture Decision Records

Significant decisions are recorded: worker-based timing isolation, single-store
versus domain stores, intentional React anti-patterns for audio stability,
declined CI and community files, unsigned binaries, and document retention
policy. Records live in `ARCHITECTURE.md`, `GUIDELINES.md`, `DEPLOYMENT.md`,
and `docs/decision/`.

## Structure Review

| Area                       | Verdict   | Basis                                   |
|----------------------------|-----------|-----------------------------------------|
| Directory organization     | Passed    | Domain-grouped src/, mirrored test/     |
| Naming conventions         | Passed    | PascalCase components, camelCase others |
| Component placement        | Partially | App.tsx outsized, recorded exception    |
| Supporting-artifact layout | Passed    | docs/, work/, e2e/, fixtures separated  |
| Consistency                | Passed    | Directories-only rule holds, zero drift |

## Solution Comparison

The composition-root trade-off (single orchestrator versus domain stores) is
deliberate and documented: it keeps the song model co-located at the cost of
navigability, currently balanced toward further decomposition. The no-CI
decision trades automated gating for a documented local loop - consistent with
the single-maintainer model but leaves the gate to discipline. Unsigned
binaries trade signing cost for checksum verification, a procurement decision
deferred rather than a defect.

## Threat Model

| Element     | Surface                              | Control                                     | Verdict  |
|-------------|--------------------------------------|---------------------------------------------|----------|
| Spoofing    | Renderer loads non-app origin        | will-navigate block, [CSP](#glossary-index) | Partial  |
| Tampering   | Malformed YAML/MAX import            | size bound, schema validation, clamps       | Covered  |
| Repudiation | Local-only actions                   | git history, local logger                   | Adequate |
| Info leak   | Secrets in tree or bundle            | census: none found, no remote URLs          | Covered  |
| DoS         | Oversized imports, malformed input   | MAX_IMPORT_BYTES, bounded expansions        | Covered  |
| Elevation   | file:// page inherits app privileges | isAppOrigin scheme-only check               | Gap      |

The elevation row maps to [FND-SEC-001](#fnd-sec-001-over-broad-file-origin-check),
its exploitability narrative is theoretical - no navigation vector was
demonstrated in shipped code.

## Guidance Conformance

| Artifact           | Status   | Baseline                                 |
|--------------------|----------|------------------------------------------|
| README.md          | Conforms | Routes agents to GUIDELINES.md           |
| docs/GUIDELINES.md | Conforms | Sources-of-truth map, owner declarations |
| docs/WORKFLOW.md   | Conforms | Restricted-directory statements present  |
| docs/standard/     | Conforms | Adopted standards with project deltas    |
| AGENTS.md          | Absent   | Declined by recorded convention          |

The guidance topology resolves: one index of record (GUIDELINES.md), declared
topic owners, and explicit read boundaries. Verdict: conforms.

## Standards Conformance

| Standard                           | Status    | Evidence                                                                  |
|------------------------------------|-----------|---------------------------------------------------------------------------|
| typescript-react-development       | Conforms  | Naming, layout, hook rules verified                                       |
| typescript-general-development     | Conforms  | Strict mode, no any, type taxonomy                                        |
| typescript-electron-development    | Partially | Origin check deviates, [EVD-013](#auditing-methodology)                   |
| typescript-audio-development       | Conforms  | Worker isolation, ref domains                                             |
| accessibility-general-development  | Partially | Thin aria surface, [FND-CQY-002](#fnd-cqy-002-thin-accessibility-surface) |
| performance-budgets-development    | Conforms  | Lazy export chunks, hot-loop trims                                        |
| css-general-development            | Conforms  | kebab-case classes observed                                               |
| html-vanilla-development           | N/A       | Low applicability, recorded                                               |
| typescript-refactoring-development | Conforms  | REFACTORING.md process followed                                           |
| bash-inline-development            | Conforms  | scripts/ style                                                            |
| standard-template-development      | N/A       | Authoring template, not a code rule                                       |

## Requirements Conformance

| Requirement | Status  | Evidence                                                                                                                             |         |                                                                                                    |
|-------------|---------|--------------------------------------------------------------------------------------------------------------------------------------|---------|----------------------------------------------------------------------------------------------------|
| F-01        | Pass    | [EVD-001](#auditing-methodology), [EVD-043](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-02        | Pass    | [EVD-001](#auditing-methodology), [EVD-018](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-03        | Pass    | [EVD-001](#auditing-methodology)                                                                                                     |         |                                                                                                    |
| F-04        | Pass    | [EVD-001](#auditing-methodology), [EVD-025](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-05        | Partial | [EVD-033](#auditing-methodology), [FND-INF-006](#fnd-inf-006-performance-targets-lack-measurement)                                   |         |                                                                                                    |
| F-06        | Pass    | [EVD-004](#auditing-methodology), [EVD-033](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-07        | Pass    | [EVD-004](#auditing-methodology), [EVD-043](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-08        | Pass    | [EVD-004](#auditing-methodology), [EVD-043](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-09        | Pass    | [EVD-018](#auditing-methodology), [EVD-025](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-10        | Pass    | [EVD-025](#auditing-methodology), [EVD-031](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-11        | Pass    | [EVD-012](#auditing-methodology), [EVD-037](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-12        | Pass    | [EVD-025](#auditing-methodology)                                                                                                     |         |                                                                                                    |
| F-13        | Pass    | [EVD-006](#auditing-methodology), [EVD-012](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-14        | Pass    | [EVD-018](#auditing-methodology), [EVD-033](#auditing-methodology)                                                                   |         |                                                                                                    |
| F-15        | Pass    | [EVD-032](#auditing-methodology)                                                                                                     |         |                                                                                                    |
| F-16        | Pass    | [EVD-032](#auditing-methodology)                                                                                                     |         |                                                                                                    |
| N-01        | Partial | [EVD-033](#auditing-methodology), FND-INN-01                                                                                         | Partial | [EVD-033](#auditing-methodology), [FND-INF-006](#fnd-inf-006-performance-targets-lack-measurement) |
| N-02        | Pass    | [EVD-033](#auditing-methodology)                                                                                                     |         |                                                                                                    |
| N-03        | Partial | [EVD-004](#auditing-methodology), [EVD-043](#auditing-methodology), [FND-INF-006](#fnd-inf-006-performance-targets-lack-measurement) |         |                                                                                                    |
| N-04        | Pass    | [EVD-002](#auditing-methodology), [EVD-027](#auditing-methodology)                                                                   |         |                                                                                                    |
| N-05        | Pass    | [EVD-003](#auditing-methodology), [EVD-028](#auditing-methodology)                                                                   |         |                                                                                                    |
| N-06        | Pass    | [EVD-004](#auditing-methodology), [EVD-026](#auditing-methodology)                                                                   |         |                                                                                                    |
| C-01        | Pass    | [EVD-025](#auditing-methodology)                                                                                                     |         |                                                                                                    |
| C-02        | Pass    | [EVD-025](#auditing-methodology), [EVD-043](#auditing-methodology)                                                                   |         |                                                                                                    |
| C-03        | Pass    | [EVD-025](#auditing-methodology)                                                                                                     |         |                                                                                                    |
| C-04        | Pass    | [EVD-018](#auditing-methodology), [EVD-025](#auditing-methodology)                                                                   |         |                                                                                                    |
| C-05        | Pass    | [EVD-037](#auditing-methodology)                                                                                                     |         |                                                                                                    |

Coverage: 24 Pass, 3 Partial, 0 Fail of 27 declared requirements.

## Baseline Conformance

Judgements rest on the subject's own adopted standards first, then bundled
digests for the TypeScript, React, and Electron stack. The engineering floor
holds: lint-clean, typecheck-clean, test suite green, documented conventions
matched by inspected structure. Deviations are the recorded accessibility gap,
the file-origin check, and the composition-root concentration.

## Structure Conformance

| Check                    | Status | Evidence                                                           |
|--------------------------|--------|--------------------------------------------------------------------|
| Domain grouping          | Pass   | [EVD-001](#auditing-methodology), [EVD-029](#auditing-methodology) |
| Directories-only rule    | Pass   | [EVD-029](#auditing-methodology)                                   |
| File-naming rules        | Pass   | [EVD-001](#auditing-methodology)                                   |
| Root-level exception set | Pass   | [EVD-029](#auditing-methodology), documented                       |
| Test tree mirroring      | Pass   | [EVD-024](#auditing-methodology)                                   |

## Code Style

| Lens             | Status |
|------------------|--------|
| Code style score | Pass   |

Resolved convention tier T1 (subject's own adopted standards plus Prettier enforcement).

| Census row        | Result | Pattern and denominator                                            |
|-------------------|--------|--------------------------------------------------------------------|
| Component naming  | Pass   | PascalCase 44/44 component files                                   |
| Utility naming    | Pass   | camelCase dominant in non-component files                          |
| `any` usage       | Pass   | 0 occurrences in 27028 src lines, [EVD-027](#auditing-methodology) |
| `console.*` usage | Pass   | 4 sites in src, logger adopted in 20 files                         |
| Lint suppressions | Pass   | 15 documented sites, all audio-critical class                      |

## Strengths and What's Working

- Zero-warning lint and zero-error typecheck, re-executed this audit.
- 786 tests pass in 7.2s under the commissioned vitest run.
- Domain-grouped module layout with a hard directories-only convention.
- Worker-isolated sequencer timing protected from the render loop.
- Layered input validation: size bound, schema checks, clamps, typed errors.
- Hardened Electron posture: isolation, origin-scoped [MIDI](#glossary-index), navigation contain.
- IndexedDB mirror persistence with graceful degradation and restore path.
- TrustedHtml-branded markdown with a bounded bundled-document allowlist.
- Governed documentation set with owners, standards library, and lessons loop.
- Deterministic build output and SHA256-verified release artifacts.

## Technical Findings

| Finding                                                                | Pillar | Severity | Summary                                    | Status |
|------------------------------------------------------------------------|--------|----------|--------------------------------------------|--------|
| [FND-SEC-001](#fnd-sec-001-over-broad-file-origin-check)               | SEC    | Medium   | Over-broad file origin check               | Open   |
| [FND-CQY-001](#fnd-cqy-001-dead-quit-confirm-modal-and-bypassed-guard) | CQY    | Medium   | Dead quit-confirm modal and bypassed guard | Open   |
| [FND-CQY-002](#fnd-cqy-002-thin-accessibility-surface)                 | CQY    | Medium   | Thin accessibility surface                 | Open   |
| [FND-INF-001](#fnd-inf-001-moderate-dependency-advisories)             | INF    | Medium   | Moderate dependency advisories             | Open   |
| [FND-INF-002](#fnd-inf-002-no-release-tags)                            | INF    | Low      | No release tags                            | Open   |
| [FND-INF-003](#fnd-inf-003-no-ci-pipeline)                             | INF    | Low      | No CI pipeline                             | Open   |
| [FND-INF-004](#fnd-inf-004-diverged-branch-accumulation)               | INF    | Low      | Diverged branch accumulation               | Open   |
| [FND-INF-005](#fnd-inf-005-single-author-concentration)                | INF    | Low      | Single-author concentration                | Open   |
| [FND-CPR-001](#fnd-cpr-001-mpl-20-dev-packages-outside-policy)         | CPR    | Low      | MPL-2.0 dev packages outside policy        | Open   |
| [FND-INF-006](#fnd-inf-006-performance-targets-lack-measurement)       | INF    | Low      | Performance targets lack measurement       | Open   |
| [FND-ARC-001](#fnd-arc-001-composition-root-concentration)             | ARC    | Medium   | Composition-root concentration             | Open   |

### FND-SEC-001: Over-broad file origin check

The `isAppOrigin` check in `electron/permissions.cjs` treats every `file://` URL as an app origin.
The `will-navigate` gate admits navigation to any local file.
The [MIDI](#glossary-index) permission handler also grants it to any `file://` page.
- **Pillar:** Security & Compliance
- **Severity:** Medium
- **Type:** Concern
- **Targets:** SEC-AUTHZ, SEC-THREAT
- **Basis:** Inspected
- **Criteria:** SEC-AUTHZ
- **Impact:** A local HTML page reached through renderer navigation inherits app-origin privileges
the documented policy reserves for the bundle
- **Method:** Origin check traced through permission and navigation handlers
- **Confidence:** High
- **Confirmation:** Yes - source trace confirms the scheme-only comparison
- **Exploitability:** Theoretical - no navigation vector demonstrated in shipped code
- **Mitigation:** contextIsolation, nodeIntegration off, [CSP](#glossary-index), windowOpen deny
bound the blast radius
- **Evidence:** [EVD-012](#auditing-methodology), [EVD-013](#auditing-methodology),
[EVD-014](#auditing-methodology)
- **Recommendation:** [REC-002](#rec-002-narrow-file-origin-check)

### FND-CQY-001: Dead quit-confirm modal and bypassed guard

A `setIsQuitConfirmOpen` is never called with `true` anywhere in `src`, so the unsaved-changes.
Dialog defined in `src/constants/modal.ts` is unreachable, and the `app-close-requested`.
Handler calls `confirmAppClose()` immediately.
- **Pillar:** Code Quality
- **Severity:** Medium
- **Type:** Concern
- **Targets:** FNC-STUB, FNC-JOURNEY, CQY-DEAD, OPS-SHUT, DOC-SYNC
- **Basis:** Inspected
- **Criteria:** FNC-STUB
- **Impact:** The documented unsaved-changes quit guard never executes on the Electron close path
- **Method:** Setter call-site census plus close-handshake trace
- **Confidence:** High
- **Confirmation:** Yes - call-site census found no `true` caller
- **Mitigation:** Autosave and the IndexedDB mirror bound the data-loss surface
- **Evidence:** [EVD-019](#auditing-methodology)
- **Recommendation:** [REC-001](#rec-001-wire-quit-confirm-modal)

### FND-CQY-002: Thin accessibility surface

Only 27 `aria-*` attributes appear across 6 of 28 component files.
The adopted accessibility standard is only partially realized.
Full keyboard navigation does exist.
- **Pillar:** Code Quality
- **Severity:** Medium
- **Type:** Concern
- **Targets:** CNF-ACC
- **Basis:** Inspected
- **Criteria:** CNF-ACC
- **Impact:** Screen-reader and assistive-technology users get a degraded editing experience
- **Method:** Attribute census across component files
- **Confidence:** Medium
- **Confirmation:** Yes - census counts reproduced
- **Mitigation:** Documented keyboard navigation order covers part of the baseline
- **Evidence:** [EVD-031](#auditing-methodology)
- **Recommendation:** [REC-009](#rec-009-apply-accessibility-baseline)

### FND-INF-001: Moderate dependency advisories

Executed `npm audit` reports 15 moderate-severity `minimatch` advisories (GHSA-g3hv-75wg-m249).
All inside devDependency chains for eslint, typescript-eslint, and electron-builder.
Nothing ships to the runtime bundle.
- **Pillar:** Infrastructure & CI/CD
- **Severity:** Medium
- **Type:** Concern
- **Targets:** DEP-ADVISORY
- **Basis:** Executed
- **Criteria:** DEP-ADVISORY
- **Impact:** Build tooling retains a known DoS advisory until upstream chains accept the fix
- **Method:** Commissioned `npm audit` in the isolated tree copy
- **Confidence:** High
- **Confirmation:** Yes - executed 2026-11-10, exit 1
- **Mitigation:** Dev-only scope, residual documented in the 1.4.5 CHANGELOG
- **Evidence:** [EVD-005](#auditing-methodology), [EVD-038](#auditing-methodology)
- **Recommendation:** [REC-003](#rec-003-clear-minimatch-advisories)

### FND-INF-002: No release tags

Zero git tags exist across 741 commits and roughly 25 released versions, so no immutable VCS.
Anchor marks released states.
- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Targets:** DEP-RELEASE, OPS-REVERT
- **Basis:** Inspected
- **Criteria:** DEP-RELEASE
- **Impact:** Reverting or bisecting a released state requires reconstruction from bump commits
- **Method:** `git tag` and version-commit census
- **Confidence:** High
- **Confirmation:** Yes - empty tag list verified
- **Mitigation:** Version-bump commits plus CHANGELOG give a recoverable path
- **Evidence:** [EVD-023](#auditing-methodology), [EVD-035](#auditing-methodology)
- **Recommendation:** [REC-004](#rec-004-tag-releases-in-vcs)

### FND-INF-003: No CI pipeline

No pipeline or workflow configuration exists in the tree.
Verification is enforced locally by the documented zero-error/zero-warning loop.
- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Targets:** DEP-PIPELINE, DEP-RELEASE, TST-GATE
- **Basis:** Inspected
- **Criteria:** DEP-PIPELINE
- **Impact:** No automated gate blocks a change landing with failing checks
- **Method:** Automation census over the tracked tree
- **Confidence:** High
- **Confirmation:** Yes - tree census found no CI configuration
- **Absence:** Deliberate - recorded decision (GUIDELINES.md conventions table)
- **Mitigation:** Documented local loop, re-executed clean during this audit
- **Evidence:** [EVD-036](#auditing-methodology), [EVD-039](#auditing-methodology)
- **Recommendation:** [REC-010](#rec-010-re-evaluate-no-ci-decision)

### FND-INF-004: Diverged branch accumulation

The tree holds 15 local branches beyond `main`.
Roughly 20 remote `broken/*`, `repair/*`, and `refactoring/*` branches also remain.
None carries a merge or deletion record.
- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Targets:** DLY-HYGIENE
- **Basis:** Inspected
- **Criteria:** DLY-HYGIENE
- **Impact:** History archaeology and branch-based recovery get harder as stale branches accumulate
- **Method:** `git branch -a` inventory
- **Confidence:** High
- **Confirmation:** Yes - branch census reproduced
- **Mitigation:** Archaeological residue, not active divergence
- **Evidence:** [EVD-023](#auditing-methodology)
- **Recommendation:** [REC-005](#rec-005-prune-diverged-branches)

### FND-INF-005: Single-author concentration

All of the last 200 non-merge commits carry one author identity.
Merge and review surfaces are minimal at 27 merges in 741 commits.
- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Concern
- **Targets:** DLY-BUSFACTOR, DLY-REVIEW
- **Basis:** Inspected
- **Criteria:** DLY-BUSFACTOR
- **Impact:** Knowledge, review, and release authority sit with one maintainer
- **Method:** Author-concentration census over non-merge commits
- **Confidence:** High
- **Confirmation:** Yes - census reproduced
- **Mitigation:** Extensive documentation set mitigates knowledge transfer
- **Evidence:** [EVD-023](#auditing-methodology)
- **Recommendation:** [REC-006](#rec-006-mitigate-continuity-concentration)

### FND-CPR-001: MPL-2.0 dev packages outside policy

The tree carries 12 MPL-2.0 packages in the lightningcss family.
All are dev-scoped build tooling.
They sit outside the `COPYRIGHTS.md` permitted-license list.
- **Pillar:** Copyrights & Originality
- **Severity:** Low
- **Type:** Observation
- **Targets:** CPR-DEPLIC
- **Basis:** Inspected
- **Criteria:** CPR-DEPLIC
- **Impact:** The declared license policy does not describe the real dependency set
- **Method:** Lockfile license census against the declared list
- **Confidence:** High
- **Confirmation:** Yes - census reproduced
- **Mitigation:** Build tooling only, no linking into the shipped work
- **Evidence:** [EVD-020](#auditing-methodology), [EVD-021](#auditing-methodology)
- **Recommendation:** [REC-007](#rec-007-reconcile-mpl-license-policy)

### FND-INF-006: Performance targets lack measurement

Declared quality targets - load under 2s, zero audio glitches, DOSOUND hardware compatibility -.
Carry no measurement artifact.
- **Pillar:** Infrastructure & CI/CD
- **Severity:** Low
- **Type:** Observation
- **Targets:** PRF-MEASURE
- **Basis:** Inspected
- **Criteria:** PRF-MEASURE
- **Impact:** Performance and hardware-fidelity claims rest on design evidence only
- **Method:** Artifact census for benchmarks and verification records
- **Confidence:** High
- **Confirmation:** Yes - no measurement artifact found in the tree
- **Mitigation:** Export byte-stability and worker timing mechanics are test-verified
- **Evidence:** [EVD-033](#auditing-methodology), [EVD-043](#auditing-methodology)
- **Recommendation:** [REC-011](#rec-011-measure-declared-performance-targets)

### FND-ARC-001: Composition-root concentration

The `App.tsx` file concentrates orchestration at 1108 lines.
It wires ~50 hooks with implicit cross-hook ordering.
The concentration is a documented known limitation.
- **Pillar:** Architecture & Design
- **Severity:** Medium
- **Type:** Concern
- **Targets:** ARC-RESP, ARC-ABSTRACT, ARC-COUPLING, MNT-DEBT, STR-PLACEMENT
- **Basis:** Inspected
- **Criteria:** MNT-DEBT
- **Impact:** Change navigation cost stays high and implicit hook ordering rules cause recorded
rework
- **Method:** File-size and import census, architecture document cross-check
- **Confidence:** High
- **Confirmation:** Yes - sizes and structure verified
- **Mitigation:** Documented trade-off, staged decomposition underway
- **Evidence:** [EVD-001](#auditing-methodology), [EVD-029](#auditing-methodology),
[EVD-037](#auditing-methodology)
- **Recommendation:** [REC-008](#rec-008-continue-composition-root-decomposition)

## Technical Debt Register

| Entry                                     | Category        | Source                                                     | Cost                                          |
|-------------------------------------------|-----------------|------------------------------------------------------------|-----------------------------------------------|
| [TDR-001](#tdr-001-composition-root-debt) | Maintainability | [FND-ARC-001](#fnd-arc-001-composition-root-concentration) | Navigation and change-analysis cost at wiring |

### TDR-001: Composition-root debt

The composition-root concentration in `App.tsx` and the large hook files is cost already.
Present, distinct from forward risks.
- **Category:** Maintainability
- **Source:** [FND-ARC-001](#fnd-arc-001-composition-root-concentration)
- **Cost:** Navigation and change-analysis effort at the wiring layer
- **Status:** In progress

## Unified Risk Register

| Risk                                             | Severity | Source                                                                 | Description                  |
|--------------------------------------------------|----------|------------------------------------------------------------------------|------------------------------|
| [RSK-001](#rsk-001-origin-privilege-inheritance) | Medium   | [FND-SEC-001](#fnd-sec-001-over-broad-file-origin-check)               | Origin-privilege inheritance |
| [RSK-002](#rsk-002-missing-quit-confirmation)    | Medium   | [FND-CQY-001](#fnd-cqy-001-dead-quit-confirm-modal-and-bypassed-guard) | Missing quit confirmation    |
| [RSK-003](#rsk-003-dev-tooling-advisories)       | Low      | [FND-INF-001](#fnd-inf-001-moderate-dependency-advisories)             | Dev tooling advisories       |
| [RSK-004](#rsk-004-continuity-concentration)     | Medium   | [FND-INF-005](#fnd-inf-005-single-author-concentration)                | Continuity concentration     |
| [RSK-005](#rsk-005-composition-root-change-cost) | Medium   | [FND-ARC-001](#fnd-arc-001-composition-root-concentration)             | Composition-root change cost |
| [RSK-006](#rsk-006-missing-release-anchors)      | Low      | [FND-INF-002](#fnd-inf-002-no-release-tags)                            | Missing release anchors      |
| [RSK-007](#rsk-007-accessibility-gap)            | Low      | [FND-CQY-002](#fnd-cqy-002-thin-accessibility-surface)                 | Accessibility gap            |

### RSK-001: Origin-privilege inheritance

A local file page could inherit app-origin privileges inside the packaged Electron window.
- **Severity:** Medium
- **Likelihood:** Low
- **Residual:** Medium
- **Impact:** Local file page gains midi permission and electronAPI surface
- **Trigger:** Renderer-side navigation to a file:// URL
- **Controls:** contextIsolation, nodeIntegration off, [CSP](#glossary-index), windowOpen deny
- **Closure:** [REC-002](#rec-002-narrow-file-origin-check)
- **Source:** [FND-SEC-001](#fnd-sec-001-over-broad-file-origin-check)
- **Confidence:** Medium
- **Mitigation:** Restrict isAppOrigin to the packaged index path

### RSK-002: Missing quit confirmation

A user quitting through the window close control loses the advertised unsaved-changes confirmation.
- **Severity:** Medium
- **Likelihood:** Moderate
- **Residual:** Low
- **Impact:** Unsaved-changes prompt never appears on window close
- **Trigger:** Window close with unsaved intent
- **Controls:** Autosave plus IndexedDB mirror
- **Closure:** [REC-001](#rec-001-wire-quit-confirm-modal)
- **Source:** [FND-CQY-001](#fnd-cqy-001-dead-quit-confirm-modal-and-bypassed-guard)
- **Confidence:** High
- **Mitigation:** Continuous autosave bounds the loss

### RSK-003: Dev tooling advisories

Build-time tooling retains known moderate advisories until upstream chains accept fixes.
- **Severity:** Low
- **Likelihood:** Low
- **Residual:** Low
- **Impact:** DoS-class advisory stays in build tooling
- **Trigger:** Upstream fix availability
- **Controls:** Dev-only scope, documented residual
- **Closure:** [REC-003](#rec-003-clear-minimatch-advisories)
- **Source:** [FND-INF-001](#fnd-inf-001-moderate-dependency-advisories)
- **Confidence:** High
- **Mitigation:** Re-check at each version bump

### RSK-004: Continuity concentration

Knowledge, review, and release authority concentrate on a single maintainer.
- **Severity:** Medium
- **Likelihood:** Low
- **Residual:** Medium
- **Impact:** Project stalls on maintainer unavailability
- **Trigger:** Single-author dependency
- **Controls:** Complete documentation set
- **Closure:** [REC-006](#rec-006-mitigate-continuity-concentration)
- **Source:** [FND-INF-005](#fnd-inf-005-single-author-concentration)
- **Confidence:** Medium
- **Mitigation:** Succession note, second contributor path

### RSK-005: Composition-root change cost

Composition-root concentration raises change cost and regression surface at the wiring layer.
- **Severity:** Medium
- **Likelihood:** Moderate
- **Residual:** Medium
- **Impact:** Regressions concentrate at the wiring layer
- **Trigger:** Cross-cutting change in App.tsx
- **Controls:** Domain-grouped hooks, staged decomposition
- **Closure:** [REC-008](#rec-008-continue-composition-root-decomposition)
- **Source:** [FND-ARC-001](#fnd-arc-001-composition-root-concentration)
- **Confidence:** High
- **Mitigation:** Continue decomposition per recorded focus areas

### RSK-006: Missing release anchors

No immutable VCS anchors mark released states.
- **Severity:** Low
- **Likelihood:** Low
- **Residual:** Low
- **Impact:** Released states need reconstruction for bisect or revert
- **Trigger:** Any revert or bisect need
- **Controls:** Version-bump commits plus CHANGELOG
- **Closure:** [REC-004](#rec-004-tag-releases-in-vcs)
- **Source:** [FND-INF-002](#fnd-inf-002-no-release-tags)
- **Confidence:** High
- **Mitigation:** Tag at bump

### RSK-007: Accessibility gap

Assistive-technology users face a degraded editing experience.
- **Severity:** Low
- **Likelihood:** Moderate
- **Residual:** Low
- **Impact:** Degraded experience for assistive-technology users
- **Trigger:** AT usage of the tracker UI
- **Controls:** Keyboard navigation order
- **Closure:** [REC-009](#rec-009-apply-accessibility-baseline)
- **Source:** [FND-CQY-002](#fnd-cqy-002-thin-accessibility-surface)
- **Confidence:** Medium
- **Mitigation:** Apply the adopted accessibility standard

## Scope Exclusions

- `docs/archive/`, `docs/change/`, `docs/plan/`, `docs/refactoring/`, `docs/review/`,
`docs/lesson/`, `docs/decision/`, `docs/prompt/`, `docs/feature/`, `docs/discard/` -
repository-declared read restrictions honored. - `node_modules/`, `dist/`, `release/`,
`playwright-report/`, `test-results/`, `work/` - gitignore-excluded generated and vendored trees.
- `docs/MAX.md` - externally managed specification, format reference only. - Penetration Test and
live-environment checks - no execution against a running target beyond the commissioned
non-mutating commands. - Changes Since Previous Audit - fresh audit mode, section omitted. - API
Contract Conformance - no API contract defined or consumed. - Skill Definition Conformance - no
authored SKILL.md in the subject. - AI System Assessment - no AI dependency. - API Compatibility
& Versioning Discipline - not a reusable library. - Contradiction Register - no external report
asserting conflicting claims. - Playwright e2e and production build - not in the commissioned
command set.

## Known Limitations

- The production build (`npm run build`) was not commissioned this run.
- Build correctness rests on inspected configuration and the documented loop.
- `npm run test:coverage` was not commissioned.
- The 80% thresholds are verified as configuration, not a measured result.
- `npm audit` advisory status reflects the 2026-11-10 registry state.
- The accessibility census is attribute-level.
- No assistive-technology session was run.
- Runtime performance targets - load time, glitch-free playback - are unmeasured.
- The `will-navigate` file:// path is a source-level trace.
- No navigation was demonstrated at runtime.

## Executed Evidence

| Check      | Command           | Tool / Version | Result | Interpretation                                                                                   |
|------------|-------------------|----------------|--------|--------------------------------------------------------------------------------------------------|
| Typecheck  | npm run typecheck | tsc (tsc -b)   | Pass   | Zero errors                                                                                      |
| Lint       | npm run lint      | eslint 10.14.0 | Pass   | Zero errors and zero warnings emitted                                                            |
| Unit tests | npm test          | vitest 4       | Pass   | 99 files, 786 tests passed in 7.2s                                                               |
| Advisory   | npm audit         | npm 11.20.0    | Fail   | 15 moderate advisories, dev-only, see [FND-INF-001](#fnd-inf-001-moderate-dependency-advisories) |

Procedure: all four commands ran inside an isolated copy at `work/isolation/audit-1.5/tree`.
The host ran Node v26.13.0, npm 11.20.0, on macOS.
Caches and output stayed inside the copy. An earlier run on an incomplete `node_modules` copy
failed for environment reasons, was repaired by a full dependency sync, and is excluded - only
the completed-run results count.

## Validation Protocol

| Row             | Result | Evidence / Justification                                                        |
|-----------------|--------|---------------------------------------------------------------------------------|
| PAR-1           | Pass   | SEC finding cites CWE-adjacent narrative, no [CWE](#glossary-index) map applies |
| PAR-2           | Pass   | Risk map states matrix-not-CVSS note                                            |
| PAR-3           | Pass   | ISO crosswalk used as mapping only in Scoring Rubrics                           |
| PAR-4           | Pass   | TDR separates cost from delay                                                   |
| PAR-5           | Pass   | Author concentration surfaced in Team & Continuity                              |
| PAR-6           | Pass   | Lockfile-derived [SBOM](#glossary-index) present                                |
| PAR-7           | Pass   | Known Limitations lists unperformed checks                                      |
| PAR-8           | Pass   | This table is present and complete                                              |
| PAR-9           | Pass   | Stack references re-derived this run                                            |
| PAR-10          | Pass   | Glossary Index present, identifiers linked                                      |
| PAR-11          | Pass   | Coverage table agrees with Scope Exclusions                                     |
| PAR-12          | Pass   | [SBOM](#glossary-index) license cells populated                                 |
| PAR-13          | Pass   | All ledger rows and findings carry Type tags                                    |
| PAR-14          | N/A    | No High or Critical security finding exists                                     |
| PAR-15          | Pass   | Delivery Practice carries proxies and bus-factor rating                         |
| PAR-16          | N/A    | English report                                                                  |
| PAR-17          | Pass   | Guidance artifacts inventoried in Guidance Conformance                          |
| PAR-18          | Pass   | Recommendation Classification lists every REC                                   |
| PAR-19          | Pass   | Guidance set listed with baseline                                               |
| PAR-20          | Pass   | Structure Review carries the five verdict rows                                  |
| PAR-21          | Pass   | Code Style present with tier T1                                                 |
| PAR-22          | Pass   | Style census rows carry denominators                                            |
| PAR-23          | Pass   | Basis names tier T1, census rows record pattern                                 |
| PAR-24          | Pass   | No naming-quality findings emitted                                              |
| PAR-25          | Pass   | Generated and vendored trees excluded from denominators                         |
| PAR-26          | Pass   | No bulk-rename recommendations                                                  |
| PAR-27          | N/A    | Linters commissioned under executed-commands, recorded as such                  |
| PAR-28          | Pass   | Probe and check reconciliation recorded in methodology                          |
| PAR-29          | Pass   | Read-depth table carries justifications                                         |
| PAR-30          | Pass   | Requirements Conformance enumerates all 27 rows                                 |
| PAR-31          | Pass   | Summary rows and blocks reconcile 1:1                                           |
| PAR-32          | Pass   | Detail level Detailed honored, no compression                                   |
| PAR-33          | Pass   | Fresh audit, single evidence ledger, no carried references                      |
| Parity baseline | Pass   | docs/archive/report/1.3.8/AUDIT-1.4.md recorded by path only                    |

## Remediation Roadmap

| Recommendation                                              | Priority | Finding                                                                | Effort |
|-------------------------------------------------------------|----------|------------------------------------------------------------------------|--------|
| [REC-001](#rec-001-wire-quit-confirm-modal)                 | P1       | [FND-CQY-ard](#fnd-cqy-001-dead-quit-confirm-modal-and-bypassed-guard) | S      |
| [REC-002](#rec-002-narrow-file-origin-check)                | P2       | [FND-SEC-eck](#fnd-sec-001-over-broad-file-origin-check)               | S      |
| [REC-003](#rec-003-clear-minimatch-advisories)              | P2       | [FND-INF-ies](#fnd-inf-001-moderate-dependency-advisories)             | S      |
| [REC-004](#rec-004-tag-releases-in-vcs)                     | P2       | [FND-INF-ags](#fnd-inf-002-no-release-tags)                            | XS     |
| [REC-005](#rec-005-prune-diverged-branches)                 | P3       | [FND-INF-ion](#fnd-inf-004-diverged-branch-accumulation)               | S      |
| [REC-006](#rec-006-mitigate-continuity-concentration)       | P3       | [FND-INF-ion](#fnd-inf-005-single-author-concentration)                | M      |
| [REC-007](#rec-007-reconcile-mpl-license-policy)            | P2       | [FND-CPR-icy](#fnd-cpr-001-mpl-20-dev-packages-outside-policy)         | XS     |
| [REC-008](#rec-008-continue-composition-root-decomposition) | P3       | [FND-ARC-ion](#fnd-arc-001-composition-root-concentration)             | L      |
| [REC-009](#rec-009-apply-accessibility-baseline)            | P3       | [FND-CQY-ace](#fnd-cqy-002-thin-accessibility-surface)                 | M      |
| [REC-010](#rec-010-re-evaluate-no-ci-decision)              | P4       | [FND-INF-ine](#fnd-inf-003-no-ci-pipeline)                             | M      |
| [REC-011](#rec-011-measure-declared-performance-targets)    | P3       | [FND-INF-ent](#fnd-inf-006-performance-targets-lack-measurement)       | M      |

### Recommendation Classification

| Recommendation                                              | Class       |
|-------------------------------------------------------------|-------------|
| [REC-001](#rec-001-wire-quit-confirm-modal)                 | Recommended |
| [REC-002](#rec-002-narrow-file-origin-check)                | Recommended |
| [REC-003](#rec-003-clear-minimatch-advisories)              | Recommended |
| [REC-004](#rec-004-tag-releases-in-vcs)                     | Recommended |
| [REC-005](#rec-005-prune-diverged-branches)                 | Optional    |
| [REC-006](#rec-006-mitigate-continuity-concentration)       | Optional    |
| [REC-007](#rec-007-reconcile-mpl-license-policy)            | Recommended |
| [REC-008](#rec-008-continue-composition-root-decomposition) | Recommended |
| [REC-009](#rec-009-apply-accessibility-baseline)            | Optional    |
| [REC-010](#rec-010-re-evaluate-no-ci-decision)              | Optional    |
| [REC-011](#rec-011-measure-declared-performance-targets)    | Optional    |

### REC-001: Wire quit-confirm modal

Wire the close path to the quit-confirm modal and confirm only on approval, or remove the dead.
Modal.
- **Priority:** P1
- **Finding:** [FND-CQY-001](#fnd-cqy-001-dead-quit-confirm-modal-and-bypassed-guard)
- **Condition:** Modal reachable on the close path
- **Impact:** Closes the readiness gate
- **Effort:** S
- **Complexity:** Low
- **Verification:** New component test plus manual Electron close-path check

### REC-002: Narrow file origin check

Compare the resolved file:// URL against the bundled index path instead of a bare scheme prefix.
- **Priority:** P2
- **Finding:** [FND-SEC-001](#fnd-sec-001-over-broad-file-origin-check)
- **Condition:** App-origin check admits only the packaged bundle
- **Impact:** Removes the origin-privilege inheritance path
- **Effort:** S
- **Complexity:** Low
- **Verification:** test/electron permissions test plus typecheck and lint

### REC-003: Clear minimatch advisories

Upgrade eslint, typescript-eslint, and electron-builder chains when fixed releases land.
Re-running npm audit at each bump.
- **Priority:** P2
- **Finding:** [FND-INF-001](#fnd-inf-001-moderate-dependency-advisories)
- **Condition:** Advisory count returns to zero or stays documented
- **Impact:** Clears the dev-tooling advisory set
- **Effort:** S
- **Complexity:** Low
- **Verification:** npm audit exits 0 or an updated residual note

### REC-004: Tag releases in VCS

Tag releases at bump so each version commit carries an immutable anchor.
- **Priority:** P2
- **Finding:** [FND-INF-002](#fnd-inf-002-no-release-tags)
- **Condition:** Each release carries a VCS tag
- **Impact:** Release archaeology and revert become anchored
- **Effort:** XS
- **Complexity:** Low
- **Verification:** git tag lists released versions

### REC-005: Prune diverged branches

Delete or archive the diverged broken, repair, and merge branches after content review.
- **Priority:** P3
- **Finding:** [FND-INF-004](#fnd-inf-004-diverged-branch-accumulation)
- **Condition:** Branch inventory holds only active lines
- **Impact:** Cleaner history navigation
- **Effort:** S
- **Complexity:** Low
- **Verification:** git branch -a shows only active branches

### REC-006: Mitigate continuity concentration

Record a succession note and optionally invite a second contributor for review-class work.
- **Priority:** P3
- **Finding:** [FND-INF-005](#fnd-inf-005-single-author-concentration)
- **Condition:** Continuity risk mitigated beyond documentation
- **Impact:** Reduces single-point continuity risk
- **Effort:** M
- **Complexity:** Medium
- **Verification:** Succession note committed, second-identity review evidence

### REC-007: Reconcile MPL license policy

Add MPL-2.0 to the permitted list scoped to dev-only build tooling, or replace the lightningcss.
Path.
- **Priority:** P2
- **Finding:** [FND-CPR-001](#fnd-cpr-001-mpl-20-dev-packages-outside-policy)
- **Condition:** License policy describes the real dependency set
- **Impact:** Policy and reality agree
- **Effort:** XS
- **Complexity:** Low
- **Verification:** COPYRIGHTS.md updated or dependency swapped

### REC-008: Continue composition-root decomposition

Continue staged App.tsx decomposition per the recorded focus areas.
- **Priority:** P3
- **Finding:** [FND-ARC-001](#fnd-arc-001-composition-root-concentration)
- **Condition:** Composition root shrinks toward the recorded target
- **Impact:** Lower change-analysis cost at the wiring layer
- **Effort:** L
- **Complexity:** Medium
- **Verification:** App.tsx size reduced with zero-diff export tests green

### REC-009: Apply accessibility baseline

Apply the adopted accessibility standard: roles, labels, focus indicators, aria-live for messages.
- **Priority:** P3
- **Finding:** [FND-CQY-002](#fnd-cqy-002-thin-accessibility-surface)
- **Condition:** Interactive surfaces meet the adopted baseline
- **Impact:** Restores the documented interaction floor
- **Effort:** M
- **Complexity:** Medium
- **Verification:** axe-style census or targeted component tests

### REC-010: Re-evaluate no-CI decision

Keep the local-gate convention with a documented re-evaluation cadence, or add a minimal pipeline.
- **Priority:** P4
- **Finding:** [FND-INF-003](#fnd-inf-003-no-ci-pipeline)
- **Condition:** The recorded decision stays current
- **Impact:** Keeps the gate decision deliberate
- **Effort:** M
- **Complexity:** Medium
- **Verification:** Recorded decision refreshed or pipeline present

### REC-011: Measure declared performance targets

Produce a measurement artifact for the declared performance targets.
- **Priority:** P3
- **Finding:** [FND-INF-006](#fnd-inf-006-performance-targets-lack-measurement)
- **Condition:** Targets carry measured evidence
- **Impact:** Converts design-only claims into verified ones
- **Effort:** M
- **Complexity:** Medium
- **Verification:** Benchmark or device-in-loop record committed

### Follow-up Plan

| Finding                                                                | Priority | Evidence                                     |
|------------------------------------------------------------------------|----------|----------------------------------------------|
| [FND-CQY-001](#fnd-cqy-001-dead-quit-confirm-modal-and-bypassed-guard) | P1       | Modal reachable on close path, test added    |
| [FND-SEC-001](#fnd-sec-001-over-broad-file-origin-check)               | P2       | file:// narrowed to bundle path, test added  |
| [FND-INF-001](#fnd-inf-001-moderate-dependency-advisories)             | P2       | npm audit exit 0 or updated residual note    |
| [FND-INF-002](#fnd-inf-002-no-release-tags)                            | P2       | git tag lists released versions              |
| [FND-CPR-001](#fnd-cpr-001-mpl-20-dev-packages-outside-policy)         | P2       | COPYRIGHTS.md updated or dependency replaced |

Audit-derived records enter through `docs/change/<version>/` per the
Audit-Driven Ring - no recommendation is implemented directly from this report.

## Reference Sources

- [ISO/IEC 25010:2023](https://www.iso.org/standard/78176.html) - quality model
  used as a coverage mapping only.
- [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) -
minimatch globparts amplification advisory behind
[FND-INF-001](#fnd-inf-001-moderate-dependency-advisories).
- [CWE-346 Origin Validation Error](https://cwe.mitre.org/data/definitions/346.html) -
  weakness class nearest the file-origin check.
- Mozilla Public License 2.0 - license class behind
[FND-CPR-001](#fnd-cpr-001-mpl-20-dev-packages-outside-policy).
- [DORA](#glossary-index) delivery metrics - proxy basis for the Delivery Practice section.

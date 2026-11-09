# DOSOUND Tracker Audit Report

## Document Information

|                    |                                                                                                       |
|--------------------|-------------------------------------------------------------------------------------------------------|
| Report Revision    | 1.4                                                                                                   |
| Report Date        | 2026-11-09                                                                                            |
| Report Style       | Audit                                                                                                 |
| Detail Level       | Detailed                                                                                              |
| Evaluation Scale   | 1-10                                                                                                  |
| Audit Purpose      | Engineering improvement                                                                               |
| Target Environment | Web browsers on static deployment plus unsigned Electron desktop builds for macOS, Windows, and Linux |
| Verification Scope | Static repository analysis - non-mutating commands executed                                           |
| Evidence Mode      | Executed commands                                                                                     |
| Subject Revision   | 7eb98158817ae79036a3f7d0b14c3c37b5d200de (branch main, dirty working tree)                            |
| Skill Version      | 2.8.1                                                                                                 |
| Time taken         | 25:33                                                                                                 |

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
- [Trade-off Analysis](#trade-off-analysis)
- [Threat Model](#threat-model)
- [Standards Conformance](#standards-conformance)
- [Baseline Conformance](#baseline-conformance)
- [Requirements Conformance](#requirements-conformance)
- [Structure Conformance](#structure-conformance)
- [Code Style](#code-style)
- [Guidance Conformance](#guidance-conformance)
- [Solution Comparison](#solution-comparison)
- [Strengths and What's Working](#strengths-and-whats-working)
- [Technical Findings](#technical-findings)
- [Unified Risk Register](#unified-risk-register)
- [Technical Debt Register](#technical-debt-register)
- [Scope Exclusions](#scope-exclusions)
- [Known Limitations](#known-limitations)
- [Executed Evidence](#executed-evidence)
- [Further Verification](#further-verification)
- [Remediation Roadmap](#remediation-roadmap)
- [Reference Sources](#reference-sources)

## Audit Coverage

| Report type                                             | Status    | Rationale                                                                        |
|---------------------------------------------------------|-----------|----------------------------------------------------------------------------------|
| Software Architecture Review                            | Covered   | Module boundaries, flows, coupling, and documented-decision drift                |
| Code Quality Audit                                      | Covered   | Defect census, test workflow, style, and stack conformance                       |
| Security Vulnerability Assessment                       | Covered   | Input surfaces, DOM sinks, Electron boundary, secrets, advisories                |
| Open Source License Compliance                          | Covered   | Manifest-derived [SBOM](#glossary-index) plus license census across the lockfile |
| Penetration Test                                        | Not done  | Separate engagement type                                                         |
| Performance Audit                                       | Partially | Source-level timing and allocation review only, no live profiling                |
| AI Governance Audit                                     | Partially | Authorship-provenance review of recorded AI-assisted workflow                    |
| Technical Due Diligence                                 | Partially | Engineering pillars covered, interview-based pillars not run                     |
| [SBOM](#glossary-index) / Software Composition Analysis | Covered   | 608-component manifest-derived inventory with license classification             |
| ISO/IEC 27001 Certification                             | Not done  | Certification is out of scope                                                    |
| SOC 2 Attestation Examination                           | Not done  | Attestation is out of scope                                                      |

## Glossary Index

| Term                                   | Definition                                                              |
|----------------------------------------|-------------------------------------------------------------------------|
| ASVS                                   | Application Security Verification Standard - OWASP security checklist   |
| CSP                                    | Content Security Policy - browser directive limiting resource origins   |
| CVE                                    | Common Vulnerabilities and Exposures - public vulnerability identifiers |
| CWE                                    | Common Weakness Enumeration - software weakness taxonomy                |
| DFD                                    | Data Flow Diagram - trust-boundary data movement map                    |
| DORA                                   | DevOps Research and Assessment - delivery-performance metric framework  |
| [EVD](#evd-evidence-identifier)        | Evidence identifier prefix used throughout this report                  |
| [FND](#fnd-finding-identifier)         | Finding identifier prefix used throughout this report                   |
| HTML                                   | HyperText Markup Language - page markup                                 |
| IDB                                    | IndexedDB - browser structured local database                           |
| IPC                                    | Inter-Process Communication - Electron main/renderer channel            |
| ISC                                    | Internet Systems Consortium permissive license                          |
| LFSR                                   | Linear Feedback Shift Register - YM2149 noise generator                 |
| MIDI                                   | Musical Instrument Digital Interface - note and control protocol        |
| NFR                                    | Non-Functional Requirement - quality constraint                         |
| NIST                                   | National Institute of Standards and Technology                          |
| OOM                                    | Out Of Memory - process-killing allocation pressure                     |
| OWASP                                  | Open Worldwide Application Security Project                             |
| [PAR](#par-protocol-audit-requirement) | Protocol Audit Requirement checklist identifier prefix                  |
| PRF                                    | Performance criteria prefix inside the criteria table                   |
| PSG                                    | Programmable Sound Generator - the YM2149 chip class                    |
| PWA                                    | Progressive Web App - offline-capable web application                   |
| [REC](#rec-recommendation-identifier)  | Remediation Roadmap identifier prefix                                   |
| RPO                                    | Recovery Point Objective - tolerable data loss measured as time         |
| [RSK](#rsk-risk-identifier)            | Unified Risk Register identifier prefix                                 |
| RTO                                    | Recovery Time Objective - tolerable restoration time                    |
| SBOM                                   | Software Bill of Materials - component inventory                        |
| SLO                                    | Service Level Objective - measurable service-quality target             |
| SPA                                    | Single-Page Application - client-rendered web app                       |
| SPDX                                   | Software Package Data Exchange - SBOM exchange format                   |
| [TDR](#tdr-debt-identifier)            | Technical Debt Register identifier prefix                               |
| VGM                                    | Video Game Music - logged chip-register audio format                    |
| WAV                                    | Waveform Audio File Format - uncompressed audio container               |
| YAML                                   | YAML Ain't Markup Language - the song and instrument persistence format |
| ZX0                                    | Optimal data compressor used by the MAX export                          |

**Identifier triplets**

| Triplet | Scope     | Description                                                 |
|---------|-----------|-------------------------------------------------------------|
| FND     | Findings  | Technical Findings identifier prefix (`FND-SEC-001`)        |
| EVD     | Evidence  | Evidence List identifier prefix (`EVD-001`)                 |
| RSK     | Risks     | Unified Risk Register identifier prefix (`RSK-001`)         |
| REC     | Roadmap   | Remediation Roadmap identifier prefix (`REC-001`)           |
| TDR     | Debt      | Technical Debt Register identifier prefix (`TDR-001`)       |
| PAR     | Checklist | Protocol Audit Requirement identifier prefix (`PAR-1`)      |
| FNC     | Criteria  | Functional Suitability criteria family                      |
| TST     | Criteria  | Testability criteria family                                 |
| ARC     | Criteria  | Design Soundness criteria and `FND-ARC-*` findings          |
| CQY     | Criteria  | Code Quality criteria and `FND-CQY-*` findings              |
| STY     | Criteria  | Code Style criteria                                         |
| STK     | Criteria  | Stack Alignment criteria                                    |
| DEP     | Criteria  | Dependency Health and Deployability criteria                |
| MNT     | Criteria  | Maintainability criteria                                    |
| STR     | Criteria  | Structure criteria and `FND-STR-*` findings                 |
| SCA     | Criteria  | Scalability criteria                                        |
| PRF     | Criteria  | Performance-measurement criterion                           |
| SEC     | Criteria  | Security criteria and `FND-SEC-*` findings                  |
| COM     | Criteria  | Compliance criteria                                         |
| OBS     | Criteria  | Observability criteria                                      |
| OPS     | Criteria  | Operational Safety criteria                                 |
| REL     | Criteria  | Backup and recovery criterion                               |
| DOC     | Criteria  | Documentation criteria                                      |
| CMP     | Criteria  | Contract compatibility and versioning criteria              |
| DLY     | Criteria  | Delivery and Continuity criteria                            |
| CPR     | Criteria  | Originality and Licensing criteria and `FND-CPR-*` findings |
| SKL     | Criteria  | Skill Definition and agent-guidance criteria                |
| INF     | Findings  | Infrastructure and CI/CD finding pillar code (`FND-INF-*`)  |
| AIP     | Findings  | AI Provenance finding pillar code (`FND-AIP-*`)             |

### EVD Evidence identifier

Every material observation carries an `EVD-NNN` identifier bound to the Evidence List in Auditing
Methodology, with an inspected or executed basis.

### FND Finding identifier

Findings number contiguously inside each pillar and carry severity, evidence, consequence,
and remediation linkage.

### PAR Protocol Audit Requirement

The internal consistency checklist (`PAR-1` through `PAR-27`) runs during report assembly.

### REC Recommendation identifier

Each `REC-NNN` names a postcondition, effort class, verification,
and priority mapped to its source finding.

### RSK Risk identifier

Risks record impact, likelihood, controls, and residual judgment derived from findings.

### TDR Debt identifier

Debt entries are deliberate trade-offs and accumulated implementation cost tracked
separately from defects.

## Executive Summary

| Field             | Value                                                                                       |
|-------------------|---------------------------------------------------------------------------------------------|
| System type       | codebase                                                                                    |
| Scope             | Full source tree, configuration, documentation, tests, git history of dosound-tracker 1.3.8 |
| Source basis      | inspected code, configuration, documentation, git history, commissioned executions          |
| Maturity level    | Production-ready                                                                            |
| **Overall score** | **6/10** (Average)                                                                          |

|                     |               |
|---------------------|---------------|
| Product Quality     | 8.3/10 (Good) |
| Engineering Process | 7.3/10 (Good) |

Product quality lowest dimension: Security 5/10, severity-capped.

Engineering process lowest dimension: Delivery & Continuity 4/10.

Overall score 6/10 derives as 0.7 x Product Quality plus 0.3 x Engineering Process (raw 8.0).

A severity ceiling 6 applies for the open High finding.

Lowest-scoring applicable dimension: Delivery & Continuity 4/10,
with Security capped at 5/10 by the severity rule.

DOSOUND Tracker is a browser and Electron chiptune tracker that emulates the YM2149 sound chip and
exports songs to Atari ST assembly, [VGM](#glossary-index), [WAV](#glossary-index),
MAX, and binary formats.

The codebase shows disciplined engineering: strict TypeScript with zero `any`,
a passing 532-test suite plus 12 e2e checks verified under this audit, a worker-driven sequencer,
a layered export pipeline, and an unusually thorough documentation corpus.

The dominant weaknesses are a confirmed unbounded input-expansion defect on the
[YAML](#glossary-index) and paste import paths,
a small but real spec-to-code drift on the song-format saver,
five copies of the preview-envelope engine,
and a deliberately accepted single-author continuity posture.

**Coverage and risk flags**

Nine risks were registered.

One rates High on the residual scale ([RSK-001](#rsk-001-renderer-freeze-or-oom-on-crafted-input)) ,
tied to the single High finding.

The audit found no Critical findings and one High-severity security finding
([FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)).

**Production Readiness Threshold**

A `Production-ready` state for an expanded distribution of imported content would require the P1
roadmap set closed: bounded input expansion
([REC-001](#rec-001-bound-run-length-expansion-and-cap-import-size)), Electron navigation
containment ([REC-002](#rec-002-add-navigation-containment-to-the-electron-shell)),
reconciled format documentation
([REC-003](#rec-003-reconcile-formatmd-with-the-emitted-saver-schema)), and pattern-name round-trip
preservation ([REC-004](#rec-004-persist-patternname-on-save)).

For its current personal-workstation distribution model the project is conditionally ready once
[FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers) closes,
since the defect is a local-input denial-of-service rather than a remote compromise.

Readiness state: `Conditionally ready` - every documented check was executed under this audit and
passes except `npm audit`, and the coverage gate is documented as an expected failure.

**Readiness Cost**

The readiness-cost verdict is `INSUFFICIENT INFORMATION` - no effort estimates, staffing,
or rate inputs were supplied.

The roadmap expresses remediation size as S/M/L effort bands only.

The largest known work items are consolidating the preview-engine duplication
([REC-006](#rec-006-consolidate-the-preview-envelope-engine)) and closing the coverage gap
([REC-022](#rec-022-close-the-coverage-gap-to-the-80-percent-threshold)).

## System Context

### Technology Stack

React 19.3.1, TypeScript 5.9.3 strict, rolldown-vite 7.3.1 (aliased as `vite`), Zustand 5.0.16,
Electron 45.2.1, js-yaml 4.3.2, lucide-react 1.67.0, Vitest 4.1.12 plus Playwright 1.64.1.

### Renderer And Orchestration

Single-page React application orchestrated by `src/App.tsx` (1143 lines) wiring 40 hook call sites.

One Zustand store holds three UI fields.

Audio-relevant state lives in hook-local refs to keep the render path off the audio path.

### Audio Engine

The `src/workers/sequencerWorker.ts` worker owns timing and playlist math and posts tick messages.

The `src/synth/YM2149.ts` module (511 lines) emulates the [PSG](#glossary-index)
over the Web Audio API, driven per tick by `useSequencerIntegration`.

### Export Pipeline

The `src/exports/` tree produces assembly, binary, MAX (ZX0-compressed), [VGM](#glossary-index),
and [WAV](#glossary-index) output from a shared `core.ts` normalizer.

### Desktop Shell

The `electron/` tree is three files: hardened `main.cjs`, an origin-pinned `permissions.cjs`,
and a five-method `preload.cjs`.

### Persistence And Content

The `localStorage` store holds twenty `dosound-tracker-*` keys mirrored to an
IndexedDB snapshot store.

Bundled songs, instruments, and documentation ship under `public/` and are fetched
through allowlisted paths.

## Software Bill of Materials

This is a manifest-derived component inventory at the audited revision,
not a shipped-artifact [SBOM](#glossary-index) and not a claim of [SPDX](#glossary-index)
or CycloneDX conformance.

| Component                  | Version   | License                   | Risk   | Advisory        | Source                          |
|----------------------------|-----------|---------------------------|--------|-----------------|---------------------------------|
| js-yaml                    | 4.3.2     | MIT                       | None   | None identified | package.json, package-lock.json |
| lucide-react               | 1.67.0    | [ISC](#glossary-index)    | None   | None identified | package.json, package-lock.json |
| react                      | 19.3.1    | MIT                       | None   | None identified | package.json, package-lock.json |
| react-dom                  | 19.3.1    | MIT                       | None   | None identified | package.json, package-lock.json |
| zustand                    | 5.0.16    | MIT                       | None   | None identified | package.json, package-lock.json |
| argparse (via js-yaml)     | 2.0.1     | Python-2.0                | Review | None identified | package-lock.json               |
| scheduler (via react)      | 0.28.0    | MIT                       | None   | None identified | package-lock.json               |
| electron                   | 45.2.1    | MIT                       | None   | None identified | package.json, package-lock.json |
| electron-builder           | 26.18.0   | MIT                       | None   | Mitigated       | package.json, package-lock.json |
| vite (rolldown-vite alias) | 7.3.1     | MIT                       | None   | None identified | package.json, package-lock.json |
| typescript                 | 5.9.3     | Apache-2.0 (field absent) | Review | None identified | package.json, package-lock.json |
| vitest                     | 4.1.12    | MIT                       | None   | None identified | package.json, package-lock.json |
| @playwright/test           | 1.64.1    | Apache-2.0                | None   | None identified | package.json, package-lock.json |
| eslint                     | 9.39.5    | MIT                       | None   | None identified | package.json, package-lock.json |
| typescript-eslint          | 8.72.1    | MIT                       | None   | Mitigated       | package.json, package-lock.json |
| jsdom                      | 30.1.3    | MIT                       | None   | None identified | package.json, package-lock.json |
| prettier                   | 3.9.10    | MIT                       | None   | None identified | package.json, package-lock.json |
| zx0.ts (vendored)          | 1.2.7-era | BSD-3-Clause              | None   | Not checked     | src/utils/compression/zx0.ts    |

608 resolved packages total, 7 in the production closure, 599 dev-scoped.

Advisory check: `npm audit` executed under this audit,
12 moderate advisories in dev-only transitive chains.

## License Compliance

The project ships MIT (`LICENSE`, copyright 2025 Zoltar X / New Generation)
and `docs/COPYRIGHTS.md` declares a permitted-license whitelist.

Every production-chain package resolves to a whitelisted class except `argparse@2.0.1` carrying
`Python-2.0`, the sole off-whitelist license in the prod closure
([FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist)).

No GPL, LGPL, AGPL, or MPL appears anywhere in the lockfile.

Notable dev licenses are [ISC](#glossary-index) (`lucide-react`) and Apache-2.0 (`@playwright/test`,
`typescript` upstream).

Four direct packages carry no license field in lockfile metadata - an underivable
[SBOM](#glossary-index) field: `eslint-plugin-react-refresh`, `typescript`, `@types/js-yaml`,
plus transitives `react-is`, `react-refresh`, `lz-string`, `chalk`, `csstype`.

The single vendored file `src/utils/compression/zx0.ts` retains its required BSD-3-Clause notice and
is documented in `docs/COPYRIGHTS.md`.

Copyright attribution is inconsistent between `LICENSE` (2025, Zoltar X)
and the electron-builder `copyright` field (2024, Filip Golewski) -
[FND-CPR-002](#fnd-cpr-002-copyright-attribution-inconsistency).

## Health Dashboard

**Risk Map**

| Severity | Count | Identifiers                                                                                                                                                                                                          |
|----------|-------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| HIGH     | 1     | [RSK-001](#rsk-001-renderer-freeze-or-oom-on-crafted-input)                                                                                                                                                          |
| MEDIUM   | 3     | [RSK-002](#rsk-002-remote-content-executes-inside-an-application-window), [RSK-003](#rsk-003-external-importers-produce-incompatible-files), [RSK-004](#rsk-004-preview-engines-diverge-silently-across-five-copies) |
| MEDIUM   | 2     | [RSK-006](#rsk-006-total-continuity-loss-on-a-single-event), [RSK-007](#rsk-007-silent-user-data-loss-on-saveload)                                                                                                   |
| LOW      | 3     | [RSK-005](#rsk-005-build-time-dos-surface-stays-unpatched), [RSK-008](#rsk-008-deleted-song-resurrects-from-the-mirror), [RSK-009](#rsk-009-shipped-dependency-under-unreviewed-license-class)                       |

[RSK-001](#rsk-001-renderer-freeze-or-oom-on-crafted-input) is the only High residual,
bounded to the local import surface.

[RSK-006](#rsk-006-total-continuity-loss-on-a-single-event) is the only owner-accepted risk.

Team continuity is 100 percent single-author delivery, owner-accepted, with no named successor.

| Area                   | Rating   | Key evidence                                                                                                                                                                                                                      |
|------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Documentation          | Strong   | 12-file source-of-truth corpus plus per-version change, plan, and review records - mostly synchronized ([FND-ARC-002](#fnd-arc-002-formatmd-and-architecturemd-drift-from-shipped-behavior))                                      |
| Test suite             | Adequate | 532 unit tests and 12 e2e checks pass under execution, coverage gate documented as an expected failure ([EVD-001](#evidence-list))                                                                                                |
| Security posture       | Adequate | Deny-by-default permissions, escape-first markdown, build-time [CSP](#glossary-index), no telemetry - one confirmed expansion defect ([FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)) |
| Build & release        | Weak     | No [CI](#glossary-index), no tags, unsigned artifacts - published SHA256 manifests only                                                                                                                                           |
| Dependency hygiene     | Adequate | Lockfile v3, permissive license set, one production-chain license outside the declared whitelist ([FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist))                                       |
| Contributor continuity | Fragile  | 100 percent single-author delivery, owner-accepted, no named successor ([FND-INF-007](#fnd-inf-007-single-author-bus-factor-accepted))                                                                                            |

**Legend**

| Band      | Score |
|-----------|-------|
| Excellent | 9-10  |
| Good      | 7-8   |
| Average   | 4-6   |
| Poor      | 1-3   |

**Scorecard Summary**

| Dimension               | Score |
|-------------------------|-------|
| Functional Suitability  | 9/10  |
| Testability             | 8/10  |
| Design Soundness        | 7/10  |
| Code Quality            | 7/10  |
| Code Style              | 9/10  |
| Stack Alignment         | 9/10  |
| Dependency Health       | 8/10  |
| Maintainability         | 8/10  |
| Structure               | 10/10 |
| Deployability           | 9/10  |
| Scalability             | 8/10  |
| Security                | 5/10  |
| Compliance              | 8/10  |
| Observability           | 10/10 |
| Operational Safety      | 10/10 |
| Documentation           | 10/10 |
| API Compatibility       | 8/10  |
| Delivery & Continuity   | 4/10  |
| Originality & Licensing | 8/10  |
| Skill Definition        | 10/10 |

## Delivery Practice

The audited clone is a secondary working copy: 67 local commits on `main`, zero merge commits,
all fast-forward pulls, every commit attributed to one author.

Upstream history is larger, the repository was created 2025-11-17 and reached version 1.3.8 over
roughly twelve months.

Release anchoring lives outside git tags (zero tags exist) : `package.json` version,
`public/CHANGELOG.md` (38 entries), `scripts/bump-version.mjs`,
and `release/` artifacts with `SHA256SUMS-<platform>.txt` files.

The release gate `scripts/release-check.sh` enforces change-record pairing and review presence,
though it warns rather than fails on missing reviews - one released window (1.3.6)
lacks its review record.

Commit hygiene is mostly clean: zero conventional prefixes, but one `.` subject,
four bare `package-lock.json` subjects, multi-clause mega-subjects,
and one leaked agent prompt as a commit message.

[DORA](#glossary-index) proxies are all `NOT SPECIFIED`: no tags, no deployment records,
no incident data, no lead-time measurement.

| Continuity element    | State                                                                |
|-----------------------|----------------------------------------------------------------------|
| Contributor diversity | 100 percent single author, High concentration, owner-accepted        |
| Release anchoring     | No git tags, changelog plus version script plus checksum manifests   |
| Knowledge records     | Strong `docs/` corpus with per-version change, plan, and review dirs |
| CI/CD                 | None - evaluated and declined per `docs/GUIDELINES.md`               |
| Onboarding            | README plus `docs/` set are complete and navigable                   |

## High-Level Observations

- The verification culture is real: 532 unit tests, 12 e2e checks, a type-checked build,
  and a zero-warning lint all passed under commissioned execution - but the `typecheck` script is a
  documented no-op and large UI surfaces sit below the 80 percent coverage target
  ([FND-CQY-007](#fnd-cqy-007-configured-80-percent-coverage-threshold-is-unmet),
  [FND-INF-004](#fnd-inf-004-static-analysis-scope-excludes-configs-e2e-and-electron-code)).
- The audio-domain architecture is honest about its trade-offs - a 1143-line orchestrator,
  prop mirroring, sparse hook dependencies - but the five-times-duplicated preview-envelope engine
  is undocumented debt that will diverge
  ([FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks)).
- The security posture is strong for a local app - deny-by-default permissions,
  escape-first markdown, build-time [CSP](#glossary-index),
  no telemetry - except for one confirmed unbounded expansion defect on the import paths
  ([FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)).
- The documentation corpus is exceptional and mostly synchronized,
  yet the shipped saver emits keys the format spec does not document,
  so external importers would write a different dialect than the saver produces
  ([FND-ARC-002](#fnd-arc-002-formatmd-and-architecturemd-drift-from-shipped-behavior)).
- Delivery is fast and convention-driven (38 version bumps in twelve months)
  but anchored by neither tags nor CI, and every artifact is unsigned - mitigated only by published
  SHA256 manifests ([FND-INF-007](#fnd-inf-007-single-author-bus-factor-accepted)).
- License hygiene is disciplined at the policy level and nearly clean in practice,
  with exactly one production-chain license (argparse Python-2.0)
  outside the declared whitelist
  ([FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist)).

## Auditing Methodology

This audit was produced by the Lens skill (`lens-skill`, version 2.8.1)
in `executed-commands` evidence mode.

Source, configuration, documentation, and git history were inspected,
and five commissioned non-mutating commands ran inside an isolated copy at `work/isolation/`.

This audit inspected 171 production source files, 78 test files, and the committed configuration,
manifest, and documentation surface of a single-project repository,
applying `.gitignore` exclusions.

Git history was examined through reflog, branch, tag, packed-refs, and message census.

The audit uses evidence-based reasoning across 19 core assessment categories grouped into seven
pillars, plus conditional assessments (data flow, threat model, agent guidance,
standards conformance, requirements conformance, baseline conformance, naming and layout)
applied where the subject warrants them,
and the conditional contract-compatibility pillar applied to the declared file-format surface.

- **Architecture & Design** - Design principles, maintainability, change management, documentation,
  non-functional requirements
- **Structure & Organization** - Directory layout, file placement, naming conventions,
  component boundaries, supporting artifacts
- **Code Quality** - Testing, code quality, stack best practices
- **Security & Compliance** - Security, compliance and data protection
- **Infrastructure & CI/CD** - Dependencies, deployment, rollback, observability, error handling,
  operational readiness
- **AI Provenance & Code Origin** - Explicit attribution, generated-artifact validation,
  and SDLC evidence, without authorship inference from style
- **Copyrights & Originality** - Code originality, license compliance, attribution,
  dependency license compatibility
- **API Compatibility & Versioning Discipline** - applied here to the declared file-format contracts
  rather than a library API

Six read-only scout roles ran in parallel (file-inventory, architecture, context/tests,
security-trace, delivery, dependencies).

The parent agent performed the commissioned executions, the model build, and all synthesis.

Scout reports landed verbatim under `work/` before folding.

**Reference standards**

- **ISO/IEC 25010:2023** - product-quality coverage via the scorecard crosswalk,
  not an ISO scoring formula
- **OWASP ASVS 5.0.0** - selected controls for input validation and client-side surfaces
- **OWASP Top 10 (2025)** - security category coverage
- **CWE-400** - weakness classification for the expansion defect
- **NIST SP 800-30** - risk assessment process for the risk register
- **STRIDE** - threat enumeration for the conditional threat model
- **CISQ / SQALE** - technical-debt cost model for the debt register
- **ISO 19011 and NIST RMF** - follow-up and monitoring practices for the re-audit plan
- **ECMAScript specification, React documentation, Electron security guidelines,
  MDN Web Docs** - stack-specific canonical sources

### Read-depth

| Area               | Files | Read depth |
|--------------------|-------|------------|
| src/ (all domains) | 171   | Full read  |
| test/              | 78    | Sampled    |
| e2e/               | 2     | Full read  |
| electron/          | 3     | Full read  |
| scripts/           | 5     | Full read  |
| docs/ (active set) | 24    | Full read  |
| docs/ (restricted) | ~330  | Listed     |
| public/            | 25    | Sampled    |
| package.json, lock | 2     | Full read  |

Test files were stratified-sampled (11 read fully across domains plus a full name census)
since the suite census covers the probe floor.

Restricted doc directories were enumerated by filename only per the repository's own
read-restriction rules.

### Criteria table

The frozen criteria set renders per `references/criteria-catalogue.md` v4 (99 criteria
across 20 dimensions).

Rows marked `Not applicable` carry deployment-model justifications (single-user local app:
no credentials, public endpoints, personal-data processing, multi-actor audit trail,
health-signal surface, alert channel, or authored skills).

| Criteria      | Family                  | Applicability           | Criticality | Method                        | Sufficiency            |
|---------------|-------------------------|-------------------------|-------------|-------------------------------|------------------------|
| FNC-REQ       | Functional Suitability  | Requirements doc        | Critical    | Requirements registry grading | All mandatory graded   |
| FNC-JOURNEY   | Functional Suitability  | Advertised workflows    | High        | Journey trace per workflow    | Every core workflow    |
| FNC-STUB      | Functional Suitability  | Advertised capabilities | High        | Shipped-surface census        | Zero stubs             |
| FNC-DEFECT    | Functional Suitability  | In-scope source         | High        | Defect-pattern census         | Complete census        |
| FNC-CONTRACT  | Functional Suitability  | Declared contracts      | Medium      | Spec-conformance diff         | Every declared element |
| TST-WFLOW     | Testability             | Advertised workflows    | High        | Verification-coverage map     | Every workflow named   |
| TST-FAILPATH  | Testability             | Error branches          | Medium      | Failure-path index            | Advertised paths       |
| TST-ASSERT    | Testability             | Test suites             | Medium      | Assertion-depth sample        | Stratified sample      |
| TST-ISO       | Testability             | Test doubles            | Medium      | Test-double inventory         | All doubles listed     |
| TST-GATE      | Testability             | Automation signals      | Medium      | Pipeline definition census    | Every trigger          |
| ARC-RESP      | Design Soundness        | Organization model      | High        | Responsibility inventory      | Every module           |
| ARC-ABSTRACT  | Design Soundness        | Cross-boundary edges    | Medium      | Dependency-edge census        | Every edge             |
| ARC-COUPLING  | Design Soundness        | Producer-consumer edges | Medium      | Edge census                   | All edges              |
| ARC-DRY       | Design Soundness        | Responsibility set      | Medium      | Duplication count             | Census complete        |
| ARC-PATTERN   | Design Soundness        | Recurring structures    | Low         | Pattern inventory             | Named patterns         |
| CQY-ANALYSIS  | Code Quality            | Analyzer configs        | Medium      | Config and toolchain review   | Each config            |
| CQY-COMPLEX   | Code Quality            | Production source       | Medium      | Complexity estimate           | Hotspot census         |
| CQY-DUP       | Code Quality            | Production source       | High        | Near-duplicate scan           | Whole source           |
| CQY-DEAD      | Code Quality            | Exported surface        | Medium      | Dead-code census              | Exported surface       |
| CQY-ERRH      | Code Quality            | Error boundaries        | Medium      | Catch-block census            | Whole source           |
| STY-CONSIST   | Code Style              | Naming partitions       | Medium      | Identifier-shape census       | Each partition         |
| STY-VOCAB     | Code Style              | Concept terms           | Low         | Vocabulary census             | Term pairs             |
| STY-NAMING    | Code Style              | Module names            | Medium      | Naming-quality sample         | Every top-level module |
| STY-READ      | Code Style              | Comments and markers    | Low         | Comment and TODO census       | Whole source           |
| STY-ENFORCE   | Code Style              | Declared style rules    | Low         | Enforcement diff              | Declared rules         |
| STK-IDIOM     | Stack Alignment         | Every partition         | Medium      | Foreign-idiom census          | Per partition          |
| STK-FRAME     | Stack Alignment         | Detected frameworks     | High        | Capability census             | Per framework          |
| STK-LIB       | Stack Alignment         | Hand-rolled sites       | Medium      | Implementation census         | Every site             |
| STK-CURRENT   | Stack Alignment         | Toolchain floor         | Medium      | Manifest floor resolution     | Each partition         |
| STK-ANTIPAT   | Stack Alignment         | Convention classes      | Low         | Anti-pattern checks           | Per partition          |
| DEP-PIN       | Dependency Health       | Manifests               | High        | Pin classification            | Each declaration       |
| DEP-ADVISORY  | Dependency Health       | Resolved components     | High        | Advisory triage               | Each component         |
| DEP-INVENT    | Dependency Health       | Dependency tree         | Medium      | Ecosystem readers             | Full inventory         |
| DEP-DECLARE   | Dependency Health       | Declared vs imported    | Medium      | Import census                 | Each declaration       |
| DEP-META      | Dependency Health       | Manifest metadata       | Low         | Metadata fields check         | Each manifest          |
| DEP-LIFECYCLE | Dependency Health       | Declared targets        | Medium      | Target census                 | Each target            |
| MNT-DEBT      | Maintainability         | Debt markers            | Medium      | Untracked debt census         | Whole source           |
| MNT-GOV       | Maintainability         | Change records          | Medium      | Record pairing census         | Change windows         |
| MNT-VERSION   | Maintainability         | Version history         | Low         | Manifest-vs-tag compare       | History window         |
| STR-ORG       | Structure               | Whole tree              | High        | Organization model            | Every partition        |
| STR-NAME      | Structure               | Naming baselines        | Medium      | Naming-baseline resolution    | Each partition         |
| STR-DIVIDE    | Structure               | File division           | Medium      | Division census               | Per partition          |
| STR-PLACEMENT | Structure               | Placement rules         | Medium      | Tree census                   | Per component          |
| STR-REG       | Structure               | Manifest registration   | Low         | On-disk vs manifest diff      | Each manifest          |
| DEP-BUILD     | Deployability           | Build definitions       | High        | Build census                  | Each component         |
| DEP-CONFIG    | Deployability           | Runtime config keys     | High        | Config census                 | Every key              |
| DEP-DEFAULTS  | Deployability           | Shipped defaults        | High        | Defaults sweep                | Every default          |
| DEP-RUNPATH   | Deployability           | Documented commands     | Medium      | Command resolution            | Every command          |
| DEP-PIPELINE  | Deployability           | Automation signals      | High        | Pipeline census               | Each definition        |
| DEP-RELEASE   | Deployability           | Release path            | High        | Release trace                 | Each artifact          |
| SCA-TARGET    | Scalability             | Declared NFRs           | High        | [NFR](#glossary-index) census | Every target           |
| SCA-MODEL     | Scalability             | Shared state            | High        | Mutable-state trace           | Every consumer         |
| SCA-BOUNDS    | Scalability             | Resource consumers      | High        | Bounds census                 | Each consumer          |
| PRF-MEASURE   | Scalability             | Declared targets        | Medium      | Target-measurement pairing    | Every target           |
| SEC-AUTHZ     | Security                | Entry points            | Critical    | Operation matrix              | Every entry point      |
| SEC-INPUT     | Security                | Input surfaces          | High        | Taint census                  | Every surface          |
| SEC-SESS      | Security                | Not applicable          | High        | No credentials or sessions    | N/A                    |
| SEC-ABUSE     | Security                | Not applicable          | High        | No public endpoints           | N/A                    |
| SEC-SECRET    | Security                | Tracked tree            | Critical    | Secret-shape census           | Whole tree             |
| SEC-THREAT    | Security                | Boundaries              | High        | Boundary census               | Every boundary         |
| COM-INVENT    | Compliance              | Data categories         | Medium      | Data census                   | Every category         |
| COM-RETENT    | Compliance              | Persistence stores      | High        | Bound and deletion checks     | Each store             |
| COM-RIGHTS    | Compliance              | Not applicable          | High        | No personal-data processing   | N/A                    |
| COM-AUDIT     | Compliance              | Not applicable          | High        | Single-user local app         | N/A                    |
| COM-CONSENT   | Compliance              | Outbound paths          | Medium      | Outbound census               | Every path             |
| OBS-LOG       | Observability           | Failure paths           | High        | Logging census                | Every path             |
| OBS-METRIC    | Observability           | Not applicable          | High        | No health-signal surface      | N/A                    |
| OBS-TRACE     | Observability           | Boundaries              | Medium      | Identifier trace              | Each identifier        |
| OBS-ALERT     | Observability           | Not applicable          | High        | No alert channel exists       | N/A                    |
| OPS-RETRY     | Operational Safety      | Dependency calls        | High        | Timeout census                | Each call site         |
| OPS-ERR       | Operational Safety      | Boundaries              | High        | Exception census              | Each boundary          |
| OPS-SHUT      | Operational Safety      | Long-running entries    | High        | Lifecycle census              | Each entry point       |
| REL-BACKUP    | Operational Safety      | Authoritative stores    | High        | Store classification          | Each store             |
| OPS-REVERT    | Operational Safety      | Version pinning         | High        | Revert trace                  | Each artifact          |
| OPS-RUNBOOK   | Operational Safety      | Operator surface        | Medium      | Runbook census                | Each need              |
| DOC-EXIST     | Documentation           | Committed docs          | High        | Documentation census          | Whole set              |
| DOC-SYNC      | Documentation           | Documented claims       | High        | Claim verification            | Every quantitative     |
| DOC-ARCH      | Documentation           | Significant decisions   | Medium      | Decision census               | Each decision          |
| DOC-OPER      | Documentation           | Operator lifecycle      | High        | Operator surface census       | Each phase             |
| DOC-API       | Documentation           | Public interface        | Medium      | Interface census              | Each contract          |
| CMP-SURFACE   | Contract Compatibility  | Declared surface        | High        | Surface census                | Each export            |
| CMP-GATE      | Contract Compatibility  | Release paths           | High        | Gate census                   | Each path              |
| CMP-VERSION   | Contract Compatibility  | Version scheme          | Medium      | Scheme trace                  | Each bump              |
| CMP-DEPREC    | Contract Compatibility  | Deprecation markers     | High        | Marker census                 | Each marker            |
| CMP-DRIFT     | Contract Compatibility  | Stable surface          | High        | Baseline diff                 | Each element           |
| DLY-CADENCE   | Delivery & Continuity   | Version history         | Medium      | Tag and release census        | Each release           |
| DLY-BUSFACTOR | Delivery & Continuity   | Commit authors          | High        | Author-concentration census   | Whole window           |
| DLY-HYGIENE   | Delivery & Continuity   | Commit hygiene          | Low         | Message census                | History window         |
| DLY-REVIEW    | Delivery & Continuity   | Review records          | Medium      | Review pairing                | Each window            |
| CPR-LICENSE   | Originality & Licensing | License files           | High        | License census                | Each file              |
| CPR-DEPLIC    | Originality & Licensing | Dependency inventory    | High        | License classification        | Each component         |
| CPR-NOTICE    | Originality & Licensing | Vendored trees          | Medium      | Notice census                 | Each artifact          |
| CPR-ORIGIN    | Originality & Licensing | Foreign markers         | High        | Origin census                 | Whole tree             |
| SKL-FRONT     | Skill Definition        | Not applicable          | High        | No authored SKILL.md          | N/A                    |
| SKL-DISC      | Skill Definition        | Not applicable          | Medium      | No authored skills            | N/A                    |
| SKL-CFG       | Skill Definition        | Not applicable          | Medium      | No agent-config artifacts     | N/A                    |
| SKL-GUIDE     | Skill Definition        | Guidance set present    | Medium      | Guidance trace                | Entry routes           |
| SKL-SEC       | Skill Definition        | Not applicable          | High        | No bundled skill files        | N/A                    |
| SKL-COLL      | Skill Definition        | Not applicable          | Low         | Single project, no collection | N/A                    |

### Key Measurements

| Measurement                        | Value | Evidence                  |
|------------------------------------|-------|---------------------------|
| Production source files            | 171   | [EVD-007](#evidence-list) |
| Test files                         | 78    | [EVD-007](#evidence-list) |
| Documentation files                | 359   | [EVD-007](#evidence-list) |
| Unit tests executed                | 532   | [EVD-001](#evidence-list) |
| E2E checks executed                | 12    | [EVD-006](#evidence-list) |
| Resolved dependency packages       | 608   | [EVD-021](#evidence-list) |
| Production dependency closure      | 7     | [EVD-021](#evidence-list) |
| Advisory findings (npm audit)      | 12    | [EVD-005](#evidence-list) |
| `dangerouslySetInnerHTML` sinks    | 2     | [EVD-032](#evidence-list) |
| localStorage keys                  | 20    | [EVD-017](#evidence-list) |
| Largest code file (App.tsx, lines) | 1143  | [EVD-015](#evidence-list) |
| `any`/`as any` occurrences         | 0     | [EVD-035](#evidence-list) |
| Silent catch sites (approx.)       | ~62   | [EVD-016](#evidence-list) |
| Preview-engine implementations     | 5     | [EVD-014](#evidence-list) |
| Untested hooks                     | ~35   | [EVD-026](#evidence-list) |
| Version bumps in CHANGELOG         | 38    | [EVD-029](#evidence-list) |
| Git tags                           | 0     | [EVD-029](#evidence-list) |

### Reproducing The Census

```
fd -t f . src | wc -l && fd -t f . test e2e | wc -l && fd -t f . docs | wc -l
rg -c 'dangerouslySetInnerHTML' src
rg -n 'space|wait|off\s*:' src/utils/song/songParser.ts src/utils/track/trackClipboard.ts
rg -c 'catch' src && rg -c ': any|as any' src
npm test && npm run typecheck && npm run lint && npm run build && npm audit && npm run test:e2e
git log --format=%s | head -50 && git tag -l && git shortlog -sne --all
```

### Evidence List

| Evidence | Source                              | Result                                                                  | Type        | Artifact                           |
|----------|-------------------------------------|-------------------------------------------------------------------------|-------------|------------------------------------|
| EVD-001  | `npm test` (vitest 4.1.12)          | Pass - 72 files, 532 tests, 0 failures                                  | Observation | Executed in work/isolation         |
| EVD-002  | `npm run typecheck` (tsc 5.9.3)     | Pass - exit 0, vacuous by design (`files:[]`)                           | Observation | tsconfig.json                      |
| EVD-003  | `npm run lint` (eslint 9.39.5)      | Pass - 0 errors, 0 warnings                                             | Observation | eslint.config.js                   |
| EVD-004  | `npm run build` (rolldown-vite)     | Pass - 2218 modules, no warnings, real type gate                        | Observation | dist/ in work/isolation            |
| EVD-005  | `npm audit` (npm 11.20.0)           | Fail - 12 moderate minimatch advisories, dev-only                       | Concern     | package-lock.json                  |
| EVD-006  | `npm run test:e2e` (playwright)     | Pass - 12 of 12 across chromium and webkit                              | Observation | e2e/smoke.spec.ts                  |
| EVD-007  | Structure census                    | 666 tracked files: 171 prod, 78 test, 359 docs                          | Observation | Tree census                        |
| EVD-008  | `songParser.ts:262-292`             | Unbounded `space/wait/off:N` run expansion                              | Concern     | src/utils/song/songParser.ts       |
| EVD-009  | `trackClipboard.ts:180-201`         | Same unbounded expansion in paste path                                  | Concern     | src/utils/track/trackClipboard.ts  |
| EVD-010  | `electron/main.cjs`                 | Hardened flags on, no navigation containment                            | Concern     | electron/main.cjs:15-92            |
| EVD-011  | `songIO.ts:149-283`                 | Writer/parser key asymmetry, Pattern.name dropped                       | Concern     | src/utils/song/songIO.ts           |
| EVD-012  | `useModalManager.ts:138-385`        | Quit-confirm modal dead on Escape/Enter paths                           | Concern     | src/hooks/modal/useModalManager.ts |
| EVD-013  | `useMidiActions.ts:251,422`         | +20ms hardcode vs frame-derived interval                                | Concern     | src/hooks/midi/useMidiActions.ts   |
| EVD-014  | `TrackPanel.tsx:107-276` et al.     | Preview-envelope engine implemented 5 times                             | Concern     | src/components/ + src/hooks/       |
| EVD-015  | `docs/ARCHITECTURE.md`              | Three documented claims stale vs tree                                   | Concern     | docs/ARCHITECTURE.md               |
| EVD-016  | Defect census                       | ~62 catches, ~19 silent, dead exports and flags                         | Concern     | src/hooks/midi/ + src/             |
| EVD-017  | `useSongLifecycleDialogs.ts:91-119` | RESET races mirror clear vs reload, unscoped clear()                    | Concern     | src/hooks/song/                    |
| EVD-018  | `tsconfig.json`, `eslint.config.js` | Typecheck no-op (documented), configs/e2e/electron out of scope         | Concern     | Root configs                       |
| EVD-019  | `playwright.config.ts:19-24`        | e2e serves stale dist/ without building                                 | Concern     | playwright.config.ts               |
| EVD-020  | `package.json`                      | No engines/.nvmrc/packageManager floor                                  | Observation | package.json                       |
| EVD-021  | `package-lock.json`                 | 608 pkgs, 7 prod, lockfile version 1.3.6 vs manifest 1.3.8              | Concern     | package-lock.json                  |
| EVD-022  | `package-lock.json`                 | eslint 9.39.5 and rolldown-vite 7.3.1 deprecated                        | Concern     | package-lock.json                  |
| EVD-023  | `package.json`                      | @testing-library/jest-dom declared, zero imports                        | Observation | package.json                       |
| EVD-024  | `test/fixtures/`                    | 8 of 10 fixtures unreferenced                                           | Observation | test/fixtures/                     |
| EVD-025  | `useLocalStorageState.test.tsx:45`  | Storage.prototype spy violating TESTING.md:229                          | Observation | test/hooks/storage/                |
| EVD-026  | Coverage map                        | Untested: worker, ~35 hooks, 24 components, 13 modals                   | Concern     | test/ vs src/                      |
| EVD-027  | License census                      | Prod chain all MIT except argparse Python-2.0 (off whitelist)           | Concern     | package-lock.json                  |
| EVD-028  | `LICENSE`, `package.json`           | MIT 2025 Zoltar X vs build.copyright 2024 mismatch                      | Concern     | LICENSE, package.json:87           |
| EVD-029  | History census                      | 0 tags, 0 merges, 100 percent single-author, ~9-10 day cadence          | Concern     | .git + public/CHANGELOG.md         |
| EVD-030  | Secret-shape census                 | No credential material in tracked tree                                  | Observation | Whole tree                         |
| EVD-031  | Outbound census                     | All fetches relative same-origin, no telemetry                          | Observation | src/                               |
| EVD-032  | `markdown.ts`                       | Escape-first renderer, https-only autolink, 2 trusted sinks             | Observation | src/utils/markdown/markdown.ts     |
| EVD-033  | `vite.config.ts:12-41`              | Build-time [CSP](#glossary-index), same-origin versioned service worker | Observation | vite.config.ts, public/sw.js       |
| EVD-034  | Capability census                   | F-11/F-14/F-15/F-16 real implementations with coverage                  | Observation | src/hooks/                         |
| EVD-035  | `tsconfig.app.json`                 | strict + noUnused*, zero any/ts-ignore, 24 as-unknown                   | Observation | tsconfig.app.json                  |
| EVD-036  | `playbackSimulation.ts:202-311`     | O(frames x instruments) find-in-loop vs Map in live path                | Observation | src/utils/playback/                |
| EVD-037  | `docs/WORKFLOW.md:361`              | Single-author bus factor, owner-accepted                                | Observation | docs/WORKFLOW.md                   |
| EVD-038  | `docs/GUIDELINES.md`                | Guidance set: README route, truth table, standards library              | Observation | docs/GUIDELINES.md                 |
| EVD-039  | `.github/` absent                   | No CI pipeline, evaluated and declined per GUIDELINES:148               | Observation | Repo root                          |
| EVD-040  | `package.json:84-133`               | Unsigned builds (documented), SHA256SUMS per artifact, no publish       | Observation | electron-builder config            |
| EVD-041  | `src/utils/log/logger.ts`           | Logger + error modals + ErrorBoundary, no metrics                       | Observation | src/utils/log/logger.ts            |
| EVD-042  | `vite.config.ts:46-52`              | Dev server host:true binds LAN on port 8008                             | Observation | vite.config.ts                     |

Evidence basis is `Inspected` for source observations and `Executed` for the six commissioned runs
([EVD-001](#evidence-list) through [EVD-006](#evidence-list) ).

### Severity definitions

| Severity | Meaning                  | Treatment                 |
|----------|--------------------------|---------------------------|
| Critical | Critical contextual risk | Gate resolution           |
| High     | Major contextual risk    | Gate resolution           |
| Medium   | Material contained risk  | Track and plan            |
| Low      | Limited contextual risk  | Proportionate improvement |

Severity derives from the impact/likelihood matrix, not CVSS.

## Scoring Rubrics

| Band      | Score Range | Definition                                                   |
|-----------|-------------|--------------------------------------------------------------|
| Excellent | 9-10        | Capability is comprehensive and verified by strong evidence  |
| Good      | 7-8         | Capability is solid overall, minor or noticeable gaps exist  |
| Average   | 4-6         | Capability is present but uneven, limited, or inconsistent   |
| Poor      | 1-3         | Capability is minimal, fragmentary, or absent where required |

### Scorecard Summary

| Dimension               | Score |
|-------------------------|-------|
| Functional Suitability  | 9/10  |
| Testability             | 8/10  |
| Design Soundness        | 7/10  |
| Code Quality            | 7/10  |
| Code Style              | 9/10  |
| Stack Alignment         | 9/10  |
| Dependency Health       | 8/10  |
| Maintainability         | 8/10  |
| Structure               | 10/10 |
| Deployability           | 9/10  |
| Scalability             | 8/10  |
| Security                | 5/10  |
| Compliance              | 8/10  |
| Observability           | 10/10 |
| Operational Safety      | 10/10 |
| Documentation           | 10/10 |
| API Compatibility       | 8/10  |
| Delivery & Continuity   | 4/10  |
| Originality & Licensing | 8/10  |
| Skill Definition        | 10/10 |

Product quality mean 8.3/10 over applicable product dimensions,
process maturity 7.3/10 over process dimensions.

Overall equals the mean of 20 applicable dimension scores (raw 8.0)
with a severity ceiling of 6 applied for the open High finding, landing at 6/10, band Average.

The lowest-scoring applicable dimension is Delivery & Continuity at 4/10.

## Architectural Assessment

### What Works

The tree is domain-grouped and conforms to its own layout contract:
`hooks/` and `utils/` hold zero root files, all 51 hooks live in 12 domain subdirectories,
all 50 utils in 21 domain subdirectories, and no barrel files exist.

The import graph is fully connected with zero orphan source files.

The sequencer worker keeps timing and playlist math off the render thread,
and tick-driven register computation is diff-gated so React renders at row rate
rather than tick rate.

Persistence is deliberately redundant: `localStorage` is mirrored to an IndexedDB snapshot store
with a restore-on-absence path and a user-facing notice.

### What Needs Attention

Three components (`TrackPanel.tsx:107-276`, `PianoKeyboard.tsx:161-293`, `HeaderPanel.tsx:80-114`)
embed a full preview-envelope engine, the same engine that also exists in `useMidiActions` and
`useInstrumentActions` - five copies total
([FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks)).

Components perform direct `localStorage` I/O (`EnvelopePanel.tsx:53,69`, `ToneNoisePanel.tsx:34,45`,
`PlaylistPanel.tsx:36,50`, `InformationPanel.tsx:36`),
contradicting the documented presentational boundary.

The `App.tsx` module concentrates wiring across 40 hook call sites,
a documented trade-off whose cost is visible in the file size census.

### Design Principles

Single responsibility holds at the directory level but breaks inside the preview components
and the orchestrator.

Dependency direction is clean (components depend on hooks, hooks on utils, nothing reaches back).

Abstraction boundaries are honest: branded types, shared `exports/core.ts` normalization, one store,
no god-objects besides the orchestrator.

### Data Flow Diagram

```
                          +-----------------------------+
 User files (.yaml)  ---> | File pickers / paste        |
                          | songParser, trackClipboard  |
                          +-------------+---------------+
                                        |
 Clipboard             --->  parseClipboardData ------+
 MIDI input           --->  useMidiMessageProcessing -+
                                        |
                          +-------------v---------------+
                          | React app (main thread)     |
                          | hooks -> useState/Zustand   |
                          +---+---------+---------+-----+
                       worker |         |         | writes
                     messages |         |         |
                        +-----v---+  +--v-----------+---+
                        |seqWorker|  | localStorage +   |
                        |timing   |  | IDB mirror      |
                        +-----+---+  +-----------------+
                              | tick
                        +-----v------------+
                        | YM2149 emulator  |
                        | Web Audio output |
                        +------------------+
 Song export    ---> exports/{asm,bin,vgm,max,wav}
 Bundled docs   ---> fetchBundledMarkdown (allowlist)
 Electron main  ---> permission gate (midi only, origin-pinned)
```

### Design Patterns

Orchestrator (`App.tsx`), domain hooks, prop mirroring for audio state, worker isolation,
fire-and-forget mirror persistence, escape-first rendering pipeline, allowlisted fetch surface.

### Architecture Decision Records

- Single-file orchestrator with explicit decomposition debt - documented
- One Zustand store, audio state in refs - documented performance trade-off
- `react-hooks/exhaustive-deps` disabled in 14 files - documented audio-path exception
- No CI, no code review, single-author - recorded decisions in `docs/GUIDELINES.md`
  and `docs/WORKFLOW.md`
- Unsigned desktop binaries with SHA256 manifests - recorded in `docs/DEPLOYMENT.md`
- rolldown-vite substitution for stock Vite - recorded in `docs/ARCHITECTURE.md`

## Structure Review

Layout conformance is near-total: `src/hooks/` and `src/utils/` hold zero root files,
`src/` root holds only the four recorded-exception files (`main.tsx`, `App.tsx`, `index.css`,
`App.css`), and the test tree mirrors source domains.

Two naming violations exist: `src/synth/SoundDriver.ts` and `src/synth/YM2149.ts` carry
PascalCase/uppercase `.ts` names against the camelCase rule,
plausibly deliberate class mirroring but not recorded as exemptions.

The `src/assets/song.yaml` fixture sits beside the `svg/` subdirectory,
a borderline "no files beside subdirs" case that an asset directory reasonably exempts.

Four test filenames diverge from their subjects (`dataManagement.test.tsx`,
`loadInitialSong.test.ts`, `useDataManagement.test.ts` under `test/utils/`,
`useStorageMirror.test.ts`).

The largest structural debt is `App.css` at 3569 lines,
a monolith stylesheet with no per-panel split.

| Area                       | Verdict   | Basis                                                           |
|----------------------------|-----------|-----------------------------------------------------------------|
| Directory organization     | Passed    | `hooks/` and `utils/` hold zero root files, domain-grouped tree |
| Naming conventions         | Partially | Two PascalCase `.ts` violations in `src/synth/`                 |
| Component placement        | Passed    | Components and modals flat, hooks/utils domain subdirs          |
| Supporting-artifact layout | Passed    | `public/`, `scripts/`, `electron/`, fixtures in declared homes  |
| Consistency                | Partially | `App.tsx` 1143 and `App.css` 3569 exceed the codebase grain     |

## Trade-off Analysis

The orchestrator concentration trades a single wiring surface for review load and blast radius - the
docs record the choice and the audit prices it at Medium through
[TDR-001](#tdr-001-apptsx-1143-line-orchestrator-documented-decomposition-debt).

The duplicated preview engine trades a shared abstraction for per-surface timing freedom - the docs
do not record this one, making it debt rather than a trade-off.

Source-only discipline on `localStorage` writes during playback (gated by `!sequencerIsPlaying`)
trades autosave completeness for glitch-free audio - a correct call, recorded.

The unsigned-binary posture trades distribution trust for zero infrastructure - accepted explicitly
and partially mitigated by SHA256 manifests.

## Threat Model

Applied via STRIDE enumeration over the traced boundaries, proportional to a local single-user app.

| Boundary                                | Threat                               | Existing control                                              | Verdict                                                                                    |
|-----------------------------------------|--------------------------------------|---------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| [YAML](#glossary-index) import          | Crafted input [OOM](#glossary-index) | Structural parse + post-parse clamp (too late)                | [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers) |
| Paste import                            | Same expansion path                  | Step-shape validation only                                    | [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers) |
| Markdown rendering                      | Stored or reflected XSS              | Escape-first renderer, https autolink, [CSP](#glossary-index) | Controlled                                                                                 |
| Remote navigation                       | Remote content in app window         | None - no window-open or navigation handler                   | [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron)                 |
| Electron permissions                    | Device permission escalation         | Deny-by-default, midi-only, origin-pinned                     | Controlled                                                                                 |
| localStorage and [IDB](#glossary-index) | Tampered restore data                | Lenient normalization, no validateSongData                    | Low residual                                                                               |
| Bundled-doc fetch                       | [HTML](#glossary-index) injection    | Allowlist plus content-type and body sniff                    | Controlled                                                                                 |
| Service worker                          | Cache poisoning                      | Same-origin GET only, versioned cache                         | Controlled                                                                                 |
| Dev server                              | LAN exposure                         | `host: true` binds all interfaces, dev-only                   | Low, dev-only                                                                              |
| Secrets in tree                         | Credential leak                      | Census clean                                                  | Controlled                                                                                 |

## Standards Conformance

| Standard             | Applied scope                                                          | Verdict                                                                                                                                                                                                                                                                                                        |
|----------------------|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| OWASP Top 10 (2025)  | Client-side subset: A03 Injection, A05 Misconfiguration, A08 Integrity | Partially conformant: strong injection and [CSP](#glossary-index) posture, [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers) (resource-control gap) and [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron) (navigation misconfiguration) open |
| OWASP ASVS 5.0.0     | Input validation and client-side controls                              | Partial: input-bounds control absent                                                                                                                                                                                                                                                                           |
| ISO/IEC 25010:2023   | Product-quality coverage via scorecard crosswalk                       | Coverage statement in Scope Exclusions                                                                                                                                                                                                                                                                         |
| React best practices | Hook discipline, controlled state                                      | Conformant with recorded audio-path exceptions                                                                                                                                                                                                                                                                 |
| Electron security    | contextIsolation, sandbox, permissions, navigation                     | Conformant except navigation handlers                                                                                                                                                                                                                                                                          |

## Baseline Conformance

The project's own engineering documents declare a verification loop, a permitted-license list,
audio-critical lint exceptions, naming conventions, a documentation-first workflow,
and a version-bump procedure.

Conformance against those baselines is high: the loop exists and runs,
the lint exceptions are scoped as documented, naming holds except the two synth files,
and the bump procedure works though it leaves the lockfile version stale
([FND-INF-003](#fnd-inf-003-lockfile-version-drifts-from-manifest)).

Two self-violations exist in the test suite
([FND-CQY-006](#fnd-cqy-006-test-suite-violates-two-of-its-own-documented-rules)) and one released
window lacks its required review record
([FND-INF-008](#fnd-inf-008-missing-window-review-for-released-136)).

## Requirements Conformance

The requirements registry is `docs/PROJECT.md` (F-01 through F-16 functional,
N-01 through N-06 non-functional).

| Requirement | Obligation | Status  | Evidence                                                                                                 |
|-------------|------------|---------|----------------------------------------------------------------------------------------------------------|
| F-01        | Mandatory  | Pass    | [EVD-001](#evidence-list), [EVD-006](#evidence-list)                                                     |
| F-02        | Mandatory  | Pass    | [EVD-001](#evidence-list), [EVD-006](#evidence-list)                                                     |
| F-03        | Mandatory  | Pass    | [EVD-001](#evidence-list), [EVD-006](#evidence-list)                                                     |
| F-04        | Mandatory  | Pass    | [EVD-001](#evidence-list), [EVD-006](#evidence-list)                                                     |
| F-05        | Mandatory  | Pass    | [EVD-006](#evidence-list), [EVD-034](#evidence-list)                                                     |
| F-06        | Mandatory  | Pass    | [EVD-001](#evidence-list)                                                                                |
| F-07        | Mandatory  | Pass    | [EVD-001](#evidence-list), [EVD-006](#evidence-list)                                                     |
| F-08        | Mandatory  | Pass    | [EVD-001](#evidence-list)                                                                                |
| F-09        | Mandatory  | Pass    | [EVD-001](#evidence-list), [EVD-006](#evidence-list)                                                     |
| F-10        | Mandatory  | Pass    | [EVD-006](#evidence-list)                                                                                |
| F-11        | Mandatory  | Pass    | [EVD-034](#evidence-list)                                                                                |
| F-12        | Mandatory  | Pass    | [EVD-006](#evidence-list)                                                                                |
| F-13        | Mandatory  | Pass    | [EVD-004](#evidence-list), [EVD-040](#evidence-list)                                                     |
| F-14        | Mandatory  | Pass    | [EVD-034](#evidence-list)                                                                                |
| F-15        | Mandatory  | Pass    | [EVD-034](#evidence-list)                                                                                |
| F-16        | Mandatory  | Pass    | [EVD-017](#evidence-list), [EVD-034](#evidence-list)                                                     |
| N-01        | Mandatory  | Pass    | [EVD-036](#evidence-list), [EVD-006](#evidence-list)                                                     |
| N-02        | Mandatory  | Pass    | [EVD-036](#evidence-list), [EVD-001](#evidence-list)                                                     |
| N-03        | Mandatory  | Pass    | [EVD-001](#evidence-list)                                                                                |
| N-04        | Mandatory  | Pass    | [EVD-003](#evidence-list), [EVD-035](#evidence-list)                                                     |
| N-05        | Mandatory  | Pass    | [EVD-003](#evidence-list)                                                                                |
| N-06        | Mandatory  | Partial | [EVD-026](#evidence-list), [FND-CQY-007](#fnd-cqy-007-configured-80-percent-coverage-threshold-is-unmet) |

21 of 22 graded requirements pass.

N-06 is partial against a self-documented coverage gap.

## Structure Conformance

| Lens                      | Status  | Evidence                                    |
|---------------------------|---------|---------------------------------------------|
| Directory grouping rule   | Pass    | `hooks/` and `utils/` hold zero root files  |
| Naming convention         | Partial | Two PascalCase `.ts` violations in `synth/` |
| Test-subject mirroring    | Partial | Four test filenames diverge from subjects   |
| Files-beside-subdirs rule | Pass    | Single borderline asset-directory case      |
| Barrel-free import graph  | Pass    | Zero index/barrel files, all reachable      |

## Code Style

Naming conforms to the declared matrix almost everywhere:
33 components and 14 modals PascalCase `.tsx`, 51 hooks `useCamelCase` in domain subdirectories,
utils, constants, and exports camelCase.

Zero `any`, zero `@ts-ignore`, zero TODO or FIXME markers exist across the source.

Two files carry leftover dev-narrative comments (`trackClipboard.ts:300-333`,
`playbackUtils.ts:44-48`).

| Lens             | Status  | Evidence                                                                                                                                                                                |
|------------------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Identifier shape | Pass    | Naming census clean except `synth/` pair                                                                                                                                                |
| Vocabulary       | Pass    | Consistent tracker-domain terms across modules                                                                                                                                          |
| Comment hygiene  | Partial | Two dev-narrative comment blocks remain                                                                                                                                                 |
| Enforcement      | Partial | Prettier plus ESLint cover `src/`/`test/` only, e2e, electron, and root configs are unlinted ([FND-INF-004](#fnd-inf-004-static-analysis-scope-excludes-configs-e2e-and-electron-code)) |

## Guidance Conformance

The repository carries a structured agent-guidance set rather than authored skills.

The `README.md` file routes to `docs/GUIDELINES.md`, which declares the sources-of-truth table,
topic owners, and the `docs/standard/` library.

Every referenced path resolves and the routing chain from README to each topic owner is unbroken.

Restricted directories are named explicitly and were honored during this audit.

Conformance: Pass.

## Solution Comparison

The architecture alternatives the project actually faces are consolidation choices,
not greenfield designs.

A shared preview-envelope hook (recommended,
[REC-006](#rec-006-consolidate-the-preview-envelope-engine) )
costs an abstraction boundary that must remain ref-driven to protect the audio path,
versus the status quo of five copies whose semantic parity is unverified.

A CI pipeline would trade the deliberately lightweight local workflow for automated enforcement the
owner has evaluated and declined - the audit records the decision and prices the risk instead.

Code-signing desktop builds would add certificate cost and release friction against a documented
unsigned posture already partially mitigated by checksum manifests.

## Strengths and What's Working

- The documentation corpus is exceptional: a sources-of-truth table,
  per-domain style and testing standards, per-version change records,
  and honest known-limitations sections.
- Test assertion quality is high: byte-level golden tests for text exports,
  structural parsers for binary formats, hand-rolled doubles for AudioContext, IndexedDB,
  and [MIDI](#glossary-index)
- all passing under executed evidence.
- The audio pipeline is genuinely well-engineered: worker-driven timing,
  Map-indexed per-tick lookups, batched register writes, diff-gated renders,
  and allocation discipline on the hot path.
- The security boundary is deliberately minimal and mostly hardened: five-method contextBridge,
  deny-by-default origin-pinned permissions, escape-first markdown,
  build-time [CSP](#glossary-index), same-origin service worker.
- Change governance is real: a release gate enforcing change-record pairing, a bump script,
  a clean `.gitignore`, and honest recording of declined practices (CI, code review, signing).

## Technical Findings

22 findings: 1 High, 6 Medium, 15 Low.

| Finding                                                                                               | Severity | Pillar                      | Summary                                                             |
|-------------------------------------------------------------------------------------------------------|----------|-----------------------------|---------------------------------------------------------------------|
| [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)            | High     | Security & Compliance       | Unbounded run-length expansion [OOMs](#glossary-index) the renderer |
| [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron)                            | Medium   | Security & Compliance       | No navigation containment in packaged Electron                      |
| [FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks) | Medium   | Architecture & Design       | Preview-envelope engine duplicated five times                       |
| [FND-ARC-002](#fnd-arc-002-formatmd-and-architecturemd-drift-from-shipped-behavior)                   | Medium   | Architecture & Design       | FORMAT.md and ARCHITECTURE.md drift from shipped code               |
| [FND-CQY-001](#fnd-cqy-001-custom-pattern-names-silently-dropped-on-save)                             | Medium   | Code Quality                | Custom pattern names silently dropped on save                       |
| [FND-CQY-002](#fnd-cqy-002-quit-confirm-modal-unreachable-by-keyboard-on-its-own)                     | Medium   | Code Quality                | Quit-confirm modal dead on keyboard paths                           |
| [FND-CQY-003](#fnd-cqy-003-midi-live-preview-tick-offset-hardcoded-at-20-ms)                          | Low      | Code Quality                | [MIDI](#glossary-index) preview tick hardcoded at +20ms             |
| [FND-CQY-004](#fnd-cqy-004-silent-catches-and-dead-surface-on-midi-and-sequencer-paths)               | Low      | Code Quality                | Silent catches and dead surface on MIDI/sequencer                   |
| [FND-CQY-005](#fnd-cqy-005-reset-can-resurrect-a-deleted-song-from-the-mirror)                        | Medium   | Code Quality                | RESET can resurrect a deleted song                                  |
| [FND-CQY-006](#fnd-cqy-006-test-suite-violates-two-of-its-own-documented-rules)                       | Low      | Code Quality                | Tests violate two documented testing rules                          |
| [FND-CQY-007](#fnd-cqy-007-configured-80-percent-coverage-threshold-is-unmet)                         | Low      | Code Quality                | 80 percent coverage threshold unmet                                 |
| [FND-INF-001](#fnd-inf-001-12-moderate-transitive-advisories-in-dev-tooling-chains)                   | Medium   | Infrastructure & CI/CD      | 12 moderate transitive advisories                                   |
| [FND-INF-002](#fnd-inf-002-two-direct-dependencies-resolve-to-deprecated-versions)                    | Low      | Infrastructure & CI/CD      | eslint and rolldown-vite deprecated                                 |
| [FND-INF-003](#fnd-inf-003-lockfile-version-drifts-from-manifest)                                     | Low      | Infrastructure & CI/CD      | Lockfile version drifts from manifest                               |
| [FND-INF-004](#fnd-inf-004-static-analysis-scope-excludes-configs-e2e-and-electron-code)              | Low      | Infrastructure & CI/CD      | Static-analysis scope excludes configs/e2e/electron                 |
| [FND-INF-005](#fnd-inf-005-no-mechanical-toolchain-floor)                                             | Low      | Infrastructure & CI/CD      | No mechanical toolchain floor                                       |
| [FND-INF-006](#fnd-inf-006-dead-dependency-and-unreferenced-fixtures)                                 | Low      | Infrastructure & CI/CD      | Dead dependency and unreferenced fixtures                           |
| [FND-INF-007](#fnd-inf-007-single-author-bus-factor-accepted)                                         | Medium   | Infrastructure & CI/CD      | Single-author bus factor, accepted                                  |
| [FND-INF-008](#fnd-inf-008-missing-window-review-for-released-136)                                    | Low      | Infrastructure & CI/CD      | Missing window review for released 1.3.6                            |
| [FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist)              | Medium   | Copyrights & Originality    | argparse Python-2.0 outside license whitelist                       |
| [FND-CPR-002](#fnd-cpr-002-copyright-attribution-inconsistency)                                       | Low      | Copyrights & Originality    | Copyright attribution inconsistency                                 |
| [FND-AIP-001](#fnd-aip-001-per-commit-ai-provenance-unverifiable)                                     | Low      | AI Provenance & Code Origin | Per-commit AI provenance unverifiable                               |

### FND-SEC-001 Unbounded run-length expansion in song and clipboard importers

The `space`/`wait`/`off:N` runs expand via `for (i < count)` with `count` unvalidated beyond `> 0`.

At `songParser.ts:262-292` and `trackClipboard.ts:180-201`.

No byte cap exists on `FileReader.readAsText`, fetch-based, or clipboard import paths.

A crafted `space: 100000000` allocates on the order of 10^8 step objects.

- **Pillar:** Security & Compliance
- **Severity:** HIGH
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/utils/song/songParser.ts`, `src/utils/track/trackClipboard.ts`
- **Basis:** Inspected
- **Criteria:** SEC-INPUT
- **Impact:** Renderer process freeze or [OOM](#glossary-index)
  crash in both web and Electron builds on a routine user action.
- **Recommendation:** Bound expansion to remaining pattern length and add a byte cap on imported
  files, per [REC-001](#rec-001-bound-run-length-expansion-and-cap-import-size).
- **Method:** Taint census over input-accepting surfaces.
- **Verification:** Yes - allocation sites inspected at both paths.
- **Confirmation:** No - reproduction harness not commissioned.
- **Confidence:** HIGH - the allocation loop is unconditional.
- **Mitigation:** Post-parse clamping bounds pattern length, but allocation precedes the clamp,
  and exploit requires a local file or paste rather than a remote actor.
- **Evidence:** [EVD-008](#evidence-list), [EVD-009](#evidence-list)
- **Scenario:** User opens an untrusted `.yaml` containing `space: 1e8` - unbounded allocation - tab
  or app unresponsive.

### FND-SEC-002 No navigation containment in packaged Electron

The `electron/main.cjs` installs no `setWindowOpenHandler` and no `will-navigate` handler.

Markdown links render `target="_blank"`.

A click opens a second `BrowserWindow` that loads remote content while inheriting `webPreferences`.

The `webPreferences` and exposing the `electronAPI` preload surface.

- **Pillar:** Security & Compliance
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `electron/main.cjs`, `src/utils/markdown/markdown.ts`
- **Basis:** Inspected
- **Criteria:** SEC-THREAT
- **Impact:** Remote content executes inside an application window carrying the app preload surface.
- **Recommendation:** Install `setWindowOpenHandler` (deny or allowlist to `shell.openExternal`)
  and a `will-navigate` restrictor, per
  [REC-002](#rec-002-add-navigation-containment-to-the-electron-shell).
- **Method:** Boundary census over Electron listeners.
- **Verification:** Yes - handler absence confirmed in `main.cjs`.
- **Confirmation:** No - no packaged-build link click performed.
- **Confidence:** HIGH - absence is mechanical.
- **Mitigation:** Sandbox and contextIsolation still bound the remote page,
  the exposed API is five read-mostly methods, and the trigger requires a user click.
- **Evidence:** [EVD-010](#evidence-list), [EVD-032](#evidence-list)
- **Absence:** No documented rationale

### FND-ARC-001 Preview-envelope engine duplicated five times across components and hooks

The preview-envelope engine (timing state, sustain/release logic, interval tick.

Register writes) is implemented five times across three components and two hooks.

Several components also perform direct `localStorage` I/O.

Contradicting the documented presentational boundary.

- **Pillar:** Architecture & Design
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/components/TrackPanel.tsx`, `src/components/PianoKeyboard.tsx`,
  `src/components/HeaderPanel.tsx`, `src/hooks/midi/useMidiActions.ts`,
  `src/hooks/instrument/useInstrumentActions.ts`
- **Basis:** Inspected
- **Criteria:** ARC-DRY
- **Impact:** Preview behavior diverges silently as copies are fixed in isolation.
- **Recommendation:** Extract one ref-driven preview-envelope implementation consumed by all
  surfaces, per [REC-006](#rec-006-consolidate-the-preview-envelope-engine).
- **Method:** Responsibility inventory plus near-duplicate scan.
- **Verification:** Yes - five implementations located and compared.
- **Confirmation:** No - semantic parity unverified.
- **Confidence:** HIGH - structural duplication is mechanical.
- **Mitigation:** Documented audio-timing constraints justify per-caller ref patterns,
  but five semantic copies are not recorded as a trade-off.
- **Evidence:** [EVD-014](#evidence-list), [EVD-015](#evidence-list)

### FND-ARC-002 FORMAT.md and ARCHITECTURE.md drift from shipped behavior

The `FORMAT.md` documents saver keys `playlist`/`steps`/`space`/`arpeggio` and clipboard root.

The `steps`, while the shipped writer emits `line`/`step`/`wait`/`shift` and clipboard root `step`.

The check (`songIO.ts:149-283`, `trackClipboard.ts:124,159`).

The `ARCHITECTURE.md` claims components own no business logic.

That the store persists channel mutes.

The doc also claims song data lives in `App.tsx` useState - all three claims are stale.

- **Pillar:** Architecture & Design
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `docs/FORMAT.md`, `docs/ARCHITECTURE.md`, `src/utils/song/songIO.ts`
- **Basis:** Inspected
- **Criteria:** CMP-DRIFT
- **Impact:** Third-party importers writing per the spec produce a dialect the saver never emits,
  and architectural guidance misleads contributors.
- **Recommendation:** Reconcile `FORMAT.md` with emitted keys or version the format,
  per [REC-003](#rec-003-reconcile-formatmd-with-the-emitted-saver-schema).
- **Method:** Spec-conformance diff and documented-claim verification.
- **Verification:** Yes - emitted keys traced against documented schema.
- **Confirmation:** No - external importer behavior untested.
- **Confidence:** HIGH - the key sets diff mechanically.
- **Mitigation:** The parser accepts the wider documented set,
  so files written per the doc still load inbound.
- **Evidence:** [EVD-011](#evidence-list), [EVD-015](#evidence-list)

### FND-CQY-001 Custom pattern names silently dropped on save

The `buildSongYamlForExport` never writes `Pattern.name`.

The parser falls back to `Pattern NN`.

User-renamed patterns lose their names on every save/load round-trip.

- **Pillar:** Code Quality
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/utils/song/songIO.ts`
- **Basis:** Inspected
- **Criteria:** FNC-CONTRACT
- **Impact:** Silent user-data loss on a routine save.
- **Recommendation:** Persist `name` in the pattern node when it differs from the default,
  per [REC-004](#rec-004-persist-patternname-on-save).
- **Method:** Writer/parser key-set trace.
- **Verification:** Yes - writer emits no `name` key.
- **Confirmation:** No - round-trip not executed.
- **Confidence:** HIGH - asymmetric key sets are mechanical.
- **Mitigation:** Default names survive, only custom names are lost.
- **Evidence:** [EVD-011](#evidence-list)
- **Scenario:** Rename pattern to "Verse" - save - load - reverts to `Pattern 02`.

### FND-CQY-002 Quit-confirm modal unreachable by keyboard on its own

The `useModalManager.ts` handles `isQuitConfirmOpen` in the Escape (line 284) and Enter (382).

Branches but omits it from the `hasInfoModal`/`hasConfirmModal` guards (138-166).

When the quit-confirm is the only open modal, Escape and Enter are dead.

The `instrumentOperationSummary` is missing from the Enter chain while present in the Escape chain.

- **Pillar:** Code Quality
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/hooks/modal/useModalManager.ts`
- **Basis:** Inspected
- **Criteria:** FNC-DEFECT
- **Impact:** Two modals violate the documented keyboard contract.
- **Recommendation:** Add `isQuitConfirmOpen` to the guards and `instrumentOperationSummary` to the
  Enter chain, per [REC-005](#rec-005-close-modal-keyboard-dead-paths).
- **Method:** Defect-pattern census over modal guards.
- **Verification:** Yes - guard membership enumerated.
- **Confirmation:** No - keyboard path not executed.
- **Confidence:** HIGH - the guard lists diff mechanically.
- **Mitigation:** Mouse dismissal and window close still work.
- **Evidence:** [EVD-012](#evidence-list)
- **Scenario:** Quit-confirm open alone - Escape pressed - nothing happens.

### FND-CQY-003 MIDI live-preview tick offset hardcoded at 20 ms

The `useMidiActions.ts:251,422` sets `midiLiveNextTickTimeRef.current = nowTick + 20` while the.

Tick interval derives from `song.frame`.

At 60 Hz replay the first envelope tick lands about 3.3 ms late.

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/hooks/midi/useMidiActions.ts`
- **Basis:** Inspected
- **Criteria:** FNC-DEFECT
- **Impact:** Minor timing skew on the first live-preview tick at 60 Hz.
- **Recommendation:** Derive the offset from the frame interval,
  per [REC-013](#rec-013-derive-the-midi-preview-tick-from-the-frame-rate).
- **Method:** Defect-pattern census.
- **Verification:** Yes - constant located.
- **Confirmation:** No - audio timing not measured.
- **Confidence:** MEDIUM - the skew math is inferred from the frame table.
- **Mitigation:** Single-tick offset only, the 50 Hz path is correct.
- **Evidence:** [EVD-013](#evidence-list)

### FND-CQY-004 Silent catches and dead surface on MIDI and sequencer paths

About 19 silent catches in `useMidiMessageProcessing.ts` swallow send, open, close.

The sites also swallow listener failures,
and dead surface includes seven unused `useSequencer` exports.

The never-emitted `debugTimestamp` field.

The set-but-unconsumed `__dosoundTrackerIsResetting` flag, and an empty `if (!pattern) {}` block.

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/hooks/midi/useMidiMessageProcessing.ts`, `src/hooks/sequencer/useSequencer.ts`,
  `src/hooks/sequencer/useSequencerIntegration.ts`
- **Basis:** Inspected
- **Criteria:** CQY-ERRH
- **Impact:** Swallowed failures hide [MIDI](#glossary-index) degradation,
  and dead surface is maintenance noise.
- **Recommendation:** Log each site via `logger.warn` and trim the dead exports and fields,
  per [REC-014](#rec-014-log-silent-catches-and-trim-dead-surface).
- **Method:** Catch-block and dead-code census.
- **Verification:** Yes - catch sites and export consumers enumerated.
- **Confirmation:** No - failure paths not triggered.
- **Confidence:** MEDIUM - silent-catch count is census-approximated.
- **Mitigation:** Persistence-mirror degradation is documented, the other sites are not.
- **Evidence:** [EVD-016](#evidence-list)

### FND-CQY-005 RESET can resurrect a deleted song from the mirror

The `useSongLifecycleDialogs.ts:91-119` calls `localStorage.clear()` and fire-and-forget.

The `clearMirroredSnapshots()` followed by a synchronous `location.reload()`.

The IndexedDB clear may not commit before teardown.

The `__dosoundTrackerIsResetting` flag set at :114 is never consumed by the restore path.th.

The `localStorage.clear()` also wipes unrelated same-origin keys.

- **Pillar:** Code Quality
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `src/hooks/song/useSongLifecycleDialogs.ts`, `src/utils/storage/persistenceMirror.ts`
- **Basis:** Inspected
- **Criteria:** COM-RETENT
- **Impact:** A song the user explicitly reset can reappear via mirror restore.
- **Recommendation:** Await the mirror clear or gate restore on the reset flag,
  and scope the wipe to prefixed keys, per
  [REC-015](#rec-015-make-reset-durably-delete-mirrored-data).
- **Method:** Lifecycle completeness trace.
- **Verification:** Yes - the flag has zero consumers.
- **Confirmation:** No - the race was not triggered.
- **Confidence:** MEDIUM - race window is timing-dependent.
- **Mitigation:** Requires the mirror write to lose the race, a narrow window.
- **Evidence:** [EVD-017](#evidence-list)
- **Scenario:** Reset - reload before [IDB](#glossary-index)
  clear commits - restore effect resurrects the song with a notice.

### FND-CQY-006 Test suite violates two of its own documented rules

The `useLocalStorageState.test.tsx:45` spies `Storage.prototype.getItem`.

Forbidden by `docs/TESTING.md:229`.

The test file `test/utils/song/useDataManagement.test.ts:13` reads `src/assets/song.yaml`.

Violating the `test/` confinement rule at `docs/TESTING.md:139`.

The [MIDI](#glossary-index) storage key also lives outside `StorageKeys` (`midiUtils.ts:38`).

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `test/hooks/storage/useLocalStorageState.test.tsx`,
  `test/utils/song/useDataManagement.test.ts`
- **Basis:** Inspected
- **Criteria:** STY-ENFORCE
- **Impact:** Tests break silently if the storage mock ever activates.
- **Recommendation:** Repoint the spy at the `localStorage` object and move the fixture dependency
  inside `test/`, per [REC-020](#rec-020-align-tests-with-their-own-documented-rules).
- **Method:** Documented-claim verification.
- **Verification:** Yes - both violation sites located.
- **Confirmation:** No - mock-fallback path not exercised.
- **Confidence:** HIGH - the rule text and call sites both inspected.
- **Mitigation:** Both work under jsdom today, violations are latent fragility.
- **Evidence:** [EVD-025](#evidence-list)

### FND-CQY-007 Configured 80 percent coverage threshold is unmet

The `vitest.config.ts` sets 80 percent thresholds on all metrics while `docs/TESTING.md:286`.

Documents `test:coverage` as an expected failure.

The untested surface includes `sequencerWorker`, about 35 of 49 hooks, and 24 of 28 components.ents.

It also includes 13 of 14 modals.

- **Pillar:** Code Quality
- **Severity:** LOW
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `vitest.config.ts`, `src/workers/sequencerWorker.ts`,
  `src/components/`, `src/modals/`
- **Basis:** Inspected
- **Criteria:** TST-WFLOW
- **Impact:** The coverage gate cannot pass and a large interaction surface is unverified.
- **Recommendation:** Grow tests on the highest-risk untested paths until the gate passes,
  per [REC-022](#rec-022-close-the-coverage-gap-to-the-80-percent-threshold).
- **Method:** Verification-coverage map.
- **Verification:** Yes - test-to-source map enumerated.
- **Confirmation:** No - `test:coverage` was not commissioned.
- **Confidence:** HIGH - the untested file set is mechanical.
- **Mitigation:** The gap is documented, not hidden, and critical domains (synth, exports,
  parsers) are covered.
- **Evidence:** [EVD-026](#evidence-list)

### FND-INF-001 12 moderate transitive advisories in dev-tooling chains

Executed `npm audit` reports 12 moderate-severity `minimatch` advisories
(GHSA-g3hv-75wg-m249, Glob-pattern DoS).

The advisories arrive via `electron-builder` and `typescript-eslint` chains.

The suggested `npm audit fix --force` would downgrade electron-builder to the 25.x line.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `package-lock.json`
- **Basis:** Executed
- **Criteria:** DEP-ADVISORY
- **Impact:** Unpatched build-time DoS surface and growing advisory debt.
- **Recommendation:** Upgrade the electron-builder and typescript-eslint chains when a compatible
  path exists and document any residual, per [REC-007](#rec-007-clear-the-minimatch-advisory-chain).
- **Method:** Executed advisory scan.
- **Verification:** Yes - command output captured under executed-commands.
- **Confirmation:** Yes - `npm audit` executed.
- **Confidence:** HIGH - advisory database output is authoritative.
- **Mitigation:** DevDependencies only, no shipped-code reach,
  and DoS class requires hostile glob input to build tooling.
- **Evidence:** [EVD-005](#evidence-list)

### FND-INF-002 Two direct dependencies resolve to deprecated versions

The `eslint@9.39.5` carries a deprecation flag (EOL line.

Eslint 10 exists) and `rolldown-vite@7.3.1` is a deprecated migration shim pointing at Vite 8.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** LOW
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `package-lock.json`, `eslint.config.js`, `vite.config.ts`
- **Basis:** Inspected
- **Criteria:** STK-CURRENT
- **Impact:** Lint and build sit on unsupported release lines.
- **Recommendation:** Plan migration to eslint 10 and Vite 8 when stable,
  per [REC-008](#rec-008-migrate-off-deprecated-toolchain-lines).
- **Method:** Lockfile deprecation census.
- **Verification:** Yes - deprecation flags read from the lockfile.
- **Confirmation:** No - migration not attempted.
- **Confidence:** HIGH - flags are recorded metadata.
- **Mitigation:** Both function today, deprecation rather than vulnerability.
- **Evidence:** [EVD-022](#evidence-list)

### FND-INF-003 Lockfile version drifts from manifest

The `package-lock.json` root `version` is 1.3.6 while `package.json` is 1.3.8.

Because `bump-version.mjs` writes only the manifest and never runs `npm install`.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `package-lock.json`, `scripts/bump-version.mjs`
- **Basis:** Inspected
- **Criteria:** DEP-PIN
- **Impact:** Version metadata diverges across the release contract.
- **Recommendation:** Sync the lockfile inside the bump script,
  per [REC-009](#rec-009-sync-the-lockfile-version-inside-the-bump-script).
- **Method:** Manifest/lockfile diff.
- **Verification:** Yes - both versions read directly.
- **Confirmation:** No - bump not exercised.
- **Confidence:** HIGH - field values diff mechanically.
- **Mitigation:** Dependency resolution is unaffected, metadata-only drift.
- **Evidence:** [EVD-021](#evidence-list)

### FND-INF-004 Static-analysis scope excludes configs, e2e, and Electron code

The `npm run typecheck` is a documented no-op (`files:[]`).

The `vitest.config.ts` and `playwright.config.ts` belong to no tsconfig project.

The `e2e/` and `electron/*.cjs` are outside the ESLint scope.

The e2e `webServer` serves a pre-existing `dist/` without building.

A stale build can pass silently.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** LOW
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `tsconfig.json`, `eslint.config.js`, `playwright.config.ts`, `electron/`, `e2e/`
- **Basis:** Inspected
- **Criteria:** TST-GATE
- **Impact:** Unchecked files rot silently and stale-dist e2e can false-pass.
- **Recommendation:** Extend lint and typecheck scope to configs, e2e, and electron,
  and add a build precondition to the e2e webServer,
  per [REC-010](#rec-010-bring-configs-e2e-and-electron-inside-analysis-scope).
- **Method:** Toolchain scope census.
- **Verification:** Yes - scope fields read in each config.
- **Confirmation:** No - the stale-dist path was not exercised.
- **Confidence:** HIGH - scope exclusion is mechanical.
- **Mitigation:** `tsc -b` inside `npm run build` covers `src/` and `test/`,
  and the no-op is documented at `docs/TESTING.md:222`.
- **Evidence:** [EVD-018](#evidence-list), [EVD-019](#evidence-list)
- **Absence:** Deliberate - recorded decision

### FND-INF-005 No mechanical toolchain floor

No `engines`, `.nvmrc`, or `packageManager` field exists.

The toolchain floor (Node 26.13.0, Npm 11.20.0) lives only in README prose.

Lockfile `engines` data implies a real floor near Node 22.22.2/24.15/26+.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `package.json`, `.nvmrc` (absent)
- **Basis:** Inspected
- **Criteria:** DEP-LIFECYCLE
- **Impact:** Silent toolchain drift between contributors.
- **Recommendation:** Add `engines` plus `.nvmrc` or `packageManager`,
  per [REC-011](#rec-011-add-a-mechanical-toolchain-floor).
- **Method:** Toolchain floor resolution.
- **Verification:** Yes - manifest fields enumerated.
- **Confirmation:** No - floor not enforced.
- **Confidence:** HIGH - absence is mechanical.
- **Mitigation:** README declares exact versions.
- **Evidence:** [EVD-020](#evidence-list)

### FND-INF-006 Dead dependency and unreferenced fixtures

The `@testing-library/jest-dom` is declared and installed but never imported anywhere.
8 of 10 files in `test/fixtures/` are unreferenced remnants of the 1.2.7 refactoring.

Verification.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `package.json`, `test/fixtures/`
- **Basis:** Inspected
- **Criteria:** DEP-DECLARE
- **Impact:** Dead install weight and fixture rot.
- **Recommendation:** Remove the dependency and prune the fixtures,
  per [REC-012](#rec-012-remove-dead-dependency-and-unreferenced-fixtures).
- **Method:** Import census and fixture trace.
- **Verification:** Yes - zero import sites for both.
- **Confirmation:** No - removal not exercised.
- **Confidence:** HIGH - absence is mechanical.
- **Mitigation:** Weight only, no behavior impact.
- **Evidence:** [EVD-023](#evidence-list), [EVD-024](#evidence-list)

### FND-INF-007 Single-author bus factor, accepted

100 percent of non-merge commits carry one author, zero merge commits exist.

About 24 remote branches are likely stale.

The workflow document `docs/WORKFLOW.md:361` records explicit owner acceptance.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `.git`, `docs/WORKFLOW.md`
- **Basis:** Inspected
- **Criteria:** DLY-BUSFACTOR
- **Impact:** Total continuity loss on a single event.
- **Recommendation:** Record a succession or backup-owner plan,
  per [REC-018](#rec-018-record-a-continuity-plan).
- **Method:** Author-concentration census.
- **Verification:** Yes - committer identity uniform across the reflog.
- **Confirmation:** No - upstream author data not fully enumerated on this clone.
- **Confidence:** HIGH - reflog evidence is direct.
- **Mitigation:** The risk is a recorded decision, not an oversight.
- **Evidence:** [EVD-029](#evidence-list), [EVD-037](#evidence-list)
- **Absence:** Deliberate - recorded decision

### FND-INF-008 Missing window review for released 1.3.6

The `docs/review/` holds reviews for 1.2.9 and 1.3.0 through 1.3.5 plus 1.3.7.

The file `review-1.3.6.md` is absent despite eight change records in that released window.

The release gate warns rather than fails on missing reviews.

- **Pillar:** Infrastructure & CI/CD
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `docs/review/`
- **Basis:** Inspected
- **Criteria:** MNT-GOV
- **Impact:** One released window passed without its review step.
- **Recommendation:** Write the 1.3.6 review or record a waiver,
  per [REC-019](#rec-019-resolve-the-missing-136-review).
- **Method:** Review-record pairing.
- **Verification:** Yes - directory listing shows the gap.
- **Confirmation:** No - record contents not opened (restricted).
- **Confidence:** MEDIUM - the gap is filename-level.
- **Mitigation:** A waiver path exists for ad-hoc bumps.
- **Evidence:** [EVD-029](#evidence-list)
- **Absence:** Undetermined

### FND-CPR-001 Production dependency license outside the declared whitelist

The `argparse@2.0.1`, a production dependency of js-yaml, carries `Python-2.0`.

Which is absent from the `docs/COPYRIGHTS.md:20` permitted-license whitelist and is the only.

Production-chain license outside it.

- **Pillar:** Copyrights & Originality
- **Severity:** MEDIUM
- **Type:** Concern
- **Status:** Open
- **Change:** New
- **Targets:** `package-lock.json`, `docs/COPYRIGHTS.md`
- **Basis:** Inspected
- **Criteria:** CPR-DEPLIC
- **Impact:** A shipped dependency sits under a license the project's own policy has not reviewed.
- **Recommendation:** Review Python-2.0 and extend the whitelist or replace the dependency path,
  per [REC-016](#rec-016-reconcile-the-license-whitelist-with-the-resolved-set).
- **Method:** Dependency license classification.
- **Verification:** Yes - license field read from the lockfile.
- **Confirmation:** No - installed-package metadata not enumerated.
- **Confidence:** HIGH - license field is recorded metadata.
- **Mitigation:** Python-2.0 is permissive-class and the whitelist records evaluated licenses rather
  than blocking unknown ones.
- **Evidence:** [EVD-027](#evidence-list)

### FND-CPR-002 Copyright attribution inconsistency

The `LICENSE` reads "Copyright (c) 2025 Zoltar X / New Generation" while `package.json`.

The `build.copyright` reads "Copyright (c) 2024 Filip Golewski".

Per-file headers exist only on the vendored `zx0.ts` (correctly retained BSD-3-Clause notice).

- **Pillar:** Copyrights & Originality
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Targets:** `LICENSE`, `package.json`
- **Basis:** Inspected
- **Criteria:** CPR-NOTICE
- **Impact:** Attribution ambiguity in distributed binaries.
- **Recommendation:** Align `build.copyright` with `LICENSE`,
  per [REC-017](#rec-017-align-copyright-attribution-fields).
- **Method:** License and notice census.
- **Verification:** Yes - both fields read directly.
- **Confirmation:** No - installer metadata not built for audit.
- **Confidence:** HIGH - fields diff mechanically.
- **Mitigation:** Both fields name the same natural person.
- **Evidence:** [EVD-028](#evidence-list)

### FND-AIP-001 Per-commit AI provenance unverifiable

AI-assisted authorship is documented (README names Windsurf and GPT 5.1.

The `docs/WORKFLOW.md:359` defines the `AI-assisted: <tool>` change-record convention).

Git authorship is a single identity for 100 percent of commits.

One agent prompt also leaked as a commit subject (`c6daeb4`).aked.

As a commit subject (`c6daeb4`).

- **Pillar:** AI Provenance & Code Origin
- **Severity:** LOW
- **Type:** Observation
- **Status:** Open
- **Change:** New
- **Provenance:** Declared
- **Targets:** `.git`, `docs/WORKFLOW.md`, `README.md`
- **Basis:** Inspected
- **Criteria:** MNT-GOV
- **Impact:** Per-commit provenance cannot be reconstructed from history.
- **Recommendation:** Enforce the recorded AI-assisted trailer convention on new commits,
  per [REC-021](#rec-021-enforce-the-ai-assisted-commit-convention).
- **Method:** History-hygiene census.
- **Verification:** Yes - authorship and conventions inspected.
- **Confirmation:** No - commit provenance not cross-checked upstream.
- **Confidence:** MEDIUM - reflog evidence is direct for this clone.
- **Mitigation:** Change records carry the convention and provenance is honest at document level.
- **Evidence:** [EVD-029](#evidence-list)

## Unified Risk Register

Nine risks registered: 1 High, 5 Medium, 3 Low.

| Risk                                                                     | Severity | Likelihood | Source                                                                                                | Summary                                                    |
|--------------------------------------------------------------------------|----------|------------|-------------------------------------------------------------------------------------------------------|------------------------------------------------------------|
| [RSK-001](#rsk-001-renderer-freeze-or-oom-on-crafted-input)              | High     | Medium     | [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)            | Renderer freeze or [OOM](#glossary-index) on crafted input |
| [RSK-002](#rsk-002-remote-content-executes-inside-an-application-window) | Medium   | Low        | [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron)                            | Remote content executes inside an application window       |
| [RSK-003](#rsk-003-external-importers-produce-incompatible-files)        | Medium   | Medium     | [FND-ARC-002](#fnd-arc-002-formatmd-and-architecturemd-drift-from-shipped-behavior)                   | External importers produce incompatible files              |
| [RSK-004](#rsk-004-preview-engines-diverge-silently-across-five-copies)  | Medium   | Medium     | [FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks) | Preview engines diverge silently across five copies        |
| [RSK-005](#rsk-005-build-time-dos-surface-stays-unpatched)               | Low      | Low        | [FND-INF-001](#fnd-inf-001-12-moderate-transitive-advisories-in-dev-tooling-chains)                   | Build-time DoS surface stays unpatched                     |
| [RSK-006](#rsk-006-total-continuity-loss-on-a-single-event)              | Medium   | Low        | [FND-INF-007](#fnd-inf-007-single-author-bus-factor-accepted)                                         | Total continuity loss on a single event                    |
| [RSK-007](#rsk-007-silent-user-data-loss-on-saveload)                    | Medium   | Medium     | [FND-CQY-001](#fnd-cqy-001-custom-pattern-names-silently-dropped-on-save)                             | Silent user data loss on save/load                         |
| [RSK-008](#rsk-008-deleted-song-resurrects-from-the-mirror)              | Low      | Low        | [FND-CQY-005](#fnd-cqy-005-reset-can-resurrect-a-deleted-song-from-the-mirror)                        | Deleted song resurrects from the mirror                    |
| [RSK-009](#rsk-009-shipped-dependency-under-unreviewed-license-class)    | Low      | Low        | [FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist)              | Shipped dependency under unreviewed license class          |

Severity derives from the impact/likelihood matrix, not CVSS.

### RSK-001 Renderer freeze or OOM on crafted input

The unbounded run-length expansion lets a small crafted file allocate renderer-killing memory.

- **Severity:** HIGH
- **Likelihood:** MEDIUM - only a shared or pasted file is required.
- **Residual:** LOW after bounded expansion lands.
- **Status:** Open
- **Impact:** Local denial of service, unsaved-work loss on crash.
- **Trigger:** User opens or pastes a crafted `.yaml`.
- **Controls:** Generic error modal on parse throw, none on allocation.
- **Mitigation:** Cap `count` at remaining pattern length plus a byte cap on import.
- **Closure:** [REC-001](#rec-001-bound-run-length-expansion-and-cap-import-size)
  verified by a bounded-expansion test.
- **Source:**
  [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)
- **Confidence:** HIGH - allocation path is unconditional.

### RSK-002 Remote content executes inside an application window

Missing `setWindowOpenHandler`/`will-navigate` lets markdown links open remote pages in a.

Preload-carrying window.

- **Severity:** MEDIUM
- **Likelihood:** LOW - requires a user click in a packaged build.
- **Residual:** LOW after navigation handlers land.
- **Status:** Open
- **Impact:** Remote code executes with the app preload surface visible.
- **Trigger:** Click on a `target="_blank"` link in a bundled document.
- **Controls:** Sandbox, contextIsolation, minimal preload API.
- **Mitigation:** Navigation handlers denying or delegating to `shell.openExternal`.
- **Closure:** [REC-002](#rec-002-add-navigation-containment-to-the-electron-shell)
  verified in a packaged build.
- **Source:**
  [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron)
- **Confidence:** HIGH - handler absence is mechanical.

### RSK-003 External importers produce incompatible files

The `FORMAT.md` documents keys the saver does not emit.

Steering any external tool toward a different dialect.

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - the documented schema is the natural reference.
- **Residual:** LOW after doc reconciliation.
- **Status:** Open
- **Impact:** Third-party tooling writes files that diff-churn on every re-save.
- **Trigger:** An external importer follows `FORMAT.md` literally.
- **Controls:** Parser accepts the wider documented set inbound.
- **Mitigation:** Reconcile the doc with emitted keys or version the format.
- **Closure:** [REC-003](#rec-003-reconcile-formatmd-with-the-emitted-saver-schema)
  verified by a doc-to-emitter diff.
- **Source:**
  [FND-ARC-002](#fnd-arc-002-formatmd-and-architecturemd-drift-from-shipped-behavior)
- **Confidence:** HIGH - the key sets diff mechanically.

### RSK-004 Preview engines diverge silently across five copies

The preview-envelope engine exists in five implementations, any of which can drift from the others.

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - five surfaces invite one-sided fixes.
- **Residual:** LOW after consolidation.
- **Status:** Open
- **Impact:** Inconsistent envelope preview behavior across surfaces.
- **Trigger:** A fix lands in one copy and is not ported.
- **Controls:** Manual audio verification and e2e smoke only.
- **Mitigation:** Consolidate to one ref-driven implementation.
- **Closure:** [REC-006](#rec-006-consolidate-the-preview-envelope-engine)
  verified by a single remaining implementation.
- **Source:**
  [FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks)
  onents-and-hooks)
- **Confidence:** MEDIUM - semantic parity unverified.

### RSK-005 Build-time DoS surface stays unpatched

12 moderate `minimatch` advisories persist in dev-only transitive chains.

- **Severity:** LOW
- **Likelihood:** LOW - requires hostile input reaching build tooling.
- **Residual:** LOW after chain upgrade.
- **Status:** Open
- **Impact:** Denial of service inside build tooling only.
- **Trigger:** Hostile glob input to electron-builder or typescript-eslint chains.
- **Controls:** DevDependencies only, no shipped reach.
- **Mitigation:** Chain upgrade when a compatible path exists.
- **Closure:** [REC-007](#rec-007-clear-the-minimatch-advisory-chain)
  verified by a clean `npm audit`.
- **Source:**
  [FND-INF-001](#fnd-inf-001-12-moderate-transitive-advisories-in-dev-tooling-chains)
- **Confidence:** HIGH - advisory output is authoritative.

### RSK-006 Total continuity loss on a single event

One author accounts for 100 percent of commits with no named continuity owner.

- **Severity:** MEDIUM
- **Likelihood:** LOW - actuarial, but total impact.
- **Residual:** Accepted - owner-recorded decision.
- **Status:** Open
- **Impact:** Project stops on a single event.
- **Trigger:** Single maintainer becomes unavailable.
- **Controls:** Strong documentation corpus as institutional memory.
- **Mitigation:** Recorded succession plan and backup owner.
- **Closure:** [REC-018](#rec-018-record-a-continuity-plan) produces a recorded plan.
- **Source:**
  [FND-INF-007](#fnd-inf-007-single-author-bus-factor-accepted)
- **Confidence:** HIGH - authorship census is complete for this clone.

### RSK-007 Silent user data loss on save/load

The `Pattern.name` is never written, so custom names revert on every round-trip.

- **Severity:** MEDIUM
- **Likelihood:** MEDIUM - any user who renames patterns hits it.
- **Residual:** LOW after name persistence lands.
- **Status:** Open
- **Impact:** Silent loss of user metadata.
- **Trigger:** Rename a pattern, save, reload.
- **Controls:** None - the loss is silent by construction.
- **Mitigation:** Persist `name` in the pattern node.
- **Closure:** [REC-004](#rec-004-persist-patternname-on-save) verified by a round-trip test.
- **Source:**
  [FND-CQY-001](#fnd-cqy-001-custom-pattern-names-silently-dropped-on-save)
- **Confidence:** HIGH - the missing write is mechanical.

### RSK-008 Deleted song resurrects from the mirror

RESET's fire-and-forget mirror clear can lose to the synchronous reload.

Resurrecting the deleted song.

- **Severity:** LOW
- **Likelihood:** LOW - requires the mirror clear to lose the reload race.
- **Residual:** LOW after ordering or flag consumption lands.
- **Status:** Open
- **Impact:** Deleted user data reappears unexpectedly.
- **Trigger:** System reset on a mirrored song with a slow [IDB](#glossary-index) commit.
- **Controls:** Reset flag exists but is unconsumed.
- **Mitigation:** Await the clear or gate restore on the flag.
- **Closure:** [REC-015](#rec-015-make-reset-durably-delete-mirrored-data)
  verified by resurrection-free reset.
- **Source:**
  [FND-CQY-005](#fnd-cqy-005-reset-can-resurrect-a-deleted-song-from-the-mirror)
- **Confidence:** MEDIUM - race window is timing-dependent.

### RSK-009 Shipped dependency under unreviewed license class

The `argparse` Python-2.0 ships in the production closure outside the declared whitelist.

- **Severity:** LOW
- **Likelihood:** LOW - permissive-class license, policy gap only.
- **Residual:** LOW after whitelist review.
- **Status:** Open
- **Impact:** Unreviewed license obligations in distribution.
- **Trigger:** Distribution of the app with the unreviewed license class.
- **Controls:** Whitelist is a policy, not a gate.
- **Mitigation:** Review and extend the whitelist.
- **Closure:** [REC-016](#rec-016-reconcile-the-license-whitelist-with-the-resolved-set)
  verified by a complete-whitelist diff.
- **Source:**
  [FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist) ist)
- **Confidence:** HIGH - license field is recorded metadata.

## Technical Debt Register

### TDR-001 `App.tsx` 1143-line orchestrator, documented decomposition debt

The `App.tsx` 1143-line orchestrator, documented decomposition debt.

- **Category:** Maintainability
- **Source:** Direct observation
- **Status:** Open
- **Cost:** High touch-cost on change

### TDR-002 Preview-envelope engine x5

Preview-envelope engine x5
([FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks)).

- **Category:** Maintainability
- **Source:**
  [FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks)
- **Status:** Open
- **Cost:** Divergence tax per fix

### TDR-003 About 19 silent catches plus dead exports and flags

About 19 silent catches plus dead exports and flags.

The check ([FND-CQY-004](#fnd-cqy-004-silent-catches-and-dead-surface-on-midi-and-sequencer-paths)).

- **Category:** Maintainability
- **Source:**
  [FND-CQY-004](#fnd-cqy-004-silent-catches-and-dead-surface-on-midi-and-sequencer-paths)
- **Status:** Open
- **Cost:** Hidden-failure cost

### TDR-004 8 dead fixtures plus jest-dom weight

8 dead fixtures plus jest-dom weight.

The check ([FND-INF-006](#fnd-inf-006-dead-dependency-and-unreferenced-fixtures)).

- **Category:** Maintainability
- **Source:**
  [FND-INF-006](#fnd-inf-006-dead-dependency-and-unreferenced-fixtures)
- **Status:** Open
- **Cost:** Inventory noise

### TDR-005 Monolith `App.css` 3569 lines, no per-panel split

Monolith `App.css` 3569 lines, no per-panel split.

- **Category:** Maintainability
- **Source:** Direct observation
- **Status:** Open
- **Cost:** Per-panel split candidate

## Scope Exclusions

- **Dynamic/runtime penetration testing** - `Not performed` by default - no live exploitation was
  attempted, and security findings carry source-level evidence only.

A scoped penetration test is
  a separately commissioned engagement.
- **Organizational and team interviews, business-fit assessment** - `Not performed` by default.
  The report covers the engineering pillars of a technical due diligence,
  not the interview-based pillars.
- **Compliance certification and attestation** - this report is not an ISO/IEC 27001 certification,
  a SOC 2 attestation, or a PCI-DSS assessment.

Referenced standards are scoring
  rubrics and coverage checklists only.
- **Operational runtime infrastructure** - `Not inspected` - no servers, hosting,
  or live deployment exists, only the deployment path and packaging configuration were audited.
- **End-user devices and browser internals** - `Not inspected` - Web Audio behavior across host OS
  and browser combinations is outside source-visible scope.
- **Restricted document directories** - `Excluded by scope`. `docs/change`, `docs/plan`,
  `docs/archive`, `docs/refactoring`, `docs/report`, `docs/prompt`, `docs/feature`, `docs/discard`,
  `docs/review`, `docs/lesson`, and `docs/decision` were enumerated by filename only per the
  repository's own read-restriction rules.
- **Omitted conditional sections** - API Contract Conformance is omitted because the subject is an
  application rather than a library (contract checks live under CMP-* criteria on the
  file-format surface).

AI System Assessment is omitted (not an AI system).

Most Skill Definition
  criteria are not applicable (no authored skills, the agent-guidance set was assessed and passed).

The coverage statement (ISO/IEC 25010:2023) assesses functional suitability,
reliability via operational safety, usability-adjacent interaction paths,
efficiency at source level, maintainability, portability,
and compatibility-adjacent contract checks.

Not assessed: interactive usability evaluation and full compatibility testing,
both requiring deployed execution beyond the commissioned commands.

OWASP Top 10 coverage: client-side-relevant categories (A03, A05, A07 partial, A08),
server-side categories (A01, A02, A04, A06, A09, A10) are inapplicable to a backendless local app.

## Known Limitations

| Item                                          | Reason                                     | Resolution                              |
|-----------------------------------------------|--------------------------------------------|-----------------------------------------|
| Exact code coverage percentage                | `test:coverage` was not commissioned       | `npm run test:coverage`                 |
| Audio latency and glitch behavior             | Requires live audio profiling              | Browser audio profiling session         |
| Packaged-Electron link behavior               | Requires a packaged build                  | `npm run pack` plus manual click test   |
| [OOM](#glossary-index) reproduction threshold | Requires a crafted-input harness           | Bounded `space:N` fuzz harness          |
| Upstream commit count (secondary clone)       | This clone is a second working copy        | `git rev-list --count` on primary clone |
| Installed-tree license fields                 | Lockfile metadata used, 4 pkgs lack fields | `npm ci` plus package.json census       |
| Semantic parity of 5 preview-engine copies    | Requires differential execution            | Shared-harness behavior diff            |
| `will-navigate` runtime reachability          | Theoretical, no packaged run performed     | Packaged-build navigation test          |

## Executed Evidence

| Check            | Tool & Version              | Command             | Result | Resolves                                                                                          |
|------------------|-----------------------------|---------------------|--------|---------------------------------------------------------------------------------------------------|
| Unit test suite  | vitest 4.1.12, node 26.13.0 | `npm test`          | Pass   | TST-WFLOW, TST-ASSERT, TST-ISO                                                                    |
| Typecheck script | tsc 5.9.3                   | `npm run typecheck` | Pass   | N-04 gate (vacuous by design)                                                                     |
| Lint             | eslint 9.39.5               | `npm run lint`      | Pass   | N-05, CQY-ANALYSIS                                                                                |
| Production build | rolldown-vite 7.3.1, tsc -b | `npm run build`     | Pass   | DEP-BUILD, real type gate                                                                         |
| Dependency audit | npm 11.20.0                 | `npm audit`         | Fail   | DEP-ADVISORY, [FND-INF-001](#fnd-inf-001-12-moderate-transitive-advisories-in-dev-tooling-chains) |
| E2E suite        | @playwright/test 1.64.1     | `npm run test:e2e`  | Pass   | FNC-JOURNEY                                                                                       |

All executions ran inside an isolated copy at `work/isolation/` and the audited
tree was never mutated.

The `npm run build` command ran as the documented prerequisite for the e2e suite's
`vite preview` server.

## Further Verification

| Claim                                    | Command / Procedure                     | Pass Criteria                        | Resolves                                                                                              |
|------------------------------------------|-----------------------------------------|--------------------------------------|-------------------------------------------------------------------------------------------------------|
| Coverage target unmet                    | `npm run test:coverage`                 | All metrics at or above 80 percent   | [FND-CQY-007](#fnd-cqy-007-configured-80-percent-coverage-threshold-is-unmet)                         |
| [OOM](#glossary-index) defect reproduces | Crafted `space: 1e6` YAML import        | Bounded allocation or graceful error | [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)            |
| Remote-window surface                    | Packaged build plus markdown-link click | Navigation denied or external shell  | [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron)                            |
| Pattern-name loss                        | Rename, save, load round-trip           | Name preserved                       | [FND-CQY-001](#fnd-cqy-001-custom-pattern-names-silently-dropped-on-save)                             |
| Modal keyboard dead-paths                | e2e Escape/Enter on quit-confirm modal  | Both keys act                        | [FND-CQY-002](#fnd-cqy-002-quit-confirm-modal-unreachable-by-keyboard-on-its-own)                     |
| Reset resurrection                       | Reset then immediate reload twice       | No mirror-restore notice             | [FND-CQY-005](#fnd-cqy-005-reset-can-resurrect-a-deleted-song-from-the-mirror)                        |
| Preview-engine parity                    | Differential harness over 5 copies      | Identical output envelope            | [FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks) |
| Audio hot-path timing                    | Browser profiling at 50 and 60 Hz       | No underruns at tick rate            | PRF-MEASURE                                                                                           |

## Remediation Roadmap

| Rec                                                                       | Priority | Finding                                                                                               | Recommendation                                                      | Impact | Effort | Complexity | Verification                            |
|---------------------------------------------------------------------------|----------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|--------|--------|------------|-----------------------------------------|
| [REC-001](#rec-001-bound-run-length-expansion-and-cap-import-size)        | P1       | [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)            | Bound run-length expansion and cap import size                      | HIGH   | LOW    | LOW        | Bounded-allocation unit test            |
| [REC-002](#rec-002-add-navigation-containment-to-the-electron-shell)      | P1       | [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron)                            | Add navigation containment to the Electron shell                    | HIGH   | LOW    | LOW        | Packaged-build link-click test          |
| [REC-003](#rec-003-reconcile-formatmd-with-the-emitted-saver-schema)      | P1       | [FND-ARC-002](#fnd-arc-002-formatmd-and-architecturemd-drift-from-shipped-behavior)                   | Reconcile FORMAT.md with emitted saver schema                       | MEDIUM | LOW    | LOW        | Doc-to-emitter diff                     |
| [REC-004](#rec-004-persist-patternname-on-save)                           | P1       | [FND-CQY-001](#fnd-cqy-001-custom-pattern-names-silently-dropped-on-save)                             | Persist `Pattern.name` on save                                      | MEDIUM | LOW    | LOW        | Round-trip test preserves name          |
| [REC-005](#rec-005-close-modal-keyboard-dead-paths)                       | P2       | [FND-CQY-002](#fnd-cqy-002-quit-confirm-modal-unreachable-by-keyboard-on-its-own)                     | Close modal keyboard dead-paths                                     | MEDIUM | LOW    | LOW        | e2e Escape/Enter on both modals         |
| [REC-006](#rec-006-consolidate-the-preview-envelope-engine)               | P2       | [FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks) | Consolidate the preview-envelope engine                             | MEDIUM | HIGH   | MEDIUM     | Single implementation plus timing check |
| [REC-007](#rec-007-clear-the-minimatch-advisory-chain)                    | P2       | [FND-INF-001](#fnd-inf-001-12-moderate-transitive-advisories-in-dev-tooling-chains)                   | Clear the minimatch advisory chain                                  | LOW    | MEDIUM | MEDIUM     | `npm audit` clean                       |
| [REC-008](#rec-008-migrate-off-deprecated-toolchain-lines)                | P3       | [FND-INF-002](#fnd-inf-002-two-direct-dependencies-resolve-to-deprecated-versions)                    | Migrate off deprecated toolchain lines                              | MEDIUM | MEDIUM | MEDIUM     | Lint and build pass on new lines        |
| [REC-009](#rec-009-sync-the-lockfile-version-inside-the-bump-script)      | P3       | [FND-INF-003](#fnd-inf-003-lockfile-version-drifts-from-manifest)                                     | Sync the lockfile version in the bump script                        | LOW    | LOW    | LOW        | `lockfile == manifest`                  |
| [REC-010](#rec-010-bring-configs-e2e-and-electron-inside-analysis-scope)  | P3       | [FND-INF-004](#fnd-inf-004-static-analysis-scope-excludes-configs-e2e-and-electron-code)              | Bring configs/e2e/electron inside analysis scope                    | MEDIUM | LOW    | LOW        | Lint and typecheck cover all files      |
| [REC-011](#rec-011-add-a-mechanical-toolchain-floor)                      | P3       | [FND-INF-005](#fnd-inf-005-no-mechanical-toolchain-floor)                                             | Add a mechanical toolchain floor                                    | LOW    | LOW    | LOW        | `npm ci` on floor version               |
| [REC-012](#rec-012-remove-dead-dependency-and-unreferenced-fixtures)      | P4       | [FND-INF-006](#fnd-inf-006-dead-dependency-and-unreferenced-fixtures)                                 | Remove dead dependency and unreferenced fixtures                    | LOW    | LOW    | LOW        | `npm test` still green                  |
| [REC-013](#rec-013-derive-the-midi-preview-tick-from-the-frame-rate)      | P3       | [FND-CQY-003](#fnd-cqy-003-midi-live-preview-tick-offset-hardcoded-at-20-ms)                          | Derive the [MIDI](#glossary-index) preview tick from the frame rate | LOW    | LOW    | LOW        | 60 Hz preview test                      |
| [REC-014](#rec-014-log-silent-catches-and-trim-dead-surface)              | P3       | [FND-CQY-004](#fnd-cqy-004-silent-catches-and-dead-surface-on-midi-and-sequencer-paths)               | Log silent catches and trim dead surface                            | MEDIUM | LOW    | LOW        | Census recount plus lint clean          |
| [REC-015](#rec-015-make-reset-durably-delete-mirrored-data)               | P2       | [FND-CQY-005](#fnd-cqy-005-reset-can-resurrect-a-deleted-song-from-the-mirror)                        | Make RESET durably delete mirrored data                             | MEDIUM | LOW    | LOW        | Resurrection-free reset                 |
| [REC-016](#rec-016-reconcile-the-license-whitelist-with-the-resolved-set) | P2       | [FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist)              | Reconcile the license whitelist                                     | MEDIUM | LOW    | LOW        | Whitelist covers every prod license     |
| [REC-017](#rec-017-align-copyright-attribution-fields)                    | P4       | [FND-CPR-002](#fnd-cpr-002-copyright-attribution-inconsistency)                                       | Align copyright attribution fields                                  | LOW    | LOW    | LOW        | Field diff                              |
| [REC-018](#rec-018-record-a-continuity-plan)                              | P3       | [FND-INF-007](#fnd-inf-007-single-author-bus-factor-accepted)                                         | Record a continuity plan                                            | MEDIUM | LOW    | LOW        | Succession note exists                  |
| [REC-019](#rec-019-resolve-the-missing-136-review)                        | P3       | [FND-INF-008](#fnd-inf-008-missing-window-review-for-released-136)                                    | Resolve the missing 1.3.6 review                                    | LOW    | LOW    | LOW        | `release-check` passes clean            |
| [REC-020](#rec-020-align-tests-with-their-own-documented-rules)           | P4       | [FND-CQY-006](#fnd-cqy-006-test-suite-violates-two-of-its-own-documented-rules)                       | Align tests with their own documented rules                         | LOW    | LOW    | LOW        | `npm test` green                        |
| [REC-021](#rec-021-enforce-the-ai-assisted-commit-convention)             | P4       | [FND-AIP-001](#fnd-aip-001-per-commit-ai-provenance-unverifiable)                                     | Enforce the AI-assisted commit convention                           | LOW    | LOW    | LOW        | Trailer census on new commits           |
| [REC-022](#rec-022-close-the-coverage-gap-to-the-80-percent-threshold)    | P3       | [FND-CQY-007](#fnd-cqy-007-configured-80-percent-coverage-threshold-is-unmet)                         | Close the coverage gap to the 80 percent threshold                  | HIGH   | HIGH   | MEDIUM     | `npm run test:coverage` green           |

### REC-001 Bound run-length expansion and cap import size

Cap `for (i < count)` at `targetLength - i` in `songParser.ts` and `trackClipboard.ts`.

The same change adds a size check before `readAsText` and fetch-based imports.

- **Priority:** P1
- **Finding:**
  [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)
- **Condition:** `count` is bounded to remaining pattern length at both expansion sites and imported
  files carry a byte cap.
- **Impact:** The crafted-YAML [OOM](#glossary-index) path closes.
- **Effort:** LOW - two loops plus a guard.
- **Complexity:** LOW - mechanical bounds.
- **Verification:** Unit test feeding `space: 1e6` asserts bounded allocation.

### REC-002 Add navigation containment to the Electron shell

Install `setWindowOpenHandler` and a `will-navigate` restrictor in `main.cjs`.

- **Priority:** P1
- **Finding:** [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron)
- **Condition:** New windows are denied or delegated to `shell.openExternal`,
  and navigation is restricted to the app origin.
- **Impact:** Remote content can no longer execute inside an app window.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Clicking a bundled-doc link in a packaged build opens the
  external browser or nothing.

### REC-003 Reconcile FORMAT.md with the emitted saver schema

Update saver sections to `line`/`step`/`wait`/`shift` and the clipboard root to `step`.

Per the docs-first rule.

- **Priority:** P1
- **Finding:** [FND-ARC-002](#fnd-arc-002-formatmd-and-architecturemd-drift-from-shipped-behavior)
- **Condition:** Every saver key in `FORMAT.md` matches emitted output,
  or the format carries a version marker.
- **Impact:** External importers write the same dialect the saver emits.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Emitted YAML keys diff clean against the documented schema.

### REC-004 Persist `Pattern.name` on save

Write `name` in `patternNode` when it differs from the default.

- **Priority:** P1
- **Finding:** [FND-CQY-001](#fnd-cqy-001-custom-pattern-names-silently-dropped-on-save)
- **Condition:** Custom pattern names survive a save/load round-trip.
- **Impact:** Silent user-data loss stops.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Rename, save, load - name preserved.

### REC-005 Close modal keyboard dead-paths

Add `isQuitConfirmOpen` to both guards and `instrumentOperationSummary` to the Enter chain.

- **Priority:** P2
- **Finding:** [FND-CQY-002](#fnd-cqy-002-quit-confirm-modal-unreachable-by-keyboard-on-its-own)
- **Condition:** Quit-confirm and instrument-operation modals respond to Escape and Enter.
- **Impact:** Documented keyboard contract holds on every modal.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** e2e Escape and Enter on both modals.

### REC-006 Consolidate the preview-envelope engine

Extract the engine into a shared hook under `src/hooks/`.

Keeping ref-driven timing to protect the audio path.

- **Priority:** P2
- **Finding:**
  [FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks)
- **Condition:** One ref-driven preview-envelope implementation is consumed by all five call sites.
- **Impact:** Divergence risk removed and preview fixes land once.
- **Effort:** HIGH - touches five surfaces.
- **Complexity:** MEDIUM - audio-critical constraints apply.
- **Verification:** Single implementation remains and manual timing check passes.

### REC-007 Clear the minimatch advisory chain

Upgrade electron-builder and typescript-eslint chains when compatible versions exist.

- **Priority:** P2
- **Finding:** [FND-INF-001](#fnd-inf-001-12-moderate-transitive-advisories-in-dev-tooling-chains)
- **Condition:** `npm audit` reports zero advisories or a documented residual.
- **Impact:** Advisory debt stops accumulating.
- **Effort:** MEDIUM - breaking-change review required.
- **Complexity:** MEDIUM.
- **Verification:** `npm audit` exits clean.

### REC-008 Migrate off deprecated toolchain lines

Plan eslint 10 and Vite 8 migrations when those lines stabilize.

- **Priority:** P3
- **Finding:** [FND-INF-002](#fnd-inf-002-two-direct-dependencies-resolve-to-deprecated-versions)
- **Condition:** eslint and the vite alias sit on supported release lines.
- **Impact:** Toolchain stays supported.
- **Effort:** MEDIUM.
- **Complexity:** MEDIUM.
- **Verification:** Lint and build pass on the new lines.

### REC-009 Sync the lockfile version inside the bump script

Run `npm install` (or equivalent version write) inside `bump-version.mjs`.

- **Priority:** P3
- **Finding:** [FND-INF-003](#fnd-inf-003-lockfile-version-drifts-from-manifest)
- **Condition:** `package-lock.json` version equals `package.json` version after every bump.
- **Impact:** Release metadata stays coherent.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** `lockfile == manifest` after the next bump.

### REC-010 Bring configs, e2e, and electron inside analysis scope

Extend the eslint `files` scope and tsconfig references.

It also adds a `pretest:e2e` build or a build-capable `webServer` command.

- **Priority:** P3
- **Finding:**
  [FND-INF-004](#fnd-inf-004-static-analysis-scope-excludes-configs-e2e-and-electron-code)
- **Condition:** `vitest.config.ts`, `playwright.config.ts`, `e2e/`,
  and `electron/` sit inside lint and typecheck scope, and e2e builds before previewing.
- **Impact:** The unchecked file set disappears and stale-dist false-passes become impossible.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Lint and typecheck report on every source file.

### REC-011 Add a mechanical toolchain floor

Encode Node 26.13.0 plus npm 11.20.0 in the manifest.

- **Priority:** P3
- **Finding:** [FND-INF-005](#fnd-inf-005-no-mechanical-toolchain-floor)
- **Condition:** `engines` or `packageManager` declares the floor and `.nvmrc` pins it.
- **Impact:** Toolchain drift becomes visible at install time.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** `npm ci` succeeds under the declared floor.

### REC-012 Remove dead dependency and unreferenced fixtures

Remove the unused declaration and prune the eight dead fixtures.

- **Priority:** P4
- **Finding:** [FND-INF-006](#fnd-inf-006-dead-dependency-and-unreferenced-fixtures)
- **Condition:** `@testing-library/jest-dom` is uninstalled and `test/fixtures/` holds
  only referenced files.
- **Impact:** Inventory reflects reality.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** `npm test` still green.

### REC-013 Derive the MIDI preview tick from the frame rate

Replace the hardcoded `+ 20` with the frame-derived interval at both sites.

- **Priority:** P3
- **Finding:** [FND-CQY-003](#fnd-cqy-003-midi-live-preview-tick-offset-hardcoded-at-20-ms)
- **Condition:** The first live-preview tick derives from `song.frame` rather than a 20 ms constant.
- **Impact:** 60 Hz live preview keeps accurate timing.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Manual preview test at 60 Hz.

### REC-014 Log silent catches and trim dead surface

Convert silent catches to `logger.warn` and trim `useSequencer`'s dead return surface and the.

Dead flag.

- **Priority:** P3
- **Finding:**
  [FND-CQY-004](#fnd-cqy-004-silent-catches-and-dead-surface-on-midi-and-sequencer-paths)
- **Condition:** Each previously-silent catch logs via `logger.warn`,
  and the seven unused exports plus dead fields are removed.
- **Impact:** [MIDI](#glossary-index) degradation becomes diagnosable and surface noise drops.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Census recount shows zero silent sites and zero dead exports.

### REC-015 Make RESET durably delete mirrored data

Await `clearMirroredSnapshots()` or gate restore on the existing reset flag.

The fix also enumerates `dosound-tracker-*` keys instead of `clear()`.

- **Priority:** P2
- **Finding:** [FND-CQY-005](#fnd-cqy-005-reset-can-resurrect-a-deleted-song-from-the-mirror)
- **Condition:** The mirror clear commits before reload and `localStorage.clear()` is
  scoped to prefixed keys.
- **Impact:** Deleted data stays deleted.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Reset then reload twice shows no resurrection.

### REC-016 Reconcile the license whitelist with the resolved set

Review Python-2.0 and extend the whitelist or swap the js-yaml dependency path.

- **Priority:** P2
- **Finding:**
  [FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist)
- **Condition:** Every production-chain license sits inside `docs/COPYRIGHTS.md` permitted classes.
- **Impact:** Distribution licenses match declared policy.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Whitelist-to-lockfile diff is clean.

### REC-017 Align copyright attribution fields

Update the electron-builder copyright to the LICENSE entity and year.

- **Priority:** P4
- **Finding:** [FND-CPR-002](#fnd-cpr-002-copyright-attribution-inconsistency)
- **Condition:** `build.copyright` matches `LICENSE`.
- **Impact:** Attribution is unambiguous in distributed artifacts.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Fields diff clean.

### REC-018 Record a continuity plan

Document a continuity owner or escalation path per the owner-accepted risk.

- **Priority:** P3
- **Finding:** [FND-INF-007](#fnd-inf-007-single-author-bus-factor-accepted)
- **Condition:** A succession or backup-owner note exists in the workflow docs.
- **Impact:** Single-event continuity loss becomes survivable.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** A recorded plan exists.

### REC-019 Resolve the missing 1.3.6 review

Write the window review or document the waiver reason.

- **Priority:** P3
- **Finding:** [FND-INF-008](#fnd-inf-008-missing-window-review-for-released-136)
- **Condition:** `docs/review/1.3.6/` exists or a waiver is recorded.
- **Impact:** Every released window carries its review evidence.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** `release-check.sh` passes without the warning.

### REC-020 Align tests with their own documented rules

Repoint the spy at the `localStorage` object and move the fixture dependency inside `test/`.

- **Priority:** P4
- **Finding:** [FND-CQY-006](#fnd-cqy-006-test-suite-violates-two-of-its-own-documented-rules)
- **Condition:** No test touches `Storage.prototype` or reads outside `test/`.
- **Impact:** Latent test fragility removed.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** `npm test` green under both storage paths.

### REC-021 Enforce the AI-assisted commit convention

Adopt the trailer convention recorded in `WORKFLOW.md:359` on future commits.

- **Priority:** P4
- **Finding:** [FND-AIP-001](#fnd-aip-001-per-commit-ai-provenance-unverifiable)
- **Condition:** New commits carry the `AI-assisted:` marker where applicable.
- **Impact:** Per-commit provenance becomes reconstructable.
- **Effort:** LOW.
- **Complexity:** LOW.
- **Verification:** Trailer census on new commits.

### REC-022 Close the coverage gap to the 80 percent threshold

Grow tests on the highest-risk untested paths (sequencer worker, playback hooks.

Modals) until the gate passes.

- **Priority:** P3
- **Finding:** [FND-CQY-007](#fnd-cqy-007-configured-80-percent-coverage-threshold-is-unmet)
- **Condition:** `npm run test:coverage` passes all four 80 percent metrics.
- **Impact:** The configured gate becomes enforceable.
- **Effort:** HIGH - the gap spans many modules.
- **Complexity:** MEDIUM - testable units exist.
- **Verification:** `npm run test:coverage` exits 0.

### Recommendation Classification

| Rec                                                                       | Recommendation                                                      | Class       | Basis                        |
|---------------------------------------------------------------------------|---------------------------------------------------------------------|-------------|------------------------------|
| [REC-001](#rec-001-bound-run-length-expansion-and-cap-import-size)        | Bound run-length expansion and cap import size                      | Recommended | Blocks readiness gate        |
| [REC-002](#rec-002-add-navigation-containment-to-the-electron-shell)      | Add navigation containment to the Electron shell                    | Recommended | Live remote-content surface  |
| [REC-003](#rec-003-reconcile-formatmd-with-the-emitted-saver-schema)      | Reconcile FORMAT.md with the emitted saver schema                   | Recommended | Contract correctness         |
| [REC-004](#rec-004-persist-patternname-on-save)                           | Persist `Pattern.name` on save                                      | Recommended | Silent user-data loss        |
| [REC-005](#rec-005-close-modal-keyboard-dead-paths)                       | Close modal keyboard dead-paths                                     | Recommended | Documented keyboard contract |
| [REC-006](#rec-006-consolidate-the-preview-envelope-engine)               | Consolidate the preview-envelope engine                             | Recommended | Largest maintainability win  |
| [REC-007](#rec-007-clear-the-minimatch-advisory-chain)                    | Clear the minimatch advisory chain                                  | Recommended | Advisory hygiene             |
| [REC-008](#rec-008-migrate-off-deprecated-toolchain-lines)                | Migrate off deprecated toolchain lines                              | Recommended | Toolchain currency           |
| [REC-009](#rec-009-sync-the-lockfile-version-inside-the-bump-script)      | Sync the lockfile version inside the bump script                    | Recommended | Trivial metadata fix         |
| [REC-010](#rec-010-bring-configs-e2e-and-electron-inside-analysis-scope)  | Bring configs, e2e, and electron inside analysis scope              | Recommended | Verification reach           |
| [REC-011](#rec-011-add-a-mechanical-toolchain-floor)                      | Add a mechanical toolchain floor                                    | Recommended | Reproducibility              |
| [REC-012](#rec-012-remove-dead-dependency-and-unreferenced-fixtures)      | Remove dead dependency and unreferenced fixtures                    | Optional    | Inventory hygiene            |
| [REC-013](#rec-013-derive-the-midi-preview-tick-from-the-frame-rate)      | Derive the [MIDI](#glossary-index) preview tick from the frame rate | Recommended | Frame-rate correctness       |
| [REC-014](#rec-014-log-silent-catches-and-trim-dead-surface)              | Log silent catches and trim dead surface                            | Recommended | Failure-path visibility      |
| [REC-015](#rec-015-make-reset-durably-delete-mirrored-data)               | Make RESET durably delete mirrored data                             | Recommended | User-data integrity          |
| [REC-016](#rec-016-reconcile-the-license-whitelist-with-the-resolved-set) | Reconcile the license whitelist with the resolved set               | Recommended | Policy conformance           |
| [REC-017](#rec-017-align-copyright-attribution-fields)                    | Align copyright attribution fields                                  | Optional    | Attribution consistency      |
| [REC-018](#rec-018-record-a-continuity-plan)                              | Record a continuity plan                                            | Optional    | Organizational, not code     |
| [REC-019](#rec-019-resolve-the-missing-136-review)                        | Resolve the missing 1.3.6 review                                    | Recommended | Process completeness         |
| [REC-020](#rec-020-align-tests-with-their-own-documented-rules)           | Align tests with their own documented rules                         | Optional    | Convention cleanup           |
| [REC-021](#rec-021-enforce-the-ai-assisted-commit-convention)             | Enforce the AI-assisted commit convention                           | Optional    | Provenance hygiene           |
| [REC-022](#rec-022-close-the-coverage-gap-to-the-80-percent-threshold)    | Close the coverage gap to the 80 percent threshold                  | Recommended | Largest verification win     |

### Follow-up Plan

| Finding                                                                                               | Priority | Evidence                                    | Trigger                 |
|-------------------------------------------------------------------------------------------------------|----------|---------------------------------------------|-------------------------|
| [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers)            | P1       | Bounded-expansion unit test plus import cap | Next release window     |
| [FND-SEC-002](#fnd-sec-002-no-navigation-containment-in-packaged-electron)                            | P1       | Navigation-handler implementation           | Next Electron build     |
| [FND-ARC-002](#fnd-arc-002-formatmd-and-architecturemd-drift-from-shipped-behavior)                   | P1       | Reconciled FORMAT.md                        | Next documentation pass |
| [FND-CQY-001](#fnd-cqy-001-custom-pattern-names-silently-dropped-on-save)                             | P1       | Name-preserving round-trip test             | Next release window     |
| [FND-CQY-002](#fnd-cqy-002-quit-confirm-modal-unreachable-by-keyboard-on-its-own)                     | P2       | Keyboard-path e2e coverage                  | Next release window     |
| [FND-ARC-001](#fnd-arc-001-preview-envelope-engine-duplicated-five-times-across-components-and-hooks) | P2       | Single preview-engine module                | Refactoring window      |
| [FND-INF-001](#fnd-inf-001-12-moderate-transitive-advisories-in-dev-tooling-chains)                   | P2       | Clean `npm audit`                           | Lockfile change         |
| [FND-CPR-001](#fnd-cpr-001-production-dependency-license-outside-the-declared-whitelist)              | P2       | Updated whitelist                           | Next release window     |
| [FND-CQY-005](#fnd-cqy-005-reset-can-resurrect-a-deleted-song-from-the-mirror)                        | P2       | Resurrection-free reset test                | Next release window     |

Sign-off gates: [RSK-001](#rsk-001-renderer-freeze-or-oom-on-crafted-input)
must close before imported files can be considered trusted,
and [RSK-002](#rsk-002-remote-content-executes-inside-an-application-window)
before the next packaged desktop release.

Sign-off remains pending: verification ownership is `NOT SPECIFIED` and no named
owner exists for any row.

Standard triggers apply: an SBOM-drift re-audit on every manifest or lockfile change,
and pentest-escalation only if a High network-facing finding remains Theoretical after remediation
planning - none does here, since the High finding is local-input-bound.

## Reference Sources

| Reference                                   | Publisher or Author          | Used In                                                                                                   |
|---------------------------------------------|------------------------------|-----------------------------------------------------------------------------------------------------------|
| ISO/IEC 25010:2023                          | ISO/IEC                      | Scorecard crosswalk, coverage                                                                             |
| OWASP Top 10 (2025)                         | [OWASP](#glossary-index)     | Standards Conformance, Security                                                                           |
| OWASP ASVS 5.0.0                            | [OWASP](#glossary-index)     | Input-validation controls                                                                                 |
| CWE-400 (Uncontrolled Resource Consumption) | MITRE                        | [FND-SEC-001](#fnd-sec-001-unbounded-run-length-expansion-in-song-and-clipboard-importers) classification |
| NIST SP 800-30                              | [NIST](#glossary-index)      | Risk register methodology                                                                                 |
| STRIDE                                      | Microsoft                    | Threat Model                                                                                              |
| ISO 19011 plus NIST RMF                     | ISO, [NIST](#glossary-index) | Follow-up Plan                                                                                            |
| CISQ / SQALE                                | CISQ                         | Technical Debt Register                                                                                   |
| Electron Security Guidelines                | OpenJS Foundation            | Electron boundary assessment                                                                              |
| React documentation                         | React team, Meta             | Stack conformance                                                                                         |
| ECMAScript Language Specification           | Ecma International           | Stack conformance                                                                                         |
| MDN Web Docs                                | Mozilla                      | Web API semantics                                                                                         |
| GHSA-g3hv-75wg-m249                         | GitHub Advisory Database     | [FND-INF-001](#fnd-inf-001-12-moderate-transitive-advisories-in-dev-tooling-chains)                       |

- [ISO/IEC 25010](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [CWE-400](https://cwe.mitre.org/data/definitions/400.html)
- [NIST SP 800-30](https://csrc.nist.gov/publications/detail/sp/800-30/rev-1/final)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [React documentation](https://react.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)

All executions ran in an isolated copy and the audited tree was not modified.

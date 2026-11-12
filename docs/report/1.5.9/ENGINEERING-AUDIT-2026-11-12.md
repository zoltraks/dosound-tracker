# Engineering Audit - DOSOUND Tracker 1.5.9

## Document Information

| Field            | Value                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Audit            | Independent engineering audit, 2026-11-12                                                                                |
| Subject          | Commit `eeb20253a5a5dac6a6dde251d45087a78ce0cc76`; package version `1.5.9`                                               |
| Observation date | 2026-11-12, local time; source snapshot copied at 11:34:37                                                               |
| Platform         | macOS Darwin 27.2.0, arm64; Node 26.13.0; npm 11.20.0; Python 3.9.6                                                      |
| Tools            | TypeScript 5.9.3, ESLint 10.14.0, Prettier 3.9.10, Vite 8.3.7, Vitest 5.1.0, Playwright 1.65.0, electron-builder 26.18.1 |
| Scope            | Current source, tests, configuration, active requirements, dependency lockfile, web build and unpacked macOS app         |
| Evidence mode    | Declarations (D), source inspection (I), mechanical measurement (M), executed checks (E), inference (X), or unknown (U)  |
| Boundary         | Report only; no application source, test, configuration, or dependency files changed by this audit                       |

The checks ran from the independent copy at `work/audit-fresh-20261112/`, not from the working tree. It excluded `.git`, generated outputs, scratch data, and existing reports; `node_modules` was copied rather than symlinked. A byte comparison of 471 inspected source, public, configuration, and active-document files against the copy found zero differences after the subject commit landed. All 58 symlinks found under the copied `node_modules` resolved inside the copy. The copied files under `docs/refactoring/1.5.9/` and the new directory-purity test also matched the working tree. These are snapshot checks, not a claim that future edits will leave the report current.

Evidence citations use repository-relative `path:line-line` notation. `E01`-`E13` below identify actual check results. A passing test is evidence for the behavior it exercises, not proof of an untested hardware, browser, or timing claim. Existing audit reports were neither read nor used as evidence.

## Executive Summary

**Readiness: not ready for an unconditional release.** The browser build works in the tested environments: typecheck and lint pass, 1,335 unit/component tests pass, 30 browser smoke runs pass, the dependency advisory scan reports zero, and a macOS app packages successfully (`E01`, `E02`, `E05`, `E06`, `E08`-`E11`). These results do not clear the release bar. Branch coverage fails its configured threshold (79.59% versus 80%), Prettier rejects nine files, and the build emits an oversized-chunk warning (`E03`, `E04`, `E07`; `docs/TESTING.md:3-15`). The built web files and unpacked macOS app omit the project's own MIT license text (`FND-02`). Reset cannot be shown to clear mirrored composition data safely (`FND-01`).

Clear `FND-01` through `FND-04` and the verification gates in `FND-05` and `FND-08` before a release decision. Resolve the packaged-origin exposure (`FND-07`) and the documented shortcut mismatch (`FND-06`) against the product contract. Atari DOSOUND compatibility, audible glitch-free/sub-millisecond timing, non-macOS desktop delivery, and cold-load performance remain **unknown** under this audit rather than passed (`RISK-01`, `RISK-02`, `F-05`, `N-01`, `N-03`).

| Headline            | Result                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quality score       | `24/50 = 2.4/5 = 48%`; ten equally weighted dimensions; see Scored Assessment                                                                      |
| Formal requirements | 27 frozen: 8 supported, 14 partial, 2 nonconformant, 3 unknown                                                                                     |
| Automated checks    | Typecheck, lint, unit tests, browser smoke, audit scans, and macOS unpacked packaging pass; format and coverage fail; build exits 0 with a warning |
| Dependency advice   | Zero reported advisories at scan time; license policy and artifact notice problems remain separate                                                 |
| Decision rule       | Score is descriptive, not a substitute for the specific release blockers above                                                                     |

## System Context

DOSOUND Tracker is a client-side, three-channel AY/YM music editor targeting the Atari ST DOSOUND XBIOS command stream (`README.md:3-13`, `docs/PROJECT.md:3-24`). A React/TypeScript UI keeps song and instrument data in domain hooks, a small cross-component Zustand store keeps UI state, an AudioWorklet drives playback ticks, and selectable internal Web Audio and Ayumi worklet engines render sound (`docs/ARCHITECTURE.md:38-64`, `docs/ARCHITECTURE.md:85-97`). Export modules produce assembly, binary, dump, VGM, MAX, WAV, MOD, and MIDI output (`docs/SPECIFICATION.md:224-244`, `src/exports/asm.ts:1`, `src/exports/max.ts:1`). YAML files and localStorage hold user work; IndexedDB mirrors autosaves (`docs/FORMAT.md:24-76`, `src/utils/storage/persistenceMirror.ts:7-15`). Vite serves a static web bundle; Electron packages the same bundle for desktop (`package.json:23-38`, `electron/main.cjs:50-56`).

The format reader limits imported song and settings text before YAML parsing (`src/utils/song/songParser.ts:152-155`, `src/utils/settings/settingsYaml.ts:39-45`). Bundled-document fetches use a three-name allowlist, and the Markdown renderer escapes input before generating its own tags (`src/utils/markdown/bundledMarkdown.ts:5-40`, `src/utils/markdown/markdown.ts:3-17`). Production HTML receives a CSP, and Electron disables Node integration and enables context isolation (`vite.config.ts:7-30`, `electron/main.cjs:15-20`). These are inspected controls, not a penetration-test result.

## Bill of Materials

The census counted actual regular files under the named directories, excluding generated `dist/`, `release/`, installed `node_modules/`, and `work/`. Code lines are `splitlines()` counts, not semantic SLOC. The source denominator includes TypeScript/JavaScript and shell files under `src/`, `electron/`, and `scripts/`; the test numerator includes files named `*.test.ts[x]` or `*.spec.ts[x]` under `test/` and `e2e/`. Counts describe this snapshot (`M01`), not a historical trend.

| Role                   | Files      | Detail                                                                                                                    |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Application `src/`     | 210        | 199 TS/TSX modules, 31,991 code lines; 2 CSS files, 8 SVG files, 1 YAML asset                                             |
| Desktop `electron/`    | 3          | 3 CommonJS modules, 175 code lines                                                                                        |
| Automation `scripts/`  | 5          | 2 JS modules and 3 shell scripts, 284 code lines                                                                          |
| Unit/component `test/` | 178        | 144 test specs, 31 YAML fixtures, setup and helper files                                                                  |
| Browser `e2e/`         | 2          | 1 spec with 15 flows plus helper; 30 Chromium/WebKit executions                                                           |
| Static `public/`       | 53         | Worker, documents, YAML, icons, 5 Ubuntu fonts, and bundled `font/UFL.txt`                                                |
| Active `docs/` root    | 15         | Markdown documents counted; workflow directories not treated as active requirements                                       |
| Source-to-test         | 207 to 145 | 32,450 source code lines to 26,166 test-spec lines; file ratio `145/207 = 0.700`, line ratio `0.806`; neither is coverage |

**Size hotspots (`M01`).** `src/App.css` has 4,178 lines; among code modules, `src/App.tsx` has 1,081, `src/hooks/midi/useMidiMessageProcessing.ts` 691, `src/exports/asm.ts` 687, `src/hooks/song/useDataManagement.ts` 657, and `src/hooks/song/useSongManagement.ts` 651. The architecture explicitly accepts a central orchestration root while recognizing its navigation cost (`docs/ARCHITECTURE.md:131-141`); size by itself is debt, not a demonstrated defect.

**Direct dependencies (`package.json:40-71`, `M02`).** Five runtime declarations: `js-yaml`, `lucide-react`, `react`, `react-dom`, and `zustand`. Twenty-four dev declarations include TypeScript, Vite, ESLint, Vitest, Playwright, Electron, and electron-builder. The npm v3 lockfile records 570 installed package-path entries besides the root, 488 distinct leaf package names, 561 entries with `dev: true`, 49 optional entries, and no missing `license` fields. These flags describe lockfile classification, not exactly what each shipped artifact contains.

| License declaration cohort (`M02`)                   | Lockfile entries | Interpretation                                                        |
| ---------------------------------------------------- | ---------------- | --------------------------------------------------------------------- |
| MIT / ISC / Apache-2.0                               | 423 / 42 / 28    | Within declared allowlist                                             |
| BlueOak-1.0.0 / BSD-3-Clause / BSD-2-Clause          | 20 / 19 / 13     | Within declared allowlist                                             |
| Python-2.0 / MIT-0                                   | 3 / 2            | Within declared allowlist                                             |
| CC-BY-4.0 / CC0-1.0 / WTFPL                          | 1 / 1 / 1        | Within declared allowlist                                             |
| Dual-license expressions with an allowed alternative | 3                | Alternatives checked as expressions, not three novel licenses         |
| MPL-2.0                                              | 12               | All flagged dev-only; permitted by the documented tool-only exception |
| PSF-2.0 / 0BSD                                       | 1 / 1            | Not on the stated allowlist; see `FND-04`                             |

The controlling policy is `docs/COPYRIGHTS.md:19-31`, not the shorter summary in `docs/GUIDELINES.md:327`. `js-yaml` pulls in runtime-classified `argparse@3.0.4` under PSF-2.0 (`package-lock.json:2635-2649`, `package-lock.json:5234-5251`). `tslib@2.9.1` is dev-classified under 0BSD (`package-lock.json:7293-7298`). The twelve MPL entries belong to the dev-classified `lightningcss` family (`package-lock.json:5415-5445`, `docs/COPYRIGHTS.md:21-23`). The installed `argparse/LICENSE` identifies the Python Software Foundation license; the package's own license text is in the macOS ASAR (`E12`). The shipped Ubuntu font license file is likewise present in `dist/font/UFL.txt` and the ASAR (`public/font/UFL.txt:1-14`, `E12`). This census does **not** certify the provenance of every binary, image, or nested license term.

**Configuration and delivery surface.** Strict TypeScript covers `src/`, `test/`, build configs, and `e2e/` (`tsconfig.app.json:19-27`, `tsconfig.node.json:18-25`); CommonJS is outside that typecheck (`docs/TESTING.md:252-256`). The recorded toolchain floors are enforced (`package.json:80-82`, `.npmrc:1`, `.nvmrc:1`). Coverage thresholds are 80% in all four categories (`vitest.config.ts:11-20`). The browser matrix has Chromium and WebKit, not Firefox (`playwright.config.ts:14-19`); Electron packaging has macOS, Windows, and Linux targets in the manifest but only macOS was built here (`package.json:98-132`, `E11`). The project explicitly declined CI and uses local gates (`docs/GUIDELINES.md:107-110`); this report does not call that choice a defect.

## Requirements Registry

The registry is frozen from the 21 numbered functional (`F-01` to `F-21`) and six numbered non-functional (`N-01` to `N-06`) requirements in `docs/PROJECT.md:57-223`. Each identifier below appears **once** as a registry row. Use cases `C-01` to `C-06` in `docs/PROJECT.md:225-249` are validation scenarios, not additional requirements. The five unnumbered quality targets at `docs/PROJECT.md:251-257` are assessed within existing rows: zero glitches (`N-01`), reproducible export and memory use (`N-03`/`F-07`), load under two seconds (`F-13`/`RISK-02`), and typical song files under 100 KB (`F-09`/`RISK-02`). Details in `FORMAT.md` and `SPECIFICATION.md` are acceptance criteria for these rows rather than hundreds of new duplicate rows.

`Supported` means code plus a relevant executed check support the bounded claim, **not** every platform or all stated edge cases. `Partial` means a subset has evidence but an essential guarantee is unproven or impaired. `Nonconformant` means observed output or implementation contradicts a declared condition. `Unknown` means this audit has no adequate verification of the decisive claim.

| ID   | Frozen obligation                                         | Grade         | Basis at this revision                                                                                                                     |
| ---- | --------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| F-01 | Three-channel simultaneous composition                    | Partial       | Three-channel data and render path inspected (`docs/ARCHITECTURE.md:68-76`); only track-A interaction smoke-tested (`E08`)                 |
| F-02 | Single-track patterns, 4-256 rows                         | Supported     | Parser clamps `[4,256]` (`src/utils/song/songParser.ts:169-171`); unit suite (`E06`)                                                       |
| F-03 | Playlist arrangement                                      | Supported     | Three-channel line model and playlist path (`docs/ARCHITECTURE.md:70-83`); unit suite (`E06`)                                              |
| F-04 | 256 programmable instrument slots                         | Partial       | Limit 256 (`src/constants/music.ts:62-64`); instrument edit/preview smoke (`E08`); full parameter and slot matrix untested                 |
| F-05 | Sub-millisecond real-time audio                           | Unknown       | Worklet clock described (`docs/SPECIFICATION.md:208-216`); no measured audible latency or jitter                                           |
| F-06 | Bit-perfect YM2149 emulation and two engines              | Partial       | Engines, register mirror, and tests (`src/synth/YM2149.ts:106-113`, `E06`); no hardware-reference proof                                    |
| F-07 | DOSOUND assembly with three strategies                    | Partial       | Assembly/export tests and browser download (`E06`, `E08`); Atari XBIOS replay not executed (`RISK-01`)                                     |
| F-08 | Assembly, WAV, dump, instrument, BIN, VGM, MAX, MOD, MIDI | Supported     | Export suite and five browser downloads (`test/exports/exportWav.test.ts:1`, `E06`, `E08`); third-party decoders not checked               |
| F-09 | YAML song and instrument load/save                        | Supported     | Format and golden-output contracts (`docs/FORMAT.md:24-31`, `docs/TESTING.md:137-141`); browser round trip (`E08`); size target unmeasured |
| F-10 | Keyboard input including Ctrl+Space note-off              | Nonconformant | Ctrl+Space changes focus; Shift+Space inserts off (`docs/PROJECT.md:125-133`, `src/constants/navigation.ts:28-40`, `FND-06`)               |
| F-11 | MIDI input, device choice, velocity                       | Partial       | MIDI modules and unit suites (`src/hooks/midi/useMidiMessageProcessing.ts:1`, `E06`); real device not exercised                            |
| F-12 | Dark/light/contrast and text scale                        | Supported     | Contrast/theme/scale browser smoke (`E08`), settings contract (`docs/PROJECT.md:139-141`)                                                  |
| F-13 | Web, desktop, mobile, four browser families               | Partial       | Chromium/WebKit smoke and macOS unpacked bundle (`E08`, `E11`); other targets untested                                                     |
| F-14 | 50/60 Hz and 1/2 MHz across playback and exports          | Partial       | Specification and export suite (`docs/PROJECT.md:151-157`, `E06`); physical timing unmeasured                                              |
| F-15 | Persisted, clamped editor cursor                          | Partial       | Persistence path and unit suites (`docs/SPECIFICATION.md:380-390`, `E06`); full reload/state matrix untested                               |
| F-16 | IndexedDB mirror, restoration, reset safety               | Partial       | Mirror implementation (`src/utils/storage/persistenceMirror.ts:94-114`); reset completion ordering unsound (`FND-01`)                      |
| F-17 | Settings modal, draft, YAML, reload                       | Supported     | Settings source and modal/browser tests (`src/utils/settings/settingsYaml.ts:14-71`, `E06`, `E08`)                                         |
| F-18 | Optional per-channel stereo in both engines               | Partial       | Routing described and engine code (`docs/SPECIFICATION.md:183-189`, `E06`); audible stereo not captured                                    |
| F-19 | YM/AY song variant and chip-aware output                  | Partial       | Variant contract, export tests (`docs/PROJECT.md:183-187`, `E06`); measured chip fidelity unknown                                          |
| F-20 | Bounded, persisted undo/redo                              | Partial       | Undo/redo smoke (`E06`, `E08`); RESET may restore pending history (`FND-01`); reload retains 20 versus 100 entries (`DEBT-02`)             |
| F-21 | Selected track fragments and clipboard editing            | Partial       | Clipboard/selection code and unit suite (`docs/PROJECT.md:193-197`, `E06`); system clipboard end-to-end not run                            |
| N-01 | Glitch-free audio in normal operation                     | Unknown       | Playback position smoke (`E08`) does not measure audible glitches (`docs/PROJECT.md:199-203`)                                              |
| N-02 | 50 Hz default; envelopes every two ticks                  | Partial       | Worklet/interval specification and tests (`docs/SPECIFICATION.md:208-218`, `E06`); clock accuracy not measured                             |
| N-03 | 100% Atari DOSOUND compatibility                          | Unknown       | Assembly output test and download (`E06`, `E08`); no Atari XBIOS or reference-player replay (`RISK-01`)                                    |
| N-04 | Strict TypeScript, no `any`                               | Supported     | Strict config and successful typecheck (`tsconfig.app.json:19-27`, `E01`); targeted source scan found no explicit `any` type               |
| N-05 | Zero ESLint errors/warnings                               | Supported     | `npm run lint` exits 0 with no diagnostics (`E02`); build/format are separate gates                                                        |
| N-06 | At least 80% lines/functions/branches/statements          | Nonconformant | Branches 79.59% and threshold 80% (`vitest.config.ts:11-20`, `E07`, `FND-03`)                                                              |

The use-case coverage is not a second requirements table: `C-01` composition, `C-02` assembly export, `C-03` instrument edit, `C-04` song save/load, and `C-06` undo are exercised at least at browser-smoke level (`docs/PROJECT.md:225-249`, `E08`). `C-05` MIDI recording lacks a real attached device (`docs/PROJECT.md:243-245`, `RISK-02`).

## Scored Assessment

Scores are an audit judgment on a fixed 0-5 scale: 0 absent, 1 materially deficient, 2 weak or release-blocked, 3 mixed with meaningful evidence, 4 strong with bounded gaps, 5 independently validated against the full declared scope. Unknowns reduce assurance rather than being silently scored as successes. Each of ten dimensions has weight one; sum the scores (maximum 50), divide by ten for the 0-5 mean, or multiply by two for percentage. The dimension names and scale are held fixed within this report.

| Dimension                 | Score / 5   | Reason with evidence                                                                                                                                                                |
| ------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional suitability    | 3           | 8 supported and 14 partial of 27; Ctrl+Space contract differs and reset is unsafe (`FND-01`, `FND-06`, `E08`)                                                                       |
| Architecture              | 3           | Explicit worklet/engine boundaries (`docs/ARCHITECTURE.md:38-51`); large orchestration root (`M01`, `DEBT-01`)                                                                      |
| Structure                 | 3           | Directory-purity test and 207 source modules (`E06`, `M01`); five code hotspots exceed 650 lines                                                                                    |
| Code quality              | 3           | Strict typecheck and lint pass (`E01`, `E02`); broad audio-path lint suppressions are documented (`src/App.tsx:1`, `docs/SPECIFICATION.md:11-35`)                                   |
| Testing                   | 2           | 1,335 passing tests and 30 smoke runs (`E06`, `E08`); 79.59% branches and 51 unmeasured TS files (`E07`, `M03`)                                                                     |
| Security                  | 3           | CSP, HTML escaping, and contained Electron options inspected (`vite.config.ts:7-30`, `electron/main.cjs:15-20`); packaged dev-origin trust (`FND-07`)                               |
| Dependencies and licenses | 1           | Zero npm advisories (`E09`, `E10`), but packaged MIT notice missing and two license declarations outside policy (`FND-02`, `FND-04`)                                                |
| Documentation             | 2           | Numbered requirements and format contracts exist (`docs/PROJECT.md:57-223`, `docs/FORMAT.md:24-76`); documented shortcut and settings/state contracts conflict (`FND-06`, `FND-09`) |
| Delivery                  | 2           | Built and packaged on macOS (`E04`, `E11`); format and coverage fail, build warns, other platforms unbuilt (`E03`, `E07`, `FND-08`)                                                 |
| Performance assurance     | 2           | Worklet clock and browser playback smoke exist (`docs/ARCHITECTURE.md:95-97`, `E08`); no audible jitter, cold-load, or typical-song-size measurements (`RISK-02`)                   |
| **Total**                 | **24 / 50** | **Mean 2.4 / 5; 48% of maximum. No release override for a passing average.**                                                                                                        |

## Executed Verification

All commands in this table ran in `work/audit-fresh-20261112/`; `E08` used only a temporary harness config under that copy's `work/`. Commands that write generated files wrote inside the copy. The normal `npm run format` rewrites source, so the audit used Prettier's non-writing `--check` instead (`docs/TESTING.md:5-15`). The project server already occupied port 8008; the E2E harness used a new preview on 127.0.0.1:18008, with `reuseExistingServer: false`, two workers, Chromium/WebKit, and the existing built `dist/`. Thus `E08` does **not** claim that the default port-8008 configuration was exercised. The temporary snapshot contains check logs; decisive values are recorded here so the report stands without those logs.

| Check | Command or exact method                                                                                                                     | Exit  | Result and interpretation                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E01   | `npm run typecheck`                                                                                                                         | 0     | `tsc -b` clean on copied source and tests                                                                                                                                 |
| E02   | `npm run lint`                                                                                                                              | 0     | `eslint .` emitted no diagnostics                                                                                                                                         |
| E03   | `./node_modules/.bin/prettier --check .`                                                                                                    | 1     | Nine files rejected: 2 `docs/refactoring/1.5.9/`, 5 `src/`, 2 `test/`; report directories were excluded from snapshot                                                     |
| E04   | `npm run build`                                                                                                                             | 0     | Vite compiled 2,267 modules; 605.03 kB entry chunk exceeds configured 600 kB warning limit; output not warning-free                                                       |
| E05   | `npm ls --depth=0`                                                                                                                          | 0     | Installed direct packages resolved; no extraneous or missing top-level dependency reported                                                                                |
| E06   | `npm test`                                                                                                                                  | 0     | 144 test files and 1,335 tests pass                                                                                                                                       |
| E07   | `npm run test:coverage`                                                                                                                     | 1     | Statements 86.24% (7729/8962), branches 79.59% (4682/5882), functions 86.73% (1131/1304), lines 86.55% (7451/8608); branch gate fails                                     |
| E08   | `./node_modules/.bin/playwright test --config work/playwright-audit.config.ts`                                                              | 0     | 15 smoke flows x Chromium/WebKit = 30 passing browser tests on isolated built preview                                                                                     |
| E09   | `npm audit --json --fetch-timeout=30000 --fetch-retries=0`                                                                                  | 0     | 0 reported advisories, full dependency set, at query time                                                                                                                 |
| E10   | `npm audit --omit=dev --json --fetch-timeout=30000 --fetch-retries=0`                                                                       | 0     | 0 reported advisories, production-classified set, at query time                                                                                                           |
| E11   | `CSC_IDENTITY_AUTO_DISCOVERY=false ./node_modules/.bin/electron-builder --dir`                                                              | 0     | Unpacked macOS arm64 app produced; signing deliberately skipped; neither launch nor installers checked                                                                    |
| E12   | `node` + `@electron/asar.listPackage` on copied `release/mac-arm64/DOSOUND Tracker.app/Contents/Resources/app.asar`; `test -e dist/LICENSE` | 0 / 1 | 4,924 ASAR entries; no project `/LICENSE`; `dist/LICENSE` absent; `argparse/LICENSE` and `dist/font/UFL.txt` present; `test -e` exit 1 means absent, not a failed harness |
| E13   | `node` probe of `electron/permissions.cjs` and emitted `dist/css/index.css`                                                                 | 0     | `isAppOrigin` and `isMidiAllowed('midi', 'http://localhost:8008/')` return true; CSS font URLs become relative `../font/` and the fonts exist; no font-path finding       |

`M01`: Python `Path.rglob` census and line counts of the explicitly named source/test/public directories, with the code and test file rules in Bill of Materials. `M02`: Python JSON census of `package-lock.json.packages`, retaining path, `dev`, `optional`, and `license` fields and grouping SPDX alternatives. `M03`: Python compared `src/` TS/TSX paths with the file keys in the generated `coverage/coverage-final.json`; 148/199 match and 51 do not. Some missing paths are type-only or entry files, so 51 is **not** a count of 51 untested executable modules. `src/App.tsx` and `src/components/modal/ModalManager.tsx` are among the unmatched files. Coverage percentages above apply to the instrumented files, not an established whole-source denominator (`vitest.config.ts:11-20`). `npm audit` checks known advisories, not license permissions or vulnerabilities that lack advisories.

## Findings

### FND-01 - Reset can race with mirrored autosaves

Severity: High. Evidence mode: I + X; not dynamically reproduced. `clearMirroredSnapshots` resolves on the `IDBRequest.onsuccess` returned by `store.clear()`, not on the transaction's `oncomplete`; transaction errors only log and the clear wrapper catches errors (`src/utils/storage/persistenceMirror.ts:57-97`, `src/utils/storage/persistenceMirror.ts:111-114`). RESET reloads in `.finally()` even when clearing fails (`src/hooks/song/useSongLifecycleDialogs.ts:90-102`). Song, instrument, and history idle/timeout saves are cleared only on unmount, not at RESET, and can write the old state after localStorage is cleared (`src/hooks/storage/useStorage.ts:30-79`, `src/hooks/song/useDataManagement.ts:277-292`). The declared guarantee is no resurrection after full reset (`docs/PROJECT.md:163-165`, `docs/SPECIFICATION.md:402-404`). Impact: a reset may be incomplete or a stale song may be restored on reload under adverse scheduling. This is a credible ordering defect, not a measured occurrence rate. Remediation and transaction-failure/late-save verification: `REC-01`.

### FND-02 - Shipped bundles omit the project's MIT terms

Severity: High. Evidence mode: I + E. `LICENSE:5-13` conditions distribution on including its copyright and permission notice. The explicit Electron `build.files` set lists `dist/**/*`, `electron/**/*`, and `package.json` but not root `LICENSE` (`package.json:88-96`). The isolated web build has no `dist/LICENSE`; the isolated unpacked macOS app has no root project LICENSE in the 4,924-entry ASAR or its Resources (Electron/Chromium licenses are distinct) (`E11`, `E12`). The dependency's own `argparse/LICENSE` and font `UFL.txt` were present, so this is **not** a claim that every notice is missing. The content of separately generated installers or a hosting site's out-of-band license page was not inspected; the omission is demonstrated for these two distributable outputs. Remediation and artifact verification: `REC-02`.

### FND-03 - The stated coverage floor fails on the audited tree

Severity: High. Evidence mode: E + M. `vitest.config.ts:11-20` demands 80% for all four measures. `E07` exits 1 with only 4,682/5,882 branches covered (79.59%), despite `E06` passing 1,335 tests. In addition, 51/199 TS/TSX source paths are absent from the coverage JSON (`M03`); some are types/entrypoints, so it would be incorrect to convert that count into another coverage percentage. The global threshold on the currently instrumented set is not proof of complete coverage across every source module. Remediation and a denominator check: `REC-03`.

### FND-04 - Installed and shipped licenses exceed the declared allowlist

Severity: High for policy compliance, not a claim that these licenses are inherently unlawful. Evidence mode: D + M + E. The allowlist permits Python-2.0 but does not list PSF-2.0 or 0BSD (`docs/COPYRIGHTS.md:19-25`). `js-yaml@5.5.0` depends on `argparse@3.0.4`, whose lockfile license is PSF-2.0 and whose package directory, including its license, is present in the packaged ASAR (`package-lock.json:2635-2649`, `package-lock.json:5248-5251`, `E12`). `tslib@2.9.1` is dev-classified as 0BSD (`package-lock.json:7293-7298`). All twelve MPL-2.0 entries are dev-classified and fit the explicit tooling exception (`M02`). Zero npm security advisories do not grant an exception to a license policy (`E09`, `E10`). Remediation and complete license-census verification: `REC-04`.

### FND-05 - Format gate rejects nine current-revision files

Severity: Moderate; a declared clean-build blocker. Evidence mode: E. The non-writing full-copy check `E03` exits 1 on `docs/refactoring/1.5.9/ASSESSMENT.md`, `docs/refactoring/1.5.9/REFACTORING.md`, `src/components/modal/ModalContainer.tsx`, `src/components/modal/ModalManager.tsx`, `src/components/piano/PianoKeyboard.tsx`, `src/modals/midi/MidiModal.tsx`, `src/modals/settings/SettingsModal.tsx`, `test/exports/exportAssemblyTight.test.ts`, and `test/guard/directoryPurity.test.ts`. The clean-build policy requires formatting as well as typecheck, lint, build, and tests (`docs/TESTING.md:3-15`). The original existing reports were excluded and could add more failures; nine is the measured count for the copy. Remediation and non-writing recheck: `REC-05`.

### FND-06 - Ctrl+Space contradicts the frozen note-off requirement

Severity: Moderate. Evidence mode: D + I + E. `F-10` calls Ctrl+Space a note-off binding (`docs/PROJECT.md:125-133`). Actual navigation maps Ctrl+Space to piano focus and Shift+Space to `noteOff` (`src/constants/navigation.ts:28-40`); the track handler writes note-off only on unmodified Shift+Space (`src/components/tracker/TrackPanel.tsx:315-327`), and a passing test explicitly asserts Ctrl+Space toggles focus (`test/hooks/keyboard/useKeyboardNavigation.test.tsx:194-218`, `E06`). `docs/SPECIFICATION.md:280-286` and `public/MANUAL.md:248-251` describe the implemented binding. This is a confirmed requirements/documentation conflict, not proof the current shortcut is undesirable. Remediation and keyboard-contract verification: `REC-06`.

### FND-07 - Packaged Electron continues to trust the development origin

Severity: Moderate. Evidence mode: I + E + X. `isAppOrigin` accepts `http://localhost:8008` without an `app.isPackaged` condition; it is used for both MIDI permission and top-level navigation (`electron/permissions.cjs:4-35`, `electron/main.cjs:23-48`). The main process loads `dist/index.html` when packaged but does not narrow the later origin check (`electron/main.cjs:50-56`); a direct probe confirms the dev URL receives `isMidiAllowed('midi', ...) === true` (`E13`). Exploitation would require navigation to an attacker-controlled server on that local port; neither such navigation nor exploitation was demonstrated. Trust is nonetheless broader than "packaged bundle only" for a shipped app. Remediation and packaged/dev-mode tests: `REC-07`.

### FND-08 - Successful production build violates the zero-warning bar

Severity: Moderate. Evidence mode: E. `npm run build` exits 0, but Vite warns that `dist/js/index.js` is 605.03 kB after minification against its 600 kB chunk warning limit (`E04`, `vite.config.ts:53-60`). Its 172.04 kB gzip figure is build output, not a measured two-second startup time. The project's clean-build definition requires zero warnings (`docs/TESTING.md:3-15`), so an exit code alone cannot call this release-ready. Remediation and warning/performance verification: `REC-08`.

### FND-09 - Two authoritative documents describe stale contracts

Severity: Low to moderate. Evidence mode: D + I. The settings-file example permits only `dark`/`light` and omits `general.textScale` (`docs/FORMAT.md:613-629`), whereas the actual YAML saver emits `textScale` and a golden fixture has `theme: contrast` and `textScale: "150"` (`src/utils/settings/settingsYaml.ts:14-36`, `test/fixtures/emission/settings-nondefault.yaml:1-7`, `docs/PROJECT.md:139-141`). Separately, a limitation says all state lives in the single Zustand store (`docs/SPECIFICATION.md:524-532`), contradicted by its own three-domain architecture description (`docs/ARCHITECTURE.md:54-64`). Neither documentation difference is evidence that a saved file fails to parse; they make the declared contracts unreliable. Remediation and fixture/document reconciliation: `REC-09`.

## Technical Debt

### DEBT-01 - Concentrated orchestration and large modules

Priority: P2. Evidence mode: M + D. The 1,081-line app entry and 651-691-line MIDI/export/song modules are measured under `M01` and accepted as navigation costs in `docs/ARCHITECTURE.md:131-141`. Broad `react-hooks/exhaustive-deps` suppression exists in `src/App.tsx:1` and is intentional for the audio path (`docs/SPECIFICATION.md:11-35`); removing it on style grounds would be unsafe. Remediation: extract only bounded, independently testable responsibilities after characterizing audio and export behavior (`REC-10`). Verify smaller diff surfaces with `E01`-`E08` equivalents and byte-identical export fixtures.

### DEBT-02 - Reload restores a shallower undo history

Priority: P3. Evidence mode: I + D. The in-memory limit is 100 and serialization keeps only the newest 20 entries per stack (`src/utils/song/editHistory.ts:7-8`, `src/utils/song/editHistory.ts:110-118`). This is explicitly documented rather than a violation of the bounded-persistence wording (`docs/SPECIFICATION.md:370-372`). Remediation: measure typical serialized storage size and choose/document an intentional persisted depth (`REC-11`). Verify a 100-edit session across reload with the chosen bound and redo semantics.

## Risks

### RISK-01 - DOSOUND hardware equivalence is unverified

Severity: High; confidence in the _gap_ is high, actual incompatibility unknown. Evidence mode: D + E + U. The project claims 100% Atari XBIOS-compatible assembly (`docs/PROJECT.md:97-105`, `docs/PROJECT.md:209-211`). Unit export tests and browser assembly downloads run (`E06`, `E08`), but no original DOSOUND routine, hardware replay, or independently checked reference stream ran in this audit. Treat that guarantee as unknown, not failed or passed. Remediation and reference-player checks: `REC-12`.

### RISK-02 - Audio, platform, and performance targets lack field measurements

Severity: High for readiness assurance; no measured failure asserted. Evidence mode: D + E + U. The project promises glitch-free sub-millisecond playback, all four browser families, mobile/three desktop targets, sub-two-second load, and typical files under 100 KB (`docs/PROJECT.md:82-95`, `docs/PROJECT.md:143-149`, `docs/PROJECT.md:199-207`, `docs/PROJECT.md:251-257`). Worklet ticks post to the main thread (`docs/ARCHITECTURE.md:95-97`, `docs/ARCHITECTURE.md:127`), and `E08` checks playback progression, not audible sample timing. No reference hardware, external MIDI device, device audio capture, Firefox/Edge, mobile viewport, Windows/Linux build, cold-load trace, or representative file-size study was run. Remediation and explicit acceptance budgets: `REC-13`.

### RISK-03 - Offline support assumes a root-mounted site

Severity: Moderate, conditional on non-root hosting. Evidence mode: I + X. `vite.config.ts:19-20` uses a relative base and `docs/DEPLOYMENT.md:78-80` says any static host. The production registration hard-codes `/worker.js`, while the service worker precaches `/` and `/index.html` and falls back to `/index.html` (`src/main.tsx:9-14`, `public/worker.js:1-5`, `public/worker.js:39-46`). At a `/subpath/` deployment these absolute URLs address the origin root, not the application. No such deployment was exercised here; this is a bounded inference, not a failure at the declared root site. Remediation and offline subpath probe: `REC-14`.

### RISK-04 - Unsigned desktop releases

Severity: Moderate; disposition: **accepted, no additional action in this audit**. Evidence mode: D + E. `docs/DEPLOYMENT.md:52-72` explicitly accepts unsigned desktop binaries, documents the macOS quarantine workaround, and provides SHA-256 distribution checksums. The unpacked macOS build skipped signing as requested (`E11`); installer checksum production was not tested. Revisit only if the owner changes the documented procurement decision, and verify hashes for actual released artifacts. This risk has no new recommendation by design.

## Remediation Recommendations

### REC-01 - Make reset and mirror clearing transactional

Priority: P0; addresses `FND-01`. Await `IDBTransaction.oncomplete` for clear, distinguish abort/error from success, block or clearly fail the reset on an unsuccessful clear, and cancel or invalidate pending song/instrument/history saves before clearing localStorage. Preserve a monotonically increasing reset generation so already queued mirror writes cannot revive the old generation. Verify in deterministic delayed-transaction and idle-callback tests, then reset and reload in both browser engines with a populated snapshot (`src/utils/storage/persistenceMirror.ts:57-114`, `src/hooks/song/useSongLifecycleDialogs.ts:90-102`).

### REC-02 - Distribute the project's own MIT notice

Priority: P0; addresses `FND-02`. Include `LICENSE` and its copyright/permission terms in the web distribution and packaged desktop resources, not merely `LICENSE.electron.txt`; preserve per-dependency notices. Build clean web and unpacked macOS artifacts and assert the actual packaged file contents contain the project notice; inspect installers for other targets when produced (`LICENSE:1-13`, `package.json:88-96`, `E12`).

### REC-03 - Restore honest, passing coverage

Priority: P1; addresses `FND-03`. First make executable `src/**/*.{ts,tsx}` modules part of the V8 coverage denominator (with a justified exclusion for type-only/entry cases), then add behavior tests for uncovered branches, especially mirror failures and reset races. Re-run `npm run test:coverage` until all four configured 80% gates pass and compare the coverage file list against source inventory (`vitest.config.ts:11-20`, `E07`, `M03`). Do not meet the threshold by raising or disabling it.

### REC-04 - Decide license policy from the shipped dependency graph

Priority: P1; addresses `FND-04`. Review PSF-2.0 and 0BSD with the owner against `COPYRIGHTS.md`; explicitly approve and document them if compatible, or replace their dependency chains. Keep the MPL tooling-only boundary. Run a scripted lockfile census that understands SPDX `OR` expressions and inspect each shipped ASAR/installer for runtime packages and license files (`docs/COPYRIGHTS.md:19-31`, `package-lock.json:2635-2649`, `E12`). Do not confuse a zero-advisory scan with a legal clearance.

### REC-05 - Clear the non-writing format gate

Priority: P1; addresses `FND-05`. Format only the nine measured files after reconciling concurrent edits; avoid an indiscriminate workspace-wide rewrite. Run Prettier `--check .` in a fresh isolated tree including the final intended report surface and confirm zero warnings, then re-run typecheck, lint, build, and tests as the project requires (`E03`, `docs/TESTING.md:3-15`).

### REC-06 - Reconcile the note-off keyboard contract

Priority: P1; addresses `FND-06`. Choose one canonical behavior: retain the tested Shift+Space note-off and correct `F-10`, or deliberately implement Ctrl+Space note-off and redesign the focus shortcut. Update the project requirement, specification, manual, navigation map, and keyboard tests together. Verify real track input, editable targets, and modifier precedence in a browser (`docs/PROJECT.md:125-133`, `src/constants/navigation.ts:20-40`, `E06`).

### REC-07 - Separate packaged and development origins

Priority: P1; addresses `FND-07`. Pass a packaged/development mode into origin and MIDI-permission checks. In a packaged app trust only the bundled index; allow localhost:8008 solely in development. Verify navigation and MIDI permission tests in both modes, including a foreign `file:` page and a localhost page while packaged (`electron/permissions.cjs:4-35`, `electron/main.cjs:23-56`, `E13`).

### REC-08 - Eliminate the build warning without hiding it

Priority: P1; addresses `FND-08`. Attribute the 605.03 kB entry to its modules, split a real cold-path boundary if warranted, and measure initial JS bytes and cold-load time; retain an explicit size budget rather than silently raising `chunkSizeWarningLimit`. Verify `npm run build` with zero warnings and a representative load trace on a target device (`vite.config.ts:53-60`, `E04`).

### REC-09 - Bring format and state documentation back into sync

Priority: P2; addresses `FND-09`. Show `contrast` and `general.textScale` in the settings-file contract and describe three state domains instead of calling all state a Zustand store. Check the revised examples against `test/fixtures/emission/settings-nondefault.yaml` and `src/utils/settings/settingsYaml.ts`; run the document format check (`docs/FORMAT.md:613-637`, `docs/SPECIFICATION.md:524-532`).

### REC-10 - Reduce specific navigation costs, not audio safeguards

Priority: P2; addresses `DEBT-01`. Take one bounded orchestrator responsibility at a time and remove only proven duplication; retain the documented audio-timing exception. Use byte-identical export fixtures, the browser playback smoke, and manual audio validation to verify behavior before/after each move (`docs/REFACTORING.md:3-17`, `docs/ARCHITECTURE.md:131-141`, `E06`-`E08`).

### REC-11 - Decide persisted-history depth explicitly

Priority: P3; addresses `DEBT-02`. Compare storage size for realistic 20- versus 100-entry sessions and choose a documented persistence bound. Verify newest/oldest surviving undo entries, redo-branch clearing, and reload behavior against the chosen bound (`src/utils/song/editHistory.ts:7-8`, `src/utils/song/editHistory.ts:110-118`).

### REC-12 - Prove external DOSOUND replay

Priority: P1; addresses `RISK-01`. Produce a small, published reference-song matrix: silence, loop, all three channels, 50/60 Hz, both clocks, and all export strategies. Replay emitted command streams through original Atari DOSOUND or an independently validated compatible player and compare register/time traces and stop behavior byte by byte. Until then keep `N-03` unknown (`docs/PROJECT.md:209-211`, `docs/FORMAT.md:292-339`).

### REC-13 - Measure audible and user-facing targets

Priority: P1; addresses `RISK-02`. Capture rendered audio and tick-to-output jitter on Chromium and WebKit at both frame rates and engines; test start/suspend/resume with a real MIDI device where available. Collect cold-load and representative song-size distributions, and repeat browser/mobile and desktop-target checks on actual target platforms. State sample sizes and thresholds; do not substitute playback-indicator assertions for sound output (`docs/PROJECT.md:199-207`, `docs/PROJECT.md:251-257`, `docs/TESTING.md:229-235`).

### REC-14 - Make offline URLs base-aware

Priority: P2; addresses `RISK-03`. Resolve registration and cache fallback relative to the deployed base rather than `/`. Serve the built site at both `/` and a nested path, install the service worker, go offline, and verify cold and returning navigation plus static asset fetches (`src/main.tsx:9-14`, `public/worker.js:1-5`, `public/worker.js:39-46`).

## Remediation Roadmap

| Order | Gate                    | Recommendations              | Observable exit condition                                                                                           |
| ----- | ----------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1     | P0 data and notices     | `REC-01`, `REC-02`           | Reset cannot revive data; every inspected distribution carries project MIT terms                                    |
| 2     | P1 security and policy  | `REC-07`, `REC-04`, `REC-06` | Packaged origin narrowed; license exceptions resolved; F-10 binding consistent                                      |
| 3     | P1 automated quality    | `REC-03`, `REC-05`, `REC-08` | Coverage >=80% in all four metrics on justified denominator; format, lint, typecheck, tests, and build warning-free |
| 4     | P1 product evidence     | `REC-12`, `REC-13`           | External DOSOUND and measured audio/load targets evaluated, or claims explicitly narrowed                           |
| 5     | P2 hardening            | `REC-09`, `REC-10`, `REC-14` | Contracts agree with fixtures; bounded refactor verified; nested-path offline flow passes                           |
| 6     | P3 deliberate trade-off | `REC-11`                     | Persisted history depth and storage cost recorded and tested                                                        |

These recommendations are proposed work, not source changes made by this audit. Under `docs/WORKFLOW.md:325-332` adopted items become change records and are re-verified against the tree before implementation. This roadmap does not authorize a version bump, commit, or historical report rewrite.

## Limitations and Exclusions

- Existing reports, archived reports, change requests, plans, lessons, and historical prompt logs were not read. The user explicitly prohibited reading existing audit reports; restricted directories also have access gates (`docs/WORKFLOW.md:205-218`). Excluding those reports from the test copy limits `E03` to the copied tree.
- Source inspection was targeted to architecture, controls, requirements, and reported defects; `M01` is a mechanical census, not line-by-line code review of 207 modules. The representative test suite is broad, but only executed assertions support conformance claims.
- No Atari hardware/XBIOS, third-party format player, real MIDI peripheral, calibrated audio capture, external accessibility audit, or penetration test was available. `F-05`, `N-01`, and `N-03` are unknown; percentages from code coverage cannot prove them (`docs/PROJECT.md:82-95`, `docs/PROJECT.md:199-223`).
- The E2E harness deliberately used port 18008 rather than the occupied default 8008. Firefox is excluded by the project's macOS Playwright configuration, and Edge, mobile, Windows/Linux builds, installers, code signing, and real desktop launch were not executed (`playwright.config.ts:14-24`, `E08`, `E11`).
- `npm audit` results are a time-bounded registry response, not a complete vulnerability assessment. Lockfile license strings and one macOS unpacked artifact do not constitute legal advice or a cross-platform distribution census (`E09`-`E12`, `docs/COPYRIGHTS.md:19-31`).
- The deliberately uncopied `.git`, previous `dist/`, `release/`, and `work/` outputs were not verification inputs. Build and packaging generated new artifacts inside the isolated copy. No claim is made about previously built binaries.

## Report Validation

The final read-only Python self-check covers this report alone; it did not open any existing audit. Its final run exited 0 with these results:

- Register definitions are unique and contiguous: 9 `FND`, 2 `DEBT`, 4 `RISK`, 14 `REC`. All mentioned register IDs and the 13 executed and 3 measurement IDs resolve. All findings and actionable risks link to recommendations; the fourth risk records accepted no action.
- The requirements table has exactly one ordered row for each of 21 `F-*` and 6 `N-*` IDs: 8 supported, 14 partial, 2 nonconformant, 3 unknown. Ten dimension scores sum to `24/50`, mean `2.4/5`, or `48%`.
- All 162 repository-relative `file:line` citations resolve to 47 existing files with valid line ranges. Eight Markdown tables have consistent column counts, aligned widths, and separator rows. The report is ASCII-only, with no trailing whitespace or consecutive blank lines.
- The isolated copy's Prettier 3.9.10 `--check` on this new report exited 0 after formatting the report alone. `git status --porcelain=v1 -uall` showed exactly this report as untracked; the auditor did not change source code.

Two earlier self-check attempts were **harness defects**, not project failures: an incorrect tuple unpack raised `TypeError`, and an over-broad citation pattern treated a time and localhost URLs as file paths. The corrected path-scoped checker produced the results above; report validation was repeated after the final grade and text changes.

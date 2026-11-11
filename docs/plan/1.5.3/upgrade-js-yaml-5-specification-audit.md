# Specification Audit - Upgrade js-yaml to 5

## Document Information

|            |                                                       |
| ---------- | ----------------------------------------------------- |
| Change     | `docs/change/1.5.3/upgrade-js-yaml-5.md`              |
| Plan       | `docs/plan/1.5.3/upgrade-js-yaml-5-implementation.md` |
| Audit Date | 2026-11-11                                            |

## Completeness

Every record requirement maps to a plan step:

- "a format-equivalence harness precedes the version bump" - the
  Write-the-equivalence-harness step builds the gate and the
  Bump-js-yaml step runs only after goldens exist.
- "compares emitted bytes, not just parsed values" - the harness step
  specifies `toMatchFileSnapshot` on the emitted string; no parse-back
  assertion substitutes for it.
- "corpus covers fixtures plus edge cases: note values with special
  characters, envelope trimming, `midi` and `settings` documents" - the
  harness step enumerates the song fixtures, the instrument fixtures,
  constructed special-character and envelope cases, a `SettingsValues`
  document, a `MidiConfiguration` document, and a clipboard payload.
- "byte-identical output or documented drift" - the Run-the-harness step
  defines the two outcomes: land the upgrade, or repair the
  `src/utils/yaml/` shim, or revert with a drift itemization in the
  record.

No requirement lacks a covering step and no step lacks a stated
requirement.

## Ambiguity

The record's phrase "emitted song/instrument YAML round-trips
byte-identically" resolves as: emit under `js-yaml` 4.3.2, pin the text
as goldens, then emit under 5.x and require exact equality. The plan
states this interpretation explicitly in the harness step.

"the `docs/change/` fixtures" in the record's hints resolves to the
committed fixture corpus under `test/fixtures/` - no YAML fixtures live
under `docs/change/`; the plan lists the actual corpus paths.

## Implementability

- `buildSongYamlForExport`, `buildInstrumentYamlForExport`,
  `buildSettingsYaml`, `buildMidiConfigurationYaml`, and
  `generateClipboardData` all exist at the paths the plan names and are
  the only `yaml.dump` call sites - verified by grep over `src/`.
- `parseSongFromYaml`, `parseInstrumentFromText`, and the `Step`/`Song`/
  `Instrument`/`SettingsValues`/`MidiConfiguration` types exist at the
  import paths the harness uses.
- `toMatchFileSnapshot` is a standard Vitest assertion available under
  the pinned `vitest` 4.x; the `// @vitest-environment node` pragma is
  the recorded convention for DOM-free suites in `TESTING.md`.
- `js-yaml` 5.5.0 is published (2026-10-15) and bundles
  `dist/js-yaml.d.ts` types, so the `@types/js-yaml` removal is feasible.
- `electron-builder`'s transitive `js-yaml` 4.x copy is unaffected - the
  bump changes the direct dependency only.

No step fails the check.

## Fidelity

- Corpus fidelity - the instrument corpus copies the shipped
  `public/repository/instrument/` files into `test/fixtures/instrument/`
  unchanged, keeping test inputs inside `test/` per the production-build
  constraint in `TESTING.md`.
- The record defers format changes to out of scope - the plan changes no
  saver rule; it pins the current emitted text.
- The plan defers nothing the record requires.

## Findings

No findings. The audit passes on completeness, ambiguity,
implementability, and fidelity.

# Specification Audit - Crockett's Theme Cover

## Document Information

|            |                                                           |
| ---------- | --------------------------------------------------------- |
| Change     | `docs/change/1.6.3/crocketts-theme-cover.md`              |
| Plan       | `docs/plan/1.6.3/crocketts-theme-cover-implementation.md` |
| Audit Date | 2026-11-13                                                |

## Completeness

Every requirement in the change record maps to a plan step.

| Requirement                                           | Plan step                                   |
| ----------------------------------------------------- | ------------------------------------------- |
| Bundled example song in `public/repository/song/`     | Author the song file                        |
| Bass, drum, and lead instruments on repository idioms | Author the song file - instrument list      |
| Notes transcribed from real MIDI arrangements         | Source Transcription - measured note events |
| Song appears in the LOAD SONG picker                  | Register the song in the picker index       |
| Loads, plays end to end, loops                        | Verify through the parser and simulator     |
| Rejected draft does not ship                          | Remove the rejected song                    |

Requirements with no covering step: none. Steps with no stated requirement: none.

## Ambiguity

- "Decay short enough that sixteenth notes stay detached" - the exact envelope values are authoring freedom inside the recorded `bass_smooth` recipe shape.
- "Varied ending" on `Verse A2` / `Verse B2` - melodic variation inside the transcribed phrase's harmony is authoring freedom.
- Title `Crockett's Theme` and author `Jan Hammer (cover)` - the cover attribution is fixed; the casing follows repository title style.

## Implementability

| Check                                           | Evidence                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `public/repository/song/` and `LIST.txt` exist  | Directory holds five `.song.yaml` entries and a `LIST.txt` index                                  |
| `LIST.txt` drives the picker                    | `FilePickerModal` fetches `LIST.txt` from the `repository/song` directory and lists its entries   |
| `parseSongFromYaml` accepts the planned shape   | `src/utils/song/songParser.ts` parses `song` root, `line` playlist, `pattern` steps, `instrument` |
| `simulateSong` exists for the verification step | `src/utils/playback/playbackSimulation.ts` exports it; per-tick frames expose R8-R10 volumes      |
| No format or code change is precondition        | `FORMAT.md` emission contract untouched - the file is authored data                               |
| Envelope recipes are real                       | Verified against all 25 `public/repository/instrument/*.yaml` files and `MANUAL.md` semantics     |
| Transcription sources are real                  | Two MIDI files parsed in the session workspace; bass, drums, melody, and harmony extracted        |

Steps that fail the check: none.

## Fidelity

- Enumeration fidelity: the plan covers every requirement in the record; instrument slots `00`-`06` are contiguous hex strings as `FORMAT.md` describes.
- Vocabulary freeze: the song uses only the saver's own dialect (`line`, `pattern`, `instrument`, `step`, `wait`, `note`, `OFF`) - no loader-only aliases.
- Cross-party parity: pattern IDs referenced by `line` exist in `pattern`; instrument IDs referenced by steps exist in `instrument` - both ends asserted by the temporary spec.
- Constants completeness: `speed: 4`, `length: 64`, `frame: 50`, `chip: YM`, `loop: 0` are all decided in the plan; envelope bounds come from `MANUAL.md` (volume 0-15, noise 0-31, shift -24..24, pitch -128..128, mode 0-2).
- Boundary decisions: no interface with later changes - the song is self-contained data; the source MIDI files stay in the session workspace and are not shipped.

## Findings Returned to Planning

| Finding | Section | Required Closure |
| ------- | ------- | ---------------- |
| none    |         |                  |

# Add a Crockett's Theme Cover to the Song Repository Implementation Plan

## Summary

| Field         | Value                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Intent        | Author `Crockett.song.yaml` for the bundled song repository demonstrating bass, drum, and lead instrument construction         |
| Key decisions | `speed: 4` and `length: 64` grid in D minor - tracks A lead, B sequencer bass, C drums - notes transcribed from real MIDI data |
| Open risks    | Cover of a copyrighted composition shipped as an educational example - flagged in the change record                            |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.6.3/crocketts-theme-cover.md`.

## Best Practices

No TypeScript or React code changes - the standard at `docs/standard/typescript-react-development.md` has nothing to apply to. Applicable practices are the data conventions recorded in `FORMAT.md` and the repository's own song idioms:

- Author the YAML in the saver's own dialect - `line`, `pattern`, `instrument` lists, `step` entries with `wait` run-lengths.
- Embed the full instrument list inside the song like every repository entry.
- Keep pattern IDs two-character hex strings and instrument slots contiguous.
- Reuse the recorded repository recipes (noise-click kick, noise/tone snare, short-noise hihat, tone-only bass, vibrato lead) instead of inventing new envelope shapes.
- Transcribe from measured MIDI note events, not from memory - the rejected first draft proved memory is not accurate enough.

## Audio-Critical Requirements

This change adds music data. No code in an audio path changes.

- React render timing: not affected - no components touched.
- `useCallback` / `useMemo` dependencies: not affected.
- State management in audio paths: not affected.
- YM2149 emulator or SoundDriver: not modified.
- Playback verification: the agent cannot listen - the song is verified through `parseSongFromYaml` and `simulateSong`, and the pitches and rhythm are checked against the transcribed MIDI note events.

## Documentation Updates

No documentation set updates required. The change is content only: `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, and `FORMAT.md` describe no song inventory and the file format is unchanged. The change record at `docs/change/1.6.3/crocketts-theme-cover.md` is the documentation for this change and is already written.

## Type and State Updates

None - no type, store, or state changes.

## Source Transcription

Two freely available MIDI files were downloaded to the session workspace and parsed with a throwaway parser. Both files quantize to the same grid: `speed: 4` gives a sixteenth note every 2 rows at ~94 BPM, matching the sources' 94-96 BPM.

**Sequencer bassline** (Hit Trax demo, channel 1, 16th-note grid, shown as one bar of 16 positions): octave-jumping root patterns, a note on nearly every sixteenth. The D pedal bar reads `D3 D2 D2 D2 D3 D2 D3 D3 D2 D2 D2 D2 D2 D2 D2 D3`. Bars 5-8 of the harmonic cycle transpose the riff to F, C, Eb, and split C into G - giving the progression D - F - C - Eb - C - G.

**Drums** (Hit Trax demo, channel 9): kick on every quarter note, cabasa or shaker on every sixteenth, closed hats interleaved, an open-hat accent before each phrase boundary.

**Lead melody** (xivmidi piano track, top voice): a repeating four-bar phrase - `A4` held, `D5 C5`, `A4`; then `F4 G4 E4` twice with the second `E4` held; then `G4 F4 G4 D#4` held, `F4`; then `G4 F4 D4` resolving to `A#3`.

**Harmony** (both sources agree): Dm - F - C - Eb - Cm - Gm, where the borrowed Eb major is the signature Miami Vice color.

## Step by Step Implementation

**Author the song file**

Create `public/repository/song/Crockett.song.yaml` with the arrangement designed below.

Header: `title: "Crockett's Theme"`, `author: 'Jan Hammer (cover)'`, `year: 1987`, `chip: YM`, `frame: 50`, `speed: 4`, `length: 64`, `loop: 0`. The grid gives 32 rows per bar, a sixteenth note every 2 rows, and an effective tempo near the source's 94 BPM.

Instruments, all embedded and colored by role (red drums, blue bass, green lead):

- `00 Bass` - tone-only decaying volume in the `bass_smooth` idiom, base `C-2`, decay short enough that sixteenth notes stay detached.
- `01 Kick` - the `kick_2` recipe: noise click, tone body, short decay, base `D-1`.
- `02 Snare` - the `snare` recipe: noise/tone mix, mid noise period, base `G-2`.
- `03 Tom` - melodic percussion derived from the kick and snare recipes, base `G-2`, for the turnaround fill.
- `04 Hihat` - the `hihat` recipe: pure noise, three steps, base `C-4`.
- `05 Lead` - synth-brass lead: `mode: [2,0]` gives a single tone-and-noise attack step for bite, sustained volume, `pitch` vibrato `0,1,2,1`, base `C-5`.
- `06 Pad` - sustained soft tone for the intro and turnaround chord swells, base `C-4`.

Patterns (two bars each):

- `00 Verse A` / `01 Verse B` - the transcribed melody phrase, bars 1-2 and 3-4.
- `02 Verse A2` / `03 Verse B2` - the phrase repeated with a varied ending.
- `04 Pad Dm` / `05 Pad Eb` - slow rising chord-tone swells for intro and turnaround.
- `06 Bass D` - the D-pedal sequencer riff, two bars transcribed from the demo.
- `07 Bass DFC` - D half-bar into F, then the C-riff bar.
- `08 Bass EbCG` - the Eb-riff bar into the C-to-G bar.
- `09 Drum Groove` - kick on beats one and three, snare on two and four, hihat eighths with sixteenth ghost hats between.
- `0A Drum Fill` - the same groove with a three-tom descent into the loop.

Playlist: two intro lines (pads over the D-pedal bass and groove), four verse lines (melody over the moving bassline), two turnaround lines (pads again), then `loop: 0`.

File to create: `public/repository/song/Crockett.song.yaml`.

```yaml
song:
  title: "Crockett's Theme"
  author: 'Jan Hammer (cover)'
  year: 1987
  chip: YM
  frame: 50
  speed: 4
  length: 64
  loop: 0
  line: [...]
  pattern: [...]
  instrument: [...]
```

**Register the song in the picker index**

Append the filename to `public/repository/song/LIST.txt`. The file picker reads this index verbatim, so the entry must match the filename exactly.

File to modify: `public/repository/song/LIST.txt`.

**Remove the rejected song**

Delete `public/repository/song/InTheAirTonight.song.yaml` and its `LIST.txt` entry - the user rejected it on listening and the repository should not ship an arrangement that does not resemble its source.

**Verify through the parser and simulator**

Author a temporary spec that parses the file with `parseSongFromYaml` (pattern row counts match `length`, every referenced instrument and pattern ID resolves) and runs `simulateSong` to confirm non-silent channels on all three tracks. Remove the spec after the run - the repository carries no per-song test convention.

## Implementation Order

Execute the steps above in this sequence.

1. Author the song file
2. Register it in `LIST.txt`
3. Remove the rejected song file and index entry
4. Run the temporary parse and simulate spec
5. Run verification loop

## Testing Strategy

No new production code means no permanent new tests. The temporary spec asserts:

- `parseSongFromYaml` accepts the file without throwing.
- Every expanded pattern produces exactly `length` rows.
- Every step's `instrument` references a defined instrument slot and every playlist entry references a defined pattern.
- `simulateSong` yields non-zero volume register writes on channels A, B, and C.

## Refinements

- **Song pivot after user listening test**: the first draft covered In the Air Tonight from memory; it parsed and simulated cleanly but did not sound like the source. The record, plan, and audit were renamed and refreshed for Crockett's Theme, the song file and index entry were replaced, and the authoring method changed to measured-MIDI transcription. This refinement lands before the original change was committed, so the rejected draft leaves no trace in the file set.
- **User-refined arrangement adopted**: the user edited the MIDI-derived song in the tracker and supplied an export named `Crockett.song.yaml`. The shipped file is that export's content - OFF-articulated melody, minor/major arpeggio pad instruments (`Arp 37`, `Arp 47`), and a `shift` pitch-drop on the bass - stored under the same name in `public/repository/song/` in prettier-normalized repository form, with the `LIST.txt` entry updated to match. `InTheAirTonight.song.yaml` and the earlier `CrockettsTheme.song.yaml` are both removed.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Temporary spec passes: parse, row counts, reference resolution, non-silent simulation

# Add a Crockett's Theme cover to the song repository

**Type:** Feature

## Summary

| Field         | Value                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | New bundled example song covering Crockett's Theme, teaching bass, drum, and lead instrument construction on repository idioms        |
| Key decisions | D minor at speed 4 and length 64 - track A lead, track B sequencer bass, track C drums; notes transcribed from real MIDI arrangements |
| Open risks    | Cover of a copyrighted composition - shipped as an educational example song                                                           |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The bundled song repository (`public/repository/song/`) gains one example
song: a cover of Crockett's Theme by Jan Hammer, the signature piece from
Miami Vice. The request names it an example educational song - its purpose is
to show a complete, recognizable arrangement built entirely from the
repository's established instrument idioms.

This record began as an In the Air Tonight cover. That arrangement passed all
automated checks but was rejected on listening - it had been composed from
memory and did not match the source. The song choice pivoted to Crockett's
Theme with a transcription-first method: two freely available MIDI files were
downloaded and parsed, and the cover's notes come from measured note events
rather than recall.

Source material:

- A Hit Trax demo MIDI (96 BPM) contributing the authentic sixteenth-note
  sequencer bassline (octave-jumping root patterns following the progression
  D - F - C - Eb - C - G) and the four-on-the-floor drum groove with constant
  sixteenth-note shaker.
- A two-part piano/lute arrangement MIDI (94 BPM) contributing the lead
  melody phrase and the underlying chord voicings - Dm, F, C, Eb, Cm, Gm -
  where the borrowed Eb major is the recognizable Miami Vice color.

The shipped file is `Crockett.song.yaml` - the MIDI-derived arrangement after
a refinement pass in the tracker itself: the melody is re-articulated with
note-offs, the intro pads alternate a minor and a major arpeggio instrument
(`0,3,7` and `0,4,7` shift cycles), and the bass carries a pitch-drop `shift`
envelope. It is saved through the app's own exporter, so it ships in the
dialect the saver emits, normalized to repository formatting.

The song file carries its own `instrument` list. Instruments reuse the
recorded repository
recipes: noise-click kick, noise/tone snare, short-noise hihat, tone-only
decaying bass, a tone-and-noise attack synth-brass lead with vibrato for the
melody, a slow-attack pad for the intro chord swells, and a melodic tom
derived from the kick and snare recipe for the turnaround fill.

The file registers in `public/repository/song/LIST.txt` so LOAD SONG lists it
beside the existing entries. The source MIDI files are research input only -
they are not shipped with the application.

## Use Cases

- When the user opens LOAD SONG and picks the repository source, the new song
  appears in the picker.
- When the song loads, it plays end to end on three YM2149 channels and loops.
- When the user inspects the song, each instrument slot shows a named,
  colored, editable instrument built from documented envelope recipes.
- When the user compares the sequencer bassline, drum groove, or lead phrase
  to the original recording, the pitches and rhythm are traceable to the
  transcribed MIDI note events.

## Hints

- The grid decision: `speed: 4` and `length: 64` gives 32 rows per bar, a
  sixteenth note every 2 rows, and an effective tempo of ~94 BPM against the
  source files' 94-96 BPM.
- Track A carries the lead melody and intro pads, B the sequencer bassline,
  C the drum part with different percussion instruments per row.
- Envelope steps advance every 2 ticks - percussion envelopes stay short and
  the bass envelope decays within two rows so the sixteenth-note riff stays
  detached.
- The sequencer bassline is the recognizable signature of the song; every
  bass pattern transposes the same octave-jump riff shape to the chord root.
- The borrowed Eb major harmony is the Miami Vice signature color - both the
  pad swell and the bassline feature it early.
- Flat spellings are not parseable - Eb and Bb are written `D#` and `A#`.

## Out of Scope

- No code, export, or UI changes.
- No additions to the instrument repository - new instruments live inside the
  song file only.
- No changes to existing repository songs or instruments.
- The downloaded source MIDI files are not shipped.

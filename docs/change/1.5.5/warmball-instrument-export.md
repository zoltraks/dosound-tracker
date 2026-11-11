# Export Warmball instruments into the repository

**Type:** Content

## Summary

| Field         | Value                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | Warmball's seven instruments join `public/repository/instrument/` as pickable files, colored by timbre role with random palette shades                    |
| Key decisions | Drums red, bass blue, lead green, effect yellow; shades come from the default ColorPicker palette; files carry a `warmball_` prefix to avoid name clashes |
| Open risks    | `Pim 1` classified as effect (yellow) on its shift-table timbre - adjust to lead (green) if the role is wrong                                             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

The Warmball demo song carries seven instruments that are only usable inside the song. Exporting them into `public/repository/instrument/` makes them pickable through the Pick Instrument modal. Each file uses the SAVE INST format (`instrument` root, `type: 'dosound'`, `version: 1`) and gets a `color` drawn at random from the role's family in the default palette (`src/components/ColorPicker.tsx`):

- Bass 4, Bass 5 - bass - blue shades.
- Hihat, Kick, Snare - drums - red shades.
- Pim 2 - lead - green shade.
- Pim 1 - effect - yellow shade (32-step alternating-octave `shift` table defines its timbre).

Names collide with existing repository entries (`kick.yaml`, `snare.yaml`, `hihat.yaml`, `bass_*`), so the files carry a `warmball_` prefix. `LIST.txt` gains the seven filenames.

## Use Cases

- The user opens Pick Instrument, selects `warmball_kick.yaml`, and gets the Warmball kick with a red frame color in the instrument list.
- The instrument list shows the exported set grouped by color family - red drums, blue basses, the green lead, the yellow effect.

## Hints

- Instrument definitions live in `public/repository/song/Warmball.song.yaml` under `song.instrument` - copy envelope fields verbatim, adding `type`, `version`, and `color`.
- The palette table sits in `src/components/ColorPicker.tsx` - eight shades per tone family.
- `public/repository/instrument/LIST.txt` is the picker index - append the new filenames.

## Out of Scope

- Changing the existing repository instruments or re-coloring them to the role convention.
- Song content, pattern, or playlist edits in `Warmball.song.yaml`.
- Code changes - the picker already discovers the files through `LIST.txt`.

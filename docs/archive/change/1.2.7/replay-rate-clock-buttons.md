# Add Replay Rate and Chip Clock Toggle Buttons to Song Panel

**Type:** Feature

## Summary

Add two toggle buttons to the Song information panel that let the user switch the replay rate (50 Hz / 60 Hz) and the YM2149 chip clock (2 MHz / 1 MHz). These values are stored on the song and persisted in the YAML song file format.

## Description

The DOSOUND Tracker currently supports a fixed 50 Hz replay rate and a fixed 2 MHz YM2149 chip clock. Both values are hardcoded constants with no UI control. This change adds two toggle buttons to the Song information panel so the user can select between the supported values for each setting.

**Rate button**

- Placed in the Title row, aligned to the right edge of the row.
- Displays only the current value, not the button name. The label "Rate" is not shown.
- Default value is `50 Hz`. Toggles to `60 Hz` on click, and back to `50 Hz` on the next click.
- Maps to the existing `frame` field on the `Song` interface.

**Clock button**

- Placed in the Author row, aligned to the right edge of the row.
- Displays only the current value, not the button name. The label "Clock" is not shown.
- Default value is `2 MHz`. Toggles to `1 MHz` on click, and back to `2 MHz` on the next click.
- Maps to a new `clock` field on the `Song` interface, expressed in Hz.

**Visual width**

Both buttons must be visually the same width as the two `number-spinner-button` buttons combined (the up and down stepper buttons used by the Year, Speed, Length, and Loop spinners).

**Defaults and reset**

- On a new song, the buttons show `50 Hz` and `2 MHz`.
- On reset, the buttons show `50 Hz` and `2 MHz`.
- When loading a song file that does not contain these settings, the buttons fall back to `50 Hz` and `2 MHz`.

**Sound generation**

This change adds the UI controls and the song format fields only. Sound generation support for 60 Hz replay and 1 MHz clock will be added in a later change. The buttons must not alter audio playback behaviour in this iteration.

## Use Cases

- When the user creates a new song, the Rate button shows `50 Hz` and the Clock button shows `2 MHz`.
- When the user clicks the Rate button, it toggles between `50 Hz` and `60 Hz`.
- When the user clicks the Clock button, it toggles between `2 MHz` and `1 MHz`.
- When the user saves a song with `60 Hz` and `1 MHz` selected, the YAML file records `frame: 60` and `clock: 1000000`.
- When the user loads a song file that omits `frame` or `clock`, the buttons show `50 Hz` and `2 MHz`.

## Hints

- The `Song` interface already has a `frame` field and a `chip` field. The `frame` field is the replay rate. A new `clock` field is needed for the chip clock.
- The `frame` and `chip` constants live in `src/constants/song.ts`. The `YM_CLOCK` constant lives in `src/synth/YM2149.ts`.
- The number-spinner-button width is 18px with a 2px column gap, so two buttons span 38px. The new toggle buttons should match this combined width.
- The InformationPanel component in `src/components/InformationPanel.tsx` renders the Title and Author rows.

## Out of Scope

- Audio playback support for 60 Hz replay rate or 1 MHz chip clock. Sound generation will be added later.
- Export format changes for the new replay rate or clock values. Export modules continue to use the existing constants until sound generation is implemented.
- More than two values per button. Only the two listed values are supported.

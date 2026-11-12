# Global Song-Line Navigation - Implementation Plan

**Change Request Reference:** `docs/change/1.5.7/playlist-song-line-navigation.md`

## Steps

1. **Update `SPECIFICATION.md`** - the CTRL+PAGEUP/CTRL+PAGEDOWN bullet drops the track-section scope and records that the chord works from any section.
2. **Update `public/MANUAL.md`** - the PG UP/PG DOWN line records the global reach of the chord.
3. **Extend `src/constants/navigation.ts`** - `KEYBOARD_SHORTCUTS` gains `CTRL+PAGEUP` mapped to `previousSongLine` and `CTRL+PAGEDOWN` mapped to `nextSongLine`.
4. **Extend `src/utils/keyboard/keyboardShortcutUtils.ts`** - the ctrl branch maps `PAGEUP` and `PAGEDOWN` to the new shortcuts with `preventDefault`.
5. **Extend `src/hooks/keyboard/useKeyboardShortcuts.ts`** - `GlobalShortcutName` gains `previousSongLine` and `nextSongLine`, and the hook registers them against `handleNavigateSongLine(-1)` and `handleNavigateSongLine(1)`.
6. **Wire `src/App.tsx`** - `useKeyboardShortcuts` receives `handleNavigateSongLine`; the `TrackerSection` wiring drops `onNavigateSongLine`.
7. **Update `src/components/TrackPanel.tsx` and `src/components/TrackerSection.tsx`** - the ctrl branches on PAGEUP/PAGEDOWN leave `TrackPanel`, and the `onNavigateSongLine` prop unwinds from both components.
8. **Update tests** - matcher coverage for the new chords, registration coverage in the keyboard-shortcut tests, and the `TrackPanelInput` chord tests adjusted for the removed prop.
9. **Run the verification loop** - typecheck, lint, format, build, test.

## Affected Files

| File                                          | Change                                      |
| --------------------------------------------- | ------------------------------------------- |
| `docs/SPECIFICATION.md`                       | Chord bullet records the global scope       |
| `public/MANUAL.md`                            | PG UP/PG DOWN line records the global scope |
| `src/constants/navigation.ts`                 | Two new shortcut entries                    |
| `src/utils/keyboard/keyboardShortcutUtils.ts` | PAGEUP/PAGEDOWN cases under ctrl            |
| `src/hooks/keyboard/useKeyboardShortcuts.ts`  | Two new global actions                      |
| `src/App.tsx`                                 | Hook wiring, TrackerSection prop removal    |
| `src/components/TrackPanel.tsx`               | Ctrl branch and prop removed                |
| `src/components/TrackerSection.tsx`           | Prop removed                                |
| `test/` keyboard and TrackPanelInput tests    | Chord coverage moved to the global layer    |

## Risks and Mitigations

| Risk                                                                 | Mitigation                                                                     |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Double navigation while a track is focused                           | The TrackPanel ctrl branch is removed - only the window listener fires         |
| The chord fires while a playlist pattern id or other field is edited | The existing `isEditable` guard in `useKeyboardNavigation` blocks it           |
| The playlist cursor fails to follow                                  | The existing `currentPlaybackPosition` sync effect already moves `currentLine` |

## Verification

- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run build`
- `npm test`

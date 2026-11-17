# Dual-Chip Window Refactoring Proposal

## Problem

The three dual-chip records widened the channel model from three to six
tracks across playback, UI, settings, and exports. The implementation
introduced several repeated shapes that deserved a single owner:

- The visible-track projection rule (dual-chip setting + song chip count +
  3/6 view + chip group) was needed by the tracker, playlist, focus, and
  navigation layers.
- The register-stream chip selection (`registers2` fallback to
  `registers`) was needed by four exporters.
- Persisted six-entry channel mutes had to accept the legacy three-entry
  shape on two independent load paths.

Files touched by the duplication:

- `src/components/tracker/TrackerSection.tsx`, `src/App.tsx`,
  `src/hooks/ui/useTrackFocus.ts`, `src/components/playlist/PlaylistPanel.tsx`
- `src/exports/asm.ts`, `src/exports/vgm.ts`, `src/exports/max.ts`
- `src/hooks/ui/useUiStore.ts`, `src/utils/settings/settingsState.ts`

## Goal

One owner per repeated rule: a `visibleTracks` utility for the projection,
a shared register-picker idiom inside the exporters, and normalized
six-entry mute state at both persistence boundaries.

## Findings

**Issue 1 - visible-track projection**

The combination `dualChipEnabled && songChipCount(song) === 2` plus the
3/6/group branching was about to be re-derived in every view consumer.

**Impact**

Minor-to-moderate. A missed consumer would render the wrong channel set -
for example showing D-F on a single-chip song or hiding them on a
two-chip song in three-track mode.

**Recommendation**

`src/utils/song/visibleTracks.ts` owns `isDualChipView` and
`visibleTrackIds`; consumers pass the resolved inputs and render the
returned `SongChannelId[]`.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change - new utility consumed by the window's own code.

**Issue 2 - register-stream selection in exporters**

`frame.registers2 ?? frame.registers` selection logic appears in
`asm.ts`, `vgm.ts`, and `max.ts` under different local names.

**Impact**

Minor. The fallback rule is one line, but a divergent copy (for example
emitting `undefined` registers for a missing second stream) would corrupt
single-chip exports.

**Recommendation**

Keep the per-module `regsForChip`/`regsForFrame` helpers local - the
exporters are separate dynamic-import chunks and a shared module would not
shrink the entry bundle; the helpers document the selection rule at each
site.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change.

**Issue 3 - legacy three-entry mute persistence**

`channelMutes` widened to six entries; old local-storage payloads hold
three booleans.

**Impact**

Moderate if unhandled - a strict six-length check would discard stored
mutes on upgrade.

**Recommendation**

Accept length 3 or 6 at the store initializer and pad missing
second-chip entries as unmuted; `setChannelMutes` callers emit the full
six-entry array.

**Risk Level**

Minor

**Breaking Change Assessment**

No Breaking Change - backward-compatible read.

## Plan

1. Land `src/utils/song/visibleTracks.ts` and route tracker/playlist/focus
   consumers through it.
2. Keep exporter register-pickers module-local; verify each falls back to
   `registers` when `registers2` is absent.
3. Normalize mute arrays at `useUiStore` initialization; emit six entries
   from reset paths.
4. Re-run the verification loop.

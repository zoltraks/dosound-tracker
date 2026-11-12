# Add Per-Channel Stereo Output Implementation Plan

## Summary

| Field         | Value                                                                   |
| ------------- | ----------------------------------------------------------------------- |
| Intent        | Give each channel a pan position - named hardware layouts plus free     |
|               | per-channel pans, rendered as stereo by both sound engines              |
| Key decisions | Pan is a song-level `stereo` node (layout plus channel overrides); the  |
|               | `SoundEngine` contract gains `setChannelPans`; mono stays bit-identical |
|               | because the internal engine bypasses its panner chain and the worklet   |
|               | folds to the same mono sample; exports are untouched                    |
| Open risks    | The two engines use different pan laws (equal-power vs linear), so      |
|               | mid-pan loudness differs slightly between engines at non-centre pans    |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/stereo-output.md`.

## Analysis

Both engines render a single mono path today. `YM2149` connects each
channel gain directly to `audioContext.destination` and sums channel
noise into one `noiseGainNode`. `AyumiEngine` renders one output channel
in `workers/ayumiWorklet.ts`, folding `core.left` and `core.right` into
`(left + right) * 0.5 * AYUMI_OUTPUT_GAIN` after `setPan(ch, 0.5, false)`
centre pans.

The `AyumiCore` already exposes per-channel pans through `setPan`, so the
worklet only needs a two-channel output plus a pans message. The internal
engine needs `StereoPannerNode`s between each channel gain and the
destination - inserted only when stereo is active, because a panner at
centre applies equal-power attenuation and would break the mono output.

The pan model lives on the song. A `stereo` node carries a named layout
(`mono`, `abc`, `acb`) plus optional per-channel pan overrides on a 0..1
scale (0 left, 0.5 centre, 1 right). The resolved pans reach the engine
through a new `setChannelPans` member on the `SoundEngine` contract,
applied by `useAudioSetup` the same way the chip clock is applied.

All export formats are untouched. Register-stream exports carry hardware
register data, which has no pan register, and the WAV export keeps its
mono software mixdown. The MAX chip-panning byte positions a whole chip,
not per-channel wiring, so it stays `0x00` (Not Specified).

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Props interface named with `Props` suffix
- No abbreviations in identifiers (use full words)
- Keep components focused on single responsibility

## Audio-Critical Requirements

- The change adds no dependencies to existing `useCallback`/`useMemo`
  arrays and changes no state-management pattern in the audio path.
- `useAudioSetup` gains one ref mirror plus one effect that applies pans
  to the engine - the same shape as the existing `chipClock` handling.
- Engine-side changes are node wiring and worklet messages, applied on
  configuration changes only - the per-tick render path is unchanged.
- Playback verification: the YM2149 routing is proven by the stubbed
  audio-context suite, the Ayumi path by the engine messaging suite, and
  live playback by the e2e smoke suite under the webkit project.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `PROJECT.md` - new requirement F-18 for per-channel stereo output.
- `ARCHITECTURE.md` - audio synthesis pipeline and the mono-output
  architectural decision gain the stereo routing description.
- `SPECIFICATION.md` - Song data model, Sound Engines section, and the
  constants list gain the stereo vocabulary.
- `FORMAT.md` - the SAVE SONG format gains the `stereo` node.
- `TESTING.md` - the e2e flow list gains the stereo layout and pan case.

## Type and State Updates

**Type definitions**

File to modify: `src/synth/SoundDriver.ts`.

```typescript
export interface SongStereo {
  layout?: string;
  A?: number;
  B?: number;
  C?: number;
}
```

`Song` gains `stereo?: SongStereo`. The `SoundEngine` interface in
`src/synth/soundEngine.ts` gains `setChannelPans(pans: number[]): void`.

**State store modifications**

None. Pan is song data, so it flows through `updateSong` like `frame`
and `clock` - no store changes.

## Step by Step Implementation

**Add the stereo vocabulary**

Add the layout catalog and pan constants to the song constants file.

File to modify: `src/constants/song.ts`.

```typescript
export const DEFAULT_CHANNEL_PAN = 0.5;
export const STEREO_LAYOUTS: Record<string, [number, number, number]> = {
  mono: [0.5, 0.5, 0.5],
  abc: [0, 0.5, 1],
  acb: [0, 1, 0.5],
};
export const STEREO_LAYOUT_ORDER = ['mono', 'abc', 'acb'];
export const CHANNEL_PAN_STEPS = [0, 0.25, 0.5, 0.75, 1];
```

**Add the stereo helpers**

New utility module holding resolution, formatting, and boundary
normalization.

File to create: `src/utils/song/songStereo.ts`.

```typescript
export const normalizeSongStereo = (raw: unknown): SongStereo | undefined;
export const resolveChannelPans = (
  stereo: SongStereo | undefined,
): [number, number, number];
export const resolveStereoLayoutId = (
  stereo: SongStereo | undefined,
): string | null;
export const formatChannelPan = (pan: number): string;
export const nextChannelPan = (pan: number): number;
export const clampChannelPan = (value: number): number;
```

Resolution takes the catalog pans for `layout` (absent or unknown layout
falls back to `mono`) and applies each finite channel override clamped
to `[0, 1]`.

**Extend the song YAML read and write**

Parse the `stereo` node (map or bare string layout id), save it when the
song carries stereo settings.

Files to modify: `src/utils/song/songParser.ts`, `src/utils/song/songIO.ts`, `src/hooks/song/useSongManagement.ts`.

```yaml
song:
  stereo:
    layout: 'abc'
    A: 0.0
    B: 0.5
    C: 1.0
```

The parser accepts `stereo: 'abc'` as shorthand for the layout and
channel keys as overrides of the layout's pans. The saver writes the
node only when the song carries stereo settings. The schema migration
normalizes a stored `stereo` member the same way.

**Extend the SoundEngine contract**

Add `setChannelPans(pans: number[])` to the `SoundEngine` interface.
Pans arrive as three values on the 0..1 scale; engines clamp to the
range and treat missing entries as centre.

File to modify: `src/synth/soundEngine.ts`.

**Route stereo in the internal engine**

Create three `StereoPannerNode`s and three per-channel noise gains at
construction. Tone and noise channels rewire through the panners only
when stereo is active.

File to modify: `src/synth/YM2149.ts`.

```typescript
setChannelPans(pans: number[]): void {
  this.channelPans = /* clamped copy, default 0.5 */;
  this.applyStereoRouting();
  this.updateAudioNodes();
}
```

`applyStereoRouting` flips between two graphs: mono keeps
`gainNode -> destination` and the summed `noiseGainNode`, stereo moves
each channel gain to `gainNode -> panner -> destination` with the panner
set to `pan * 2 - 1`, and noise contribution routes per channel through
the per-channel noise gains. The mono graph is byte-for-byte the current
one, so default output is identical.

**Render stereo in the Ayumi worklet**

Extend the message union with `{ type: 'pans'; pans: number[] }`, store
the pans in the processor, and re-apply them inside `configure` so a
clock change or reset keeps the routing. Render two output channels.

Files to modify: `src/workers/ayumiWorklet.ts`, `src/synth/AyumiEngine.ts`.

```typescript
if (this.stereoActive) {
  left[i] = softLimit(this.core.left * AYUMI_OUTPUT_GAIN);
  if (right) right[i] = softLimit(this.core.right * AYUMI_OUTPUT_GAIN);
} else {
  const mono = softLimit((this.core.left + this.core.right) * 0.5 * AYUMI_OUTPUT_GAIN);
  left[i] = mono;
  if (right) right[i] = mono;
}
```

The node is created with `outputChannelCount: [2]`. With all pans at
centre the folded path emits the exact sample the mono channel emitted
today, duplicated on both outputs. The Ayumi pan law is the native
linear `setPan(..., false)`; the internal engine uses the
`StereoPannerNode` equal-power law - both place channels correctly and
agree at centre and the extremes.

**Apply resolved pans in the audio setup**

Mirror `channelPans` into a ref, apply it inside `landEngine` after
`setClock`, and add an effect that pushes pans to the live engine when
they change.

File to modify: `src/hooks/audio/useAudioSetup.ts`.

```typescript
export function useAudioSetup(
  chipClock: number = DEFAULT_SONG_CLOCK,
  engineId?: SoundEngineId,
  channelPans: number[] = DEFAULT_CHANNEL_PANS,
): UseAudioSetupResult;
```

**Wire the song to the engine and add controls**

Compute resolved pans in `App.tsx`, pass them to `useAudioSetup` and to
`SongSection`, and add the per-channel pan cycle handler.

File to modify: `src/App.tsx`.

```typescript
const channelPans = useMemo(() => resolveChannelPans(currentSong.stereo), [currentSong.stereo]);
const handleCycleChannelPan = useCallback(
  (channel: number) => {
    const resolved = resolveChannelPans(currentSong.stereo);
    resolved[channel] = nextChannelPan(resolved[channel]);
    updateSong({ stereo: { A: resolved[0], B: resolved[1], C: resolved[2] } });
  },
  [currentSong.stereo, updateSong],
);
```

**Add the layout toggle**

Add a `Stereo:` field row with a `ToggleValueButton` cycling
MONO -> ABC -> ACB. A resolved configuration that matches no catalog
layout displays `CSTM` and a click resets to MONO. Selecting a named
layout writes `stereo: { layout: id }` and drops channel overrides.

File to modify: `src/components/InformationPanel.tsx`.

**Add the per-channel pan buttons**

`EQPanel` gains `channelPans` and `onCycleChannelPan` props and renders
a pan button under each channel label showing the formatted pan
(`L100`, `L50`, `C`, `R50`, `R100`). `SongSection` forwards the new
props.

Files to modify: `src/components/EQPanel.tsx`, `src/components/SongSection.tsx`, `src/App.css`.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update type definitions and constants
3. Add the stereo helpers
4. Extend the song YAML read and write
5. Extend the SoundEngine contract and both engines
6. Wire `useAudioSetup` and `App.tsx`
7. Add the UI controls and styles
8. Add or update tests
9. Run verification loop

## Testing Strategy

**Unit tests**

- `test/utils/song/songStereo.test.ts` - resolution, layout matching,
  formatting, pan-step cycling, parser and saver round-trip.
- `test/synth/YM2149Stereo.test.ts` - stereo rewire inserts the panners,
  mono restores the direct graph, per-channel noise gains follow the
  active path. Extend `test/synth/audioContextStub.ts` with
  `createStereoPanner` and `disconnect` support.
- `test/synth/AyumiEngine.test.ts` - `setChannelPans` posts the pans
  message.
- `test/hooks/audio/useAudioSetup.test.tsx` - pans reach the landed
  engine and re-apply on change.

**Integration tests**

- `test/components/EQPanel.test.tsx` - pan labels render and the cycle
  handler fires with the channel index.
- `e2e/smoke.spec.ts` - one flow toggling the stereo layout and a channel
  pan, asserting the control labels update.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` under the webkit project for the audio-path slice
- Manually verify playback timing and audio stability

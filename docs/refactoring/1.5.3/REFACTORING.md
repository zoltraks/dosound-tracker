# Refactoring Proposal - 1.5.3

## Problem

The 1.5.3 window reshaped the export strategy ladder and added formats in
the previous window, leaving `src/hooks/file/useFileOperations.ts` (676
lines) carrying seven `export*WithContext` callbacks whose bodies repeat
the same three idioms. The survey also checked the yaml dump/load call
sites, the sequencer pending-message queue, the worklet hooks, the
strategy branches in `src/exports/`, and `App.tsx` - none of those cross
the Rule-of-Three extraction threshold in this window.

**F-01 - export scope and filename-base resolution repeated seven times**

Every context handler re-derives the same three-way scope decision and
filename base:

```typescript
if (ctx.type === 'instrument' && ctx.instrument) {
  // instrument path
} else {
  let scopedSong: Song = song;
  if (ctx.type === 'pattern') {
    const scoped = getScopedSongForPattern(ctx.playlistIndex);
    if (scoped) {
      scopedSong = scoped;
    }
  }
  // ...
  filenameBase =
    ctx.type === 'pattern'
      ? buildPatternExportBaseName(song.title)
      : buildSongExportBaseName(song.title);
}
```

Verbatim in `exportDataWithContext`, `exportBinWithContext`,
`exportVgmWithContext`, `exportMaxWithContext`, `exportMidiWithContext`,
`exportModWithContext`, and `exportWavWithContext` (which additionally
returns early on the instrument path).

**F-02 - export summary lines assembled by hand in every handler**

The `Scope:` / `Playlist index:` / `Instrument ID:` / `Strategy:` line
block is written out per handler with only the order of per-format extra
lines differing:

```typescript
lines.push('Scope: Pattern (current playlist position)');
lines.push(`Playlist index: ${ctx.playlistIndex}`);
// ...
lines.push(`Instrument ID: ${ctx.instrument ? ctx.instrument.id : 'n/a'}`);
// ...
lines.push(`Strategy: ${ctx.strategy}`);
```

**F-03 - export error lines duplicated eight times**

Every catch block rebuilds the same two/three-line failure summary:

```typescript
const lines: string[] = [];
lines.push('DATA export failed.');
if (error instanceof Error) {
  lines.push(`Error: ${error.message}`);
}
setSoundExportSummary(lines.join('\n'));
```

## Goal

`useFileOperations.ts` keeps the eight public handlers but each one
shrinks to its format-specific work: resolve the shared scope, produce
the payload, download, and delegate summary text to helpers. A new
module `src/utils/export/exportSummary.ts` owns:

- `resolveExportScope(ctx, song, getScopedSongForPattern)` returning the
  scoped song, the selected instrument, and the filename base.
- `buildExportScopeLines(ctx)` returning the `Scope:` / `Playlist
index:` / `Instrument ID:` / `Strategy:` lines exactly as each handler
  emits them today.
- `buildExportErrorLines(format, error)` returning the failure summary.

Summary strings, filenames, downloads, and warning lines stay byte-
identical - this is a structural extraction, not a UX change.

## Plan

1. **Characterisation tests.** Add `test/hooks/file/` coverage that
   renders `useFileOperations` and asserts the exact success and failure
   summary strings for representative handlers (DATA song/pattern/
   instrument, BIN bytes line, VGM, WAV extras, MIDI warnings) before
   any structural change.
2. **Tidy: none needed** - the hook file carries no dead code worth a
   separate pass.
3. **Extract `buildExportErrorLines`** into `src/utils/export/
exportSummary.ts`; rewire all catch blocks.
4. **Extract `buildExportScopeLines`**; rewire the summary assemblies in
   each handler.
5. **Extract `resolveExportScope`**; rewire each handler's scope
   resolution, preserving the WAV instrument early-return shape.
6. **Verify**: typecheck, lint, format, build, unit tests, e2e.

Each step leaves the tree buildable; the summary strings are pinned by
step 1 so a wording regression fails loudly.

## Risk

The export summary text is user-visible and currently only covered
end-to-end - step 1 pins it. `exportWavWithContext` and the MIDI/MOD
warning loops have bespoke pieces; the helpers take per-format extras
instead of forcing those into a single rigid shape. Export file bytes
are untouched - the exporters in `src/exports/` do not change.

## Acceptance Criteria

- Byte-identical summary strings for every handler, pinned by the new
  characterisation tests.
- Zero diff in produced export outputs - no `src/exports/` file changes.
- `useFileOperations.ts` measurably smaller with no duplicated scope,
  summary, or error skeletons.
- Full verification loop green: typecheck, lint, format, build, unit
  tests within `vitest.config.ts` thresholds, e2e on Chromium and
  WebKit.

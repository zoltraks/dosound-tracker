# Narrow the modal prop pass-through

## Problem

The modal layer moves every modal concern's props through one flat bag at four
hand-synced surfaces.

`src/hooks/modal/useAppModals.tsx` declares `UseAppModalsParams` - roughly
ninety flat fields covering errors, summaries, document dialogs, confirmations,
the transpose dialog, instrument dialogs, the MIDI surface, the song-import
warning, file pickers, the export modal, the paste-track modal, and the
settings session. `src/App.tsx` names every field literally at the
`useAppModals` call site.

The same fields are then re-declared twice more downstream:
`UseModalManagerOptions` in `src/hooks/modal/useModalManager.ts` carries the
keyboard-handled subset, `ModalContainerProps` in
`src/components/modal/ModalContainer.tsx` carries the rendered superset, and
`BuildInfoModalsArgs` in `src/utils/panel/modalRendering.ts` re-lists the info
notices a third time. Adding or renaming one modal prop touches all four
interfaces plus the JSX at each layer.

`ModalContainer` itself is a single component rendering about twenty modal
elements across ten unrelated domains - information notices, confirmations,
instrument dialogs, transpose, documents, MIDI, settings, pickers, export, and
paste-track. It violates the one-responsibility rule and the domain-seam split
convention the refactoring standard asks for.

`docs/FUTURE.md` records this exact surface as deferred decomposition work,
found during the 1.5.4 refactoring when the eight export handlers collapsed
through it.

Files the refactoring touches: `src/App.tsx`,
`src/hooks/modal/useAppModals.tsx`, `src/components/modal/ModalManager.tsx`,
`src/components/modal/ModalContainer.tsx` (removed), and new
`src/components/modal/` group files. `useModalManager.ts`,
`src/utils/panel/modalRendering.ts`, and every leaf modal under `src/modals/`
stay unchanged.

## Goal

The boundary between `App.tsx` and the rendered modal tree carries ten named
domain slices instead of ninety flat fields, and each slice maps to one
presentational group component that renders only its own modals.

`useAppModals` accepts `modalState`, the domain slices, and nothing else flat.
It merges the `modalState`-owned fields (open flags, summaries, contents,
usage payloads) into each slice and renders `ModalManager` with ten group
props. `ModalManager` becomes a pure composer of ten group components.
`ModalContainer` is removed.

Each group file owns both contracts for its domain: a `Params` interface for
the producer-hook fields the hook receives, and a `Props` interface extending
it with the `modalState`-injected fields the component renders. One file per
domain holds both, so the two shapes cannot drift apart silently.

The keyboard hook `useModalManager` keeps its flat options object. Its fields
mirror the Escape/Enter priority chain, and grouping them adds indirection
without narrowing a public boundary - the hook is internal to the modal
layer. `useAppModals` maps the grouped slices back onto the flat options.

The four lazy modal declarations - `SettingsModal`, `MidiModal`,
`ExportModal`, and `PasteTrackModal` - move into their group files unchanged,
so the entry-chunk budget is preserved exactly.

Observable behaviour is identical: same render order, same modal stacking,
same Escape/Enter priority, same lazy loading, same props reaching every leaf
modal.

Proposed tree:

```text
src/
  App.tsx                          composition root - assembles ten domain slices
  hooks/modal/
    useAppModals.tsx               params regrouped into domain slices; merges
                                   modalState into group props for ModalManager
    useModalManager.ts             unchanged - flat keyboard-priority options
    useModalState.ts               unchanged - flat open-state bundle
    useExportModal.ts              unchanged
    usePasteTrackOptions.ts        unchanged
    useSettingsDialog.ts           unchanged
    useSettingsSession.ts          unchanged
    useTransposeDialog.ts          unchanged
  components/modal/
    ModalManager.tsx               slim composer - ten group props only
    DialogFrame.tsx                unchanged
    InformationModalGroup.tsx      new - twelve info notices via buildInfoModals
    ConfirmationModalGroup.tsx     new - six confirmation dialogs
    InstrumentModalGroup.tsx       new - type warning, delete, midi, color
    TransposeModalGroup.tsx        new - transpose dialog
    DocumentModalGroup.tsx         new - about, changelog, manual, download
    FilePickerModalGroup.tsx       new - repository instrument and demo song
    MidiModalGroup.tsx             new - lazy MidiModal
    SettingsModalGroup.tsx         new - lazy SettingsModal
    ExportModalGroup.tsx           new - lazy ExportModal
    PasteTrackModalGroup.tsx       new - lazy PasteTrackModal
    ModalContainer.tsx             removed - superseded by the ten groups
  modals/                          unchanged - leaf modal components
  utils/panel/modalRendering.ts    unchanged - buildInfoModals keeps its role
```

## Findings

**Duplicated flat prop surface**

`UseAppModalsParams`, `UseModalManagerOptions`, `ModalContainerProps`, and
`BuildInfoModalsArgs` each re-list the same modal fields in flat form. A single
prop rename today edits four interfaces and three JSX layers.

**Impact**: every modal-layer change pays a multi-file sync tax, and the flat
lists hide which fields belong to which modal. This is the maintenance cost
`FUTURE.md` deferred.

**Recommendation**: replace the flat lists with ten domain slices. Each group
file exports the `Params` and `Props` contracts for its domain, so the hook
input and the component props share one declaration per field.

**Risk Level**: Major

**Breaking Change Assessment**: Internal Breaking Change - the prop interfaces
are module-internal; no public API, file format, or stored data changes.

**Example**

Before:

```text
useAppModals({ modalState, aboutVersion, songError, setSongError, ... })
```

After:

```text
useAppModals({
  modalState,
  information: { songError, setSongError, ... },
  confirms: { ... },
  ...
})
```

**Monolithic ModalContainer**

`ModalContainer` renders information notices, six confirmation dialogs, four
instrument dialogs, the transpose dialog, three document surfaces, the MIDI
dialog, the settings dialog, and the download modal in one component body.

**Impact**: the file is the largest navigation cost in the modal layer, and a
change to one domain's modal requires reading the whole file. The component
cannot be tested per domain.

**Recommendation**: split along the rendered-modal domains into ten group
components under `src/components/modal/`, each receiving only its slice.

**Risk Level**: Major

**Breaking Change Assessment**: Internal Breaking Change

**Example**

Before: one `ModalContainerProps` with about a hundred and twenty fields.

After: `ModalManager` takes ten group objects and renders ten group
components, each with a Props interface scoped to its domain.

**Derived props computed in the hook's JSX**

`useAppModals` derives `isSongConfigurationWarningOpen` from
`pendingSongImport` and applies the fallback warning message inline in the
`ModalManager` JSX.

**Impact**: presentation derivation lives in the wiring hook instead of the
component that renders it, and the derived names must be re-declared in
`ModalContainerProps`.

**Recommendation**: the confirmation group owns the derivation - it receives
the pending-import presence and raw message and computes open state and the
fallback text in its own render path.

**Risk Level**: Minor

**Breaking Change Assessment**: Internal Breaking Change

**Example**

Before: `isSongConfigurationWarningOpen={!!pendingSongImport}` passed through
two layers.

After: the group component receives `pendingSongImport` presence and the raw
`configurationWarningMessage`, and derives both inside its render.

**Prop-name translation layer**

`useAppModals` params use `handleX` names while `ModalContainer` props use
`onX` names, so every handler is renamed a second time at the boundary.

**Impact**: two vocabularies for the same callback, maintained by hand in the
JSX mapping.

**Recommendation**: group Props use one vocabulary end to end. Where the leaf
modal keeps its own prop names, the group component maps once inside its own
file, next to the modal it renders.

**Risk Level**: Minor

**Breaking Change Assessment**: Internal Breaking Change

**Keyboard options stay flat on purpose**

`UseModalManagerOptions` lists the same modal fields a third time, but its
order mirrors the Escape/Enter priority chain that `useModalManager`'s effect
implements and that `test/hooks/modal/useModalManager.test.tsx` pins.

**Impact**: grouping these options would hide the priority order the test
suite documents, without narrowing any boundary outside the modal layer.

**Recommendation**: keep the flat options. `useAppModals` maps the grouped
slices onto it internally; the hook and its test stay untouched.

**Risk Level**: Suggestion

**Breaking Change Assessment**: No Breaking Change

**No composer-level coverage**

Leaf modals and `useModalManager` have tests, but nothing renders
`ModalManager`/`ModalContainer` as a composition unit, so a dropped prop would
surface only as a type error or a manual smoke check.

**Impact**: thin coverage exactly at the layer being restructured.

**Recommendation**: rely on the strict prop types - every group Props field is
required, so typecheck proves the wiring - plus the existing modal tests and
the Playwright smoke suite for the open/close flows. No new test file is
planned; the refactor moves JSX, it does not add logic.

**Risk Level**: Suggestion

**Breaking Change Assessment**: No Breaking Change

## Plan

**Create the ten modal group components**

Add one file per modal domain under `src/components/modal/`. Each file exports
its `Params` interface (producer-hook fields), its `Props` interface (params
plus the `modalState`-injected fields), and the group component. The JSX moves
verbatim from `ModalContainer` and `ModalManager`, including the four
`React.lazy` declarations for `MidiModal`, `SettingsModal`, `ExportModal`, and
`PasteTrackModal`, which stay inside their group files so chunk boundaries do
not move. `InformationModalGroup` calls the existing `buildInfoModals` util
unchanged. The song-configuration warning's open-state derivation and fallback
message move into `ConfirmationModalGroup`. No file calls the groups yet -
they are parallel-change scaffolding resolved inside this proposal.

Files to create: `src/components/modal/InformationModalGroup.tsx`,
`ConfirmationModalGroup.tsx`, `InstrumentModalGroup.tsx`,
`TransposeModalGroup.tsx`, `DocumentModalGroup.tsx`,
`FilePickerModalGroup.tsx`, `MidiModalGroup.tsx`, `SettingsModalGroup.tsx`,
`ExportModalGroup.tsx`, `PasteTrackModalGroup.tsx`.

**Rewire ModalManager onto the groups**

`ModalManager` renders the ten group components in the same order
`ModalContainer` rendered its modals today, preserving stacking order. Its
props become the ten group objects. `useAppModals` builds each group object
from its still-flat params plus the `modalState` fields, and passes them to
`ModalManager`. `ModalContainer.tsx` is deleted once nothing imports it.
`App.tsx` is untouched in this step - the external boundary is still flat.

Files to modify: `src/components/modal/ModalManager.tsx`,
`src/hooks/modal/useAppModals.tsx`; file to delete:
`src/components/modal/ModalContainer.tsx`.

**Regroup the hook params and the App call site**

`UseAppModalsParams` becomes `modalState` plus ten domain slices typed by each
group's `Params` interface; `aboutVersion` moves inside the documents slice.
The destructure and the `useModalManager` options mapping read through the
slices. `App.tsx` passes nested group literals - producer-hook fields under
their domain key, `modalState`-owned fields no longer named individually
because the hook injects them. The call site shrinks from roughly a hundred
flat entries to ten labelled groups.

Files to modify: `src/hooks/modal/useAppModals.tsx`, `src/App.tsx`.

**Verify and assess**

Run the full verification loop, then the Playwright smoke suite as the
runnable-artifact slice, then write `ASSESSMENT.md` beside this proposal.

## Step Granularity

Step one adds files with no callers - a regression there is impossible by
construction, and the verification loop still runs to prove the tree stays
green. Steps two and three each touch fewer than half a dozen files and mix no
rename with an extraction. Step two changes only the internal boundary; step
three changes only the external one, so a prop-level mistake localizes to one
step's diff.

## Risk

The likeliest regression is a prop mapped to the wrong modal - mitigated by
required, fully typed Props interfaces, so typecheck fails on any mismatch.
Render-order changes are prevented by keeping the group render order identical
to today's JSX order. Lazy-boundary regressions are prevented by keeping the
`React.lazy` calls inside the group files and watching the build's chunk
output. The Escape/Enter priority chain is untouched because
`useModalManager` and its test suite do not change.

`ModalContainer` has no dedicated test, but its risk is wiring, not logic -
typecheck covers required props and the smoke suite covers the open/close
flows. The audio path is not touched: no hook timing, dependency array, or
state pattern in an audio-critical path changes, and the modal layer renders
outside the sequencer.

## Acceptance Criteria

- `UseAppModalsParams` exposes ten named domain slices; the `App.tsx` call
  site passes group literals, not flat fields.
- `ModalManagerProps` is ten group objects; `ModalContainer.tsx` is removed;
  the ten group files exist under `src/components/modal/`.
- Every modal opens, confirms, cancels, and closes exactly as before, including
  the Escape/Enter priority order and the lazy-loaded modals.
- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, and
  `npm test` pass with zero errors and zero warnings.
- `npm run test:e2e` passes, covering the About, settings-persistence, and
  export smoke flows that exercise the modal layer.
- Coverage thresholds in `vitest.config.ts` hold.
- Export output stays byte-identical - the export path is untouched, and the
  suite pins it.

# Refactoring Proposal - 1.5.9

This proposal was produced by the compass source-reorganization operation, an
experimental procedure. Scope: `src/` and `test/`. Target convention: the
recorded project layout convention in `SPECIFICATION.md`, "Source Directory
Structure".

## Problem

The recorded convention partitions `src/` by responsibility kind, groups
`src/hooks/` and `src/utils/` into domain subdirectories, and applies the
directories-only rule - a source directory that contains subdirectories does
not hold files directly. The `src/` root entry files are the recorded
exception. A census of the scoped tree found three mixed directories.

**`src/assets/` mixes a file with a subdirectory**

`src/assets/song.yaml` sits beside `src/assets/svg/`. The file is the bundled
default song ("Arp Loop"), imported once with a `?raw` query suffix by
`src/hooks/song/useSongManagement.ts`. The directory violates the
directories-only rule.

**`test/hooks/` mixes a cross-domain test with domain directories**

`test/hooks/songManagement.test.ts` sits beside the mirrored domain
directories. Its import block exercises three hook domains - `instrument`,
`song`, and `storage` - so no single domain mirror fits. The layout convention
gives a test spanning several domains of one kind a `cross/` leaf in that
kind.

**`test/` mixes runner setup files with mirror directories**

`test/setup.ts` and `test/setup-localstorage.ts` sit beside the mirrored
domain tree. Both are config-referenced through `setupFiles` in
`vitest.config.ts`, so a move costs a config rewrite for no gain. The
convention sanctions a documented exemption for config-referenced root
files - the exemption holds in fact but is not recorded anywhere.

Optional polish sits outside compliance. `src/components/` and `src/modals/`
stay leaves under the recorded convention despite passing the kind-domain
split threshold, and `ModalManager.tsx` plus `ModalContainer.tsx` carry a
borderline kind placement as modal infrastructure living in `components/`.
The polish candidates are evaluated in the Optional Polish section through a
per-file import-coupling census.

## Goal

Every placement in the target tree traces to one numbered rule.

| Rule | Statement                                                                      |
| ---- | ------------------------------------------------------------------------------ |
| R1   | A directory containing subdirectories holds no files directly                  |
| R2   | A directory name carries the domain of the files it holds; single-file dirs ok |
| R3   | The `src/` root keeps only its recorded entry files                            |
| R4   | `test/` mirrors the `src/` kind-domain split                                   |
| R5   | A test spanning several domains of one kind lives in a `cross/` leaf           |
| R6   | Config-referenced root files stay at `test/` as a recorded exemption           |
| R7   | Committed data fixtures do not participate in the mirror                       |
| R8   | A kind with no subdirectories stays a leaf regardless of file count            |

The target tree, with new directories marked:

```
src/
  main.tsx                  recorded entry exception            (R3)
  App.tsx                   recorded entry exception            (R3)
  index.css                 recorded entry exception            (R3)
  App.css                   recorded entry exception            (R3)
  assets/
    song/                   bundled song data              [new] (R1, R2)
      song.yaml             default song, ?raw import
    svg/                    icon assets                         (leaf)
  components/               React components                    (leaf, R8)
  constants/                constant definitions                (leaf)
  exports/                  format modules, core, export barrel (leaf)
  hooks/                    twelve domain directories           (branch)
  modals/                   modal dialog components             (leaf, R8)
  synth/                    YM2149 engine and sound contract    (leaf)
  types/                    type definitions                    (leaf)
  utils/                    twenty-one domain directories       (branch)
  workers/                  AudioWorklet processors             (leaf)
test/
  setup.ts                  runner setup, recorded exemption    (R6)
  setup-localstorage.ts     localStorage mock, exemption        (R6)
  fixtures/                 committed data fixtures             (R7)
  guard/                    repository-level guard tests        (leaf)
    directoryPurity.test.ts structure-purity check         [new]
  hooks/
    cross/                  multi-domain hook tests        [new] (R1, R5)
      songManagement.test.ts
    <domain mirrors>        unchanged
  <remaining mirrors>       unchanged                            (R4)
electron/                   main, preload, permissions          (leaf)
e2e/                        playwright suite                    (leaf)
```

The tree above is the compliance target. The Optional Polish section carries
the extended variant with `components/` and `modals/` split into domains.

## Plan

Each step leaves the tree buildable and the verification loop green. Moves
use `git mv` so history survives; all moved files are tracked.

**Step 1 - Create the `cross/` leaf for the multi-domain hook test**

`git mv test/hooks/songManagement.test.ts test/hooks/cross/songManagement.test.ts`.

Rewrite every `../../src/` specifier in the moved file to `../../../src/` -
the file gains one directory level. Nothing else imports the file.

Verify `npm run typecheck`, `npm run lint`, `npm test`.

**Step 2 - Move the bundled song asset into a domain directory**

`git mv src/assets/song.yaml src/assets/song/song.yaml`.

Rewrite the `?raw` specifier in `src/hooks/song/useSongManagement.ts` from
`../../assets/song.yaml?raw` to `../../assets/song/song.yaml?raw` - resolve on
the path part and preserve the query suffix, per the recorded convention on
query-suffixed specifiers. It is the file's only importer.

Update the path citations in `FORMAT.md` and in the `Project Conventions`
section of `standard/typescript-react-development.md`.

Verify `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` - the
`?raw` payload resolves at bundle time, so the build is the real check.

**Step 3 - Record the test-root setup exemption**

Extend the "Source Directory Structure" paragraph in `SPECIFICATION.md` with
the recorded exemption: `test/setup.ts` and `test/setup-localstorage.ts` stay
at the `test/` root because `vitest.config.ts` references them through
`setupFiles`. No code moves.

**Step 4 - Add the structure-purity guard test**

Create `test/guard/directoryPurity.test.ts` beside the existing guard test.
It walks `src/` and `test/` and asserts rule R1 - no directory holding
subdirectories holds files - with the R3 and R6 exemption lists as the only
allowed roots. The test rides `npm test`, so the layout cannot erode
silently.

Verify `npm run typecheck`, `npm run lint`, `npm test`.

## Optional Polish

The items below sit outside the recorded convention - the tree is compliant
without them. They rest on a per-file import-coupling census over
`src/components/` and `src/modals/`, and each wave uses the same mechanics as
the mandatory plan - `git mv`, specifier rewrites, green verification before
the next wave.

**Census evidence**

`src/components/` holds twenty-nine flat files. Component-to-component
imports form clean clusters: `SongSection` composes five children,
`EnvelopeSection` two, `TrackerSection` one, `PlaylistPanel` two,
`TrackPanel` one, `PianoKeyboard` one, and `ModalManager` renders
`ModalContainer`, which imports twelve of the fifteen dialogs in `modals/`.
Four files - `DialogFrame`, `NumberSpinner`, `ToggleValueButton`,
`ColorPicker` - import nothing project-local and serve every domain.

`src/modals/` holds fifteen flat files. Naming and coupling cluster four
`Instrument*` dialogs, a `FilePicker`/`Download` pair (`DownloadModal`
imports `FilePickerModal`), three information dialogs, and two
track-operation dialogs.

Outside the two directories only `App.tsx` and `useAppModals.tsx` import
`components/` - the entry surface is narrow.

**`ModalManager` and `ModalContainer` resolution**

Both stay in `components/` - they are container components by kind, not
dialog components. Under the optional split they take a `modal/` domain
matching `hooks/modal/` and `utils/panel/modalRendering.ts`, joined by
`DialogFrame.tsx` - the frame every dialog imports. Moving them into
`modals/` was evaluated and declined: `modals/` holds dialog components by
kind and the two files are modal infrastructure, so the move would blur the
kind boundary rather than fix it.

**Target domains for `src/components/`**

| Domain      | Files                                                                   |
| ----------- | ----------------------------------------------------------------------- |
| `shell/`    | AppLayout, HeaderPanel, CommandPanel, FileInputs, ErrorBoundary         |
| `tracker/`  | TrackerSection, TrackPanel, TrackLine                                   |
| `envelope/` | EnvelopeSection, EnvelopePanel, ToneNoisePanel                          |
| `song/`     | SongSection, InformationPanel, InstrumentSection, DumpPanel, EQPanel    |
| `playlist/` | PlaylistPanel, PlaylistHeader, PlaylistLine                             |
| `piano/`    | PianoKeyboard, PianoKey                                                 |
| `midi/`     | MidiDeviceSelect, MidiMonitorPanel                                      |
| `modal/`    | ModalManager, ModalContainer, DialogFrame                               |
| `widgets/`  | NumberSpinner, ToggleValueButton, ColorPicker - domain-blind primitives |

**Target domains for `src/modals/`**

| Domain         | Files                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| `instrument/`  | InstrumentColorModal, InstrumentDeleteModal, InstrumentMidiModal, InstrumentTypeWarningModal |
| `information/` | AboutModal, InformationModal, MarkdownModal                                                  |
| `file/`        | FilePickerModal, DownloadModal                                                               |
| `track/`       | PasteTrackModal, TransposeModal                                                              |
| `settings/`    | SettingsModal                                                                                |
| `midi/`        | MidiModal                                                                                    |
| `export/`      | ExportModal                                                                                  |
| `common/`      | ConfirmationModal - domain-blind confirm dialog                                              |

Single-file domains follow the recorded rule - a directory name carries the
domain of the files it holds, including single-file directories, and
`src/utils/` already works that way.

**Optional waves**

`src/components/` resolves before `src/modals/` - dialogs import components,
so landing components first keeps each modal specifier to one rewrite. Waves
order by coupling, least-coupled domains first.

**Wave O1 - `piano/` and `midi/`**

Smallest self-contained domains. Internal `./X` specifiers survive
unchanged; the few inbound specifiers in `HeaderPanel`, `App.tsx`, and
`MidiModal` update.

**Wave O2 - `tracker/` and `envelope/`**

Section-and-children chains. Sibling specifiers stay `./`; cross-kind
specifiers gain one `../` level. `TrackerSection` rewrites its
`assets/svg/` specifiers one level deeper here - each file fixes the
asset specifiers in its own wave.

**Wave O3 - `playlist/` and `song/`**

`SongSection` rewrites five moved child specifiers - the largest single
rewrite in the split.

**Wave O4 - `shell/`**

App chrome. `App.tsx` is the main inbound surface; `HeaderPanel` rewrites
its `assets/svg/` specifiers one level deeper, `InstrumentSection` having
done the same in O3.

**Wave O5 - `modal/` and `widgets/`**

Highest inbound coupling. `DialogFrame` is imported by most dialogs, so
every `modals/` importer of `DialogFrame`, `NumberSpinner`, and
`ColorPicker` rewrites here and again in wave O6.

**Wave O6 - `src/modals/` domains**

All fifteen dialogs into their domains. `ModalContainer` and `ModalManager`
rewrite their modal specifiers; dialogs rewrite their `DialogFrame` and
widget specifiers.

**Wave O7 - mirrored test tree**

`test/components/` and `test/modals/` mirror the new domains under R4,
their `../../src/` specifiers gaining one level.

The split moves on the order of seventy-five files across source and test
and rewrites every importer once. Barrel exports stay absent - the adopted
standard keeps direct imports. `App.tsx` stays the single entry and no
behaviour changes.

## Risk

The `?raw` query-suffixed specifier is the main mechanic - a rewrite that
drops or misplaces the suffix breaks the default-song import silently, so the
specifier resolves on its path part with the query preserved. The build step
catches a miss that typecheck cannot.

References outside the import graph are enumerated, not assumed - `FORMAT.md`
and the standard's `Project Conventions` cite the asset path, `TESTING.md`
cites the setup paths (unchanged under the exemption), and `vitest.config.ts`
holds the `setupFiles` entries. No e2e spec, fixture path, or script
references the moved paths.

The moved test must stay collected - the vitest include glob
`test/**/*.{test,spec}.{ts,tsx}` covers `test/hooks/cross/`, and
`tsconfig.app.json` keeps the moved file type-checked. The eighty-percent
coverage thresholds are unaffected because no source file changes content.

All moves are `git mv` on tracked files, so history survives and a wave can
be restored from the index.

Behaviour does not change - the `?raw` payload, the setup wiring, and the
test subjects are identical after the moves, and no export module is
touched.

## Uncertain Placements

The `src/assets/song/` directory name follows R2 - the file's domain is song
data. `demo/` was the alternative; the file backs both NEW SONG and the demo,
so the neutral domain name wins.

Inside the optional split, `ConfirmationModal` is the only domain-blind
dialog - it takes a single-file `common/` domain rather than a forced
domain, and `ErrorBoundary` plus `FileInputs` sit in `shell/` as app chrome
on structural evidence rather than a strong domain signal.

Every other optional placement traces to a census-verified import edge or a
recorded domain name.

## Acceptance Criteria

- The tree matches the Layout section - `src/assets/` and `test/hooks/` hold
  no files beside their subdirectories.
- `npm run typecheck`, `npm run lint`, `npm run build`, and `npm test` all
  pass after the final step.
- Every import resolves, including the query-suffixed `?raw` specifier.
- `test/guard/directoryPurity.test.ts` passes and fails on a deliberately
  introduced mixed directory.
- `SPECIFICATION.md` records the `test/` root setup exemption.
- Behaviour is identical on the manual smoke flows - NEW SONG loads the
  bundled song, DEMO SONG plays, and the test suite count is unchanged apart
  from the added guard test.

When the optional waves run, the same criteria extend to the domain split -
`components/` and `modals/` hold no files directly, `test/` mirrors the new
domains, the purity guard covers the split, and the entry surface stays
`App.tsx` plus `useAppModals.tsx`.

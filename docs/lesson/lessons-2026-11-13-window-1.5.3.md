# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Messages posted before an async node lands vanish silently

Observed symptom: after the AudioWorklet migration, a reload left the sequencer running at double the song's speed - `updateSpeed` posted through a ref assigned only inside the worklet-init effect, so the mount-time `setParams` was dropped and the worklet kept its default `ticksPerRow`. Every mount-time parameter was dropped the same way; speed was the audible one.

Root cause: the post function's existence was tied to an asynchronously-created resource, and the `?.` call site made the drop silent - no queue, no warning, just default parameters.

Preventing rule: see "Context Lifecycle" in `standard/typescript-audio-development.md`.

### Rename sweeps catch same-spelling words in other domains

Observed symptom: the `compact` to `tight` strategy rename also rewrote the piano keyboard's compact-layout flag, a color-picker comment, and two historical changelog sentences, which had to be reverted by hand.

Root cause: a case-aware global replace matched every occurrence of the word, not every occurrence of the concept - homonyms in unrelated domains are indistinguishable to the sweep.

Preventing rule: see "Rename sweeps must exclude homonyms in other domains" in `WORKFLOW.md`.

### Persisted enum values outlive their rename

Observed symptom: renaming the dump strategy values (`optimized`, then `compact`) would have silently reset every saved preference to the `complex` default until the storage `read` function was extended to resolve retired values to `tight`.

Root cause: a persisted string is a compatibility surface - renaming the enum member in code does not migrate the bytes already written to local storage.

Preventing rule: see "Renaming a persisted enum value requires reader migration" in `WORKFLOW.md`.

### Behaviour changes ride inside formatting commits

Observed symptom: a user report of cramped export-modal radios traced not to this window's work but to a `.modal-body` `line-height` change bundled inside a repository-wide Prettier commit from an earlier window.

Root cause: bulk-format commits read as neutral, so the investigation skipped them; the real cause was a style rule change hiding inside one.

Preventing rule: see "Visual regressions can ride inside formatting commits" in `WORKFLOW.md`.

### Optional UI surface ships at churn risk

Observed symptom: three additions from the previous window - EQ pan buttons, Song-panel Chip/Stereo toggles, and the OPTIMIZED strategy level - were removed or consolidated in this window on direct user feedback, each removal costing a change record, code rewiring, and doc updates.

Root cause: the records' durable requirements were file-format and engine support; the visible controls were optional surface that shipped on assumption rather than owner confirmation.

Preventing rule: see "Optional UI surface lands behind owner confirmation" in `WORKFLOW.md`.

### Characterisation tests buy refactoring confidence cheaply

Observed symptom: `useFileOperations.ts` had no unit coverage - its summary strings were only observable end-to-end - yet the dedup refactoring rewrote all seven export handlers without a single string regression because nine pinning tests went in first and stayed green through every step.

Root cause (positive): pinning user-visible strings before restructuring converts "hope it's identical" into an assertion that fails loudly; the two subtle per-family differences (`scopeType`, `includeStrategy`) surfaced precisely because the tests knew the expected text.

Preventing rule: see "Risk" in `REFACTORING.md` - thin-coverage modules receive characterisation tests before structural change.

### Small requests bypassed the record-first lifecycle

Observed symptom: three user-directed changes - the MIDI button label, the worklet dist names, and the changelog-edit rule - shipped as plain edits and only gained change records retroactively during the window review, while the user further corrected that proposals and records must precede code, not follow it.

Root cause: the Standard Workflow already requires the record before the edit for every modification request, but request size was silently treated as an exemption - "small" user requests went straight to code.

Preventing rule: see "Standard Workflow" in `WORKFLOW.md` and "Update documentation first" in `GUIDELINES.md`.

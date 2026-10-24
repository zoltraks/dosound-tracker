# Refactoring Proposal — Window 1.3.1

**Problem**

`src/hooks/useMidiMessageProcessing.ts` (688 lines) repeats three internal patterns across its message handlers:

- The debug-flag read (`localStorage.getItem(StorageKeys.DEBUG_MODE) === 'on'` inside try/catch) appears four times, once per message direction and type.
- The byte-array-to-hex-string loop (`dataHex` construction) appears three times with identical bodies.
- The "add monitor entry, then conditionally `logger.debug` with a payload" sequence appears four times with only the entry fields and payload shape differing.

This duplication makes the file longer than its logic requires and increases the chance of the four sites drifting apart during future edits.

**Analysis**

- The repeats are intra-file and identical in shape: the debug read is literally the same five lines; the hex loop is the same four lines; the monitor/debug sequence differs only in field values. These are mechanical consolidations with a single owner (this file), so no new module boundary is introduced.
- The live-preview envelope machinery (interval + `advancePreviewEnvelopeTick` + sustain/release refs) is duplicated between `useMidiActions.ts` and `components/TrackPanel.tsx`, but it exists at exactly two call sites — below the Rule-of-Three threshold — and sits in audio-critical paths where extraction risk outweighs the benefit. It is documented here as considered-and-deferred, not implemented.
- The slot-extension block in `useInstrumentManagement.ts` appears twice (`updateInstrumentInSong`, `applyLoadedInstrumentToSong`), also below the threshold; deferred for the same reason.
- The change is protected by the window's new unit tests (`test/hooks/useMidiMessageProcessing.test.tsx`, 14 cases covering decode, send, device switching, and cleanup), so observable behavior is pinned before restructuring.

**Goal**

Consolidate the three repeated patterns inside `useMidiMessageProcessing.ts` into local helpers, reducing the file's duplicated code without changing any observable behavior: identical monitor entries, identical debug logging under the same conditions, identical send semantics.

**Focus**

- Primary: DRY consolidation.

**Constraints**

- Behavior-preserving only: monitor ordering, entry fields, debug gating (`debugOn && enableMonitors`), device resolution, and send clamping must remain exactly as before.
- No signature changes to the hook's return value or arguments.
- No shared abstractions extracted to other modules (single call site — Rule of Three).
- No changes in audio-critical paths (the preview machinery is out of scope).

**Verification**

- `npm run typecheck`, `npm run lint`, `npm run format`, `npm run build`, `npm test`, `npm run test:coverage` — all must pass with zero errors and warnings, and coverage must stay at or above the 80% thresholds.
- `test/hooks/useMidiMessageProcessing.test.tsx` must pass unmodified, proving monitor entries, note events, and send bytes are unchanged.

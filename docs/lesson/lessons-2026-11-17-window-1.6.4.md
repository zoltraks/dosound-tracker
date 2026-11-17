# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Widening a shared id type cascaded into UI-coupled consumers

Observed symptom: widening `TrackSelectionTrackId` to `SongChannelId` produced type errors in `useTrackOperations`, whose keyboard-section mapping (`trackA`-`trackC`) is intentionally three-channel until the track-UI record lands.

Root cause: the selection type sits on the UI boundary, not the data boundary; the six-channel model is a data-layer capability while the visible track set stays three.

Preventing rule: when a model widens, widen only the data-level signatures (song utilities, parser, serializer, simulation) and leave UI-bound unions at their current scope - the deferred UI record owns the visible extension.

### Stored-song migration silently rebuilt three-key line entries

Observed symptom: `normalizeStoredSongToCurrentSchema` reconstructed every playlist row as `{ A, B, C }`, which would have dropped `D`/`E`/`F` references on every localStorage restore of a two-chip song.

Root cause: the migration predates the second chip and enumerates channels literally; the parser and serializer were updated but the third rebuild site was only found by auditing every `{ A, B, C }` construction.

Preventing rule: when a serialized shape gains optional members, grep for every site that reconstructs the shape - parser, serializer, stored-data migration, and playlist mapping - not only the file-format pair.

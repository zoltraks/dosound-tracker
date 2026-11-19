# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Header readouts drifted away from the columns they describe

Observed symptom: the track header showed `VOL <hex>` right-aligned at the panel edge while the volume column sits after the note cell near the left - the readout did not sit over the column it reported.

Root cause: the header value was placed by flex order and `space-between`, not derived from row geometry. Aligning a header readout over a data column means deriving the preceding flex item's basis from the row geometry (line padding + cell padding + min-width + gap), mirroring the target cell's box model (width, padding, alignment), and checking bounding-box equality - center equality alone misses padding asymmetries.

Preventing rule: see "Project Conventions" in `docs/standard/css-general-development.md` - the header-over-column derivation and box-model mirroring are recorded there with `.track-header-volume` over `.volume-data` as the reference shape.

### Zoomed geometry shows sub-pixel drift that is not a defect

Observed symptom: with `--app-zoom` at 125%/150%, the header volume box sat 0.25px/0.5px right of `.volume-data` - a persistent offset that looked like a residual misalignment.

Root cause: CSS `zoom` rounds independently per subtree, so separately measured boxes drift by sub-pixel amounts under text scaling. Chasing deltas of 1px or less rewrites correct geometry.

Preventing rule: see "Tooling Notes" in `docs/TOOLING.md` - sub-pixel deltas up to 1px under `--app-zoom` are treated as aligned before any geometry rewrite.

# Session Findings - Formatting and Drift

Session-date: 2026-11-09

Lessons gathered from the formatting, drift-repair, and reconciliation passes of this session. Each entry indexes where the durable rule lives - this file holds no rules itself.

## Entries

**Fences can hide a document from its own checkers**

A transposed four-backtick exhibit in `GUIDELINES.md` swallowed the rest of the file into a code block, hiding six findings from every validation run. Durable rule: `WORKFLOW.md` - re-validate after structural document repairs.

**Serialized assertions can mask emission defects**

A `yaml.load` round-trip strips plain-scalar padding, so a parse-back assertion passes while the emitted text stays wrong. Durable rule: `TESTING.md` - assert on raw YAML text for unquoted scalars.

**Generated documents carry no Status or Verdict**

Repeated correction in consecutive sessions: review, audit, verification-report, and decision-record templates dropped `Status`/`Verdict` fields and sections. Durable rule: `STYLE.md` Generated Documents section, applied to all templates and `WORKFLOW.md`.

**Table-separator conventions differ per project**

Panther's compact `|---|` separators contradict this repository's spaced `| --- |` convention that Prettier enforces. Durable rule: `STYLE.md` separator-row rule already owned it; the skill gained a `--spaced-separator` mode and `panther.json` gates upstream.

**Mechanical fixers need opt-outs, not just fixes**

`fix-document.py`'s unconditional `format-table`/`reflow` passes and its cross-span spaced-bold regex both damaged conformant documents. Durable rule: upstream `panther-skill` 1.6.3 carries the lookaround fix and the `panther.json` `table_format`/`prose_reflow` gates.

**Stale figures are the dominant drift class**

Version numbers, file sizes, test counts, and hook names drifted across all three pillars. Durable rule: `WORKFLOW.md` stale-figure sweep already owned it - this session executed it end to end.

**Deferred work lands in the next window**

The 1.4.3 records `trim-song-metadata-on-load`, `restore-file-operation-shortcuts`, `reduce-intake-context-cost`, `align-instrument-id-normalization`, `expand-synth-test-coverage`, and `fix-vite-native-config-warnings` carry this session's findings forward.

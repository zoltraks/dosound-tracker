# Upgrade js-yaml to 5

**Type:** Chore

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Upgrade `js-yaml` to the 5.x line once format equivalence can be       |
|               | proven - the prior attempt reverted on YAML serialization drift        |
| Key decisions | A format-equivalence harness precedes the version bump - upgrade lands |
|               | only after byte-identical round-trips are demonstrated                 |
| Open risks    | Blocked on the equivalence harness existing first - the 5.5.0 attempt  |
|               | failed with dozens of suite failures on emission drift                 |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

`js-yaml` 5 was evaluated at 5.5.0 and reverted: the full suite failed on
YAML serialization drift - the emitted song and instrument files no
longer round-tripped byte-identically. This project treats emitted YAML
as a file-format contract: the same in-memory song must produce the same
text, so a serializer whose defaults shift is a breaking change even when
the parse direction stays compatible.

The upgrade is scheduled for a later window because it needs a
prerequisite the current suite does not fully provide: a
format-equivalence harness that compares emitted bytes (not just parsed
values) across a representative corpus of song and instrument files
before and after the bump. `FORMAT.md` documents the saver rules that
pin quoting, trimming, and alias behaviour - the harness encodes them as
executable comparisons.

Once the harness exists and the 5.x output matches byte-for-byte (or the
drift is understood, documented, and accepted by the owner), the bump
proceeds as an ordinary dependency upgrade.

## Use Cases

- When the harness runs, every corpus file emits identical YAML before
  and after the upgrade - or the diff is itemized for review.
- When `js-yaml` 5 passes equivalence, the upgrade lands with the suite
  green.

## Hints

- Emission drift concentrates in scalar quoting and wrapping - the
  `YAML_DUMP_OPTIONS` and `quoteYamlValues` paths in
  `src/utils/yaml/` are the places a version bump changes behaviour.
- The corpus should cover the `docs/change/` fixtures plus edge cases:
  note values with special characters, envelope trimming, `midi` and
  `settings` documents.
- The 1.3.6 revert evidence lives in the archived dependency record -
  re-verify its failure list against the current suite first.

## Out of Scope

- Changing the file formats themselves - equivalence is the acceptance,
  not improvement.
- Other YAML libraries - the record upgrades `js-yaml`, it does not
  replace it.

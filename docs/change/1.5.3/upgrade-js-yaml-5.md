# Upgrade js-yaml to 5

**Type:** Chore

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Upgrade `js-yaml` to the 5.x line once format equivalence can be       |
|               | proven - the prior attempt reverted on YAML serialization drift        |
| Key decisions | A format-equivalence harness precedes the version bump - upgrade lands |
|               | only after byte-identical round-trips are demonstrated                 |
| Open risks    | Resolved - the harness proved byte-identical emission on 5.5.0 and the |
|               | bump landed with the suite green                                       |

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

## Outcome

Landed at `js-yaml` 5.5.0. The equivalence harness
(`test/utils/yaml/yamlEmission.test.ts`) pins emitted bytes for the full
saver surface - the `test/fixtures/` song corpus, a committed copy of the
repository instrument corpus, and constructed edge cases covering
special-character scalars, envelope trimming, `midi`, `settings`, and
clipboard documents - against goldens under `test/fixtures/emission/`.

Two API migrations were required, neither touching emitted bytes:

- Default export removed: `import yaml from 'js-yaml'` became
  `import * as yaml from 'js-yaml'` at every call site.
- `quotingType: '"'` removed: replaced by `quoteStyle: 'double'` in
  `YAML_DUMP_OPTIONS`. The stale option was silently ignored - the
  likely root cause of the earlier attempt's emission drift.

No emitted-byte drift was found after the migration: every corpus
document emits identical text under 5.5.0. `@types/js-yaml` was removed -
the 5.x package bundles its own declarations. `electron-builder` keeps a
transitive 4.x copy untouched.

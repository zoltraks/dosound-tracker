# Assert the import size cap before parsing instrument files

**Type:** Fix

**Source:** AUDIT-1.7 REC-002 — FND-SEC-001

## Summary

| Field         | Value                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Intent        | The 1 MiB `MAX_IMPORT_BYTES` cap fires after a speculative YAML parse on the instrument path - oversized input reaches the parser |
| Key decisions | Move the byte-cap assertion ahead of file read and YAML parse, matching the order used by song/settings/history imports           |
| Open risks    | none - the change only tightens validation order                                                                                  |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Description

Every import path enforces the 1 MiB `MAX_IMPORT_BYTES` cap except one:
the instrument file loader parses the YAML before asserting the size
limit. `src/hooks/instrument/useInstrumentFileLoading.ts` and
`src/components/shell/FileInputs.tsx` read and parse the picked file
first; the cap exists downstream in `src/utils/instrument/instrumentIO.ts`
but fires too late to protect the parser.

An oversized instrument file therefore reaches a full YAML parse before
any byte cap applies - a local parser/denial-of-service surface. The
input is user-selected through a file picker, which keeps severity at
medium, but the asymmetry is a real validation gap: song, settings, and
history imports all check size first.

## Use Cases

- When a user picks an instrument file larger than 1 MiB, the loader
  rejects it with the size error before any YAML parsing runs.
- When a user picks a valid instrument file under the cap, loading
  behaves exactly as before.

## Hints

- Mirror the check order already used by the song and settings import
  paths - the same `MAX_IMPORT_BYTES` constant and error surface apply.
- The file-input layer may also want the size check at pick time so the
  rejection happens before the file is even read into memory.

## Out of Scope

- Changing the 1 MiB cap value or the error message wording.
- The other import paths - they already gate size before parse.

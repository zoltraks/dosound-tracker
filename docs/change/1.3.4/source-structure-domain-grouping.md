# Group Source Files into Domain Subfolders

**Type:** Refactor

AI-assisted: Devin (SWE-2)

## Summary

Group the flat `src/utils/` and `src/hooks/` catch-all directories into domain subfolders named for the shared file-name prefix clusters, and remove the lone `src/modals/index.ts` barrel file. The reorganization improves navigability without changing any behaviour.

## Description

The `src/utils/` directory holds 47 files and `src/hooks/` holds 43 files, all flat. Both directories contain strong domain prefix clusters that are only visible through file names today. Each cluster of two or more files sharing a domain prefix moves into a subdirectory named for that domain.

- `src/utils/` gains `instrument/`, `track/`, `song/`, `midi/`, `keyboard/`, `envelope/`, `playback/`, `file/`, `compression/`, `cursor/`, `export/`, `format/`, `log/`, `markdown/`, `panel/`, `pattern/`, `storage/`, `timer/`, `transpose/`, `validation/`, and `yaml/` subdirectories and holds no files directly at its root.
- `src/hooks/` gains `midi/`, `instrument/`, `song/`, `playback/`, `keyboard/`, `audio/`, `sequencer/`, `modal/`, `app/`, `storage/`, `file/`, and `ui/` subdirectories and holds no files directly at its root. A source directory that contains subdirectories does not hold files directly; its source is spread across the subdirectories.
- `src/stores/` is dissolved: its only member, `uiStore.ts`, moves to `src/hooks/ui/useUiStore.ts` beside the UI-domain hooks and is renamed for the hook file-naming convention (the exported `useUiStore` identifier is unchanged).
- `src/modals/index.ts` is removed. Its only consumer, `src/components/ModalContainer.tsx`, imports the eleven modal components it uses directly, matching the direct-import convention used everywhere else in the tree.
- Import specifiers across `src/` and `test/` are rewritten to the new paths. This includes `import` and `from` clauses, `export ... from` clauses, dynamic `import()` calls, `vi.mock` specifiers, query-suffixed specifiers such as `?raw`, and the `new URL('...', import.meta.url)` worker specifier in `useSequencer.ts`.
- File contents are not modified beyond import specifier paths. No identifiers are renamed, no logic changes.
- The stray untracked `src/.DS_Store` file is removed.

## Use Cases

- When a developer looks for MIDI-related hooks, they find them grouped under `src/hooks/midi/` instead of scanning a 43-file flat directory.
- When a new utility is added for an existing domain, it lands in the matching subdirectory and the domain grouping stays consistent.

## Hints

- Both `src/hooks/` and `src/utils/` are fully grouped: every file lives in a domain subdirectory, and a source directory that contains subdirectories does not hold files directly. Single-file directories are allowed when a domain has one member. The `src/` root keeps its entry files (`main.tsx`, `App.tsx`, `index.css`, `App.css`) as the recorded exception.
- The reorganization is mechanical. Every move uses `git mv` so history survives, and every broken specifier is fixed in the same wave.
- The `@/` path alias configured in `vite.config.ts` and `vitest.config.ts` is unused; this change keeps the relative-import convention and does not introduce alias usage.

## Out of Scope

- Reorganizing `src/components/`, `src/synth/`, `src/exports/`, `src/constants/`, `src/types/`, `src/stores/`, or `src/workers/`.
- Moving or restructuring the `test/` tree. Test files keep their current locations; only their import specifiers are rewritten.
- Decomposing `App.tsx` or splitting the Zustand store; these are recorded known limitations for later windows.
- Any behaviour change. The tree must produce byte-identical export output and identical UI behaviour.

# Lessons - Window 1.6.5 (Dual-chip audio, UI, exports)

## Indexed findings

1. **Ref-object optionality breaks React Compiler memoization.** Making
   `ym2149Ref2` an optional prop (`ym2149Ref2?`) and reading
   `ym2149Ref2?.current` inside `useCallback` bodies triggered
   `react-hooks/preserve-manual-memoization` warnings. The fix was to make
   the ref prop required (the audio hook always returns the ref object,
   populated or not) and read `.current` directly - matching the existing
   `ym2149Ref` convention. Lesson: second-instance refs should be
   unconditional in hook contracts; optionality belongs to the engine
   value, not the ref.

2. **Widening a persisted tuple breaks every literal expectation.**
   `channelMutes` going from three to six entries failed twelve tests
   across five files - store initializers, lifecycle resets, cursor
   parsing, settings load, and YAML goldens. The durable pattern: when a
   persisted array widens, grep for the old literal length in tests AND
   fixtures AND golden files before running the suite; golden YAML
   snapshots need the new keys added in emission order.

3. **The 600 kB entry budget is a real constraint on wide windows.** A
   three-record window added ~5 kB to the entry chunk and crossed the
   `chunkSizeWarningLimit`. The recovery was the established
   `React.lazy` + conditional-mount pattern already used for
   `SettingsModal` - picker, export, and paste-track modals now load on
   demand. Lesson: when a window's diff is broad but shallow, prefer
   code-splitting user-action surfaces over micro-optimizing hot paths.

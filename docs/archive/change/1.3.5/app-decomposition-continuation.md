# Continue App.tsx Decomposition

**Type:** Refactor

## Summary

Continue the staged decomposition of `App.tsx` (~1390 lines): extract remaining handler clusters into bounded orchestration hooks under `src/hooks/` domain subdirectories.

## Description

`App.tsx` still concentrates the hook wiring and the JSX prop map. Further decomposition was a recorded known limitation before the structure reorganization and remains the largest readability cost. Extract bounded concerns in verifiable increments, preserving the audio-critical constraints and the prop-mirroring patterns.

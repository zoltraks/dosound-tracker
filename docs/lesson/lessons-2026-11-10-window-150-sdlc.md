# Lessons - 1.5.0 Window

## Findings

- **Mirror-after-seed effects clobber.** A `useEffect` that mirrors state
  into a snapshot fires on the open-commit with pre-seed values, transiently
  overwriting the session it just seeded. Explicit per-setter writes at the
  mutation site avoid the race entirely and read cleaner - prefer them over
  a state-driven mirror when the snapshot must stay exactly consistent.
- **Restore needs a commit cycle before touching the DOM.** Applying
  `scrollTop`/`focus()` from the same effect that seeds state hits un-seeded
  DOM. Double `requestAnimationFrame` - the pattern already used for the
  startup tone - waits one full commit cycle.
- **Component-internal modal state is invisible to the global key path.**
  `confirmingReset` inside `SettingsModal` meant ENTER committed the whole
  draft while a destructive confirm was on screen. Working state that
  global keys must see belongs in the orchestration hook - exactly what
  SPECIFICATION's Modal Working State section prescribes.

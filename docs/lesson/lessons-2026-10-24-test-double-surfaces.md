# Session Findings

Durable lessons recorded when a session ends.

Each entry names a wound, its root cause, and the rule that now prevents it.

Entries use titles, never ordinal numbers - unnumbered entries reorder freely.

The appendix indexes rules that live in the owning document's body - it does not hold rules.

If no existing rule covers a lesson, add the rule to the owning document first, then index it here.

### Fetch Stubs Must Model the Full Response Surface

Observed symptom: a new `fetchBundledMarkdown` helper reading `response.headers.get('content-type')` would have failed the existing `useMessageSystem` tests, whose stub returned only `{ ok, text }`. Caught by inspection before the suite ran.

Root cause: the stub modeled only the fields the old consumer used, so any new field read on the response produces a TypeError that surfaces far from its cause as an empty-state failure.

Preventing rule: see "Component test hygiene" in `docs/TESTING.md`.

### Prototype Spies Miss the Plain-Object localStorage Mock

Observed symptom: `vi.spyOn(Storage.prototype, 'setItem')` in `test/hooks/useStorageMirror.test.ts` never intercepted the save, so the "no mirror on failed write" test failed even though the code behaved correctly.

Root cause: `test/setup-localstorage.ts` installs a fresh plain-object mock per test, outside the `Storage` prototype chain, so a prototype-level spy is never consulted.

Preventing rule: see "Component test hygiene" in `docs/TESTING.md`.

### Markup Assertions Must Not Match Escaped Entities

Observed symptom: a hardening test asserting "no attribute breakout" flagged `&quot;onmouseover=&quot;` inside an `href` value, even though the escaped entity can never terminate the attribute.

Root cause: the assertion regex `<a [^>]*onmouseover` scans raw text without distinguishing `&quot;` entity text from a real quote that would close the attribute.

Preventing rule: see "Component test hygiene" in `docs/TESTING.md`.

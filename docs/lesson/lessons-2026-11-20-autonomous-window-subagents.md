# Session lessons - 2026-11-20 autonomous window, subagent orchestration

## Wounds

- **Probe files under `test/` are typecheck surface.** A parity-agent
  scratch probe (`zzprobe.test.tsx`) sat untracked with unused-variable
  errors and blocked another agent's `electron:build` mid-window. Files
  under `test/` are compiled by `tsc -b` even when untracked, so a
  scratch probe must be deleted or typecheck-clean before its owner
  reports done - "untracked" does not mean "invisible".
- **Concurrent agents need an explicit ownership map.** Six parallel
  implementation agents shared one working tree with zero file
  conflicts because each prompt named its owned paths and forbade the
  rest. Foreign-file flags in reports (probe files, WIP docs) were the
  only collisions - attribution at commit time needs the same map.
- **The WebKit-Windows classification was imprecise.** The 1.6.7 review
  and TESTING.md described the two playback e2e failures as a
  "suspended `AudioContext`" limitation. Root-causing showed Playwright's
  Windows WebKit build ships **without the Web Audio API at all**
  (`window.AudioContext` undefined, upstream `microsoft/playwright#14105`)
  - not a suspended context that fails to resume, but an absent API.
    Environmental either way, but the mechanism matters for anyone
    debugging audio on that project.
- **Coverage-subset numbers mislead.** The audit's 79.63% branch figure
  came from a stable subset that excluded `App.test.tsx` - the largest
  single coverage contributor. The real gate failed on suite timeouts,
  not on the threshold; restoring the suite cleared both problems at
  once. Measure the actual gate, not a curated subset.
- **Doc-update handoffs work when ownership is explicit.** Three agents
  flagged specification/doc edits outside their file ownership instead
  of reaching across; the integrator applied them in one pass
  (SPECIFICATION.md, FORMAT.md, TESTING.md). The pattern - agents record
  needed doc changes in plan Refinements, integrator applies - kept
  ownership clean and docs accurate.

## Routed landings

- Probe/scratch typecheck rule: appended to the scratch-file guidance
  in `TESTING.md` (probe files under `test/` must typecheck or be
  deleted before reporting).
- WebKit-Windows no-Web-Audio fact: landed in `TESTING.md` under the
  audio-path e2e paragraph during integration (agent E's proposed note,
  corrected mechanism).
- Subagent ownership-map pattern and doc-handoff convention: recorded
  in `docs/decision/2026-11-20-autonomous-sdlc-default.md` (delegation
  clause) - the durable rule lives with the gate-mode decision.
- Live/offline divergences found by the parity contract: deferred to
  `docs/change/1.7.0/reconcile-live-offline-divergences.md` per the
  deferral rule - never silently fixed inside the finding window.

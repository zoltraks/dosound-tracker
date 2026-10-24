# Add Playwright Smoke Suite Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.1/add-playwright-smoke-suite.md`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- TypeScript strict mode in spec files, no `any` types.
- Selectors follow user-facing surfaces: role, accessible title, button text, and stable class hooks already present in the components.
- No abbreviations in identifiers.
- Specs stay independent and deterministic: each test sets up its own state and never depends on another test's outcome.

## Audio-Critical Requirements

- **Audio impact assessment**: the change adds test files only. No React render timing, `useCallback`/`useMemo` dependencies, or audio-path state management is modified. The YM2149 emulator and SoundDriver are untouched.
- **Timing stability verification**: playback assertions observe DOM state (button playing class, cursor position) rather than real audio output. No manual playback testing is required because no audio code changes.
- **Linting exception documentation**: no new linting exceptions are introduced or preserved.
- **Playback simulation**: the playback flow asserts the `playing` class on the command buttons and a position advance within a bounded wait, which exercises the sequencer worker deterministically without depending on audible output.

## Documentation Updates

- `TESTING.md` — update the end-to-end section to name the implemented spec file and the six covered flows, and record that `npm run test:e2e` requires a prior `npm run build` because the suite runs against `vite preview` serving `dist/`.

No changes to `PROJECT.md`, `ARCHITECTURE.md`, `SPECIFICATION.md`, or `FORMAT.md` are required.

## Type and State Updates

**Type definitions**

No application type changes. Spec files use the `@playwright/test` types directly.

**State store modifications**

No store changes.

## Step by Step Implementation

**Create the shared spec helpers**

One spec file keeps the suite compact; a small helper module holds the repeated interactions.

File to create: `e2e/helpers.ts`.

```typescript
import { expect, type Page } from '@playwright/test';

export async function gotoApp(page: Page) {
  await page.goto('/');
  await expect(page.locator('.command-panel')).toBeVisible();
}
```

**Implement the six flows**

One spec file with one `test` per documented flow keeps the suite readable and lets each flow run independently.

File to create: `e2e/smoke.spec.ts`.

- Launch defaults: assert the command panel renders, the bundled `src/assets/song.yaml` content is loaded (first track cell shows a note), and instrument `00` is selected. The documented "empty song" wording was stale - first launch parses the bundled demo song per `useSongManagement`.
- Note entry and playback: click the first `.note-text` cell in `.track-panel.track-a`, press `z`, assert the cell displays a C note, click `PLAY LINE`, assert the button gains the `playing` class and the position advances, then `STOP`.
- Instrument editing: click `ADD INST`, assert the instrument list shows `01`, click a volume envelope step, then `PLAY INST` and assert the preview triggers without an error message.
- Export: click `EXPORT`, choose the `DATA` format in the export modal, capture the download, assert the saved file starts with `music:` and contains `dc.b`.
- Save and load: click `SAVE SONG`, capture the `.yaml` download, feed it back through the hidden song file input with `setInputFiles`, and assert the song title field shows the saved title.
- Theme switching: click the theme toggle (`title="Switch to light mode"`), assert the light theme applies, click again to restore dark mode.

**Restrict the project matrix to runnable engines**

The firefox project is removed from `playwright.config.ts` because headless launch fails under the current macOS sandbox (`sandbox_extension_issue_file_to_process` denied for `plugin-container.app`, both headless and headed). Chromium and webkit remain; the exclusion is recorded in `TESTING.md` and a `REASON:` comment marks the revert point in the config.

File to modify: `playwright.config.ts`.

**Keep specs self-contained**

The load flow reuses the bytes captured from the save download through `setInputFiles` with an in-memory buffer, so no fixture file and no `work/` path is needed.

```typescript
await page
  .locator('input[type="file"][accept=".yaml,.yml"]')
  .first()
  .setInputFiles({ name: 'song.yaml', mimeType: 'application/yaml', buffer });
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Create `e2e/helpers.ts`
3. Create `e2e/smoke.spec.ts`
4. Run verification loop

## Testing Strategy

**Unit tests**

No new utility functions are added; no unit tests are required.

**Integration tests**

The end-to-end specs are the deliverable. Each of the six flows is asserted through the real UI against the production build.

```typescript
test('enters a note in track A and plays the line', async ({ page }) => {
  // click cell, press piano key, assert display, play, assert playing state
});
```

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e`

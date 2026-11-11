# Stabilize E2E File Flows Implementation Plan

## Summary

| Field         | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| Intent        | Make the e2e file flows deterministic - unambiguous selectors and waits on |
|               | staged input state instead of ordering assumptions                         |
| Key decisions | Disambiguate the two hidden YAML file inputs with `id` attributes, target  |
|               | the song title through its `aria-label`, and wait on the staged file state |
|               | before asserting the loaded value                                          |
| Open risks    | none                                                                       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/stabilize-e2e-file-flows.md`.

## Analysis

**Ambiguous file-input selector.** `FileInputs.tsx` renders two hidden inputs that both carry `accept=".yaml,.yml"` - the song input and the instrument input. The spec selects `input[type="file"][accept=".yaml,.yml"]` `.first()`, which resolves correctly only through DOM order. There is no distinguishing attribute, so the selector is positional and opaque.

**Ambiguous title selector.** `.information-input` is a shared styling class - the title and author inputs, the color-picker custom field, and every `NumberSpinner` input all carry it. The spec's `.first()` again resolves through DOM order alone. The title input already carries `aria-label="Song title"`, which gives a deterministic locator.

**Post-upload wait.** `setInputFiles` resolves when the browser stages the file; the application then runs `FileReader` and commits the loaded song through React. Under parallel webkit workers that pipeline can outlast the default polling window, so `toHaveValue('E2E SONG')` times out holding the pre-upload value - the recorded flake. The deterministic shape is to prove the file staged on the correct input (`toHaveValue` on the input itself), then assert the loaded title with a polling window sized for parallel load. No `waitForTimeout` is used - the wait is on observable state.

**Download flows.** The export spec already sets `waitForEvent('download')` before the triggering click. The same pattern is lifted into a shared helper so future flows cannot reintroduce the ordering mistake.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- Functional components only with proper TypeScript interfaces
- Maintain accessibility with proper ARIA attributes
- Keep components focused on single responsibility
- No abbreviations in identifiers (use full words)

## Documentation Updates

No pillar document changes - the change touches test infrastructure and one inert markup attribute. `TESTING.md` receives its flake-note update at the end of the record, after the deterministic run is proven, per the change record's hint.

## Type and State Updates

None - no type definitions or store changes.

## Step by Step Implementation

**Name the hidden file inputs**

Give each hidden input a stable `id` so the suite selects by identity, not DOM order. The attributes are inert - no behaviour change.

File to modify: `src/components/FileInputs.tsx`.

```tsx
<input
  ref={fileInputRef}
  id="song-file-input"
  type="file"
  ...
/>
<input
  ref={instrumentFileInputRef}
  id="instrument-file-input"
  type="file"
  ...
/>
```

**Add file-flow helpers**

Extend `e2e/helpers.ts` with locators and waits the file flows share.

File to modify: `e2e/helpers.ts`.

```typescript
export function songFileInput(page: Page) {
  return page.locator('#song-file-input');
}

export function instrumentFileInput(page: Page) {
  return page.locator('#instrument-file-input');
}

export async function uploadSongFile(page: Page, file: FilePayload): Promise<void> {
  await songFileInput(page).setInputFiles(file);
  await expect(songFileInput(page)).toHaveValue(new RegExp(`${file.name}$`));
}

export async function clickAndDownload(
  page: Page,
  trigger: () => Promise<void>,
): Promise<Download> {
  const downloadPromise = page.waitForEvent('download');
  await trigger();
  return downloadPromise;
}
```

**Rewrite the save/load spec**

Target the title by `aria-label`, stage the upload through the helper, then assert the loaded title with a polling window sized for parallel workers.

File to modify: `e2e/smoke.spec.ts`.

```typescript
test('saves and loads a song file', async ({ page }) => {
  await gotoApp(page);
  const titleInput = page.getByLabel('Song title');
  await titleInput.fill('E2E SONG');
  const download = await clickAndDownload(page, () => commandButton(page, 'SAVE SONG').click());
  expect(download.suggestedFilename()).toMatch(/\.yaml$/);
  const buffer = await readFile((await download.path()) as string);
  await titleInput.fill('CHANGED');
  await uploadSongFile(page, { name: 'e2e-song.yaml', mimeType: 'application/yaml', buffer });
  await expect(titleInput).toHaveValue('E2E SONG', { timeout: 15_000 });
});
```

**Rewire the export spec**

Route the download through the shared helper so every file flow holds the same ordering.

File to modify: `e2e/smoke.spec.ts`.

```typescript
const download = await clickAndDownload(page, () =>
  page.locator('.export-modal').getByRole('button', { name: 'DATA' }).click(),
);
```

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation - none required up front
2. Name the hidden file inputs in `FileInputs.tsx`
3. Add file-flow helpers in `e2e/helpers.ts`
4. Rewrite the save/load spec and rewire the export spec
5. Run the verification loop, then the e2e suite repeatedly under parallel workers
6. Update the `TESTING.md` flake note to match the proven behaviour

## Testing Strategy

**Unit tests**

None - no new utility logic. `e2e/helpers.ts` is suite infrastructure exercised by the spec run itself.

**End-to-end tests**

The changed suite is the deliverable. Acceptance is `npm run test:e2e` passing repeatedly under parallel workers on both the chromium and webkit projects - three consecutive clean runs - with the save/load assertion still proving the real upload.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` three times consecutively on both projects

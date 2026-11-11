# Expand End-to-End Coverage Implementation Plan

## Summary

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Intent        | Grow the smoke suite by five flows: settings persistence, Ayumi engine |
|               | switch, VGM export, MAX export, and the About document flow            |
| Key decisions | One flow per `test`, shared interactions in `e2e/helpers.ts`, audible- |
|               | outcome assertions via playback position and persisted engine key      |
| Open risks    | Ayumi worklet startup under webkit's suspended context is the flake    |
|               | surface - playback assertions keep the existing waiting patterns       |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/expand-e2e-coverage.md`.

## Analysis

The suite covers six flows; the record names four candidate additions. Verified against the current tree:

- Settings modal opens through the header gear (`aria-label="Settings"`), renders category buttons (`#settings-category-sound`), a theme select (`#settings-theme`), an engine select (`#settings-sound-engine`), and footer actions (`#settings-action-ok`). Committed values persist under `dosound-tracker-theme` and `dosound-tracker-sound-engine`.
- The export modal offers `VGM` and `MAX` buttons that trigger downloads directly - both reuse the `clickAndDownload` helper.
- The About modal opens through the header logo (`aria-label="About DOSOUND Tracker"`), shows the version, and its `CHANGES` button opens the `MarkdownModal` rendering `CHANGELOG.md`.
- The audible-outcome rule applies to the engine flow: position advancement is observable UI proof that the tick-to-render pipeline runs under the Ayumi engine, and the persisted engine key proves the commit. `localStorage` reads give the durable state.

Five flows land, each an independent `test`.

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/typescript-react-development.md`:

- No abbreviations in identifiers (use full words)
- Keep helpers focused on single responsibility

## Audio-Critical Requirements

- The engine-switch flow touches the audio path - assertions follow `TESTING.md`: position advancement and persisted state are the observable outcome, and the run must pass under the webkit project where suspended-context behaviour reproduces.

## Documentation Updates

- `TESTING.md` - the end-to-end test list gains the five new flows.

## Type and State Updates

None.

## Step by Step Implementation

**Extend the helper surface**

Add the two modal entry points the flows share.

File to modify: `e2e/helpers.ts`.

```typescript
export async function openSettings(page: Page): Promise<void> {
  await page.getByLabel('Settings', { exact: true }).click();
  await expect(page.locator('.settings-modal')).toBeVisible();
}

export async function openExportModal(page: Page): Promise<void> {
  await commandButton(page, 'EXPORT').click();
  await expect(page.locator('.export-modal')).toBeVisible();
}
```

**Add the five flows**

File to modify: `e2e/smoke.spec.ts`.

```typescript
// 1. settings persistence: open settings, pick light theme, OK, reload,
//    assert .app keeps the light class and the theme key persists.
// 2. Ayumi switch: settings > SOUND > engine Ayumi > OK, assert the
//    persisted engine key, play, assert position advances, stop.
// 3. VGM export: openExportModal > VGM > download, assert .vgm filename
//    and 'Vgm ' magic in the first bytes.
// 4. MAX export: openExportModal > MAX > download, assert .max filename
//    and 'MAX ' magic in the first bytes.
// 5. About flow: logo click > About modal with version > CHANGES opens
//    the markdown modal rendering the changelog content.
```

## Implementation Order

Execute the steps above in this sequence.

1. Update `TESTING.md` flow list
2. Extend `e2e/helpers.ts`
3. Add the five flows in `e2e/smoke.spec.ts`
4. Run the verification loop, then `npm run test:e2e` on both projects

## Testing Strategy

**Unit tests**

None - e2e-only change.

**End-to-end tests**

The five new specs are the deliverable; the full suite must pass on chromium and webkit under parallel workers.

## Verification

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` - all flows green on both projects

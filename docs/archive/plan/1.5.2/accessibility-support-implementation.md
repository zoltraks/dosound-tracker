# Extend Accessibility Support Implementation Plan

## Summary

| Field         | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Intent        | Ship the record's three slices - a designed screen-reader surface, a high |
|               | contrast theme variant, and bounded text scaling                          |
| Key decisions | Theme becomes a three-value union, text scale uses CSS `zoom` on `.app`   |
|               | with compensated dimensions, and the pattern grid gets a per-track live   |
|               | region announcing row plus column context                                 |
| Open risks    | `zoom` is a non-standard-but-baseline property - Firefox 126+, Chromium,  |
|               | and WebKit all implement it; the e2e run proves the mechanism             |

The summary block precedes the detailed sections and is refreshed when the
record's decisions or risks change.

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.5.2/accessibility-support.md`.

## Analysis

**Theme.** `useTheme` holds a boolean persisted as `'dark'`/`'light'` under `StorageKeys.THEME`, and `settings.general.theme` carries the same two values through `loadSettings`, `normalizeSettings`, and the settings YAML round-trip. `AppLayout` maps the boolean to the `dark`/`light` class on `.app`, and `App.css` defines the palette on `:root` (dark defaults) with a `.light` override block. The mechanism is a class on `.app` plus CSS custom properties - a third variant is another class and another override block. `isDarkMode` also drives binary asset picks (logo, rainbow-mode icon, initial overlay); for a dark-based contrast palette the dark assets stay correct.

**Text scaling.** Every font size in `App.css` is an absolute `px` literal, so scaling `font-size` alone cannot enlarge text. The layout is a fixed grid that must keep fitting the window. `zoom` on `.app` scales the whole grid uniformly - text and geometry together - so nothing reflows incorrectly and scrollable panels simply show less content. Compensating `.app`'s own `width`/`height` by the inverse of the zoom factor keeps the app exactly viewport-sized. Scaling is bounded to three steps - 100%, 125%, 150% - which keeps every panel usable inside its own scroll region.

**Screen reader.** The 1.4.5 baseline already labels panels (`role="group"` + `aria-label`), the message rotation (`role="status"`), the position rows, and every icon button. What is missing is structure: `.main-content` is a plain `div`, the three columns and the command panel have no landmark role, and the track grid exposes raw cell text with no designed reading order. The app's keyboard model intercepts TAB globally for section navigation, so a native skip link can never receive focus - landmark roles carry that function instead. For the dense grid, a visually-hidden `role="status"` live region inside each `TrackPanel` announces the cursor row with column context whenever the active track's row or column changes, which matches the record's "row announcement with column context" and avoids exposing sixty-four cells per track to flat reading.

## Best Practices

Follow TypeScript and React engineering standards from `standard/typescript-react-development.md`:

- No abbreviations in identifiers (use full words)
- Keep components focused on single responsibility

Follow `standard/accessibility-general-development.md`:

- ARIA only where native semantics are insufficient - landmarks come from real elements where the layout allows (`<main>`, existing `<header>`)
- Live regions announce dynamic content politely (`role="status"`, `aria-live="polite"`)
- Meaningful names on every region and control

## Audio-Critical Requirements

No audio-path changes. The record touches appearance state, markup attributes, and a live region that renders a string - none of it sits on the sequencer, preview, or engine paths. `useTheme` keeps its `startTransition` wrap on toggle so theme flips cannot block the audio thread's frame budget.

## Documentation Updates

- `SPECIFICATION.md` - the Settings persistence section records the three-value `THEME` key, the new `TEXT_SCALE` key, the zoom-based scaling mechanism, and the landmark/live-region semantics.
- `PROJECT.md` - `F-12` gains the contrast variant, `F-17` gains the text-size control, and the layout requirement list gains the third theme.

## Type and State Updates

`src/types/settings.ts` gains `ThemeVariant` (`'dark' | 'light' | 'contrast'`) and `TextScale` (`'100' | '125' | '150'`). `SettingsValues.general` gains `textScale: TextScale`, default `'100'`. `StorageKeys` gains `TEXT_SCALE` (`'dosound-tracker-text-scale'`), which joins the RESET-preserved set in `applicationStorage.ts` beside `THEME`.

## Step by Step Implementation

**Extend the settings model**

Add `ThemeVariant` and `TextScale` types, widen `general.theme`, add `general.textScale` with default `'100'`, and register the `TEXT_SCALE` storage key plus its RESET preservation.

Files to modify: `src/types/settings.ts`, `src/utils/storage/storageKeys.ts`, `src/utils/storage/applicationStorage.ts`.

```typescript
export type ThemeVariant = 'dark' | 'light' | 'contrast';
export type TextScale = '100' | '125' | '150';
```

**Update settings state and YAML**

`loadSettings` reads `THEME` accepting `'contrast'` and reads `TEXT_SCALE` accepting the three step values, both falling back to defaults on corrupt input. `normalizeSettings` validates both members. `buildSettingsYaml` emits `textScale` under `general`. The YAML `version` stays `1` - the added member normalizes onto defaults for older files.

Files to modify: `src/utils/settings/settingsState.ts`, `src/utils/settings/settingsYaml.ts`.

**Rework the theme hook and add the scale hook**

`useTheme` returns `{ theme, setTheme, toggleTheme }` over the three-value union; `toggleTheme` flips between `'light'` and `'dark'` so the header button keeps its day/night semantics and the existing e2e flow stays green. A new `useTextScale` hook mirrors the same `useLocalStorageState` pattern.

File to modify: `src/hooks/ui/useTheme.ts`.
File to create: `src/hooks/ui/useTextScale.ts`.

```typescript
export const useTextScale = () => {
  const [textScale, setTextScale] = useLocalStorageState<TextScale>(StorageKeys.TEXT_SCALE, '100', {
    read: (stored) => (stored === '125' || stored === '150' ? stored : '100'),
    write: (value) => value,
  });
  return { textScale, setTextScale } as const;
};
```

**Wire the app shell**

`App.tsx` derives `isDarkMode = theme !== 'light'`, commits `setTheme(next.general.theme)` and `setTextScale(next.general.textScale)` in `handleCommitSettings`, and adds `textScale` to the committed-settings memo. `AppLayout` takes `theme` and `textScale` props, renders `app ${theme}` plus an `app-scale-<n>` class for non-100 scales, picks the light overlay only for `'light'`, and turns `.main-content` into a `<main>` element.

Files to modify: `src/App.tsx`, `src/components/AppLayout.tsx`.

**Extend the settings modal**

The theme select gains a `High Contrast` option. A `Text size` select joins the GENERAL category with `Standard (100%)`, `Large (125%)`, and `Extra large (150%)` options. Both selects write the draft through the same `onDraftChange` shape.

File to modify: `src/modals/SettingsModal.tsx`.

**Add the contrast palette and scaling rules**

`App.css` gains a `.contrast` block overriding the same custom-property surface the `.light` block covers, with a black-background, high-contrast palette (white text, saturated accent borders). `.app` switches to `--app-zoom`-compensated dimensions, `.app-scale-125`/`.app-scale-150` set the factor, and a `.visually-hidden` utility carries the standard clipping pattern. A guard caps `.modal-dialog` bounds by the inverse factor so dialogs stay inside the window. The mobile media query applies the same inverse compensation.

File to modify: `src/App.css`.

```css
.app {
  --app-zoom: 1;
  width: calc(100% / var(--app-zoom));
  height: calc(100% / var(--app-zoom));
  zoom: var(--app-zoom);
}

.app-scale-125 {
  --app-zoom: 1.25;
}

.app-scale-150 {
  --app-zoom: 1.5;
}
```

**Add landmarks and the row announcer**

`.left-column`, `.middle-column`, `.right-column`, and `.command-panel` become labelled `role="region"` landmarks (`Pattern editor`, `Instrument envelopes`, `Song and instruments`, `Commands`). `.position-content` and `.tracks-row` gain `role="group"` labels. `TrackPanel` renders a visually-hidden `role="status"` live region whose text comes from a new `buildTrackRowAnnouncement` helper - `Track A row 0A, note column, C-4 instrument 00, volume 0F` with the active column announced first - populated only while the track is the active section so navigation between tracks announces the new track's row.

Files to modify: `src/components/TrackerSection.tsx`, `src/components/EnvelopeSection.tsx`, `src/components/SongSection.tsx`, `src/components/CommandPanel.tsx`, `src/components/TrackPanel.tsx`, `src/utils/track/trackRendering.ts`.

## Implementation Order

Execute the steps above in this sequence.

1. Update `SPECIFICATION.md` and `PROJECT.md`
2. Extend the settings model, state, and YAML
3. Rework `useTheme`, add `useTextScale`, wire `App.tsx` and `AppLayout`
4. Extend `SettingsModal`
5. Add the `.contrast` palette, scaling rules, and `.visually-hidden`
6. Add landmarks and the row announcer
7. Update and add tests
8. Run the verification loop

## Testing Strategy

**Unit tests**

- `test/utils/settings/settingsState.test.ts` - extend literals with `textScale`, cover `contrast` acceptance and corrupt fallback for both new values.
- `test/utils/settings/settingsYaml.test.ts` - round-trip a `contrast` theme and non-default `textScale`.
- `test/modals/SettingsModal.test.tsx` - extend literals, cover the contrast option and the text-size select through `onDraftChange`.
- `test/utils/storage/uiState.test.ts` - extend literals with `textScale`.
- `test/utils/track/` - a suite for `buildTrackRowAnnouncement` covering note, note-off, empty, volume-column, and non-active states.
- `test/hooks/ui/useTheme.test.tsx` - storage mapping for all three values plus the light/dark toggle semantics.
- `test/hooks/ui/useTextScale.test.tsx` - storage mapping and default.
- `test/components/TrackPanel.test.tsx` - assert the live region announces the active track's current row.
- `test/components/AppLayout.test.tsx` - assert the `main` landmark and the theme/scale class composition.

**End-to-end tests**

Extend the settings theme spec in `e2e/smoke.spec.ts`: select `contrast`, assert the `.app` class and persisted key, reload, and assert the class survives. Select `Large (125%)` text size, assert the `app-scale-125` class, the persisted key, and that the app element still bounds to the viewport width.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run format`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` for the theme and settings specs

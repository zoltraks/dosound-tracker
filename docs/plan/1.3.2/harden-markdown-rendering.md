# Harden the Markdown Rendering Path Implementation Plan

## Change Request Reference

This implementation plan is based on the change request at `docs/change/1.3.2/harden-markdown-rendering.md` (AUDIT-1.2 REC-008 / FND-SEC-001).

## Best Practices

Follow TypeScript and React engineering standards from `docs/standard/ts-react-development.md`:

- TypeScript strict mode, no `any` types.
- No abbreviations in identifiers.
- Single-responsibility modules: fetching, rendering, and sink markup stay separate.
- Defence in depth: keep the escaping renderer as the first wall and add a content security policy as the second wall, rather than replacing a working component with a new dependency.

## Audio-Critical Requirements

- **Audio impact assessment**: the change touches `src/utils/markdown.ts`, a new fetch helper, `src/hooks/useMessageSystem.ts`, `src/components/EnvelopeSection.tsx`, `src/App.tsx` fetch handlers, and `vite.config.ts`. None of these sit on the audio render path. `EnvelopeSection.tsx` gains only a type-level change (`TrustedHtml` instead of `string`); the `useMemo` dependency array is unchanged.
- **Timing stability verification**: no timers, callbacks, or state patterns on audio paths are modified. No manual playback testing is required.
- **Linting exception documentation**: no new linting exceptions are introduced or preserved.
- **Playback simulation**: not applicable; the sequencer and SoundDriver are untouched.

## Documentation Updates

Per project guidelines, update the active documentation set before any source code modifications.

- `SPECIFICATION.md` — new section describing the markdown rendering security model: the bundled-document allowlist, the `TrustedHtml` brand, and the build-time content security policy.
- `DEPLOYMENT.md` — one sentence noting that production builds inject a restrictive CSP meta tag and where the directive list lives.

No changes to `PROJECT.md`, `ARCHITECTURE.md`, or `FORMAT.md` are required. The change alters no requirement and no file format.

## Type and State Updates

**Type definitions**

A nominal brand marks HTML that has passed through the allowlist renderer, so a `dangerouslySetInnerHTML` sink cannot be fed a raw string by accident.

File to modify: `src/utils/markdown.ts`.

```typescript
export type TrustedHtml = string & { readonly __brand: 'TrustedHtml' };
```

`renderMarkdown` returns `TrustedHtml`. The brand is compile-time only and produces no runtime code.

**State store modifications**

No store changes.

## Step by Step Implementation

**Add the trusted HTML brand to the markdown renderer**

`renderMarkdown` already escapes every byte of source text and only emits tags from fixed templates. Branding its return type makes that contract explicit: sinks typed against `TrustedHtml` refuse raw strings at compile time.

File to modify: `src/utils/markdown.ts`.

```typescript
export type TrustedHtml = string & { readonly __brand: 'TrustedHtml' };

export const renderMarkdown = (md: string): TrustedHtml => {
  // ...existing implementation, return type annotation changed only
};
```

**Create the bundled-document fetch allowlist**

A single choke point keeps the renderable source set bounded: only bundled first-party markdown files may reach a sink. The helper also rejects responses that look like HTML (SPA fallback or unexpected content type), generalising the check that `handleShowManual` performs today.

File to create: `src/utils/bundledMarkdown.ts`.

```typescript
const BUNDLED_MARKDOWN_FILES = new Set(['MESSAGES.md', 'CHANGELOG.md', 'MANUAL.md']);

export const fetchBundledMarkdown = async (name: string): Promise<string> => {
  if (!BUNDLED_MARKDOWN_FILES.has(name)) {
    throw new Error(`Bundled document not allowed: ${name}`);
  }
  const response = await fetch(name);
  if (!response.ok) {
    throw new Error(`Failed to load ${name}.`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(`${name} appears to be HTML, treating as missing.`);
  }
  const text = await response.text();
  const trimmed = text.trimStart().slice(0, 512).toLowerCase();
  if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html')) {
    throw new Error(`${name} appears to be HTML, treating as missing.`);
  }
  return text;
};
```

**Route all markdown fetches through the allowlist**

`useMessageSystem` fetches `MESSAGES.md`; `handleShowChangelog` and `handleShowManual` in `App.tsx` fetch `CHANGELOG.md` and `MANUAL.md`. All three switch to `fetchBundledMarkdown`, and the manual-specific HTML sniffing in `App.tsx` is removed because the helper now covers every bundled document.

Files to modify: `src/hooks/useMessageSystem.ts`, `src/App.tsx`.

```typescript
fetchBundledMarkdown('CHANGELOG.md')
  .then((text) => setChangelogContent(text))
  .catch(() => setChangelogContent('Unable to load changelog.'));
```

**Type the EnvelopeSection sink**

The notes panel memo returns `TrustedHtml` so the sink contract is visible at the component boundary. No behaviour changes.

File to modify: `src/components/EnvelopeSection.tsx`.

```typescript
const currentMessageHtml: TrustedHtml = useMemo(() => {
  const text = messages[currentMessageIndex] ?? '';
  return renderMarkdown(currentMessageIndex >= 0 && messages.length > 0 ? text : '');
}, [messages, currentMessageIndex]);
```

**Inject a content security policy at build time**

A Vite plugin active only during `build` inserts a restrictive CSP meta tag into `dist/index.html`. The packaged Electron app loads that file over `file://`, so the policy ships with the desktop bundle; development mode is unaffected because the plugin never runs under `vite dev`.

File to modify: `vite.config.ts`.

```typescript
const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self' data:; connect-src 'self' file:; " +
  "worker-src 'self'; manifest-src 'self'; object-src 'none'; " +
  "base-uri 'self'; form-action 'none'";

{
  name: 'inject-content-security-policy',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace(
      '</head>',
      `    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />\n  </head>`,
    );
  },
}
```

Directive notes: `style-src 'unsafe-inline'` is required because React style attributes and the generated table-alignment styles count as inline style. `connect-src file:` covers the bundled-document fetches when the packaged app runs from `file://`. `worker-src 'self'` covers the bundled sequencer worker. `form-action 'none'` is safe because the app renders no forms. `frame-ancestors` is omitted because meta-delivered policies ignore it.

## Implementation Order

Execute the steps above in this sequence.

1. Update documentation
2. Update type definitions (`TrustedHtml`)
3. Create `src/utils/bundledMarkdown.ts`
4. Rewire the three fetch call sites
5. Type the EnvelopeSection sink
6. Add the CSP plugin to `vite.config.ts`
7. Add or update tests
8. Run verification loop

## Testing Strategy

**Unit tests**

A new renderer test file asserts the two acceptance properties: hostile markup never reaches the DOM surface unescaped, and the allowed grammar still produces its tags.

Test file to create: `test/utils/markdown.test.ts`.

```typescript
// Every <tag emitted by renderMarkdown belongs to the fixed whitelist
// {p, ul, li, h1, h2, h3, pre, code, table, thead, tbody, tr, th, td,
//  strong, em, a, hr}. Assert via a tag-name scan of the output.
// Cases: <script>, <img onerror>, javascript: URLs, attribute-breakout
// attempts in code-fence languages, table cells, headings, inline code.
```

Test file to create: `test/utils/bundledMarkdown.test.ts`.

```typescript
// Allowlist: names outside the set reject before fetch is called.
// Fetch failures (non-ok response) propagate as errors.
// HTML-looking bodies (content-type text/html or leading <!doctype/<html)
// are rejected.
// fetch is mocked with vi.fn.
```

**Integration tests**

The Playwright smoke suite runs against `vite preview` serving `dist/`, which carries the injected CSP. Passing e2e runs are the behavioural evidence that the policy keeps the application working.

## Verification

Run the verification loop in this order. The implementation is complete only when all steps pass with zero errors and zero warnings.

- Run `npm run typecheck`
- Run `npm run lint`
- Run `npm run build`
- Run `npm test`
- Run `npm run test:e2e` against the CSP-carrying `dist/` build
- Confirm `dist/index.html` contains the CSP meta tag after build

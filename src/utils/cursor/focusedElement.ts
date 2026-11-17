// Captures and resolves the DOM element that held focus so a page reload can
// return focus to the same control. The stored reference is a landmark scope
// plus the element's index among that scope's focusable elements, with the
// element id kept as an exact fast path. Resolution validates the tag name so
// a shifted layout degrades to no restore instead of focusing the wrong
// control.

export interface FocusedElementRef {
  scope: string;
  index: number;
  tag: string;
  id: string | null;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// Landmark regions that own focusable content. The nearest ancestor-or-self
// match scopes the index, so volatile state classes never leak into the
// stored selector. Track panels and envelope panels carry per-instance type
// classes that keep each scope unique.
const FOCUS_SCOPES = [
  '.modal-dialog',
  '.track-panel.track-a',
  '.track-panel.track-b',
  '.track-panel.track-c',
  '.track-panel.track-d',
  '.track-panel.track-e',
  '.track-panel.track-f',
  '.playlist-panel',
  '.information-panel',
  '.instrument-panel',
  '.piano-keyboard',
  '.command-panel',
  '.octave-selection',
  '.header-panel',
  '.envelope-panel.mode',
  '.envelope-panel.volume',
  '.envelope-panel.shift',
  '.envelope-panel.pitch',
  '.envelope-panel.noise',
  '.dump-panel',
  '.eq-panel',
  '.position-block',
] as const;

function listScopeFocusables(scope: Element): HTMLElement[] {
  const focusables: HTMLElement[] = [];
  if (scope.matches(FOCUSABLE_SELECTOR)) {
    focusables.push(scope as HTMLElement);
  }
  scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach((el) => focusables.push(el));
  return focusables;
}

// Describe the currently focused element, or null when focus sits on the
// document body or outside every landmark scope.
export function captureFocusedElement(doc: Document): FocusedElementRef | null {
  const el = doc.activeElement;
  if (!(el instanceof HTMLElement) || el === doc.body || el === doc.documentElement) {
    return null;
  }
  for (
    let node: Element | null = el;
    node && node !== doc.body && node !== doc.documentElement;
    node = node.parentElement
  ) {
    const scopeSelector = FOCUS_SCOPES.find((selector) => node.matches(selector));
    if (scopeSelector) {
      const index = listScopeFocusables(node).indexOf(el);
      if (index === -1) {
        return null;
      }
      return { scope: scopeSelector, index, tag: el.tagName, id: el.id || null };
    }
  }
  return null;
}

// Resolve a stored reference back to a live element. The id path wins when
// present; the scope index is the fallback. Both paths verify the tag name.
export function resolveFocusedElement(doc: Document, ref: FocusedElementRef): HTMLElement | null {
  if (ref.id) {
    const byId = doc.getElementById(ref.id);
    if (byId instanceof HTMLElement && byId.tagName === ref.tag) {
      return byId;
    }
  }
  const scope = doc.querySelector(ref.scope);
  if (!scope) {
    return null;
  }
  const el = listScopeFocusables(scope)[ref.index];
  return el && el.tagName === ref.tag ? el : null;
}

// Parse and validate raw local storage content. The scope must be one of the
// known landmark selectors so resolution can never run an arbitrary selector.
export function parseFocusedElementRef(raw: string | null): FocusedElementRef | null {
  if (raw === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  if (
    typeof record.scope !== 'string' ||
    !(FOCUS_SCOPES as readonly string[]).includes(record.scope) ||
    typeof record.index !== 'number' ||
    !Number.isInteger(record.index) ||
    record.index < 0 ||
    typeof record.tag !== 'string' ||
    record.tag.length === 0 ||
    (record.id !== undefined && record.id !== null && typeof record.id !== 'string')
  ) {
    return null;
  }

  return {
    scope: record.scope,
    index: record.index,
    tag: record.tag,
    id: typeof record.id === 'string' && record.id.length > 0 ? record.id : null,
  };
}

export function serializeFocusedElementRef(ref: FocusedElementRef): string {
  return JSON.stringify(ref);
}

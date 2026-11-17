import { beforeEach, describe, expect, it } from 'vitest';
import {
  captureFocusedElement,
  parseFocusedElementRef,
  resolveFocusedElement,
  serializeFocusedElementRef,
} from '../../../src/utils/cursor/focusedElement.ts';

const buildDom = () => {
  document.body.innerHTML = `
    <div class="command-panel" tabindex="0">
      <button id="cmd-one" type="button">One</button>
      <button id="cmd-two" type="button">Two</button>
    </div>
    <div class="track-panel track-b" tabindex="0">
      <button class="cell-button" type="button">Cell</button>
    </div>
    <div class="modal-dialog settings-modal">
      <input id="modal-input" type="text" />
    </div>
    <div class="outside"><button id="outside-button" type="button">Out</button></div>
  `;
};

beforeEach(() => {
  buildDom();
});

describe('captureFocusedElement', () => {
  it('returns null when the body holds focus', () => {
    document.body.focus();
    expect(captureFocusedElement(document)).toBeNull();
  });

  it('captures a command button with its scope, index, tag, and id', () => {
    const button = document.getElementById('cmd-two') as HTMLElement;
    button.focus();
    expect(captureFocusedElement(document)).toEqual({
      scope: '.command-panel',
      index: 2,
      tag: 'BUTTON',
      id: 'cmd-two',
    });
  });

  it('captures the focusable scope element itself at index zero', () => {
    const panel = document.querySelector('.track-panel.track-b') as HTMLElement;
    panel.focus();
    expect(captureFocusedElement(document)).toEqual({
      scope: '.track-panel.track-b',
      index: 0,
      tag: 'DIV',
      id: null,
    });
  });

  it('captures a descendant inside a modal dialog', () => {
    const input = document.getElementById('modal-input') as HTMLElement;
    input.focus();
    expect(captureFocusedElement(document)).toEqual({
      scope: '.modal-dialog',
      index: 0,
      tag: 'INPUT',
      id: 'modal-input',
    });
  });

  it('returns null for elements outside every landmark scope', () => {
    const button = document.getElementById('outside-button') as HTMLElement;
    button.focus();
    expect(captureFocusedElement(document)).toBeNull();
  });
});

describe('resolveFocusedElement', () => {
  it('resolves by id when the tag still matches', () => {
    const ref = {
      scope: '.command-panel',
      index: 99,
      tag: 'BUTTON',
      id: 'cmd-one',
    };
    expect(resolveFocusedElement(document, ref)?.id).toBe('cmd-one');
  });

  it('falls back to the scope index when the id misses', () => {
    const ref = {
      scope: '.command-panel',
      index: 1,
      tag: 'BUTTON',
      id: 'removed-id',
    };
    expect(resolveFocusedElement(document, ref)?.id).toBe('cmd-one');
  });

  it('returns null when the scope is absent', () => {
    const ref = { scope: '.playlist-panel', index: 0, tag: 'DIV', id: null };
    expect(resolveFocusedElement(document, ref)).toBeNull();
  });

  it('returns null when the resolved tag differs', () => {
    const ref = { scope: '.command-panel', index: 1, tag: 'INPUT', id: null };
    expect(resolveFocusedElement(document, ref)).toBeNull();
  });
});

describe('parseFocusedElementRef', () => {
  it('round-trips a serialized reference', () => {
    const ref = { scope: '.command-panel', index: 2, tag: 'BUTTON', id: 'cmd-two' };
    expect(parseFocusedElementRef(serializeFocusedElementRef(ref))).toEqual(ref);
  });

  it('returns null for null, malformed, and non-object input', () => {
    expect(parseFocusedElementRef(null)).toBeNull();
    expect(parseFocusedElementRef('not json')).toBeNull();
    expect(parseFocusedElementRef('5')).toBeNull();
  });

  it('rejects an unknown scope selector', () => {
    const raw = JSON.stringify({ scope: 'body > div', index: 0, tag: 'DIV', id: null });
    expect(parseFocusedElementRef(raw)).toBeNull();
  });

  it('rejects a negative or non-integer index', () => {
    expect(
      parseFocusedElementRef(
        JSON.stringify({ scope: '.command-panel', index: -1, tag: 'BUTTON', id: null }),
      ),
    ).toBeNull();
    expect(
      parseFocusedElementRef(
        JSON.stringify({ scope: '.command-panel', index: 1.5, tag: 'BUTTON', id: null }),
      ),
    ).toBeNull();
  });

  it('normalizes a missing id to null', () => {
    const raw = JSON.stringify({ scope: '.command-panel', index: 0, tag: 'BUTTON' });
    expect(parseFocusedElementRef(raw)).toEqual({
      scope: '.command-panel',
      index: 0,
      tag: 'BUTTON',
      id: null,
    });
  });
});

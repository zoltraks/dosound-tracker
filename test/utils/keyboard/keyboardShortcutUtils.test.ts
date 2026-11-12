// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  isModifierChord,
  matchKeyboardShortcut,
} from '../../../src/utils/keyboard/keyboardShortcutUtils.ts';

describe('keyboardShortcutUtils', () => {
  it('matches plain shortcuts', () => {
    expect(matchKeyboardShortcut('TAB', false, false, false)).toEqual({
      shortcut: 'TAB',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('ESCAPE', false, false, false)).toEqual({
      shortcut: 'ESC',
      preventDefault: false,
    });
    expect(matchKeyboardShortcut('ARROWUP', false, false, false)).toEqual({
      shortcut: 'ARROW_UP',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('ARROWDOWN', false, false, false)).toEqual({
      shortcut: 'ARROW_DOWN',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('ARROWLEFT', false, false, false)).toEqual({
      shortcut: 'ARROW_LEFT',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('ARROWRIGHT', false, false, false)).toEqual({
      shortcut: 'ARROW_RIGHT',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut(' ', false, false, false)).toEqual({
      shortcut: 'SPACE',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('F2', false, false, false)).toEqual({
      shortcut: 'F2',
      preventDefault: false,
    });
  });

  it('matches shift shortcuts', () => {
    expect(matchKeyboardShortcut('TAB', false, true, false)).toEqual({
      shortcut: 'SHIFT+TAB',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut(' ', false, true, false)).toEqual({
      shortcut: 'SHIFT+SPACE',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('X', false, true, false)).toBeNull();
  });

  it('matches ctrl shortcuts', () => {
    expect(matchKeyboardShortcut('N', true, false, false)).toEqual({
      shortcut: 'CTRL+N',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('O', true, false, false)).toEqual({
      shortcut: 'CTRL+O',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('S', true, false, false)).toEqual({
      shortcut: 'CTRL+S',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('I', true, false, false)).toEqual({
      shortcut: 'CTRL+I',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('-', true, false, false)).toEqual({
      shortcut: 'CTRL+-',
      preventDefault: false,
    });
    expect(matchKeyboardShortcut('+', true, false, false)).toEqual({
      shortcut: 'CTRL+PLUS',
      preventDefault: false,
    });
    expect(matchKeyboardShortcut('=', true, false, false)).toEqual({
      shortcut: 'CTRL+PLUS',
      preventDefault: false,
    });
    expect(matchKeyboardShortcut(' ', true, false, false)).toEqual({
      shortcut: 'CTRL+SPACE',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('Z', true, false, false)).toEqual({
      shortcut: 'CTRL+Z',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('Y', true, false, false)).toEqual({
      shortcut: 'CTRL+Y',
      preventDefault: true,
    });
  });

  it('matches the shift page chords', () => {
    expect(matchKeyboardShortcut('PAGEUP', false, true, false)).toEqual({
      shortcut: 'SHIFT+PAGEUP',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('PAGEDOWN', false, true, false)).toEqual({
      shortcut: 'SHIFT+PAGEDOWN',
      preventDefault: true,
    });
  });

  it('does not match the page keys without shift', () => {
    expect(matchKeyboardShortcut('PAGEUP', false, false, false)).toBeNull();
    expect(matchKeyboardShortcut('PAGEDOWN', true, false, false)).toBeNull();
  });

  it('matches ctrl+shift shortcuts', () => {
    expect(matchKeyboardShortcut('Z', true, true, false)).toEqual({
      shortcut: 'CTRL+SHIFT+Z',
      preventDefault: true,
    });
  });

  it('matches alt shortcuts', () => {
    expect(matchKeyboardShortcut('1', false, false, true)).toEqual({
      shortcut: 'ALT+1',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('2', false, false, true)).toEqual({
      shortcut: 'ALT+2',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('3', false, false, true)).toEqual({
      shortcut: 'ALT+3',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('5', false, false, true)).toEqual({
      shortcut: 'ALT+5',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('6', false, false, true)).toEqual({
      shortcut: 'ALT+6',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('8', false, false, true)).toEqual({
      shortcut: 'ALT+8',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('X', false, false, true)).toBeNull();
  });

  it('does not match alt shortcuts when ctrl or shift is held', () => {
    expect(matchKeyboardShortcut('1', true, false, true)).toBeNull();
    expect(matchKeyboardShortcut('5', true, false, true)).toBeNull();
    expect(matchKeyboardShortcut('8', false, true, true)).toBeNull();
  });

  it('returns null for unsupported shortcuts', () => {
    expect(matchKeyboardShortcut('X', false, false, false)).toBeNull();
    expect(matchKeyboardShortcut('X', true, true, false)).toBeNull();
    expect(matchKeyboardShortcut('TAB', true, true, false)).toBeNull();
    expect(matchKeyboardShortcut('1', true, false, false)).toBeNull();
    expect(matchKeyboardShortcut('5', true, false, false)).toBeNull();
  });
});

describe('isModifierChord', () => {
  it('reports ctrl, meta, and alt as modifier chords', () => {
    expect(isModifierChord({ ctrlKey: true, metaKey: false, altKey: false })).toBe(true);
    expect(isModifierChord({ ctrlKey: false, metaKey: true, altKey: false })).toBe(true);
    expect(isModifierChord({ ctrlKey: false, metaKey: false, altKey: true })).toBe(true);
    expect(isModifierChord({ ctrlKey: true, metaKey: false, altKey: true })).toBe(true);
  });

  it('reports a bare key as no chord', () => {
    expect(isModifierChord({ ctrlKey: false, metaKey: false, altKey: false })).toBe(false);
  });
});

describe('track clipboard shortcuts', () => {
  it('matches the ctrl clipboard chords', () => {
    expect(matchKeyboardShortcut('C', true, false, false)).toEqual({
      shortcut: 'CTRL+C',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('X', true, false, false)).toEqual({
      shortcut: 'CTRL+X',
      preventDefault: true,
    });
    expect(matchKeyboardShortcut('V', true, false, false)).toEqual({
      shortcut: 'CTRL+V',
      preventDefault: true,
    });
  });

  it('does not match the clipboard chords without ctrl', () => {
    expect(matchKeyboardShortcut('C', false, false, false)).toBeNull();
    expect(matchKeyboardShortcut('V', false, true, false)).toBeNull();
  });
});

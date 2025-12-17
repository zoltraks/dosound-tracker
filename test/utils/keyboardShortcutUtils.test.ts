import { describe, expect, it } from 'vitest';
import { matchKeyboardShortcut } from '../../src/utils/keyboardShortcutUtils';

describe('keyboardShortcutUtils', () => {
  it('matches plain shortcuts', () => {
    expect(matchKeyboardShortcut('TAB', false, false)).toEqual({ shortcut: 'TAB', preventDefault: true });
    expect(matchKeyboardShortcut('ESCAPE', false, false)).toEqual({ shortcut: 'ESC', preventDefault: false });
    expect(matchKeyboardShortcut('ARROWUP', false, false)).toEqual({ shortcut: 'ARROW_UP', preventDefault: true });
    expect(matchKeyboardShortcut('ARROWDOWN', false, false)).toEqual({ shortcut: 'ARROW_DOWN', preventDefault: true });
    expect(matchKeyboardShortcut('ARROWLEFT', false, false)).toEqual({ shortcut: 'ARROW_LEFT', preventDefault: true });
    expect(matchKeyboardShortcut('ARROWRIGHT', false, false)).toEqual({ shortcut: 'ARROW_RIGHT', preventDefault: true });
    expect(matchKeyboardShortcut(' ', false, false)).toEqual({ shortcut: 'SPACE', preventDefault: true });
    expect(matchKeyboardShortcut('F2', false, false)).toEqual({ shortcut: 'F2', preventDefault: false });
  });

  it('matches shift shortcuts', () => {
    expect(matchKeyboardShortcut('TAB', false, true)).toEqual({ shortcut: 'SHIFT+TAB', preventDefault: true });
    expect(matchKeyboardShortcut('X', false, true)).toBeNull();
  });

  it('matches ctrl shortcuts', () => {
    expect(matchKeyboardShortcut('N', true, false)).toEqual({ shortcut: 'CTRL+N', preventDefault: false });
    expect(matchKeyboardShortcut('O', true, false)).toEqual({ shortcut: 'CTRL+O', preventDefault: false });
    expect(matchKeyboardShortcut('S', true, false)).toEqual({ shortcut: 'CTRL+S', preventDefault: false });
    expect(matchKeyboardShortcut('I', true, false)).toEqual({ shortcut: 'CTRL+I', preventDefault: false });
    expect(matchKeyboardShortcut('5', true, false)).toEqual({ shortcut: 'CTRL+5', preventDefault: false });
    expect(matchKeyboardShortcut('6', true, false)).toEqual({ shortcut: 'CTRL+6', preventDefault: false });
    expect(matchKeyboardShortcut('8', true, false)).toEqual({ shortcut: 'CTRL+8', preventDefault: false });
    expect(matchKeyboardShortcut('-', true, false)).toEqual({ shortcut: 'CTRL+-', preventDefault: false });
    expect(matchKeyboardShortcut('+', true, false)).toEqual({ shortcut: 'CTRL+PLUS', preventDefault: false });
    expect(matchKeyboardShortcut('=', true, false)).toEqual({ shortcut: 'CTRL+PLUS', preventDefault: false });
    expect(matchKeyboardShortcut(' ', true, false)).toEqual({ shortcut: 'CTRL+SPACE', preventDefault: true });
  });

  it('returns null for unsupported shortcuts', () => {
    expect(matchKeyboardShortcut('X', false, false)).toBeNull();
    expect(matchKeyboardShortcut('X', true, false)).toBeNull();
    expect(matchKeyboardShortcut('TAB', true, true)).toBeNull();
  });
});

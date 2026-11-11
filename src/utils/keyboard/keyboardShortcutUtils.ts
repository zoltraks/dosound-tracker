import type { KeyboardShortcut } from '../../constants/navigation.ts';

export interface KeyboardShortcutMatch {
  shortcut: KeyboardShortcut;
  preventDefault: boolean;
}

export const isModifierChord = (event: {
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}): boolean => event.ctrlKey || event.metaKey || event.altKey;

export function matchKeyboardShortcut(
  keyUpper: string,
  ctrl: boolean,
  shift: boolean,
  alt: boolean,
): KeyboardShortcutMatch | null {
  let shortcut: KeyboardShortcut | null = null;
  let preventDefault = false;

  if (alt && !ctrl && !shift) {
    switch (keyUpper) {
      case '1':
        return { shortcut: 'ALT+1', preventDefault: true };
      case '2':
        return { shortcut: 'ALT+2', preventDefault: true };
      case '3':
        return { shortcut: 'ALT+3', preventDefault: true };
      case '5':
        return { shortcut: 'ALT+5', preventDefault: true };
      case '6':
        return { shortcut: 'ALT+6', preventDefault: true };
      case '8':
        return { shortcut: 'ALT+8', preventDefault: true };
    }
    return null;
  }

  if (ctrl && shift) {
    if (keyUpper === 'Z') {
      return { shortcut: 'CTRL+SHIFT+Z', preventDefault: true };
    }
    return null;
  }

  if (ctrl) {
    switch (keyUpper) {
      case 'Z':
        shortcut = 'CTRL+Z';
        preventDefault = true;
        break;
      case 'Y':
        shortcut = 'CTRL+Y';
        preventDefault = true;
        break;
      case 'N':
        shortcut = 'CTRL+N';
        preventDefault = true;
        break;
      case 'O':
        shortcut = 'CTRL+O';
        preventDefault = true;
        break;
      case 'S':
        shortcut = 'CTRL+S';
        preventDefault = true;
        break;
      case 'I':
        shortcut = 'CTRL+I';
        preventDefault = true;
        break;
      case ' ':
        preventDefault = true;
        shortcut = 'CTRL+SPACE';
        break;
      case '-':
        shortcut = 'CTRL+-';
        break;
      case '+':
      case '=':
        shortcut = 'CTRL+PLUS';
        break;
    }

    return shortcut ? { shortcut, preventDefault } : null;
  }

  if (shift) {
    if (keyUpper === 'TAB') {
      return { shortcut: 'SHIFT+TAB', preventDefault: true };
    }
    if (keyUpper === ' ') {
      return { shortcut: 'SHIFT+SPACE', preventDefault: true };
    }

    return null;
  }

  switch (keyUpper) {
    case 'TAB':
      return { shortcut: 'TAB', preventDefault: true };
    case 'ESCAPE':
      return { shortcut: 'ESC', preventDefault: false };
    case 'ARROWUP':
      return { shortcut: 'ARROW_UP', preventDefault: true };
    case 'ARROWDOWN':
      return { shortcut: 'ARROW_DOWN', preventDefault: true };
    case 'ARROWLEFT':
      return { shortcut: 'ARROW_LEFT', preventDefault: true };
    case 'ARROWRIGHT':
      return { shortcut: 'ARROW_RIGHT', preventDefault: true };
    case ' ':
      return { shortcut: 'SPACE', preventDefault: true };
    case 'F2':
      return { shortcut: 'F2', preventDefault: false };
  }

  return null;
}

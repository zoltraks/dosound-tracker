import type { KeyboardShortcut } from '../constants/navigation';

export interface KeyboardShortcutMatch {
  shortcut: KeyboardShortcut;
  preventDefault: boolean;
}

export function matchKeyboardShortcut(
  keyUpper: string,
  ctrl: boolean,
  shift: boolean
): KeyboardShortcutMatch | null {
  let shortcut: KeyboardShortcut | null = null;
  let preventDefault = false;

  if (ctrl && shift) {
    return null;
  }

  if (ctrl) {
    switch (keyUpper) {
      case 'N':
        shortcut = 'CTRL+N';
        break;
      case 'O':
        shortcut = 'CTRL+O';
        break;
      case 'S':
        shortcut = 'CTRL+S';
        break;
      case 'I':
        shortcut = 'CTRL+I';
        break;
      case '5':
        shortcut = 'CTRL+5';
        break;
      case '6':
        shortcut = 'CTRL+6';
        break;
      case '8':
        shortcut = 'CTRL+8';
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

export const NAVIGATION_ORDER = [
  'piano',
  'octave',
  'commands',
  'trackA',
  'trackB',
  'trackC',
  'mode',
  'volume',
  'shift',
  'pitch',
  'noise',
  'songInfo',
  'playlist',
  'instrumentList',
] as const;

export type NavigationSection = (typeof NAVIGATION_ORDER)[number];

export const KEYBOARD_SHORTCUTS = {
  // Navigation
  TAB: 'nextSection',
  'SHIFT+TAB': 'previousSection',
  ARROW_UP: 'previousLine',
  ARROW_DOWN: 'nextLine',
  ARROW_LEFT: 'previousColumn',
  ARROW_RIGHT: 'nextColumn',
  'ALT+1': 'focusTrackA',
  'ALT+2': 'focusTrackB',
  'ALT+3': 'focusTrackC',
  'CTRL+SPACE': 'togglePianoFocus',
  'SHIFT+PAGEUP': 'previousSongLine',
  'SHIFT+PAGEDOWN': 'nextSongLine',

  // Editing
  SPACE: 'clearPosition',
  'SHIFT+SPACE': 'noteOff',
  'CTRL+-': 'previousInstrument',
  'CTRL+PLUS': 'nextInstrument',

  // Track clipboard
  'CTRL+C': 'copyTrack',
  'CTRL+X': 'cutTrack',
  'CTRL+V': 'pasteTrack',

  // History
  'CTRL+Z': 'undo',
  'CTRL+Y': 'redo',
  'CTRL+SHIFT+Z': 'redo',

  // Playback
  F2: 'playLine',
  'ALT+5': 'playLineFromStart',
  'ALT+6': 'playLine',
  'ALT+8': 'stopPlayback',
  ESC: 'stopPlayback',

  // File operations
  'CTRL+N': 'newSong',
  'CTRL+O': 'loadSong',
  'CTRL+S': 'saveSong',
  'CTRL+I': 'newInstrument',
} as const;

export type KeyboardShortcut = keyof typeof KEYBOARD_SHORTCUTS;

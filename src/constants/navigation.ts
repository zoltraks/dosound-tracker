export const NAVIGATION_ORDER = [
  'piano',
  'octave',
  'commands',
  'trackA',
  'trackB', 
  'trackC',
  'mode',
  'volume',
  'arpeggio',
  'pitch',
  'noise',
  'songInfo',
  'playlist',
  'instrumentList'
] as const;

export type NavigationSection = typeof NAVIGATION_ORDER[number];

export const KEYBOARD_SHORTCUTS = {
  // Navigation
  'TAB': 'nextSection',
  'SHIFT+TAB': 'previousSection',
  'ARROW_UP': 'previousLine',
  'ARROW_DOWN': 'nextLine',
  'ARROW_LEFT': 'previousColumn',
  'ARROW_RIGHT': 'nextColumn',
  
  // Editing
  'SPACE': 'clearPosition',
  'CTRL+SPACE': 'noteOff',
  'CTRL+-': 'previousInstrument',
  'CTRL+PLUS': 'nextInstrument',
  
  // Playback
  'F1': 'playSong',
  'F2': 'playPattern',
  'F3': 'playInstrument',
  'F4': 'toggleDosoundMode',
  'CTRL+5': 'playPatternFromStart',
  'CTRL+6': 'playPattern',
  'CTRL+8': 'stopPlayback',
  'ESC': 'stopPlayback',
  
  // File operations
  'CTRL+N': 'newSong',
  'CTRL+O': 'loadSong',
  'CTRL+S': 'saveSong',
  'CTRL+I': 'newInstrument',
} as const;

export type KeyboardShortcut = keyof typeof KEYBOARD_SHORTCUTS;

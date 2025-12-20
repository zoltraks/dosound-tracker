export const INFO_MODAL_TITLES = {
  songError: 'Song Load Error',
  instrumentError: 'Instrument Load Error',
  trackClipboardError: 'Track Clipboard Error',
  optimizeSummary: 'Optimization Summary',
  soundExportSummary: 'Export Summary',
  dumpExportSummary: 'Dump Export Summary',
  transposeSummary: 'Transpose Summary',
  renumberSummary: 'Renumber Summary',
  instrumentOperationSummary: 'Instrument Operation',
  midiLoadError: 'MIDI Config Error',
  midiCopySummary: 'MIDI Monitor',
} as const;

export const CONFIRM_MODAL_TEXT = {
  newSong: {
    title: 'Create new song?',
    message: 'Current song data will be lost.\n\nContinue?',
  },
  optimize: {
    title: 'Optimize song?',
    message:
      'Optimize song by removing unused patterns and instruments and trimming pattern data beyond the current length.\n\nContinue?',
  },
  renumber: {
    title: 'Renumber song?',
    message:
      'Renumber all patterns according to their order of appearance in the playlist (then any hidden patterns), and renumber all instruments alphabetically by name.\n\nThis will update all references in the playlist and patterns.\n\nContinue?',
  },
  reset: {
    title: 'Reset application?',
    message:
      'All saved data will be permanently deleted and the application will reload to default state.\n\nThis action cannot be undone.\n\nContinue with reset?',
    confirmLabel: 'Reset',
  },
  quit: {
    title: 'Quit without saving?',
    message:
      'Current song changes have not been saved.\n\nIf you quit now, any unsaved changes will be lost.\n\nDo you still want to quit?',
  },
} as const;

export const DEBUG_MODE_INFO_MESSAGE =
  'Debug mode is now enabled.\n\n' +
  'In this mode the tracker will output additional logging to the browser console.\n' +
  'This extra logging may cause small delays or timing jitter in song playback due to performance overhead.\n\n' +
  'For normal composing and playback, you can turn debug mode off again.';

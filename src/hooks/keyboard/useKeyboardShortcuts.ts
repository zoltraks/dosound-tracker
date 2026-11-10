import { useEffect } from 'react';

export type GlobalShortcutName =
  | 'playSong'
  | 'playLineFromStart'
  | 'playLine'
  | 'stopPlayback'
  | 'newSong'
  | 'loadSong'
  | 'saveSong'
  | 'newInstrument';

interface UseKeyboardShortcutsArgs {
  setGlobalShortcut: (name: GlobalShortcutName, handler: () => void) => void;
  handleStartSong: () => void;
  handleStartLineFromBeginning: () => void;
  handleStartLine: () => void;
  handleStop: () => void;
  handleNewSong: () => void;
  handleLoadSong: () => void;
  handleSaveSong: () => void;
  handleNewInstrument: () => void;
}

export function useKeyboardShortcuts({
  setGlobalShortcut,
  handleStartSong,
  handleStartLineFromBeginning,
  handleStartLine,
  handleStop,
  handleNewSong,
  handleLoadSong,
  handleSaveSong,
  handleNewInstrument,
}: UseKeyboardShortcutsArgs): void {
  useEffect(() => {
    setGlobalShortcut('playSong', handleStartSong);
    setGlobalShortcut('playLineFromStart', handleStartLineFromBeginning);
    setGlobalShortcut('playLine', handleStartLine);
    setGlobalShortcut('stopPlayback', handleStop);
    setGlobalShortcut('newSong', handleNewSong);
    setGlobalShortcut('loadSong', handleLoadSong);
    setGlobalShortcut('saveSong', handleSaveSong);
    setGlobalShortcut('newInstrument', handleNewInstrument);
  }, [
    setGlobalShortcut,
    handleStartSong,
    handleStartLineFromBeginning,
    handleStartLine,
    handleStop,
    handleNewSong,
    handleLoadSong,
    handleSaveSong,
    handleNewInstrument,
  ]);
}

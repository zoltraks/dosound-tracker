import { useEffect } from 'react';

export type GlobalShortcutName =
  | 'playSong'
  | 'playLineFromStart'
  | 'playLine'
  | 'stopPlayback'
  | 'newSong'
  | 'loadSong'
  | 'saveSong'
  | 'newInstrument'
  | 'undo'
  | 'redo'
  | 'copyTrack'
  | 'cutTrack'
  | 'pasteTrack'
  | 'previousSongLine'
  | 'nextSongLine';

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
  handleUndo: () => void;
  handleRedo: () => void;
  handleCopyTrack: () => void;
  handleCutTrack: () => void;
  handlePasteTrack: () => void;
  handleNavigateSongLine: (delta: number) => void;
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
  handleUndo,
  handleRedo,
  handleCopyTrack,
  handleCutTrack,
  handlePasteTrack,
  handleNavigateSongLine,
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
    setGlobalShortcut('undo', handleUndo);
    setGlobalShortcut('redo', handleRedo);
    setGlobalShortcut('copyTrack', handleCopyTrack);
    setGlobalShortcut('cutTrack', handleCutTrack);
    setGlobalShortcut('pasteTrack', handlePasteTrack);
    setGlobalShortcut('previousSongLine', () => handleNavigateSongLine(-1));
    setGlobalShortcut('nextSongLine', () => handleNavigateSongLine(1));
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
    handleUndo,
    handleRedo,
    handleCopyTrack,
    handleCutTrack,
    handlePasteTrack,
    handleNavigateSongLine,
  ]);
}

import { useEffect } from 'react';

export type GlobalShortcutName =
  | 'playSong'
  | 'playPatternFromStart'
  | 'playPattern'
  | 'stopPlayback';

interface UseKeyboardShortcutsArgs {
  setGlobalShortcut: (name: GlobalShortcutName, handler: () => void) => void;
  handleStartSong: () => void;
  handleStartPatternFromBeginning: () => void;
  handleStartPattern: () => void;
  handleStop: () => void;
}

export function useKeyboardShortcuts({
  setGlobalShortcut,
  handleStartSong,
  handleStartPatternFromBeginning,
  handleStartPattern,
  handleStop,
}: UseKeyboardShortcutsArgs): void {
  useEffect(() => {
    setGlobalShortcut('playSong', handleStartSong);
    setGlobalShortcut('playPatternFromStart', handleStartPatternFromBeginning);
    setGlobalShortcut('playPattern', handleStartPattern);
    setGlobalShortcut('stopPlayback', handleStop);
  }, [setGlobalShortcut, handleStartSong, handleStartPatternFromBeginning, handleStartPattern, handleStop]);
}

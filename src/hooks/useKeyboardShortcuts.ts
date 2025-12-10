import { useEffect } from 'react';

export type GlobalShortcutName =
  | 'playSong'
  | 'playLineFromStart'
  | 'playLine'
  | 'stopPlayback';

interface UseKeyboardShortcutsArgs {
  setGlobalShortcut: (name: GlobalShortcutName, handler: () => void) => void;
  handleStartSong: () => void;
  handleStartLineFromBeginning: () => void;
  handleStartLine: () => void;
  handleStop: () => void;
}

export function useKeyboardShortcuts({
  setGlobalShortcut,
  handleStartSong,
  handleStartLineFromBeginning,
  handleStartLine,
  handleStop,
}: UseKeyboardShortcutsArgs): void {
  useEffect(() => {
    setGlobalShortcut('playSong', handleStartSong);
    setGlobalShortcut('playLineFromStart', handleStartLineFromBeginning);
    setGlobalShortcut('playLine', handleStartLine);
    setGlobalShortcut('stopPlayback', handleStop);
  }, [setGlobalShortcut, handleStartSong, handleStartLineFromBeginning, handleStartLine, handleStop]);
}

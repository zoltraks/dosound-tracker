import type { UiStore } from './useUiStore.ts';
import { useUiStore } from './useUiStore.ts';

export interface UseAppUiStateResult {
  currentOctave: number;
  sharedCurrentLine: number;
  channelMutes: [boolean, boolean, boolean];
  setCurrentOctave: (octave: number) => void;
  setSharedCurrentLine: (line: number) => void;
  setChannelMutes: (mutes: [boolean, boolean, boolean]) => void;
  toggleChannelMute: (index: number) => void;
}

/**
 * Selects the uiStore surface the composition root wires: the three shared
 * members plus their actions. Bundles the member-wise selector subscriptions
 * behind one call so `App.tsx` reads the store slice as a single binding.
 */
export function useAppUiState(): UseAppUiStateResult {
  const currentOctave = useUiStore((state: UiStore) => state.currentOctave);
  const sharedCurrentLine = useUiStore((state: UiStore) => state.sharedCurrentLine);
  const channelMutes = useUiStore((state: UiStore) => state.channelMutes);
  const setCurrentOctave = useUiStore((state: UiStore) => state.setCurrentOctave);
  const setSharedCurrentLine = useUiStore((state: UiStore) => state.setSharedCurrentLine);
  const setChannelMutes = useUiStore((state: UiStore) => state.setChannelMutes);
  const toggleChannelMute = useUiStore((state: UiStore) => state.toggleChannelMute);

  return {
    currentOctave,
    sharedCurrentLine,
    channelMutes,
    setCurrentOctave,
    setSharedCurrentLine,
    setChannelMutes,
    toggleChannelMute,
  };
}

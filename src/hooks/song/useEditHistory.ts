import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Instrument, Song } from '../../synth/SoundDriver.ts';
import {
  scheduleJsonSave,
  clearScheduledSave,
  type ScheduledSaveHandle,
} from '../storage/useStorage.ts';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import {
  recordEdit,
  takeUndoSnapshot,
  takeRedoSnapshot,
  clearEditHistory,
  serializeEditHistory,
  type EditHistory,
  type EditPosition,
  type EditSnapshot,
} from '../../utils/song/editHistory.ts';
import { loadPersistedEditHistory } from '../../utils/storage/editHistoryStorage.ts';

const EDIT_HISTORY_STORAGE_KEY = StorageKeys.EDIT_HISTORY;

// Position bridge into the sequencer domain. App.tsx wires it so a
// snapshot records the cursor position at edit time and a restore applies
// it back, without the hook holding a playback dependency.
export interface EditPositionBridge {
  getPosition?: () => EditPosition | undefined;
  applyPosition?: (position: EditPosition) => void;
}

export interface UseEditHistoryParams {
  currentSong: Song;
  currentInstrument: Instrument;
  setCurrentSong: Dispatch<SetStateAction<Song>>;
  setCurrentInstrument: Dispatch<SetStateAction<Instrument>>;
  setIsSongDirty: Dispatch<SetStateAction<boolean>>;
  positionBridge?: EditPositionBridge;
}

// Bounded undo/redo history for composition edits. The stacks stay in a ref
// so recording adds no render-time cost on the audio path, and every stack
// mutation routes through commitHistory for the size flags and the
// scheduled persistence write.
export const useEditHistory = ({
  currentSong,
  currentInstrument,
  setCurrentSong,
  setCurrentInstrument,
  setIsSongDirty,
  positionBridge,
}: UseEditHistoryParams) => {
  const historySaveTimeoutRef = useRef<ScheduledSaveHandle | null>(null);

  const [initialEditHistory] = useState(loadPersistedEditHistory);
  const historyRef = useRef<EditHistory<EditSnapshot>>(initialEditHistory);
  const [historySize, setHistorySize] = useState({
    undo: initialEditHistory.undo.length,
    redo: initialEditHistory.redo.length,
  });

  // Every stack mutation routes through here: refresh the size flags and
  // persist the serialized stacks on the scheduled-save path.
  const commitHistory = useCallback(() => {
    setHistorySize({
      undo: historyRef.current.undo.length,
      redo: historyRef.current.redo.length,
    });
    scheduleJsonSave(
      EDIT_HISTORY_STORAGE_KEY,
      serializeEditHistory(historyRef.current),
      historySaveTimeoutRef,
    );
  }, []);

  // Lifecycle operations destroy the history instead of recording it.
  const clearHistory = useCallback(() => {
    clearEditHistory(historyRef.current);
    commitHistory();
  }, [commitHistory]);

  // The bridge object is rebuilt by the caller on every render - the
  // latest copy lives in a ref so the history callbacks stay referentially
  // stable and add no render-time cost on the audio path.
  const positionBridgeRef = useRef(positionBridge);
  useEffect(() => {
    positionBridgeRef.current = positionBridge;
  });

  const snapshotCurrent = useCallback(
    (): EditSnapshot => ({
      song: currentSong,
      instrument: currentInstrument,
      position: positionBridgeRef.current?.getPosition?.(),
    }),
    [currentSong, currentInstrument],
  );

  // Recording boundary: every recorded mutator snapshots the live pair
  // through this helper before applying its change. The stacks stay in a
  // ref, so history work adds no render-time cost on the audio path.
  const recordHistory = useCallback(
    (coalesceKey?: string) => {
      recordEdit(historyRef.current, snapshotCurrent(), coalesceKey);
      commitHistory();
    },
    [snapshotCurrent, commitHistory],
  );

  const undo = useCallback(() => {
    const snapshot = takeUndoSnapshot(historyRef.current, snapshotCurrent());
    if (snapshot === null) {
      return;
    }
    setCurrentSong(snapshot.song);
    setCurrentInstrument(snapshot.instrument);
    if (snapshot.position) {
      positionBridgeRef.current?.applyPosition?.(snapshot.position);
    }
    setIsSongDirty(true);
    commitHistory();
  }, [snapshotCurrent, commitHistory, setCurrentSong, setCurrentInstrument, setIsSongDirty]);

  const redo = useCallback(() => {
    const snapshot = takeRedoSnapshot(historyRef.current, snapshotCurrent());
    if (snapshot === null) {
      return;
    }
    setCurrentSong(snapshot.song);
    setCurrentInstrument(snapshot.instrument);
    if (snapshot.position) {
      positionBridgeRef.current?.applyPosition?.(snapshot.position);
    }
    setIsSongDirty(true);
    commitHistory();
  }, [snapshotCurrent, commitHistory, setCurrentSong, setCurrentInstrument, setIsSongDirty]);

  useEffect(() => {
    return () => {
      clearScheduledSave(historySaveTimeoutRef);
    };
  }, []);

  return {
    recordHistory,
    clearHistory,
    undo,
    redo,
    canUndo: historySize.undo > 0,
    canRedo: historySize.redo > 0,
  };
};

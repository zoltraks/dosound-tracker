import { useState, useRef, useCallback, useEffect } from 'react';
import type { Instrument, Song, Pattern, Step } from '../../synth/SoundDriver.ts';
import { ENVELOPE_LENGTH, PATTERN_LENGTH } from '../../constants/music.ts';
import { MAX_IMPORT_BYTES } from '../../constants/import.ts';
import {
  DEFAULT_BASE_KEY,
  DEFAULT_SONG_TITLE,
  DEFAULT_SONG_AUTHOR,
  parseSongFromYaml,
  type SongParseMetadata,
} from '../../utils/song/songParser.ts';
import { DEFAULT_SONG_CHIP, DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../../constants/song.ts';
import { buildSongYamlForExport } from '../../utils/song/songIO.ts';
import {
  buildInstrumentYamlForExport,
  parseInstrumentFromText,
} from '../../utils/instrument/instrumentIO.ts';
import { downloadFile } from '../../utils/file/fileOperations.ts';
import { logger } from '../../utils/log/logger.ts';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import { readFlag } from '../../utils/settings/settingsState.ts';
import { normalizeInstrumentId } from '../../utils/instrument/instrumentSelection.ts';
import {
  asInstrumentId,
  asPatternId,
  asPlaylistPatternId,
  type PatternId,
} from '../../types/branded.ts';
import {
  SONG_STORAGE_KEY,
  loadInitialSong,
  normalizeRestoredSong,
  optimizeSongData,
  renumberSongData,
  type StoredSongForMigration,
} from './useSongManagement.ts';
import {
  createNewInstrumentForSong,
  updateInstrumentInSong,
  applyLoadedInstrumentToSong,
} from '../instrument/useInstrumentManagement.ts';
import { createPatternForSong, addPlaylistEntryToSong } from './usePatternManagement.ts';
import { createEmptyInstrument } from '../../utils/instrument/instrumentPanelUtils.ts';
import type { PlaylistEntry } from '../../types/playlist.ts';
import {
  scheduleJsonSave,
  clearScheduledSave,
  type ScheduledSaveHandle,
} from '../storage/useStorage.ts';
import {
  readMirroredSnapshot,
  requestPersistentStorage,
} from '../../utils/storage/persistenceMirror.ts';
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

const INSTRUMENT_STORAGE_KEY = StorageKeys.INSTRUMENT;
const EDIT_HISTORY_STORAGE_KEY = StorageKeys.EDIT_HISTORY;

export type PendingSongImport = {
  song: Song;
  metadata: SongParseMetadata;
};

export interface UpdateSongOptions {
  record?: boolean;
  coalesceKey?: string;
}

// Position bridge into the sequencer domain. App.tsx wires it so a
// snapshot records the cursor position at edit time and a restore applies
// it back, without the hook holding a playback dependency.
export interface EditPositionBridge {
  getPosition?: () => EditPosition | undefined;
  applyPosition?: (position: EditPosition) => void;
}

const shouldWarnForSongConfiguration = (metadata: SongParseMetadata | null): boolean => {
  if (!metadata) {
    return false;
  }

  const chipWarning = metadata.hasChipField && !metadata.isChipSupported;
  const frameWarning = metadata.hasFrameField && !metadata.isFrameSupported;

  return chipWarning || frameWarning;
};

export const useDataManagement = (positionBridge?: EditPositionBridge) => {
  const [currentSong, setCurrentSong] = useState<Song>(() => loadInitialSong());

  const [currentInstrument, setCurrentInstrument] = useState<Instrument>(() => {
    // The persisted selection is restored here so it survives the mount-time
    // instrument sync below - a later effect restore races the deferred sync
    // write and can lose the selection depending on flush ordering.
    const storedInstrumentId = readFlag(StorageKeys.RESTORE_CURSOR, true)
      ? localStorage.getItem(StorageKeys.CURRENT_INSTRUMENT)
      : null;
    const restored = storedInstrumentId
      ? currentSong.instrument.find((inst) => inst.id === storedInstrumentId)
      : undefined;
    if (restored) {
      return restored;
    }

    const songDefault = currentSong.instrument.find(
      (inst) => normalizeInstrumentId(inst?.id) === '00',
    );
    if (songDefault) {
      return songDefault;
    }

    return {
      id: asInstrumentId('00'),
      name: 'Default Instrument',
      volume: Array(32).fill(0x0f),
      shift: [
        0,
        4,
        8,
        12,
        16,
        20,
        24,
        20,
        16,
        12,
        8,
        4,
        0,
        -4,
        -8,
        -12,
        -16,
        -20,
        -24,
        -20,
        -16,
        -12,
        -8,
        -4,
        ...Array(8).fill(0),
      ],
      pitch: Array(32).fill(0),
      noise: Array(32).fill(0),
      mode: Array(32).fill(0),
      base: DEFAULT_BASE_KEY,
      sustain: null,
    };
  });

  const [songError, setSongError] = useState('');
  const [instrumentError, setInstrumentError] = useState('');
  const [isSongDirty, setIsSongDirty] = useState(false);
  const [pendingSongImport, setPendingSongImport] = useState<PendingSongImport | null>(null);
  const [mirrorRestoreNotice, setMirrorRestoreNotice] = useState<string | null>(null);

  const songSaveTimeoutRef = useRef<ScheduledSaveHandle | null>(null);
  const instrumentSaveTimeoutRef = useRef<ScheduledSaveHandle | null>(null);
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
  }, [snapshotCurrent, commitHistory]);

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
  }, [snapshotCurrent, commitHistory]);

  // Sync currentInstrument with song's instruments when song changes
  useEffect(() => {
    const currentId = normalizeInstrumentId(currentInstrument.id);
    const songInstrument =
      currentSong.instrument.find((inst) => inst === currentInstrument) ??
      currentSong.instrument.find((inst) => normalizeInstrumentId(inst?.id) === currentId);
    if (!songInstrument || songInstrument === currentInstrument) {
      return;
    }

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setCurrentInstrument(songInstrument);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentSong.instrument, currentInstrument]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    scheduleJsonSave(SONG_STORAGE_KEY, currentSong, songSaveTimeoutRef);
  }, [currentSong]);

  useEffect(() => {
    scheduleJsonSave(INSTRUMENT_STORAGE_KEY, currentInstrument, instrumentSaveTimeoutRef);
  }, [currentInstrument]);

  useEffect(() => {
    return () => {
      clearScheduledSave(songSaveTimeoutRef);
      clearScheduledSave(instrumentSaveTimeoutRef);
      clearScheduledSave(historySaveTimeoutRef);
    };
  }, []);

  // Restore the mirrored snapshot when localStorage lost the song: a cleared
  // store is the eviction case this redundant path exists for.
  useEffect(() => {
    requestPersistentStorage();
    if (localStorage.getItem(SONG_STORAGE_KEY)) {
      return;
    }
    let cancelled = false;
    void readMirroredSnapshot<StoredSongForMigration>('song')
      .then((snapshot) => {
        if (cancelled || !snapshot) {
          return;
        }
        setCurrentSong(normalizeRestoredSong(snapshot));
        setIsSongDirty(true);
        setMirrorRestoreNotice(
          'Previous session restored from a local snapshot. Save the song to a file to keep it safe.',
        );
      })
      .catch((error) => logger.warn('Failed to read mirrored snapshot', error));
    return () => {
      cancelled = true;
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNewSong = useCallback(() => {
    const targetLength = PATTERN_LENGTH;

    const emptyLine: Step = { note: null };

    const createBlankPattern = (id: string): Pattern => {
      const patternId = asPatternId(id);
      return {
        id: patternId,
        name: `Pattern ${patternId}`,
        step: Array.from({ length: targetLength }, () => ({ ...emptyLine })),
      };
    };

    const patterns: Pattern[] = [
      createBlankPattern('01'),
      createBlankPattern('02'),
      createBlankPattern('03'),
    ];

    const newCurrentInstrument: Instrument = {
      ...createEmptyInstrument(asInstrumentId('00'), ENVELOPE_LENGTH),
      base: DEFAULT_BASE_KEY,
      sustain: null,
    };

    const newSong: Song = {
      title: DEFAULT_SONG_TITLE,
      author: DEFAULT_SONG_AUTHOR,
      year: new Date().getFullYear(),
      speed: 6,
      length: targetLength,
      loop: null,
      pattern: patterns,
      line: [
        {
          A: asPlaylistPatternId('01'),
          B: asPlaylistPatternId('02'),
          C: asPlaylistPatternId('03'),
        },
      ],
      instrument: [newCurrentInstrument],
      chip: DEFAULT_SONG_CHIP,
      frame: DEFAULT_SONG_FRAME,
      clock: DEFAULT_SONG_CLOCK,
    };

    clearHistory();
    setCurrentSong(newSong);
    setCurrentInstrument(newCurrentInstrument);
    setIsSongDirty(false);

    return newSong;
  }, [clearHistory]);

  const createNewInstrument = useCallback(() => {
    const { updatedSong, newInstrument } = createNewInstrumentForSong(currentSong);
    recordHistory();
    setCurrentSong(updatedSong);
    setCurrentInstrument(newInstrument);
    setIsSongDirty(true);
    return newInstrument;
  }, [currentSong, recordHistory]);

  const saveSong = useCallback(() => {
    try {
      const yamlContent = buildSongYamlForExport(currentSong);
      const rawTitle = (currentSong.title || '').trim();
      const safeTitle = rawTitle ? rawTitle.replace(/[^a-zA-Z0-9]/g, '_') : 'NONAME';

      downloadFile(yamlContent, `${safeTitle || 'NONAME'}.song.yaml`, 'text/yaml');
      setIsSongDirty(false);
    } catch (error) {
      logger.error('Failed to save song', error);
    }
  }, [currentSong, setIsSongDirty]);

  const applyParsedSong = useCallback(
    (newSong: Song) => {
      setPendingSongImport(null);
      clearHistory();
      setCurrentSong(newSong);

      const firstInstrument = newSong.instrument.find(
        (inst) => inst && inst.name && inst.name.trim(),
      );
      if (firstInstrument) {
        setCurrentInstrument(firstInstrument);
      }
      setIsSongDirty(false);
    },
    [clearHistory],
  );

  const loadSongFromText = useCallback(
    (content: string) => {
      try {
        let metadata: SongParseMetadata | null = null;
        const newSong = parseSongFromYaml(content, {
          onMetadata: (data) => {
            metadata = data;
          },
        });

        if (metadata && shouldWarnForSongConfiguration(metadata)) {
          setPendingSongImport({ song: newSong, metadata });
          return;
        }

        applyParsedSong(newSong);
      } catch (error) {
        logger.error('Error loading song', error);
        setSongError('Error loading song file.');
      }
    },
    [applyParsedSong, setSongError],
  );

  const confirmPendingSongImport = useCallback(() => {
    if (!pendingSongImport) {
      return;
    }
    applyParsedSong(pendingSongImport.song);
  }, [pendingSongImport, applyParsedSong]);

  const cancelPendingSongImport = useCallback(() => {
    setPendingSongImport(null);
  }, []);

  const loadSong = useCallback(
    (file: File) => {
      if (file.size > MAX_IMPORT_BYTES) {
        setSongError('Song file exceeds the maximum import size.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result ?? '') as string;
        loadSongFromText(content);
      };
      reader.readAsText(file);
    },
    [loadSongFromText],
  );

  const saveInstrument = useCallback(() => {
    try {
      const yamlContent = buildInstrumentYamlForExport(currentInstrument);
      const rawName = (currentInstrument.name || '').trim();
      const safeName = rawName
        ? rawName.replace(/[^a-zA-Z0-9]/g, '_')
        : `Instrument_${String(currentInstrument.id || '').toUpperCase()}`;

      downloadFile(yamlContent, `${safeName}.inst.yaml`, 'text/yaml');
    } catch (error) {
      logger.error('Failed to save instrument', error);
    }
  }, [currentInstrument]);

  const loadInstrument = useCallback(
    (content: string) => {
      try {
        const targetInstrumentId = normalizeInstrumentId(currentInstrument.id);
        const newInstrument = parseInstrumentFromText(content, targetInstrumentId);

        recordHistory();
        setCurrentInstrument(newInstrument);
        setCurrentSong((prev) =>
          applyLoadedInstrumentToSong(prev, targetInstrumentId, newInstrument),
        );
        setIsSongDirty(true);
      } catch (error) {
        logger.error('Error loading instrument', error);
        setInstrumentError('Error loading instrument file.');
      }
    },
    [
      currentInstrument.id,
      recordHistory,
      setCurrentInstrument,
      setCurrentSong,
      setIsSongDirty,
      setInstrumentError,
    ],
  );

  const updateSong = useCallback(
    (updates: Partial<Song>, options?: UpdateSongOptions) => {
      // An update that changes no top-level key still applies (it can carry
      // normalization side effects) but records no history entry.
      const changed = (Object.keys(updates) as (keyof Song)[]).some(
        (key) => !Object.is(currentSong[key], updates[key]),
      );
      if (changed && options?.record !== false) {
        recordHistory(options?.coalesceKey);
      }
      setIsSongDirty(true);
      setCurrentSong((prev) => {
        const next: Song = { ...prev, ...updates } as Song;

        const legacyLength = (updates as { patternLength?: number }).patternLength;
        const rawLength = typeof updates.length === 'number' ? updates.length : legacyLength;
        if (typeof rawLength === 'number') {
          const clampedLength = Math.max(4, Math.min(256, Math.floor(rawLength)));

          next.length = clampedLength;

          next.pattern = prev.pattern.map((pattern) => {
            const existingLines = pattern.step || [];

            if (existingLines.length >= clampedLength) {
              return pattern;
            }

            const emptyLine: Step = { note: null };
            const extra = Array.from({ length: clampedLength - existingLines.length }, () => ({
              ...emptyLine,
            }));
            const newLines: Step[] = [...existingLines, ...extra];

            return { ...pattern, step: newLines };
          });
        }

        return next;
      });
    },
    [currentSong, recordHistory, setIsSongDirty],
  );

  const updateInstrument = useCallback(
    (updates: Partial<Instrument>) => {
      const changed = (Object.keys(updates) as (keyof Instrument)[]).some(
        (key) => !Object.is(currentInstrument[key], updates[key]),
      );
      if (changed) {
        recordHistory();
      }
      setIsSongDirty(true);
      setCurrentInstrument((prev) => ({ ...prev, ...updates }));

      setCurrentSong((prevSong) => {
        const { updatedSong } = updateInstrumentInSong(prevSong, currentInstrument, updates);
        return updatedSong;
      });
    },
    [currentInstrument, recordHistory],
  );

  const createNewPattern = useCallback(
    (patternId: PatternId) => {
      const { updatedSong, newPattern } = createPatternForSong(currentSong, patternId);
      recordHistory();
      setCurrentSong(updatedSong);
      setIsSongDirty(true);
      return newPattern;
    },
    [currentSong, recordHistory],
  );

  const addPlaylistEntry = useCallback(
    (entry: PlaylistEntry) => {
      const updatedSong = addPlaylistEntryToSong(currentSong, entry);
      recordHistory();
      setCurrentSong(updatedSong);
      setIsSongDirty(true);
    },
    [currentSong, recordHistory],
  );

  const optimizeSong = useCallback((): string => {
    const { optimizedSong, summary } = optimizeSongData(currentSong);
    recordHistory();
    setCurrentSong(optimizedSong);
    setIsSongDirty(true);
    return summary;
  }, [currentSong, recordHistory]);

  const renumberSong = useCallback((): string => {
    const { renumberedSong, nextCurrentInstrument, summary } = renumberSongData(
      currentSong,
      currentInstrument,
    );

    recordHistory();
    setCurrentSong(renumberedSong);
    if (nextCurrentInstrument) {
      setCurrentInstrument(nextCurrentInstrument);
    }
    setIsSongDirty(true);

    return summary;
  }, [currentSong, currentInstrument, recordHistory]);

  const triggerFileLoad = useCallback(() => {
    if (!fileInputRef.current) {
      return;
    }

    fileInputRef.current.value = '';
    fileInputRef.current.click();
  }, []);

  return {
    currentSong,
    currentInstrument,
    setCurrentInstrument,
    instrumentError,
    setInstrumentError,
    songError,
    setSongError,
    fileInputRef,
    createNewSong,
    createNewInstrument,
    saveSong,
    loadSong,
    saveInstrument,
    loadInstrument,
    updateSong,
    updateInstrument,
    createNewPattern,
    addPlaylistEntry,
    optimizeSong,
    renumberSong,
    triggerFileLoad,
    isSongDirty,
    loadSongFromText,
    mirrorRestoreNotice,
    pendingSongImport,
    confirmPendingSongImport,
    cancelPendingSongImport,
    undo,
    redo,
    canUndo: historySize.undo > 0,
    canRedo: historySize.redo > 0,
  };
};

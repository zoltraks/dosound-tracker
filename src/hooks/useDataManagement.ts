import { useState, useRef, useCallback, useEffect } from 'react';
import type { Instrument, Song, Pattern, Step } from '../synth/SoundDriver';
import { ENVELOPE_LENGTH, PATTERN_LENGTH } from '../constants/music';
import {
  DEFAULT_BASE_KEY,
  DEFAULT_SONG_TITLE,
  DEFAULT_SONG_AUTHOR,
  parseSongFromYaml,
  type SongParseMetadata,
} from '../utils/songParser';
import { DEFAULT_SONG_CHIP, DEFAULT_SONG_FRAME } from '../constants/song';
import { buildSongYamlForExport } from '../utils/songIO';
import { buildInstrumentYamlForExport, parseInstrumentFromText } from '../utils/instrumentIO';
import { downloadFile } from '../utils/fileOperations';
import {
  SONG_STORAGE_KEY,
  loadInitialSong,
  optimizeSongData,
  renumberSongData,
} from './useSongManagement';
import {
  createNewInstrumentForSong,
  updateInstrumentInSong,
  applyLoadedInstrumentToSong,
} from './useInstrumentManagement';
import { createPatternForSong, addPlaylistEntryToSong } from './usePatternManagement';
import { scheduleJsonSave, clearScheduledSave, type ScheduledSaveHandle } from './useStorage';

const INSTRUMENT_STORAGE_KEY = 'dosound-tracker-instrument';

type PendingSongImport = {
  song: Song;
  metadata: SongParseMetadata;
};

const shouldWarnForSongConfiguration = (metadata: SongParseMetadata | null): boolean => {
  if (!metadata) {
    return false;
  }

  const chipWarning = metadata.hasChipField && !metadata.isChipSupported;
  const frameWarning = metadata.hasFrameField && !metadata.isFrameSupported;

  return chipWarning || frameWarning;
};

export const useDataManagement = () => {
  const [currentSong, setCurrentSong] = useState<Song>(() => loadInitialSong());

  const [currentInstrument, setCurrentInstrument] = useState<Instrument>(() => {
    return {
      id: '00',
      name: 'Default Instrument',
      volume: Array(32).fill(0x0F),
      shift: [0, 4, 8, 12, 16, 20, 24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, -20, -16, -12, -8, -4, ...Array(8).fill(0)],
      pitch: Array(32).fill(0),
      noise: Array(32).fill(0),
      mode: Array(32).fill(0),
      base: DEFAULT_BASE_KEY,
      sustain: null
    };
  });

  const [songError, setSongError] = useState('');
  const [instrumentError, setInstrumentError] = useState('');
  const [isSongDirty, setIsSongDirty] = useState(false);
  const [pendingSongImport, setPendingSongImport] = useState<PendingSongImport | null>(null);

  const songSaveTimeoutRef = useRef<ScheduledSaveHandle | null>(null);
  const instrumentSaveTimeoutRef = useRef<ScheduledSaveHandle | null>(null);

  // Sync currentInstrument with song's instruments when song changes
  useEffect(() => {
    const songInstrument = currentSong.instrument.find(inst => inst.id === currentInstrument.id);
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
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNewSong = useCallback(() => {
    const targetLength = PATTERN_LENGTH;

    const emptyLine: Step = { note: null };

    const createBlankPattern = (id: string): Pattern => ({
      id,
      name: `Pattern ${id}`,
      step: Array.from({ length: targetLength }, () => ({ ...emptyLine }))
    });

    const patterns: Pattern[] = [
      createBlankPattern('01'),
      createBlankPattern('02'),
      createBlankPattern('03')
    ];

    const newCurrentInstrument: Instrument = {
      id: '00',
      name: '',
      volume: Array(ENVELOPE_LENGTH).fill(0),
      shift: Array(ENVELOPE_LENGTH).fill(0),
      pitch: Array(ENVELOPE_LENGTH).fill(0),
      noise: Array(ENVELOPE_LENGTH).fill(0),
      mode: Array(ENVELOPE_LENGTH).fill(0),
      base: DEFAULT_BASE_KEY,
      sustain: null
    };

    const newSong: Song = {
      title: DEFAULT_SONG_TITLE,
      author: DEFAULT_SONG_AUTHOR,
      year: new Date().getFullYear(),
      speed: 6,
      length: targetLength,
      loop: null,
      pattern: patterns,
      line: [{ A: '01', B: '02', C: '03' }],
      instrument: [newCurrentInstrument],
      chip: DEFAULT_SONG_CHIP,
      frame: DEFAULT_SONG_FRAME,
    };

    setCurrentSong(newSong);
    setCurrentInstrument(newCurrentInstrument);
    setIsSongDirty(false);

    return newSong;
  }, []);

  const createNewInstrument = useCallback(() => {
    const { updatedSong, newInstrument } = createNewInstrumentForSong(currentSong);
    setCurrentSong(updatedSong);
    setCurrentInstrument(newInstrument);
    setIsSongDirty(true);
    return newInstrument;
  }, [currentSong]);

  const saveSong = useCallback(() => {
    try {
      const yamlContent = buildSongYamlForExport(currentSong);
      const rawTitle = (currentSong.title || '').trim();
      const safeTitle = rawTitle ? rawTitle.replace(/[^a-zA-Z0-9]/g, '_') : 'NONAME';

      downloadFile(yamlContent, `${safeTitle || 'NONAME'}.song.yaml`, 'text/yaml');
      setIsSongDirty(false);
    } catch (error) {
      console.error('Failed to save song:', error);
    }
  }, [currentSong, setIsSongDirty]);

  const applyParsedSong = useCallback(
    (newSong: Song) => {
      setPendingSongImport(null);
      setCurrentSong(newSong);

      const firstInstrument = newSong.instrument.find(
        inst => inst && inst.name && inst.name.trim()
      );
      if (firstInstrument) {
        setCurrentInstrument(firstInstrument);
      }
      setIsSongDirty(false);
    },
    [setCurrentInstrument]
  );

  const loadSongFromText = useCallback(
    (content: string) => {
      try {
        let metadata: SongParseMetadata | null = null;
        const newSong = parseSongFromYaml(content, {
          onMetadata: data => {
            metadata = data;
          },
        });

        if (metadata && shouldWarnForSongConfiguration(metadata)) {
          setPendingSongImport({ song: newSong, metadata });
          return;
        }

        applyParsedSong(newSong);
      } catch (error) {
        console.error('Error loading song:', error);
        setSongError('Error loading song file. Please check the file format.');
      }
    },
    [applyParsedSong, setSongError]
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
      const reader = new FileReader();
      reader.onload = e => {
        const content = (e.target?.result ?? '') as string;
        loadSongFromText(content);
      };
      reader.readAsText(file);
    },
    [loadSongFromText]
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
      console.error('Failed to save instrument:', error);
    }
  }, [currentInstrument]);

  const loadInstrument = useCallback(
    (content: string) => {
      try {
        const newInstrument = parseInstrumentFromText(content, currentInstrument.id);

        setCurrentInstrument(newInstrument);

        setCurrentSong((prev) =>
          applyLoadedInstrumentToSong(prev, currentInstrument.id, newInstrument),
        );
        setIsSongDirty(true);
      } catch (error) {
        console.error('Error loading instrument:', error);
        setInstrumentError('Error loading instrument file. Please check the file format.');
      }
    },
    [currentInstrument.id, setCurrentInstrument, setCurrentSong, setIsSongDirty, setInstrumentError],
  );

  const updateSong = useCallback((updates: Partial<Song>) => {
    setIsSongDirty(true);
    setCurrentSong(prev => {
      // Handle pattern length updates with clamping and pattern resizing
      const next: Song = { ...prev, ...updates } as Song;

      const legacyLength = (updates as unknown as { patternLength?: number }).patternLength;
      const rawLength = typeof updates.length === 'number' ? updates.length : legacyLength;
      if (typeof rawLength === 'number') {
        const clampedLength = Math.max(4, Math.min(256, Math.floor(rawLength)));

        next.length = clampedLength;

        next.pattern = prev.pattern.map(pattern => {
          const existingLines = pattern.step || [];

          if (existingLines.length >= clampedLength) {
            return pattern;
          }

          const emptyLine: Step = { note: null };
          const extra = Array.from({ length: clampedLength - existingLines.length }, () => ({ ...emptyLine }));
          const newLines: Step[] = [...existingLines, ...extra];

          return { ...pattern, step: newLines };
        });
      }

      return next;
    });
  }, []);

  const updateInstrument = useCallback(
    (updates: Partial<Instrument>) => {
      setIsSongDirty(true);
      setCurrentInstrument((prev) => ({ ...prev, ...updates }));

      setCurrentSong((prevSong) => {
        const { updatedSong } = updateInstrumentInSong(prevSong, currentInstrument, updates);
        return updatedSong;
      });
    },
    [currentInstrument],
  );

  const createNewPattern = useCallback(
    (patternId: string) => {
      const { updatedSong, newPattern } = createPatternForSong(currentSong, patternId);
      setCurrentSong(updatedSong);
      setIsSongDirty(true);
      return newPattern;
    },
    [currentSong],
  );

  const addPlaylistEntry = useCallback(
    (entry: { A: string; B: string; C: string }) => {
      const updatedSong = addPlaylistEntryToSong(currentSong, entry);
      setCurrentSong(updatedSong);
      setIsSongDirty(true);
    },
    [currentSong],
  );

  const optimizeSong = useCallback((): string => {
    const { optimizedSong, summary } = optimizeSongData(currentSong);
    setCurrentSong(optimizedSong);
    setIsSongDirty(true);
    return summary;
  }, [currentSong]);

  const renumberSong = useCallback((): string => {
    const { renumberedSong, nextCurrentInstrument, summary } = renumberSongData(
      currentSong,
      currentInstrument,
    );

    setCurrentSong(renumberedSong);
    if (nextCurrentInstrument) {
      setCurrentInstrument(nextCurrentInstrument);
    }
    setIsSongDirty(true);

    return summary;
  }, [currentSong, currentInstrument]);

  const triggerFileLoad = useCallback(() => {
    fileInputRef.current?.click();
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
    pendingSongImport,
    confirmPendingSongImport,
    cancelPendingSongImport,
  };
};

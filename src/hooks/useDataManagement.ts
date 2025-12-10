import { useState, useRef, useCallback, useEffect } from 'react';
import type { Instrument, Song, Pattern, PatternLine, Note } from '../synth/SoundDriver';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH, PATTERN_LENGTH } from '../constants/music';
import defaultSongYaml from '../assets/song.yaml?raw';
import {
  DEFAULT_BASE_KEY,
  DEFAULT_SONG_TITLE,
  DEFAULT_SONG_AUTHOR,
  parseSongFromYaml,
} from '../utils/songParser';
import { buildSongYamlForExport, buildInstrumentYamlForExport, parseInstrumentFromText } from '../utils/songIO';
import { isInstrumentEmpty } from '../utils/instrument';

type TrackKey = 'trackA' | 'trackB' | 'trackC';

type StoredInstrumentForMigration = {
  volume?: unknown;
  volumeEnvelope?: unknown;
};

type StoredSongForMigration = {
  instruments?: StoredInstrumentForMigration[] | undefined;
  speed?: unknown;
  [key: string]: unknown;
};

// Storage keys
const SONG_STORAGE_KEY = 'dosound-tracker-song';
const INSTRUMENT_STORAGE_KEY = 'dosound-tracker-instrument';

const createDefaultSong = (): Song => {
  const defaultPatternLength = PATTERN_LENGTH;
  
  // Create three different patterns for each track
  const defaultPatternA: Pattern = {
    id: '01',
    name: 'Pattern 01',
    lines: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: PatternLine = { trackA: null, trackB: null, trackC: null };

      // Add some notes to create a simple melody on track A
      if (i % 8 === 0) line.trackA = { note: 'C', octave: 4, instrument: '00' };
      if (i % 8 === 2) line.trackA = { note: 'E', octave: 4, instrument: '00' };
      if (i % 8 === 4) line.trackA = { note: 'G', octave: 4, instrument: '00' };
      if (i % 8 === 6) line.trackA = { note: 'E', octave: 4, instrument: '00' };

      return line;
    })
  };
  
  const defaultPatternB: Pattern = {
    id: '02', 
    name: 'Pattern 02',
    lines: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: PatternLine = { trackA: null, trackB: null, trackC: null };

      // Add some bass notes on track B
      if (i % 4 === 0) line.trackB = { note: 'C', octave: 3, instrument: '00' };

      return line;
    })
  };
  
  const defaultPatternC: Pattern = {
    id: '03',
    name: 'Pattern 03', 
    lines: Array.from({ length: defaultPatternLength }, (_, i) => {
      const line: PatternLine = { trackA: null, trackB: null, trackC: null };

      // Add some high-frequency notes on track C
      if (i % 8 === 1) line.trackC = { note: 'G', octave: 5, instrument: '00' };
      if (i % 8 === 3) line.trackC = { note: 'E', octave: 5, instrument: '00' };
      if (i % 8 === 5) line.trackC = { note: 'C', octave: 5, instrument: '00' };
      if (i % 8 === 7) line.trackC = { note: 'E', octave: 5, instrument: '00' };

      return line;
    })
  };

  return {
    title: DEFAULT_SONG_TITLE,
    author: DEFAULT_SONG_AUTHOR,
    year: new Date().getFullYear(),
    speed: 6,
    patternLength: defaultPatternLength,
    loop: null,
    patterns: [defaultPatternA, defaultPatternB, defaultPatternC],
    playlist: [{ trackA: '01', trackB: '02', trackC: '03' }],
    instruments: [
      {
        id: '00',
        name: 'Default Instrument',
        volume: Array(32).fill(0x0F),
        arpeggio: [
          0, 4, 8, 12, 16, 20, 24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, -20,
          -16, -12, -8, -4, ...Array(8).fill(0)
        ],
        pitch: Array(32).fill(0),
        noiseEnvelope: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null
      },
      {
        id: '01',
        name: 'Bass Instrument',
        volume: [15, 15, 12, 8, 4, 0, ...Array(26).fill(0)],
        arpeggio: [
          12, 8, 4, 0, -4, -8, -12, -8, -4, 0, 4, 8, 12, ...Array(19).fill(0)
        ],
        pitch: Array(32).fill(0),
        noiseEnvelope: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null
      },
      {
        id: '02',
        name: 'Lead Instrument',
        volume: [8, 12, 15, 12, 8, 4, ...Array(26).fill(0)],
        arpeggio: [
          24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, ...Array(19).fill(0)
        ],
        pitch: Array(32).fill(0),
        noiseEnvelope: Array(32).fill(0),
        mode: Array(32).fill(0),
        base: DEFAULT_BASE_KEY,
        sustain: null
      }
    ]
  };
};


export const useDataManagement = () => {
  const [currentSong, setCurrentSong] = useState<Song>(() => {
    // Try to load from localStorage first
    try {
      const savedSong = localStorage.getItem(SONG_STORAGE_KEY);
      if (savedSong) {
        const parsedSong = JSON.parse(savedSong) as StoredSongForMigration;
        const instruments = parsedSong.instruments;
        const hasLegacyInstruments =
          Array.isArray(instruments) &&
          instruments.some(inst =>
            inst && !Array.isArray(inst.volume) && Array.isArray(inst.volumeEnvelope)
          );

        if (!hasLegacyInstruments) {
          const rawSpeed = Number(parsedSong.speed);
          const baseSpeed = Number.isFinite(rawSpeed) && rawSpeed > 0 ? Math.floor(rawSpeed) : 6;
          const clampedSpeed = Math.max(2, baseSpeed);
          const evenSpeed = clampedSpeed & ~1; // enforce even speed (2,4,6,...)
          return {
            ...(parsedSong as unknown as Song),
            speed: evenSpeed
          };
        }

        // Legacy/incompatible save format - clear and fall back to bundled/default song.
        localStorage.removeItem(SONG_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to load song from localStorage:', error);
    }
    try {
      return parseSongFromYaml(defaultSongYaml);
    } catch (error) {
      console.error('Failed to parse bundled default song YAML:', error);
      return createDefaultSong();
    }
  });

  const [currentInstrument, setCurrentInstrument] = useState<Instrument>(() => {
    return {
      id: '00',
      name: 'Default Instrument',
      volume: Array(32).fill(0x0F),
      arpeggio: [0, 4, 8, 12, 16, 20, 24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, -20, -16, -12, -8, -4, ...Array(8).fill(0)],
      pitch: Array(32).fill(0),
      noiseEnvelope: Array(32).fill(0),
      mode: Array(32).fill(0),
      base: DEFAULT_BASE_KEY,
      sustain: null
    };
  });

  const [songError, setSongError] = useState('');
  const [instrumentError, setInstrumentError] = useState('');
  const [isSongDirty, setIsSongDirty] = useState(false);

  const songSaveTimeoutRef = useRef<number | null>(null);
  const instrumentSaveTimeoutRef = useRef<number | null>(null);

  // Sync currentInstrument with song's instruments when song changes
  useEffect(() => {
    const songInstrument = currentSong.instruments.find(inst => inst.id === currentInstrument.id);
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
  }, [currentSong.instruments, currentInstrument]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (songSaveTimeoutRef.current !== null) {
      window.clearTimeout(songSaveTimeoutRef.current);
    }

    songSaveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(SONG_STORAGE_KEY, JSON.stringify(currentSong));
      } catch (error) {
        console.warn('Failed to save song to localStorage:', error);
      }
    }, 300);
  }, [currentSong]);

  useEffect(() => {
    if (instrumentSaveTimeoutRef.current !== null) {
      window.clearTimeout(instrumentSaveTimeoutRef.current);
    }

    instrumentSaveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(INSTRUMENT_STORAGE_KEY, JSON.stringify(currentInstrument));
      } catch (error) {
        console.warn('Failed to save instrument to localStorage:', error);
      }
    }, 300);
  }, [currentInstrument]);

  useEffect(() => {
    return () => {
      if (songSaveTimeoutRef.current !== null) {
        window.clearTimeout(songSaveTimeoutRef.current);
      }
      if (instrumentSaveTimeoutRef.current !== null) {
        window.clearTimeout(instrumentSaveTimeoutRef.current);
      }
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createNewSong = useCallback(() => {
    const targetLength = PATTERN_LENGTH;

    const emptyLine: PatternLine = { trackA: null, trackB: null, trackC: null };

    const createBlankPattern = (id: string): Pattern => ({
      id,
      name: `Pattern ${id}`,
      lines: Array.from({ length: targetLength }, () => ({ ...emptyLine }))
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
      arpeggio: Array(ENVELOPE_LENGTH).fill(0),
      pitch: Array(ENVELOPE_LENGTH).fill(0),
      noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      mode: Array(ENVELOPE_LENGTH).fill(0),
      base: DEFAULT_BASE_KEY,
      sustain: null
    };

    const newSong: Song = {
      title: DEFAULT_SONG_TITLE,
      author: DEFAULT_SONG_AUTHOR,
      year: new Date().getFullYear(),
      speed: 6,
      patternLength: targetLength,
      loop: null,
      patterns,
      playlist: [{ trackA: '01', trackB: '02', trackC: '03' }],
      instruments: [newCurrentInstrument]
    };

    setCurrentSong(newSong);
    setCurrentInstrument(newCurrentInstrument);
    setIsSongDirty(false);

    return newSong;
  }, []);

  const createNewInstrument = useCallback(() => {
    const instruments = currentSong.instruments;

    // Find first cleared slot (identified by default/empty instrument parameters)
    let slotIndex = instruments.findIndex(inst => isInstrumentEmpty(inst));
    if (slotIndex === -1) {
      slotIndex = instruments.length;
    }

    const slotId = slotIndex.toString(16).padStart(2, '0').toUpperCase();

    const newInstrument: Instrument = {
      id: slotId,
      name: `Instrument ${slotIndex}`,
      volume: Array(32).fill(0x0F),
      arpeggio: Array(32).fill(0),
      pitch: Array(32).fill(0),
      noiseEnvelope: Array(32).fill(0),
      mode: Array(32).fill(0),
      base: DEFAULT_BASE_KEY,
      sustain: null
    };

    const updatedInstruments = [...instruments];
    if (slotIndex < instruments.length) {
      updatedInstruments[slotIndex] = newInstrument;
    } else {
      updatedInstruments.push(newInstrument);
    }

    const updatedSong = {
      ...currentSong,
      instruments: updatedInstruments
    };
    setCurrentSong(updatedSong);
    setCurrentInstrument(newInstrument);
    setIsSongDirty(true);
    return newInstrument;
  }, [currentSong]);

  const saveSong = useCallback(() => {
    try {
      const yamlContent = buildSongYamlForExport(currentSong);

      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = currentSong.title.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `${safeTitle}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsSongDirty(false);
    } catch (error) {
      console.error('Failed to save song:', error);
    }
  }, [currentSong, setIsSongDirty]);

  const loadSongFromText = useCallback(
    (content: string) => {
      try {
        const newSong = parseSongFromYaml(content);

        setCurrentSong(newSong);

        const firstInstrument = newSong.instruments.find(
          inst => inst && inst.name && inst.name.trim()
        );
        if (firstInstrument) {
          setCurrentInstrument(firstInstrument);
        }
        setIsSongDirty(false);
      } catch (error) {
        console.error('Error loading song:', error);
        setSongError('Error loading song file. Please check the file format.');
      }
    },
    [setCurrentInstrument, setSongError]
  );

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

      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (currentInstrument.name || `instrument_${currentInstrument.id}`)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      a.download = `${safeName}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save instrument:', error);
    }
  }, [currentInstrument]);

  const loadInstrument = useCallback((content: string) => {
    try {
      const newInstrument = parseInstrumentFromText(content, currentInstrument.id);

      setCurrentInstrument(newInstrument);

      setCurrentSong(prev => {
        const instruments = [...prev.instruments];

        let targetIndex = instruments.findIndex(inst => inst.id === currentInstrument.id);

        if (targetIndex === -1) {
          const slotFromId = parseInt(currentInstrument.id, 16);
          if (Number.isFinite(slotFromId) && slotFromId >= 0 && slotFromId < MAX_INSTRUMENTS) {
            const clamped = slotFromId;

            for (let i = instruments.length; i <= clamped; i += 1) {
              if (!instruments[i]) {
                const slotId = i.toString(16).padStart(2, '0').toUpperCase();
                instruments[i] = {
                  id: slotId,
                  name: '',
                  volume: Array(ENVELOPE_LENGTH).fill(0),
                  arpeggio: Array(ENVELOPE_LENGTH).fill(0),
                  pitch: Array(ENVELOPE_LENGTH).fill(0),
                  noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                  mode: Array(ENVELOPE_LENGTH).fill(0),
                  sustain: null,
                };
              }
            }

            targetIndex = clamped;
          }
        }

        if (targetIndex >= 0) {
          instruments[targetIndex] = newInstrument;
        } else {
          instruments.push(newInstrument);
        }

        return { ...prev, instruments };
      });
      setIsSongDirty(true);
    } catch (error) {
      console.error('Error loading instrument:', error);
      setInstrumentError('Error loading instrument file. Please check the file format.');
    }
  }, [currentInstrument.id, setCurrentInstrument, setCurrentSong, setIsSongDirty, setInstrumentError]);

  const updateSong = useCallback((updates: Partial<Song>) => {
    setIsSongDirty(true);
    setCurrentSong(prev => {
      // Handle pattern length updates with clamping and pattern resizing
      const next: Song = { ...prev, ...updates } as Song;

      if (typeof updates.patternLength === 'number') {
        const rawLength = updates.patternLength;
        const clampedLength = Math.max(4, Math.min(256, Math.floor(rawLength)));
        next.patternLength = clampedLength;

        next.patterns = prev.patterns.map(pattern => {
          const existingLines = pattern.lines || [];

          if (existingLines.length >= clampedLength) {
            return pattern;
          }

          const emptyLine: PatternLine = { trackA: null, trackB: null, trackC: null };
          const extra = Array.from({ length: clampedLength - existingLines.length }, () => ({ ...emptyLine }));
          const newLines: PatternLine[] = [...existingLines, ...extra];

          return { ...pattern, lines: newLines };
        });
      }

      return next;
    });
  }, []);

  const updateInstrument = useCallback((updates: Partial<Instrument>) => {
    setIsSongDirty(true);
    setCurrentInstrument(prev => ({ ...prev, ...updates }));
    
    setCurrentSong(prev => {
      const instruments = [...prev.instruments];

      let targetIndex = instruments.findIndex(inst => inst.id === currentInstrument.id);
      const updatedInstrument: Instrument = { ...currentInstrument, ...updates } as Instrument;

      if (targetIndex === -1) {
        const slotFromId = parseInt(currentInstrument.id, 16);
        if (Number.isFinite(slotFromId) && slotFromId >= 0 && slotFromId < MAX_INSTRUMENTS) {
          const clamped = slotFromId;

          for (let i = instruments.length; i <= clamped; i++) {
            if (!instruments[i]) {
              const slotId = i.toString(16).padStart(2, '0').toUpperCase();
              instruments[i] = {
                id: slotId,
                name: '',
                volume: Array(ENVELOPE_LENGTH).fill(0),
                arpeggio: Array(ENVELOPE_LENGTH).fill(0),
                pitch: Array(ENVELOPE_LENGTH).fill(0),
                noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                mode: Array(ENVELOPE_LENGTH).fill(0),
                sustain: null,
              };
            }
          }

          targetIndex = clamped;
        }
      }

      if (targetIndex >= 0) {
        instruments[targetIndex] = updatedInstrument;
      } else {
        instruments.push(updatedInstrument);
      }

      return {
        ...prev,
        instruments
      };
    });
  }, [currentInstrument]);

  const createNewPattern = useCallback((patternId: string) => {
    const targetLength = currentSong.patternLength || PATTERN_LENGTH;
    const newPattern: Pattern = {
      id: patternId,
      name: `Pattern ${patternId}`,
      lines: Array(targetLength)
        .fill(null)
        .map(() => ({
          trackA: null,
          trackB: null,
          trackC: null
        }))
    };

    const updatedSong = {
      ...currentSong,
      patterns: [...currentSong.patterns, newPattern]
    };
    setCurrentSong(updatedSong);
    setIsSongDirty(true);
    return newPattern;
  }, [currentSong]);

  const addPlaylistEntry = useCallback(
    (entry: { trackA: string; trackB: string; trackC: string }) => {
      const updatedSong = {
        ...currentSong,
        playlist: [...currentSong.playlist, entry]
      };
      setCurrentSong(updatedSong);
      setIsSongDirty(true);
    },
    [currentSong]
  );

  const optimizeSong = useCallback((): string => {
    const song = currentSong;
    const patternLength = song.patternLength || PATTERN_LENGTH;

    // Determine used pattern IDs from playlist (ignore '--' placeholders)
    const usedPatternIds = new Set<string>();
    song.playlist.forEach(entry => {
      [entry.trackA, entry.trackB, entry.trackC].forEach(id => {
        if (typeof id === 'string') {
          const trimmed = id.trim();
          if (trimmed && trimmed !== '--') {
            usedPatternIds.add(trimmed);
          }
        }
      });
    });

    const newPatterns: Pattern[] = [];
    const removedPatternIds: string[] = [];
    const trimmedLinesInfo: { id: string; name: string; removed: number }[] = [];

    song.patterns.forEach(pattern => {
      if (!usedPatternIds.has(pattern.id)) {
        removedPatternIds.push(pattern.id);
        return;
      }

      const existingLines = pattern.lines || [];
      const removedCount =
        existingLines.length > patternLength ? existingLines.length - patternLength : 0;

      let newLines = existingLines;

      if (removedCount > 0) {
        newLines = existingLines.slice(0, patternLength);
        trimmedLinesInfo.push({ id: pattern.id, name: pattern.name, removed: removedCount });
      } else if (existingLines.length < patternLength) {
        const emptyLine: PatternLine = { trackA: null, trackB: null, trackC: null };
        const extra = Array.from({ length: patternLength - existingLines.length }, () => ({
          ...emptyLine
        }));
        newLines = [...existingLines, ...extra];
      }

      newPatterns.push({ ...pattern, lines: newLines });
    });

    // Determine used instruments from remaining patterns
    const usedInstrumentIds = new Set<string>();
    newPatterns.forEach(pattern => {
      (pattern.lines || []).forEach(line => {
        const tracks: TrackKey[] = ['trackA', 'trackB', 'trackC'];
        tracks.forEach(trackKey => {
          type NoteWithLegacyInstrument = Note & { instrument: string | number };
          const note = line[trackKey] as NoteWithLegacyInstrument | null;
          if (note && note.instrument !== undefined && note.instrument !== null) {
            // Normalize instrument ID to uppercase string
            let id = '';
            if (typeof note.instrument === 'string') {
              id = note.instrument.trim().toUpperCase();
            } else if (typeof note.instrument === 'number') {
              id = Math.floor(note.instrument)
                .toString(16)
                .padStart(2, '0')
                .toUpperCase();
            }
            if (id) {
              usedInstrumentIds.add(id);
            }
          }
        });
      });
    });

    const newInstruments: Instrument[] = [];
    const removedInstrumentIds: string[] = [];

    song.instruments.forEach(inst => {
      if (!inst) return; // Skip null/undefined instruments

      const idNorm = (inst.id || '').trim().toUpperCase();
      if (idNorm && usedInstrumentIds.has(idNorm)) {
        newInstruments.push(inst);
      } else {
        removedInstrumentIds.push(inst.id || 'unknown');
      }
    });

    const optimizedSong: Song = {
      ...song,
      patternLength,
      patterns: newPatterns,
      instruments: newInstruments
    };

    setCurrentSong(optimizedSong);
    setIsSongDirty(true);

    const summaryLines: string[] = [];
    summaryLines.push('Optimization complete.');
    summaryLines.push('');

    const hasRemovedPatterns = removedPatternIds.length > 0;
    const hasRemovedInstruments = removedInstrumentIds.length > 0;
    const hasTrimmedLines = trimmedLinesInfo.length > 0;

    if (hasRemovedPatterns) {
      summaryLines.push(
        `Removed patterns: ${removedPatternIds.length}` +
          ` (${removedPatternIds.join(', ')})`
      );
    }

    if (hasRemovedInstruments) {
      summaryLines.push(
        `Removed instruments: ${removedInstrumentIds.length}` +
          ` (${removedInstrumentIds.join(', ')})`
      );
    }

    if (hasTrimmedLines) {
      if (hasRemovedPatterns || hasRemovedInstruments) {
        summaryLines.push('');
      }
      summaryLines.push('Trimmed pattern lines:');
      trimmedLinesInfo.forEach(info => {
        summaryLines.push(
          `- Pattern ${info.id} (${info.name || 'unnamed'}): ${info.removed} lines above length ${patternLength}`
        );
      });
    }

    if (!hasRemovedPatterns && !hasRemovedInstruments && !hasTrimmedLines) {
      summaryLines.push('No patterns or instruments were removed and no pattern lines were trimmed.');
    }

    return summaryLines.join('\n');
  }, [currentSong]);

  const renumberSong = useCallback((): string => {
    const song = currentSong;

    // Build pattern lookup map
    const patternById = new Map<string, Pattern>();
    song.patterns.forEach(pattern => {
      if (pattern && typeof pattern.id === 'string') {
        patternById.set(pattern.id.trim().toUpperCase(), pattern);
      }
    });

    // Determine pattern order by first occurrence in playlist (A/B/C),
    // ignoring '--' placeholders, then append any hidden
    // patterns that are not referenced from the playlist.
    const orderedPatternIds: string[] = [];
    const seenPatternIds = new Set<string>();

    const addPatternId = (rawId: string) => {
      const trimmed = rawId.trim().toUpperCase();
      if (!trimmed || trimmed === '--') {
        return;
      }
      if (!patternById.has(trimmed) || seenPatternIds.has(trimmed)) {
        return;
      }

      seenPatternIds.add(trimmed);
      orderedPatternIds.push(trimmed);
    };

    song.playlist.forEach(entry => {
      if (!entry) return;
      if (typeof entry.trackA === 'string') addPatternId(entry.trackA);
      if (typeof entry.trackB === 'string') addPatternId(entry.trackB);
      if (typeof entry.trackC === 'string') addPatternId(entry.trackC);
    });

    // Append hidden patterns (those not referenced in the playlist),
    // preserving their existing order.
    song.patterns.forEach(pattern => {
      if (!pattern || typeof pattern.id !== 'string') return;
      const idNorm = pattern.id.trim().toUpperCase();
      if (!patternById.has(idNorm) || seenPatternIds.has(idNorm)) {
        return;
      }
      seenPatternIds.add(idNorm);
      orderedPatternIds.push(idNorm);
    });

    // Build mapping old pattern ID -> new pattern ID (00, 01, 02, ...)
    const patternIdMap: Record<string, string> = {};
    orderedPatternIds.forEach((oldId, index) => {
      patternIdMap[oldId] = index.toString(16).padStart(2, '0').toUpperCase();
    });

    const remapPatternId = (rawId: string): string => {
      const trimmed = rawId.trim();
      if (!trimmed) return rawId;
      if (trimmed === '--') return trimmed;
      const mapped = patternIdMap[trimmed.toUpperCase()];
      return mapped || trimmed;
    };

    // Renumber playlist pattern references
    const newPlaylist = song.playlist.map(entry => {
      if (!entry) return entry;
      return {
        trackA: typeof entry.trackA === 'string' ? remapPatternId(entry.trackA) : entry.trackA,
        trackB: typeof entry.trackB === 'string' ? remapPatternId(entry.trackB) : entry.trackB,
        trackC: typeof entry.trackC === 'string' ? remapPatternId(entry.trackC) : entry.trackC
      };
    });

    // Build new patterns in the newly defined order and apply new IDs.
    const remappedPatterns: Pattern[] = orderedPatternIds
      .map<Pattern | null>(oldId => {
        const original = patternById.get(oldId);
        if (!original) {
          return null;
        }

        const newId = patternIdMap[oldId];
        const newLines: PatternLine[] = (original.lines || []).map(line => ({
          trackA: line.trackA ? { ...line.trackA } : null,
          trackB: line.trackB ? { ...line.trackB } : null,
          trackC: line.trackC ? { ...line.trackC } : null
        }));

        return {
          ...original,
          id: newId,
          lines: newLines
        };
      })
      .filter((pattern): pattern is Pattern => Boolean(pattern));

    // Prepare instrument renumbering: sort instruments by name (case-insensitive)
    // and then assign hexadecimal IDs in that order.
    const instruments = song.instruments || [];
    const instrumentsSorted = [...instruments].sort((a, b) => {
      const nameA = (a?.name || '').toLowerCase();
      const nameB = (b?.name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      const idA = parseInt((a?.id || '0'), 16);
      const idB = parseInt((b?.id || '0'), 16);
      return idA - idB;
    });

    const instrumentIdMap: Record<string, string> = {};

    const newInstruments: Instrument[] = instrumentsSorted.map((inst, index) => {
      const oldIdNorm = (inst.id || '').trim().toUpperCase();
      const newId = index.toString(16).padStart(2, '0').toUpperCase();
      if (oldIdNorm) {
        instrumentIdMap[oldIdNorm] = newId;
      }
      return {
        ...inst,
        id: newId
      };
    });

    // Remap instrument IDs in all pattern note data.
    const remappedPatternsWithInstruments: Pattern[] = remappedPatterns.map(pattern => {
      const lines = (pattern.lines || []).map(line => {
        const newLine: PatternLine = { ...line };

        (['trackA', 'trackB', 'trackC'] as TrackKey[]).forEach(key => {
          const note = newLine[key] as Note | null;
          if (note && typeof note.instrument === 'string') {
            const raw = note.instrument.trim().toUpperCase();
            const mapped = instrumentIdMap[raw];
            if (mapped) {
              newLine[key] = {
                ...note,
                instrument: mapped
              };
            }
          }
        });

        return newLine;
      });

      return {
        ...pattern,
        lines
      };
    });

    // Update currentInstrument to keep it in sync with the new instrument IDs.
    let nextCurrentInstrument = currentInstrument;
    if (currentInstrument) {
      const currentIdNorm = (currentInstrument.id || '').trim().toUpperCase();
      const mappedId = instrumentIdMap[currentIdNorm];
      if (mappedId) {
        const updatedFromList = newInstruments.find(inst => inst.id === mappedId);
        nextCurrentInstrument = updatedFromList || { ...currentInstrument, id: mappedId };
      }
    }

    const renumberedSong: Song = {
      ...song,
      patterns: remappedPatternsWithInstruments,
      playlist: newPlaylist,
      instruments: newInstruments
    };

    setCurrentSong(renumberedSong);
    if (nextCurrentInstrument) {
      setCurrentInstrument(nextCurrentInstrument);
    }
    setIsSongDirty(true);

    // Build human-readable summary
    const summaryLines: string[] = [];
    summaryLines.push('Renumbering complete.');
    summaryLines.push('');

    const patternMappingLines: string[] = [];
    orderedPatternIds.forEach(oldId => {
      const newId = patternIdMap[oldId];
      if (!newId || newId === oldId) {
        return;
      }
      const pattern = patternById.get(oldId);
      const name = pattern && pattern.name ? pattern.name : '';
      patternMappingLines.push(`- ${oldId} -> ${newId}${name ? ` (${name})` : ''}`);
    });

    const instrumentMappingLines: string[] = [];
    instrumentsSorted.forEach(inst => {
      const oldIdRaw = inst.id || '';
      const oldIdNorm = oldIdRaw.trim().toUpperCase();
      const mapped = oldIdNorm ? instrumentIdMap[oldIdNorm] : '';
      if (!mapped || mapped === oldIdNorm) {
        return;
      }
      const name = inst.name || '';
      instrumentMappingLines.push(`- ${oldIdRaw} -> ${mapped}${name ? ` (${name})` : ''}`);
    });

    const hasPatternChanges = patternMappingLines.length > 0;
    const hasInstrumentChanges = instrumentMappingLines.length > 0;

    if (hasPatternChanges || hasInstrumentChanges) {
      summaryLines.push(`Patterns: ${song.patterns.length} -> ${renumberedSong.patterns.length}`);
      summaryLines.push(
        `Instruments: ${song.instruments.length} -> ${renumberedSong.instruments.length}`
      );

      if (hasPatternChanges) {
        summaryLines.push('');
        summaryLines.push('Pattern ID mapping (old -> new):');
        patternMappingLines.forEach(line => summaryLines.push(line));
      }
      if (hasInstrumentChanges) {
        summaryLines.push('');
        summaryLines.push('Instrument ID mapping (old -> new):');
        instrumentMappingLines.forEach(line => summaryLines.push(line));
      }
    } else {
      summaryLines.push('No pattern or instrument IDs were renumbered.');
    }

    return summaryLines.join('\n');
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
  };
};

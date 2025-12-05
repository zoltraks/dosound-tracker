import { useState, useRef, useCallback, useEffect } from 'react';
import type { Instrument, Song, Pattern, PatternLine, Note } from '../synth/SoundDriver';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH, PATTERN_LENGTH, DEFAULT_OCTAVE, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';
import yaml from 'js-yaml';
import defaultSongYaml from '../assets/song.yaml?raw';
import {
  DEFAULT_BASE_KEY,
  DEFAULT_SONG_TITLE,
  DEFAULT_SONG_AUTHOR,
  formatBaseKey,
  parseBaseKey,
  parseSongFromYaml,
} from '../utils/songParser';
import { isInstrumentEmpty } from '../utils/instrument';

type TrackKey = 'trackA' | 'trackB' | 'trackC';

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
        const parsedSong = JSON.parse(savedSong) as any;
        const hasLegacyInstruments =
          Array.isArray(parsedSong?.instruments) &&
          parsedSong.instruments.some((inst: any) =>
            inst && !Array.isArray(inst.volume) && Array.isArray(inst.volumeEnvelope)
          );

        if (!hasLegacyInstruments) {
          const rawSpeed = Number(parsedSong.speed);
          const baseSpeed = Number.isFinite(rawSpeed) && rawSpeed > 0 ? Math.floor(rawSpeed) : 6;
          const clampedSpeed = Math.max(2, baseSpeed);
          const evenSpeed = clampedSpeed & ~1; // enforce even speed (2,4,6,...)
          return {
            ...(parsedSong as Song),
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
    if (songInstrument && songInstrument !== currentInstrument) {
      setCurrentInstrument(songInstrument);
    }
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
      const trimEnvelope = (values: number[]): number[] => {
        if (!values || values.length === 0) return [];
        const last = values[values.length - 1];
        let i = values.length - 2;
        while (i >= 0 && values[i] === last) {
          i--;
        }
        return values.slice(0, i + 1).concat(last);
      };

      const isZeroDefault = (values: number[]): boolean =>
        values.length === 0 || (values.length === 1 && values[0] === 0);

      const instruments = currentSong.instruments.map((inst, index) => {
        const volumeEnv = trimEnvelope(inst.volume);
        const arpeggioEnv = trimEnvelope(inst.arpeggio);
        const pitchEnv = trimEnvelope(inst.pitch);
        const noiseEnv = trimEnvelope(inst.noiseEnvelope);
        const modeEnv = trimEnvelope(inst.mode);

        const number =
          typeof inst.id === 'string' && inst.id.trim()
            ? inst.id
            : index.toString(16).padStart(2, '0').toUpperCase();

        const instrumentNode: Record<string, unknown> = {
          number,
        };

        const trimmedName = (inst.name || '').trim();
        if (trimmedName) {
          instrumentNode.name = trimmedName;
        }

        const baseKey = inst.base || DEFAULT_BASE_KEY;
        if (baseKey !== DEFAULT_BASE_KEY) {
          instrumentNode.base = baseKey;
        }

        const rawOctave = inst.octave;
        if (typeof rawOctave === 'number' && Number.isFinite(rawOctave)) {
          const clampedOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(rawOctave)));
          if (clampedOctave !== DEFAULT_OCTAVE) {
            instrumentNode.octave = clampedOctave;
          }
        }

        instrumentNode.volume = volumeEnv;
        if (!isZeroDefault(arpeggioEnv)) {
          instrumentNode.arpeggio = arpeggioEnv;
        }

        if (!isZeroDefault(pitchEnv)) {
          instrumentNode.pitch = pitchEnv;
        }
        if (!isZeroDefault(noiseEnv)) {
          instrumentNode.noise = noiseEnv;
        }
        if (!isZeroDefault(modeEnv)) {
          instrumentNode.mode = modeEnv;
        }

        const sustain = inst.sustain;
        if (typeof sustain === 'number' && Number.isFinite(sustain) && sustain >= 0) {
          instrumentNode.sustain = Math.floor(sustain);
        }

        const midi = inst.midi;
        if (midi) {
          const midiNode: { channel?: number; program?: number } = {};
          let hasChannel = false;
          let hasProgram = false;

          const rawChannel = midi.channel;
          if (typeof rawChannel === 'number' && Number.isFinite(rawChannel)) {
            const clamped = Math.max(1, Math.min(16, Math.floor(rawChannel)));
            midiNode.channel = clamped;
            hasChannel = true;
          }

          const rawProgram = midi.program;
          if (typeof rawProgram === 'number' && Number.isFinite(rawProgram)) {
            const clamped = Math.max(0, Math.min(127, Math.floor(rawProgram)));
            midiNode.program = clamped;
            hasProgram = true;
          }

          if (hasChannel || hasProgram) {
            instrumentNode.midi = midiNode;
          }
        }

        return instrumentNode;
      });

      // Playlist: A/B/C keys instead of trackA/trackB/trackC.
      // Omit tracks that have no pattern assigned ("--").
      const playlist = currentSong.playlist.map(entry => {
        const row: { A?: string; B?: string; C?: string } = {};
        if (entry.trackA && entry.trackA !== '--') row.A = entry.trackA;
        if (entry.trackB && entry.trackB !== '--') row.B = entry.trackB;
        if (entry.trackC && entry.trackC !== '--') row.C = entry.trackC;
        return row;
      });

      // Patterns: single-track (track A) steps with note strings or space,
      // plus optional per-line volume modifier.
      const targetLength = currentSong.patternLength || PATTERN_LENGTH;
      const patterns = currentSong.patterns.map((pattern, index) => {
        const number =
          typeof pattern.id === 'string' && pattern.id.trim()
            ? pattern.id
            : index.toString(16).padStart(2, '0').toUpperCase();

        const rawLines = pattern.lines || [];
        type PatternStep = {
          space?: boolean | number;
          off?: boolean;
          note?: string;
          instrument?: string;
          volume?: number;
        };

        const lines: PatternStep[] = [];

        for (let i = 0; i < targetLength; i++) {
          const raw = rawLines[i] || { trackA: null, trackB: null, trackC: null };
          const cell = raw.trackA;

          const volRaw = raw.volume;
          const hasVolume = volRaw !== undefined && volRaw !== null;

          let step: PatternStep;

          if (!cell) {
            // Space line. Use `space: 1` when there is an explicit volume nibble,
            // otherwise keep the legacy boolean `space: true` which is used for
            // trimming/compressing pure empty lines.
            step = { space: hasVolume ? 1 : true };
          } else if (cell.note === '===') {
            // Explicit key-release step: encode as off: true in YAML.
            step = { note: 'OFF' };
          } else {
            const noteText = formatBaseKey(cell.note, cell.octave);
            step = {
              note: noteText,
              instrument: cell.instrument
            };
          }

          if (hasVolume) {
            const volNum = Number(volRaw);
            if (Number.isFinite(volNum)) {
              const clamped = Math.max(0, Math.min(0x0f, Math.floor(volNum)));
              step.volume = clamped;
            }
          }

          lines.push(step);
        }

        // Trim trailing pure-space lines
        let lastNonSpace = lines.length - 1;
        while (lastNonSpace >= 0) {
          const ln = lines[lastNonSpace];
          if (ln && ln.space === true && Object.keys(ln).length === 1) {
            lastNonSpace--;
          } else {
            break;
          }
        }

        const trimmedLines = lines.slice(0, lastNonSpace + 1);

        // Compress consecutive pure-space lines and volume-only lines into
        // aggregated runs, e.g. `space: 3` or `space: 3, volume: 14`.
        const compressedLines: PatternStep[] = [];

        type RunType = 'none' | 'space' | 'volume-space';
        let runType: RunType = 'none';
        let runCount = 0;
        let runVolume = 0;

        const flushRun = () => {
          if (runCount <= 0) return;
          if (runType === 'space') {
            compressedLines.push({ space: runCount });
          } else if (runType === 'volume-space') {
            if (runCount === 1) {
              // Single volume-only step: omit `space` and write only `volume`.
              compressedLines.push({ volume: runVolume });
            } else {
              // Multiple consecutive volume-only steps with same volume.
              compressedLines.push({ space: runCount, volume: runVolume });
            }
          }
          runType = 'none';
          runCount = 0;
        };

        const isPureSpace = (ln: PatternStep) =>
          ln && ln.space === true && Object.keys(ln).length === 1;

        const isVolumeSpace = (ln: PatternStep) =>
          ln &&
          ln.space === 1 &&
          typeof ln.volume === 'number' &&
          Object.keys(ln).length === 2;

        for (const ln of trimmedLines) {
          if (isPureSpace(ln)) {
            if (runType === 'space') {
              runCount++;
            } else {
              flushRun();
              runType = 'space';
              runCount = 1;
            }
          } else if (isVolumeSpace(ln)) {
            const vol = ln.volume as number;
            if (runType === 'volume-space' && vol === runVolume) {
              runCount++;
            } else {
              flushRun();
              runType = 'volume-space';
              runVolume = vol;
              runCount = 1;
            }
          } else {
            flushRun();
            compressedLines.push(ln);
          }
        }
        flushRun();

        const patternNode: { number: string; steps?: PatternStep[] } = {
          number,
        };

        if (compressedLines.length > 0) {
          patternNode.steps = compressedLines;
        }

        return patternNode;
      });

      const hasLoop =
        typeof currentSong.loop === 'number' && Number.isFinite(currentSong.loop);

      const songNode: Record<string, unknown> = {};

      const trimmedTitle = (currentSong.title || '').trim();
      if (trimmedTitle) {
        songNode.title = currentSong.title;
      }

      const trimmedAuthor = (currentSong.author || '').trim();
      if (trimmedAuthor) {
        songNode.author = currentSong.author;
      }

      const yearValue = Number(currentSong.year);
      if (Number.isFinite(yearValue) && yearValue > 0) {
        songNode.year = yearValue;
      }

      songNode.speed = currentSong.speed;
      songNode.length = currentSong.patternLength;
      if (hasLoop) {
        songNode.loop = Math.max(0, Math.floor(currentSong.loop as number));
      }
      songNode.playlist = playlist;
      songNode.pattern = patterns;
      songNode.instrument = instruments;

      const exportData = {
        song: songNode
      };

      let yamlContent = yaml.dump(exportData, {
        indent: 2,
        lineWidth: -1,
        quotingType: '"'
      });

      const compressInstrumentArray = (key: string, text: string): string => {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(
          `^(\\s*)(${escapedKey}:)\\s*\\n((?:\\1  -\\s*[^\\n]+\\n)+)`,
          'gm'
        );
        return text.replace(pattern, (_match, indent, keyText, block) => {
          const values: string[] = [];
          block.split('\n').forEach((line: string) => {
            const trimmed = line.trim();
            if (!trimmed.startsWith('- ')) return;
            values.push(trimmed.slice(2).trim());
          });
          return `${indent}${keyText} [${values.join(', ')}]\n`;
        });
      };

      const quotePlaylistValues = (text: string): string => {
        const playlistLineRegex = /^(\s*-\s+|\s+)([ABC]):\s*(.+)$/gm;
        return text.replace(playlistLineRegex, (_match, indent, key, value) => {
          let inner = String(value).trim();
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith('\'') && inner.endsWith('\''))
          ) {
            inner = inner.slice(1, -1);
          }
          return `${indent}${key}: "${inner}"`;
        });
      };

      const quoteNoteValues = (text: string): string => {
        const noteLineRegex = /^(\s*-\s+|\s+)(note):\s*(.+)$/gm;
        return text.replace(noteLineRegex, (_match, indent, key, value) => {
          let inner = String(value).trim();
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith('\'') && inner.endsWith('\''))
          ) {
            inner = inner.slice(1, -1);
          }
          return `${indent}${key}: "${inner}"`;
        });
      };

      const quoteBaseValues = (text: string): string => {
        const baseLineRegex = /^(\s*-\s+|\s+)(base):\s*(.+)$/gm;
        return text.replace(baseLineRegex, (_match, indent, key, value) => {
          let inner = String(value).trim();
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith('\'') && inner.endsWith('\''))
          ) {
            inner = inner.slice(1, -1);
          }
          return `${indent}${key}: "${inner}"`;
        });
      };

      const keys = ['volume', 'arpeggio', 'pitch', 'noise', 'mode'];
      for (const key of keys) {
        yamlContent = compressInstrumentArray(key, yamlContent);
      }

      yamlContent = quotePlaylistValues(yamlContent);
      yamlContent = quoteNoteValues(yamlContent);
      yamlContent = quoteBaseValues(yamlContent);

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
  }, [currentSong]);

  const loadSong = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
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
    };
    reader.readAsText(file);
  }, [setCurrentInstrument, setSongError]);

  const saveInstrument = useCallback(() => {
    try {
      const trimEnvelope = (values: number[]): number[] => {
        if (!values || values.length === 0) return [];
        const last = values[values.length - 1];
        let i = values.length - 2;
        while (i >= 0 && values[i] === last) {
          i--;
        }
        return values.slice(0, i + 1).concat(last);
      };

      const volumeEnv = trimEnvelope(currentInstrument.volume);
      const arpeggioEnv = trimEnvelope(currentInstrument.arpeggio);
      const pitchEnv = trimEnvelope(currentInstrument.pitch);
      const noiseEnv = trimEnvelope(currentInstrument.noiseEnvelope);
      const modeEnv = trimEnvelope(currentInstrument.mode);

      const isZeroDefault = (values: number[]): boolean =>
        values.length === 0 || (values.length === 1 && values[0] === 0);

      const instrumentNode: Record<string, unknown> = {};

      const trimmedName = (currentInstrument.name || '').trim();
      if (trimmedName) {
        instrumentNode.name = trimmedName;
      }

      instrumentNode.type = 'dosound';
      instrumentNode.version = 1;

      const baseKey = currentInstrument.base || DEFAULT_BASE_KEY;
      if (baseKey !== DEFAULT_BASE_KEY) {
        instrumentNode.base = baseKey;
      }

      const rawOctave = currentInstrument.octave;
      if (typeof rawOctave === 'number' && Number.isFinite(rawOctave)) {
        const clampedOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(rawOctave)));
        if (clampedOctave !== DEFAULT_OCTAVE) {
          instrumentNode.octave = clampedOctave;
        }
      }

      if (!isZeroDefault(modeEnv)) {
        instrumentNode.mode = modeEnv;
      }

      instrumentNode.volume = volumeEnv;
      if (!isZeroDefault(arpeggioEnv)) {
        instrumentNode.arpeggio = arpeggioEnv;
      }

      if (!isZeroDefault(pitchEnv)) {
        instrumentNode.pitch = pitchEnv;
      }
      if (!isZeroDefault(noiseEnv)) {
        instrumentNode.noise = noiseEnv;
      }

      const sustain = currentInstrument.sustain;
      if (typeof sustain === 'number' && Number.isFinite(sustain) && sustain >= 0) {
        instrumentNode.sustain = Math.floor(sustain);
      }

      const exportData = { instrument: instrumentNode };

      let yamlContent = yaml.dump(exportData, {
        indent: 2,
        lineWidth: -1,
        flowLevel: 2
      });

      const quoteBaseValues = (text: string): string => {
        const baseLineRegex = /^(\s*-\s+|\s+)(base):\s*(.+)$/gm;
        return text.replace(baseLineRegex, (_match, indent, key, value) => {
          let inner = String(value).trim();
          if (
            (inner.startsWith('"') && inner.endsWith('"')) ||
            (inner.startsWith('\'') && inner.endsWith('\''))
          ) {
            inner = inner.slice(1, -1);
          }
          return `${indent}${key}: "${inner}"`;
        });
      };

      yamlContent = quoteBaseValues(yamlContent);

      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (currentInstrument.name || `instrument_${currentInstrument.id}`).replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
      const parsed = yaml.load(content) as unknown;

        if (!parsed || typeof parsed !== 'object' || !('instrument' in parsed)) {
          setInstrumentError('Error loading instrument file.\n\nRoot "instrument" key not found.');
          return;
        }

        type InstrumentFileRoot = {
          instrument?: unknown;
        };

        interface InstrumentFileNode {
          [key: string]: unknown;
          name?: unknown;
          base?: unknown;
          octave?: unknown;
          sustain?: unknown;
        }

        const root = parsed as InstrumentFileRoot;
        const node = root.instrument;

        if (!node || typeof node !== 'object') {
          throw new Error('Invalid instrument file format');
        }

        const instNode = node as InstrumentFileNode;

        const expandEnvelope = (field: string, length: number, defaultValue: number): number[] => {
          const raw = Array.isArray(instNode[field]) ? (instNode[field] as unknown[]) : [];
          const values = raw.map(v => Number(v)).filter(v => Number.isFinite(v));

          if (values.length === 0) {
            return Array(length).fill(defaultValue);
          }

          const result: number[] = [];
          for (let i = 0; i < length; i++) {
            if (i < values.length) {
              result[i] = values[i];
            } else {
              result[i] = values[values.length - 1];
            }
          }
          return result;
        };

        const rawOctave = instNode.octave;
        let octave = DEFAULT_OCTAVE;
        if (typeof rawOctave === 'number' && Number.isFinite(rawOctave)) {
          octave = rawOctave;
        } else if (typeof rawOctave === 'string') {
          const trimmed = rawOctave.trim();
          if (trimmed) {
            const parsed = Number(trimmed);
            if (Number.isFinite(parsed)) {
              octave = parsed;
            }
          }
        }
        octave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, Math.floor(octave)));

        let sustain: number | null = null;
        const rawSustain = instNode.sustain;
        if (typeof rawSustain === 'number' && Number.isFinite(rawSustain)) {
          const s = Math.floor(rawSustain);
          if (s >= 0) {
            sustain = s;
          }
        } else if (typeof rawSustain === 'string') {
          const trimmed = rawSustain.trim();
          if (trimmed) {
            const parsed = Number(trimmed);
            if (Number.isFinite(parsed)) {
              const s = Math.floor(parsed);
              if (s >= 0) {
                sustain = s;
              }
            }
          }
        }

        const rawName = typeof instNode.name === 'string' ? instNode.name : '';
        const parsedName = rawName.trim() ? rawName : '';

        const newInstrument: Instrument = {
          id: currentInstrument.id,
          name: parsedName,
          mode: expandEnvelope('mode', ENVELOPE_LENGTH, 0),
          volume: expandEnvelope('volume', ENVELOPE_LENGTH, 0x0F),
          arpeggio: expandEnvelope('arpeggio', ENVELOPE_LENGTH, 0),
          pitch: expandEnvelope('pitch', ENVELOPE_LENGTH, 0),
          noiseEnvelope: expandEnvelope('noiseEnvelope', ENVELOPE_LENGTH, 0),
          base: (() => {
            const parsedBase = parseBaseKey(instNode.base);
            if (!parsedBase) return DEFAULT_BASE_KEY;
            return formatBaseKey(parsedBase.note, parsedBase.octave);
          })(),
          octave,
          sustain,
        };

        setCurrentInstrument(newInstrument);

        setCurrentSong(prev => {
          const instruments = [...prev.instruments];

          let targetIndex = instruments.findIndex(inst => inst.id === currentInstrument.id);

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
  }, [currentInstrument.id, setInstrumentError]);

  const updateSong = useCallback((updates: Partial<Song>) => {
    setIsSongDirty(true);
    setCurrentSong(prev => {
      // Handle pattern length updates with clamping and pattern resizing
      let next: Song = { ...prev, ...updates } as Song;

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
  }, [currentInstrument.id, currentInstrument]);

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
    isSongDirty
  };
};

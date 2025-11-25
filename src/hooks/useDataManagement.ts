import { useState, useRef, useCallback, useEffect } from 'react';
import type { Instrument, Song, Pattern, PatternLine } from '../synth/SoundDriver';
import { MAX_INSTRUMENTS, ENVELOPE_LENGTH, PATTERN_LENGTH } from '../constants/music';
import yaml from 'js-yaml';
import defaultSongYaml from '../assets/song.yaml?raw';

// Storage keys
const SONG_STORAGE_KEY = 'dosound-tracker-song';
const INSTRUMENT_STORAGE_KEY = 'dosound-tracker-instrument';

const DEFAULT_BASE_KEY = 'C-4';
const DEFAULT_SONG_TITLE = 'New Song';
const DEFAULT_SONG_AUTHOR = 'Author Name';

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
    patterns: [defaultPatternA, defaultPatternB, defaultPatternC],
    playlist: [{ trackA: '01', trackB: '02', trackC: '03' }],
    instruments: [
      {
        id: '00',
        name: 'Default Instrument',
        volumeEnvelope: Array(32).fill(0x0F),
        arpeggioEnvelope: [
          0, 4, 8, 12, 16, 20, 24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, -20,
          -16, -12, -8, -4, ...Array(8).fill(0)
        ],
        pitchEnvelope: Array(32).fill(0),
        noiseEnvelope: Array(32).fill(0),
        modeEnvelope: Array(32).fill(0),
        base: DEFAULT_BASE_KEY
      },
      {
        id: '01',
        name: 'Bass Instrument',
        volumeEnvelope: [15, 15, 12, 8, 4, 0, ...Array(26).fill(0)],
        arpeggioEnvelope: [
          12, 8, 4, 0, -4, -8, -12, -8, -4, 0, 4, 8, 12, ...Array(19).fill(0)
        ],
        pitchEnvelope: Array(32).fill(0),
        noiseEnvelope: Array(32).fill(0),
        modeEnvelope: Array(32).fill(0),
        base: DEFAULT_BASE_KEY
      },
      {
        id: '02',
        name: 'Lead Instrument',
        volumeEnvelope: [8, 12, 15, 12, 8, 4, ...Array(26).fill(0)],
        arpeggioEnvelope: [
          24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, ...Array(19).fill(0)
        ],
        pitchEnvelope: Array(32).fill(0),
        noiseEnvelope: Array(32).fill(0),
        modeEnvelope: Array(32).fill(0),
        base: DEFAULT_BASE_KEY
      }
    ]
  };
};

const formatBaseKey = (note: string, octave: number): string => {
  const upperNote = note.toUpperCase();
  return upperNote.endsWith('#')
    ? `${upperNote}${octave}`
    : `${upperNote}-${octave}`;
};

const parseBaseKey = (value: unknown): { note: string; octave: number } | null => {
  if (typeof value !== 'string') return null;
  const raw = value.trim().toUpperCase();
  if (!raw) return null;

  let notePart = raw.charAt(0);
  let rest = raw.slice(1);

  if (rest.startsWith('#')) {
    notePart += '#';
    rest = rest.slice(1);
  }

  if (rest.startsWith('-')) {
    rest = rest.slice(1);
  }

  const octave = parseInt(rest, 10);
  if (!Number.isFinite(octave)) return null;

  return { note: notePart, octave };
};

const parseSongFromYaml = (content: string): Song => {
  const parsed = yaml.load(content) as any;

  if (!parsed || typeof parsed !== 'object' || !parsed.song) {
    throw new Error('Root "song" key not found.');
  }

  const node = parsed.song as any;
  if (!node || typeof node !== 'object') {
    throw new Error('Invalid song file format');
  }

  const rawLength = Number(node.length);
  const patternLengthRaw = Number.isFinite(rawLength) ? rawLength : PATTERN_LENGTH;
  const clampedLength = Math.max(4, Math.min(256, Math.floor(patternLengthRaw)));

  const title =
    typeof node.title === 'string' && node.title.trim() ? node.title : DEFAULT_SONG_TITLE;
  const author =
    typeof node.author === 'string' && node.author.trim() ? node.author : DEFAULT_SONG_AUTHOR;

  const speedRaw = Number(node.speed);
  const speed = Number.isFinite(speedRaw) && speedRaw > 0 ? Math.floor(speedRaw) : 6;

  const yearRaw = Number(node.year);
  const year = Number.isFinite(yearRaw) ? yearRaw : new Date().getFullYear();

  const playlistNodes = Array.isArray(node.playlist) ? node.playlist : [];
  if (playlistNodes.length === 0) {
    throw new Error('Song playlist is missing or empty');
  }

  const playlist = playlistNodes.map((entry: any, index: number) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Invalid playlist entry at index ${index}`);
    }

    const trackA = typeof entry.A === 'string' ? entry.A : '--';
    const trackB = typeof entry.B === 'string' ? entry.B : '--';
    const trackC = typeof entry.C === 'string' ? entry.C : '--';

    return { trackA, trackB, trackC };
  });

  const patternNodes = Array.isArray(node.patterns) ? node.patterns : [];
  if (patternNodes.length === 0) {
    throw new Error('Song patterns are missing');
  }

  const patterns: Pattern[] = patternNodes.map((pNode: any, patternIndex: number) => {
    if (!pNode || typeof pNode !== 'object') {
      throw new Error(`Invalid pattern at index ${patternIndex}`);
    }

    const rawNumber = pNode.number;
    const number =
      typeof rawNumber === 'string' && rawNumber.trim()
        ? rawNumber.trim().toUpperCase()
        : patternIndex.toString(16).padStart(2, '0').toUpperCase();

    const name =
      typeof pNode.name === 'string' && pNode.name.trim()
        ? pNode.name
        : `Pattern ${number}`;

    const rawLineNodes = Array.isArray(pNode.steps)
      ? pNode.steps
      : Array.isArray(pNode.lines)
        ? pNode.lines
        : [];
    const expandedLineNodes: any[] = [];

    // Expand compressed space/off runs (space: N / off: N) into individual logical lines
    for (const nodeLine of rawLineNodes) {
      if (nodeLine && typeof nodeLine === 'object') {
        const ln: any = nodeLine;

        const spaceVal = ln.space;
        const offVal = ln.off;

        const isNumericSpace = typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
        const isNumericOff = typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

        if (isNumericSpace || isNumericOff) {
          const count = isNumericSpace ? spaceVal : offVal;
          const isOff = isNumericOff && !isNumericSpace;
          for (let i = 0; i < count; i++) {
            expandedLineNodes.push(isOff ? { off: true } : { space: true });
          }
          continue;
        }

        expandedLineNodes.push(nodeLine);
      } else {
        expandedLineNodes.push(nodeLine);
      }
    }

    const lines: PatternLine[] = [];

    for (let i = 0; i < clampedLength; i++) {
      const rawLineNode = expandedLineNodes[i];
      const line: PatternLine = { trackA: null, trackB: null, trackC: null };

      if (rawLineNode && typeof rawLineNode === 'object') {
        const ln: any = rawLineNode;

        if (ln.space === true || ln.off === true) {
          // Empty or note-off line: currently treated as space
        } else if (typeof ln.note === 'string') {
          const parsedKey = parseBaseKey(ln.note);
          if (!parsedKey) {
            throw new Error(
              `Invalid note value "${ln.note}" in pattern ${number} at line ${i}`
            );
          }

          const instId =
            typeof ln.instrument === 'string' && ln.instrument.trim()
              ? ln.instrument.trim().toUpperCase()
              : '00';

          line.trackA = {
            note: parsedKey.note,
            octave: parsedKey.octave,
            instrument: instId
          };
        }
      }

      lines.push(line);
    }

    return {
      id: number,
      name,
      lines
    };
  });

  const instrumentNodes = Array.isArray(node.instruments) ? node.instruments : [];
  if (instrumentNodes.length === 0) {
    throw new Error('Song instruments are missing');
  }

  const instruments: Instrument[] = [];

  const expandEnvelope = (values: any, length: number, defaultValue: number): number[] => {
    const rawArray = Array.isArray(values) ? (values as any[]) : [];
    const numericValues = rawArray
      .map(v => Number(v))
      .filter(v => Number.isFinite(v));

    if (numericValues.length === 0) {
      return Array(length).fill(defaultValue);
    }

    const result: number[] = [];
    for (let i = 0; i < length; i++) {
      if (i < numericValues.length) {
        result[i] = numericValues[i];
      } else {
        result[i] = numericValues[numericValues.length - 1];
      }
    }
    return result;
  };

  instrumentNodes.forEach((instNode: any, index: number) => {
    if (!instNode || typeof instNode !== 'object') {
      throw new Error(`Invalid instrument at index ${index}`);
    }

    const rawNumber = instNode.number;
    const number =
      typeof rawNumber === 'string' && rawNumber.trim()
        ? rawNumber.trim().toUpperCase()
        : index.toString(16).padStart(2, '0').toUpperCase();

    const slotIndex = parseInt(number, 16);
    if (!Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= MAX_INSTRUMENTS) {
      throw new Error(`Invalid instrument number "${rawNumber}"`);
    }

    const name =
      typeof instNode.name === 'string' && instNode.name.trim()
        ? instNode.name
        : `Instrument ${number}`;

    const baseParsed = parseBaseKey((instNode as any).base);
    const base = baseParsed
      ? formatBaseKey(baseParsed.note, baseParsed.octave)
      : DEFAULT_BASE_KEY;

    const volumeEnvelope = expandEnvelope(instNode.volume, ENVELOPE_LENGTH, 0x0F);
    const arpeggioEnvelope = expandEnvelope(instNode.arpeggio, ENVELOPE_LENGTH, 0);
    const pitchEnvelope = expandEnvelope(instNode.pitch, ENVELOPE_LENGTH, 0);
    const noiseEnvelope = expandEnvelope(instNode.noise, ENVELOPE_LENGTH, 0);
    const modeEnvelope = expandEnvelope(instNode.mode, ENVELOPE_LENGTH, 0);

    for (let i = instruments.length; i <= slotIndex; i++) {
      if (!instruments[i]) {
        const slotId = i.toString(16).padStart(2, '0').toUpperCase();
        instruments[i] = {
          id: slotId,
          name: '',
          volumeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          arpeggioEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          pitchEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          modeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
          base: DEFAULT_BASE_KEY
        };
      }
    }

    instruments[slotIndex] = {
      id: number,
      name,
      volumeEnvelope,
      arpeggioEnvelope,
      pitchEnvelope,
      noiseEnvelope,
      modeEnvelope,
      base
    };
  });

  return {
    title,
    author,
    year,
    speed,
    patternLength: clampedLength,
    patterns,
    playlist,
    instruments
  };
};

export const useDataManagement = () => {
  const [currentSong, setCurrentSong] = useState<Song>(() => {
    // Try to load from localStorage first
    try {
      const savedSong = localStorage.getItem(SONG_STORAGE_KEY);
      if (savedSong) {
        const parsedSong = JSON.parse(savedSong);
        return parsedSong;
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
      volumeEnvelope: Array(32).fill(0x0F),
      arpeggioEnvelope: [0, 4, 8, 12, 16, 20, 24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, -20, -16, -12, -8, -4, ...Array(8).fill(0)],
      pitchEnvelope: Array(32).fill(0),
      noiseEnvelope: Array(32).fill(0),
      modeEnvelope: Array(32).fill(0),
      base: DEFAULT_BASE_KEY
    };
  });

  // Sync currentInstrument with song's instruments when song changes
  useEffect(() => {
    const songInstrument = currentSong.instruments.find(inst => inst.id === currentInstrument.id);
    if (songInstrument && JSON.stringify(songInstrument) !== JSON.stringify(currentInstrument)) {
      setCurrentInstrument(songInstrument);
    }
  }, [currentSong.instruments, currentInstrument.id]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(SONG_STORAGE_KEY, JSON.stringify(currentSong));
    } catch (error) {
      console.warn('Failed to save song to localStorage:', error);
    }
  }, [currentSong]);

  useEffect(() => {
    try {
      localStorage.setItem(INSTRUMENT_STORAGE_KEY, JSON.stringify(currentInstrument));
    } catch (error) {
      console.warn('Failed to save instrument to localStorage:', error);
    }
  }, [currentInstrument]);

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
      volumeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      arpeggioEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      pitchEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      modeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
      base: DEFAULT_BASE_KEY
    };

    const newSong: Song = {
      title: DEFAULT_SONG_TITLE,
      author: DEFAULT_SONG_AUTHOR,
      year: new Date().getFullYear(),
      speed: 6,
      patternLength: targetLength,
      patterns,
      playlist: [{ trackA: '01', trackB: '02', trackC: '03' }],
      instruments: [newCurrentInstrument]
    };

    setCurrentSong(newSong);
    setCurrentInstrument(newCurrentInstrument);

    return newSong;
  }, []);

  const createNewInstrument = useCallback(() => {
    const instruments = currentSong.instruments;

    // Find first cleared slot (identified by empty name)
    let slotIndex = instruments.findIndex(inst => !inst.name);
    if (slotIndex === -1) {
      slotIndex = instruments.length;
    }

    const slotId = slotIndex.toString(16).padStart(2, '0').toUpperCase();

    const newInstrument: Instrument = {
      id: slotId,
      name: `Instrument ${slotIndex}`,
      volumeEnvelope: Array(32).fill(0x0F),
      arpeggioEnvelope: Array(32).fill(0),
      pitchEnvelope: Array(32).fill(0),
      noiseEnvelope: Array(32).fill(0),
      modeEnvelope: Array(32).fill(0),
      base: DEFAULT_BASE_KEY
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
        const volumeEnv = trimEnvelope(inst.volumeEnvelope);
        const arpeggioEnv = trimEnvelope(inst.arpeggioEnvelope);
        const pitchEnv = trimEnvelope(inst.pitchEnvelope);
        const noiseEnv = trimEnvelope(inst.noiseEnvelope);
        const modeEnv = trimEnvelope(inst.modeEnvelope);

        const number =
          typeof inst.id === 'string' && inst.id.trim()
            ? inst.id
            : index.toString(16).padStart(2, '0').toUpperCase();

        const instrumentNode: any = {};
        instrumentNode.name = inst.name;
        instrumentNode.number = number;

        const baseKey = inst.base || DEFAULT_BASE_KEY;
        if (baseKey !== DEFAULT_BASE_KEY) {
          instrumentNode.base = baseKey;
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

        return instrumentNode;
      });

      // Playlist: A/B/C keys instead of trackA/trackB/trackC
      const playlist = currentSong.playlist.map(entry => ({
        A: entry.trackA,
        B: entry.trackB,
        C: entry.trackC
      }));

      // Patterns: single-track (track A) steps with note strings or space
      const targetLength = currentSong.patternLength || PATTERN_LENGTH;
      const patterns = currentSong.patterns.map((pattern, index) => {
        const number =
          typeof pattern.id === 'string' && pattern.id.trim()
            ? pattern.id
            : index.toString(16).padStart(2, '0').toUpperCase();

        const rawLines = pattern.lines || [];
        const lines: any[] = [];

        for (let i = 0; i < targetLength; i++) {
          const raw = rawLines[i] || { trackA: null, trackB: null, trackC: null };
          const cell = raw.trackA;

          if (!cell) {
            lines.push({ space: true });
          } else {
            const noteText = formatBaseKey(cell.note, cell.octave);
            lines.push({
              note: noteText,
              instrument: cell.instrument
            });
          }
        }

        // Trim trailing pure-space lines
        let lastNonSpace = lines.length - 1;
        while (lastNonSpace >= 0) {
          const ln: any = lines[lastNonSpace];
          if (ln && ln.space === true && Object.keys(ln).length === 1) {
            lastNonSpace--;
          } else {
            break;
          }
        }

        const trimmedLines = lines.slice(0, lastNonSpace + 1);

        // Compress consecutive pure-space lines into space: <count>
        const compressedLines: any[] = [];
        let runCount = 0;

        const flushRun = () => {
          if (runCount > 0) {
            compressedLines.push({ space: runCount });
            runCount = 0;
          }
        };

        for (const ln of trimmedLines) {
          if (ln && ln.space === true && Object.keys(ln).length === 1) {
            runCount++;
          } else {
            flushRun();
            compressedLines.push(ln);
          }
        }
        flushRun();

        return {
          name: pattern.name,
          number,
          steps: compressedLines
        };
      });

      const exportData = {
        song: {
          title: currentSong.title,
          author: currentSong.author,
          length: currentSong.patternLength,
          speed: currentSong.speed,
          year: currentSong.year,
          playlist,
          patterns,
          instruments
        }
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

      const keys = ['volume', 'arpeggio', 'pitch', 'noise', 'mode'];
      for (const key of keys) {
        yamlContent = compressInstrumentArray(key, yamlContent);
      }

      yamlContent = quotePlaylistValues(yamlContent);

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
      } catch (error) {
        console.error('Error loading song:', error);
        alert('Error loading song file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, [setCurrentInstrument]);

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

      const volumeEnv = trimEnvelope(currentInstrument.volumeEnvelope);
      const arpeggioEnv = trimEnvelope(currentInstrument.arpeggioEnvelope);
      const pitchEnv = trimEnvelope(currentInstrument.pitchEnvelope);
      const noiseEnv = trimEnvelope(currentInstrument.noiseEnvelope);
      const modeEnv = trimEnvelope(currentInstrument.modeEnvelope);

      const isZeroDefault = (values: number[]): boolean =>
        values.length === 0 || (values.length === 1 && values[0] === 0);

      const instrumentNode: Record<string, any> = {
        name: currentInstrument.name || ''
      };

      const baseKey = currentInstrument.base || DEFAULT_BASE_KEY;
      if (baseKey !== DEFAULT_BASE_KEY) {
        instrumentNode.base = baseKey;
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

      const exportData = { instrument: instrumentNode };

      const yamlContent = yaml.dump(exportData, {
        indent: 2,
        lineWidth: -1,
        flowLevel: 2
      });

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

  const [instrumentError, setInstrumentError] = useState('');

  const loadInstrument = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = yaml.load(content) as any;

        if (!parsed || typeof parsed !== 'object' || !parsed.instrument) {
          setInstrumentError('Error loading instrument file.\n\nRoot "instrument" key not found.');
          return;
        }

        const node = parsed.instrument;

        if (!node || typeof node !== 'object') {
          throw new Error('Invalid instrument file format');
        }

        const expandEnvelope = (field: string, length: number, defaultValue: number): number[] => {
          const raw = Array.isArray(node[field]) ? node[field] as any[] : [];
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

        const newInstrument: Instrument = {
          id: currentInstrument.id,
          name: typeof node.name === 'string' && node.name.trim() ? node.name : currentInstrument.name,
          modeEnvelope: expandEnvelope('mode', ENVELOPE_LENGTH, 0),
          volumeEnvelope: expandEnvelope('volume', ENVELOPE_LENGTH, 0x0F),
          arpeggioEnvelope: expandEnvelope('arpeggio', ENVELOPE_LENGTH, 0),
          pitchEnvelope: expandEnvelope('pitch', ENVELOPE_LENGTH, 0),
          noiseEnvelope: expandEnvelope('noise', ENVELOPE_LENGTH, 0),
          base: (() => {
            const parsedBase = parseBaseKey((node as any).base);
            if (!parsedBase) return DEFAULT_BASE_KEY;
            return formatBaseKey(parsedBase.note, parsedBase.octave);
          })()
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
                    volumeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                    arpeggioEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                    pitchEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                    noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                    modeEnvelope: Array(ENVELOPE_LENGTH).fill(0)
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
      } catch (error) {
        console.error('Error loading instrument:', error);
        setInstrumentError('Error loading instrument file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, [currentInstrument.id, setInstrumentError]);

  const updateSong = useCallback((updates: Partial<Song>) => {
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
                volumeEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                arpeggioEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                pitchEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                noiseEnvelope: Array(ENVELOPE_LENGTH).fill(0),
                modeEnvelope: Array(ENVELOPE_LENGTH).fill(0)
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
    return newPattern;
  }, [currentSong]);

  const addPlaylistEntry = useCallback(
    (entry: { trackA: string; trackB: string; trackC: string }) => {
      const updatedSong = {
        ...currentSong,
        playlist: [...currentSong.playlist, entry]
      };
      setCurrentSong(updatedSong);
    },
    [currentSong]
  );

  const optimizeSong = useCallback((): string => {
    const song = currentSong;
    const patternLength = song.patternLength || PATTERN_LENGTH;

    // Determine used pattern IDs from playlist (ignore '--' and GOTO markers starting with '^^')
    const usedPatternIds = new Set<string>();
    song.playlist.forEach(entry => {
      [entry.trackA, entry.trackB, entry.trackC].forEach(id => {
        if (typeof id === 'string') {
          const trimmed = id.trim();
          if (trimmed && trimmed !== '--' && !trimmed.startsWith('^^')) {
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
        const tracks: (keyof PatternLine)[] = ['trackA', 'trackB', 'trackC'];
        tracks.forEach(trackKey => {
          const note = line[trackKey] as any;
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

    const summaryLines: string[] = [];
    summaryLines.push('Optimization complete.');
    summaryLines.push('');
    summaryLines.push(
      `Removed patterns: ${removedPatternIds.length}` +
        (removedPatternIds.length ? ` (${removedPatternIds.join(', ')})` : '')
    );
    summaryLines.push(
      `Removed instruments: ${removedInstrumentIds.length}` +
        (removedInstrumentIds.length ? ` (${removedInstrumentIds.join(', ')})` : '')
    );

    if (trimmedLinesInfo.length > 0) {
      summaryLines.push('Trimmed pattern lines:');
      trimmedLinesInfo.forEach(info => {
        summaryLines.push(
          `- Pattern ${info.id} (${info.name || 'unnamed'}): ${info.removed} lines above length ${patternLength}`
        );
      });
    } else {
      summaryLines.push('Trimmed pattern lines: 0');
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
    // ignoring '--' and GOTO markers ('^^..'), then append any hidden
    // patterns that are not referenced from the playlist.
    const orderedPatternIds: string[] = [];
    const seenPatternIds = new Set<string>();

    const addPatternId = (rawId: string) => {
      const trimmed = rawId.trim().toUpperCase();
      if (!trimmed || trimmed === '--') {
        return;
      }

      if (trimmed.startsWith('^^')) {
        const suffix = trimmed.slice(2).trim().toUpperCase();
        if (!suffix) return;
        if (!patternById.has(suffix) || seenPatternIds.has(suffix)) return;
        seenPatternIds.add(suffix);
        orderedPatternIds.push(suffix);
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

      if (trimmed.startsWith('^^')) {
        const suffix = trimmed.slice(2).trim().toUpperCase();
        if (!suffix) return trimmed;
        const mapped = patternIdMap[suffix];
        return mapped ? `^^${mapped}` : trimmed;
      }

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
      .map(oldId => {
        const original = patternById.get(oldId);
        if (!original) {
          return null as any;
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
      .filter(Boolean);

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

        (['trackA', 'trackB', 'trackC'] as (keyof PatternLine)[]).forEach(key => {
          const note = newLine[key] as any;
          if (note && typeof note.instrument === 'string') {
            const raw = note.instrument.trim().toUpperCase();
            const mapped = instrumentIdMap[raw];
            if (mapped) {
              newLine[key] = {
                ...note,
                instrument: mapped
              } as any;
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

    // Build human-readable summary
    const summaryLines: string[] = [];
    summaryLines.push('Renumbering complete.');
    summaryLines.push('');
    summaryLines.push(`Patterns: ${song.patterns.length} -> ${renumberedSong.patterns.length}`);
    summaryLines.push(
      `Instruments: ${song.instruments.length} -> ${renumberedSong.instruments.length}`
    );

    if (orderedPatternIds.length > 0) {
      summaryLines.push('');
      summaryLines.push('Pattern ID mapping (old -> new):');
      orderedPatternIds.forEach(oldId => {
        const newId = patternIdMap[oldId];
        const pattern = patternById.get(oldId);
        const name = pattern && pattern.name ? pattern.name : '';
        summaryLines.push(`- ${oldId} -> ${newId}${name ? ` (${name})` : ''}`);
      });
    }

    if (instrumentsSorted.length > 0) {
      summaryLines.push('');
      summaryLines.push('Instrument ID mapping (old -> new):');
      instrumentsSorted.forEach(inst => {
        const oldIdNorm = (inst.id || '').trim().toUpperCase();
        const mapped = instrumentIdMap[oldIdNorm];
        const name = inst.name || '';
        summaryLines.push(`- ${inst.id} -> ${mapped}${name ? ` (${name})` : ''}`);
      });
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
    triggerFileLoad
  };
};

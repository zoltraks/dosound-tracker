import { useState, useRef, useCallback, useEffect } from 'react';
import type { Instrument, Song, Pattern, PatternLine } from '../synth/dosound/DosoundDriver';
import yaml from 'js-yaml';

// Storage keys
const SONG_STORAGE_KEY = 'dosound-tracker-song';
const INSTRUMENT_STORAGE_KEY = 'dosound-tracker-instrument';

export const useDataManagement = () => {
  const [currentSong, setCurrentSong] = useState<Song>(() => {
    // Try to load from localStorage first
    console.log('Loading song from localStorage...');
    try {
      const savedSong = localStorage.getItem(SONG_STORAGE_KEY);
      console.log('Saved song data:', savedSong);
      if (savedSong) {
        const parsedSong = JSON.parse(savedSong);
        console.log('Parsed song:', parsedSong);
        return parsedSong;
      }
    } catch (error) {
      console.warn('Failed to load song from localStorage:', error);
    }
    console.log('Using default song');

    // Create default song if no saved data
    const defaultPattern: Pattern = {
      id: '00',
      name: 'Default Pattern',
      lines: Array.from({ length: 64 }, (_, i) => {
        const line: PatternLine = { trackA: null, trackB: null, trackC: null };
        
        // Add some notes to create a simple melody
        if (i % 8 === 0) line.trackA = { note: 'C', octave: 4, instrument: '00' };
        if (i % 8 === 2) line.trackA = { note: 'E', octave: 4, instrument: '00' };
        if (i % 8 === 4) line.trackA = { note: 'G', octave: 4, instrument: '00' };
        if (i % 8 === 6) line.trackA = { note: 'E', octave: 4, instrument: '00' };
        
        // Add some bass notes on track B
        if (i % 4 === 0) line.trackB = { note: 'C', octave: 3, instrument: '00' };
        
        return line;
      })
    };

    return {
      title: 'Untitled Song',
      author: 'ZoltarX / New Generation',
      year: new Date().getFullYear(),
      speed: 6,
      patterns: [defaultPattern],
      playlist: [{ trackA: '00', trackB: '00', trackC: '00' }],
      instruments: [
        {
          id: '00',
          name: 'Default Instrument',
          volumeEnvelope: Array(32).fill(0x0F),
          arpeggioEnvelope: [0, 4, 8, 12, 16, 20, 24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, -20, -16, -12, -8, -4, ...Array(8).fill(0)],
          pitchEnvelope: [0, 16, 32, 64, 96, 128, 96, 64, 32, 16, 0, -16, -32, -64, -96, -128, -96, -64, -32, -16, ...Array(12).fill(0)],
          noiseEnvelope: Array(32).fill(0),
          modeEnvelope: Array(32).fill(0)
        },
        {
          id: '01',
          name: 'Bass Instrument',
          volumeEnvelope: [15, 15, 12, 8, 4, 0, ...Array(26).fill(0)],
          arpeggioEnvelope: [12, 8, 4, 0, -4, -8, -12, -8, -4, 0, 4, 8, 12, ...Array(19).fill(0)],
          pitchEnvelope: [64, 32, 0, -32, -64, -32, 0, 32, 64, ...Array(23).fill(0)],
          noiseEnvelope: Array(32).fill(0),
          modeEnvelope: Array(32).fill(0)
        },
        {
          id: '02',
          name: 'Lead Instrument',
          volumeEnvelope: [8, 12, 15, 12, 8, 4, ...Array(26).fill(0)],
          arpeggioEnvelope: [24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, ...Array(19).fill(0)],
          pitchEnvelope: [128, 96, 64, 32, 0, -32, -64, -96, -128, ...Array(23).fill(0)],
          noiseEnvelope: Array(32).fill(0),
          modeEnvelope: Array(32).fill(0)
        }
      ]
    };
  });

  const [currentInstrument, setCurrentInstrument] = useState<Instrument>(() => {
    // Temporarily skip localStorage to test new data
    console.log('Using new test instrument data (localStorage disabled for testing)');
    
    // Create test instrument with positive/negative values
    return {
      id: '00',
      name: 'Default Instrument',
      volumeEnvelope: Array(32).fill(0x0F),
      arpeggioEnvelope: [0, 4, 8, 12, 16, 20, 24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, -20, -16, -12, -8, -4, ...Array(8).fill(0)],
      pitchEnvelope: [0, 16, 32, 64, 96, 128, 96, 64, 32, 16, 0, -16, -32, -64, -96, -128, -96, -64, -32, -16, ...Array(12).fill(0)],
      noiseEnvelope: Array(32).fill(0),
      modeEnvelope: Array(32).fill(0)
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
    const newSong: Song = {
      title: 'New Song',
      author: 'ZoltarX / New Generation',
      year: new Date().getFullYear(),
      speed: 6,
      patterns: [],
      playlist: [],
      instruments: []
    };
    setCurrentSong(newSong);
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
      modeEnvelope: Array(32).fill(0)
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
      const yamlContent = yaml.dump(currentSong, {
        indent: 2,
        lineWidth: -1
      });
      
      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSong.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.yaml`;
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
        const loadedSong = yaml.load(content) as Song;
        setCurrentSong(loadedSong);
        if (loadedSong.instruments.length > 0) {
          setCurrentInstrument(loadedSong.instruments[0]);
        }
      } catch (error) {
        console.error('Error loading song:', error);
        alert('Error loading song file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, []);

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

      const instrumentNode: any = {
        name: currentInstrument.name,
        volume: trimEnvelope(currentInstrument.volumeEnvelope),
        arpeggio: trimEnvelope(currentInstrument.arpeggioEnvelope),
        pitch: trimEnvelope(currentInstrument.pitchEnvelope),
        noise: trimEnvelope(currentInstrument.noiseEnvelope),
        mode: trimEnvelope(currentInstrument.modeEnvelope)
      };

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

  const loadInstrument = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = yaml.load(content) as any;
        const node = parsed && parsed.instrument ? parsed.instrument : parsed;

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
          modeEnvelope: expandEnvelope('mode', 32, 0),
          volumeEnvelope: expandEnvelope('volume', 32, 0x0F),
          arpeggioEnvelope: expandEnvelope('arpeggio', 32, 0),
          pitchEnvelope: expandEnvelope('pitch', 32, 0),
          noiseEnvelope: expandEnvelope('noise', 32, 0)
        };

        setCurrentInstrument(newInstrument);

        setCurrentSong(prev => {
          const instruments = [...prev.instruments];
          const slotIndex = instruments.findIndex(inst => inst.id === currentInstrument.id);
          if (slotIndex >= 0) {
            instruments[slotIndex] = newInstrument;
          } else {
            instruments.push(newInstrument);
          }
          return { ...prev, instruments };
        });
      } catch (error) {
        console.error('Error loading instrument:', error);
        alert('Error loading instrument file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, [currentInstrument.id]);

  const updateSong = useCallback((updates: Partial<Song>) => {
    setCurrentSong(prev => ({ ...prev, ...updates }));
  }, []);

  const updateInstrument = useCallback((updates: Partial<Instrument>) => {
    setCurrentInstrument(prev => ({ ...prev, ...updates }));
    
    // Also update in song if it exists
    setCurrentSong(prev => {
      const updatedInstruments = prev.instruments.map(inst => 
        inst.id === currentInstrument.id ? { ...inst, ...updates } : inst
      );
      
      // If instrument doesn't exist in song, add it
      if (!prev.instruments.some(inst => inst.id === currentInstrument.id)) {
        updatedInstruments.push({ ...currentInstrument, ...updates });
      }
      
      return {
        ...prev,
        instruments: updatedInstruments
      };
    });
  }, [currentInstrument.id, currentInstrument]);

  const createNewPattern = useCallback((patternId: string) => {
    const newPattern: Pattern = {
      id: patternId,
      name: `Pattern ${patternId}`,
      lines: Array(64).fill(null).map(() => ({
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

  const addPlaylistEntry = useCallback((entry: { trackA: string; trackB: string; trackC: string }) => {
    const updatedSong = {
      ...currentSong,
      playlist: [...currentSong.playlist, entry]
    };
    setCurrentSong(updatedSong);
  }, [currentSong]);

  const triggerFileLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    currentSong,
    currentInstrument,
    setCurrentInstrument,
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
    triggerFileLoad
  };
};

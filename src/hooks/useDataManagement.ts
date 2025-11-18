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
          modeEnvelope: Array(32).fill(0),
          toneNoiseMode: 'tone'
        },
        {
          id: '01',
          name: 'Bass Instrument',
          volumeEnvelope: [15, 15, 12, 8, 4, 0, ...Array(26).fill(0)],
          arpeggioEnvelope: [12, 8, 4, 0, -4, -8, -12, -8, -4, 0, 4, 8, 12, ...Array(19).fill(0)],
          pitchEnvelope: [64, 32, 0, -32, -64, -32, 0, 32, 64, ...Array(23).fill(0)],
          noiseEnvelope: Array(32).fill(0),
          modeEnvelope: Array(32).fill(0),
          toneNoiseMode: 'tone'
        },
        {
          id: '02',
          name: 'Lead Instrument',
          volumeEnvelope: [8, 12, 15, 12, 8, 4, ...Array(26).fill(0)],
          arpeggioEnvelope: [24, 20, 16, 12, 8, 4, 0, -4, -8, -12, -16, -20, -24, ...Array(19).fill(0)],
          pitchEnvelope: [128, 96, 64, 32, 0, -32, -64, -96, -128, ...Array(23).fill(0)],
          noiseEnvelope: Array(32).fill(0),
          modeEnvelope: Array(32).fill(0),
          toneNoiseMode: 'tone'
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
      modeEnvelope: Array(32).fill(0),
      toneNoiseMode: 'tone'
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
    const instrumentCount = currentSong.instruments.length;
    const newInstrument: Instrument = {
      id: instrumentCount.toString(16).padStart(2, '0').toUpperCase(),
      name: `Instrument ${instrumentCount}`,
      volumeEnvelope: Array(32).fill(0x0F),
      arpeggioEnvelope: Array(32).fill(0),
      pitchEnvelope: Array(32).fill(0),
      noiseEnvelope: Array(32).fill(0),
      modeEnvelope: Array(32).fill(0),
      toneNoiseMode: 'tone'
    };
    
    const updatedSong = {
      ...currentSong,
      instruments: [...currentSong.instruments, newInstrument]
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
    // Temporarily disabled yaml functionality
    console.log('Save instrument temporarily disabled');
    return;
    
    /*
    const yamlContent = yaml.dump(currentInstrument, {
      indent: 2,
      lineWidth: -1
    });
    
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentInstrument.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    */
  }, [currentInstrument]);

  const loadInstrument = useCallback((_file: File) => {
    // Temporarily disabled yaml functionality
    console.log('Load instrument temporarily disabled');
    return;
    
    /*
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const loadedInstrument = yaml.load(content) as Instrument;
        setCurrentInstrument(loadedInstrument);
        
        // Add to current song if not already present
        if (!currentSong.instruments.find(inst => inst.id === loadedInstrument.id)) {
          const updatedSong = {
            ...currentSong,
            instruments: [...currentSong.instruments, loadedInstrument]
          };
          setCurrentSong(updatedSong);
        }
      } catch (error) {
        console.error('Error loading instrument:', error);
        alert('Error loading instrument file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    */
  }, [currentSong]);

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

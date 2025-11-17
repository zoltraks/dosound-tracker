import { useState, useRef, useCallback } from 'react';
import type { Instrument, Song, Pattern, PatternLine } from '../synth/dosound/DosoundDriver';
// import yaml from 'js-yaml';

export const useDataManagement = () => {
  const [currentSong, setCurrentSong] = useState<Song>(() => {
    // Create a default pattern with some notes
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
      instruments: []
    };
  });

  const [currentInstrument, setCurrentInstrument] = useState<Instrument>({
    id: '00',
    name: 'Default Instrument',
    volumeEnvelope: Array(32).fill(0x0F),
    arpeggioEnvelope: Array(32).fill(0),
    pitchEnvelope: Array(32).fill(0),
    noiseEnvelope: Array(32).fill(0),
    toneNoiseMode: 'tone'
  });

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
    // Temporarily disabled yaml functionality
    console.log('Save song temporarily disabled');
    return;
    
    /*
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
    */
  }, [currentSong]);

  const loadSong = useCallback((_file: File) => {
    // Temporarily disabled yaml functionality
    console.log('Load song temporarily disabled');
    return;
    
    /*
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
    */
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
    setCurrentSong(prev => ({
      ...prev,
      instruments: prev.instruments.map(inst => 
        inst.id === currentInstrument.id ? { ...inst, ...updates } : inst
      )
    }));
  }, [currentInstrument.id]);

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

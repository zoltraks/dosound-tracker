/**
 * useWorkletSequencer - Hook for AudioWorklet-based sequencer
 * 
 * This hook provides a simplified interface for playback using the
 * YM2149 AudioWorklet. All audio processing and timing happens on
 * the audio thread, so the main thread only needs to handle UI updates.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { YM2149Worklet } from '../synth/YM2149Worklet';
import type { Song } from '../synth/SoundDriver';

export interface WorkletSequencerState {
  isPlaying: boolean;
  currentPattern: number;
  currentLine: number;
  currentTick: number;
}

export interface UseWorkletSequencerReturn {
  // State
  sequencerState: WorkletSequencerState;
  isReady: boolean;
  
  // YM2149 instance for preview notes
  ym2149: YM2149Worklet | null;
  
  // Playback controls
  startSong: (pattern?: number, line?: number) => void;
  startPatternLoop: (pattern: number, line?: number) => void;
  stop: () => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  
  // Song data
  updateSong: (song: Song) => void;
  
  // Mutes
  setMutes: (mutes: boolean[]) => void;
}

export function useWorkletSequencer(audioContext: AudioContext | null): UseWorkletSequencerReturn {
  const [sequencerState, setSequencerState] = useState<WorkletSequencerState>({
    isPlaying: false,
    currentPattern: 0,
    currentLine: 0,
    currentTick: 0
  });
  
  const [isReady, setIsReady] = useState(false);
  const ym2149Ref = useRef<YM2149Worklet | null>(null);
  const currentSongRef = useRef<Song | null>(null);
  
  // Initialize the AudioWorklet
  useEffect(() => {
    if (!audioContext) return;
    
    const initWorklet = async () => {
      try {
        const worklet = new YM2149Worklet(audioContext);
        await worklet.waitForInit();
        
        // Set up callbacks
        worklet.setPositionCallback((data) => {
          setSequencerState({
            isPlaying: data.isPlaying,
            currentPattern: data.currentPattern,
            currentLine: data.currentLine,
            currentTick: data.currentTick
          });
        });
        
        worklet.setStopCallback(() => {
          setSequencerState(prev => ({
            ...prev,
            isPlaying: false
          }));
        });
        
        ym2149Ref.current = worklet;
        setIsReady(true);
        
        console.log('WorkletSequencer ready');
      } catch (error) {
        console.error('Failed to initialize WorkletSequencer:', error);
      }
    };
    
    initWorklet();
    
    return () => {
      if (ym2149Ref.current) {
        ym2149Ref.current.dispose();
        ym2149Ref.current = null;
      }
    };
  }, [audioContext]);
  
  // Update song data in the worklet
  const updateSong = useCallback((song: Song) => {
    currentSongRef.current = song;
    
    if (!ym2149Ref.current) return;
    
    // Convert song to the format expected by the worklet
    // Need to convert patterns to ensure volume is number | undefined (not null)
    const convertedPatterns = song.patterns.map(p => ({
      id: p.id,
      lines: p.lines.map(line => ({
        trackA: line.trackA,
        trackB: line.trackB,
        trackC: line.trackC,
        volume: line.volume ?? undefined
      }))
    }));
    
    ym2149Ref.current.setSong({
      patterns: convertedPatterns,
      playlist: song.playlist,
      instruments: song.instruments,
      speed: song.speed || 4,
      patternLength: song.patternLength || 64,
      loop: song.loop ?? undefined
    });
  }, []);
  
  // Start song playback
  const startSong = useCallback((pattern?: number, line?: number) => {
    if (!ym2149Ref.current || !currentSongRef.current) return;
    
    // Ensure song data is up to date
    updateSong(currentSongRef.current);
    
    ym2149Ref.current.start({
      pattern: pattern ?? 0,
      line: line ?? 0,
      patternLoop: false
    });
    
    setSequencerState(prev => ({
      ...prev,
      isPlaying: true,
      currentPattern: pattern ?? 0,
      currentLine: line ?? 0,
      currentTick: 0
    }));
  }, [updateSong]);
  
  // Start pattern loop
  const startPatternLoop = useCallback((pattern: number, line?: number) => {
    if (!ym2149Ref.current || !currentSongRef.current) return;
    
    // Ensure song data is up to date
    updateSong(currentSongRef.current);
    
    ym2149Ref.current.start({
      pattern,
      line: line ?? 0,
      patternLoop: true
    });
    
    setSequencerState(prev => ({
      ...prev,
      isPlaying: true,
      currentPattern: pattern,
      currentLine: line ?? 0,
      currentTick: 0
    }));
  }, [updateSong]);
  
  // Stop playback
  const stop = useCallback(() => {
    if (!ym2149Ref.current) return;
    
    ym2149Ref.current.stop();
    
    setSequencerState(prev => ({
      ...prev,
      isPlaying: false
    }));
  }, []);
  
  // Set position
  const setPosition = useCallback((pattern: number, line: number, tick?: number) => {
    if (!ym2149Ref.current) return;
    
    ym2149Ref.current.setPosition(pattern, line, tick);
    
    setSequencerState(prev => ({
      ...prev,
      currentPattern: pattern,
      currentLine: line,
      currentTick: tick ?? 0
    }));
  }, []);
  
  // Set mutes
  const setMutes = useCallback((mutes: boolean[]) => {
    if (!ym2149Ref.current) return;
    
    ym2149Ref.current.setMutes(mutes);
  }, []);
  
  return {
    sequencerState,
    isReady,
    ym2149: ym2149Ref.current,
    startSong,
    startPatternLoop,
    stop,
    setPosition,
    updateSong,
    setMutes
  };
}

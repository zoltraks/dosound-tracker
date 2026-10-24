/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { StorageKeys } from '../../utils/storage/storageKeys.ts';
import {
  parseEditorCursor,
  clampEditorCursor,
  serializeEditorCursor,
  type EditorCursor,
} from '../../utils/cursor/editorCursor.ts';
import type { NavigationSection } from '../../constants/navigation.ts';
import type { Instrument, Song } from '../../synth/SoundDriver.ts';

export interface UseEditorPersistenceParams {
  channelMutes: [boolean, boolean, boolean];
  instrumentOctaves: Record<string, number>;
  trackBackgroundEnabled: boolean;
  currentSong: Song;
  currentInstrument: Instrument;
  setLastTrackId: Dispatch<SetStateAction<'A' | 'B' | 'C'>>;
  setActiveSection: (section: NavigationSection) => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  setSharedCurrentLine: (line: number) => void;
  setCurrentTrackColumn: Dispatch<SetStateAction<'note' | 'volume'>>;
  setCurrentInstrument: (instrument: Instrument) => void;
  activeSection: NavigationSection;
  targetTrackId: 'A' | 'B' | 'C';
  sequencerIsPlaying: boolean;
  sequencerCurrentPattern: number;
  sharedCurrentLine: number;
  currentTrackColumn: 'note' | 'volume';
}

export function useEditorPersistence({
  channelMutes,
  instrumentOctaves,
  trackBackgroundEnabled,
  currentSong,
  currentInstrument,
  setLastTrackId,
  setActiveSection,
  setPosition,
  setSharedCurrentLine,
  setCurrentTrackColumn,
  setCurrentInstrument,
  activeSection,
  targetTrackId,
  sequencerIsPlaying,
  sequencerCurrentPattern,
  sharedCurrentLine,
  currentTrackColumn,
}: UseEditorPersistenceParams): void {
  useEffect(() => {
    try {
      localStorage.setItem(StorageKeys.EQ_MUTES, JSON.stringify(channelMutes));
    } catch {
      // ignore
    }
  }, [channelMutes]);

  useEffect(() => {
    try {
      localStorage.setItem(StorageKeys.INSTRUMENT_OCTAVES, JSON.stringify(instrumentOctaves));
    } catch {
      // ignore
    }
  }, [instrumentOctaves]);

  useEffect(() => {
    try {
      localStorage.setItem(
        StorageKeys.TRACK_BACKGROUND_ENABLED,
        trackBackgroundEnabled ? '1' : '0',
      );
    } catch {
      // ignore
    }
  }, [trackBackgroundEnabled]);

  // Restore the persisted editor cursor once on mount, clamped to the loaded song.
  const hasRestoredCursorRef = useRef(false);

  useEffect(() => {
    const stored = parseEditorCursor(localStorage.getItem(StorageKeys.EDITOR_CURSOR));
    if (stored) {
      const clamped = clampEditorCursor(stored, currentSong.line.length, currentSong.length);
      setLastTrackId(clamped.track);
      setActiveSection(clamped.section);
      setPosition(clamped.playlistLine, 0, 0);
      setSharedCurrentLine(clamped.trackRow);
      setCurrentTrackColumn(clamped.column);
    }

    const storedInstrumentId = localStorage.getItem(StorageKeys.CURRENT_INSTRUMENT);
    if (storedInstrumentId) {
      const match = currentSong.instrument.find((inst) => inst.id === storedInstrumentId);
      if (match) {
        setCurrentInstrument(match);
      }
    }

    hasRestoredCursorRef.current = true;
  }, []);

  // Persist the selected instrument so it is restored on the next launch.
  useEffect(() => {
    if (!hasRestoredCursorRef.current) return;
    try {
      localStorage.setItem(StorageKeys.CURRENT_INSTRUMENT, currentInstrument.id);
    } catch {
      // ignore
    }
  }, [currentInstrument]);

  // Persist the editor cursor whenever it changes while playback is not running,
  // so no local storage writes occur on the audio path.
  useEffect(() => {
    if (!hasRestoredCursorRef.current) return;
    if (sequencerIsPlaying) return;
    const cursor: EditorCursor = {
      section: activeSection,
      track: targetTrackId,
      playlistLine: sequencerCurrentPattern,
      trackRow: sharedCurrentLine,
      column: currentTrackColumn,
    };
    try {
      localStorage.setItem(StorageKeys.EDITOR_CURSOR, serializeEditorCursor(cursor));
    } catch {
      // ignore
    }
  }, [
    activeSection,
    targetTrackId,
    sequencerCurrentPattern,
    sequencerIsPlaying,
    sharedCurrentLine,
    currentTrackColumn,
  ]);
}

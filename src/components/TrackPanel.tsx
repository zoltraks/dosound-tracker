import React, { useRef } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Pattern, Instrument } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';
import { TrackLines } from './TrackLines';
import { useTrackKeyboard } from '../hooks/useTrackKeyboard';
import { useTrackPreview } from '../hooks/useTrackPreview';
import { useTrackFocus } from '../hooks/useTrackFocus';
import { useTrackRendering } from '../hooks/useTrackRendering';
import { useTrackInstrumentState } from '../hooks/useTrackInstrumentState';

interface TrackPanelProps {
  trackId: 'A' | 'B' | 'C';
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  currentLine: number;
  patternLength: number;
  onLineChange: (lineIndex: number) => void;
  pattern: Pattern | null;
  onPatternChange: (pattern: Pattern) => void;
  ym2149: YM2149 | null;
  currentInstrumentData: Instrument;
  instruments: Instrument[];
  trackBackgroundEnabled: boolean;
  isTargetTrack: boolean;
  onToggleLineFromCursor: (lineIndex: number) => void;
  currentColumn: 'note' | 'volume';
  setCurrentColumn: (column: 'note' | 'volume') => void;
  focusRevision: number;
  onPreviewMidiNoteOn?: (ymChannel: number, instrument: Instrument, note: string, octave: number) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
  onHardStopLivePreview?: (ymChannel: number) => void;
  onRegisterStopPreview?: (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => void;
}

export const TrackPanel: React.FC<TrackPanelProps> = (props) => {
  const {
    trackId,
    activeSection,
    setActiveSection,
    currentOctave,
    currentLine,
    patternLength,
    onLineChange,
    pattern,
    onPatternChange,
    ym2149,
    currentInstrumentData,
    instruments,
    trackBackgroundEnabled,
    isTargetTrack,
    onToggleLineFromCursor,
    currentColumn,
    setCurrentColumn,
    focusRevision,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff,
    onHardStopLivePreview,
    onRegisterStopPreview
  } = props;

  const { setTrackInstrumentId } = useTrackInstrumentState({
    currentInstrumentId: currentInstrumentData.id,
  });
  const trackRef = useRef<HTMLDivElement>(null);

  const sectionName = `track${trackId}` as NavigationSection;
  const isActive = activeSection === sectionName;

  const {
    playPreviewNote,
    stopPreview,
    pressedNoteKeysRef,
    activePreviewKeyRef,
    previewSustainIndexRef,
    previewReleasedRef,
  } = useTrackPreview({
    trackId,
    ym2149,
    currentInstrumentData,
    onPreviewMidiNoteOn,
    onPreviewMidiNoteOff,
    onHardStopLivePreview,
    onRegisterStopPreview,
  });

  const {
    trackNotes,
    instrumentColorMap,
    effectiveVolume,
    handleLineClick,
  } = useTrackRendering({
    pattern,
    patternLength,
    instruments,
    currentLine,
    sectionName,
    onLineChange,
    setActiveSection,
    setCurrentColumn,
  });

  const { handleKeyDown, handleKeyUp } = useTrackKeyboard({
    isActive,
    currentLine,
    currentOctave,
    patternLength,
    currentColumn,
    trackId,
    pattern,
    currentInstrumentData,
    onLineChange,
    onPatternChange,
    onToggleLineFromCursor,
    setActiveSection,
    setCurrentColumn,
    setCurrentInstrument: setTrackInstrumentId,
    playPreviewNote,
    stopPreview,
    pressedNoteKeysRef,
    activePreviewKeyRef,
    previewSustainIndexRef,
    previewReleasedRef,
  });

  useTrackFocus({
    isActive,
    focusRevision,
    trackRef,
    stopPreview,
  });

  return (
    <div
      ref={trackRef}
      className={`track-panel track-${trackId.toLowerCase()} ${trackBackgroundEnabled ? 'track-colored' : ''} ${isActive ? 'active' : ''} ${!pattern ? 'disabled' : ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={() => setActiveSection(sectionName)}
    >
      <div className={`track-header ${isTargetTrack ? 'target-track' : ''}`}>
        <span className="track-header-title">{trackId}</span>
        <span className="track-header-volume">
          VOL {effectiveVolume.toString(16).toUpperCase()}
        </span>
      </div>

      <div className="track-content" style={{ userSelect: 'none' }}>
        <TrackLines
          trackNotes={trackNotes}
          patternSteps={pattern?.step ?? []}
          currentLine={currentLine}
          currentColumn={currentColumn}
          isActive={isActive}
          instrumentColorMap={instrumentColorMap}
          onLineClick={handleLineClick}
        />
      </div>
    </div>
  );
};

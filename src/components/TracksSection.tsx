import React from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Pattern, Instrument, Song } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import { TrackPanel } from './TrackPanel';
import { YM2149 } from '../synth/YM2149';

interface TracksSectionProps {
  song: Song;
  sharedCurrentLine: number;
  onLineChange: (lineIndex: number) => void;
  onPositionScroll: React.UIEventHandler<HTMLDivElement>;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentOctave: number;
  getCurrentPatternForTrack: (trackId: 'A' | 'B' | 'C') => Pattern | null;
  onPatternChange: (pattern: Pattern) => void;
  ym2149: YM2149 | null;
  currentInstrument: Instrument;
  targetTrackId: 'A' | 'B' | 'C';
  onTogglePatternFromCursor: (lineIndex: number) => void;
  currentTrackColumn: 'note' | 'volume';
  setCurrentTrackColumn: (column: 'note' | 'volume') => void;
  trackFocusRevision: number;
  onPreviewMidiNoteOn: (ymChannel: number, instrument: Instrument, note: string, octave: number) => void;
  onPreviewMidiNoteOff: (ymChannel: number) => void;
  onHardStopLivePreview?: (ymChannel: number) => void;
  onRegisterTrackStopPreview?: (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => void;
}

export const TracksSection: React.FC<TracksSectionProps> = ({
  song,
  sharedCurrentLine,
  onLineChange,
  onPositionScroll,
  activeSection,
  setActiveSection,
  currentOctave,
  getCurrentPatternForTrack,
  onPatternChange,
  ym2149,
  currentInstrument,
  targetTrackId,
  onTogglePatternFromCursor,
  currentTrackColumn,
  setCurrentTrackColumn,
  trackFocusRevision,
  onPreviewMidiNoteOn,
  onPreviewMidiNoteOff,
  onHardStopLivePreview,
  onRegisterTrackStopPreview,
}) => {
  const patternLength = song.patternLength || PATTERN_LENGTH;

  const positionIndices = React.useMemo(() => {
    return Array.from({ length: patternLength }, (_, i) => i);
  }, [patternLength]);

  return (
    <div className="left-column">
      <div className="left-column-content">
        <div className="position-block">
          <div className="position-header"></div>
          <div className="position-content" onScroll={onPositionScroll}>
            {positionIndices.map(i => (
              <div
                key={i}
                className={`position-number ${i === sharedCurrentLine ? 'current' : ''}`}
                onClick={() => onLineChange(i)}
              >
                {i.toString(16).toUpperCase().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>

        <div className="tracks-container">
          <div className="tracks-row">
            {(['A', 'B', 'C'] as const).map(trackId => (
              <TrackPanel
                key={trackId}
                trackId={trackId}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                currentOctave={currentOctave}
                currentLine={sharedCurrentLine}
                patternLength={patternLength}
                onLineChange={onLineChange}
                pattern={getCurrentPatternForTrack(trackId)}
                onPatternChange={onPatternChange}
                ym2149={ym2149}
                currentInstrumentData={currentInstrument}
                isTargetTrack={targetTrackId === trackId}
                onTogglePatternFromCursor={onTogglePatternFromCursor}
                currentColumn={currentTrackColumn}
                setCurrentColumn={setCurrentTrackColumn}
                focusRevision={trackFocusRevision}
                onPreviewMidiNoteOn={onPreviewMidiNoteOn}
                onPreviewMidiNoteOff={onPreviewMidiNoteOff}
                onHardStopLivePreview={onHardStopLivePreview}
                onRegisterStopPreview={onRegisterTrackStopPreview}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

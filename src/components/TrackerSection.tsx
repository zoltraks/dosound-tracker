import React from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Pattern, Instrument, Song } from '../synth/SoundDriver';
import { PATTERN_LENGTH } from '../constants/music';
import { DEFAULT_SONG_FRAME } from '../constants/song';
import { TrackPanel } from './TrackPanel';
import { YM2149 } from '../synth/YM2149';
import RainbowModeLight from '../assets/svg/rainbow-mode-light.svg';
import RainbowModeDark from '../assets/svg/rainbow-mode-dark.svg';
import RainbowModeLightColorless from '../assets/svg/rainbow-mode-light-colorless.svg';
import RainbowModeDarkColorless from '../assets/svg/rainbow-mode-dark-colorless.svg';

interface TrackerSectionProps {
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
  onToggleLineFromCursor: (lineIndex: number) => void;
  currentTrackColumn: 'note' | 'volume';
  setCurrentTrackColumn: (column: 'note' | 'volume') => void;
  trackFocusRevision: number;
  onPreviewMidiNoteOn: (ymChannel: number, instrument: Instrument, note: string, octave: number) => void;
  onPreviewMidiNoteOff: (ymChannel: number) => void;
  onHardStopLivePreview?: (ymChannel: number) => void;
  onRegisterTrackStopPreview?: (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => void;
  trackBackgroundEnabled: boolean;
  onToggleTrackBackground: () => void;
  isDarkMode: boolean;
}

export const TrackerSection: React.FC<TrackerSectionProps> = ({
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
  onToggleLineFromCursor,
  currentTrackColumn,
  setCurrentTrackColumn,
  trackFocusRevision,
  onPreviewMidiNoteOn,
  onPreviewMidiNoteOff,
  onHardStopLivePreview,
  onRegisterTrackStopPreview,
  trackBackgroundEnabled,
  onToggleTrackBackground,
  isDarkMode,
}) => {
  const patternLength = song.length || PATTERN_LENGTH;
  const tickIntervalMs = 1000 / (song.frame ?? DEFAULT_SONG_FRAME);

  const positionIndices = React.useMemo(() => {
    return Array.from({ length: patternLength }, (_, i) => i);
  }, [patternLength]);

  return (
    <div className="left-column">
      <div className="left-column-content">
        <div className="position-block">
          <div className="position-header">
            <button
              type="button"
              className={`track-bg-toggle ${trackBackgroundEnabled ? 'enabled' : 'disabled'}`}
              onClick={onToggleTrackBackground}
              onMouseDown={(event) => event.preventDefault()}
              title={trackBackgroundEnabled ? 'Disable track background colors' : 'Enable track background colors'}
            >
              <img
                src={trackBackgroundEnabled
                  ? (isDarkMode ? RainbowModeDarkColorless : RainbowModeLightColorless)
                  : (isDarkMode ? RainbowModeDark : RainbowModeLight)
                }
                alt=""
                className="track-bg-toggle-icon"
              />
            </button>
          </div>
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

        <div className="track-container">
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
                instruments={song.instrument}
                trackBackgroundEnabled={trackBackgroundEnabled}
                isTargetTrack={targetTrackId === trackId}
                onToggleLineFromCursor={onToggleLineFromCursor}
                currentColumn={currentTrackColumn}
                setCurrentColumn={setCurrentTrackColumn}
                focusRevision={trackFocusRevision}
                onPreviewMidiNoteOn={onPreviewMidiNoteOn}
                onPreviewMidiNoteOff={onPreviewMidiNoteOff}
                onHardStopLivePreview={onHardStopLivePreview}
                onRegisterStopPreview={onRegisterTrackStopPreview}
                tickIntervalMs={tickIntervalMs}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

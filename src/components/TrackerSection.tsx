import { Formatter } from '../utils/format/formatters.ts';
import React from 'react';
import type { NavigationSection } from '../constants/navigation.ts';
import type { Pattern, Instrument, Song } from '../synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../constants/music.ts';
import { DEFAULT_SONG_FRAME } from '../constants/song.ts';
import { TrackPanel } from './TrackPanel.tsx';
import { selectionRangeForTrack, type TrackSelection } from '../utils/track/trackSelection.ts';
import type { SoundEngine } from '../synth/soundEngine.ts';
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
  ym2149: SoundEngine | null;
  currentInstrument: Instrument;
  targetTrackId: 'A' | 'B' | 'C';
  onToggleLineFromCursor: (lineIndex: number) => void;
  onToggleLineFromStart: (lineIndex: number) => void;
  onToggleSongFromCursor: (lineIndex: number) => void;
  onToggleSongFromStart: (lineIndex: number) => void;
  currentTrackColumn: 'note' | 'volume';
  setCurrentTrackColumn: (column: 'note' | 'volume') => void;
  trackFocusRevision: number;
  onPreviewMidiNoteOn: (
    ymChannel: number,
    instrument: Instrument,
    note: string,
    octave: number,
  ) => void;
  onPreviewMidiNoteOff: (ymChannel: number) => void;
  onHardStopLivePreview?: (ymChannel: number) => void;
  onRegisterTrackStopPreview?: (trackId: 'A' | 'B' | 'C', stopPreview: () => void) => void;
  trackSelection: TrackSelection | null;
  onExtendSelection: (trackId: 'A' | 'B' | 'C', delta: number) => void;
  onNavigateSongLine: (delta: number) => void;
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
  onToggleLineFromStart,
  onToggleSongFromCursor,
  onToggleSongFromStart,
  currentTrackColumn,
  setCurrentTrackColumn,
  trackFocusRevision,
  onPreviewMidiNoteOn,
  onPreviewMidiNoteOff,
  onHardStopLivePreview,
  onRegisterTrackStopPreview,
  trackSelection,
  onExtendSelection,
  onNavigateSongLine,
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
    <div className="left-column" role="region" aria-label="Pattern editor">
      <div className="left-column-content">
        <div className="position-block">
          <div className="position-header">
            <button
              type="button"
              className={`track-bg-toggle ${trackBackgroundEnabled ? 'enabled' : 'disabled'}`}
              onClick={onToggleTrackBackground}
              onMouseDown={(event) => event.preventDefault()}
              title={
                trackBackgroundEnabled
                  ? 'Disable track background colors'
                  : 'Enable track background colors'
              }
              aria-label={
                trackBackgroundEnabled
                  ? 'Disable track background colors'
                  : 'Enable track background colors'
              }
            >
              <img
                src={
                  trackBackgroundEnabled
                    ? isDarkMode
                      ? RainbowModeDarkColorless
                      : RainbowModeLightColorless
                    : isDarkMode
                      ? RainbowModeDark
                      : RainbowModeLight
                }
                alt=""
                className="track-bg-toggle-icon"
              />
            </button>
          </div>
          <div
            className="position-content"
            role="group"
            aria-label="Pattern row positions"
            onScroll={onPositionScroll}
          >
            {positionIndices.map((i) => (
              <div
                key={i}
                className={`position-number ${i === sharedCurrentLine ? 'current' : ''}`}
                role="button"
                aria-label={`Go to position ${Formatter.hex(i)}`}
                onClick={() => onLineChange(i)}
              >
                {Formatter.hex(i)}
              </div>
            ))}
          </div>
        </div>

        <div className="track-container">
          <div className="tracks-row" role="group" aria-label="Pattern tracks">
            {(['A', 'B', 'C'] as const).map((trackId) => (
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
                onToggleLineFromStart={onToggleLineFromStart}
                onToggleSongFromCursor={onToggleSongFromCursor}
                onToggleSongFromStart={onToggleSongFromStart}
                currentColumn={currentTrackColumn}
                setCurrentColumn={setCurrentTrackColumn}
                focusRevision={trackFocusRevision}
                onPreviewMidiNoteOn={onPreviewMidiNoteOn}
                onPreviewMidiNoteOff={onPreviewMidiNoteOff}
                onHardStopLivePreview={onHardStopLivePreview}
                onRegisterStopPreview={onRegisterTrackStopPreview}
                selection={selectionRangeForTrack(trackSelection, trackId, patternLength)}
                onExtendSelection={(delta) => onExtendSelection(trackId, delta)}
                onNavigateSongLine={onNavigateSongLine}
                tickIntervalMs={tickIntervalMs}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

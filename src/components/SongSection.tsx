import React from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Instrument, Song } from '../synth/SoundDriver';
import { InformationPanel } from './InformationPanel';
import { PlaylistPanel } from './PlaylistPanel';
import { InstrumentPanel } from './InstrumentSection';
import { DumpPanel } from './DumpPanel';
import { EQPanel } from './EQPanel';
import { YM2149 } from '../synth/YM2149';

interface SongSectionProps {
  song: Song;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  updateSong: (patch: Partial<Song>) => void;
  clampedPlaybackPosition: number;
  onPositionSelect: (position: number) => void;
  onPlaylistChange: (playlist: Song['line']) => void;
  onCreatePatternAt: (lineIndex: number, track: 'A' | 'B' | 'C') => void;
  targetTrackId: 'A' | 'B' | 'C';
  currentInstrument: Instrument;
  onSelectInstrument: (instrument: Instrument) => void;
  onRenameInstrument: (name: string) => void;
  onMoveInstrument: (index: number, direction: 'up' | 'down') => void;
  onOpenInstrumentMidi: (instrument: Instrument) => void;
  onOpenInstrumentColor: (instrument: Instrument) => void;
  instrumentPanelFocusRevision: number;
  ym2149: YM2149 | null;
  channelMutes: boolean[];
  onToggleChannelMute: (index: number) => void;
}

export const SongSection: React.FC<SongSectionProps> = ({
  song,
  activeSection,
  setActiveSection,
  updateSong,
  clampedPlaybackPosition,
  onPositionSelect,
  onPlaylistChange,
  onCreatePatternAt,
  targetTrackId,
  currentInstrument,
  onSelectInstrument,
  onRenameInstrument,
  onMoveInstrument,
  onOpenInstrumentMidi,
  onOpenInstrumentColor,
  instrumentPanelFocusRevision,
  ym2149,
  channelMutes,
  onToggleChannelMute,
}) => {
  return (
    <div className="right-column">
      <InformationPanel
        song={song}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onChange={updateSong}
      />

      <PlaylistPanel
        playlist={song.line}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onPlaylistChange={onPlaylistChange}
        currentPlaybackPosition={clampedPlaybackPosition}
        onPositionSelect={onPositionSelect}
        onCreatePatternAt={onCreatePatternAt}
        targetTrack={targetTrackId}
      />

      <InstrumentPanel
        instruments={song.instrument}
        currentInstrument={currentInstrument}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onSelectInstrument={onSelectInstrument}
        onRenameInstrument={onRenameInstrument}
        onMoveInstrument={onMoveInstrument}
        onOpenInstrumentMidi={onOpenInstrumentMidi}
        onOpenInstrumentColor={onOpenInstrumentColor}
        focusRevision={instrumentPanelFocusRevision}
      />

      <div className="monitor-panel">
        <DumpPanel ym2149={ym2149} />
        <EQPanel ym2149={ym2149} channelMutes={channelMutes} onToggleChannelMute={onToggleChannelMute} />
      </div>
    </div>
  );
};

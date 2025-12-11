import React from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Instrument, Song } from '../synth/SoundDriver';
import { SongInfoPanel } from './SongInfoPanel';
import { PlaylistPanel } from './PlaylistPanel';
import { InstrumentListPanel } from './InstrumentListPanel';
import { DumpPanel } from './DumpPanel';
import { EQPanel } from './EQPanel';
import { YM2149 } from '../synth/YM2149';

interface InfoSectionProps {
  song: Song;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  updateSong: (patch: Partial<Song>) => void;
  clampedPlaybackPosition: number;
  onPositionSelect: (position: number) => void;
  onPlaylistChange: (playlist: Song['playlist']) => void;
  onCreatePatternAt: (lineIndex: number, track: 'A' | 'B' | 'C') => void;
  targetTrackId: 'A' | 'B' | 'C';
  currentInstrument: Instrument;
  onSelectInstrument: (instrument: Instrument) => void;
  onRenameInstrument: (name: string) => void;
  onMoveInstrument: (index: number, direction: 'up' | 'down') => void;
  onOpenInstrumentMidi: (instrument: Instrument) => void;
  onOpenInstrumentColor: (instrument: Instrument) => void;
  instrumentListFocusRevision: number;
  ym2149: YM2149 | null;
  channelMutes: boolean[];
  onToggleChannelMute: (index: number) => void;
}

export const InfoSection: React.FC<InfoSectionProps> = ({
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
  instrumentListFocusRevision,
  ym2149,
  channelMutes,
  onToggleChannelMute,
}) => {
  return (
    <div className="right-column">
      <SongInfoPanel
        song={song}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onChange={updateSong}
      />

      <PlaylistPanel
        playlist={song.playlist}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onPlaylistChange={onPlaylistChange}
        currentPlaybackPosition={clampedPlaybackPosition}
        onPositionSelect={onPositionSelect}
        onCreatePatternAt={onCreatePatternAt}
        targetTrack={targetTrackId}
      />

      <InstrumentListPanel
        instruments={song.instruments}
        currentInstrument={currentInstrument}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onSelectInstrument={onSelectInstrument}
        onRenameInstrument={onRenameInstrument}
        onMoveInstrument={onMoveInstrument}
        onOpenInstrumentMidi={onOpenInstrumentMidi}
        onOpenInstrumentColor={onOpenInstrumentColor}
        focusRevision={instrumentListFocusRevision}
      />

      <div className="monitor-panel">
        <DumpPanel ym2149={ym2149} />
        <EQPanel ym2149={ym2149} channelMutes={channelMutes} onToggleChannelMute={onToggleChannelMute} />
      </div>
    </div>
  );
};

import React from 'react';
import type { NavigationSection } from '../../constants/navigation.ts';
import type { Instrument, Song, SongChannelId } from '../../synth/SoundDriver.ts';
import type { PlaylistEntry } from '../../types/playlist.ts';
import { mapSongLineToPlaylistEntries } from '../../types/playlist.ts';
import { InformationPanel } from './InformationPanel.tsx';
import { PlaylistPanel } from '../playlist/PlaylistPanel.tsx';
import { InstrumentPanel } from './InstrumentSection.tsx';
import { DumpPanel } from './DumpPanel.tsx';
import { EQPanel } from './EQPanel.tsx';
import type { SoundEngine } from '../../synth/soundEngine.ts';

interface SongSectionProps {
  song: Song;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  updateSong: (patch: Partial<Song>) => void;
  clampedPlaybackPosition: number;
  onPositionSelect: (position: number) => void;
  onPlaylistChange: (playlist: PlaylistEntry[]) => void;
  onCreatePatternAt: (lineIndex: number, track: SongChannelId) => void;
  targetTrackId: SongChannelId;
  tracks: readonly SongChannelId[];
  sharedCurrentLine: number;
  onToggleLineFromStart: (lineIndex: number) => void;
  onToggleSongFromCursor: (lineIndex: number) => void;
  onToggleSongFromStart: (lineIndex: number) => void;
  currentInstrument: Instrument;
  onSelectInstrument: (instrument: Instrument) => void;
  onRenameInstrument: (name: string) => void;
  onMoveInstrument: (index: number, direction: 'up' | 'down') => void;
  onOpenInstrumentMidi: (instrument: Instrument) => void;
  onOpenInstrumentColor: (instrument: Instrument) => void;
  instrumentPanelFocusRevision: number;
  playlistFocusRevision: number;
  ym2149: SoundEngine | null;
  ym2149b?: SoundEngine | null;
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
  tracks,
  sharedCurrentLine,
  onToggleLineFromStart,
  onToggleSongFromCursor,
  onToggleSongFromStart,
  currentInstrument,
  onSelectInstrument,
  onRenameInstrument,
  onMoveInstrument,
  onOpenInstrumentMidi,
  onOpenInstrumentColor,
  instrumentPanelFocusRevision,
  playlistFocusRevision,
  ym2149,
  ym2149b,
  channelMutes,
  onToggleChannelMute,
}) => {
  const playlistEntries = mapSongLineToPlaylistEntries(song.line);

  return (
    <div className="right-column" role="region" aria-label="Song and instruments">
      <InformationPanel
        song={song}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onChange={updateSong}
      />

      <PlaylistPanel
        playlist={playlistEntries}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onPlaylistChange={onPlaylistChange}
        currentPlaybackPosition={clampedPlaybackPosition}
        onPositionSelect={onPositionSelect}
        onCreatePatternAt={onCreatePatternAt}
        targetTrack={targetTrackId}
        tracks={tracks}
        sharedCurrentLine={sharedCurrentLine}
        focusRevision={playlistFocusRevision}
        onToggleLineFromStart={onToggleLineFromStart}
        onToggleSongFromCursor={onToggleSongFromCursor}
        onToggleSongFromStart={onToggleSongFromStart}
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
        <DumpPanel ym2149={ym2149} ym2149b={ym2149b} />
        <EQPanel
          ym2149={ym2149}
          ym2149b={ym2149b}
          channelMutes={channelMutes}
          onToggleChannelMute={onToggleChannelMute}
        />
      </div>
    </div>
  );
};

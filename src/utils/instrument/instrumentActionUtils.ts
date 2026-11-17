import type { NavigationSection } from '../../constants/navigation.ts';
import type { SongChannelId } from '../../synth/SoundDriver.ts';
import { SONG_CHANNEL_IDS } from '../../constants/song.ts';

const TRACK_SECTION_CHANNEL: Record<string, SongChannelId> = {
  trackA: 'A',
  trackB: 'B',
  trackC: 'C',
  trackD: 'D',
  trackE: 'E',
  trackF: 'F',
};

export function getInstrumentPlaybackChannel(
  activeSection: NavigationSection,
  lastTrackId: SongChannelId,
): number {
  const channelId = TRACK_SECTION_CHANNEL[activeSection] ?? lastTrackId;
  const index = SONG_CHANNEL_IDS.indexOf(channelId);
  return index >= 0 ? index : 0;
}

export interface InstrumentRemovalSummaryArgs {
  slotId: string;
  slotName: string;
  modeLabel: string;
  patternsBeforeLabel: string;
  notesBeforeLabel: string;
  patternsBefore: number;
  notesBefore: number;
  patternsChanged: number;
  notesCleared: number;
}

export function buildInstrumentRemovalSummary({
  slotId,
  slotName,
  modeLabel,
  patternsBeforeLabel,
  notesBeforeLabel,
  patternsBefore,
  notesBefore,
  patternsChanged,
  notesCleared,
}: InstrumentRemovalSummaryArgs): string {
  const idLabel = slotId.trim() || '--';
  const nameLabel = slotName || '';

  const lines: string[] = [];
  lines.push('Instrument removal complete.');
  lines.push('');
  lines.push(`Instrument: ${idLabel}${nameLabel ? ` (${nameLabel})` : ''}`);
  lines.push(`Mode: ${modeLabel}`);
  lines.push('');
  lines.push(`${patternsBeforeLabel}: ${patternsBefore}`);
  lines.push(`${notesBeforeLabel}: ${notesBefore}`);
  lines.push('');
  lines.push(`Patterns changed in this operation: ${patternsChanged}`);
  lines.push(`Notes cleared in this operation: ${notesCleared}`);

  return lines.join('\n');
}

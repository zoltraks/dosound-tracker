import type { NavigationSection } from '../constants/navigation';

export function getInstrumentPlaybackChannel(
  activeSection: NavigationSection,
  lastTrackId: 'A' | 'B' | 'C'
): 0 | 1 | 2 {
  if (activeSection === 'trackA') return 0;
  if (activeSection === 'trackB') return 1;
  if (activeSection === 'trackC') return 2;

  return lastTrackId === 'B' ? 1 : lastTrackId === 'C' ? 2 : 0;
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

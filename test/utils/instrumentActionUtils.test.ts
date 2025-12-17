import { describe, expect, it } from 'vitest';
import {
  buildInstrumentRemovalSummary,
  getInstrumentPlaybackChannel,
} from '../../src/utils/instrumentActionUtils';

describe('instrumentActionUtils', () => {
  it('getInstrumentPlaybackChannel returns channel for active track sections', () => {
    expect(getInstrumentPlaybackChannel('trackA', 'A')).toBe(0);
    expect(getInstrumentPlaybackChannel('trackB', 'A')).toBe(1);
    expect(getInstrumentPlaybackChannel('trackC', 'A')).toBe(2);
  });

  it('getInstrumentPlaybackChannel falls back to lastTrackId when not in a track section', () => {
    expect(getInstrumentPlaybackChannel('instrumentList', 'A')).toBe(0);
    expect(getInstrumentPlaybackChannel('instrumentList', 'B')).toBe(1);
    expect(getInstrumentPlaybackChannel('instrumentList', 'C')).toBe(2);
  });

  it('buildInstrumentRemovalSummary matches expected formatting', () => {
    const summary = buildInstrumentRemovalSummary({
      slotId: '0A',
      slotName: 'Lead',
      modeLabel: 'Clear instrument only (keep notes).',
      patternsBeforeLabel: 'Patterns that reference this instrument',
      notesBeforeLabel: 'Notes that reference this instrument',
      patternsBefore: 2,
      notesBefore: 5,
      patternsChanged: 0,
      notesCleared: 0,
    });

    expect(summary).toBe(
      [
        'Instrument removal complete.',
        '',
        'Instrument: 0A (Lead)',
        'Mode: Clear instrument only (keep notes).',
        '',
        'Patterns that reference this instrument: 2',
        'Notes that reference this instrument: 5',
        '',
        'Patterns changed in this operation: 0',
        'Notes cleared in this operation: 0',
      ].join('\n')
    );
  });

  it('buildInstrumentRemovalSummary trims slot id and omits name when empty', () => {
    const summary = buildInstrumentRemovalSummary({
      slotId: '  ',
      slotName: '',
      modeLabel: 'Delete notes using this instrument and clear slot.',
      patternsBeforeLabel: 'Patterns with this instrument before delete',
      notesBeforeLabel: 'Notes using this instrument before delete',
      patternsBefore: 0,
      notesBefore: 0,
      patternsChanged: 1,
      notesCleared: 3,
    });

    expect(summary).toContain('Instrument: --');
    expect(summary).not.toContain('(--');
  });
});

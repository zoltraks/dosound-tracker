import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackPanel } from '../../src/components/TrackPanel';
import type { Pattern, Instrument } from '../../src/synth/SoundDriver';
import type { NavigationSection } from '../../src/constants/navigation';

const createTestPattern = (): Pattern => ({
  id: '00',
  name: 'Test Pattern',
  lines: [
    {
      trackA: { note: 'C', octave: 4, instrument: '00' },
      trackB: null,
      trackC: null,
      volume: null,
    },
    {
      trackA: null,
      trackB: null,
      trackC: null,
      volume: null,
    },
  ],
});

const createTestInstrument = (): Instrument => ({
  id: '00',
  name: 'Test Instrument',
  volume: [0x0f],
  arpeggio: [0],
  pitch: [0],
  noiseEnvelope: [0],
  mode: [0],
});

describe('TrackPanel', () => {
  it('renders track lines with note and volume columns', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();

    const handleLineChange = vi.fn();
    const handlePatternChange = vi.fn();
    const handleToggleLineFromCursor = vi.fn();
    const setActiveSection = vi.fn();
    const setCurrentColumn = vi.fn();

    render(
      <TrackPanel
        trackId="A"
        activeSection={'trackA' as NavigationSection}
        setActiveSection={setActiveSection}
        currentOctave={4}
        currentLine={0}
        patternLength={pattern.lines.length}
        onLineChange={handleLineChange}
        pattern={pattern}
        onPatternChange={handlePatternChange}
        ym2149={null}
        currentInstrumentData={instrument}
        instruments={[instrument]}
        isTargetTrack={true}
        onToggleLineFromCursor={handleToggleLineFromCursor}
        currentColumn="note"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />
    );

    // Header shows track id and volume
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText(/VOL/i)).toBeTruthy();

    // First line should display the C-4 note with instrument 00
    expect(screen.getByText('C-4 00')).toBeTruthy();
  });

  it('changes active line when a line is clicked', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();

    const handleLineChange = vi.fn();
    const handlePatternChange = vi.fn();
    const handleToggleLineFromCursor = vi.fn();
    const setActiveSection = vi.fn();
    const setCurrentColumn = vi.fn();

    const { container } = render(
      <TrackPanel
        trackId="A"
        activeSection={'trackA' as NavigationSection}
        setActiveSection={setActiveSection}
        currentOctave={4}
        currentLine={0}
        patternLength={pattern.lines.length}
        onLineChange={handleLineChange}
        pattern={pattern}
        onPatternChange={handlePatternChange}
        ym2149={null}
        currentInstrumentData={instrument}
        instruments={[instrument]}
        isTargetTrack={true}
        onToggleLineFromCursor={handleToggleLineFromCursor}
        currentColumn="note"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />
    );

    const lineElements = container.querySelectorAll('.track-line');
    const secondLine = lineElements[1] as HTMLElement;

    fireEvent.click(secondLine);

    expect(handleLineChange).toHaveBeenCalledWith(1);
  });
});

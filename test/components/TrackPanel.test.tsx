import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackPanel } from '../../src/components/TrackPanel';
import type { Pattern, Instrument } from '../../src/synth/SoundDriver';
import type { NavigationSection } from '../../src/constants/navigation';

const createTestPattern = (): Pattern => ({
  id: '00',
  name: 'Test Pattern',
  step: [
    {
      note: { note: 'C', octave: 4, instrument: '00' },
      volume: null,
    },
    {
      note: null,
      volume: null,
    },
  ],
});

const createTestInstrument = (): Instrument => ({
  id: '00',
  name: 'Test Instrument',
  volume: [0x0f],
  shift: [0],
  pitch: [0],
  noise: [0],
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
        patternLength={pattern.step.length}
        onLineChange={handleLineChange}
        pattern={pattern}
        onPatternChange={handlePatternChange}
        ym2149={null}
        currentInstrumentData={instrument}
        instruments={[instrument]}
        trackBackgroundEnabled={true}
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

  it('inserts note input even when volume column is active', () => {
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
        patternLength={pattern.step.length}
        onLineChange={handleLineChange}
        pattern={pattern}
        onPatternChange={handlePatternChange}
        ym2149={null}
        currentInstrumentData={instrument}
        instruments={[instrument]}
        trackBackgroundEnabled={true}
        isTargetTrack={true}
        onToggleLineFromCursor={handleToggleLineFromCursor}
        currentColumn="volume"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });

    expect(handlePatternChange).toHaveBeenCalledTimes(1);
    const updatedPattern = handlePatternChange.mock.calls[0]?.[0] as Pattern;
    expect(updatedPattern.step[0]?.note).toEqual({ note: 'C', octave: 4, instrument: '00' });
    expect(handleLineChange).toHaveBeenCalledWith(1);
  });

  it('sets volume nibble when volume column is active', () => {
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
        patternLength={pattern.step.length}
        onLineChange={handleLineChange}
        pattern={pattern}
        onPatternChange={handlePatternChange}
        ym2149={null}
        currentInstrumentData={instrument}
        instruments={[instrument]}
        trackBackgroundEnabled={true}
        isTargetTrack={true}
        onToggleLineFromCursor={handleToggleLineFromCursor}
        currentColumn="volume"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'a' });

    expect(handlePatternChange).toHaveBeenCalledTimes(1);
    const updatedPattern = handlePatternChange.mock.calls[0]?.[0] as Pattern;
    expect(updatedPattern.step[0]?.volume).toBe(10);
    expect(handleLineChange).toHaveBeenCalledWith(1);
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
        patternLength={pattern.step.length}
        onLineChange={handleLineChange}
        pattern={pattern}
        onPatternChange={handlePatternChange}
        ym2149={null}
        currentInstrumentData={instrument}
        instruments={[instrument]}
        trackBackgroundEnabled={true}
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

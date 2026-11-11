import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TrackPanel } from '../../src/components/TrackPanel.tsx';
import type { Pattern, Instrument } from '../../src/synth/SoundDriver.ts';
import type { YM2149 } from '../../src/synth/YM2149.ts';
import type { NavigationSection } from '../../src/constants/navigation.ts';

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
  afterEach(() => cleanup());

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
        onToggleLineFromStart={vi.fn()}
        currentColumn="note"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />,
    );

    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText(/VOL/i)).toBeTruthy();

    expect(screen.getByText('C-4 00')).toBeTruthy();
  });

  it('ignores note keys when volume column is active', () => {
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
        onToggleLineFromStart={vi.fn()}
        currentColumn="volume"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });

    expect(handlePatternChange).not.toHaveBeenCalled();
    expect(handleLineChange).not.toHaveBeenCalled();
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
        onToggleLineFromStart={vi.fn()}
        currentColumn="volume"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'a' });

    expect(handlePatternChange).toHaveBeenCalledTimes(1);
    const updatedPattern = handlePatternChange.mock.calls[0]?.[0] as Pattern;
    expect(updatedPattern.step[0]?.volume).toBe(10);
    expect(handleLineChange).toHaveBeenCalledWith(1);
  });

  it('treats a hex letter key as volume in the volume column', () => {
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
        currentLine={1}
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
        onToggleLineFromStart={vi.fn()}
        currentColumn="volume"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    // 'C' is both a note key and the hex value 0x0C; in the volume column it sets volume.
    fireEvent.keyDown(panel, { key: 'c' });

    expect(handlePatternChange).toHaveBeenCalledTimes(1);
    const updatedPattern = handlePatternChange.mock.calls[0]?.[0] as Pattern;
    expect(updatedPattern.step[1]?.volume).toBe(12);
    expect(updatedPattern.step[1]?.note).toBeFalsy();
  });

  it('enters a note when the note column is active', () => {
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
        onToggleLineFromStart={vi.fn()}
        currentColumn="note"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });

    expect(handlePatternChange).toHaveBeenCalledTimes(1);
    const updatedPattern = handlePatternChange.mock.calls[0]?.[0] as Pattern;
    expect(updatedPattern.step[0]?.note).toEqual({ note: 'C', octave: 4, instrument: '00' });
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
        onToggleLineFromStart={vi.fn()}
        currentColumn="note"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />,
    );

    const lineElements = container.querySelectorAll('.track-line');
    const secondLine = lineElements[1] as HTMLElement;

    fireEvent.click(secondLine);

    expect(handleLineChange).toHaveBeenCalledWith(1);
  });

  it('routes Enter and Ctrl+Enter to the matching line play toggle', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();

    const handleToggleLineFromCursor = vi.fn();
    const handleToggleLineFromStart = vi.fn();

    const { container } = render(
      <TrackPanel
        trackId="A"
        activeSection={'trackA' as NavigationSection}
        setActiveSection={vi.fn()}
        currentOctave={4}
        currentLine={5}
        patternLength={pattern.step.length}
        onLineChange={vi.fn()}
        pattern={pattern}
        onPatternChange={vi.fn()}
        ym2149={null}
        currentInstrumentData={instrument}
        instruments={[instrument]}
        trackBackgroundEnabled={true}
        isTargetTrack={true}
        onToggleLineFromCursor={handleToggleLineFromCursor}
        onToggleLineFromStart={handleToggleLineFromStart}
        currentColumn="note"
        setCurrentColumn={vi.fn()}
        focusRevision={0}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;

    fireEvent.keyDown(panel, { key: 'Enter' });
    expect(handleToggleLineFromCursor).toHaveBeenCalledWith(5);
    expect(handleToggleLineFromStart).not.toHaveBeenCalled();

    fireEvent.keyDown(panel, { key: 'Enter', ctrlKey: true });
    expect(handleToggleLineFromStart).toHaveBeenCalledWith(5);
    expect(handleToggleLineFromCursor).toHaveBeenCalledTimes(1);
  });

  const createYm2149Mock = () => {
    const writeRegister = vi.fn();
    const ym = {
      writeRegister,
      updateChannelWithInstrument: vi.fn(),
    } as unknown as YM2149;
    return { ym, writeRegister };
  };

  const createPanelProps = (pattern: Pattern, instrument: Instrument, ym: YM2149 | null) => ({
    trackId: 'A' as const,
    setActiveSection: vi.fn(),
    currentOctave: 4,
    currentLine: 0,
    patternLength: pattern.step.length,
    onLineChange: vi.fn(),
    pattern,
    onPatternChange: vi.fn(),
    ym2149: ym,
    currentInstrumentData: instrument,
    instruments: [instrument],
    trackBackgroundEnabled: true,
    isTargetTrack: true,
    onToggleLineFromCursor: vi.fn(),
    onToggleLineFromStart: vi.fn(),
    currentColumn: 'note' as const,
    setCurrentColumn: vi.fn(),
    focusRevision: 0,
  });

  it('does not zero the channel register when no preview ever ran', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const { ym, writeRegister } = createYm2149Mock();
    const props = createPanelProps(pattern, instrument, ym);

    const { rerender } = render(
      <TrackPanel {...props} activeSection={'piano' as NavigationSection} />,
    );

    try {
      expect(writeRegister).not.toHaveBeenCalled();

      rerender(<TrackPanel {...props} activeSection={'trackA' as NavigationSection} />);
      rerender(<TrackPanel {...props} activeSection={'piano' as NavigationSection} />);

      expect(writeRegister).not.toHaveBeenCalled();
    } catch (error) {
      console.log('guarded stop mismatch', writeRegister.mock.calls);
      throw error;
    }
  });

  it('stops a live preview when the section flips away', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const { ym, writeRegister } = createYm2149Mock();
    const props = createPanelProps(pattern, instrument, ym);

    const { container, rerender } = render(
      <TrackPanel {...props} activeSection={'trackA' as NavigationSection} />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });

    try {
      rerender(<TrackPanel {...props} activeSection={'piano' as NavigationSection} />);
      expect(writeRegister).toHaveBeenCalledWith(0x08, 0x00);
    } catch (error) {
      console.log('live stop mismatch', writeRegister.mock.calls);
      throw error;
    }
  });
});

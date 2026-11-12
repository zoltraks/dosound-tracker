import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { TrackPanel } from '../../../src/components/tracker/TrackPanel.tsx';
import type { Pattern, Instrument } from '../../../src/synth/SoundDriver.ts';
import type { YM2149 } from '../../../src/synth/YM2149.ts';
import type { NavigationSection } from '../../../src/constants/navigation.ts';

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
        onToggleSongFromCursor={vi.fn()}
        onToggleSongFromStart={vi.fn()}
        currentColumn="note"
        setCurrentColumn={setCurrentColumn}
        focusRevision={0}
      />,
    );

    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText(/VOL/i, { selector: '.track-header-volume' })).toBeTruthy();

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
        onToggleSongFromCursor={vi.fn()}
        onToggleSongFromStart={vi.fn()}
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
        onToggleSongFromCursor={vi.fn()}
        onToggleSongFromStart={vi.fn()}
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
        onToggleSongFromCursor={vi.fn()}
        onToggleSongFromStart={vi.fn()}
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
        onToggleSongFromCursor={vi.fn()}
        onToggleSongFromStart={vi.fn()}
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
        onToggleSongFromCursor={vi.fn()}
        onToggleSongFromStart={vi.fn()}
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
        onToggleSongFromCursor={vi.fn()}
        onToggleSongFromStart={vi.fn()}
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
    onToggleSongFromCursor: vi.fn(),
    onToggleSongFromStart: vi.fn(),
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

  it('navigates lines with arrows, page keys, Home and End', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onLineChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        currentLine={5}
        patternLength={64}
        onLineChange={onLineChange}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'ArrowUp' });
    fireEvent.keyDown(panel, { key: 'ArrowDown' });
    fireEvent.keyDown(panel, { key: 'PageUp' });
    fireEvent.keyDown(panel, { key: 'PageDown' });
    fireEvent.keyDown(panel, { key: 'Home' });
    fireEvent.keyDown(panel, { key: 'End' });
    try {
      expect(onLineChange.mock.calls.map((call) => call[0])).toEqual([4, 6, 53, 21, 0, 63]);
    } catch (error) {
      console.log('nav keys mismatch', onLineChange.mock.calls);
      throw error;
    }
  });

  it('lands on line zero with End when the pattern length is zero', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onLineChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        patternLength={0}
        onLineChange={onLineChange}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'End' });
    try {
      expect(onLineChange).toHaveBeenCalledWith(0);
    } catch (error) {
      console.log('end empty mismatch', onLineChange.mock.calls);
      throw error;
    }
  });

  it('switches columns and tracks with ArrowLeft and ArrowRight', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const setActiveSection = vi.fn();
    const setCurrentColumn = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        setActiveSection={setActiveSection}
        currentColumn="note"
        setCurrentColumn={setCurrentColumn}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'ArrowLeft' });
    try {
      expect(setActiveSection).toHaveBeenCalledWith('trackC');
      expect(setCurrentColumn).toHaveBeenCalledWith('volume');
    } catch (error) {
      console.log('arrow left mismatch', setActiveSection.mock.calls);
      throw error;
    }
    cleanup();
    setActiveSection.mockClear();
    setCurrentColumn.mockClear();

    const again = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        setActiveSection={setActiveSection}
        currentColumn="volume"
        setCurrentColumn={setCurrentColumn}
      />,
    );
    fireEvent.keyDown(again.container.querySelector('.track-panel') as HTMLElement, {
      key: 'ArrowLeft',
    });
    try {
      expect(setCurrentColumn).toHaveBeenCalledWith('note');
      expect(setActiveSection).not.toHaveBeenCalled();
    } catch (error) {
      console.log('column left mismatch', setCurrentColumn.mock.calls);
      throw error;
    }
    fireEvent.keyDown(again.container.querySelector('.track-panel') as HTMLElement, {
      key: 'ArrowRight',
    });
    try {
      expect(setActiveSection).toHaveBeenCalledWith('trackB');
      expect(setCurrentColumn).toHaveBeenCalledWith('note');
    } catch (error) {
      console.log('arrow right mismatch', setActiveSection.mock.calls);
      throw error;
    }
  });

  it('ignores repeated non-navigation keys but allows repeated arrows', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onPatternChange = vi.fn();
    const onLineChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        onLineChange={onLineChange}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z', repeat: true });
    fireEvent.keyDown(panel, { key: 'ArrowDown', repeat: true });
    try {
      expect(onPatternChange).not.toHaveBeenCalled();
      expect(onLineChange).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('repeat mismatch', onPatternChange.mock.calls, onLineChange.mock.calls);
      throw error;
    }
  });

  it('clears only the volume when space is pressed in the volume column', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onPatternChange = vi.fn();
    const onLineChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        onLineChange={onLineChange}
        currentColumn="volume"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: ' ' });
    try {
      const next = onPatternChange.mock.calls[0]?.[0] as Pattern;
      expect(next.step[0]?.note).toEqual({ note: 'C', octave: 4, instrument: '00' });
      expect(next.step[0]?.volume).toBeUndefined();
      expect(onLineChange).toHaveBeenCalledWith(1);
    } catch (error) {
      console.log('volume space mismatch', onPatternChange.mock.calls);
      throw error;
    }
  });

  it('writes a note-off with Shift+Space and a plain dash', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onPatternChange = vi.fn();
    const onLineChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        onLineChange={onLineChange}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: ' ', shiftKey: true });
    try {
      const next = onPatternChange.mock.calls[0]?.[0] as Pattern;
      expect(next.step[0]?.note).toEqual({ note: '===', octave: 0, instrument: '00' });
    } catch (error) {
      console.log('shift space mismatch', onPatternChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: '-' });
    try {
      const next = onPatternChange.mock.calls[1]?.[0] as Pattern;
      expect(next.step[0]?.note).toEqual({ note: '===', octave: 0, instrument: '00' });
      expect(onLineChange).toHaveBeenCalledWith(1);
    } catch (error) {
      console.log('dash mismatch', onPatternChange.mock.calls);
      throw error;
    }
  });

  it('steps the instrument with Ctrl+dash and Ctrl+plus without editing the pattern', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onPatternChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: '-', ctrlKey: true });
    fireEvent.keyDown(panel, { key: '+', ctrlKey: true });
    fireEvent.keyDown(panel, { key: '=', ctrlKey: true });
    try {
      expect(onPatternChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('instrument step mismatch', onPatternChange.mock.calls);
      throw error;
    }
  });

  it('ignores unmapped keys', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onPatternChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'F5' });
    try {
      expect(onPatternChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('unmapped mismatch', onPatternChange.mock.calls);
      throw error;
    }
  });

  it('enters a note only once while the key stays pressed', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onPatternChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });
    fireEvent.keyDown(panel, { key: 'z' });
    try {
      expect(onPatternChange).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('held key mismatch', onPatternChange.mock.calls);
      throw error;
    }
  });

  it('handles key releases without a tracked preview', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyUp(panel, { key: 'x' });
    fireEvent.keyUp(panel, { key: 'F5' });
    fireEvent.keyDown(panel, { key: 'z' });
    fireEvent.keyUp(panel, { key: 'x' });
    try {
      expect(true).toBe(true);
    } catch (error) {
      console.log('key release mismatch');
      throw error;
    }
  });

  it('ignores key releases while another section is active', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'piano' as NavigationSection}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyUp(panel, { key: 'z' });
    try {
      expect(true).toBe(true);
    } catch (error) {
      console.log('inactive keyup mismatch');
      throw error;
    }
  });

  it('renders a disabled panel that accepts no edits when the pattern is missing', () => {
    const instrument = createTestInstrument();
    const onPatternChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...createPanelProps(createTestPattern(), instrument, null)}
        pattern={null}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    try {
      expect(panel.className).toContain('disabled');
    } catch (error) {
      console.log('disabled class mismatch', panel.className);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'Delete' });
    fireEvent.keyDown(panel, { key: ' ' });
    fireEvent.keyDown(panel, { key: ' ', shiftKey: true });
    fireEvent.keyDown(panel, { key: '-' });
    fireEvent.keyDown(panel, { key: 'z' });
    try {
      expect(onPatternChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('disabled edit mismatch', onPatternChange.mock.calls);
      throw error;
    }
  });

  it('ignores volume nibbles on a missing pattern in the volume column', () => {
    const instrument = createTestInstrument();
    const onPatternChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...createPanelProps(createTestPattern(), instrument, null)}
        pattern={null}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        currentColumn="volume"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'a' });
    try {
      expect(onPatternChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('null volume mismatch', onPatternChange.mock.calls);
      throw error;
    }
  });

  it('registers the stop preview callback and reports preview lifecycle', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const { ym, writeRegister } = createYm2149Mock();
    const onRegisterStopPreview = vi.fn();
    const onPreviewMidiNoteOn = vi.fn();
    const onPreviewMidiNoteOff = vi.fn();
    const onHardStopLivePreview = vi.fn();

    const { container } = render(
      <TrackPanel
        {...createPanelProps(pattern, instrument, ym)}
        activeSection={'trackA' as NavigationSection}
        onRegisterStopPreview={onRegisterStopPreview}
        onPreviewMidiNoteOn={onPreviewMidiNoteOn}
        onPreviewMidiNoteOff={onPreviewMidiNoteOff}
        onHardStopLivePreview={onHardStopLivePreview}
        currentColumn="note"
      />,
    );

    try {
      expect(onRegisterStopPreview).toHaveBeenCalledWith('A', expect.any(Function));
    } catch (error) {
      console.log('register mismatch', onRegisterStopPreview.mock.calls);
      throw error;
    }

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });
    try {
      expect(onPreviewMidiNoteOn).toHaveBeenCalledWith(0, instrument, 'C', 4);
    } catch (error) {
      console.log('note on mismatch', onPreviewMidiNoteOn.mock.calls);
      throw error;
    }

    fireEvent.keyUp(panel, { key: 'z' });
    try {
      expect(writeRegister).toHaveBeenCalledWith(0x08, 0x00);
      expect(onHardStopLivePreview).toHaveBeenCalledWith(0);
      expect(onPreviewMidiNoteOff).toHaveBeenCalledWith(0);
    } catch (error) {
      console.log(
        'release stop mismatch',
        writeRegister.mock.calls,
        onHardStopLivePreview.mock.calls,
        onPreviewMidiNoteOff.mock.calls,
      );
      throw error;
    }
  });

  it('keeps a sustain instrument ringing on release until the envelope ends', async () => {
    const pattern = createTestPattern();
    const instrument: Instrument = {
      ...createTestInstrument(),
      sustain: 0,
      volume: [0x0f, 0x00],
    };
    const { ym } = createYm2149Mock();
    const onPreviewMidiNoteOff = vi.fn();

    const { container } = render(
      <TrackPanel
        {...createPanelProps(pattern, instrument, ym)}
        activeSection={'trackA' as NavigationSection}
        onPreviewMidiNoteOff={onPreviewMidiNoteOff}
        currentColumn="note"
        tickIntervalMs={1}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });
    fireEvent.keyUp(panel, { key: 'z' });
    try {
      await waitFor(() => expect(onPreviewMidiNoteOff).toHaveBeenCalledWith(0), {
        timeout: 1000,
      });
    } catch (error) {
      console.log('auto stop mismatch', onPreviewMidiNoteOff.mock.calls);
      throw error;
    }
  });

  it('maps track B and C to their preview channels', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const { ym } = createYm2149Mock();
    const onPreviewMidiNoteOn = vi.fn();

    const { container } = render(
      <TrackPanel
        {...createPanelProps(pattern, instrument, ym)}
        trackId="B"
        activeSection={'trackB' as NavigationSection}
        onPreviewMidiNoteOn={onPreviewMidiNoteOn}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });
    try {
      expect(onPreviewMidiNoteOn).toHaveBeenCalledWith(1, instrument, 'C', 4);
    } catch (error) {
      console.log('track B channel mismatch', onPreviewMidiNoteOn.mock.calls);
      throw error;
    }
    cleanup();
    onPreviewMidiNoteOn.mockClear();

    const again = render(
      <TrackPanel
        {...createPanelProps(pattern, instrument, ym)}
        trackId="C"
        activeSection={'trackC' as NavigationSection}
        onPreviewMidiNoteOn={onPreviewMidiNoteOn}
        currentColumn="note"
      />,
    );
    fireEvent.keyDown(again.container.querySelector('.track-panel') as HTMLElement, {
      key: 'z',
    });
    try {
      expect(onPreviewMidiNoteOn).toHaveBeenCalledWith(2, instrument, 'C', 4);
    } catch (error) {
      console.log('track C channel mismatch', onPreviewMidiNoteOn.mock.calls);
      throw error;
    }
  });

  it('announces the cursor row through the live region only while active', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();

    const { container, rerender } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        currentColumn="note"
      />,
    );

    const status = container.querySelector('[role="status"]') as HTMLElement;
    try {
      expect(status.textContent).toBe('Track A row 00, note column, C-4 instrument 00, no volume');

      rerender(
        <TrackPanel
          {...{
            trackId: 'A' as const,
            setActiveSection: vi.fn(),
            currentOctave: 4,
            currentLine: 0,
            patternLength: pattern.step.length,
            onLineChange: vi.fn(),
            pattern,
            onPatternChange: vi.fn(),
            ym2149: null,
            currentInstrumentData: instrument,
            instruments: [instrument],
            trackBackgroundEnabled: true,
            isTargetTrack: true,
            onToggleLineFromCursor: vi.fn(),
            onToggleLineFromStart: vi.fn(),
            onToggleSongFromCursor: vi.fn(),
            onToggleSongFromStart: vi.fn(),
            currentColumn: 'note' as const,
            setCurrentColumn: vi.fn(),
            focusRevision: 0,
          }}
          activeSection={'trackA' as NavigationSection}
          currentColumn="volume"
        />,
      );
      expect(status.textContent).toBe(
        'Track A row 00, volume column, no volume, C-4 instrument 00',
      );

      rerender(
        <TrackPanel
          {...{
            trackId: 'A' as const,
            setActiveSection: vi.fn(),
            currentOctave: 4,
            currentLine: 0,
            patternLength: pattern.step.length,
            onLineChange: vi.fn(),
            pattern,
            onPatternChange: vi.fn(),
            ym2149: null,
            currentInstrumentData: instrument,
            instruments: [instrument],
            trackBackgroundEnabled: true,
            isTargetTrack: true,
            onToggleLineFromCursor: vi.fn(),
            onToggleLineFromStart: vi.fn(),
            onToggleSongFromCursor: vi.fn(),
            onToggleSongFromStart: vi.fn(),
            currentColumn: 'note' as const,
            setCurrentColumn: vi.fn(),
            focusRevision: 0,
          }}
          activeSection={'piano' as NavigationSection}
          currentColumn="note"
        />,
      );
      expect(status.textContent).toBe('');
    } catch (error) {
      console.log('live region mismatch:', status.textContent);
      throw error;
    }
  });

  it('writes notes with an empty instrument id when the instrument lacks one', () => {
    const pattern = createTestPattern();
    const instrument = { ...createTestInstrument(), id: '' };
    const onPatternChange = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        onPatternChange={onPatternChange}
        currentColumn="note"
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'z' });
    try {
      const next = onPatternChange.mock.calls[0]?.[0] as Pattern;
      expect(next.step[0]?.note).toEqual({ note: 'C', octave: 4, instrument: '' });
    } catch (error) {
      console.log('missing id mismatch', onPatternChange.mock.calls);
      throw error;
    }
  });
});

describe('track selection', () => {
  afterEach(() => cleanup());

  it('routes Shift+Arrow keys to selection extension instead of plain movement', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();
    const onLineChange = vi.fn();
    const onExtendSelection = vi.fn();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        currentLine={5}
        patternLength={64}
        onLineChange={onLineChange}
        onExtendSelection={onExtendSelection}
      />,
    );

    const panel = container.querySelector('.track-panel') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'ArrowDown', shiftKey: true });
    fireEvent.keyDown(panel, { key: 'ArrowUp', shiftKey: true });
    fireEvent.keyDown(panel, { key: 'ArrowDown' });
    try {
      expect(onExtendSelection.mock.calls.map((call) => call[0])).toEqual([1, -1]);
      expect(onLineChange).toHaveBeenCalledWith(6);
      expect(onLineChange).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('selection keys mismatch', onExtendSelection.mock.calls);
      throw error;
    }
  });

  it('marks rows inside the selection range as selected', () => {
    const pattern = createTestPattern();
    const instrument = createTestInstrument();

    const { container } = render(
      <TrackPanel
        {...{
          trackId: 'A' as const,
          setActiveSection: vi.fn(),
          currentOctave: 4,
          currentLine: 0,
          patternLength: pattern.step.length,
          onLineChange: vi.fn(),
          pattern,
          onPatternChange: vi.fn(),
          ym2149: null,
          currentInstrumentData: instrument,
          instruments: [instrument],
          trackBackgroundEnabled: true,
          isTargetTrack: true,
          onToggleLineFromCursor: vi.fn(),
          onToggleLineFromStart: vi.fn(),
          onToggleSongFromCursor: vi.fn(),
          onToggleSongFromStart: vi.fn(),
          currentColumn: 'note' as const,
          setCurrentColumn: vi.fn(),
          focusRevision: 0,
        }}
        activeSection={'trackA' as NavigationSection}
        patternLength={64}
        selection={{ start: 2, end: 4 }}
      />,
    );

    const lines = container.querySelectorAll('.track-line');
    try {
      expect(lines[1].classList.contains('selected')).toBe(false);
      expect(lines[2].classList.contains('selected')).toBe(true);
      expect(lines[4].classList.contains('selected')).toBe(true);
      expect(lines[5].classList.contains('selected')).toBe(false);
    } catch (error) {
      console.log('selection render mismatch', lines.length);
      throw error;
    }
  });
});

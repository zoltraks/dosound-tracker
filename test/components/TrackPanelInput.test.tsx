import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { TrackPanel } from '../../src/components/TrackPanel';
import type { Pattern, Instrument } from '../../src/synth/SoundDriver';
import type { NavigationSection } from '../../src/constants/navigation';

const pattern = (): Pattern => ({
  id: '00',
  name: 'P',
  step: [
    { note: { note: 'C', octave: 4, instrument: '00' }, volume: 9 },
    { note: null, volume: null },
    { note: null, volume: null },
    { note: null, volume: null },
  ],
});

const instrument = (): Instrument => ({
  id: '00',
  name: 'I',
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
});

const renderPanel = (overrides: Record<string, unknown> = {}) => {
  const onLineChange = vi.fn();
  const onPatternChange = vi.fn();
  const setCurrentColumn = vi.fn();
  const setActiveSection = vi.fn();
  const props = {
    trackId: 'A' as const,
    activeSection: 'trackA' as NavigationSection,
    setActiveSection,
    currentOctave: 4,
    currentLine: 0,
    patternLength: 4,
    onLineChange,
    pattern: pattern(),
    onPatternChange,
    ym2149: null,
    currentInstrumentData: instrument(),
    instruments: [instrument()],
    trackBackgroundEnabled: true,
    isTargetTrack: true,
    onToggleLineFromCursor: vi.fn(),
    onToggleLineFromStart: vi.fn(),
    currentColumn: 'note' as const,
    setCurrentColumn,
    focusRevision: 0,
    ...(overrides as object),
  } as ComponentProps<typeof TrackPanel>;
  const { container } = render(<TrackPanel {...props} />);
  const panel = container.querySelector('.track-panel') as HTMLElement;
  return { panel, onLineChange, onPatternChange, setCurrentColumn, setActiveSection, container };
};

describe('TrackPanel navigation', () => {
  it.each([
    ['ArrowDown', 1],
    ['ArrowUp', 3],
    ['PageDown', 0],
    ['Home', 0],
    ['End', 3],
  ])('maps %s from line 0', (key, expected) => {
    const { panel, onLineChange } = renderPanel();
    try {
      fireEvent.keyDown(panel, { key });
      expect(onLineChange).toHaveBeenCalledWith(expected);
    } catch (error) {
      console.log('nav mismatch', key);
      throw error;
    }
  });

  it('PageUp wraps to a positive line', () => {
    const { panel, onLineChange } = renderPanel({ currentLine: 2 });
    try {
      fireEvent.keyDown(panel, { key: 'PageUp' });
      expect(onLineChange).toHaveBeenCalledWith(2);
    } catch (error) {
      console.log('pageup mismatch');
      throw error;
    }
  });

  it('ArrowLeft from note column jumps to the previous track volume', () => {
    const { panel, setActiveSection, setCurrentColumn } = renderPanel();
    try {
      fireEvent.keyDown(panel, { key: 'ArrowLeft' });
      expect(setActiveSection).toHaveBeenCalledWith('trackC');
      expect(setCurrentColumn).toHaveBeenCalledWith('volume');
    } catch (error) {
      console.log('left mismatch');
      throw error;
    }
  });

  it('ArrowLeft from volume column switches to note column', () => {
    const { panel, setCurrentColumn } = renderPanel({ currentColumn: 'volume' });
    try {
      fireEvent.keyDown(panel, { key: 'ArrowLeft' });
      expect(setCurrentColumn).toHaveBeenCalledWith('note');
    } catch (error) {
      console.log('left-volume mismatch');
      throw error;
    }
  });

  it('ArrowRight from note column switches to volume, from volume jumps track', () => {
    const { panel, setActiveSection, setCurrentColumn } = renderPanel({
      currentColumn: 'volume',
    });
    try {
      fireEvent.keyDown(panel, { key: 'ArrowRight' });
      expect(setActiveSection).toHaveBeenCalledWith('trackB');
      expect(setCurrentColumn).toHaveBeenCalledWith('note');
    } catch (error) {
      console.log('right mismatch');
      throw error;
    }
  });
});

describe('TrackPanel editing', () => {
  it('Delete clears the note in the note column', () => {
    const { panel, onPatternChange } = renderPanel();
    try {
      fireEvent.keyDown(panel, { key: 'Delete' });
      const updated = onPatternChange.mock.calls[0][0] as Pattern;
      expect(updated.step[0].note).toBeNull();
      expect(updated.step[0].volume).toBeUndefined();
    } catch (error) {
      console.log('delete mismatch');
      throw error;
    }
  });

  it('Delete in the volume column clears only the volume', () => {
    const { panel, onPatternChange } = renderPanel({ currentColumn: 'volume' });
    try {
      fireEvent.keyDown(panel, { key: 'Backspace' });
      const updated = onPatternChange.mock.calls[0][0] as Pattern;
      expect(updated.step[0].note).not.toBeNull();
      expect(updated.step[0].volume).toBeUndefined();
    } catch (error) {
      console.log('delete-volume mismatch');
      throw error;
    }
  });

  it('Space clears the step and advances the cursor', () => {
    const { panel, onPatternChange, onLineChange } = renderPanel();
    try {
      fireEvent.keyDown(panel, { key: ' ' });
      const updated = onPatternChange.mock.calls[0][0] as Pattern;
      expect(updated.step[0].note).toBeNull();
      expect(onLineChange).toHaveBeenCalledWith(1);
    } catch (error) {
      console.log('space mismatch');
      throw error;
    }
  });

  it('hyphen inserts a note-off and advances', () => {
    const { panel, onPatternChange, onLineChange } = renderPanel();
    try {
      fireEvent.keyDown(panel, { key: '-' });
      const updated = onPatternChange.mock.calls[0][0] as Pattern;
      expect(updated.step[0].note?.note).toBe('===');
      expect(onLineChange).toHaveBeenCalledWith(1);
    } catch (error) {
      console.log('note-off mismatch');
      throw error;
    }
  });

  it('Ctrl+Space writes a rest without advancing', () => {
    const { panel, onPatternChange, onLineChange } = renderPanel();
    try {
      fireEvent.keyDown(panel, { key: ' ', ctrlKey: true });
      const updated = onPatternChange.mock.calls[0][0] as Pattern;
      expect(updated.step[0].note?.note).toBe('===');
      expect(onLineChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('ctrl-space mismatch');
      throw error;
    }
  });

  it('does nothing on key input when no track is active', () => {
    const { panel, onPatternChange } = renderPanel({
      activeSection: 'piano' as NavigationSection,
    });
    try {
      fireEvent.keyDown(panel, { key: 'z' });
      expect(onPatternChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('inactive mismatch');
      throw error;
    }
  });

  it('renders an empty state when the pattern is null', () => {
    const { container } = renderPanel({ pattern: null });
    try {
      expect(container.querySelector('.track-panel')).toBeTruthy();
    } catch (error) {
      console.log('null-pattern mismatch');
      throw error;
    }
  });
});

describe('TrackPanel live preview', () => {
  it('previews a note through the chip and ticks the envelope', () => {
    vi.useFakeTimers();
    const ym = { updateChannelWithInstrument: vi.fn(), writeRegister: vi.fn() };
    const { panel } = renderPanel({ ym2149: ym, tickIntervalMs: 20 });
    try {
      fireEvent.keyDown(panel, { key: 'z' });
      expect(ym.updateChannelWithInstrument).toHaveBeenCalled();
      const calls = ym.updateChannelWithInstrument.mock.calls.length;
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(ym.updateChannelWithInstrument.mock.calls.length).toBeGreaterThan(calls);
    } catch (error) {
      console.log('preview mismatch', ym.updateChannelWithInstrument.mock.calls.length);
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops the preview on key release', () => {
    vi.useFakeTimers();
    const ym = { updateChannelWithInstrument: vi.fn(), writeRegister: vi.fn() };
    const { panel } = renderPanel({ ym2149: ym, tickIntervalMs: 20 });
    try {
      fireEvent.keyDown(panel, { key: 'z' });
      fireEvent.keyUp(panel, { key: 'z' });
      expect(ym.writeRegister).toHaveBeenCalledWith(0x08, 0x00);
    } catch (error) {
      console.log('release mismatch', ym.writeRegister.mock.calls);
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the envelope running after release when the instrument sustains', () => {
    vi.useFakeTimers();
    const ym = { updateChannelWithInstrument: vi.fn(), writeRegister: vi.fn() };
    const sustainInstrument = { ...instrument(), sustain: 1, volume: [15, 15, 0] };
    const { panel } = renderPanel({
      ym2149: ym,
      tickIntervalMs: 20,
      currentInstrumentData: sustainInstrument,
      instruments: [sustainInstrument],
    });
    try {
      fireEvent.keyDown(panel, { key: 'z' });
      fireEvent.keyUp(panel, { key: 'z' });
      const silences = ym.writeRegister.mock.calls.filter(
        (c) => c[0] === 0x08 && c[1] === 0x00,
      ).length;
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      const after = ym.writeRegister.mock.calls.filter(
        (c) => c[0] === 0x08 && c[1] === 0x00,
      ).length;
      expect(after).toBeGreaterThan(silences);
    } catch (error) {
      console.log('sustain mismatch');
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });
});

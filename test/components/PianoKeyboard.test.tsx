import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { PianoKeyboard } from '../../src/components/PianoKeyboard.tsx';
import type { NavigationSection } from '../../src/constants/navigation.ts';
import type { Instrument } from '../../src/synth/SoundDriver.ts';

afterEach(() => cleanup());

type PanelProps = Parameters<typeof PianoKeyboard>[0];

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '03',
  name: 'bass',
  volume: [0x0f],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  ...overrides,
});

const renderPanel = (overrides: Partial<PanelProps> = {}) =>
  render(
    <PianoKeyboard
      activeSection={'piano' as NavigationSection}
      setActiveSection={vi.fn()}
      currentOctave={4}
      onOctaveChange={vi.fn()}
      ym2149={null}
      currentInstrument={makeInstrument()}
      previewChannel={0}
      onChangeBaseKey={vi.fn()}
      sharedCurrentLine={0}
      onToggleLineFromCursor={vi.fn()}
      onToggleLineFromStart={vi.fn()}
      onToggleSongFromCursor={vi.fn()}
      onToggleSongFromStart={vi.fn()}
      {...overrides}
    />,
  );

const getBoard = (container: HTMLElement) =>
  container.querySelector('.piano-keyboard') as HTMLElement;

describe('PianoKeyboard modifier discipline', () => {
  it('presses a key on a bare note key', () => {
    const { container } = renderPanel();
    fireEvent.keyDown(getBoard(container), { key: 'z' });
    try {
      expect(container.querySelector('.piano-key.pressed')).toBeTruthy();
    } catch (error) {
      console.log('bare note mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('does not press a key on modifier chords', () => {
    const { container } = renderPanel();
    const board = getBoard(container);
    fireEvent.keyDown(board, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(board, { key: 'z', metaKey: true });
    fireEvent.keyDown(board, { key: 'z', altKey: true });
    try {
      expect(container.querySelector('.piano-key.pressed')).toBeNull();
    } catch (error) {
      console.log('chord note mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('does not preview the base note on Ctrl+Space', () => {
    const { container } = renderPanel();
    fireEvent.keyDown(getBoard(container), { key: ' ', ctrlKey: true });
    try {
      expect(container.querySelector('.piano-key.pressed')).toBeNull();
    } catch (error) {
      console.log('ctrl space mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });
});

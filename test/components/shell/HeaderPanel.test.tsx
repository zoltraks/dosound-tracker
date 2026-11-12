import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { HeaderPanel } from '../../../src/components/shell/HeaderPanel.tsx';
import type { NavigationSection } from '../../../src/constants/navigation.ts';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';

afterEach(() => cleanup());

type PanelProps = Parameters<typeof HeaderPanel>[0];

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

const renderHeader = (overrides: Partial<PanelProps> = {}) =>
  render(
    <HeaderPanel
      isDarkMode
      onToggleTheme={vi.fn()}
      title="song"
      currentOctave={4}
      onOctaveChange={vi.fn()}
      onShowAbout={vi.fn()}
      activeSection={'octave' as NavigationSection}
      setActiveSection={vi.fn()}
      ym2149={null}
      currentInstrument={makeInstrument()}
      previewChannel={0}
      hasDownloads={false}
      onShowDownloads={vi.fn()}
      onToggleCommandPanelMobile={vi.fn()}
      onShowSettings={vi.fn()}
      {...overrides}
    />,
  );

const getOctaveSelection = (container: HTMLElement) =>
  container.querySelector('.octave-selection') as HTMLElement;

describe('HeaderPanel octave selection', () => {
  it('lets a Ctrl chord reach the window keydown listener', () => {
    const { container } = renderHeader();
    const spy = vi.fn();
    window.addEventListener('keydown', spy);
    try {
      fireEvent.keyDown(getOctaveSelection(container), { key: ' ', ctrlKey: true });
      expect(spy).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('chord propagation mismatch');
      throw error;
    } finally {
      window.removeEventListener('keydown', spy);
    }
  });

  it('keeps the local preview keys from reaching the window listener', () => {
    const { container } = renderHeader();
    const spy = vi.fn();
    window.addEventListener('keydown', spy);
    try {
      fireEvent.keyDown(getOctaveSelection(container), { key: ' ' });
      expect(spy).not.toHaveBeenCalled();
    } catch (error) {
      console.log('space swallow mismatch');
      throw error;
    } finally {
      window.removeEventListener('keydown', spy);
    }
  });

  it('lets a Shift+Space chord reach the window keydown listener', () => {
    const { container } = renderHeader();
    const spy = vi.fn();
    window.addEventListener('keydown', spy);
    try {
      fireEvent.keyDown(getOctaveSelection(container), { key: ' ', shiftKey: true });
      expect(spy).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('shift space propagation mismatch');
      throw error;
    } finally {
      window.removeEventListener('keydown', spy);
    }
  });
});

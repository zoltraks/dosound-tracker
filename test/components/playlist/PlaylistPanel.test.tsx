import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { PlaylistPanel } from '../../../src/components/playlist/PlaylistPanel.tsx';
import type { NavigationSection } from '../../../src/constants/navigation.ts';
import type { PlaylistEntry } from '../../../src/types/playlist.ts';
import { asPlaylistPatternId } from '../../../src/types/branded.ts';

afterEach(() => cleanup());
beforeEach(() => {
  localStorage.clear();
  window.matchMedia = vi.fn().mockReturnValue({
    matches: true,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as typeof window.matchMedia;
});

type PanelProps = Parameters<typeof PlaylistPanel>[0];

const entry = (a: string = '00'): PlaylistEntry => ({
  A: asPlaylistPatternId(a),
  B: '--',
  C: '--',
});

const renderPanel = (overrides: Partial<PanelProps> = {}) =>
  render(
    <PlaylistPanel
      playlist={[entry()]}
      activeSection={'playlist' as NavigationSection}
      setActiveSection={vi.fn()}
      onPlaylistChange={vi.fn()}
      currentPlaybackPosition={0}
      onPositionSelect={vi.fn()}
      onCreatePatternAt={vi.fn()}
      targetTrack="A"
      sharedCurrentLine={7}
      onToggleLineFromStart={vi.fn()}
      onToggleSongFromCursor={vi.fn()}
      onToggleSongFromStart={vi.fn()}
      {...overrides}
    />,
  );

const getPanel = (container: HTMLElement) =>
  container.querySelector('.playlist-panel') as HTMLElement;

describe('PlaylistPanel', () => {
  it('starts pattern editing on a bare key press', () => {
    const { container } = renderPanel();
    fireEvent.keyDown(getPanel(container), { key: 'Enter' });
    try {
      expect(container.querySelector('.pattern-input')).toBeTruthy();
    } catch (error) {
      console.log('enter edit mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('does not start pattern editing on Ctrl+Space', () => {
    const { container } = renderPanel();
    fireEvent.keyDown(getPanel(container), { key: ' ', ctrlKey: true });
    try {
      expect(container.querySelector('.pattern-input')).toBeNull();
    } catch (error) {
      console.log('ctrl space mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('does not start pattern editing on Shift+Space or a Ctrl letter', () => {
    const { container } = renderPanel();
    const panel = getPanel(container);
    fireEvent.keyDown(panel, { key: ' ', shiftKey: true });
    fireEvent.keyDown(panel, { key: 'a', ctrlKey: true });
    fireEvent.keyDown(panel, { key: 'n', ctrlKey: true });
    try {
      expect(container.querySelector('.pattern-input')).toBeNull();
    } catch (error) {
      console.log('chord guard mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('fires the playback toggles on modifier Enter chords', () => {
    const onToggleLineFromStart = vi.fn();
    const onToggleSongFromCursor = vi.fn();
    const onToggleSongFromStart = vi.fn();
    const { container } = renderPanel({
      onToggleLineFromStart,
      onToggleSongFromCursor,
      onToggleSongFromStart,
    });
    const panel = getPanel(container);

    fireEvent.keyDown(panel, { key: 'Enter', ctrlKey: true });
    fireEvent.keyDown(panel, { key: 'Enter', shiftKey: true });
    fireEvent.keyDown(panel, { key: 'Enter', ctrlKey: true, shiftKey: true });
    try {
      expect(onToggleLineFromStart).toHaveBeenCalledWith(7);
      expect(onToggleSongFromCursor).toHaveBeenCalledWith(7);
      expect(onToggleSongFromStart).toHaveBeenCalledWith(7);
      expect(container.querySelector('.pattern-input')).toBeNull();
    } catch (error) {
      console.log('enter chord mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('commits the edit instead of playing back on Enter while editing', () => {
    const onToggleLineFromStart = vi.fn();
    const onToggleSongFromCursor = vi.fn();
    const onToggleSongFromStart = vi.fn();
    const onPlaylistChange = vi.fn();
    const { container } = renderPanel({
      onToggleLineFromStart,
      onToggleSongFromCursor,
      onToggleSongFromStart,
      onPlaylistChange,
    });
    const panel = getPanel(container);

    fireEvent.keyDown(panel, { key: 'Enter' });
    const input = container.querySelector('.pattern-input') as HTMLInputElement;
    try {
      expect(input).toBeTruthy();
    } catch (error) {
      console.log('input mount mismatch');
      throw error;
    }

    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
    try {
      expect(onToggleLineFromStart).not.toHaveBeenCalled();
      expect(onToggleSongFromCursor).not.toHaveBeenCalled();
      expect(onToggleSongFromStart).not.toHaveBeenCalled();
      expect(container.querySelector('.pattern-input')).toBeNull();
      expect(onPlaylistChange).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('editing enter mismatch', onPlaylistChange.mock.calls);
      throw error;
    }
  });

  it('commits the pattern id and focuses the track on Alt+Enter', () => {
    const setActiveSection = vi.fn();
    const { container } = renderPanel({ setActiveSection });
    fireEvent.keyDown(getPanel(container), { key: 'Enter' });
    const input = container.querySelector('.pattern-input') as HTMLInputElement;
    try {
      expect(input).toBeTruthy();
    } catch (error) {
      console.log('input mount mismatch');
      throw error;
    }
    fireEvent.keyDown(input, { key: 'Enter', altKey: true });
    try {
      expect(container.querySelector('.pattern-input')).toBeNull();
      expect(setActiveSection).toHaveBeenCalledWith('trackA');
    } catch (error) {
      console.log('alt enter commit mismatch', setActiveSection.mock.calls);
      throw error;
    }
  });

  it('refocuses the panel when the focus revision changes while active', () => {
    const props: PanelProps = {
      playlist: [entry()],
      activeSection: 'playlist' as NavigationSection,
      setActiveSection: vi.fn(),
      onPlaylistChange: vi.fn(),
      currentPlaybackPosition: 0,
      onPositionSelect: vi.fn(),
      onCreatePatternAt: vi.fn(),
      targetTrack: 'A',
      sharedCurrentLine: 7,
      onToggleLineFromStart: vi.fn(),
      onToggleSongFromCursor: vi.fn(),
      onToggleSongFromStart: vi.fn(),
    };
    const { container, rerender } = render(<PlaylistPanel {...props} focusRevision={0} />);
    const panel = getPanel(container);
    panel.blur();
    try {
      expect(document.activeElement).not.toBe(panel);
    } catch (error) {
      console.log('blur mismatch');
      throw error;
    }
    rerender(<PlaylistPanel {...props} focusRevision={1} />);
    try {
      expect(document.activeElement).toBe(panel);
    } catch (error) {
      console.log('refocus mismatch', document.activeElement?.className);
      throw error;
    }
  });
});

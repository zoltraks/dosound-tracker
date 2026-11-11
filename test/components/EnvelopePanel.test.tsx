import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EnvelopePanel } from '../../src/components/EnvelopePanel.tsx';
import type { NavigationSection } from '../../src/constants/navigation.ts';
import { ENVELOPE_LENGTH } from '../../src/constants/music.ts';

afterEach(() => cleanup());

type PanelProps = Parameters<typeof EnvelopePanel>[0];

const zeros = () => Array(ENVELOPE_LENGTH).fill(0);

const renderPanel = (overrides: Partial<PanelProps> = {}) =>
  render(
    <EnvelopePanel
      type="volume"
      activeSection={'volume' as NavigationSection}
      setActiveSection={vi.fn()}
      {...overrides}
    />,
  );

const getPanel = (container: HTMLElement) =>
  container.querySelector('.envelope-panel') as HTMLElement;

describe('EnvelopePanel volume', () => {
  it('renders bars, values and the footer with defaults', () => {
    const data = zeros();
    data[0] = 0x0f;
    const { container } = renderPanel({ data });
    try {
      expect(container.querySelectorAll('.envelope-bar')).toHaveLength(ENVELOPE_LENGTH);
      expect(container.querySelectorAll('.envelope-value')).toHaveLength(ENVELOPE_LENGTH);
      expect(screen.getByText('Pos: 0')).toBeTruthy();
      expect(screen.getByText('Val: 0F')).toBeTruthy();
      expect(screen.getByRole('group', { name: 'Volume' })).toBeTruthy();
    } catch (error) {
      console.log('render mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('restores the persisted cursor position', () => {
    localStorage.setItem('dosound-tracker-envelope-cursor-volume', '5');
    renderPanel();
    try {
      expect(screen.getByText('Pos: 5')).toBeTruthy();
      expect(localStorage.getItem('dosound-tracker-envelope-cursor-volume')).toBe('5');
    } catch (error) {
      console.log('cursor restore mismatch');
      throw error;
    }
  });

  it('moves the cursor with arrow keys and clamps at edges', () => {
    renderPanel();
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'ArrowRight' });
    try {
      expect(screen.getByText('Pos: 1')).toBeTruthy();
    } catch (error) {
      console.log('arrow right mismatch');
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'ArrowLeft' });
    try {
      expect(screen.getByText('Pos: 0')).toBeTruthy();
    } catch (error) {
      console.log('arrow left mismatch');
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'ArrowLeft' });
    try {
      expect(screen.getByText('Pos: 0')).toBeTruthy();
    } catch (error) {
      console.log('arrow left clamp mismatch');
      throw error;
    }
  });

  it('clamps the cursor at the last position when moving right', () => {
    localStorage.setItem('dosound-tracker-envelope-cursor-volume', '31');
    renderPanel();
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'ArrowRight' });
    try {
      expect(screen.getByText('Pos: 1F')).toBeTruthy();
    } catch (error) {
      console.log('right clamp mismatch');
      throw error;
    }
  });

  it('changes the value with arrow up/down through onChange', () => {
    const onChange = vi.fn();
    renderPanel({ data: zeros(), onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'ArrowUp' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(1);
    } catch (error) {
      console.log('arrow up onChange', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'ArrowDown' });
    try {
      expect(onChange).toHaveBeenCalledTimes(2);
    } catch (error) {
      console.log('arrow down onChange', onChange.mock.calls);
      throw error;
    }
  });

  it('does not throw without an onChange handler', () => {
    renderPanel();
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'ArrowUp' });
    fireEvent.keyDown(panel, { key: 'Backspace' });
    try {
      expect(screen.getByText('Pos: 1')).toBeTruthy();
    } catch (error) {
      console.log('no onChange mismatch');
      throw error;
    }
  });

  it('zeroes the value and advances on Backspace and Delete', () => {
    const data = zeros();
    data[0] = 7;
    const onChange = vi.fn();
    renderPanel({ data, onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'Backspace' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(0);
      expect(screen.getByText('Pos: 1')).toBeTruthy();
    } catch (error) {
      console.log('backspace mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'Delete' });
    try {
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Pos: 2')).toBeTruthy();
    } catch (error) {
      console.log('delete mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('enters hex digits and advances the cursor', () => {
    const onChange = vi.fn();
    renderPanel({ data: zeros(), onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'a' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(10);
      expect(screen.getByText('Pos: 1')).toBeTruthy();
    } catch (error) {
      console.log('hex a mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: '5', code: 'Digit5' });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[1]).toBe(5);
    } catch (error) {
      console.log('digit 5 mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('ignores a non-hex key', () => {
    const onChange = vi.fn();
    renderPanel({ data: zeros(), onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'g' });
    try {
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('Pos: 0')).toBeTruthy();
    } catch (error) {
      console.log('non-hex mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('toggles the sustain index with the S key', () => {
    const onSustainChange = vi.fn();
    renderPanel({ data: zeros(), onSustainChange, sustainIndex: null });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 's' });
    try {
      expect(onSustainChange).toHaveBeenCalledWith(0);
    } catch (error) {
      console.log('sustain set', onSustainChange.mock.calls);
      throw error;
    }
    cleanup();
    onSustainChange.mockClear();
    renderPanel({ data: zeros(), onSustainChange, sustainIndex: 0 });
    fireEvent.keyDown(getPanel(document.body), { key: 'S' });
    try {
      expect(onSustainChange).toHaveBeenCalledWith(null);
    } catch (error) {
      console.log('sustain clear', onSustainChange.mock.calls);
      throw error;
    }
  });

  it('clears the whole envelope on Ctrl+Shift+Backspace', () => {
    const onChange = vi.fn();
    renderPanel({ data: Array(ENVELOPE_LENGTH).fill(9), onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'Backspace', ctrlKey: true, shiftKey: true });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next).toEqual(zeros());
    } catch (error) {
      console.log('clear mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('rotates the envelope on Ctrl+Shift+ArrowLeft and ArrowRight', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = 1;
    data[1] = 2;
    renderPanel({ data, onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'ArrowLeft', ctrlKey: true, shiftKey: true });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(2);
      expect(next[ENVELOPE_LENGTH - 1]).toBe(1);
    } catch (error) {
      console.log('rotate left mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'ArrowRight', ctrlKey: true, shiftKey: true });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[0]).toBe(1);
      expect(next[1]).toBe(2);
    } catch (error) {
      console.log('rotate right mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('shifts all values on Ctrl+Shift+ArrowUp and ArrowDown', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = 3;
    renderPanel({ data, onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'ArrowUp', ctrlKey: true, shiftKey: true });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(4);
      expect(next[1]).toBe(1);
    } catch (error) {
      console.log('shift up mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'ArrowDown', ctrlKey: true, shiftKey: true });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[0]).toBe(3);
    } catch (error) {
      console.log('shift down mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('marks the sustain bar and renders the sustain dot', () => {
    const { container } = renderPanel({ data: zeros(), sustainIndex: 0, onSustainChange: vi.fn() });
    try {
      const bars = container.querySelectorAll('.envelope-bar');
      expect(bars[0]?.className).toContain('sustain');
      expect(container.querySelector('.envelope-sustain-dot')).toBeTruthy();
    } catch (error) {
      console.log('sustain render mismatch');
      throw error;
    }
  });

  it('marks the sustain dot idle when the bar does not reach it', () => {
    const data = zeros();
    data[0] = 3;
    const { container } = renderPanel({ data, sustainIndex: 0, onSustainChange: vi.fn() });
    try {
      expect(container.querySelector('.envelope-sustain-dot.idle')).toBeTruthy();
    } catch (error) {
      console.log('idle dot mismatch');
      throw error;
    }
  });

  it('keeps the default dot when the bar reaches it', () => {
    const data = zeros();
    data[0] = 0x0f;
    const { container } = renderPanel({ data, sustainIndex: 0, onSustainChange: vi.fn() });
    try {
      expect(container.querySelector('.envelope-sustain-dot.idle')).toBeNull();
      expect(container.querySelector('.envelope-sustain-dot')).toBeTruthy();
    } catch (error) {
      console.log('dot on bar mismatch');
      throw error;
    }
  });

  it('hides the sustain dot for out-of-range indexes', () => {
    const { container } = renderPanel({ data: zeros(), sustainIndex: 99 });
    try {
      expect(container.querySelector('.envelope-sustain-dot')).toBeNull();
    } catch (error) {
      console.log('sustain dot range mismatch');
      throw error;
    }
    cleanup();
    const again = renderPanel({ data: zeros(), sustainIndex: -1 });
    try {
      expect(again.container.querySelector('.envelope-sustain-dot')).toBeNull();
      expect(again.container.querySelector('.envelope-bar.sustain')).toBeNull();
    } catch (error) {
      console.log('negative sustain mismatch');
      throw error;
    }
  });

  it('toggles sustain through the context menu', () => {
    const onSustainChange = vi.fn();
    const { container } = renderPanel({ data: zeros(), sustainIndex: 2, onSustainChange });
    const graph = container.querySelector('.envelope-graph') as HTMLElement;
    fireEvent.contextMenu(graph, { clientX: 0 });
    try {
      expect(onSustainChange).toHaveBeenCalledWith(0);
    } catch (error) {
      console.log('context sustain set', onSustainChange.mock.calls);
      throw error;
    }
    cleanup();
    onSustainChange.mockClear();
    const second = renderPanel({ data: zeros(), sustainIndex: 0, onSustainChange });
    fireEvent.contextMenu(second.container.querySelector('.envelope-graph') as HTMLElement, {
      clientX: 0,
    });
    try {
      expect(onSustainChange).toHaveBeenCalledWith(null);
    } catch (error) {
      console.log('context sustain clear', onSustainChange.mock.calls);
      throw error;
    }
  });

  it('ignores the context menu without a sustain handler', () => {
    const setActiveSection = vi.fn();
    const { container } = renderPanel({ data: zeros(), setActiveSection });
    const graph = container.querySelector('.envelope-graph') as HTMLElement;
    fireEvent.contextMenu(graph, { clientX: 0 });
    try {
      expect(setActiveSection).not.toHaveBeenCalled();
    } catch (error) {
      console.log('context guard mismatch', setActiveSection.mock.calls);
      throw error;
    }
  });

  it('moves the cursor and activates the section when a bar is clicked', () => {
    const setActiveSection = vi.fn();
    const { container } = renderPanel({
      data: zeros(),
      setActiveSection,
      activeSection: 'piano' as NavigationSection,
    });
    const bars = container.querySelectorAll('.envelope-bar');
    fireEvent.click(bars[4] as HTMLElement);
    try {
      expect(setActiveSection).toHaveBeenCalledWith('volume');
      expect(screen.getByText('Pos: 4')).toBeTruthy();
    } catch (error) {
      console.log('bar click mismatch', setActiveSection.mock.calls);
      throw error;
    }
  });

  it('activates the section when the panel or a value cell is clicked', () => {
    const setActiveSection = vi.fn();
    const { container } = renderPanel({ data: zeros(), setActiveSection });
    fireEvent.click(getPanel(container));
    try {
      expect(setActiveSection).toHaveBeenCalledWith('volume');
    } catch (error) {
      console.log('panel click mismatch');
      throw error;
    }
    const valueCell = container.querySelectorAll('.envelope-value')[3] as HTMLElement;
    fireEvent.click(valueCell);
    try {
      expect(screen.getByText('Pos: 3')).toBeTruthy();
    } catch (error) {
      console.log('value click mismatch');
      throw error;
    }
  });

  it('ignores key input while another section is active', () => {
    const onChange = vi.fn();
    const setActiveSection = vi.fn();
    const { container } = renderPanel({
      data: zeros(),
      onChange,
      setActiveSection,
      activeSection: 'piano' as NavigationSection,
    });
    fireEvent.keyDown(getPanel(container), { key: 'ArrowRight' });
    fireEvent.keyDown(getPanel(container), { key: 'a' });
    try {
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('Pos: 0')).toBeTruthy();
      expect(container.querySelector('.envelope-panel.active')).toBeNull();
    } catch (error) {
      console.log('inactive mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('copies the last visited position with Space', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[2] = 9;
    const { container } = renderPanel({ data, onChange });
    const bars = container.querySelectorAll('.envelope-bar');
    fireEvent.click(bars[2] as HTMLElement);
    fireEvent.keyDown(getPanel(container), { key: 'ArrowRight' });
    fireEvent.keyDown(getPanel(container), { key: ' ' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[3]).toBe(9);
    } catch (error) {
      console.log('space copy mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('does nothing on Space before any position was visited', () => {
    const onChange = vi.fn();
    const { container } = renderPanel({ data: zeros(), onChange });
    fireEvent.keyDown(getPanel(container), { key: ' ' });
    try {
      expect(onChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('space guard mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('syncs the envelope when the data prop changes', () => {
    const { container, rerender } = render(
      <EnvelopePanel
        type="volume"
        activeSection={'volume' as NavigationSection}
        setActiveSection={vi.fn()}
        data={zeros()}
      />,
    );
    const updated = zeros();
    updated[0] = 0x0a;
    rerender(
      <EnvelopePanel
        type="volume"
        activeSection={'volume' as NavigationSection}
        setActiveSection={vi.fn()}
        data={updated}
      />,
    );
    try {
      expect(screen.getByText('Val: 0A')).toBeTruthy();
    } catch (error) {
      console.log('data sync mismatch', container.textContent);
      throw error;
    }
  });
});

describe('EnvelopePanel modifier discipline', () => {
  it('enters the hex value and advances on Ctrl+digit', () => {
    const onChange = vi.fn();
    renderPanel({ data: zeros(), onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: '7', code: 'Digit7', ctrlKey: true });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(7);
      expect(screen.getByText('Pos: 1')).toBeTruthy();
    } catch (error) {
      console.log('ctrl digit mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('enters the hex value on Ctrl+digit in the noise panel', () => {
    const onChange = vi.fn();
    renderPanel({
      type: 'noise',
      activeSection: 'noise' as NavigationSection,
      data: zeros(),
      onChange,
    });
    fireEvent.keyDown(getPanel(document.body), { key: '5', code: 'Digit5', ctrlKey: true });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(5);
      expect(screen.getByText('Pos: 1')).toBeTruthy();
    } catch (error) {
      console.log('noise ctrl digit mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('does not enter a value or toggle sustain on Ctrl chords', () => {
    const onChange = vi.fn();
    const onSustainChange = vi.fn();
    renderPanel({ data: zeros(), onChange, onSustainChange, sustainIndex: null });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'a', code: 'KeyA', ctrlKey: true });
    fireEvent.keyDown(panel, { key: 's', code: 'KeyS', ctrlKey: true });
    fireEvent.keyDown(panel, { key: 'n', code: 'KeyN', ctrlKey: true });
    fireEvent.keyDown(panel, { key: 'a', code: 'KeyA', metaKey: true });
    try {
      expect(onChange).not.toHaveBeenCalled();
      expect(onSustainChange).not.toHaveBeenCalled();
      expect(screen.getByText('Pos: 0')).toBeTruthy();
    } catch (error) {
      console.log('ctrl chord guard mismatch', onChange.mock.calls, onSustainChange.mock.calls);
      throw error;
    }
  });

  it('does not copy the last position on Ctrl+Space or Shift+Space', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[2] = 9;
    const { container } = renderPanel({ data, onChange });
    const bars = container.querySelectorAll('.envelope-bar');
    fireEvent.click(bars[2] as HTMLElement);
    fireEvent.keyDown(getPanel(container), { key: 'ArrowRight' });
    fireEvent.keyDown(getPanel(container), { key: ' ', ctrlKey: true });
    fireEvent.keyDown(getPanel(container), { key: ' ', shiftKey: true });
    try {
      expect(onChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('space chord guard mismatch', onChange.mock.calls);
      throw error;
    }
  });
});

describe('EnvelopePanel shift', () => {
  const renderShift = (overrides: Partial<PanelProps> = {}) =>
    renderPanel({
      type: 'shift',
      activeSection: 'shift' as NavigationSection,
      ...overrides,
    });

  it('renders the centered graph layout', () => {
    const { container } = renderShift({ data: zeros() });
    try {
      expect(container.querySelector('.envelope-graph.centered')).toBeTruthy();
      expect(container.querySelector('.neutral-line')).toBeTruthy();
      expect(container.querySelectorAll('.envelope-bar.centered')).toHaveLength(ENVELOPE_LENGTH);
      expect(screen.getByRole('group', { name: 'Arpeggio' })).toBeTruthy();
    } catch (error) {
      console.log('shift render mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('enters positive and negative hex values', () => {
    const onChange = vi.fn();
    renderShift({ data: zeros(), onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: '5' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(5);
    } catch (error) {
      console.log('shift positive', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: '5', shiftKey: true });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[1]).toBe(-5);
    } catch (error) {
      console.log('shift negative', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: '0', shiftKey: true });
    try {
      const next = onChange.mock.calls[2]?.[0] as number[];
      expect(next[2]).toBe(0);
    } catch (error) {
      console.log('shift zero', onChange.mock.calls);
      throw error;
    }
  });

  it('advances on Backspace like the volume panel', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = -4;
    renderShift({ data, onChange });
    fireEvent.keyDown(getPanel(document.body), { key: 'Backspace' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(0);
      expect(screen.getByText('Pos: 1')).toBeTruthy();
    } catch (error) {
      console.log('shift backspace', onChange.mock.calls);
      throw error;
    }
  });

  it('repeats the pattern to full length on Ctrl+Shift+Enter', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = 1;
    data[1] = -2;
    localStorage.setItem('dosound-tracker-envelope-cursor-shift', '1');
    renderShift({ data, onChange });
    fireEvent.keyDown(getPanel(document.body), {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: true,
    });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(1);
      expect(next[1]).toBe(-2);
      expect(next[2]).toBe(1);
      expect(next[3]).toBe(-2);
      expect(next).toHaveLength(ENVELOPE_LENGTH);
    } catch (error) {
      console.log('repeat mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('ignores Ctrl+Shift+Enter on a non-shift panel', () => {
    const onChange = vi.fn();
    renderPanel({ data: zeros(), onChange });
    fireEvent.keyDown(getPanel(document.body), {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: true,
    });
    try {
      expect(onChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('repeat guard mismatch', onChange.mock.calls);
      throw error;
    }
  });
});

describe('EnvelopePanel pitch', () => {
  const renderPitch = (overrides: Partial<PanelProps> = {}) =>
    renderPanel({
      type: 'pitch',
      activeSection: 'pitch' as NavigationSection,
      ...overrides,
    });

  it('renders centered bars and clamps at the pitch maximum', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = 128;
    const { container } = renderPitch({ data, onChange });
    try {
      expect(container.querySelector('.envelope-graph.centered')).toBeTruthy();
      expect(screen.getByRole('group', { name: 'Pitch' })).toBeTruthy();
    } catch (error) {
      console.log('pitch render mismatch');
      throw error;
    }
    fireEvent.keyDown(getPanel(container), { key: 'ArrowUp' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(128);
    } catch (error) {
      console.log('pitch clamp', onChange.mock.calls);
      throw error;
    }
  });

  it('ignores hex keys because pitch has no digit entry', () => {
    const onChange = vi.fn();
    renderPitch({ data: zeros(), onChange });
    fireEvent.keyDown(getPanel(document.body), { key: 'a' });
    try {
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('Pos: 0')).toBeTruthy();
    } catch (error) {
      console.log('pitch hex mismatch', onChange.mock.calls);
      throw error;
    }
  });
});

describe('EnvelopePanel noise', () => {
  const renderNoise = (overrides: Partial<PanelProps> = {}) =>
    renderPanel({
      type: 'noise',
      activeSection: 'noise' as NavigationSection,
      ...overrides,
    });

  it('enters hex values with the noise shift range', () => {
    const onChange = vi.fn();
    renderNoise({ data: zeros(), onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'a' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(10);
    } catch (error) {
      console.log('noise hex', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'f', shiftKey: true });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[1]).toBe(31);
    } catch (error) {
      console.log('noise shift hex', onChange.mock.calls);
      throw error;
    }
  });

  it('advances on Backspace', () => {
    const onChange = vi.fn();
    renderNoise({ data: zeros(), onChange });
    fireEvent.keyDown(getPanel(document.body), { key: 'Backspace' });
    try {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Pos: 1')).toBeTruthy();
    } catch (error) {
      console.log('noise backspace', onChange.mock.calls);
      throw error;
    }
  });

  it('does not toggle sustain from the context menu', () => {
    const onSustainChange = vi.fn();
    const { container } = renderNoise({ data: zeros(), onSustainChange });
    fireEvent.contextMenu(container.querySelector('.envelope-graph') as HTMLElement, {
      clientX: 0,
    });
    try {
      expect(onSustainChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('noise context mismatch', onSustainChange.mock.calls);
      throw error;
    }
  });
});

describe('EnvelopePanel mode', () => {
  const renderMode = (overrides: Partial<PanelProps> = {}) =>
    renderPanel({
      type: 'mode',
      activeSection: 'mode' as NavigationSection,
      ...overrides,
    });

  it('renders sixteen mode cells', () => {
    const { container } = renderMode({ data: zeros() });
    try {
      expect(container.querySelectorAll('.mode-cell')).toHaveLength(16);
      expect(screen.getByRole('group', { name: 'Mode' })).toBeTruthy();
      expect(screen.getByLabelText('Mode position 0: TONE')).toBeTruthy();
    } catch (error) {
      console.log('mode render mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('sets mode values through the T, N and B keys', () => {
    const onChange = vi.fn();
    const { container } = renderMode({ data: zeros(), onChange });
    const panel = getPanel(container);
    fireEvent.keyDown(panel, { key: 'n' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(1);
      expect(container.querySelectorAll('.mode-cell')[1]?.className).toContain('current');
    } catch (error) {
      console.log('mode n', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'b' });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[1]).toBe(2);
    } catch (error) {
      console.log('mode b', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'T' });
    try {
      const next = onChange.mock.calls[2]?.[0] as number[];
      expect(next[2]).toBe(0);
    } catch (error) {
      console.log('mode t', onChange.mock.calls);
      throw error;
    }
  });

  it('ignores keys outside the mode alphabet', () => {
    const onChange = vi.fn();
    const { container } = renderMode({ data: zeros(), onChange });
    fireEvent.keyDown(getPanel(container), { key: 'x' });
    fireEvent.keyDown(getPanel(container), { key: '5' });
    try {
      expect(onChange).not.toHaveBeenCalled();
      expect(container.querySelectorAll('.mode-cell')[0]?.className).toContain('current');
    } catch (error) {
      console.log('mode stray keys', onChange.mock.calls);
      throw error;
    }
  });

  it('moves the cursor with arrows and cell clicks', () => {
    const setActiveSection = vi.fn();
    const { container } = renderMode({ data: zeros(), setActiveSection });
    fireEvent.keyDown(getPanel(container), { key: 'ArrowRight' });
    try {
      expect(container.querySelectorAll('.mode-cell')[1]?.className).toContain('current');
    } catch (error) {
      console.log('mode arrow mismatch');
      throw error;
    }
    const cells = container.querySelectorAll('.mode-cell');
    fireEvent.click(cells[5] as HTMLElement);
    try {
      expect(setActiveSection).toHaveBeenCalledWith('mode');
      expect(container.querySelectorAll('.mode-cell')[5]?.className).toContain('current');
    } catch (error) {
      console.log('mode click mismatch', setActiveSection.mock.calls);
      throw error;
    }
  });
});

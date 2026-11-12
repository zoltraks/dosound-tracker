import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { ToneNoisePanel } from '../../../src/components/envelope/ToneNoisePanel.tsx';
import type { NavigationSection } from '../../../src/constants/navigation.ts';
import { ENVELOPE_LENGTH } from '../../../src/constants/music.ts';

afterEach(() => cleanup());

type PanelProps = Parameters<typeof ToneNoisePanel>[0];

const zeros = () => Array(ENVELOPE_LENGTH).fill(0);

const renderPanel = (overrides: Partial<PanelProps> = {}) =>
  render(
    <ToneNoisePanel
      activeSection={'mode' as NavigationSection}
      setActiveSection={vi.fn()}
      {...overrides}
    />,
  );

const getPanel = (container: HTMLElement) =>
  container.querySelector('.envelope-panel') as HTMLElement;

const getValueCell = (container: HTMLElement, index: number) =>
  container.querySelectorAll('.envelope-value')[index] as HTMLElement;

const isCurrent = (container: HTMLElement, index: number) =>
  getValueCell(container, index).className.includes('current');

describe('ToneNoisePanel', () => {
  it('renders bars and value cells with mode labels', () => {
    const data = zeros();
    data[0] = 1;
    data[1] = 2;
    const { container } = renderPanel({ data });
    try {
      expect(container.querySelectorAll('.envelope-bar.mode-bar')).toHaveLength(ENVELOPE_LENGTH);
      expect(container.querySelectorAll('.envelope-value')).toHaveLength(ENVELOPE_LENGTH);
      expect(container.querySelector('.envelope-header')?.textContent).toBe('Mode');
      expect(getValueCell(container, 0).textContent).toBe('N');
      expect(getValueCell(container, 1).textContent).toBe('B');
      expect(getValueCell(container, 2).textContent).toBe('T');
      expect(
        container.querySelector('[aria-label="Position 0: Noise"]') as HTMLElement,
      ).toBeTruthy();
      expect(
        container.querySelector('[aria-label="Position 1: Tone+Noise"]') as HTMLElement,
      ).toBeTruthy();
    } catch (error) {
      console.log('render mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });

  it('falls back to the default alternating data', () => {
    const { container } = renderPanel({ data: [] });
    try {
      expect(getValueCell(container, 0).textContent).toBe('T');
      expect(getValueCell(container, 1).textContent).toBe('N');
    } catch (error) {
      console.log('default data mismatch');
      throw error;
    }
  });

  it('restores the persisted cursor and marks it current', () => {
    localStorage.setItem('dosound-tracker-envelope-cursor-mode', '4');
    const { container } = renderPanel();
    try {
      expect(isCurrent(container, 4)).toBe(true);
      expect(isCurrent(container, 0)).toBe(false);
    } catch (error) {
      console.log('cursor restore mismatch');
      throw error;
    }
  });

  it('does not change the mode on modifier chords', () => {
    const onChange = vi.fn();
    const { container } = renderPanel({ data: zeros(), onChange });
    const panel = getPanel(container);
    fireEvent.keyDown(panel, { key: ' ', ctrlKey: true });
    fireEvent.keyDown(panel, { key: ' ', shiftKey: true });
    fireEvent.keyDown(panel, { key: 'n', ctrlKey: true });
    fireEvent.keyDown(panel, { key: 't', altKey: true });
    try {
      expect(onChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('mode chord guard mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('moves the cursor with arrow keys and clamps at edges', () => {
    const { container } = renderPanel();
    const panel = getPanel(container);
    fireEvent.keyDown(panel, { key: 'ArrowRight' });
    try {
      expect(isCurrent(container, 1)).toBe(true);
    } catch (error) {
      console.log('arrow right mismatch');
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'ArrowLeft' });
    fireEvent.keyDown(panel, { key: 'ArrowLeft' });
    try {
      expect(isCurrent(container, 0)).toBe(true);
    } catch (error) {
      console.log('arrow left clamp mismatch');
      throw error;
    }
  });

  it('clamps the cursor at the last position when moving right', () => {
    localStorage.setItem('dosound-tracker-envelope-cursor-mode', '31');
    const { container } = renderPanel();
    fireEvent.keyDown(getPanel(container), { key: 'ArrowRight' });
    try {
      expect(isCurrent(container, 31)).toBe(true);
    } catch (error) {
      console.log('right clamp mismatch');
      throw error;
    }
  });

  it('changes the value with arrow keys through onChange', () => {
    const onChange = vi.fn();
    renderPanel({ data: zeros(), onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'ArrowUp' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(1);
    } catch (error) {
      console.log('arrow up mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'ArrowDown' });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[0]).toBe(0);
    } catch (error) {
      console.log('arrow down mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('clamps the value range between 0 and 2', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = 2;
    renderPanel({ data, onChange });
    fireEvent.keyDown(getPanel(document.body), { key: 'ArrowUp' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(2);
    } catch (error) {
      console.log('clamp max', onChange.mock.calls);
      throw error;
    }
    cleanup();
    onChange.mockClear();
    const again = renderPanel({ data: zeros(), onChange });
    fireEvent.keyDown(getPanel(again.container), { key: 'ArrowDown' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(0);
    } catch (error) {
      console.log('clamp min', onChange.mock.calls);
      throw error;
    }
  });

  it('reads a missing position as zero when data is shorter than the cursor', () => {
    const onChange = vi.fn();
    localStorage.setItem('dosound-tracker-envelope-cursor-mode', '5');
    renderPanel({ data: [1], onChange });
    fireEvent.keyDown(getPanel(document.body), { key: 'ArrowUp' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[5]).toBe(1);
    } catch (error) {
      console.log('short data mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('zeroes the value and advances on Backspace and Delete', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = 2;
    const { container } = renderPanel({ data, onChange });
    fireEvent.keyDown(getPanel(container), { key: 'Backspace' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(0);
      expect(isCurrent(container, 1)).toBe(true);
    } catch (error) {
      console.log('backspace mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(getPanel(container), { key: 'Delete' });
    try {
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(isCurrent(container, 2)).toBe(true);
    } catch (error) {
      console.log('delete mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('sets mode values through the T, N and B keys and advances', () => {
    const onChange = vi.fn();
    const { container } = renderPanel({ data: zeros(), onChange });
    const panel = getPanel(container);
    fireEvent.keyDown(panel, { key: 'n' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(1);
      expect(isCurrent(container, 1)).toBe(true);
    } catch (error) {
      console.log('key n mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'b' });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[1]).toBe(2);
    } catch (error) {
      console.log('key b mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'T' });
    try {
      const next = onChange.mock.calls[2]?.[0] as number[];
      expect(next[2]).toBe(0);
    } catch (error) {
      console.log('key t mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('cycles the value with Space', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = 2;
    renderPanel({ data, onChange });
    fireEvent.keyDown(getPanel(document.body), { key: ' ' });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(0);
    } catch (error) {
      console.log('space cycle mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('clears the envelope on Ctrl+Shift+Backspace', () => {
    const onChange = vi.fn();
    renderPanel({ data: Array(ENVELOPE_LENGTH).fill(2), onChange });
    fireEvent.keyDown(getPanel(document.body), {
      key: 'Backspace',
      ctrlKey: true,
      shiftKey: true,
    });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next).toEqual(zeros());
    } catch (error) {
      console.log('clear mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('rotates the data on Ctrl+Shift+ArrowLeft and ArrowRight', () => {
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
      expect(next[0]).toBe(0);
      expect(next[1]).toBe(1);
      expect(next[2]).toBe(2);
    } catch (error) {
      console.log('rotate right mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('shifts all values on Ctrl+Shift+ArrowUp and ArrowDown', () => {
    const onChange = vi.fn();
    const data = zeros();
    data[0] = 1;
    renderPanel({ data, onChange });
    const panel = getPanel(document.body);
    fireEvent.keyDown(panel, { key: 'ArrowUp', ctrlKey: true, shiftKey: true });
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[0]).toBe(2);
      expect(next[1]).toBe(1);
    } catch (error) {
      console.log('shift up mismatch', onChange.mock.calls);
      throw error;
    }
    fireEvent.keyDown(panel, { key: 'ArrowDown', ctrlKey: true, shiftKey: true });
    try {
      const next = onChange.mock.calls[1]?.[0] as number[];
      expect(next[1]).toBe(0);
    } catch (error) {
      console.log('shift down mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('ignores key input while another section is active', () => {
    const onChange = vi.fn();
    const { container } = renderPanel({
      data: zeros(),
      onChange,
      activeSection: 'piano' as NavigationSection,
    });
    fireEvent.keyDown(getPanel(container), { key: 'ArrowRight' });
    fireEvent.keyDown(getPanel(container), { key: 'n' });
    try {
      expect(onChange).not.toHaveBeenCalled();
      expect(container.querySelector('.envelope-panel.active')).toBeNull();
      expect(isCurrent(container, 0)).toBe(false);
    } catch (error) {
      console.log('inactive mismatch', onChange.mock.calls);
      throw error;
    }
  });

  it('cycles the bar value and activates the section on bar click', () => {
    const onChange = vi.fn();
    const setActiveSection = vi.fn();
    const data = zeros();
    data[2] = 1;
    const { container } = renderPanel({ data, onChange, setActiveSection });
    const bars = container.querySelectorAll('.envelope-bar.mode-bar');
    fireEvent.click(bars[2] as HTMLElement);
    try {
      const next = onChange.mock.calls[0]?.[0] as number[];
      expect(next[2]).toBe(2);
      expect(setActiveSection).toHaveBeenCalledWith('mode');
      expect(isCurrent(container, 2)).toBe(true);
    } catch (error) {
      console.log('bar click mismatch', onChange.mock.calls, setActiveSection.mock.calls);
      throw error;
    }
  });

  it('moves the cursor and activates the section on value click', () => {
    const onChange = vi.fn();
    const setActiveSection = vi.fn();
    const { container } = renderPanel({ data: zeros(), onChange, setActiveSection });
    fireEvent.click(getValueCell(container, 6));
    try {
      expect(onChange).not.toHaveBeenCalled();
      expect(setActiveSection).toHaveBeenCalledWith('mode');
      expect(isCurrent(container, 6)).toBe(true);
    } catch (error) {
      console.log('value click mismatch', setActiveSection.mock.calls);
      throw error;
    }
  });

  it('activates the section on panel click', () => {
    const setActiveSection = vi.fn();
    const { container } = renderPanel({ setActiveSection });
    fireEvent.click(getPanel(container));
    try {
      expect(setActiveSection).toHaveBeenCalledWith('mode');
    } catch (error) {
      console.log('panel click mismatch');
      throw error;
    }
  });

  it('advances the cursor without an onChange handler', () => {
    const { container } = renderPanel();
    fireEvent.keyDown(getPanel(container), { key: 'Backspace' });
    try {
      expect(isCurrent(container, 1)).toBe(true);
    } catch (error) {
      console.log('no onChange mismatch');
      throw error;
    }
  });

  it('keeps the bar click working without an onChange handler', () => {
    const setActiveSection = vi.fn();
    const { container } = renderPanel({ setActiveSection });
    const bars = container.querySelectorAll('.envelope-bar.mode-bar');
    fireEvent.click(bars[1] as HTMLElement);
    try {
      expect(setActiveSection).toHaveBeenCalledWith('mode');
      expect(isCurrent(container, 1)).toBe(true);
    } catch (error) {
      console.log('bar click no onChange mismatch');
      throw error;
    }
  });
});

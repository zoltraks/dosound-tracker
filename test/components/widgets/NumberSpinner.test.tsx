import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import NumberSpinner from '../../../src/components/widgets/NumberSpinner.tsx';

afterEach(() => cleanup());

const renderSpinner = (overrides: Partial<Parameters<typeof NumberSpinner>[0]> = {}) =>
  render(<NumberSpinner value={5} onChange={() => {}} min={0} max={10} {...overrides} />);

const input = () => screen.getByRole('spinbutton') as HTMLInputElement;

describe('NumberSpinner', () => {
  it('renders the current value and aria attributes', () => {
    renderSpinner({ value: 7, min: 2, max: 9 });
    try {
      expect(input().value).toBe('7');
      expect(input().getAttribute('aria-valuenow')).toBe('7');
      expect(input().getAttribute('aria-valuemin')).toBe('2');
      expect(input().getAttribute('aria-valuemax')).toBe('9');
    } catch (error) {
      console.log('render attributes mismatch:', input().outerHTML);
      throw error;
    }
  });

  it('renders empty for a null value and commits the minimum on increment', () => {
    const onChange = vi.fn();
    renderSpinner({ value: null, onChange });
    try {
      expect(input().value).toBe('');
      fireEvent.click(screen.getByRole('button', { name: 'Increase value' }));
      expect(onChange).toHaveBeenCalledWith(0);
    } catch (error) {
      console.log('null-value increment mismatch');
      throw error;
    }
  });

  it('rejects non-numeric input and commits digits on blur', () => {
    const onChange = vi.fn();
    renderSpinner({ onChange });
    fireEvent.change(input(), { target: { value: 'abc' } });
    try {
      expect(input().value).toBe('5');
    } catch (error) {
      console.log('non-numeric input accepted:', input().value);
      throw error;
    }
    fireEvent.change(input(), { target: { value: '3' } });
    fireEvent.blur(input());
    try {
      expect(onChange).toHaveBeenCalledWith(3);
      expect(input().value).toBe('3');
    } catch (error) {
      console.log('blur commit mismatch:', input().value);
      throw error;
    }
  });

  it('clamps the committed value to min and max', () => {
    const onChange = vi.fn();
    renderSpinner({ onChange });
    fireEvent.change(input(), { target: { value: '99' } });
    fireEvent.blur(input());
    try {
      expect(onChange).toHaveBeenCalledWith(10);
      expect(input().value).toBe('10');
    } catch (error) {
      console.log('max clamp mismatch:', input().value);
      throw error;
    }
    fireEvent.change(input(), { target: { value: '-4' } });
    fireEvent.blur(input());
    try {
      expect(onChange).toHaveBeenCalledWith(0);
      expect(input().value).toBe('0');
    } catch (error) {
      console.log('min clamp mismatch:', input().value);
      throw error;
    }
  });

  it('commits on Enter and steps with the buttons within bounds', () => {
    const onChange = vi.fn();
    renderSpinner({ value: 9, onChange });
    fireEvent.change(input(), { target: { value: '6' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    try {
      expect(onChange).toHaveBeenCalledWith(6);
    } catch (error) {
      console.log('enter commit mismatch');
      throw error;
    }
    fireEvent.click(screen.getByRole('button', { name: 'Increase value' }));
    try {
      expect(onChange).toHaveBeenLastCalledWith(7);
    } catch (error) {
      console.log('increment mismatch');
      throw error;
    }
    fireEvent.click(screen.getByRole('button', { name: 'Decrease value' }));
    try {
      expect(onChange).toHaveBeenLastCalledWith(6);
    } catch (error) {
      console.log('decrement mismatch');
      throw error;
    }
  });

  it('steps by the configured step on Ctrl+Arrow keys', () => {
    const onChange = vi.fn();
    renderSpinner({ value: 5, step: 2, onChange });
    fireEvent.keyDown(input(), { key: 'ArrowUp', ctrlKey: true });
    try {
      expect(onChange).toHaveBeenCalledWith(7);
    } catch (error) {
      console.log('ctrl-arrow-up step mismatch');
      throw error;
    }
    fireEvent.keyDown(input(), { key: 'ArrowDown', ctrlKey: true });
    try {
      expect(onChange).toHaveBeenCalledWith(5);
    } catch (error) {
      console.log('ctrl-arrow-down step mismatch');
      throw error;
    }
  });

  it('forwards the input keydown to onInputKeyDown', () => {
    const onInputKeyDown = vi.fn();
    renderSpinner({ onInputKeyDown });
    fireEvent.keyDown(input(), { key: 'x' });
    try {
      expect(onInputKeyDown).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('keydown forward mismatch');
      throw error;
    }
  });
});

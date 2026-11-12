import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { ColorPicker } from '../../../src/components/widgets/ColorPicker.tsx';

afterEach(() => cleanup());

describe('ColorPicker', () => {
  it('renders preview with provided value', () => {
    const handleChange = vi.fn();

    render(<ColorPicker value="#888" onChange={handleChange} />);

    expect(screen.getByText('#888')).toBeTruthy();
  });

  it('calls onChange when a palette color is clicked', () => {
    const handleChange = vi.fn();

    const { container } = render(<ColorPicker value="#888" onChange={handleChange} />);

    const scope = within(container);
    const firstColorButton = scope.getByTitle('#000');
    fireEvent.click(firstColorButton);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('#000');
  });

  it('validates and previews custom hex input', () => {
    const handleChange = vi.fn();

    const { container } = render(<ColorPicker value="#888" onChange={handleChange} />);

    const scope = within(container);
    const hexToggle = scope.getByRole('button', { name: 'HEX' });
    fireEvent.click(hexToggle);

    const input = scope.getByLabelText('Custom hex color');
    const applyButton = scope.getByRole('button', { name: 'Apply' });

    fireEvent.change(input, { target: { value: 'ab' } });
    expect((applyButton as HTMLButtonElement).disabled).toBe(true);
    expect(handleChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'abc' } });
    expect((applyButton as HTMLButtonElement).disabled).toBe(false);
    expect(handleChange).toHaveBeenCalledWith('#abc');
    expect(scope.getByText('Preview: #abc')).toBeTruthy();
  });
});

describe('ColorPicker custom input', () => {
  it('reveals the custom input and emits on three hex digits', () => {
    const handleChange = vi.fn();
    const { container } = render(<ColorPicker value="#888" onChange={handleChange} />);
    try {
      const scope = within(container);
      const customToggle = scope.getByRole('button', { name: /custom|hex|\+/i });
      fireEvent.click(customToggle);
      const input = scope.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'abc' } });
      expect(handleChange).toHaveBeenCalledWith('#abc');
    } catch (error) {
      console.log('custom mismatch', container.innerHTML.slice(0, 500));
      throw error;
    }
  });

  it('strips non-hex characters from the input', () => {
    const handleChange = vi.fn();
    const { container } = render(<ColorPicker value="#888" onChange={handleChange} />);
    try {
      const scope = within(container);
      fireEvent.click(scope.getByRole('button', { name: /custom|hex|\+/i }));
      const input = scope.getByRole('textbox') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'zz12' } });
      expect(input.value).not.toContain('z');
    } catch (error) {
      console.log('filter mismatch');
      throw error;
    }
  });

  it('cancel hides the custom input without emitting', () => {
    const handleChange = vi.fn();
    const { container } = render(<ColorPicker value="#888" onChange={handleChange} />);
    try {
      const scope = within(container);
      fireEvent.click(scope.getByRole('button', { name: /custom|hex|\+/i }));
      const cancel = scope.getByRole('button', { name: /cancel|x|✕/i });
      fireEvent.click(cancel);
      expect(scope.queryByRole('textbox')).toBeNull();
    } catch (error) {
      console.log('cancel mismatch');
      throw error;
    }
  });

  it('applies the className prop to the root element', () => {
    const { container } = render(<ColorPicker value="#888" onChange={vi.fn()} className="extra" />);
    try {
      expect(container.querySelector('.color-picker.extra')).toBeTruthy();
    } catch (error) {
      console.log('className mismatch');
      throw error;
    }
  });

  it('falls back to the default color for missing or invalid values', () => {
    render(<ColorPicker />);
    try {
      expect(screen.getByText('#888')).toBeTruthy();
    } catch (error) {
      console.log('missing value mismatch');
      throw error;
    }
    cleanup();
    const second = render(<ColorPicker value="   " />);
    try {
      expect(within(second.container).getByText('#888')).toBeTruthy();
    } catch (error) {
      console.log('blank value mismatch');
      throw error;
    }
    cleanup();
    const third = render(<ColorPicker value="not-a-color" />);
    try {
      expect(within(third.container).getByText('#888')).toBeTruthy();
    } catch (error) {
      console.log('invalid value mismatch');
      throw error;
    }
  });

  it('renders a six-digit hex preview with contrast text', () => {
    render(<ColorPicker value="#aabbcc" />);
    try {
      expect(screen.getByText('#aabbcc')).toBeTruthy();
    } catch (error) {
      console.log('six digit mismatch');
      throw error;
    }
  });

  it('selects a palette color without an onChange handler', () => {
    const { container } = render(<ColorPicker value="#888" />);
    fireEvent.click(within(container).getByTitle('#000'));
    try {
      expect(screen.getByText('#000')).toBeTruthy();
    } catch (error) {
      console.log('no onChange mismatch', container.innerHTML.slice(0, 300));
      throw error;
    }
  });

  it('truncates custom input beyond three hex digits', () => {
    const handleChange = vi.fn();
    const { container } = render(<ColorPicker value="#888" onChange={handleChange} />);
    const scope = within(container);
    fireEvent.click(scope.getByRole('button', { name: 'HEX' }));
    const input = scope.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abcdef' } });
    try {
      expect(input.value).toBe('abc');
      expect(handleChange).toHaveBeenCalledWith('#abc');
    } catch (error) {
      console.log('truncate mismatch', input.value);
      throw error;
    }
  });

  it('applies the custom value and hides the input row', () => {
    const handleChange = vi.fn();
    const { container } = render(<ColorPicker value="#888" onChange={handleChange} />);
    const scope = within(container);
    fireEvent.click(scope.getByRole('button', { name: 'HEX' }));
    fireEvent.change(scope.getByRole('textbox'), { target: { value: '123' } });
    fireEvent.click(scope.getByRole('button', { name: 'Apply' }));
    try {
      expect(scope.queryByRole('textbox')).toBeNull();
      expect(scope.getByRole('button', { name: 'HEX' })).toBeTruthy();
    } catch (error) {
      console.log('apply mismatch', container.innerHTML.slice(0, 400));
      throw error;
    }
  });
});

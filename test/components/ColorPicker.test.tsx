import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ColorPicker } from '../../src/components/ColorPicker';

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

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { within } from '@testing-library/dom';
import ToggleValueButton from '../../src/components/ToggleValueButton';

describe('ToggleValueButton', () => {
  const formatHz = (value: number) => `${value} Hz`;

  it('renders the formatted current value', () => {
    const handleChange = vi.fn();

    const { container } = render(
      <ToggleValueButton
        value={50}
        values={[50, 60]}
        formatValue={formatHz}
        onChange={handleChange}
        ariaLabel="Replay rate"
      />,
    );

    expect(within(container).getByText('50 Hz')).toBeTruthy();
  });

  it('cycles to the next value on click', () => {
    const handleChange = vi.fn();

    const { container } = render(
      <ToggleValueButton
        value={50}
        values={[50, 60]}
        formatValue={formatHz}
        onChange={handleChange}
        ariaLabel="Replay rate"
      />,
    );

    const button = within(container).getByRole('button', { name: 'Replay rate' });
    fireEvent.click(button);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(60);
  });

  it('wraps to the first value after the last', () => {
    const handleChange = vi.fn();

    const { container } = render(
      <ToggleValueButton
        value={60}
        values={[50, 60]}
        formatValue={formatHz}
        onChange={handleChange}
        ariaLabel="Replay rate"
      />,
    );

    const button = within(container).getByRole('button', { name: 'Replay rate' });
    fireEvent.click(button);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(50);
  });

  it('falls back to the first value when current value is not in the list', () => {
    const handleChange = vi.fn();

    const { container } = render(
      <ToggleValueButton
        value={99}
        values={[50, 60]}
        formatValue={formatHz}
        onChange={handleChange}
        ariaLabel="Replay rate"
      />,
    );

    const button = within(container).getByRole('button', { name: 'Replay rate' });
    fireEvent.click(button);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(50);
  });
});

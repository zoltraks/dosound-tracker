import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TransposeModal } from '../../src/modals/TransposeModal.tsx';

afterEach(() => cleanup());

const renderModal = (overrides: Partial<Parameters<typeof TransposeModal>[0]> = {}) =>
  render(
    <TransposeModal
      isOpen={true}
      scope="line"
      trackScope="current"
      instrumentScope="all"
      amount={0}
      amountInput="0"
      onScopeChange={vi.fn()}
      onTrackScopeChange={vi.fn()}
      onInstrumentScopeChange={vi.fn()}
      onAmountChange={vi.fn()}
      onAmountAdjust={vi.fn()}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );

describe('TransposeModal', () => {
  it('renders nothing when closed', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('dispatches the song scope radios', () => {
    const onScopeChange = vi.fn();
    const { container } = renderModal({ onScopeChange });
    const radios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="transpose-scope"]'),
    );
    try {
      expect(radios).toHaveLength(2);
      expect(radios[0].checked).toBe(true);
    } catch (error) {
      console.log('scope radios', radios.length);
      throw error;
    }
    fireEvent.click(radios[1]);
    try {
      expect(onScopeChange).toHaveBeenCalledWith('song');
    } catch (error) {
      console.log('scope dispatch', onScopeChange.mock.calls);
      throw error;
    }
  });

  it('dispatches the track and instrument scope radios', () => {
    const onTrackScopeChange = vi.fn();
    const onInstrumentScopeChange = vi.fn();
    const { container } = renderModal({ onTrackScopeChange, onInstrumentScopeChange });
    const trackRadios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="transpose-track-scope"]'),
    );
    const instRadios = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[name="transpose-inst-scope"]'),
    );
    fireEvent.click(trackRadios[1]);
    fireEvent.click(instRadios[1]);
    try {
      expect(onTrackScopeChange).toHaveBeenCalledWith('all');
      expect(onInstrumentScopeChange).toHaveBeenCalledWith('selected');
    } catch (error) {
      console.log(
        'scope dispatch',
        onTrackScopeChange.mock.calls,
        onInstrumentScopeChange.mock.calls,
      );
      throw error;
    }
  });

  it('sends the semitone deltas from the four amount buttons', () => {
    const onAmountAdjust = vi.fn();
    renderModal({ onAmountAdjust });
    fireEvent.click(screen.getByRole('button', { name: '-12 (OCTAVE DOWN)' }));
    fireEvent.click(screen.getByRole('button', { name: '-1 (NOTE DOWN)' }));
    fireEvent.click(screen.getByRole('button', { name: '+12 (OCTAVE UP)' }));
    fireEvent.click(screen.getByRole('button', { name: '+1 (NOTE UP)' }));
    try {
      expect(onAmountAdjust.mock.calls).toEqual([[-12], [-1], [12], [1]]);
    } catch (error) {
      console.log('adjust calls', onAmountAdjust.mock.calls);
      throw error;
    }
  });

  it('reports spinner commits through onAmountChange', () => {
    const onAmountChange = vi.fn();
    renderModal({ onAmountChange, amount: 0 });
    const input = screen.getByRole('spinbutton', { name: 'Semitone offset' });
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    try {
      expect(onAmountChange).toHaveBeenCalledWith('5');
    } catch (error) {
      console.log('amount change', onAmountChange.mock.calls);
      throw error;
    }
  });

  it('fires onConfirm from OK and onCancel from Cancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderModal({ onConfirm, onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    try {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('action mismatch');
      throw error;
    }
  });
});

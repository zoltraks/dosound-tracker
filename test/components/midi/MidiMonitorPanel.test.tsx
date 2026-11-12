import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MidiMonitorPanel } from '../../../src/components/midi/MidiMonitorPanel.tsx';
import type { MidiMonitorEntry } from '../../../src/utils/midi/midiUtils.ts';

afterEach(() => cleanup());

const entry = (id: number, value: number | null): MidiMonitorEntry => ({
  id,
  time: '00:00:01',
  data: '90 40 64',
  device: 'In A',
  channel: '1',
  type: 'noteOn',
  note: 'E4',
  value,
});

describe('MidiMonitorPanel', () => {
  it('forwards the entries and label to the copy handler', () => {
    const entries = [entry(1, 64), entry(2, null)];
    const onCopy = vi.fn();
    render(<MidiMonitorPanel title="MIDI IN" entries={entries} onCopy={onCopy} />);
    try {
      fireEvent.click(screen.getByRole('button', { name: 'COPY' }));
      expect(onCopy).toHaveBeenCalledTimes(1);
      expect(onCopy).toHaveBeenCalledWith(entries, 'MIDI IN');
      expect(screen.getByText('64')).toBeTruthy();
    } catch (error) {
      console.log('copy-forward mismatch');
      throw error;
    }
  });

  it('disables copy and skips the handler when the monitor is empty', () => {
    const onCopy = vi.fn();
    render(<MidiMonitorPanel title="MIDI OUT" entries={[]} onCopy={onCopy} />);
    try {
      const button = screen.getByRole('button', { name: 'COPY' });
      expect(button.getAttribute('disabled')).not.toBeNull();
      fireEvent.click(button);
      expect(onCopy).not.toHaveBeenCalled();
    } catch (error) {
      console.log('empty-copy mismatch');
      throw error;
    }
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EnvelopeSection } from '../../../src/components/envelope/EnvelopeSection.tsx';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';

afterEach(() => cleanup());

const instrument: Instrument = {
  id: '00',
  name: 'Test',
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
};

const renderSection = (overrides: Partial<Parameters<typeof EnvelopeSection>[0]> = {}) =>
  render(
    <EnvelopeSection
      activeSection="volume"
      setActiveSection={vi.fn()}
      currentInstrument={instrument}
      updateInstrument={vi.fn()}
      messages={['Hello **world**']}
      currentMessageIndex={0}
      isNotesVisible={true}
      onNotesClick={vi.fn()}
      {...overrides}
    />,
  );

describe('EnvelopeSection', () => {
  it('announces the rotating message through a polite status region', () => {
    renderSection();
    const status = screen.getByRole('status');
    try {
      expect(status.classList.contains('message-panel')).toBe(true);
      expect(status.getAttribute('aria-live')).toBe('polite');
      expect(status.getAttribute('aria-hidden')).toBeNull();
    } catch (error) {
      console.log('status region mismatch');
      throw error;
    }
  });
});

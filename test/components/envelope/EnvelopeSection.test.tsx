import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

  it('renders an empty note when the message index is out of range', () => {
    const { container } = renderSection({ currentMessageIndex: -1 });
    try {
      const notes = container.querySelector('.notes-content') as HTMLElement;
      expect(notes).toBeTruthy();
      expect(notes.textContent).toBe('');
    } catch (error) {
      console.log('out-of-range mismatch');
      throw error;
    }
  });

  it('renders an empty note when the message entry is missing', () => {
    const { container } = renderSection({
      messages: [undefined as unknown as string],
      currentMessageIndex: 0,
    });
    try {
      const notes = container.querySelector('.notes-content') as HTMLElement;
      expect(notes).toBeTruthy();
      expect(notes.textContent).toBe('');
    } catch (error) {
      console.log('missing-entry mismatch');
      throw error;
    }
  });

  it('collapses the notes and forwards clicks while hidden', () => {
    const onNotesClick = vi.fn();
    const { container } = renderSection({ isNotesVisible: false, onNotesClick });
    try {
      const notes = container.querySelector('.notes-content') as HTMLElement;
      expect(notes.classList.contains('notes-hidden')).toBe(true);
      fireEvent.click(screen.getByRole('status'));
      expect(onNotesClick).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('hidden-notes mismatch');
      throw error;
    }
  });
});

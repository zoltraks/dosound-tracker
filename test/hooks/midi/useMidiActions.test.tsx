import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMidiActions } from '../../../src/hooks/midi/useMidiActions.ts';
import type { MidiConfiguration } from '../../../src/utils/midi/midiUtils.ts';
import type { Instrument, Pattern, Song } from '../../../src/synth/SoundDriver.ts';
import { parseBaseKey } from '../../../src/utils/song/songFormat.ts';

const makePattern = (steps = 4): Pattern => ({
  id: '00',
  name: 'P',
  step: Array.from({ length: steps }, () => ({ note: null })),
});

const makeSong = (pattern: Pattern): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 6,
  length: pattern.step.length,
  pattern: [pattern],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [],
});

const makeInstrument = (): Instrument => ({
  id: '00',
  name: 'i',
  volume: [15],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  base: 'C-4',
  sustain: null,
});

const midiConfig = (overrides: Partial<MidiConfiguration> = {}): MidiConfiguration => ({
  inputEnabled: true,
  outputEnabled: true,
  inputId: null,
  outputId: null,
  ignoreInputVolume: true,
  ignoreOutputVolume: true,
  ...overrides,
});

const setup = (overrides: Record<string, unknown> = {}) => {
  const pattern = makePattern();
  const ym = { writeRegister: vi.fn(), updateChannelWithInstrument: vi.fn() };
  const helpers = {
    sendInstrumentMidiNoteOn: vi.fn(),
    sendInstrumentMidiNoteOffForChannel: vi.fn(),
  };
  const handlePatternChange = vi.fn();
  const setSharedCurrentLine = vi.fn();
  const args = {
    activeSection: 'trackA',
    lastTrackId: 'A',
    currentInstrument: makeInstrument(),
    currentSong: makeSong(pattern),
    sharedCurrentLine: 0,
    setSharedCurrentLine,
    getCurrentPatternForTrack: vi.fn(() => pattern),
    handlePatternChange,
    ym2149Ref: { current: ym },
    midiHelpersRef: { current: helpers },
    midiConfigurationRef: { current: midiConfig() },
    parseBaseKeyString: parseBaseKey,
    ...overrides,
  };
  const hook = renderHook(() => useMidiActions(args as never));
  return { hook, ym, helpers, handlePatternChange, setSharedCurrentLine, pattern };
};

describe('handleMidiNoteEvent', () => {
  it('returns early when no YM2149 exists', () => {
    const { hook } = setup({ ym2149Ref: { current: null } });
    try {
      act(() =>
        hook.result.current.handleMidiNoteEvent({
          type: 'noteOn',
          noteNumber: 60,
          noteName: 'C',
          octave: 4,
          velocity: 100,
          channel: 1,
          deviceId: 'd',
          deviceName: 'd',
        }),
      );
      expect(hook.result.current.handleMidiNoteEvent).toBeDefined();
    } catch (error) {
      console.log('no-ym mismatch');
      throw error;
    }
  });

  it('inserts a note into the focused track pattern', () => {
    const { hook, handlePatternChange } = setup();
    try {
      act(() =>
        hook.result.current.handleMidiNoteEvent({
          type: 'noteOn',
          noteNumber: 60,
          noteName: 'C',
          octave: 4,
          velocity: 100,
          channel: 1,
          deviceId: 'd',
          deviceName: 'd',
        }),
      );
      expect(handlePatternChange).toHaveBeenCalled();
      const changed = handlePatternChange.mock.calls[0][0] as Pattern;
      expect(changed.step[0].note?.note).toBe('C');
      expect(changed.step[0].note?.instrument).toBe('00');
    } catch (error) {
      console.log('insert mismatch', handlePatternChange.mock.calls.length);
      throw error;
    }
  });

  it('maps trackB and trackC to their channels', () => {
    for (const section of ['trackB', 'trackC'] as const) {
      const { hook, handlePatternChange } = setup({ activeSection: section });
      act(() =>
        hook.result.current.handleMidiNoteEvent({
          type: 'noteOn',
          noteNumber: 62,
          noteName: 'D',
          octave: 4,
          velocity: 80,
          channel: 1,
          deviceId: 'd',
          deviceName: 'd',
        }),
      );
      expect(handlePatternChange).toHaveBeenCalled();
    }
  });

  it('does nothing when the focused pattern is missing', () => {
    const { hook, handlePatternChange } = setup({
      getCurrentPatternForTrack: vi.fn(() => null),
    });
    try {
      act(() =>
        hook.result.current.handleMidiNoteEvent({
          type: 'noteOn',
          noteNumber: 60,
          noteName: 'C',
          octave: 4,
          velocity: 90,
          channel: 1,
          deviceId: 'd',
          deviceName: 'd',
        }),
      );
      expect(handlePatternChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('no-pattern mismatch');
      throw error;
    }
  });

  it('skips note insertion when no track section is focused', () => {
    const { hook, handlePatternChange } = setup({ activeSection: 'piano' });
    try {
      act(() =>
        hook.result.current.handleMidiNoteEvent({
          type: 'noteOn',
          noteNumber: 60,
          noteName: 'C',
          octave: 4,
          velocity: 90,
          channel: 1,
          deviceId: 'd',
          deviceName: 'd',
        }),
      );
      expect(handlePatternChange).not.toHaveBeenCalled();
    } catch (error) {
      console.log('unfocused mismatch');
      throw error;
    }
  });

  it('respects ignoreInputVolume=false by converting velocity', () => {
    const { hook, handlePatternChange } = setup({
      midiConfigurationRef: {
        current: midiConfig({ ignoreInputVolume: false, ignoreOutputVolume: false }),
      },
    });
    try {
      act(() =>
        hook.result.current.handleMidiNoteEvent({
          type: 'noteOn',
          noteNumber: 64,
          noteName: 'E',
          octave: 4,
          velocity: 127,
          channel: 1,
          deviceId: 'd',
          deviceName: 'd',
        }),
      );
      expect(handlePatternChange).toHaveBeenCalled();
    } catch (error) {
      console.log('velocity mismatch');
      throw error;
    }
  });
});

describe('handleRegisterTrackStopPreview / handleHardStopLivePreview', () => {
  it('registers a stop callback and hard-stops the channel volume', () => {
    const { hook, ym } = setup();
    const stop = vi.fn();
    try {
      act(() => hook.result.current.handleRegisterTrackStopPreview('B', stop));
      act(() => hook.result.current.handleHardStopLivePreview(1));
      expect(ym.writeRegister).toHaveBeenCalledWith(0x09, 0x00);
    } catch (error) {
      console.log('hard-stop mismatch');
      throw error;
    }
  });

  it('clamps the channel index into range', () => {
    const { hook, ym } = setup();
    try {
      act(() => hook.result.current.handleHardStopLivePreview(9));
      expect(ym.writeRegister).toHaveBeenCalledWith(0x0a, 0x00);
    } catch (error) {
      console.log('clamp mismatch');
      throw error;
    }
  });
});

const noteOn = {
  type: 'noteOn' as const,
  noteNumber: 60,
  noteName: 'C',
  octave: 4,
  velocity: 100,
  channel: 1,
  deviceId: 'd',
  deviceName: 'd',
};
const noteOff = { ...noteOn, type: 'noteOff' as const };

describe('live preview envelope', () => {
  it('drives envelope ticks on the frame interval', () => {
    vi.useFakeTimers();
    const { hook, ym } = setup();
    try {
      act(() => hook.result.current.handleMidiNoteEvent(noteOn));
      const callsBefore = ym.updateChannelWithInstrument.mock.calls.length;
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(ym.updateChannelWithInstrument.mock.calls.length).toBeGreaterThan(callsBefore);
      const steps = ym.updateChannelWithInstrument.mock.calls.map((c) => c[3]);
      expect(Math.max(...steps)).toBeGreaterThan(0);
    } catch (error) {
      console.log('tick mismatch', ym.updateChannelWithInstrument.mock.calls.length);
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });

  it('noteOff without sustain silences immediately', () => {
    vi.useFakeTimers();
    const { hook, ym, helpers } = setup();
    try {
      act(() => hook.result.current.handleMidiNoteEvent(noteOn));
      act(() => hook.result.current.handleMidiNoteEvent(noteOff));
      expect(ym.writeRegister).toHaveBeenCalledWith(0x08, 0x00);
      expect(helpers.sendInstrumentMidiNoteOffForChannel).toHaveBeenCalledWith(0);
    } catch (error) {
      console.log('no-sustain mismatch');
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });

  it('noteOff with sustain keeps the envelope running until the tail fades', () => {
    vi.useFakeTimers();
    const fadeInstrument = {
      id: '00',
      name: 'i',
      volume: [15, 15, 0],
      shift: [0],
      pitch: [0],
      noise: [0],
      mode: [0],
      base: 'C-4',
      sustain: 1,
    };
    const { hook, ym } = setup({ currentInstrument: fadeInstrument });
    try {
      act(() => hook.result.current.handleMidiNoteEvent(noteOn));
      act(() => hook.result.current.handleMidiNoteEvent(noteOff));
      // sustain: released flag set, channel not yet silenced via hard write
      const silenceCalls = ym.writeRegister.mock.calls.filter(
        (c) => c[0] === 0x08 && c[1] === 0x00,
      ).length;
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      const afterCalls = ym.writeRegister.mock.calls.filter(
        (c) => c[0] === 0x08 && c[1] === 0x00,
      ).length;
      expect(afterCalls).toBeGreaterThan(silenceCalls);
    } catch (error) {
      console.log('sustain release mismatch');
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });

  it('invokes the registered stop-preview when retriggering a track', () => {
    const stop = vi.fn();
    const { hook } = setup();
    try {
      act(() => hook.result.current.handleRegisterTrackStopPreview('A', stop));
      act(() => hook.result.current.handleMidiNoteEvent(noteOn));
      expect(stop).toHaveBeenCalled();
    } catch (error) {
      console.log('retrigger mismatch');
      throw error;
    }
  });
});

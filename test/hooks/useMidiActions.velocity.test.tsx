import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import type { YM2149 } from '../../src/synth/YM2149';
import type { Instrument, Pattern, Song } from '../../src/synth/SoundDriver';
import { useMidiActions } from '../../src/hooks/useMidiActions';
import type { MidiConfig, MidiNoteEvent } from '../../src/hooks/useMidi';

type HookResult = ReturnType<typeof useMidiActions>;

const makeInstrument = (): Instrument => ({
  id: '00',
  name: 'Test',
  volume: [0x0f],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  sustain: null,
  base: 'C-4',
  midi: {
    channel: 1,
    program: 0,
  },
});

const makeSong = (): Song => ({
  title: 'Test',
  author: 'Test',
  year: 2025,
  speed: 6,
  length: 64,
  pattern: [],
  line: [],
  instrument: [makeInstrument()],
});

const makeMidiConfig = (overrides: Partial<MidiConfig> = {}): MidiConfig => ({
  inputEnabled: true,
  outputEnabled: true,
  inputId: 'in',
  outputId: 'out',
  ignoreInputVolume: true,
  ignoreOutputVolume: true,
  ...overrides,
});

const makeNoteEvent = (overrides: Partial<MidiNoteEvent> = {}): MidiNoteEvent => ({
  type: 'noteOn',
  noteNumber: 60,
  noteName: 'C',
  octave: 4,
  velocity: 20,
  channel: 1,
  deviceId: 'dev',
  deviceName: 'dev',
  ...overrides,
});

const UseMidiActionsHarness: React.FC<{
  onReady: (value: HookResult) => void;
  args: Record<string, unknown>;
}> = ({ onReady, args }) => {
  const result = useMidiActions(args as never);

  React.useEffect(() => {
    onReady(result);
  }, [result, onReady]);

  return null;
};

describe('useMidiActions velocity handling', () => {
  it('scales YM preview volume from incoming velocity when ignoreInputVolume is false', async () => {
    const ym2149 = {
      updateChannelWithInstrument: vi.fn(),
      writeRegister: vi.fn(),
    } as unknown as YM2149;

    const midiHelpers = {
      sendInstrumentMidiNoteOn: vi.fn(),
      sendInstrumentMidiNoteOffForChannel: vi.fn(),
    };

    const midiConfigRef = {
      current: makeMidiConfig({ ignoreInputVolume: false, ignoreOutputVolume: true }),
    } as React.RefObject<MidiConfig | null>;

    const ym2149Ref = { current: ym2149 } as React.RefObject<YM2149 | null>;
    const midiHelpersRef = { current: midiHelpers } as React.RefObject<typeof midiHelpers | null>;

    const pattern: Pattern = { id: 'p1', name: 'p1', step: [] };

    let hook: HookResult | null = null;
    const renderResult = render(
      <UseMidiActionsHarness
        onReady={value => {
          hook = value;
        }}
        args={{
          activeSection: 'piano',
          lastTrackId: 'A',
          currentInstrument: makeInstrument(),
          currentSong: makeSong(),
          sharedCurrentLine: 0,
          setSharedCurrentLine: vi.fn(),
          getCurrentPatternForTrack: vi.fn(() => pattern),
          handlePatternChange: vi.fn(),
          ym2149Ref,
          midiHelpersRef,
          midiConfigRef,
          parseBaseKeyString: vi.fn(() => ({ note: 'C', octave: 4 })),
        }}
      />
    );

    await waitFor(() => expect(hook).not.toBeNull());

    await act(async () => {
      hook!.handleMidiNoteEvent(makeNoteEvent({ type: 'noteOn', velocity: 20 }));
      hook!.handleMidiNoteEvent(makeNoteEvent({ type: 'noteOff', velocity: 0 }));
    });

    expect(ym2149.updateChannelWithInstrument).toHaveBeenCalledTimes(1);
    const call = (ym2149.updateChannelWithInstrument as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(call[4]).toBe(2);

    renderResult.unmount();
  });

  it('keeps YM preview at full volume when ignoreInputVolume is true', async () => {
    const ym2149 = {
      updateChannelWithInstrument: vi.fn(),
      writeRegister: vi.fn(),
    } as unknown as YM2149;

    const midiHelpers = {
      sendInstrumentMidiNoteOn: vi.fn(),
      sendInstrumentMidiNoteOffForChannel: vi.fn(),
    };

    const midiConfigRef = {
      current: makeMidiConfig({ ignoreInputVolume: true, ignoreOutputVolume: true }),
    } as React.RefObject<MidiConfig | null>;

    const ym2149Ref = { current: ym2149 } as React.RefObject<YM2149 | null>;
    const midiHelpersRef = { current: midiHelpers } as React.RefObject<typeof midiHelpers | null>;

    const pattern: Pattern = { id: 'p1', name: 'p1', step: [] };

    let hook: HookResult | null = null;
    const renderResult = render(
      <UseMidiActionsHarness
        onReady={value => {
          hook = value;
        }}
        args={{
          activeSection: 'piano',
          lastTrackId: 'A',
          currentInstrument: makeInstrument(),
          currentSong: makeSong(),
          sharedCurrentLine: 0,
          setSharedCurrentLine: vi.fn(),
          getCurrentPatternForTrack: vi.fn(() => pattern),
          handlePatternChange: vi.fn(),
          ym2149Ref,
          midiHelpersRef,
          midiConfigRef,
          parseBaseKeyString: vi.fn(() => ({ note: 'C', octave: 4 })),
        }}
      />
    );

    await waitFor(() => expect(hook).not.toBeNull());

    await act(async () => {
      hook!.handleMidiNoteEvent(makeNoteEvent({ type: 'noteOn', velocity: 1 }));
      hook!.handleMidiNoteEvent(makeNoteEvent({ type: 'noteOff', velocity: 0 }));
    });

    const call = (ym2149.updateChannelWithInstrument as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(call[4]).toBe(0x0f);

    renderResult.unmount();
  });

  it('forwards raw MIDI velocity to MIDI out when ignoreOutputVolume is false', async () => {
    const ym2149 = {
      updateChannelWithInstrument: vi.fn(),
      writeRegister: vi.fn(),
    } as unknown as YM2149;

    const midiHelpers = {
      sendInstrumentMidiNoteOn: vi.fn(),
      sendInstrumentMidiNoteOffForChannel: vi.fn(),
    };

    const midiConfigRef = {
      current: makeMidiConfig({ ignoreInputVolume: true, ignoreOutputVolume: false }),
    } as React.RefObject<MidiConfig | null>;

    const ym2149Ref = { current: ym2149 } as React.RefObject<YM2149 | null>;
    const midiHelpersRef = { current: midiHelpers } as React.RefObject<typeof midiHelpers | null>;

    const pattern: Pattern = { id: 'p1', name: 'p1', step: [] };

    let hook: HookResult | null = null;
    const renderResult = render(
      <UseMidiActionsHarness
        onReady={value => {
          hook = value;
        }}
        args={{
          activeSection: 'piano',
          lastTrackId: 'A',
          currentInstrument: makeInstrument(),
          currentSong: makeSong(),
          sharedCurrentLine: 0,
          setSharedCurrentLine: vi.fn(),
          getCurrentPatternForTrack: vi.fn(() => pattern),
          handlePatternChange: vi.fn(),
          ym2149Ref,
          midiHelpersRef,
          midiConfigRef,
          parseBaseKeyString: vi.fn(() => ({ note: 'C', octave: 4 })),
        }}
      />
    );

    await waitFor(() => expect(hook).not.toBeNull());

    await act(async () => {
      hook!.handleMidiNoteEvent(makeNoteEvent({ type: 'noteOn', velocity: 38 }));
      hook!.handleMidiNoteEvent(makeNoteEvent({ type: 'noteOff', velocity: 0 }));
    });

    expect(midiHelpers.sendInstrumentMidiNoteOn).toHaveBeenCalledTimes(1);
    expect(midiHelpers.sendInstrumentMidiNoteOn).toHaveBeenCalledWith(
      0,
      expect.any(Object),
      expect.any(String),
      expect.any(Number),
      null,
      38
    );

    renderResult.unmount();
  });
});

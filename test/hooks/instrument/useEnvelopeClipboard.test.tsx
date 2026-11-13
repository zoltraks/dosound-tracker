import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useEnvelopeClipboard } from '../../../src/hooks/instrument/useEnvelopeClipboard.ts';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'Test',
  volume: [15, 10, 0],
  shift: [0, 4, 7],
  pitch: [0, 1, -1],
  noise: [8, 0],
  mode: [1, 0],
  ...overrides,
});

const makeArgs = (overrides: Record<string, unknown> = {}) => ({
  activeSection: 'volume' as const,
  currentInstrument: makeInstrument(),
  updateInstrument: vi.fn(),
  setError: vi.fn(),
  ...overrides,
});

const stubClipboard = (text = '') => {
  const clipboard = {
    readText: vi.fn(async () => text),
    writeText: vi.fn(async (value: string) => {
      clipboard.written = value;
    }),
    written: '',
  };
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
  return clipboard;
};

describe('useEnvelopeClipboard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('copies the active envelope to the clipboard', async () => {
    const clipboard = stubClipboard();
    const args = makeArgs();
    const { result } = renderHook(() => useEnvelopeClipboard(args));
    await act(async () => {
      await result.current.handleCopyEnvelope();
    });
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(clipboard.written).toContain('volume:');
    expect(args.setError).not.toHaveBeenCalled();
  });

  it('includes the sustain index on a volume copy', async () => {
    const clipboard = stubClipboard();
    const args = makeArgs({ currentInstrument: makeInstrument({ sustain: 8 }) });
    const { result } = renderHook(() => useEnvelopeClipboard(args));
    await act(async () => {
      await result.current.handleCopyEnvelope();
    });
    expect(clipboard.written).toContain('sustain: 8');
  });

  it('pastes a matching envelope through updateInstrument', async () => {
    stubClipboard('volume: [14, 12, 9]\nsustain: 4\n');
    const args = makeArgs();
    const { result } = renderHook(() => useEnvelopeClipboard(args));
    await act(async () => {
      await result.current.handlePasteEnvelope();
    });
    expect(args.updateInstrument).toHaveBeenCalledTimes(1);
    const patch = args.updateInstrument.mock.calls[0][0] as Partial<Instrument>;
    expect(patch.volume?.slice(0, 3)).toEqual([14, 12, 9]);
    expect(patch.volume).toHaveLength(32);
    expect(patch.sustain).toBe(4);
  });

  it('reports a type mismatch without touching the instrument', async () => {
    stubClipboard('pitch: [1, 2]\n');
    const args = makeArgs();
    const { result } = renderHook(() => useEnvelopeClipboard(args));
    await act(async () => {
      await result.current.handlePasteEnvelope();
    });
    expect(args.updateInstrument).not.toHaveBeenCalled();
    expect(args.setError).toHaveBeenCalledWith(
      expect.stringContaining('does not contain a Volume envelope'),
    );
  });

  it('reports an empty clipboard', async () => {
    stubClipboard('   ');
    const args = makeArgs();
    const { result } = renderHook(() => useEnvelopeClipboard(args));
    await act(async () => {
      await result.current.handlePasteEnvelope();
    });
    expect(args.updateInstrument).not.toHaveBeenCalled();
    expect(args.setError).toHaveBeenCalledWith(expect.stringContaining('empty'));
  });

  it('no-ops when the active section is not an envelope section', async () => {
    const clipboard = stubClipboard('volume: [9]\n');
    const args = makeArgs({ activeSection: 'trackA' });
    const { result } = renderHook(() => useEnvelopeClipboard(args));
    expect(result.current.isEnvelopeSectionActive).toBe(false);
    await act(async () => {
      await result.current.handleCopyEnvelope();
      await result.current.handlePasteEnvelope();
    });
    expect(clipboard.writeText).not.toHaveBeenCalled();
    expect(clipboard.readText).not.toHaveBeenCalled();
    expect(args.updateInstrument).not.toHaveBeenCalled();
  });
});

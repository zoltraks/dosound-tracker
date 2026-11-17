import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSongImportWarning } from '../../../src/hooks/song/useSongImportWarning.ts';
import type { PendingSongImport } from '../../../src/hooks/song/useDataManagement.ts';
import type { SongParseMetadata } from '../../../src/utils/song/songParser.ts';
import type { Song } from '../../../src/synth/SoundDriver.ts';
import { SUPPORTED_SONG_CHIPS, SUPPORTED_SONG_FRAMES } from '../../../src/constants/song.ts';

const makeSong = (): Song => ({
  title: 'Test',
  author: 'Author',
  year: 2026,
  speed: 6,
  length: 4,
  pattern: [],
  line: [],
  instrument: [],
});

const makeMetadata = (overrides: Partial<SongParseMetadata> = {}): SongParseMetadata => ({
  hasChipField: false,
  providedChipValue: undefined,
  normalizedChip: 'YM',
  isChipSupported: true,
  hasFrameField: false,
  providedFrameValue: undefined,
  normalizedFrame: 50,
  isFrameSupported: true,
  hasClockField: false,
  providedClockValue: undefined,
  normalizedClock: 2000000,
  isClockSupported: true,
  ...overrides,
});

const makePending = (metadata: SongParseMetadata): PendingSongImport => ({
  song: makeSong(),
  metadata,
});

const makeParams = (pending: PendingSongImport | null) => ({
  pendingSongImport: pending,
  confirmPendingSongImport: vi.fn(),
  cancelPendingSongImport: vi.fn(),
});

describe('useSongImportWarning', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('returns an empty message without a pending import', () => {
    const { result } = renderHook(() => useSongImportWarning(makeParams(null)));

    expect(result.current.configurationWarningMessage).toBe('');
  });

  it('returns an empty message when the configuration is fully supported', () => {
    const params = makeParams(makePending(makeMetadata()));
    const { result } = renderHook(() => useSongImportWarning(params));

    expect(result.current.configurationWarningMessage).toBe('');
  });

  it('warns about an unsupported chip using the provided value', () => {
    const params = makeParams(
      makePending(
        makeMetadata({
          hasChipField: true,
          providedChipValue: 'SID',
          normalizedChip: 'SID',
          isChipSupported: false,
        }),
      ),
    );
    const { result } = renderHook(() => useSongImportWarning(params));

    const message = result.current.configurationWarningMessage;
    expect(message).toContain('Chip value "SID" is not supported.');
    expect(message).toContain(`Supported chips: ${SUPPORTED_SONG_CHIPS.join(', ')}.`);
    expect(message).toContain('Load the song anyway?');
  });

  it('falls back to the normalized chip when no provided value exists', () => {
    const params = makeParams(
      makePending(
        makeMetadata({
          hasChipField: true,
          providedChipValue: undefined,
          normalizedChip: 'OPL',
          isChipSupported: false,
        }),
      ),
    );
    const { result } = renderHook(() => useSongImportWarning(params));

    expect(result.current.configurationWarningMessage).toContain('Chip value "OPL"');
  });

  it('warns about an unsupported frame rate', () => {
    const params = makeParams(
      makePending(
        makeMetadata({
          hasFrameField: true,
          providedFrameValue: 48,
          normalizedFrame: 48,
          isFrameSupported: false,
        }),
      ),
    );
    const { result } = renderHook(() => useSongImportWarning(params));

    const message = result.current.configurationWarningMessage;
    expect(message).toContain('Frame value "48" is not supported.');
    expect(message).toContain(`Supported frame rates: ${SUPPORTED_SONG_FRAMES.join(', ')}.`);
  });

  it('joins chip and frame warnings into one message', () => {
    const params = makeParams(
      makePending(
        makeMetadata({
          hasChipField: true,
          providedChipValue: 'SID',
          normalizedChip: 'SID',
          isChipSupported: false,
          hasFrameField: true,
          providedFrameValue: 48,
          normalizedFrame: 48,
          isFrameSupported: false,
        }),
      ),
    );
    const { result } = renderHook(() => useSongImportWarning(params));

    const message = result.current.configurationWarningMessage;
    expect(message).toContain('Chip value "SID" is not supported.');
    expect(message).toContain('Frame value "48" is not supported.');
    expect(message.indexOf('Chip value')).toBeLessThan(message.indexOf('Frame value'));
    expect(message.endsWith('Load the song anyway?')).toBe(true);
  });

  it('routes confirm and cancel to the pending import callbacks', () => {
    const params = makeParams(makePending(makeMetadata()));
    const { result } = renderHook(() => useSongImportWarning(params));

    act(() => {
      result.current.handleConfirmSongConfigurationWarning();
    });
    expect(params.confirmPendingSongImport).toHaveBeenCalledTimes(1);
    expect(params.cancelPendingSongImport).not.toHaveBeenCalled();

    act(() => {
      result.current.handleCancelSongConfigurationWarning();
    });
    expect(params.cancelPendingSongImport).toHaveBeenCalledTimes(1);
  });
});

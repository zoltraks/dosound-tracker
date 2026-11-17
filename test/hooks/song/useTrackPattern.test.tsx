import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useTrackPattern } from '../../../src/hooks/song/useTrackPattern.ts';
import type { Song, Pattern } from '../../../src/synth/SoundDriver.ts';
import { PATTERN_LENGTH } from '../../../src/constants/music.ts';
import { logger } from '../../../src/utils/log/logger.ts';

const makePattern = (id: string, overrides: Partial<Pattern> = {}): Pattern => ({
  id,
  name: `Pattern ${id}`,
  step: [{ note: null }],
  ...overrides,
});

const makeSong = (overrides: Partial<Song> = {}): Song => ({
  title: 'Test',
  author: 'Author',
  year: 2026,
  speed: 6,
  length: 4,
  pattern: [makePattern('00')],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [],
  ...overrides,
});

const makeParams = (overrides: Record<string, unknown> = {}) => ({
  currentSong: makeSong(),
  sequencerPatternIndex: 0,
  updateSong: vi.fn(),
  ...overrides,
});

describe('useTrackPattern', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('getCurrentPatternForTrack', () => {
    it('returns null when the playlist is empty', () => {
      const params = makeParams({ currentSong: makeSong({ line: [] }) });
      const { result } = renderHook(() => useTrackPattern(params));

      expect(result.current.getCurrentPatternForTrack('A')).toBeNull();
      expect(params.updateSong).not.toHaveBeenCalled();
    });

    it('returns null when the track slot is empty', () => {
      const params = makeParams();
      const { result } = renderHook(() => useTrackPattern(params));

      expect(result.current.getCurrentPatternForTrack('B')).toBeNull();
      expect(result.current.getCurrentPatternForTrack('C')).toBeNull();
    });

    it('returns the existing pattern for the track without writing', () => {
      const song = makeSong({ pattern: [makePattern('00'), makePattern('01')] });
      const params = makeParams({ currentSong: song });
      const { result } = renderHook(() => useTrackPattern(params));

      const pattern = result.current.getCurrentPatternForTrack('A');

      expect(pattern?.id).toBe('00');
      expect(params.updateSong).not.toHaveBeenCalled();
    });

    it('creates and registers a missing pattern with record disabled', () => {
      const song = makeSong({ line: [{ A: '07', B: '--', C: '--' }] });
      const params = makeParams({ currentSong: song });
      const { result } = renderHook(() => useTrackPattern(params));

      const pattern = result.current.getCurrentPatternForTrack('A');

      expect(pattern?.id).toBe('07');
      expect(pattern?.name).toBe('Pattern 07');
      expect(pattern?.step).toHaveLength(4);
      expect(params.updateSong).toHaveBeenCalledWith(
        {
          pattern: [song.pattern[0], expect.objectContaining({ id: '07', name: 'Pattern 07' })],
        },
        { record: false },
      );
    });

    it('sizes a created pattern from the song length', () => {
      const song = makeSong({ length: 9, line: [{ A: '07', B: '--', C: '--' }] });
      const params = makeParams({ currentSong: song });
      const { result } = renderHook(() => useTrackPattern(params));

      const pattern = result.current.getCurrentPatternForTrack('A');

      expect(pattern?.step).toHaveLength(9);
    });

    it('falls back to PATTERN_LENGTH when the song length is zero', () => {
      const song = makeSong({ length: 0, line: [{ A: '07', B: '--', C: '--' }] });
      const params = makeParams({ currentSong: song });
      const { result } = renderHook(() => useTrackPattern(params));

      const pattern = result.current.getCurrentPatternForTrack('A');

      expect(pattern?.step).toHaveLength(PATTERN_LENGTH);
    });

    it('clamps the sequencer index into the playlist range', () => {
      const song = makeSong({
        line: [
          { A: '00', B: '--', C: '--' },
          { A: '01', B: '--', C: '--' },
        ],
      });
      const beyond = makeParams({ currentSong: song, sequencerPatternIndex: 99 });
      const { result: beyondResult } = renderHook(() => useTrackPattern(beyond));
      expect(beyondResult.current.getCurrentPatternForTrack('A')?.id).toBe('01');

      const before = makeParams({ currentSong: song, sequencerPatternIndex: -3 });
      const { result: beforeResult } = renderHook(() => useTrackPattern(before));
      expect(beforeResult.current.getCurrentPatternForTrack('A')?.id).toBe('00');
    });
  });

  describe('handlePatternChange', () => {
    it('logs an error and writes nothing when the pattern has no id', () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
      const params = makeParams();
      const { result } = renderHook(() => useTrackPattern(params));

      act(() => {
        result.current.handlePatternChange({ id: '', name: 'x', step: [] });
      });

      expect(errorSpy).toHaveBeenCalled();
      expect(params.updateSong).not.toHaveBeenCalled();
    });

    it('logs an error and writes nothing when the pattern id is unknown', () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
      const params = makeParams();
      const { result } = renderHook(() => useTrackPattern(params));

      act(() => {
        result.current.handlePatternChange(makePattern('zz'));
      });

      expect(errorSpy).toHaveBeenCalledWith('Pattern not found with ID', 'zz');
      expect(params.updateSong).not.toHaveBeenCalled();
    });

    it('replaces the matching pattern and writes the song', () => {
      const params = makeParams();
      const { result } = renderHook(() => useTrackPattern(params));
      const replacement = makePattern('00', { name: 'Renamed' });

      act(() => {
        result.current.handlePatternChange(replacement);
      });

      expect(params.updateSong).toHaveBeenCalledWith({
        pattern: [replacement],
      });
    });
  });
});

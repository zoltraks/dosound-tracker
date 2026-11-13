import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useDownloadAvailability } from '../../../src/hooks/file/useDownloadAvailability.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it.each([
  [200, 'text/plain', '.gitkeep\nLIST.txt\r\n song.yaml\n', true],
  [200, 'text/plain', ' .gitkeep\nother/LIST.txt\n', false],
  [200, 'text/html', 'song.yaml', false],
  [200, 'text/plain', '<!doctype html>', false],
  [200, 'text/plain', '<html>', false],
  [404, 'text/plain', 'song.yaml', false],
])(
  'checks whether the download index lists usable files (%s %s %j)',
  async (status, contentType, body, expected) => {
    const fetchIndex = vi.fn(
      async () => new Response(body, { status, headers: { 'content-type': contentType } }),
    );
    vi.stubGlobal('fetch', fetchIndex);
    const { result } = renderHook(() => useDownloadAvailability());
    await act(async () => {});
    expect(fetchIndex).toHaveBeenCalledWith(expect.stringMatching(/^download\/LIST\.txt\?ts=/u), {
      cache: 'no-store',
    });
    expect(result.current).toBe(expected);
  },
);

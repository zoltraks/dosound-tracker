import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchBundledMarkdown } from '../../../src/utils/markdown/bundledMarkdown.ts';

const stubFetch = (
  impl: () => Promise<{
    ok: boolean;
    headers?: { get: (name: string) => string | null };
    text: () => Promise<string>;
  }>,
) => {
  vi.stubGlobal('fetch', vi.fn(impl));
};

const okResponse = (body: string, contentType = 'text/markdown') =>
  Promise.resolve({
    ok: true,
    headers: { get: () => contentType },
    text: () => Promise.resolve(body),
  });

describe('fetchBundledMarkdown', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects names outside the allowlist without fetching', async () => {
    stubFetch(() => okResponse('x'));
    try {
      await expect(fetchBundledMarkdown('SECRET.md')).rejects.toThrow('not allowed');
      await expect(fetchBundledMarkdown('../etc/passwd')).rejects.toThrow('not allowed');
      await expect(fetchBundledMarkdown('https://evil.example/x.md')).rejects.toThrow(
        'not allowed',
      );
      expect(fetch).not.toHaveBeenCalled();
    } catch (error) {
      console.log('allowlist mismatch');
      throw error;
    }
  });

  it('loads each allowlisted document', async () => {
    stubFetch(() => okResponse('# Hi'));
    try {
      for (const name of ['MESSAGES.md', 'CHANGELOG.md', 'MANUAL.md']) {
        await expect(fetchBundledMarkdown(name)).resolves.toBe('# Hi');
      }
      expect(fetch).toHaveBeenCalledTimes(3);
    } catch (error) {
      console.log('allowlist load mismatch');
      throw error;
    }
  });

  it('rejects a non-ok response', async () => {
    stubFetch(() =>
      Promise.resolve({
        ok: false,
        headers: { get: () => 'text/markdown' },
        text: () => Promise.resolve('x'),
      }),
    );
    try {
      await expect(fetchBundledMarkdown('MESSAGES.md')).rejects.toThrow('Failed to load');
    } catch (error) {
      console.log('non-ok mismatch');
      throw error;
    }
  });

  it('rejects an HTML content-type response', async () => {
    stubFetch(() => okResponse('# Hi', 'text/html; charset=utf-8'));
    try {
      await expect(fetchBundledMarkdown('MANUAL.md')).rejects.toThrow('appears to be HTML');
    } catch (error) {
      console.log('content-type mismatch');
      throw error;
    }
  });

  it('rejects bodies that look like HTML even with a text content-type', async () => {
    stubFetch(() => okResponse('<!doctype html><html><body>fallback</body>', 'text/plain'));
    try {
      await expect(fetchBundledMarkdown('MANUAL.md')).rejects.toThrow('appears to be HTML');
    } catch (error) {
      console.log('body sniff mismatch');
      throw error;
    }
  });
});

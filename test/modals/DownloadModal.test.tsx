import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { DownloadModal } from '../../src/modals/DownloadModal.tsx';

afterEach(() => cleanup());

const stubListFetch = (files: string[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'text/plain' },
      text: async () => files.join('\n'),
    })),
  );
};

describe('DownloadModal', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing when closed', () => {
    stubListFetch([]);
    const { container } = render(<DownloadModal isOpen={false} onClose={() => {}} />);
    try {
      expect(container.querySelector('.modal-dialog')).toBeNull();
    } catch (error) {
      console.log('closed render produced content:', container.innerHTML);
      throw error;
    }
  });

  it('renders the Downloads title and file links from LIST.txt', async () => {
    stubListFetch(['release-a.dmg', 'release-b.zip']);
    render(<DownloadModal isOpen={true} onClose={() => {}} />);
    try {
      expect(screen.getByText('Downloads')).toBeTruthy();
      await waitFor(() => {
        expect(screen.getByText('release-a.dmg')).toBeTruthy();
      });
      const links = screen.getAllByRole('link');
      expect(links.map((link) => link.getAttribute('href'))).toContain('download/release-a.dmg');
    } catch (error) {
      console.log('download list render mismatch');
      throw error;
    }
  });

  it('propagates onClose', async () => {
    stubListFetch(['release-a.dmg']);
    const onClose = vi.fn();
    render(<DownloadModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('release-a.dmg')).toBeTruthy();
    });
    try {
      fireEvent.click(screen.getByRole('button', { name: 'CLOSE' }));
      expect(onClose).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('onClose not propagated');
      throw error;
    }
  });
});

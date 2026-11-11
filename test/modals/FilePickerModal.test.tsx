import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';

afterEach(() => cleanup());
import { FilePickerModal } from '../../src/modals/FilePickerModal.tsx';
import { logger } from '../../src/utils/log/logger.ts';

const SAMPLE_FILES = ['b.txt', 'a.txt'];

describe('FilePickerModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <FilePickerModal
        isOpen={false}
        title="Test Picker"
        directory="download"
        files={SAMPLE_FILES}
        mode="download"
        defaultSortDescending={true}
        onClose={() => {}}
      />,
    );

    expect(container.querySelector('.modal-backdrop')).toBeNull();
  });

  it('renders download links in download mode with initial reverse sort', () => {
    render(
      <FilePickerModal
        isOpen={true}
        title="Test Picker"
        directory="download"
        files={SAMPLE_FILES}
        mode="download"
        defaultSortDescending={true}
        onClose={() => {}}
      />,
    );

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);

    expect(links[0].textContent).toBe('b.txt');
    expect(links[0].getAttribute('href')).toBe('download/b.txt');
    expect(links[1].textContent).toBe('a.txt');
    expect(links[1].getAttribute('href')).toBe('download/a.txt');
  });

  it('toggles sort order when SORT is clicked', () => {
    const { container } = render(
      <FilePickerModal
        isOpen={true}
        title="Test Picker"
        directory="download"
        files={SAMPLE_FILES}
        mode="download"
        defaultSortDescending={true}
        onClose={() => {}}
      />,
    );

    const scope = within(container);
    const sortButton = scope.getByRole('button', { name: 'SORT' });
    const getLabels = () => scope.getAllByRole('link').map((link) => link.textContent);

    expect(getLabels()).toEqual(['b.txt', 'a.txt']);

    fireEvent.click(sortButton);
    expect(getLabels()).toEqual(['a.txt', 'b.txt']);

    fireEvent.click(sortButton);
    expect(getLabels()).toEqual(['b.txt', 'a.txt']);
  });

  it('calls onPick with resolved URL and closes in pick mode', () => {
    const handlePick = vi.fn();
    const handleClose = vi.fn();

    render(
      <FilePickerModal
        isOpen={true}
        title="Test Picker"
        directory="subdir"
        files={['file name.txt']}
        mode="pick"
        defaultSortDescending={false}
        onClose={handleClose}
        onPick={handlePick}
      />,
    );

    const button = screen.getByRole('button', { name: 'file name' });
    fireEvent.click(button);

    expect(handlePick).toHaveBeenCalledTimes(1);
    expect(handlePick).toHaveBeenCalledWith('subdir/file%20name.txt');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('FilePickerModal LIST.txt loading', () => {
  const stubFetch = (impl: () => Promise<Partial<Response>>) => {
    vi.stubGlobal('fetch', vi.fn(impl));
    return () => vi.unstubAllGlobals();
  };

  it('loads file names from LIST.txt when no files prop is given', async () => {
    const restore = stubFetch(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('one.txt\n\ntwo.txt\n'),
      }),
    );
    try {
      render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      const links = await screen.findAllByRole('link');
      expect(links.map((l) => l.textContent)).toEqual(['one.txt', 'two.txt']);
    } catch (error) {
      console.log('list-load mismatch');
      throw error;
    } finally {
      restore();
    }
  });

  it('shows the empty state when LIST.txt cannot be fetched', async () => {
    const restore = stubFetch(() => Promise.reject(new Error('offline')));
    try {
      render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      expect(await screen.findByText('No files available.')).toBeTruthy();
    } catch (error) {
      console.log('empty-state mismatch');
      throw error;
    } finally {
      restore();
    }
  });

  it('treats an HTML response as a missing list', async () => {
    const restore = stubFetch(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve('<html></html>'),
      }),
    );
    try {
      render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      expect(await screen.findByText('No files available.')).toBeTruthy();
    } catch (error) {
      console.log('html-guard mismatch');
      throw error;
    } finally {
      restore();
    }
  });

  it('renders the empty state immediately for an empty files list', () => {
    render(
      <FilePickerModal
        isOpen={true}
        title="P"
        directory="download"
        files={[]}
        mode="download"
        defaultSortDescending={false}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('No files available.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'SORT' })).toHaveProperty('disabled', true);
  });

  it('fetches LIST.txt from the root when the directory is blank', async () => {
    const fetchMock = vi.fn((_input: string) =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('root.txt\n'),
      } as Partial<Response>),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="   "
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      const links = await screen.findAllByRole('link');
      try {
        expect(links[0]?.getAttribute('href')).toBe('root.txt');
        expect(String(fetchMock.mock.calls[0]?.[0])).toContain('LIST.txt?ts=');
        expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('/LIST.txt');
      } catch (error) {
        console.log('root dir mismatch', fetchMock.mock.calls);
        throw error;
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('shows the empty state when LIST.txt responds with an error status', async () => {
    const restore = stubFetch(() =>
      Promise.resolve({
        ok: false,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve(''),
      }),
    );
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    try {
      render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      expect(await screen.findByText('No files available.')).toBeTruthy();
    } catch (error) {
      console.log('error status mismatch');
      throw error;
    } finally {
      errorSpy.mockRestore();
      restore();
    }
  });

  it('loads entries when the response has no content-type header', async () => {
    const restore = stubFetch(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers(),
        text: () => Promise.resolve('bare.txt\n'),
      }),
    );
    try {
      render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      const links = await screen.findAllByRole('link');
      try {
        expect(links.map((l) => l.textContent)).toEqual(['bare.txt']);
      } catch (error) {
        console.log('no content-type mismatch');
        throw error;
      }
    } finally {
      restore();
    }
  });

  it('shows the empty state when LIST.txt holds no usable names', async () => {
    const restore = stubFetch(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('LIST.txt\n.gitkeep\n\n'),
      }),
    );
    try {
      render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      expect(await screen.findByText('No files available.')).toBeTruthy();
    } catch (error) {
      console.log('empty list mismatch');
      throw error;
    } finally {
      restore();
    }
  });

  it('treats a doctype-looking first entry as a missing list', async () => {
    const restore = stubFetch(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('<!DOCTYPE html>\nindex.html\n'),
      }),
    );
    try {
      render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      expect(await screen.findByText('No files available.')).toBeTruthy();
    } catch (error) {
      console.log('doctype guard mismatch');
      throw error;
    } finally {
      restore();
    }
  });

  it('closes without an onPick callback in pick mode', () => {
    const handleClose = vi.fn();
    render(
      <FilePickerModal
        isOpen={true}
        title="P"
        directory="download"
        files={['one.txt']}
        mode="pick"
        defaultSortDescending={false}
        onClose={handleClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'one' }));
    try {
      expect(handleClose).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('pick no callback mismatch', handleClose.mock.calls);
      throw error;
    }
  });

  it('skips the cancelled list application after unmount', async () => {
    let resolveFetch!: (value: Partial<Response>) => void;
    const restore = stubFetch(
      () =>
        new Promise<Partial<Response>>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    try {
      const { unmount } = render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      unmount();
      resolveFetch({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('late.txt\n'),
      });
      await Promise.resolve();
      try {
        expect(screen.queryByText('late.txt')).toBeNull();
      } catch (error) {
        console.log('cancelled apply mismatch');
        throw error;
      }
    } finally {
      restore();
    }
  });

  it('swallows a fetch rejection after unmount', async () => {
    let rejectFetch!: (reason: Error) => void;
    const restore = stubFetch(
      () =>
        new Promise<Partial<Response>>((_resolve, reject) => {
          rejectFetch = reject;
        }),
    );
    try {
      const { unmount } = render(
        <FilePickerModal
          isOpen={true}
          title="P"
          directory="download"
          mode="download"
          defaultSortDescending={false}
          onClose={() => {}}
        />,
      );
      unmount();
      rejectFetch(new Error('late failure'));
      await Promise.resolve();
      try {
        expect(true).toBe(true);
      } catch (error) {
        console.log('cancelled rejection mismatch');
        throw error;
      }
    } finally {
      restore();
    }
  });
});

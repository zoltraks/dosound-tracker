import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';

afterEach(() => cleanup());
import { FilePickerModal } from '../../src/modals/FilePickerModal.tsx';

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

    // defaultSortDescending=true should make the first visible label "b.txt"
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
    // Directory and path should be encoded and joined with '/'
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
});

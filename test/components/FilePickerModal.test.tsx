import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { FilePickerModal } from '../../src/modals/FilePickerModal';

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
      />
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
      />
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
      />
    );

    const scope = within(container);
    const sortButton = scope.getByRole('button', { name: 'SORT' });
    const getLabels = () => scope.getAllByRole('link').map(link => link.textContent);

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
      />
    );

    const button = screen.getByRole('button', { name: 'file name' });
    fireEvent.click(button);

    expect(handlePick).toHaveBeenCalledTimes(1);
    // Directory and path should be encoded and joined with '/'
    expect(handlePick).toHaveBeenCalledWith('subdir/file%20name.txt');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

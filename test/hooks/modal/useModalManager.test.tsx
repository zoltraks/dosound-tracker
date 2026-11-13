import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { useModalManager } from '../../../src/hooks/modal/useModalManager.ts';

type Options = Parameters<typeof useModalManager>[0];

const createOptions = (overrides: Partial<Options> = {}): Options => ({
  songError: '',
  setSongError: vi.fn(),
  instrumentError: '',
  setInstrumentError: vi.fn(),
  transposeSummary: '',
  handleCloseTransposeSummary: vi.fn(),
  trackClipboardError: '',
  setTrackClipboardError: vi.fn(),
  optimizeSummary: '',
  handleCloseOptimizeSummary: vi.fn(),
  soundExportSummary: '',
  handleCloseSoundExportSummary: vi.fn(),
  dumpExportSummary: '',
  handleCloseDumpExportSummary: vi.fn(),
  renumberSummary: '',
  handleCloseRenumberSummary: vi.fn(),
  instrumentOperationSummary: '',
  handleCloseInstrumentOperationSummary: vi.fn(),
  midiLoadError: '',
  setMidiLoadError: vi.fn(),
  midiCopySummary: '',
  setMidiCopySummary: vi.fn(),
  isAboutOpen: false,
  setIsAboutOpen: vi.fn(),
  isChangelogOpen: false,
  handleCloseChangelog: vi.fn(),
  isManualOpen: false,
  handleCloseManual: vi.fn(),
  isDownloadOpen: false,
  setIsDownloadOpen: vi.fn(),
  isDebugInfoOpen: false,
  setIsDebugInfoOpen: vi.fn(),
  isMidiModalOpen: false,
  handleCloseMidi: vi.fn(),
  isTransposeOpen: false,
  handleCancelTranspose: vi.fn(),
  handleConfirmTranspose: vi.fn(),
  isOptimizeConfirmOpen: false,
  handleCancelOptimize: vi.fn(),
  handleConfirmOptimize: vi.fn(),
  isRenumberConfirmOpen: false,
  handleCancelRenumber: vi.fn(),
  handleConfirmRenumber: vi.fn(),
  isNewSongConfirmOpen: false,
  handleCancelNewSong: vi.fn(),
  handleConfirmNewSong: vi.fn(),
  isResetConfirmOpen: false,
  handleCancelReset: vi.fn(),
  handleConfirmReset: vi.fn(),
  isQuitConfirmOpen: false,
  handleCancelQuit: vi.fn(),
  handleConfirmQuit: vi.fn(),
  isInstrumentDeleteOpen: false,
  handleCancelInstrumentDelete: vi.fn(),
  isInstrumentTypeWarningOpen: false,
  handleCancelInstrumentTypeWarning: vi.fn(),
  handleConfirmInstrumentTypeWarning: vi.fn(),
  isExportOpen: false,
  handleCancelExport: vi.fn(),
  handleConfirmExport: vi.fn(),
  isSettingsOpen: false,
  handleCancelSettings: vi.fn(),
  handleConfirmSettings: vi.fn(),
  isPasteTrackOptionsOpen: false,
  handleCancelPasteTrackOptions: vi.fn(),
  handleConfirmPasteTrackOptions: vi.fn(),
  ...overrides,
});

const dispatchKey = (key: string) => {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });
};

const ManagerHarness: React.FC<{ options: Options }> = ({ options }) => {
  useModalManager(options);
  return null;
};

describe('useModalManager', () => {
  afterEach(() => cleanup());

  it('answers Escape and Enter when quit-confirm is the only open modal', () => {
    const handleCancelQuit = vi.fn();
    const handleConfirmQuit = vi.fn();
    const options = createOptions({ isQuitConfirmOpen: true, handleCancelQuit, handleConfirmQuit });

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    expect(handleCancelQuit).toHaveBeenCalledTimes(1);
    expect(handleConfirmQuit).not.toHaveBeenCalled();

    dispatchKey('Enter');
    expect(handleConfirmQuit).toHaveBeenCalledTimes(1);
  });

  it('confirms the instrument-operation summary on Enter', () => {
    const handleCloseInstrumentOperationSummary = vi.fn();
    const options = createOptions({
      instrumentOperationSummary: 'Instrument deleted',
      handleCloseInstrumentOperationSummary,
    });

    render(<ManagerHarness options={options} />);

    dispatchKey('Enter');
    expect(handleCloseInstrumentOperationSummary).toHaveBeenCalledTimes(1);
  });

  it('dismisses the instrument-operation summary on Escape', () => {
    const handleCloseInstrumentOperationSummary = vi.fn();
    const options = createOptions({
      instrumentOperationSummary: 'Instrument deleted',
      handleCloseInstrumentOperationSummary,
    });

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    expect(handleCloseInstrumentOperationSummary).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape and Enter when no modal is open', () => {
    const options = createOptions();

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    dispatchKey('Enter');
    expect(options.handleCancelQuit).not.toHaveBeenCalled();
    expect(options.handleConfirmQuit).not.toHaveBeenCalled();
    expect(options.handleCloseInstrumentOperationSummary).not.toHaveBeenCalled();
  });

  it('ignores keys other than Escape and Enter', () => {
    const options = createOptions({ isAboutOpen: true });

    render(<ManagerHarness options={options} />);

    dispatchKey('a');
    dispatchKey('Tab');
    expect(options.setIsAboutOpen).not.toHaveBeenCalled();
  });

  it('routes Escape to settings before any error summary', () => {
    const options = createOptions({ isSettingsOpen: true, songError: 'load failed' });

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    try {
      expect(options.handleCancelSettings).toHaveBeenCalledTimes(1);
      expect(options.setSongError).not.toHaveBeenCalled();
    } catch (error) {
      console.log('settings Escape priority violated');
      throw error;
    }
  });

  it('confirms settings on Enter', () => {
    const options = createOptions({ isSettingsOpen: true });

    render(<ManagerHarness options={options} />);

    dispatchKey('Enter');
    expect(options.handleConfirmSettings).toHaveBeenCalledTimes(1);
  });

  it('routes Escape to the midi modal before confirmation modals', () => {
    const options = createOptions({ isMidiModalOpen: true, isTransposeOpen: true });

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    try {
      expect(options.handleCloseMidi).toHaveBeenCalledTimes(1);
      expect(options.handleCancelTranspose).not.toHaveBeenCalled();
    } catch (error) {
      console.log('midi Escape priority violated');
      throw error;
    }
  });

  it('confirms transpose on Enter and cancels it on Escape', () => {
    const options = createOptions({ isTransposeOpen: true });

    render(<ManagerHarness options={options} />);

    dispatchKey('Enter');
    try {
      expect(options.handleConfirmTranspose).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('transpose Enter mismatch');
      throw error;
    }
    dispatchKey('Escape');
    try {
      expect(options.handleCancelTranspose).toHaveBeenCalledTimes(1);
    } catch (error) {
      console.log('transpose Escape mismatch');
      throw error;
    }
  });

  it('confirms export on Enter and cancels it on Escape', () => {
    const options = createOptions({ isExportOpen: true });

    render(<ManagerHarness options={options} />);

    dispatchKey('Enter');
    expect(options.handleConfirmExport).toHaveBeenCalledTimes(1);
    dispatchKey('Escape');
    expect(options.handleCancelExport).toHaveBeenCalledTimes(1);
  });

  it('routes Escape through the renumber confirmation', () => {
    const options = createOptions({ isRenumberConfirmOpen: true });

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    expect(options.handleCancelRenumber).toHaveBeenCalledTimes(1);
    dispatchKey('Enter');
    expect(options.handleConfirmRenumber).toHaveBeenCalledTimes(1);
  });

  it('clears a song error on Escape and Enter', () => {
    const options = createOptions({ songError: 'load failed' });

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    try {
      expect(options.setSongError).toHaveBeenCalledWith('');
    } catch (error) {
      console.log('songError Escape mismatch');
      throw error;
    }
    dispatchKey('Enter');
    try {
      expect(options.setSongError).toHaveBeenCalledTimes(2);
    } catch (error) {
      console.log('songError Enter mismatch');
      throw error;
    }
  });

  it('closes the about and download modals', () => {
    const options = createOptions({ isAboutOpen: true });

    render(<ManagerHarness options={options} />);

    dispatchKey('Enter');
    try {
      expect(options.setIsAboutOpen).toHaveBeenCalledWith(false);
    } catch (error) {
      console.log('about Enter mismatch');
      throw error;
    }
  });

  it('closes the download modal on Escape', () => {
    const options = createOptions({ isDownloadOpen: true });

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    expect(options.setIsDownloadOpen).toHaveBeenCalledWith(false);
  });

  it('closes the changelog and manual modals', () => {
    const options = createOptions({ isChangelogOpen: true, isManualOpen: false });

    render(<ManagerHarness options={options} />);

    dispatchKey('Escape');
    expect(options.handleCloseChangelog).toHaveBeenCalledTimes(1);
  });
});

describe('modal-specific keyboard actions', () => {
  afterEach(cleanup);

  it.each([
    ['instrumentError', 'setInstrumentError', ['']],
    ['transposeSummary', 'handleCloseTransposeSummary', []],
    ['trackClipboardError', 'setTrackClipboardError', ['']],
    ['optimizeSummary', 'handleCloseOptimizeSummary', []],
    ['soundExportSummary', 'handleCloseSoundExportSummary', []],
    ['dumpExportSummary', 'handleCloseDumpExportSummary', []],
    ['renumberSummary', 'handleCloseRenumberSummary', []],
    ['midiLoadError', 'setMidiLoadError', ['']],
    ['midiCopySummary', 'setMidiCopySummary', ['']],
  ] as const)('dismisses %s with either Escape or Enter', (flag, callback, args) => {
    const close = vi.fn();
    render(<ManagerHarness options={createOptions({ [flag]: 'Message', [callback]: close })} />);
    dispatchKey('Escape');
    dispatchKey('Enter');
    expect(close.mock.calls).toEqual([args, args]);
  });

  it.each([
    ['isOptimizeConfirmOpen', 'handleCancelOptimize', 'handleConfirmOptimize'],
    ['isRenumberConfirmOpen', 'handleCancelRenumber', 'handleConfirmRenumber'],
    ['isNewSongConfirmOpen', 'handleCancelNewSong', 'handleConfirmNewSong'],
    ['isResetConfirmOpen', 'handleCancelReset', 'handleConfirmReset'],
    [
      'isInstrumentTypeWarningOpen',
      'handleCancelInstrumentTypeWarning',
      'handleConfirmInstrumentTypeWarning',
    ],
    ['isPasteTrackOptionsOpen', 'handleCancelPasteTrackOptions', 'handleConfirmPasteTrackOptions'],
  ] as const)('routes Escape and Enter independently for %s', (flag, cancelKey, confirmKey) => {
    const cancel = vi.fn();
    const confirm = vi.fn();
    render(
      <ManagerHarness
        options={createOptions({ [flag]: true, [cancelKey]: cancel, [confirmKey]: confirm })}
      />,
    );
    dispatchKey('Escape');
    expect(cancel).toHaveBeenCalledOnce();
    expect(confirm).not.toHaveBeenCalled();
    dispatchKey('Enter');
    expect(confirm).toHaveBeenCalledOnce();
  });

  it('requires a specific action before deleting a used instrument', () => {
    const cancel = vi.fn();
    render(
      <ManagerHarness
        options={createOptions({
          isInstrumentDeleteOpen: true,
          handleCancelInstrumentDelete: cancel,
        })}
      />,
    );
    dispatchKey('Enter');
    expect(cancel).not.toHaveBeenCalled();
    dispatchKey('Escape');
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('dismisses the debug information on Enter', () => {
    const setIsDebugInfoOpen = vi.fn();
    render(
      <ManagerHarness options={createOptions({ isDebugInfoOpen: true, setIsDebugInfoOpen })} />,
    );
    dispatchKey('Enter');
    expect(setIsDebugInfoOpen).toHaveBeenCalledExactlyOnceWith(false);
  });
});

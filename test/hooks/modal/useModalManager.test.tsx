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
});

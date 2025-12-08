import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { useModalState } from '../../src/hooks/useModalState';

type HookResult = ReturnType<typeof useModalState>;

const ModalStateHarness: React.FC<{ onReady: (value: HookResult) => void }> = ({ onReady }) => {
  const value = useModalState();

  React.useEffect(() => {
    onReady(value);
  }, [value, onReady]);

  return null;
};

describe('useModalState', () => {
  it('exposes default closed and empty state for modals and summaries', async () => {
    let hook: HookResult | null = null;

    render(<ModalStateHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    expect(hook!.isNewSongConfirmOpen).toBe(false);
    expect(hook!.isAboutOpen).toBe(false);
    expect(hook!.isChangelogOpen).toBe(false);
    expect(hook!.isOptimizeConfirmOpen).toBe(false);
    expect(hook!.isRenumberConfirmOpen).toBe(false);
    expect(hook!.isResetConfirmOpen).toBe(false);
    expect(hook!.isQuitConfirmOpen).toBe(false);
    expect(hook!.isTransposeOpen).toBe(false);
    expect(hook!.isDownloadOpen).toBe(false);
    expect(hook!.isMidiModalOpen).toBe(false);
    expect(hook!.isDebugInfoOpen).toBe(false);
    expect(hook!.isInstrumentDeleteOpen).toBe(false);
    expect(hook!.isInstrumentMidiOpen).toBe(false);
    expect(hook!.isExportModalOpen).toBe(false);

    expect(hook!.changelogContent).toBe('');
    expect(hook!.optimizeSummary).toBe('');
    expect(hook!.renumberSummary).toBe('');
    expect(hook!.transposeSummary).toBe('');
    expect(hook!.instrumentOperationSummary).toBe('');
    expect(hook!.midiLoadError).toBe('');
    expect(hook!.midiCopySummary).toBe('');

    expect(hook!.instrumentDeleteUsage).toEqual({
      instrumentId: '',
      instrumentName: '',
      usageCount: 0,
      patternCount: 0,
    });
  });

  it('allows updating representative modal flags and summaries through setters', async () => {
    let hook: HookResult | null = null;

    render(<ModalStateHarness onReady={value => { hook = value; }} />);

    await waitFor(() => {
      expect(hook).not.toBeNull();
    });

    await act(async () => {
      hook!.setIsNewSongConfirmOpen(true);
      hook!.setIsTransposeOpen(true);
      hook!.setChangelogContent('Changes');
      hook!.setTransposeSummary('Transpose summary');
      hook!.setInstrumentDeleteUsage({
        instrumentId: '01',
        instrumentName: 'Test Inst',
        usageCount: 3,
        patternCount: 2,
      });
    });

    expect(hook!.isNewSongConfirmOpen).toBe(true);
    expect(hook!.isTransposeOpen).toBe(true);
    expect(hook!.changelogContent).toBe('Changes');
    expect(hook!.transposeSummary).toBe('Transpose summary');
    expect(hook!.instrumentDeleteUsage).toEqual({
      instrumentId: '01',
      instrumentName: 'Test Inst',
      usageCount: 3,
      patternCount: 2,
    });
  });
});

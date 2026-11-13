import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  useTransposeDialog,
  type UseTransposeDialogParams,
} from '../../../src/hooks/modal/useTransposeDialog.ts';

afterEach(cleanup);

function setup(overrides: Partial<UseTransposeDialogParams> = {}) {
  const params = {
    transposeScope: 'line',
    transposeTrackScope: 'current',
    transposeInstrumentScope: 'selected',
    transposeAmount: 1,
    transposeAmountInput: '1',
    setTransposeAmount: vi.fn(),
    setTransposeAmountInput: vi.fn(),
    setIsTransposeOpen: vi.fn(),
    setTransposeSummary: vi.fn(),
    playlistLength: 1,
    currentPatternIndex: 0,
    targetTrackId: 'B',
    currentInstrumentId: '02',
    applyTranspose: vi.fn(() => ({
      patternCount: 1,
      notesChanged: 2,
      clippedLow: 0,
      clippedHigh: 0,
    })),
    ...overrides,
  } satisfies UseTransposeDialogParams;
  return { ...params, ...renderHook(() => useTransposeDialog(params)) };
}

it.each(['', '-', '+', '0', 'invalid'])(
  'reports a zero offset for input %j',
  (transposeAmountInput) => {
    const hook = setup({ transposeAmountInput });
    act(() => hook.result.current.handleConfirmTranspose());
    expect(hook.setTransposeSummary).toHaveBeenCalledWith(expect.stringContaining('offset is 0'));
    expect(hook.applyTranspose).not.toHaveBeenCalled();
  },
);

it('reports an empty playlist before attempting to transpose', () => {
  const hook = setup({ playlistLength: 0 });
  act(() => hook.result.current.handleConfirmTranspose());
  expect(hook.setTransposeSummary).toHaveBeenCalledWith('No playlist entries to transpose.');
  expect(hook.applyTranspose).not.toHaveBeenCalled();
});

it.each([null, { patternCount: 0, notesChanged: 0, clippedLow: 0, clippedHigh: 0 }])(
  'reports a scope without matching patterns (%j)',
  (result) => {
    const hook = setup({ applyTranspose: vi.fn(() => result) });
    act(() => hook.result.current.handleConfirmTranspose());
    expect(hook.setTransposeSummary).toHaveBeenCalledWith(
      expect.stringContaining('No patterns found'),
    );
  },
);

it('applies a rounded offset to the selected track and instrument', () => {
  const hook = setup({ transposeAmountInput: ' 1.6 ' });
  act(() => hook.result.current.handleConfirmTranspose());
  expect(hook.applyTranspose).toHaveBeenCalledWith({
    semitones: 2,
    scope: 'line',
    trackScope: 'current',
    instrumentScope: 'selected',
    currentPatternIndex: 0,
    targetTrackId: 'B',
    selectedInstrumentId: '02',
  });
  expect(hook.setTransposeSummary).toHaveBeenCalledWith(
    expect.stringContaining('Semitone offset: +2'),
  );
});

it('reports clipped notes and full-song scope', () => {
  const hook = setup({
    transposeAmountInput: '-3',
    transposeScope: 'song',
    transposeTrackScope: 'all',
    transposeInstrumentScope: 'all',
    applyTranspose: () => ({ patternCount: 2, notesChanged: 3, clippedLow: 0, clippedHigh: 1 }),
  });
  act(() => hook.result.current.handleConfirmTranspose());
  expect(hook.setTransposeSummary).toHaveBeenCalledWith(
    expect.stringContaining('Notes clipped at top of range: 1'),
  );
  expect(hook.setTransposeSummary).toHaveBeenCalledWith(expect.stringContaining('Entire song'));
});

it('preserves incomplete input and clamps the remembered numeric value', () => {
  const hook = setup({ transposeAmount: 12 });
  act(() => hook.result.current.handleOpenTranspose());
  expect(hook.setTransposeAmountInput).toHaveBeenCalledWith('12');
  for (const value of ['', '-', '+', 'invalid', '-101', '101']) {
    act(() => hook.result.current.handleTransposeAmountChange(value));
    expect(hook.setTransposeAmountInput).toHaveBeenLastCalledWith(value);
  }
  expect(vi.mocked(hook.setTransposeAmount).mock.calls).toEqual([[-99], [99]]);
  act(() => hook.result.current.handleCancelTranspose());
  expect(hook.setIsTransposeOpen).toHaveBeenLastCalledWith(false);
  act(() => hook.result.current.handleCloseTransposeSummary());
  expect(hook.setTransposeSummary).toHaveBeenCalledWith('');
});

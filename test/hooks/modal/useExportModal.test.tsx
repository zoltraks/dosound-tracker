import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useExportModal } from '../../../src/hooks/modal/useExportModal.ts';
import type { UseExportModalParams } from '../../../src/hooks/modal/useExportModal.ts';
import type { Instrument } from '../../../src/synth/SoundDriver.ts';

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'Test',
  volume: [15, 10, 0],
  shift: [0, 4, 7],
  pitch: [0, 1, -1],
  noise: [8, 0],
  mode: [1, 0],
  ...overrides,
});

const makeParams = (overrides: Partial<UseExportModalParams> = {}): UseExportModalParams => ({
  exportType: 'song',
  setExportType: vi.fn(),
  exportStrategy: 'simple',
  setExportStrategy: vi.fn(),
  setIsExportModalOpen: vi.fn(),
  clampedPlaybackPosition: 2,
  sharedCurrentLine: 7,
  currentInstrument: makeInstrument(),
  exportDataWithContext: vi.fn(),
  exportBinWithContext: vi.fn(),
  exportVgmWithContext: vi.fn(),
  exportWavWithContext: vi.fn(),
  exportDumpWithContext: vi.fn(),
  exportMaxWithContext: vi.fn(),
  exportMidiWithContext: vi.fn(),
  exportModWithContext: vi.fn(),
  ...overrides,
});

describe('useExportModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('initializes pending state from the committed export settings', () => {
    const params = makeParams({ exportType: 'pattern', exportStrategy: 'tight' });
    const { result } = renderHook(() => useExportModal(params));

    expect(result.current.pendingExportType).toBe('pattern');
    expect(result.current.pendingExportStrategy).toBe('tight');
  });

  it('opens the modal with pending state snapshotted from the committed values', () => {
    const params = makeParams({ exportType: 'instrument', exportStrategy: 'complex' });
    const { result } = renderHook(() => useExportModal(params));

    act(() => {
      result.current.handleOpenExport();
    });

    expect(params.setIsExportModalOpen).toHaveBeenCalledWith(true);
    expect(result.current.pendingExportType).toBe('instrument');
    expect(result.current.pendingExportStrategy).toBe('complex');
  });

  it('tracks pending type and strategy changes without committing them', () => {
    const params = makeParams();
    const { result } = renderHook(() => useExportModal(params));

    act(() => {
      result.current.handleExportTypeChange('instrument');
      result.current.handleExportStrategyChange('tight');
    });

    expect(result.current.pendingExportType).toBe('instrument');
    expect(result.current.pendingExportStrategy).toBe('tight');
    expect(params.setExportType).not.toHaveBeenCalled();
    expect(params.setExportStrategy).not.toHaveBeenCalled();
  });

  it('commits the pending values and closes the modal on confirm', () => {
    const params = makeParams();
    const { result } = renderHook(() => useExportModal(params));

    act(() => {
      result.current.handleExportTypeChange('pattern');
      result.current.handleExportStrategyChange('complex');
    });
    act(() => {
      result.current.handleConfirmExport();
    });

    expect(params.setExportType).toHaveBeenCalledWith('pattern');
    expect(params.setExportStrategy).toHaveBeenCalledWith('complex');
    expect(params.setIsExportModalOpen).toHaveBeenCalledWith(false);
  });

  it('closes the modal without committing on cancel', () => {
    const params = makeParams();
    const { result } = renderHook(() => useExportModal(params));

    act(() => {
      result.current.handleExportTypeChange('instrument');
      result.current.handleCancelExport();
    });

    expect(params.setIsExportModalOpen).toHaveBeenCalledWith(false);
    expect(params.setExportType).not.toHaveBeenCalled();
    expect(params.setExportStrategy).not.toHaveBeenCalled();
  });

  it('dispatches the matching export handler with the built context', () => {
    const params = makeParams();
    const { result } = renderHook(() => useExportModal(params));

    act(() => {
      result.current.handleExportTypeChange('pattern');
      result.current.handleExportStrategyChange('tight');
    });
    act(() => {
      result.current.handleExportFormatFromModal('vgm');
    });

    expect(params.exportVgmWithContext).toHaveBeenCalledTimes(1);
    expect(params.exportVgmWithContext).toHaveBeenCalledWith({
      type: 'pattern',
      strategy: 'tight',
      playlistIndex: 2,
      currentLine: 7,
      instrument: params.currentInstrument,
    });
    expect(params.exportDataWithContext).not.toHaveBeenCalled();
  });

  it('routes every export format to its own handler', () => {
    const params = makeParams();
    const { result } = renderHook(() => useExportModal(params));
    const cases = [
      ['data', 'exportDataWithContext'],
      ['bin', 'exportBinWithContext'],
      ['vgm', 'exportVgmWithContext'],
      ['wav', 'exportWavWithContext'],
      ['max', 'exportMaxWithContext'],
      ['midi', 'exportMidiWithContext'],
      ['mod', 'exportModWithContext'],
      ['dump', 'exportDumpWithContext'],
    ] as const;

    for (const [format, key] of cases) {
      act(() => {
        result.current.handleExportFormatFromModal(format);
      });
      expect(params[key]).toHaveBeenCalledTimes(1);
    }
  });
});

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useClipboardDispatch } from '../../../src/hooks/ui/useClipboardDispatch.ts';

const setup = (isEnvelopeSectionActive: boolean) => {
  const handleCopyEnvelope = vi.fn(() => Promise.resolve());
  const handlePasteEnvelope = vi.fn(() => Promise.resolve());
  const handleCopyTrackShortcut = vi.fn();
  const handlePasteTrackShortcut = vi.fn();
  const rendered = renderHook(
    ({ active }: { active: boolean }) =>
      useClipboardDispatch({
        isEnvelopeSectionActive: active,
        handleCopyEnvelope,
        handlePasteEnvelope,
        handleCopyTrackShortcut,
        handlePasteTrackShortcut,
      }),
    { initialProps: { active: isEnvelopeSectionActive } },
  );
  return {
    ...rendered,
    handleCopyEnvelope,
    handlePasteEnvelope,
    handleCopyTrackShortcut,
    handlePasteTrackShortcut,
  };
};

afterEach(() => {
  cleanup();
});

describe('useClipboardDispatch', () => {
  it('routes copy and paste to the envelope clipboard while an envelope section is active', () => {
    const {
      result,
      handleCopyEnvelope,
      handlePasteEnvelope,
      handleCopyTrackShortcut,
      handlePasteTrackShortcut,
    } = setup(true);
    result.current.handleCopyClipboard();
    result.current.handlePasteClipboard();
    expect(handleCopyEnvelope).toHaveBeenCalledTimes(1);
    expect(handlePasteEnvelope).toHaveBeenCalledTimes(1);
    expect(handleCopyTrackShortcut).not.toHaveBeenCalled();
    expect(handlePasteTrackShortcut).not.toHaveBeenCalled();
  });

  it('routes copy and paste to the track clipboard outside envelope sections', () => {
    const {
      result,
      handleCopyEnvelope,
      handlePasteEnvelope,
      handleCopyTrackShortcut,
      handlePasteTrackShortcut,
    } = setup(false);
    result.current.handleCopyClipboard();
    result.current.handlePasteClipboard();
    expect(handleCopyTrackShortcut).toHaveBeenCalledTimes(1);
    expect(handlePasteTrackShortcut).toHaveBeenCalledTimes(1);
    expect(handleCopyEnvelope).not.toHaveBeenCalled();
    expect(handlePasteEnvelope).not.toHaveBeenCalled();
  });

  it('follows the active section when it changes', () => {
    const { result, rerender, handleCopyEnvelope, handleCopyTrackShortcut } = setup(false);
    result.current.handleCopyClipboard();
    expect(handleCopyTrackShortcut).toHaveBeenCalledTimes(1);
    rerender({ active: true });
    result.current.handleCopyClipboard();
    expect(handleCopyEnvelope).toHaveBeenCalledTimes(1);
    expect(handleCopyTrackShortcut).toHaveBeenCalledTimes(1);
  });
});

import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useEditPositionBridge } from '../../../src/hooks/song/useEditPositionBridge.ts';
import type { EditPosition } from '../../../src/utils/song/editHistory.ts';

afterEach(() => {
  cleanup();
});

const setup = (pattern: number, line: number) => {
  const setPosition = vi.fn();
  const setSharedCurrentLine = vi.fn();
  const rendered = renderHook(
    ({ patternIndex, sharedLine }: { patternIndex: number; sharedLine: number }) => {
      const editPositionRef = useRef<EditPosition>({ pattern: 0, line: 0 });
      const applyEditPositionRef = useRef<((position: EditPosition) => void) | null>(null);
      useEditPositionBridge({
        editPositionRef,
        applyEditPositionRef,
        sequencerPatternIndex: patternIndex,
        sharedCurrentLine: sharedLine,
        setPosition,
        setSharedCurrentLine,
      });
      return { editPositionRef, applyEditPositionRef };
    },
    { initialProps: { patternIndex: pattern, sharedLine: line } },
  );
  return { ...rendered, setPosition, setSharedCurrentLine };
};

describe('useEditPositionBridge', () => {
  it('mirrors the sequencer position into the edit position ref', () => {
    const { result, rerender } = setup(2, 7);
    expect(result.current.editPositionRef.current).toEqual({ pattern: 2, line: 7 });
    rerender({ patternIndex: 3, sharedLine: 11 });
    expect(result.current.editPositionRef.current).toEqual({ pattern: 3, line: 11 });
  });

  it('binds the apply ref to the sequencer setters', () => {
    const { result, setPosition, setSharedCurrentLine } = setup(0, 0);
    const apply = result.current.applyEditPositionRef.current;
    expect(apply).not.toBeNull();
    apply?.({ pattern: 4, line: 9 });
    expect(setPosition).toHaveBeenCalledWith(4, 9, 0);
    expect(setSharedCurrentLine).toHaveBeenCalledWith(9);
  });
});

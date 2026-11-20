import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { EditPosition } from '../../utils/song/editHistory.ts';

export interface UseEditPositionBridgeParams {
  editPositionRef: RefObject<EditPosition>;
  applyEditPositionRef: RefObject<((position: EditPosition) => void) | null>;
  sequencerPatternIndex: number;
  sharedCurrentLine: number;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  setSharedCurrentLine: (line: number) => void;
}

// Position bridge into the sequencer domain for the edit history: the
// mirror effect keeps the recorded cursor position current and the apply
// binding routes restores through the sequencer setters. The refs and the
// bridge lambdas stay with the caller because the history hook is
// instantiated before the sequencer exists - this hook owns only the
// effects that connect them.
export function useEditPositionBridge({
  editPositionRef,
  applyEditPositionRef,
  sequencerPatternIndex,
  sharedCurrentLine,
  setPosition,
  setSharedCurrentLine,
}: UseEditPositionBridgeParams): void {
  useEffect(() => {
    editPositionRef.current = {
      pattern: sequencerPatternIndex,
      line: sharedCurrentLine,
    };
  }, [sequencerPatternIndex, sharedCurrentLine, editPositionRef]);

  useEffect(() => {
    applyEditPositionRef.current = (position) => {
      setPosition(position.pattern, position.line, 0);
      setSharedCurrentLine(position.line);
    };
  }, [setPosition, setSharedCurrentLine, applyEditPositionRef]);
}

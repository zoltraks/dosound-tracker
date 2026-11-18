import type { Dispatch, SetStateAction } from 'react';
import { TransposeModal } from '../../modals/track/TransposeModal.tsx';

export interface TransposeModalGroupParams {
  transposeScope: 'line' | 'song';
  setTransposeScope: Dispatch<SetStateAction<'line' | 'song'>>;
  transposeTrackScope: 'current' | 'all';
  setTransposeTrackScope: Dispatch<SetStateAction<'current' | 'all'>>;
  transposeInstrumentScope: 'all' | 'selected';
  setTransposeInstrumentScope: Dispatch<SetStateAction<'all' | 'selected'>>;
  transposeAmount: number;
  setTransposeAmount: Dispatch<SetStateAction<number>>;
  transposeAmountInput: string;
  setTransposeAmountInput: Dispatch<SetStateAction<string>>;
  onTransposeAmountChange: (value: string) => void;
  onConfirmTranspose: () => void;
  onCancelTranspose: () => void;
}

export interface TransposeModalGroupProps extends TransposeModalGroupParams {
  isTransposeOpen: boolean;
}

export function TransposeModalGroup({
  isTransposeOpen,
  transposeScope,
  transposeTrackScope,
  transposeInstrumentScope,
  transposeAmount,
  transposeAmountInput,
  setTransposeScope,
  setTransposeTrackScope,
  setTransposeInstrumentScope,
  onTransposeAmountChange,
  onConfirmTranspose,
  onCancelTranspose,
  setTransposeAmount,
  setTransposeAmountInput,
}: TransposeModalGroupProps) {
  return (
    <TransposeModal
      isOpen={isTransposeOpen}
      scope={transposeScope}
      trackScope={transposeTrackScope}
      instrumentScope={transposeInstrumentScope}
      amount={transposeAmount}
      amountInput={transposeAmountInput}
      onScopeChange={setTransposeScope}
      onTrackScopeChange={setTransposeTrackScope}
      onInstrumentScopeChange={setTransposeInstrumentScope}
      onAmountChange={onTransposeAmountChange}
      onAmountAdjust={(delta) => {
        const rawNext = transposeAmount + delta;
        const clamped = Math.max(-99, Math.min(99, rawNext));
        setTransposeAmount(clamped);
        setTransposeAmountInput(String(clamped));
      }}
      onConfirm={onConfirmTranspose}
      onCancel={onCancelTranspose}
    />
  );
}

import { InstrumentDeleteModal } from '../../modals/instrument/InstrumentDeleteModal.tsx';
import { InstrumentMidiModal } from '../../modals/instrument/InstrumentMidiModal.tsx';
import { InstrumentColorModal } from '../../modals/instrument/InstrumentColorModal.tsx';
import type { Instrument } from '../../synth/SoundDriver.ts';
import type { InstrumentDeleteUsage } from '../../hooks/modal/useModalState.ts';

export interface InstrumentModalGroupParams {
  onConfirmDeleteInstrumentAndNotes: () => void;
  onConfirmDeleteInstrumentOnly: () => void;
  onCancelInstrumentDelete: () => void;
  instrumentMidiTarget: Instrument | null;
  onSaveInstrumentMidi: (midi: { channel: number | null; program: number | null }) => void;
  onCloseInstrumentMidi: () => void;
  instrumentColorTarget: Instrument | null;
  onSaveInstrumentColor: (color: string | null) => void;
  onClearInstrumentColor: () => void;
  onCloseInstrumentColor: () => void;
}

export interface InstrumentModalGroupProps extends InstrumentModalGroupParams {
  isInstrumentDeleteOpen: boolean;
  instrumentDeleteUsage: InstrumentDeleteUsage;
  isInstrumentMidiOpen: boolean;
  isInstrumentColorOpen: boolean;
}

export function InstrumentModalGroup({
  isInstrumentDeleteOpen,
  instrumentDeleteUsage,
  onConfirmDeleteInstrumentAndNotes,
  onConfirmDeleteInstrumentOnly,
  onCancelInstrumentDelete,
  isInstrumentMidiOpen,
  instrumentMidiTarget,
  onSaveInstrumentMidi,
  onCloseInstrumentMidi,
  isInstrumentColorOpen,
  instrumentColorTarget,
  onSaveInstrumentColor,
  onClearInstrumentColor,
  onCloseInstrumentColor,
}: InstrumentModalGroupProps) {
  return (
    <>
      <InstrumentDeleteModal
        isOpen={isInstrumentDeleteOpen}
        instrumentId={instrumentDeleteUsage.instrumentId}
        instrumentName={instrumentDeleteUsage.instrumentName}
        usageCount={instrumentDeleteUsage.usageCount}
        patternCount={instrumentDeleteUsage.patternCount}
        onDeleteNotesAndInstrument={onConfirmDeleteInstrumentAndNotes}
        onDeleteInstrumentOnly={onConfirmDeleteInstrumentOnly}
        onCancel={onCancelInstrumentDelete}
      />

      <InstrumentMidiModal
        isOpen={isInstrumentMidiOpen}
        instrument={instrumentMidiTarget}
        onSave={onSaveInstrumentMidi}
        onCancel={onCloseInstrumentMidi}
      />

      <InstrumentColorModal
        isOpen={isInstrumentColorOpen}
        instrument={instrumentColorTarget}
        onSave={onSaveInstrumentColor}
        onClear={onClearInstrumentColor}
        onCancel={onCloseInstrumentColor}
      />
    </>
  );
}

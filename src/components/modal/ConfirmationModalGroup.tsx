import { ConfirmationModal } from '../../modals/common/ConfirmationModal.tsx';
import { InstrumentTypeWarningModal } from '../../modals/instrument/InstrumentTypeWarningModal.tsx';
import { CONFIRM_MODAL_TEXT } from '../../constants/modal.ts';
import type { InstrumentTypeInfo } from '../../hooks/instrument/useInstrumentWarnings.ts';

const SONG_CONFIGURATION_WARNING_FALLBACK =
  'Song YAML includes unsupported metadata values.\n\nLoad the song anyway?';

export interface ConfirmationModalGroupParams {
  isInstrumentTypeWarningOpen: boolean;
  pendingInstrumentTypeInfo: InstrumentTypeInfo | null;
  instrumentTypeWarningIgnoreChecked: boolean;
  setInstrumentTypeWarningIgnoreChecked: (checked: boolean) => void;
  onConfirmInstrumentTypeWarning: () => void;
  onCancelInstrumentTypeWarning: () => void;
  onConfirmNewSong: () => void;
  onCancelNewSong: () => void;
  hasPendingSongImport: boolean;
  songConfigurationWarningMessage: string;
  onConfirmSongConfigurationWarning: () => void;
  onCancelSongConfigurationWarning: () => void;
  onConfirmOptimize: () => void;
  onCancelOptimize: () => void;
  onConfirmRenumber: () => void;
  onCancelRenumber: () => void;
  onConfirmReset: () => void;
  onCancelReset: () => void;
  onConfirmQuit: () => void;
  onCancelQuit: () => void;
}

export interface ConfirmationModalGroupProps extends ConfirmationModalGroupParams {
  isNewSongConfirmOpen: boolean;
  isOptimizeConfirmOpen: boolean;
  isRenumberConfirmOpen: boolean;
  isResetConfirmOpen: boolean;
  isQuitConfirmOpen: boolean;
}

export function ConfirmationModalGroup({
  isInstrumentTypeWarningOpen,
  pendingInstrumentTypeInfo,
  instrumentTypeWarningIgnoreChecked,
  setInstrumentTypeWarningIgnoreChecked,
  onConfirmInstrumentTypeWarning,
  onCancelInstrumentTypeWarning,
  isNewSongConfirmOpen,
  onConfirmNewSong,
  onCancelNewSong,
  hasPendingSongImport,
  songConfigurationWarningMessage,
  onConfirmSongConfigurationWarning,
  onCancelSongConfigurationWarning,
  isOptimizeConfirmOpen,
  onConfirmOptimize,
  onCancelOptimize,
  isRenumberConfirmOpen,
  onConfirmRenumber,
  onCancelRenumber,
  isResetConfirmOpen,
  onConfirmReset,
  onCancelReset,
  isQuitConfirmOpen,
  onConfirmQuit,
  onCancelQuit,
}: ConfirmationModalGroupProps) {
  return (
    <>
      <InstrumentTypeWarningModal
        isOpen={isInstrumentTypeWarningOpen}
        hasTypeField={!!pendingInstrumentTypeInfo?.hasTypeField}
        detectedType={pendingInstrumentTypeInfo?.detectedType ?? null}
        ignoreFuture={instrumentTypeWarningIgnoreChecked}
        onIgnoreChange={setInstrumentTypeWarningIgnoreChecked}
        onConfirm={onConfirmInstrumentTypeWarning}
        onCancel={onCancelInstrumentTypeWarning}
      />

      <ConfirmationModal
        isOpen={isNewSongConfirmOpen}
        title={CONFIRM_MODAL_TEXT.newSong.title}
        message={CONFIRM_MODAL_TEXT.newSong.message}
        onConfirm={onConfirmNewSong}
        onCancel={onCancelNewSong}
      />

      <ConfirmationModal
        isOpen={hasPendingSongImport}
        title="Unsupported song configuration"
        message={songConfigurationWarningMessage || SONG_CONFIGURATION_WARNING_FALLBACK}
        onConfirm={onConfirmSongConfigurationWarning}
        onCancel={onCancelSongConfigurationWarning}
      />

      <ConfirmationModal
        isOpen={isOptimizeConfirmOpen}
        title={CONFIRM_MODAL_TEXT.optimize.title}
        message={CONFIRM_MODAL_TEXT.optimize.message}
        onConfirm={onConfirmOptimize}
        onCancel={onCancelOptimize}
      />

      <ConfirmationModal
        isOpen={isRenumberConfirmOpen}
        title={CONFIRM_MODAL_TEXT.renumber.title}
        message={CONFIRM_MODAL_TEXT.renumber.message}
        onConfirm={onConfirmRenumber}
        onCancel={onCancelRenumber}
      />

      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        title={CONFIRM_MODAL_TEXT.reset.title}
        message={CONFIRM_MODAL_TEXT.reset.message}
        onConfirm={onConfirmReset}
        onCancel={onCancelReset}
        confirmLabel={CONFIRM_MODAL_TEXT.reset.confirmLabel}
      />

      <ConfirmationModal
        isOpen={isQuitConfirmOpen}
        title={CONFIRM_MODAL_TEXT.quit.title}
        message={CONFIRM_MODAL_TEXT.quit.message}
        onConfirm={onConfirmQuit}
        onCancel={onCancelQuit}
      />
    </>
  );
}

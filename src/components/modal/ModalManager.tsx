import {
  InformationModalGroup,
  type InformationModalGroupProps,
} from './InformationModalGroup.tsx';
import {
  ConfirmationModalGroup,
  type ConfirmationModalGroupProps,
} from './ConfirmationModalGroup.tsx';
import { InstrumentModalGroup, type InstrumentModalGroupProps } from './InstrumentModalGroup.tsx';
import { TransposeModalGroup, type TransposeModalGroupProps } from './TransposeModalGroup.tsx';
import { DocumentModalGroup, type DocumentModalGroupProps } from './DocumentModalGroup.tsx';
import { MidiModalGroup, type MidiModalGroupProps } from './MidiModalGroup.tsx';
import { SettingsModalGroup, type SettingsModalGroupProps } from './SettingsModalGroup.tsx';
import { FileModalGroup, type FileModalGroupProps } from './FileModalGroup.tsx';
import { ExportModalGroup, type ExportModalGroupProps } from './ExportModalGroup.tsx';
import { PasteTrackModalGroup, type PasteTrackModalGroupProps } from './PasteTrackModalGroup.tsx';

export interface ModalManagerProps {
  information: InformationModalGroupProps;
  confirms: ConfirmationModalGroupProps;
  instruments: InstrumentModalGroupProps;
  transpose: TransposeModalGroupProps;
  documents: DocumentModalGroupProps;
  midi: MidiModalGroupProps;
  settings: SettingsModalGroupProps;
  file: FileModalGroupProps;
  exportDialog: ExportModalGroupProps;
  pasteTrack: PasteTrackModalGroupProps;
}

// Group order mirrors the former ModalContainer sequence: later groups paint
// above earlier ones when several modals are open at once.
export function ModalManager({
  information,
  confirms,
  instruments,
  transpose,
  documents,
  midi,
  settings,
  file,
  exportDialog,
  pasteTrack,
}: ModalManagerProps) {
  return (
    <>
      <InformationModalGroup {...information} />
      <ConfirmationModalGroup {...confirms} />
      <InstrumentModalGroup {...instruments} />
      <TransposeModalGroup {...transpose} />
      <DocumentModalGroup {...documents} />
      <MidiModalGroup {...midi} />
      <SettingsModalGroup {...settings} />
      <FileModalGroup {...file} />
      <ExportModalGroup {...exportDialog} />
      <PasteTrackModalGroup {...pasteTrack} />
    </>
  );
}

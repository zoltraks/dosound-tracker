import { DownloadModal } from '../../modals/file/DownloadModal.tsx';
import { FilePickerModal } from '../../modals/file/FilePickerModal.tsx';

export interface FileModalGroupParams {
  isRepositoryInstrumentOpen: boolean;
  setIsRepositoryInstrumentOpen: (open: boolean) => void;
  onPickRepositoryInstrument: (fileUrl: string) => void;
  isDemoSongPickerOpen: boolean;
  setIsDemoSongPickerOpen: (open: boolean) => void;
  onPickDemoSong: (fileUrl: string) => void;
}

export interface FileModalGroupProps extends FileModalGroupParams {
  isDownloadOpen: boolean;
  setIsDownloadOpen: (open: boolean) => void;
}

export function FileModalGroup({
  isDownloadOpen,
  setIsDownloadOpen,
  isRepositoryInstrumentOpen,
  setIsRepositoryInstrumentOpen,
  onPickRepositoryInstrument,
  isDemoSongPickerOpen,
  setIsDemoSongPickerOpen,
  onPickDemoSong,
}: FileModalGroupProps) {
  return (
    <>
      <DownloadModal isOpen={isDownloadOpen} onClose={() => setIsDownloadOpen(false)} />
      <FilePickerModal
        isOpen={isRepositoryInstrumentOpen}
        title="Pick Instrument"
        directory="repository/instrument"
        mode="pick"
        defaultSortDescending={false}
        onClose={() => setIsRepositoryInstrumentOpen(false)}
        onPick={onPickRepositoryInstrument}
      />
      <FilePickerModal
        isOpen={isDemoSongPickerOpen}
        title="Demo Songs"
        directory="repository/song"
        mode="pick"
        defaultSortDescending={false}
        onClose={() => setIsDemoSongPickerOpen(false)}
        onPick={onPickDemoSong}
      />
    </>
  );
}

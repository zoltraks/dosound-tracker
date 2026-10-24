import React from 'react';
import { FilePickerModal } from './FilePickerModal.tsx';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  return (
    <FilePickerModal
      isOpen={isOpen}
      title="Downloads"
      directory="download"
      mode="download"
      defaultSortDescending={true}
      onClose={onClose}
    />
  );
};

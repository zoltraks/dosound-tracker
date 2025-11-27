import React from 'react';

interface DownloadModalProps {
  isOpen: boolean;
  files: string[];
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  files,
  onClose,
}) => {
  if (!isOpen) return null;

  const normalizedFiles = files
    .map(file => file.trim())
    .filter(file => file.length > 0);

  if (normalizedFiles.length === 0) {
    return null;
  }

  const buildHref = (file: string) => {
    return (
      'download/' +
      file
        .split(/[\\/]/)
        .map(encodeURIComponent)
        .join('/')
    );
  };

  const getLabel = (file: string) => {
    const parts = file.split(/[\\/]/);
    return parts[parts.length - 1] || file;
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog download-modal">
        <div className="modal-title">Downloads</div>
        <div className="modal-body download-modal-body">
          <ul className="download-list">
            {normalizedFiles.map(file => (
              <li key={file}>
                <a href={buildHref(file)} className="download-link">
                  {getLabel(file)}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="modal-actions">
          <button className="command-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

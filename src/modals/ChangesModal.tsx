import React from 'react';
import { renderMarkdown } from '../utils/markdown';

interface ChangesModalProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
}

export const ChangesModal: React.FC<ChangesModalProps> = ({
  isOpen,
  content,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog text-display">
        <div className="modal-title">Changes</div>
        <div
          className="modal-body text-display-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        <div className="modal-actions text-display-actions">
          <div className="text-display-actions-left">
            <a
              className="command-btn"
              href="CHANGELOG.md"
              download
            >
              DOWNLOAD
            </a>
          </div>
          <div className="text-display-actions-right">
            <button className="command-btn" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

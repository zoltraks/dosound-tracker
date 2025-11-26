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
      <div className="modal-dialog changelog-modal">
        <div className="modal-title">Changes</div>
        <div
          className="modal-body changelog-modal-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        <div className="modal-actions">
          <button className="command-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { renderMarkdown } from '../utils/markdown';

interface MarkdownModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  downloadHref: string;
  onClose: () => void;
  showTitle?: boolean;
}

export const MarkdownModal: React.FC<MarkdownModalProps> = ({
  isOpen,
  title,
  content,
  downloadHref,
  onClose,
  showTitle = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog text-display">
        {showTitle && <div className="modal-title">{title}</div>}
        <div
          className="modal-body text-display-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
        <div className="modal-actions text-display-actions">
          <div className="text-display-actions-left">
            <a
              className="command-btn"
              href={downloadHref}
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

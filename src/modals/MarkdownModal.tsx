import React, { useEffect, useRef } from 'react';
import { DialogFrame } from '../components/DialogFrame.tsx';
import { loadUiState, updateMarkdownScroll } from '../utils/storage/uiState.ts';
import { renderMarkdown } from '../utils/markdown/markdown.ts';

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
  const bodyRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRestored = useRef(false);

  // The restore must wait for content: applying scrollTop while the document
  // is still loading clamps it to the (empty) scroll height.
  useEffect(() => {
    if (!isOpen) {
      scrollRestored.current = false;
      return;
    }
    if (!scrollRestored.current && content && bodyRef.current) {
      bodyRef.current.scrollTop = loadUiState().markdownScroll;
      scrollRestored.current = true;
    }
  }, [isOpen, content]);

  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    },
    [],
  );

  const handleScroll = () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      if (bodyRef.current) {
        updateMarkdownScroll(bodyRef.current.scrollTop);
      }
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <DialogFrame label={title} className="text-display">
      {showTitle && <div className="modal-title">{title}</div>}
      <div
        ref={bodyRef}
        className="modal-body text-display-body"
        onScroll={handleScroll}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
      <div className="modal-actions text-display-actions">
        <div className="text-display-actions-left">
          <a className="command-button" href={downloadHref} download>
            DOWNLOAD
          </a>
        </div>
        <div className="text-display-actions-right">
          <button className="command-button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </DialogFrame>
  );
};

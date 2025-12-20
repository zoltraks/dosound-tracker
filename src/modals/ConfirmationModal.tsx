import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
}) => {
  if (!isOpen) return null;
  const normalizedMessage = message.replace(/\\n/g, '\n');
  const lines = normalizedMessage.split('\n');

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-title">{title}</div>
        <div className="modal-body">
          {lines.map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <div className="modal-actions confirm-actions">
          <div className="confirm-actions-left">
            <button className="command-btn" onClick={onCancel}>
              {cancelLabel}
            </button>
          </div>
          <div className="confirm-actions-right">
            <button className="command-btn" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

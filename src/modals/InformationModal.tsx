import React from 'react';
import { DialogFrame } from '../components/DialogFrame.tsx';

interface InformationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  className?: string;
}

export const InformationModal: React.FC<InformationModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
  className,
}) => {
  if (!isOpen) return null;
  const normalizedMessage = message.replace(/\\n/g, '\n');
  const lines = normalizedMessage.split('\n');

  return (
    <DialogFrame label={title} backdropStyle={{ zIndex: 1100 }} className={className}>
      <div className="modal-title">{title}</div>
      <div className="modal-body">
        {lines.map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
      <div className="modal-actions">
        <button className="command-button" onClick={onClose}>
          OK
        </button>
      </div>
    </DialogFrame>
  );
};

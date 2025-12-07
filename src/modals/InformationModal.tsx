import React from 'react';

interface InformationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export const InformationModal: React.FC<InformationModalProps> = ({
  isOpen,
  title,
  message,
  onClose,
}) => {
  if (!isOpen) return null;
  const normalizedMessage = message.replace(/\\n/g, '\n');
  const lines = normalizedMessage.split('\n');

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
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
        <div className="modal-actions">
          <button className="command-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface InstrumentTypeWarningModalProps {
  isOpen: boolean;
  hasTypeField: boolean;
  detectedType: string | null;
  ignoreFuture: boolean;
  onIgnoreChange: (value: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const InstrumentTypeWarningModal: React.FC<InstrumentTypeWarningModalProps> = ({
  isOpen,
  hasTypeField,
  detectedType,
  ignoreFuture,
  onIgnoreChange,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const lines: string[] = [];

  if (!hasTypeField) {
    lines.push('This instrument file does not contain a "type" field.');
    lines.push('It may have been created by another tool or an older DOSOUND Tracker version.');
  } else {
    lines.push('This instrument file has a "type" field that does not match "dosound".');
    lines.push('It may have been created by another tool or an incompatible format.');
  }

  lines.push('');
  lines.push('Do you want to continue loading this instrument anyway?');

  const message = lines.join('\n');
  const normalizedMessage = message.replace(/\\n/g, '\n');
  const messageLines = normalizedMessage.split('\n');

  const typeLabel = detectedType != null && String(detectedType).trim().length > 0
    ? String(detectedType)
    : '(missing or empty)';

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog instrument-type-warning-modal">
        <div className="modal-title">Instrument Format Warning</div>
        <div className="modal-body">
          {messageLines.map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < messageLines.length - 1 && <br />}
            </React.Fragment>
          ))}
          {hasTypeField && (
            <div style={{ marginTop: '8px' }}>
              <strong>Detected type:</strong> {typeLabel}
            </div>
          )}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
            }}
          >
            <input
              type="checkbox"
              checked={ignoreFuture}
              onChange={event => onIgnoreChange(event.target.checked)}
            />
            <span>Don't show this warning again (until RESET)</span>
          </label>
        </div>
        <div className="modal-actions">
          <button className="command-btn" type="button" onClick={onConfirm}>
            Continue
          </button>
          <button className="command-btn" type="button" onClick={onCancel}>
            Abort
          </button>
        </div>
      </div>
    </div>
  );
}

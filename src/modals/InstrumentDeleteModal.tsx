import React from 'react';
import type { InstrumentId } from '../types/branded';

interface InstrumentDeleteModalProps {
  isOpen: boolean;
  instrumentId: InstrumentId;
  instrumentName: string;
  usageCount: number;
  patternCount: number;
  onDeleteNotesAndInstrument: () => void;
  onDeleteInstrumentOnly: () => void;
  onCancel: () => void;
}

export const InstrumentDeleteModal: React.FC<InstrumentDeleteModalProps> = ({
  isOpen,
  instrumentId,
  instrumentName,
  usageCount,
  patternCount,
  onDeleteNotesAndInstrument,
  onDeleteInstrumentOnly,
  onCancel,
}) => {
  if (!isOpen) return null;

  const trimmedId = (instrumentId || '').trim();
  const idLabel = trimmedId || '--';
  const nameLabel = instrumentName || '';

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-title">Delete Instrument</div>
        <div className="modal-body">
          <div style={{ marginBottom: '8px' }}>
            <div>
              Instrument {idLabel}
              {nameLabel ? ` (${nameLabel})` : ''} is used in {usageCount} note
              {usageCount === 1 ? '' : 's'} across {patternCount} pattern
              {patternCount === 1 ? '' : 's'}.
            </div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <div>Choose how to proceed:</div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <button
              className="command-btn"
              type="button"
              onClick={onDeleteNotesAndInstrument}
            >
              Delete notes using this instrument and clear slot
            </button>
            <button
              className="command-btn"
              type="button"
              onClick={onDeleteInstrumentOnly}
            >
              Clear instrument only (keep notes)
            </button>
            <button className="command-btn" type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

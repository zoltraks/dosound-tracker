import React from 'react';
import type { TrackPasteMode } from '../hooks/useTrackOperations';

interface PasteTrackModalProps {
  isOpen: boolean;
  mode: TrackPasteMode;
  onModeChange: (mode: TrackPasteMode) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PasteTrackModal: React.FC<PasteTrackModalProps> = ({
  isOpen,
  mode,
  onModeChange,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-title">Paste Track</div>
        <div className="modal-body">
          <div style={{ marginBottom: '8px' }}>
            <div>You are about to overwrite non-empty track:</div>
            <label>
              <input
                type="radio"
                name="paste-track-mode"
                checked={mode === 'replace'}
                onChange={() => onModeChange('replace')}
              />{' '}
              Replace track data entirely
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="paste-track-mode"
                checked={mode === 'overwriteAll'}
                onChange={() => onModeChange('overwriteAll')}
              />{' '}
              Overwrite all steps
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="paste-track-mode"
                checked={mode === 'overwriteEmpty'}
                onChange={() => onModeChange('overwriteEmpty')}
              />{' '}
              Overwrite only empty steps
            </label>
          </div>
        </div>
        <div className="modal-actions export-actions">
          <div className="export-actions-left">
            <button className="command-btn" type="button" onClick={onCancel}>
              CANCEL
            </button>
          </div>
          <div className="export-actions-right">
            <button className="command-btn" type="button" onClick={onConfirm}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

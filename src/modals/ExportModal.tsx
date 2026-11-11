import React from 'react';
import { DialogFrame } from '../components/DialogFrame.tsx';
import type { ExportType, ExportFormat, ExportStrategy } from '../constants/export.ts';
import { buildExportStrategyNote, exportStrategyApplies } from '../utils/export/exportStrategy.ts';

interface ExportModalProps {
  isOpen: boolean;
  exportType: ExportType;
  exportStrategy: ExportStrategy;
  onChangeType: (type: ExportType) => void;
  onChangeStrategy: (strategy: ExportStrategy) => void;
  onExportFormat: (format: ExportFormat) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  exportType,
  exportStrategy,
  onChangeType,
  onChangeStrategy,
  onExportFormat,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const formatButtons: { format: ExportFormat; label: string }[] = [
    { format: 'data', label: 'DATA' },
    { format: 'dump', label: 'DUMP' },
    { format: 'bin', label: 'BIN' },
    { format: 'vgm', label: 'VGM' },
    { format: 'max', label: 'MAX' },
    { format: 'wav', label: 'WAV' },
    { format: 'mod', label: 'MOD' },
    { format: 'midi', label: 'MIDI' },
  ];

  return (
    <DialogFrame label="Export" className="export-modal">
      <div className="modal-title">Export</div>
      <div className="modal-body">
        <div style={{ marginBottom: '8px' }}>
          <div>What:</div>
          <label>
            <input
              type="radio"
              name="export-type"
              checked={exportType === 'song'}
              onChange={() => onChangeType('song')}
            />{' '}
            Song (entire playlist playback)
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="export-type"
              checked={exportType === 'pattern'}
              onChange={() => onChangeType('pattern')}
            />{' '}
            Pattern (current playlist position)
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="export-type"
              checked={exportType === 'instrument'}
              onChange={() => onChangeType('instrument')}
            />{' '}
            Instrument (current selected instrument)
          </label>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div>Strategy:</div>
          <label>
            <input
              type="radio"
              name="export-strategy"
              checked={exportStrategy === 'simple'}
              onChange={() => onChangeStrategy('simple')}
            />{' '}
            SIMPLE DUMP
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="export-strategy"
              checked={exportStrategy === 'complex'}
              onChange={() => onChangeStrategy('complex')}
            />{' '}
            COMPLEX DUMP
          </label>
          <br />
          <label>
            <input
              type="radio"
              name="export-strategy"
              checked={exportStrategy === 'tight'}
              onChange={() => onChangeStrategy('tight')}
            />{' '}
            TIGHT DUMP
          </label>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div>Format:</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '4px',
              marginTop: '4px',
            }}
          >
            {formatButtons.map(({ format, label }) => (
              <button
                key={format}
                type="button"
                className="command-button"
                style={{ width: '100%' }}
                onClick={() => onExportFormat(format)}
              >
                {label}
                {exportStrategyApplies(format, exportType) && <span aria-hidden="true">*</span>}
              </button>
            ))}
          </div>
          <div className="export-strategy-note">{buildExportStrategyNote(exportType)}</div>
        </div>
      </div>
      <div className="modal-actions export-actions">
        <div className="export-actions-left">
          <button className="command-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div className="export-actions-right">
          <button className="command-button" onClick={handleConfirm}>
            OK
          </button>
        </div>
      </div>
    </DialogFrame>
  );
};

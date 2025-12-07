import React from 'react';
import type { ExportType, ExportStrategy } from '../constants/export';

interface ExportModalProps {
  isOpen: boolean;
  exportType: ExportType;
  exportStrategy: ExportStrategy;
  onChangeType: (type: ExportType) => void;
  onChangeStrategy: (strategy: ExportStrategy) => void;
  onExportDump: () => void;
  onExportData: () => void;
  onExportBin: () => void;
  onExportVgm: () => void;
  onExportWav: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  exportType,
  exportStrategy,
  onChangeType,
  onChangeStrategy,
  onExportDump,
  onExportData,
  onExportBin,
  onExportVgm,
  onExportWav,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleDumpClick = () => {
    onExportDump();
  };

  const handleDataClick = () => {
    onExportData();
  };

  const handleBinClick = () => {
    onExportBin();
  };

  const handleVgmClick = () => {
    onExportVgm();
  };

  const handleWavClick = () => {
    onExportWav();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog export-modal">
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
              Song (entire playlist)
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
              Instrument (current)
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
                checked={exportStrategy === 'optimized'}
                onChange={() => onChangeStrategy('optimized')}
              />{' '}
              OPTIMIZED DUMP
            </label>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div>Format:</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: '4px',
                marginTop: '4px',
              }}
            >
              <button type="button" className="command-btn" style={{ width: '100%' }} onClick={handleDumpClick}>
                DUMP
              </button>
              <button type="button" className="command-btn" style={{ width: '100%' }} onClick={handleDataClick}>
                DATA
              </button>
              <button type="button" className="command-btn" style={{ width: '100%' }} onClick={handleBinClick}>
                BIN
              </button>
              <button type="button" className="command-btn" style={{ width: '100%' }} onClick={handleVgmClick}>
                VGM
              </button>
              <button type="button" className="command-btn" style={{ width: '100%' }} onClick={handleWavClick}>
                WAV
              </button>
            </div>
          </div>
        </div>
        <div className="modal-actions export-actions">
          <div className="export-actions-left">
            <button className="command-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
          <div className="export-actions-right">
            <button className="command-btn" onClick={handleConfirm}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

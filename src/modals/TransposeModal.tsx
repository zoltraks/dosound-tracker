import React from 'react';
import NumberSpinner from '../components/NumberSpinner';

interface TransposeModalProps {
  isOpen: boolean;
  scope: 'line' | 'song';
  trackScope: 'current' | 'all';
  instrumentScope: 'all' | 'selected';
  amount: number;
  amountInput: string;
  onScopeChange: (scope: 'line' | 'song') => void;
  onTrackScopeChange: (scope: 'current' | 'all') => void;
  onInstrumentScopeChange: (scope: 'all' | 'selected') => void;
  onAmountChange: (value: string) => void;
  onAmountAdjust: (delta: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const TransposeModal: React.FC<TransposeModalProps> = ({
  isOpen,
  scope,
  trackScope,
  instrumentScope,
  amount,
  onScopeChange,
  onTrackScopeChange,
  onInstrumentScopeChange,
  onAmountChange,
  onAmountAdjust,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-title">Transpose</div>
        <div className="modal-body">
          <div style={{ marginBottom: '8px' }}>
            <div>Song scope:</div>
            <label>
              <input
                type="radio"
                name="transpose-scope"
                checked={scope === 'line'}
                onChange={() => onScopeChange('line')}
              />{' '}
              Current playlist position only
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="transpose-scope"
                checked={scope === 'song'}
                onChange={() => onScopeChange('song')}
              />{' '}
              Entire song (all playlist positions)
            </label>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div>Track scope:</div>
            <label>
              <input
                type="radio"
                name="transpose-track-scope"
                checked={trackScope === 'current'}
                onChange={() => onTrackScopeChange('current')}
              />{' '}
              Current track only
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="transpose-track-scope"
                checked={trackScope === 'all'}
                onChange={() => onTrackScopeChange('all')}
              />{' '}
              All tracks (A, B, C)
            </label>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div>Instrument scope:</div>
            <label>
              <input
                type="radio"
                name="transpose-inst-scope"
                checked={instrumentScope === 'all'}
                onChange={() => onInstrumentScopeChange('all')}
              />{' '}
              All instruments
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="transpose-inst-scope"
                checked={instrumentScope === 'selected'}
                onChange={() => onInstrumentScopeChange('selected')}
              />{' '}
              Selected instrument only
            </label>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div>Semitone offset:</div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '4px',
                marginBottom: '4px',
              }}
            >
              <button
                type="button"
                className="command-btn"
                style={{ width: '100%' }}
                onClick={() => onAmountAdjust(-12)}
              >
                -12 (OCTAVE DOWN)
              </button>
              <button
                type="button"
                className="command-btn"
                style={{ width: '100%' }}
                onClick={() => onAmountAdjust(-1)}
              >
                -1 (NOTE DOWN)
              </button>
              <button
                type="button"
                className="command-btn"
                style={{ width: '100%' }}
                onClick={() => onAmountAdjust(12)}
              >
                +12 (OCTAVE UP)
              </button>
              <button
                type="button"
                className="command-btn"
                style={{ width: '100%' }}
                onClick={() => onAmountAdjust(1)}
              >
                +1 (NOTE UP)
              </button>
            </div>
            <div>
              Semitones:{' '}
              <NumberSpinner
                value={amount}
                onChange={(next) => {
                  const text =
                    typeof next === 'number' && Number.isFinite(next)
                      ? String(next)
                      : '';
                  onAmountChange(text);
                }}
                min={-99}
                max={99}
                step={1}
                ariaLabel="Semitone offset"
              />
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="command-btn" onClick={onConfirm}>
            OK
          </button>
          <button className="command-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import type { Instrument } from '../synth/SoundDriver';
import { ColorPicker } from '../components/ColorPicker';

interface InstrumentColorModalProps {
  isOpen: boolean;
  instrument: Instrument | null;
  onSave: (color: string | null) => void;
  onClear: () => void;
  onCancel: () => void;
}

export const InstrumentColorModal: React.FC<InstrumentColorModalProps> = ({
  isOpen,
  instrument,
  onSave,
  onClear,
  onCancel,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>('#888');

  useEffect(() => {
    if (!isOpen || !instrument) {
      return;
    }

    const raw = typeof instrument.color === 'string' && instrument.color.trim()
      ? instrument.color
      : '#888';
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setSelectedColor(raw);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, instrument]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }
    },
    [onCancel]
  );

  const handleOk = useCallback(() => {
    onSave(selectedColor);
  }, [onSave, selectedColor]);

  const handleClearClick = useCallback(() => {
    onClear();
  }, [onClear]);

  if (!isOpen || !instrument) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div
        className="modal-dialog"
        onKeyDown={handleKeyDown}
      >
        <div className="modal-title">Instrument Color</div>
        <div className="modal-body">
          <ColorPicker
            value={selectedColor}
            onChange={setSelectedColor}
          />
        </div>
        <div className="modal-actions about-actions">
          <div className="about-actions-left">
            <button
              type="button"
              className="command-btn"
              onClick={handleClearClick}
            >
              CLEAR
            </button>
            <button
              type="button"
              className="command-btn"
              onClick={onCancel}
            >
              CANCEL
            </button>
          </div>
          <div className="about-actions-right">
            <button
              type="button"
              className="command-btn"
              onClick={handleOk}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

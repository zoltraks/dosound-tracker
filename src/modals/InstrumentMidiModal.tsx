import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Instrument } from '../synth/SoundDriver';
import NumberSpinner from '../components/NumberSpinner';

interface InstrumentMidiModalProps {
  isOpen: boolean;
  instrument: Instrument | null;
  onSave: (midi: { channel: number | null; program: number | null }) => void;
  onCancel: () => void;
}

export const InstrumentMidiModal: React.FC<InstrumentMidiModalProps> = ({
  isOpen,
  instrument,
  onSave,
  onCancel
}) => {
  const [channel, setChannel] = useState<number | null>(null);
  const [program, setProgram] = useState<number | null>(null);

  const channelInputRef = useRef<HTMLInputElement | null>(null);
  const programInputRef = useRef<HTMLInputElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen || !instrument) {
      return;
    }

    const midi = instrument.midi;

    const rawChannel = midi && typeof midi.channel === 'number' && Number.isFinite(midi.channel)
      ? midi.channel
      : null;
    const rawProgram = midi && typeof midi.program === 'number' && Number.isFinite(midi.program)
      ? midi.program
      : null;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        setChannel(rawChannel);
        setProgram(rawProgram);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, instrument]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (channelInputRef.current) {
        channelInputRef.current.focus();
        if (typeof channelInputRef.current.select === 'function') {
          channelInputRef.current.select();
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  const handleSave = useCallback(() => {
    let normalizedChannel: number | null = null;
    if (typeof channel === 'number' && Number.isFinite(channel)) {
      const clamped = Math.max(1, Math.min(16, Math.floor(channel)));
      normalizedChannel = clamped;
    }

    let normalizedProgram: number | null = null;
    if (typeof program === 'number' && Number.isFinite(program)) {
      const clamped = Math.max(0, Math.min(127, Math.floor(program)));
      normalizedProgram = clamped;
    }

    onSave({ channel: normalizedChannel, program: normalizedProgram });
  }, [channel, program, onSave]);

  const handleInputKeyDown = useCallback(
    (field: 'channel' | 'program', event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        handleSave();
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        const targetRef = field === 'channel' ? programInputRef : channelInputRef;
        if (targetRef.current) {
          targetRef.current.focus();
          if (typeof targetRef.current.select === 'function') {
            targetRef.current.select();
          }
        }
      }
    },
    [handleSave, onCancel]
  );

  const handleActionButtonKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const key = event.key;
      if (
        key !== 'ArrowLeft' &&
        key !== 'ArrowRight' &&
        key !== 'ArrowUp' &&
        key !== 'ArrowDown'
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const order = [clearButtonRef, cancelButtonRef, saveButtonRef];
      const currentIndex = order.findIndex(ref => ref.current === event.currentTarget);
      if (currentIndex === -1) {
        return;
      }

      const isNext = key === 'ArrowRight' || key === 'ArrowDown';
      const nextIndex = isNext
        ? (currentIndex + 1) % order.length
        : (currentIndex - 1 + order.length) % order.length;

      const nextRef = order[nextIndex];
      if (nextRef.current) {
        nextRef.current.focus();
      }
    },
    []
  );

  if (!isOpen || !instrument) {
    return null;
  }

  const handleClear = () => {
    setChannel(null);
    setProgram(null);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            onCancel();
          }
        }}
      >
        <div className="modal-title">Instrument MIDI Output</div>
        <div className="modal-body">
          <div style={{ marginBottom: '8px', fontSize: '10px' }}>
            <div>
              Instrument: {instrument.id} - {(instrument.name || '').trim() || '(unnamed)'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="info-field">
              <label>Channel:</label>
              <NumberSpinner
                value={channel}
                onChange={setChannel}
                min={1}
                max={16}
                ariaLabel="MIDI channel (1-16)"
                inputRef={channelInputRef}
                onInputKeyDown={(event) => handleInputKeyDown('channel', event)}
              />
            </div>

            <div className="info-field">
              <label>Program:</label>
              <NumberSpinner
                value={program}
                onChange={setProgram}
                min={0}
                max={127}
                ariaLabel="MIDI program (0-127)"
                inputRef={programInputRef}
                onInputKeyDown={(event) => handleInputKeyDown('program', event)}
              />
            </div>

            <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: 4 }}>
              Leave both fields empty to disable MIDI output for this instrument.
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="command-btn"
            ref={clearButtonRef}
            onClick={handleClear}
            onKeyDown={handleActionButtonKeyDown}
          >
            CLEAR
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="command-btn"
              ref={cancelButtonRef}
              onClick={onCancel}
              onKeyDown={handleActionButtonKeyDown}
            >
              CANCEL
            </button>
            <button
              type="button"
              className="command-btn"
              ref={saveButtonRef}
              onClick={handleSave}
              onKeyDown={handleActionButtonKeyDown}
            >
              SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

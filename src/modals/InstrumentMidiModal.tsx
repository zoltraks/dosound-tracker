import React, { useEffect, useState } from 'react';
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

    setChannel(rawChannel);
    setProgram(rawProgram);
  }, [isOpen, instrument]);

  if (!isOpen || !instrument) {
    return null;
  }

  const handleSave = () => {
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
  };

  const handleClear = () => {
    setChannel(null);
    setProgram(null);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
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
            onClick={handleClear}
          >
            CLEAR
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="command-btn"
              onClick={onCancel}
            >
              CANCEL
            </button>
            <button
              type="button"
              className="command-btn"
              onClick={handleSave}
            >
              SAVE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

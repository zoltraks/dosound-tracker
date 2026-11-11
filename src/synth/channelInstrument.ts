import {
  NOTE_FREQUENCIES,
  NOTE_BASE_OCTAVE,
  pow2Octave,
  pow2Semitone,
} from '../constants/music.ts';
import type { Instrument } from './SoundDriver.ts';
import type { YMState } from './YM2149.ts';

// Minimal register surface the instrument-to-register helpers operate on.
// Both sound engines implement it: YM2149 over its register file,
// AyumiEngine over the main-thread mirror.
export interface RegisterIo {
  readRegister(register: number): number;
  writeRegister(register: number, value: number): void;
  beginBatch(): void;
  endBatch(): void;
}

export function getModeValueForTick(instrument: Instrument, tick: number): number {
  const defaultMode = 0;

  if (!instrument.mode || instrument.mode.length === 0) {
    return defaultMode;
  }

  const modeIndex = Math.min(Math.max(tick, 0), instrument.mode.length - 1);
  const envelopeValue = instrument.mode[modeIndex];
  return typeof envelopeValue === 'number' ? envelopeValue : defaultMode;
}

export function getToneNoiseState(instrument: Instrument, tick: number) {
  const modeValue = getModeValueForTick(instrument, tick);
  const toneActive = modeValue === 0 || modeValue === 2;
  const noiseActive = modeValue === 1 || modeValue === 2;
  return { modeValue, toneActive, noiseActive };
}

export function updateMixerForChannel(
  io: RegisterIo,
  channel: number,
  toneActive: boolean,
  noiseActive: boolean,
) {
  const currentMixer = io.readRegister(7) ?? 0x3f;
  let mixer = currentMixer;

  const toneBit = 1 << channel;
  const noiseBit = 0x08 << channel;

  mixer = toneActive ? mixer & ~toneBit : mixer | toneBit;
  mixer = noiseActive ? mixer & ~noiseBit : mixer | noiseBit;

  if (mixer !== currentMixer) {
    io.writeRegister(0x07, mixer);
  }
}

export function applyNoiseEnvelopeValue(io: RegisterIo, instrument: Instrument, tick: number) {
  let noisePeriod: number;

  if (!instrument.noise || instrument.noise.length === 0) {
    noisePeriod = 15; // Mid-range noise period
  } else {
    const noiseIndex = Math.min(Math.max(tick, 0), instrument.noise.length - 1);
    const noiseValue = instrument.noise[noiseIndex];
    noisePeriod = Math.max(0, Math.min(31, typeof noiseValue === 'number' ? noiseValue : 0));
  }

  io.writeRegister(0x06, noisePeriod);
}

export function updateChannelWithInstrument(
  io: RegisterIo,
  clock: number,
  channel: number,
  instrument: Instrument,
  noteData?: { note: string; octave: number },
  envelopeTick: number = 0,
  volumeModifier?: number | null,
) {
  io.beginBatch();
  try {
    const volumeRegister = 8 + channel; // R8, R9, R10
    const fineRegister = channel * 2; // R0, R2, R4
    const coarseRegister = channel * 2 + 1; // R1, R3, R5

    const safeTick = Math.max(0, envelopeTick | 0);

    const { toneActive, noiseActive } = getToneNoiseState(instrument, safeTick);
    updateMixerForChannel(io, channel, toneActive, noiseActive);

    if (!noteData || noteData.note === '===') {
      // No note or explicit note-off - silence channel
      io.writeRegister(volumeRegister, 0x00);
      return;
    }

    // Update tone frequency using shift (in semitones) and pitch envelope as
    // a direct delta on the frequency divider (period).
    if (toneActive) {
      const baseFreq = NOTE_FREQUENCIES[noteData.note];
      if (baseFreq) {
        let frequency = baseFreq * pow2Octave(noteData.octave - NOTE_BASE_OCTAVE);

        let shiftSemitones = 0;
        if (instrument.shift && instrument.shift.length > 0) {
          const shiftIndex = Math.min(safeTick, instrument.shift.length - 1);
          const shiftValue = instrument.shift[shiftIndex];
          if (typeof shiftValue === 'number') {
            shiftSemitones = shiftValue | 0;
          }
        }

        if (shiftSemitones !== 0) {
          frequency = frequency * pow2Semitone(shiftSemitones);
        }

        let period = Math.floor(clock / (16 * frequency));

        // Apply pitch envelope as an integer delta on the period:
        // positive values decrease the divider, negative values increase it.
        let pitchDelta = 0;
        if (instrument.pitch && instrument.pitch.length > 0) {
          const pitchIndex = Math.min(safeTick, instrument.pitch.length - 1);
          const pitchValue = instrument.pitch[pitchIndex];
          if (typeof pitchValue === 'number') {
            pitchDelta = pitchValue | 0;
          }
        }

        if (pitchDelta !== 0) {
          period -= pitchDelta;
        }

        // Clamp to valid 12-bit divider range (1..4095). Period 0 is treated as silence.
        if (period <= 0 || period >= 4096) {
          // Out of range: silence this tone by writing a large period
          period = 4095;
        }

        io.writeRegister(fineRegister, period & 0xff);
        io.writeRegister(coarseRegister, (period >> 8) & 0x0f);
      }
    }

    const volumeArray =
      Array.isArray(instrument.volume) && instrument.volume.length > 0 ? instrument.volume : [0];
    const volumeIndex = Math.min(safeTick, volumeArray.length - 1);
    const volumeValue = volumeArray[volumeIndex];
    let volume = Math.max(0, Math.min(15, volumeValue));

    if (volumeModifier !== undefined && volumeModifier !== null) {
      const mod = Math.max(0, Math.min(15, volumeModifier | 0));
      // Treat modifier as an attenuation factor: 15 = no attenuation, 0 = silence.
      volume = Math.floor((volume * mod) / 15);
    }

    io.writeRegister(volumeRegister, volume);

    if (noiseActive) {
      applyNoiseEnvelopeValue(io, instrument, safeTick);
    }
  } finally {
    io.endBatch();
  }
}

// Derives the derived-view YMState from a raw 16-register file. Shared by
// YM2149 (live register file) and AyumiEngine (main-thread mirror) so Dump
// and EQ panels read identical semantics from either engine.
export function deriveYmState(registers: number[]): YMState {
  return {
    channels: [
      {
        // Channel A (R0, R1, R8)
        tonePeriod: ((registers[1] & 0x0f) << 8) | registers[0],
        toneEnabled: !(registers[7] & 0x01),
        noiseEnabled: !(registers[7] & 0x08),
        volume: registers[8] & 0x0f,
        envelopeEnabled: !!(registers[8] & 0x10),
      },
      {
        // Channel B (R2, R3, R9)
        tonePeriod: ((registers[3] & 0x0f) << 8) | registers[2],
        toneEnabled: !(registers[7] & 0x02),
        noiseEnabled: !(registers[7] & 0x10),
        volume: registers[9] & 0x0f,
        envelopeEnabled: !!(registers[9] & 0x10),
      },
      {
        // Channel C (R4, R5, R10)
        tonePeriod: ((registers[5] & 0x0f) << 8) | registers[4],
        toneEnabled: !(registers[7] & 0x04),
        noiseEnabled: !(registers[7] & 0x20),
        volume: registers[10] & 0x0f,
        envelopeEnabled: !!(registers[10] & 0x10),
      },
    ],
    // Noise period (R6)
    noisePeriod: registers[6] & 0x1f,
    // Envelope shape (R11, R12, R13)
    envelopeShape: registers[13] & 0x0f,
    envelopeEnabled: !!(registers[13] & 0x10),
  };
}

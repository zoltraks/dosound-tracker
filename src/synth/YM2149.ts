export const YM_CLOCK = 2000000; // 2 MHz clock frequency
const YM_REGISTER_COUNT = 16; // Number of YM2149 registers (0-15)

// AY/YM style logarithmic volume table (16 levels, approx. -2dB per step)
// Values are relative amplitudes; we'll scale them to keep headroom.
export const YM_LOG_VOLUME_TABLE: number[] = [
  0.0,    // 0: silence
  0.0078, // 1
  0.0110, // 2
  0.0157, // 3
  0.0221, // 4
  0.0313, // 5
  0.0442, // 6
  0.0625, // 7
  0.0884, // 8
  0.1250, // 9
  0.1768, // 10
  0.2500, // 11
  0.3536, // 12
  0.5000, // 13
  0.7071, // 14
  1.0000  // 15: max
];
import { NOTE_FREQUENCIES, NOTE_BASE_OCTAVE } from '../constants/music';
import type { Instrument } from './SoundDriver';

export interface YMChannel {
  tonePeriod: number;
  toneEnabled: boolean;
  noiseEnabled: boolean;
  volume: number;
  envelopeEnabled: boolean;
}

export interface YMRegisters {
  [key: number]: number;
}

export interface YMState {
  channels: YMChannel[];
  noisePeriod: number;
  envelopeShape: number;
  envelopeEnabled: boolean;
}

export class YM2149 {
  private audioContext: AudioContext;
  private clock: number;
  private registers: number[];
  private state: YMState;
  private oscillators: OscillatorNode[];
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNodes: GainNode[];
  private noiseGainNode: GainNode;
  private envelopeGainNode: GainNode;
  private lastNoisePeriod: number = -1; // Track noise period changes
  private batchDepth: number = 0;
  private pendingUpdate: boolean = false;

  constructor(audioContext: AudioContext, clock: number = YM_CLOCK) {
    this.audioContext = audioContext;
    this.clock = clock;
    this.registers = new Array(YM_REGISTER_COUNT).fill(0);
    this.state = {
      channels: [
        { tonePeriod: 0, toneEnabled: true, noiseEnabled: false, volume: 0, envelopeEnabled: false },
        { tonePeriod: 0, toneEnabled: true, noiseEnabled: false, volume: 0, envelopeEnabled: false },
        { tonePeriod: 0, toneEnabled: true, noiseEnabled: false, volume: 0, envelopeEnabled: false }
      ],
      noisePeriod: 0,
      envelopeShape: 0,
      envelopeEnabled: false
    };

    // Initialize audio nodes
    this.oscillators = [];
    this.gainNodes = [];
    this.noiseGainNode = audioContext.createGain();
    this.envelopeGainNode = audioContext.createGain();

    for (let i = 0; i < 3; i++) {
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Default to A4
      
      // Create gain node
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Start silent
      
      // Connect: oscillator -> gain -> destination (bypassing DC offset for now)
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      this.oscillators.push(oscillator);
      this.gainNodes.push(gainNode);
    }

    this.noiseGainNode.connect(audioContext.destination);
    this.envelopeGainNode.connect(audioContext.destination);
  }

  setClock(clock: number): void {
    this.clock = clock;
  }

  getClock(): number {
    return this.clock;
  }

  writeRegister(register: number, value: number): void {
    if (register < 0 || register >= YM_REGISTER_COUNT) return;

    const masked = value & 0xFF;
    if (this.registers[register] === masked) {
      return;
    }

    this.registers[register] = masked;

    if (this.batchDepth > 0) {
      this.pendingUpdate = true;
      return;
    }

    this.updateState();
    this.updateAudioNodes();
  }

  beginBatch(): void {
    this.batchDepth += 1;
  }

  endBatch(): void {
    this.batchDepth = Math.max(0, this.batchDepth - 1);
    if (this.batchDepth === 0 && this.pendingUpdate) {
      this.pendingUpdate = false;
      this.updateState();
      this.updateAudioNodes();
    }
  }

  private updateState(): void {
    // Channel A (R0, R1, R8)
    this.state.channels[0].tonePeriod = 
      (this.registers[1] & 0x0F) << 8 | this.registers[0];
    this.state.channels[0].toneEnabled = !(this.registers[7] & 0x01);
    this.state.channels[0].noiseEnabled = !(this.registers[7] & 0x08);
    this.state.channels[0].volume = this.registers[8] & 0x0F;
    this.state.channels[0].envelopeEnabled = !!(this.registers[8] & 0x10);

    // Channel B (R2, R3, R9)
    this.state.channels[1].tonePeriod = 
      (this.registers[3] & 0x0F) << 8 | this.registers[2];
    this.state.channels[1].toneEnabled = !(this.registers[7] & 0x02);
    this.state.channels[1].noiseEnabled = !(this.registers[7] & 0x10);
    this.state.channels[1].volume = this.registers[9] & 0x0F;
    this.state.channels[1].envelopeEnabled = !!(this.registers[9] & 0x10);

    // Channel C (R4, R5, R10)
    this.state.channels[2].tonePeriod = 
      (this.registers[5] & 0x0F) << 8 | this.registers[4];
    this.state.channels[2].toneEnabled = !(this.registers[7] & 0x04);
    this.state.channels[2].noiseEnabled = !(this.registers[7] & 0x20);
    this.state.channels[2].volume = this.registers[10] & 0x0F;
    this.state.channels[2].envelopeEnabled = !!(this.registers[10] & 0x10);

    // Noise period (R6)
    this.state.noisePeriod = this.registers[6] & 0x1F;

    // Envelope shape (R11, R12, R13)
    this.state.envelopeShape = this.registers[13] & 0x0F;
    this.state.envelopeEnabled = !!(this.registers[13] & 0x10);
  }

  private getEffectiveNoisePeriod(period: number): number {
    const masked = period & 0x1F;
    return masked === 0 ? 1 : masked;
  }

  private updateAudioNodes(): void {
    const now = this.audioContext.currentTime;
    
    // Update noise generator first
    this.updateNoiseGenerator();
    
    for (let i = 0; i < 3; i++) {
      const channel = this.state.channels[i];
      const oscillator = this.oscillators[i];
      const gainNode = this.gainNodes[i];

      // Check if channel should be silent (volume = 0 in YM2149 means silence)
      const isSilent = channel.volume === 0;
      
      // Check if this channel should play sound (tone OR noise)
      const shouldPlayTone = channel.toneEnabled && 
                            channel.tonePeriod > 0 && 
                            channel.tonePeriod < 4096 && 
                            !isSilent;
      
      if (shouldPlayTone) {
        // YM2149 frequency calculation: f = clock / (16 * period)
        const frequency = this.clock / (16 * channel.tonePeriod);
        
        // Clamp frequency to reasonable range (20Hz - 20kHz)
        const clampedFrequency = Math.max(20, Math.min(20000, frequency));
        
        // Update frequency IMMEDIATELY (no glide/portamento)
        oscillator.frequency.setValueAtTime(clampedFrequency, now);
        
        // Calculate volume using AY/YM logarithmic curve (0-15, where 15 is LOUDEST)
        const level = Math.max(0, Math.min(15, channel.volume | 0));
        const volume = YM_LOG_VOLUME_TABLE[level] * 0.3; // Scale for headroom
        
        // Apply volume immediately for crisp note changes
        gainNode.gain.setValueAtTime(volume, now);
        
      } else {
        // Complete silence for tone - immediate cutoff
        gainNode.gain.setValueAtTime(0, now);
      }
    }
    
    // Update noise gain based on any channel using noise
    const anyNoiseActive = this.state.channels.some(channel => channel.noiseEnabled && channel.volume > 0);
    
    if (anyNoiseActive) {
      const noiseLevels = this.state.channels
        .filter(channel => channel.noiseEnabled && channel.volume > 0)
        .map(channel => Math.max(0, Math.min(15, channel.volume | 0)));
      const combinedLevel = Math.min(1,
        noiseLevels.reduce((sum, level) => sum + YM_LOG_VOLUME_TABLE[level], 0)
      );
      const noiseVolume = combinedLevel * 0.4; // Slight boost so noise matches perceived tone loudness
      this.noiseGainNode.gain.setValueAtTime(noiseVolume, now);
    } else {
      this.noiseGainNode.gain.setValueAtTime(0, now);
    }
  }

  private updateNoiseGenerator(): void {
    const effectiveNoisePeriod = this.getEffectiveNoisePeriod(this.state.noisePeriod);

    if (effectiveNoisePeriod !== this.lastNoisePeriod || !this.noiseNode) {
      this.lastNoisePeriod = effectiveNoisePeriod;
      this.createNoiseGenerator(effectiveNoisePeriod);
    }
  }

  private createNoiseGenerator(noisePeriod: number): void {
    if (this.noiseNode) {
      this.noiseNode.stop();
      this.noiseNode.disconnect();
    }

    const noiseBuffer = this.createNoiseBuffer(noisePeriod);
    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;
    this.noiseNode.connect(this.noiseGainNode);
    this.noiseNode.start();
  }

  private createNoiseBuffer(noisePeriod: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const effectiveNoisePeriod = this.getEffectiveNoisePeriod(noisePeriod);
    const noiseFrequency = this.clock / (16 * effectiveNoisePeriod);
    const bufferLength = Math.ceil(sampleRate * 2);
    const buffer = this.audioContext.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    let lfsr = 0x1FFFF; // 17-bit LFSR seed (must be non-zero)
    let phase = 0;
    const step = noiseFrequency / sampleRate;

    for (let i = 0; i < bufferLength; i++) {
      phase += step;
      if (phase >= 1) {
        const advances = Math.floor(phase);
        phase -= advances;
        for (let a = 0; a < advances; a++) {
          const bit0 = lfsr & 1;
          const bit3 = (lfsr >> 3) & 1;
          const newBit = bit0 ^ bit3;
          lfsr = ((lfsr >> 1) | (newBit << 16)) & 0x1FFFF;
        }
      }

      data[i] = (lfsr & 1) ? 1 : -1;
    }

    return buffer;
  }

  getRegisters(): YMRegisters {
    return { ...this.registers };
  }

  getRegistersArray(): number[] {
    return Array.from({ length: YM_REGISTER_COUNT }, (_, i) => this.registers[i] || 0);
  }

  getState(): YMState {
    return this.state;
  }

  reset(): void {
    for (let i = 0; i < YM_REGISTER_COUNT; i++) {
      this.registers[i] = 0;
    }
    this.lastNoisePeriod = -1; // Reset noise period tracking
    this.updateState();
    this.updateAudioNodes();
  }

  public silenceAll(): void {
    const now = this.audioContext.currentTime;

    // Zero volume registers for all channels so state and debug views reflect silence
    for (let ch = 0; ch < 3; ch++) {
      const volumeRegister = 8 + ch; // R8, R9, R10
      this.registers[volumeRegister] = 0;
    }

    // Recompute internal state and derived gains based on zeroed volumes
    this.updateState();
    this.updateAudioNodes();

    // Hard-gate all gains to guarantee immediate silence regardless of previous state
    this.gainNodes.forEach(gainNode => {
      gainNode.gain.setValueAtTime(0, now);
    });
    this.noiseGainNode.gain.setValueAtTime(0, now);
    this.envelopeGainNode.gain.setValueAtTime(0, now);
  }

  // Helper methods for instrument-based sound generation
  private getDefaultModeValue = () => 0;

  public getModeValueForTick = (instrument: Instrument, tick: number): number => {
    const defaultMode = this.getDefaultModeValue();

    if (!instrument.mode || instrument.mode.length === 0) {
      return defaultMode;
    }

    const modeIndex = Math.min(Math.max(tick, 0), instrument.mode.length - 1);
    const envelopeValue = instrument.mode[modeIndex];
    return typeof envelopeValue === 'number' ? envelopeValue : defaultMode;
  };

  public getToneNoiseState = (instrument: Instrument, tick: number) => {
    const modeValue = this.getModeValueForTick(instrument, tick);
    const toneActive = modeValue === 0 || modeValue === 2;
    const noiseActive = modeValue === 1 || modeValue === 2;
    return { modeValue, toneActive, noiseActive };
  };

  public updateMixerForChannel = (channel: number, toneActive: boolean, noiseActive: boolean) => {
    const currentMixer = this.registers[7] ?? 0x3F;
    let mixer = currentMixer;

    const toneBit = 1 << channel;
    const noiseBit = 0x08 << channel;

    mixer = toneActive ? (mixer & ~toneBit) : (mixer | toneBit);
    mixer = noiseActive ? (mixer & ~noiseBit) : (mixer | noiseBit);

    if (mixer !== currentMixer) {
      this.writeRegister(0x07, mixer);
    }
  };

  public applyNoiseEnvelopeValue = (instrument: Instrument, tick: number) => {
    let noisePeriod: number;
    
    if (!instrument.noise || instrument.noise.length === 0) {
      // Default noise period when no envelope is defined
      noisePeriod = 15; // Mid-range noise period
    } else {
      const noiseIndex = Math.min(Math.max(tick, 0), instrument.noise.length - 1);
      const noiseValue = instrument.noise[noiseIndex];
      noisePeriod = Math.max(0, Math.min(31, typeof noiseValue === 'number' ? noiseValue : 0));
    }
    
    this.writeRegister(0x06, noisePeriod);
  };

  public updateChannelWithInstrument = (
    channel: number,
    instrument: Instrument,
    noteData?: { note: string; octave: number },
    envelopeTick: number = 0,
    volumeModifier?: number | null
  ) => {
    this.beginBatch();
    try {
    const volumeRegister = 8 + channel; // R8, R9, R10
    const fineRegister = channel * 2;        // R0, R2, R4
    const coarseRegister = channel * 2 + 1;  // R1, R3, R5

    const safeTick = Math.max(0, envelopeTick | 0);

    const { toneActive, noiseActive } = this.getToneNoiseState(instrument, safeTick);
    this.updateMixerForChannel(channel, toneActive, noiseActive);

    if (!noteData || noteData.note === '===') {
      // No note or explicit note-off - silence channel
      this.writeRegister(volumeRegister, 0x00);
      return;
    }

    // Update tone frequency using shift (in semitones) and pitch envelope as
    // a direct delta on the frequency divider (period).
    if (toneActive) {
      const baseFreq = NOTE_FREQUENCIES[noteData.note];
      if (baseFreq) {
        // Start from plain note frequency
        let frequency = baseFreq * Math.pow(2, noteData.octave - NOTE_BASE_OCTAVE);

        // Apply shift as semitone offsets on top of the note
        let shiftSemitones = 0;
        if (instrument.shift && instrument.shift.length > 0) {
          const shiftIndex = Math.min(safeTick, instrument.shift.length - 1);
          const shiftValue = instrument.shift[shiftIndex];
          if (typeof shiftValue === 'number') {
            shiftSemitones = shiftValue | 0;
          }
        }

        if (shiftSemitones !== 0) {
          frequency = frequency * Math.pow(2, shiftSemitones / 12);
        }

        // Convert to a base divider period using the YM clock
        let period = Math.floor(this.clock / (16 * frequency));

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

        this.writeRegister(fineRegister, period & 0xFF);
        this.writeRegister(coarseRegister, (period >> 8) & 0x0F);
      }
    }

    // Volume envelope with optional per-step modifier.
    const volumeArray = Array.isArray(instrument.volume) && instrument.volume.length > 0
      ? instrument.volume
      : [0];
    const volumeIndex = Math.min(safeTick, volumeArray.length - 1);
    const volumeValue = volumeArray[volumeIndex];
    let volume = Math.max(0, Math.min(15, volumeValue));

    if (volumeModifier !== undefined && volumeModifier !== null) {
      const mod = Math.max(0, Math.min(15, volumeModifier | 0));
      // Treat modifier as an attenuation factor: 15 = no attenuation, 0 = silence.
      volume = Math.floor((volume * mod) / 15);
    }

    this.writeRegister(volumeRegister, volume);

    // Noise envelope whenever noise is active
    if (noiseActive) {
      this.applyNoiseEnvelopeValue(instrument, safeTick);
    }
    } finally {
      this.endBatch();
    }
  };

  dispose(): void {
    this.oscillators.forEach(osc => osc.stop());
    if (this.noiseNode) {
      this.noiseNode.stop();
    }
  }
}

export const YM_CLOCK = 2000000; // 2 MHz clock frequency
const YM_REGISTER_COUNT = 16; // Number of YM2149 registers (0-15)

// AY/YM style logarithmic volume table (16 levels, approx. -2dB per step)
// Values are relative amplitudes; we'll scale them to keep headroom.
export const YM_LOG_VOLUME_TABLE: number[] = [
  0.0, // 0: silence
  0.0078, // 1
  0.011, // 2
  0.0157, // 3
  0.0221, // 4
  0.0313, // 5
  0.0442, // 6
  0.0625, // 7
  0.0884, // 8
  0.125, // 9
  0.1768, // 10
  0.25, // 11
  0.3536, // 12
  0.5, // 13
  0.7071, // 14
  1.0, // 15: max
];
import type { Instrument } from './SoundDriver.ts';
import type { SoundEngine } from './soundEngine.ts';
import { RegisterFile } from './registerFile.ts';
import {
  deriveYmState,
  getModeValueForTick as computeModeValueForTick,
  getToneNoiseState as computeToneNoiseState,
  updateMixerForChannel as updateMixerForChannelOn,
  applyNoiseEnvelopeValue as applyNoiseEnvelopeValueOn,
  updateChannelWithInstrument as updateChannelWithInstrumentOn,
} from './channelInstrument.ts';

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

export class YM2149 implements SoundEngine {
  private audioContext: AudioContext;
  private clock: number;
  private registerFile: RegisterFile;
  private state: YMState;
  private oscillators: OscillatorNode[];
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNodes: GainNode[];
  private noiseGainNode: GainNode;
  private envelopeGainNode: GainNode;
  private lastNoisePeriod: number = -1;

  constructor(audioContext: AudioContext, clock: number = YM_CLOCK) {
    this.audioContext = audioContext;
    this.clock = clock;
    this.registerFile = new RegisterFile(() => {
      this.updateState();
      this.updateAudioNodes();
    }, YM_REGISTER_COUNT);
    this.state = deriveYmState(this.registerFile.raw());

    this.oscillators = [];
    this.gainNodes = [];
    this.noiseGainNode = audioContext.createGain();
    this.envelopeGainNode = audioContext.createGain();

    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Default to A4

      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);

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
    this.registerFile.write(register, value);
  }

  beginBatch(): void {
    this.registerFile.beginBatch();
  }

  endBatch(): void {
    this.registerFile.endBatch();
  }

  private updateState(): void {
    this.state = deriveYmState(this.registerFile.raw());
  }

  private getEffectiveNoisePeriod(period: number): number {
    const masked = period & 0x1f;
    return masked === 0 ? 1 : masked;
  }

  private updateAudioNodes(): void {
    const now = this.audioContext.currentTime;

    this.updateNoiseGenerator();

    for (let i = 0; i < 3; i++) {
      const channel = this.state.channels[i];
      const oscillator = this.oscillators[i];
      const gainNode = this.gainNodes[i];

      const isSilent = channel.volume === 0;

      const shouldPlayTone =
        channel.toneEnabled && channel.tonePeriod > 0 && channel.tonePeriod < 4096 && !isSilent;

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

        gainNode.gain.setValueAtTime(volume, now);
      } else {
        gainNode.gain.setValueAtTime(0, now);
      }
    }

    // Update noise gain based on any channel using noise - one accumulating
    // pass, identical sum order to the filter/map/reduce it replaces.
    let noiseGain = 0;
    for (const channel of this.state.channels) {
      if (channel.noiseEnabled && channel.volume > 0) {
        const level = Math.max(0, Math.min(15, channel.volume | 0));
        noiseGain += YM_LOG_VOLUME_TABLE[level];
      }
    }

    if (noiseGain > 0) {
      const noiseVolume = Math.min(1, noiseGain) * 0.4; // Slight boost so noise matches perceived tone loudness
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

    let lfsr = 0x1ffff; // 17-bit LFSR seed (must be non-zero)
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
          lfsr = ((lfsr >> 1) | (newBit << 16)) & 0x1ffff;
        }
      }

      data[i] = lfsr & 1 ? 1 : -1;
    }

    return buffer;
  }

  getRegisters(): YMRegisters {
    return this.registerFile.snapshot();
  }

  getRegistersArray(): number[] {
    return this.registerFile.toArray();
  }

  getState(): YMState {
    return this.state;
  }

  reset(): void {
    this.registerFile.zero();
    this.lastNoisePeriod = -1;
    this.updateState();
    this.updateAudioNodes();
  }

  public silenceAll(): void {
    const now = this.audioContext.currentTime;

    // Zero volume registers for all channels so state and debug views reflect silence
    for (let ch = 0; ch < 3; ch++) {
      const volumeRegister = 8 + ch; // R8, R9, R10
      this.registerFile.force(volumeRegister, 0);
    }

    this.updateState();
    this.updateAudioNodes();

    // Hard-gate all gains to guarantee immediate silence regardless of previous state
    this.gainNodes.forEach((gainNode) => {
      gainNode.gain.setValueAtTime(0, now);
    });
    this.noiseGainNode.gain.setValueAtTime(0, now);
    this.envelopeGainNode.gain.setValueAtTime(0, now);
  }

  readRegister(register: number): number {
    return this.registerFile.read(register);
  }

  // The instrument-to-register helpers delegate to the shared module in
  // channelInstrument.ts so the identical logic feeds both sound engines.
  public getModeValueForTick = (instrument: Instrument, tick: number): number =>
    computeModeValueForTick(instrument, tick);

  public getToneNoiseState = (instrument: Instrument, tick: number) =>
    computeToneNoiseState(instrument, tick);

  public updateMixerForChannel = (channel: number, toneActive: boolean, noiseActive: boolean) =>
    updateMixerForChannelOn(this, channel, toneActive, noiseActive);

  public applyNoiseEnvelopeValue = (instrument: Instrument, tick: number) =>
    applyNoiseEnvelopeValueOn(this, instrument, tick);

  public updateChannelWithInstrument = (
    channel: number,
    instrument: Instrument,
    noteData?: { note: string; octave: number },
    envelopeTick: number = 0,
    volumeModifier?: number | null,
  ) =>
    updateChannelWithInstrumentOn(
      this,
      this.clock,
      channel,
      instrument,
      noteData,
      envelopeTick,
      volumeModifier,
    );

  dispose(): void {
    this.oscillators.forEach((osc) => osc.stop());
    if (this.noiseNode) {
      this.noiseNode.stop();
    }
  }
}

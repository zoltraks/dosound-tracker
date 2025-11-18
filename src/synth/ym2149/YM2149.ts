const YM_BASE_CLOCK = 2000000; // 2 MHz clock frequency
const YM_REGISTER_COUNT = 16; // Number of YM2149 registers (0-15)
import { NOTE_FREQUENCIES } from '../../constants/music';

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

// Forward declaration for Instrument interface
export interface Instrument {
  id: string;
  name: string;
  volumeEnvelope: number[];
  arpeggioEnvelope: number[];
  pitchEnvelope: number[];
  noiseEnvelope: number[];
  modeEnvelope: number[];
}

export class YM2149 {
  private audioContext: AudioContext;
  private registers: number[];
  private state: YMState;
  private oscillators: OscillatorNode[];
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNodes: GainNode[];
  private noiseGainNode: GainNode;
  private envelopeGainNode: GainNode;
  private lastNoisePeriod: number = -1; // Track noise period changes

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
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

  writeRegister(register: number, value: number): void {
    if (register < 0 || register >= YM_REGISTER_COUNT) return;
    
    this.registers[register] = value & 0xFF;
    this.updateState();
    this.updateAudioNodes();
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
        // YM2149 frequency calculation: f = clock / (32 * period)
        const frequency = YM_BASE_CLOCK / (32 * channel.tonePeriod);
        
        // Clamp frequency to reasonable range (20Hz - 20kHz)
        const clampedFrequency = Math.max(20, Math.min(20000, frequency));
        
        // Update frequency IMMEDIATELY (no glide/portamento)
        oscillator.frequency.setValueAtTime(clampedFrequency, now);
        
        // Calculate volume with proper YM2149 volume levels (0-15, where 15 is LOUDEST)
        const volume = channel.volume / 15.0 * 0.3; // Max 30% volume to prevent clipping
        
        // Apply volume immediately for crisp note changes
        gainNode.gain.setValueAtTime(volume, now);
        
      } else {
        // Complete silence for tone - immediate cutoff
        gainNode.gain.setValueAtTime(0, now);
      }
    }
    
    // Update noise gain based on any channel using noise
    const anyNoiseActive = this.state.channels.some(channel => channel.noiseEnabled && channel.volume > 0);
    
    if (anyNoiseActive && this.state.noisePeriod > 0) {
      // Calculate noise volume based on the loudest channel using noise
      const maxNoiseVolume = Math.max(...this.state.channels
        .filter(channel => channel.noiseEnabled)
        .map(channel => channel.volume));
      const noiseVolume = maxNoiseVolume / 15.0 * 0.3; // Normal volume for noise
      this.noiseGainNode.gain.setValueAtTime(noiseVolume, now);
    } else {
      this.noiseGainNode.gain.setValueAtTime(0, now);
    }
  }

  private updateNoiseGenerator(): void {
    const targetNoisePeriod = this.state.noisePeriod;
    
    // Check if noise period changed
    if (targetNoisePeriod !== this.lastNoisePeriod) {
      this.lastNoisePeriod = targetNoisePeriod;
      
      if (targetNoisePeriod === 0) {
        // No noise - silence
        if (this.noiseNode) {
          this.noiseNode.stop();
          this.noiseNode = null;
        }
      } else {
        // Create new noise generator with updated period
        this.createNoiseGenerator(targetNoisePeriod);
      }
    }
  }

  private createNoiseGenerator(noisePeriod: number): void {
    if (this.noiseNode) {
      this.noiseNode.stop();
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
    
    // Calculate noise frequency from period
    // YM2149 noise frequency = clock / (16 * period)
    // For period 31, this gives ~4kHz clock / (16 * 31) = ~4kHz
    // But this seems too high - let's try a different approach
    // Let's use a more reasonable frequency range
    const baseFrequency = YM_BASE_CLOCK / (16 * noisePeriod);
    // Clamp to audible range (100Hz to 8kHz)
    const noiseFrequency = Math.max(100, Math.min(8000, baseFrequency));
    
    const bufferLength = Math.ceil(sampleRate * 2); // 2 seconds of noise
    const buffer = this.audioContext.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    // Simple approach: generate white noise and filter it based on period
    // Lower period = higher frequency noise = more random changes
    const changeProbability = Math.min(1, noiseFrequency / 1000); // Probability of changing value each sample
    
    let currentValue = (Math.random() - 0.5) * 0.2; // Start with random value between -0.1 and 0.1
    
    for (let i = 0; i < bufferLength; i++) {
      // Randomly change value to create noise
      if (Math.random() < changeProbability) {
        currentValue = (Math.random() - 0.5) * 0.2; // New random value
      }
      data[i] = currentValue;
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
    return JSON.parse(JSON.stringify(this.state));
  }

  reset(): void {
    for (let i = 0; i < YM_REGISTER_COUNT; i++) {
      this.registers[i] = 0;
    }
    this.lastNoisePeriod = -1; // Reset noise period tracking
    this.updateState();
    this.updateAudioNodes();
  }

  // Helper methods for instrument-based sound generation
  private getDefaultModeValue = (_instrument: Instrument) => 0;

  public getModeValueForTick = (instrument: Instrument, tick: number): number => {
    const defaultMode = this.getDefaultModeValue(instrument);

    if (!instrument.modeEnvelope || instrument.modeEnvelope.length === 0) {
      return defaultMode;
    }

    const modeIndex = Math.min(Math.max(tick, 0), instrument.modeEnvelope.length - 1);
    const envelopeValue = instrument.modeEnvelope[modeIndex];
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
    
    if (!instrument.noiseEnvelope || instrument.noiseEnvelope.length === 0) {
      // Default noise period when no envelope is defined
      noisePeriod = 15; // Mid-range noise period
    } else {
      const noiseIndex = Math.min(Math.max(tick, 0), instrument.noiseEnvelope.length - 1);
      const noiseValue = instrument.noiseEnvelope[noiseIndex];
      noisePeriod = Math.max(0, Math.min(31, typeof noiseValue === 'number' ? noiseValue : 0));
      
      // If envelope value is 0, use a default noise period
      if (noisePeriod === 0) {
        noisePeriod = 15;
      }
    }
    
    this.writeRegister(0x06, noisePeriod);
  };

  public updateChannelWithInstrument = (
    channel: number,
    instrument: Instrument,
    noteData?: { note: string; octave: number },
    envelopeTick: number = 0
  ) => {
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

    // Update tone frequency using arpeggio and pitch envelopes
    if (toneActive) {
      const baseFreq = NOTE_FREQUENCIES[noteData.note];
      if (baseFreq) {
        let frequency = baseFreq * Math.pow(2, noteData.octave - 4);

        let arpeggioSemitones = 0;
        if (instrument.arpeggioEnvelope && instrument.arpeggioEnvelope.length > 0) {
          const arpeggioIndex = Math.min(safeTick, instrument.arpeggioEnvelope.length - 1);
          const arpeggioValue = instrument.arpeggioEnvelope[arpeggioIndex];
          if (typeof arpeggioValue === 'number') {
            arpeggioSemitones = arpeggioValue;
          }
        }

        if (arpeggioSemitones !== 0) {
          frequency = frequency * Math.pow(2, arpeggioSemitones / 12);
        }

        let pitchSemitones = 0;
        if (instrument.pitchEnvelope && instrument.pitchEnvelope.length > 0) {
          const pitchIndex = Math.min(safeTick, instrument.pitchEnvelope.length - 1);
          const pitchValue = instrument.pitchEnvelope[pitchIndex];
          if (typeof pitchValue === 'number') {
            pitchSemitones = pitchValue;
          }
        }

        if (pitchSemitones !== 0) {
          frequency = frequency * Math.pow(2, pitchSemitones / 12);
        }

        const period = Math.floor(2000000 / (16 * frequency));

        this.writeRegister(fineRegister, period & 0xFF);
        this.writeRegister(coarseRegister, (period >> 8) & 0x0F);
      }
    }

    // Volume envelope
    const volumeIndex = Math.min(safeTick, instrument.volumeEnvelope.length - 1);
    const volumeValue = instrument.volumeEnvelope[volumeIndex];
    const volume = Math.max(0, Math.min(15, volumeValue));
    this.writeRegister(volumeRegister, volume);

    // Noise envelope whenever noise is active
    if (noiseActive) {
      this.applyNoiseEnvelopeValue(instrument, safeTick);
    }
  };

  dispose(): void {
    this.oscillators.forEach(osc => osc.stop());
    if (this.noiseNode) {
      this.noiseNode.stop();
    }
  }

  // Test method for debugging noise
  public testNoise(): void {
    // Clear all registers first
    this.writeRegister(0x07, 0x3F); // Disable everything
    this.writeRegister(0x08, 0x00); // Volume A = 0
    
    // Enable only noise on channel A
    this.writeRegister(0x07, 0x33); // 110011 - Tone A disabled, Noise A enabled
    this.writeRegister(0x08, 0x0F); // Max volume on channel A
    this.writeRegister(0x06, 15);   // Mid noise period
    
    // Also set tone period to 0 to ensure tone is silent
    this.writeRegister(0x00, 0x00); // Fine tone A = 0
    this.writeRegister(0x01, 0x00); // Coarse tone A = 0
  }
}

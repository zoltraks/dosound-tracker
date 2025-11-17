export const YM_BASE_CLOCK = 2000000; // 2 MHz base clock
export const MAX_CHANNEL_VOLUME = 0x0F; // Maximum volume (0-15)
export const YM_REGISTER_COUNT = 14; // R0-R13
export const NOISE_PERIOD_MAX = 0x1F; // Maximum noise period value
export const TONE_PERIOD_MAX = 0xFFF; // Maximum tone period value

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
  private registers: number[];
  private state: YMState;
  private oscillators: OscillatorNode[];
  private noiseNode: AudioBufferSourceNode | null = null;
  private gainNodes: GainNode[];
  private dcOffsetNodes: GainNode[]; // Add DC offset correction nodes
  private noiseGainNode: GainNode;
  private envelopeGainNode: GainNode;

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
    this.dcOffsetNodes = [];
    this.noiseGainNode = audioContext.createGain();
    this.envelopeGainNode = audioContext.createGain();

    console.log('=== INITIALIZING YM2149 AUDIO NODES ===');

    for (let i = 0; i < 3; i++) {
      console.log(`Creating oscillator ${i}`);
      
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
      
      console.log(`Oscillator ${i} created and connected: freq=${oscillator.frequency.value}, type=${oscillator.type}`);
    }

    console.log('=== YM2149 AUDIO NODES INITIALIZED ===');

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
    
    for (let i = 0; i < 3; i++) {
      const channel = this.state.channels[i];
      const oscillator = this.oscillators[i];
      const gainNode = this.gainNodes[i];

      console.log(`Channel ${i}: toneEnabled=${channel.toneEnabled}, period=${channel.tonePeriod}, volume=${channel.volume}`);

      // Check if channel should be silent (volume = 0 in YM2149 means silence)
      const isSilent = channel.volume === 0;
      
      // Check if this channel should play sound
      const shouldPlay = channel.toneEnabled && 
                        channel.tonePeriod > 0 && 
                        channel.tonePeriod < 4096 && 
                        !isSilent;
      
      if (shouldPlay) {
        // YM2149 frequency calculation: f = clock / (32 * period)
        const frequency = YM_BASE_CLOCK / (32 * channel.tonePeriod);
        
        // Clamp frequency to reasonable range (20Hz - 20kHz)
        const clampedFrequency = Math.max(20, Math.min(20000, frequency));
        
        console.log(`Channel ${i}: Playing frequency ${clampedFrequency}Hz with volume ${channel.volume}`);
        
        // Update frequency IMMEDIATELY (no glide/portamento)
        oscillator.frequency.setValueAtTime(clampedFrequency, now);
        
        // Calculate volume with proper YM2149 volume levels (0-15, where 15 is LOUDEST)
        const volume = channel.volume / 15.0 * 0.3; // Max 30% volume to prevent clipping
        
        // Apply volume immediately for crisp note changes
        gainNode.gain.setValueAtTime(volume, now);
        
      } else {
        // Complete silence - immediate cutoff
        gainNode.gain.setValueAtTime(0, now);
      }
    }
  }

  private updateNoiseGenerator(): void {
    if (this.noiseNode) {
      this.noiseNode.stop();
    }

    const noiseBuffer = this.createNoiseBuffer();
    this.noiseNode = this.audioContext.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;
    this.noiseNode.connect(this.noiseGainNode);
    
    const noiseVolume = this.state.noisePeriod / NOISE_PERIOD_MAX;
    this.noiseGainNode.gain.setValueAtTime(noiseVolume * 0.05, this.audioContext.currentTime);
    
    this.noiseNode.start();
  }

  private createNoiseBuffer(): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const bufferLength = sampleRate * 2; // 2 seconds of noise
    const buffer = this.audioContext.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    // Simple pseudo-random noise generator
    let seed = 0x1234;
    for (let i = 0; i < bufferLength; i++) {
      seed = (seed << 1) | ((seed >> 14) & 1);
      if ((seed & 1) ^ ((seed >> 1) & 1)) {
        seed |= 0x4000;
      }
      data[i] = ((seed & 1) * 2 - 1) * 0.1; // Convert to -0.1 to 0.1 range
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
    this.updateState();
    this.updateAudioNodes();
  }

  dispose(): void {
    this.oscillators.forEach(osc => osc.stop());
    if (this.noiseNode) {
      this.noiseNode.stop();
    }
  }
}

// Minimal YM2149-style 3-channel square/noise generator implemented as an AudioWorkletProcessor.

// `sampleRate` is provided by the AudioWorklet global scope.
declare const sampleRate: number;

// These are provided by the AudioWorklet global scope at runtime but are not
// part of the default TypeScript DOM lib, so we declare minimal shapes here
// to satisfy the compiler while keeping the implementation self-contained.
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(...args: any[]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare function registerProcessor(name: string, processorCtor: any): void;

interface WorkletChannelState {
  frequency: number;
  volume: number; // Linear gain 0..1
  toneActive: boolean;
  noiseActive: boolean;
  phase: number; // 0..1
}

class YM2149Processor extends AudioWorkletProcessor {
  private channels: WorkletChannelState[];
  private noiseLfsr: number;
  private noisePhase: number;
  private noiseFrequency: number;

  constructor() {
    super();

    this.channels = [
      { frequency: 0, volume: 0, toneActive: false, noiseActive: false, phase: 0 },
      { frequency: 0, volume: 0, toneActive: false, noiseActive: false, phase: 0 },
      { frequency: 0, volume: 0, toneActive: false, noiseActive: false, phase: 0 }
    ];

    // 17-bit LFSR for pseudo-random noise
    this.noiseLfsr = 0x1ffff;
    this.noisePhase = 0;
    this.noiseFrequency = 1000; // Default noise update rate in Hz

    this.port.onmessage = (event: MessageEvent) => {
      const data = event.data as any;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'setChannelParams': {
          const ch = (data.channel as number) | 0;
          if (ch < 0 || ch >= 3) return;
          const channel = this.channels[ch];

          if (typeof data.frequency === 'number') {
            channel.frequency = Math.max(0, data.frequency);
          }
          if (typeof data.volume === 'number') {
            channel.volume = Math.max(0, Math.min(1, data.volume));
          }
          channel.toneActive = !!data.toneActive;
          channel.noiseActive = !!data.noiseActive;
          break;
        }

        case 'setNoiseFrequency': {
          if (typeof data.frequency === 'number' && data.frequency > 0) {
            this.noiseFrequency = data.frequency;
          }
          break;
        }

        case 'silenceAll': {
          for (const ch of this.channels) {
            ch.frequency = 0;
            ch.volume = 0;
            ch.toneActive = false;
            ch.noiseActive = false;
          }
          break;
        }
      }
    };
  }

  private nextNoiseSample(currentSampleRate: number): number {
    // Advance LFSR at approximately `noiseFrequency`.
    const step = this.noiseFrequency / currentSampleRate;
    this.noisePhase += step;
    if (this.noisePhase >= 1) {
      const advances = Math.floor(this.noisePhase);
      this.noisePhase -= advances;
      for (let i = 0; i < advances; i++) {
        const bit0 = this.noiseLfsr & 1;
        const bit3 = (this.noiseLfsr >> 3) & 1;
        const newBit = bit0 ^ bit3;
        this.noiseLfsr = ((this.noiseLfsr >> 1) | (newBit << 16)) & 0x1ffff;
      }
    }
    return (this.noiseLfsr & 1) ? 1 : -1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    // Mark parameters as used so TypeScript's noUnusedParameters is satisfied.
    void inputs;
    void parameters;
    const output = outputs[0];
    if (!output || output.length === 0) {
      return true;
    }

    const channelData = output[0];
    const sr = sampleRate || 44100;

    for (let i = 0; i < channelData.length; i++) {
      let sample = 0;
      const noiseSample = this.nextNoiseSample(sr);

      for (let ch = 0; ch < 3; ch++) {
        const state = this.channels[ch];
        const vol = state.volume;
        if (vol <= 0) {
          continue;
        }

        let chSample = 0;

        if (state.toneActive && state.frequency > 0) {
          state.phase += state.frequency / sr;
          if (state.phase >= 1) {
            state.phase -= Math.floor(state.phase);
          }
          const square = state.phase < 0.5 ? 1 : -1;
          chSample += square;
        }

        if (state.noiseActive) {
          chSample += noiseSample * 0.7;
        }

        if (chSample !== 0) {
          sample += chSample * vol;
        }
      }

      // Master gain to avoid clipping
      channelData[i] = sample * 0.3;
    }

    return true;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(registerProcessor as any)('ym2149-processor', YM2149Processor);

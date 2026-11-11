import { AyumiCore } from '../synth/ayumiCore.ts';

// AudioWorklet-scope globals are absent from the TypeScript DOM lib, so the
// processor base class and helpers are declared ambiently here.
interface WorkletProcessorBase {
  readonly port: MessagePort;
}

declare const AudioWorkletProcessor: {
  prototype: WorkletProcessorBase;
  new (): WorkletProcessorBase;
};

declare function registerProcessor(name: string, ctor: new () => WorkletProcessorBase): void;

declare const sampleRate: number;

export type AyumiWorkletMessage =
  | { type: 'write'; register: number; value: number }
  | { type: 'writes'; pairs: Array<[number, number]> }
  | { type: 'clock'; clock: number }
  | { type: 'chip'; chip: string }
  | { type: 'pans'; pans: number[] }
  | { type: 'reset' };

const AYUMI_REGISTER_COUNT = 16;
// The folded (left + right) * 0.5 peak reaches ~1.33 at three in-phase
// full-volume channels. Gain 1.2 is the measured loudness-parity point with
// the internal engine; the soft-knee limiter keeps that gain while bounding
// the extreme tail under 1.0 - linear below the knee, tanh saturation above.
const AYUMI_OUTPUT_GAIN = 1.2;
const AYUMI_SOFT_KNEE = 0.9;

const softLimit = (value: number): number => {
  const magnitude = Math.abs(value);
  if (magnitude <= AYUMI_SOFT_KNEE) {
    return value;
  }
  const head = 1 - AYUMI_SOFT_KNEE;
  return (
    Math.sign(value) * (AYUMI_SOFT_KNEE + head * Math.tanh((magnitude - AYUMI_SOFT_KNEE) / head))
  );
};

class AyumiProcessor extends AudioWorkletProcessor {
  private core = new AyumiCore();
  private registers = new Array<number>(AYUMI_REGISTER_COUNT).fill(0);
  private clock = 0;
  // The chip variant selects the core's DAC table: false renders the
  // AY-3-8910 curve. Kept across configure calls like the clock.
  private isYm = true;
  // Per-channel pans on the 0..1 scale (0.5 centre). They are re-applied
  // inside configure so clock changes and resets keep the routing.
  private pans = [0.5, 0.5, 0.5];
  private stereoActive = false;

  constructor() {
    super();
    this.configure(2000000);
    this.port.onmessage = (event: MessageEvent<AyumiWorkletMessage>) => {
      this.handleMessage(event.data);
    };
  }

  private configure(clock: number): void {
    this.clock = clock;
    this.core.configure(this.isYm, clock, sampleRate);
    for (let channel = 0; channel < 3; channel++) {
      this.core.setPan(channel, this.pans[channel], false);
    }
    this.replayRegisters();
  }

  private replayRegisters(): void {
    for (let register = 0; register < AYUMI_REGISTER_COUNT; register++) {
      this.applyRegister(register, this.registers[register]);
    }
  }

  // Register-to-setter mapping:
  // R0-R5   -> setTone(channel, 12-bit period)
  // R6      -> setNoise(period & 0x1f)
  // R7      -> setMixer(channel, toneOff, noiseOff, envOn) per channel
  // R8-R10  -> setVolume(channel, value & 0x0f) + envOn bit into setMixer
  // R11-R12 -> setEnvelope(16-bit period)
  // R13     -> setEnvelopeShape(shape & 0x0f)
  private applyRegister(register: number, value: number): void {
    if (register >= 0 && register <= 5) {
      const channel = register >> 1;
      const fine = this.registers[channel * 2];
      const coarse = this.registers[channel * 2 + 1];
      this.core.setTone(channel, ((coarse & 0x0f) << 8) | fine);
      return;
    }
    if (register === 6) {
      this.core.setNoise(value & 0x1f);
      return;
    }
    if (register === 7) {
      for (let channel = 0; channel < 3; channel++) {
        const toneOff = (value >> channel) & 1;
        const noiseOff = (value >> (channel + 3)) & 1;
        const envOn = (this.registers[8 + channel] >> 4) & 1;
        this.core.setMixer(channel, toneOff, noiseOff, envOn);
      }
      return;
    }
    if (register >= 8 && register <= 10) {
      const channel = register - 8;
      this.core.setVolume(channel, value & 0x0f);
      const mixer = this.registers[7];
      const toneOff = (mixer >> channel) & 1;
      const noiseOff = (mixer >> (channel + 3)) & 1;
      this.core.setMixer(channel, toneOff, noiseOff, (value >> 4) & 1);
      return;
    }
    if (register === 11 || register === 12) {
      this.core.setEnvelope((this.registers[12] << 8) | this.registers[11]);
      return;
    }
    if (register === 13) {
      this.core.setEnvelopeShape(value & 0x0f);
    }
  }

  private handleMessage(message: AyumiWorkletMessage): void {
    if (message.type === 'write') {
      this.registers[message.register] = message.value;
      this.applyRegister(message.register, message.value);
      return;
    }
    if (message.type === 'writes') {
      for (const [register, value] of message.pairs) {
        this.registers[register] = value;
        this.applyRegister(register, value);
      }
      return;
    }
    if (message.type === 'clock') {
      this.configure(message.clock);
      return;
    }
    if (message.type === 'chip') {
      this.isYm = message.chip !== 'AY';
      this.configure(this.clock);
      return;
    }
    if (message.type === 'pans') {
      for (let channel = 0; channel < 3; channel++) {
        const value = message.pans?.[channel];
        const pan =
          typeof value === 'number' && Number.isFinite(value)
            ? Math.min(1, Math.max(0, value))
            : 0.5;
        this.pans[channel] = pan;
        this.core.setPan(channel, pan, false);
      }
      this.stereoActive = this.pans.some((pan) => pan !== 0.5);
      return;
    }
    if (message.type === 'reset') {
      this.registers.fill(0);
      this.configure(this.clock);
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const left = outputs[0]?.[0];
    if (!left) {
      return true;
    }
    const right = outputs[0]?.[1];
    // With every pan at centre the folded mono value is emitted on both
    // outputs - the exact sample the single-channel node produced. Any
    // off-centre pan switches to per-side rendering through the same
    // soft-knee limiter.
    const stereo = this.stereoActive;
    for (let i = 0; i < left.length; i++) {
      this.core.process();
      this.core.removeDc();
      if (stereo && right) {
        left[i] = softLimit(this.core.left * AYUMI_OUTPUT_GAIN);
        right[i] = softLimit(this.core.right * AYUMI_OUTPUT_GAIN);
      } else if (stereo) {
        left[i] = softLimit(this.core.left * AYUMI_OUTPUT_GAIN);
      } else {
        const mono = softLimit((this.core.left + this.core.right) * 0.5 * AYUMI_OUTPUT_GAIN);
        left[i] = mono;
        if (right) {
          right[i] = mono;
        }
      }
    }
    return true;
  }
}

registerProcessor('ayumi-processor', AyumiProcessor);

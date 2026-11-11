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
  | { type: 'reset' };

const AYUMI_REGISTER_COUNT = 16;
// Centre-panned YM output peaks near 1.5 with all three channels at full
// volume - the output gain keeps headroom against clipping.
const AYUMI_OUTPUT_GAIN = 0.5;

class AyumiProcessor extends AudioWorkletProcessor {
  private core = new AyumiCore();
  private registers = new Array<number>(AYUMI_REGISTER_COUNT).fill(0);
  private clock = 0;

  constructor() {
    super();
    this.configure(2000000);
    this.port.onmessage = (event: MessageEvent<AyumiWorkletMessage>) => {
      this.handleMessage(event.data);
    };
  }

  private configure(clock: number): void {
    this.clock = clock;
    this.core.configure(true, clock, sampleRate);
    for (let channel = 0; channel < 3; channel++) {
      this.core.setPan(channel, 0.5, false);
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
    if (message.type === 'reset') {
      this.registers.fill(0);
      this.configure(this.clock);
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const channel = outputs[0]?.[0];
    if (!channel) {
      return true;
    }
    for (let i = 0; i < channel.length; i++) {
      this.core.process();
      this.core.removeDc();
      channel[i] = (this.core.left + this.core.right) * 0.5 * AYUMI_OUTPUT_GAIN;
    }
    return true;
  }
}

registerProcessor('ayumi-processor', AyumiProcessor);

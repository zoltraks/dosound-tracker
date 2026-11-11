import workletUrl from '../workers/ayumiWorklet.ts?worker&url';
import type { AyumiWorkletMessage } from '../workers/ayumiWorklet.ts';
import type { Instrument } from './SoundDriver.ts';
import type { SoundEngine } from './soundEngine.ts';
import type { RegisterIo } from './channelInstrument.ts';
import { updateChannelWithInstrument, deriveYmState } from './channelInstrument.ts';
import { RegisterFile } from './registerFile.ts';
import type { YMRegisters, YMState } from './YM2149.ts';
import { YM_CLOCK } from './YM2149.ts';

const AYUMI_REGISTER_COUNT = 16;

// Minimal structural handle on the AudioWorkletNode so the facade stays
// testable with a mocked worklet port.
export interface AyumiWorkletNode {
  port: Pick<MessagePort, 'postMessage' | 'close'>;
  connect(destination: AudioNode): AudioNode;
  disconnect(): void;
}

// Main-thread facade over the Ayumi AudioWorkletProcessor. Register writes
// update a local mirror and travel to the worklet as messages, batched per
// tick the way beginBatch/endBatch coalesces them on the YM2149 engine.
export class AyumiEngine implements SoundEngine, RegisterIo {
  private node: AyumiWorkletNode;
  private clock: number;
  private registerFile: RegisterFile;

  constructor(node: AyumiWorkletNode, clock: number = YM_CLOCK) {
    this.node = node;
    this.clock = clock;
    this.registerFile = new RegisterFile((pairs) => {
      if (pairs.length === 1) {
        this.post({ type: 'write', register: pairs[0][0], value: pairs[0][1] });
      } else {
        this.post({ type: 'writes', pairs });
      }
    }, AYUMI_REGISTER_COUNT);
  }

  static async create(audioContext: AudioContext, clock: number = YM_CLOCK): Promise<AyumiEngine> {
    await audioContext.audioWorklet.addModule(workletUrl);
    const node = new AudioWorkletNode(audioContext, 'ayumi-processor', {
      outputChannelCount: [2],
    });
    node.connect(audioContext.destination);
    const engine = new AyumiEngine(node, clock);
    engine.post({ type: 'clock', clock });
    return engine;
  }

  private post(message: AyumiWorkletMessage): void {
    this.node.port.postMessage(message);
  }

  setClock(clock: number): void {
    this.clock = clock;
    this.post({ type: 'clock', clock });
  }

  getClock(): number {
    return this.clock;
  }

  setChip(chip: string): void {
    this.post({ type: 'chip', chip });
  }

  setChannelPans(pans: number[]): void {
    this.post({ type: 'pans', pans: pans.slice(0, 3) });
  }

  readRegister(register: number): number {
    return this.registerFile.read(register);
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

  updateChannelWithInstrument(
    channel: number,
    instrument: Instrument,
    noteData?: { note: string; octave: number },
    envelopeTick: number = 0,
    volumeModifier?: number | null,
  ): void {
    updateChannelWithInstrument(
      this,
      this.clock,
      channel,
      instrument,
      noteData,
      envelopeTick,
      volumeModifier,
    );
  }

  silenceAll(): void {
    for (let channel = 0; channel < 3; channel++) {
      this.writeRegister(8 + channel, 0x00);
    }
  }

  reset(): void {
    this.registerFile.zero();
    this.post({ type: 'reset' });
  }

  getRegisters(): YMRegisters {
    return this.registerFile.snapshot();
  }

  getRegistersArray(): number[] {
    return this.registerFile.toArray();
  }

  getState(): YMState {
    return deriveYmState(this.registerFile.raw());
  }

  dispose(): void {
    this.node.port.close();
    this.node.disconnect();
  }
}

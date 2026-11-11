import { YM2149 } from './YM2149.ts';
import type { YMRegisters, YMState } from './YM2149.ts';
import { AyumiEngine } from './AyumiEngine.ts';
import type { Instrument } from './SoundDriver.ts';
import type { SoundEngineId } from '../constants/sound.ts';
import { DEFAULT_SOUND_ENGINE_ID } from '../constants/sound.ts';

export interface SoundEngine {
  writeRegister(register: number, value: number): void;
  beginBatch(): void;
  endBatch(): void;
  updateChannelWithInstrument(
    channel: number,
    instrument: Instrument,
    noteData?: { note: string; octave: number },
    envelopeTick?: number,
    volumeModifier?: number | null,
  ): void;
  silenceAll(): void;
  reset(): void;
  setClock(clock: number): void;
  getClock(): number;
  setChip(chip: string): void;
  setChannelPans(pans: number[]): void;
  getRegisters(): YMRegisters;
  getRegistersArray(): number[];
  getState(): YMState;
  dispose(): void;
}

export function createSoundEngine(
  id: SoundEngineId = DEFAULT_SOUND_ENGINE_ID,
  audioContext: AudioContext,
  clock: number,
): Promise<SoundEngine> {
  return id === 'ayumi'
    ? AyumiEngine.create(audioContext, clock)
    : Promise.resolve(new YM2149(audioContext, clock));
}

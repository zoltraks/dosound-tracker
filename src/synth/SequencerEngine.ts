import type { Instrument, Pattern, Song } from './SoundDriver';

export interface RegisterState {
  [register: number]: number;
}

export interface FrameState {
  registers: RegisterState;
  lineIndex: number;
  tick: number;
}

export interface SequencerOptions {
  ticksPerRow: number;
  patternLength: number;
  speed: number;
}

export class SequencerEngine {
  private instrumentsById: Map<string, Instrument>;
  private patterns: Pattern[];
  private options: SequencerOptions;

  constructor(song: Song, options: Partial<SequencerOptions> = {}) {
    this.instrumentsById = new Map(song.instruments.map((inst) => [inst.id, inst]));
    this.patterns = song.patterns;

    const baseSpeed = Number.isFinite(song.speed) && song.speed > 0 ? Math.floor(song.speed) : 6;
    const clampedSpeed = Math.max(2, baseSpeed);
    const evenSpeed = clampedSpeed & ~1;

    const fallbackPatternLength = song.patternLength || 64;

    this.options = {
      ticksPerRow: Math.max(1, evenSpeed | 0),
      patternLength: fallbackPatternLength,
      speed: evenSpeed,
      ...options,
    };
  }

  getOptions(): SequencerOptions {
    return this.options;
  }

  getPatterns(): Pattern[] {
    return this.patterns;
  }

  getInstrument(id: string): Instrument | undefined {
    return this.instrumentsById.get(id);
  }

  createEmptyRegisterState(): RegisterState {
    return {};
  }

  processFrame(
    lineIndex: number,
    tick: number,
    _patternIndex: number,
    currentRegisters: RegisterState
  ): FrameState {
    const registers: RegisterState = { ...currentRegisters };

    // Detailed note/envelope/register processing will be implemented later.
    // For now, this method simply returns a cloned register state with
    // the requested frame position so that callers can build on top of it.

    return {
      registers,
      lineIndex,
      tick,
    };
  }
}

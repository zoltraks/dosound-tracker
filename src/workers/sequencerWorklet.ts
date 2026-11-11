// AudioWorkletProcessor for sample-accurate sequencer timing. The
// processor counts rendered samples inside process() and posts a tick
// for every tickInterval boundary crossed - the clock lives on the
// audio render thread, so timer coalescing and main-thread jitter
// cannot move it. While the AudioContext is suspended process() never
// runs and no ticks flow: the position view can never advance while
// the context renders nothing.

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

export type SequencerWorkletIncomingMessage =
  | {
      type: 'start';
      data?: { pattern?: number; line?: number; tick?: number; patternLoop?: boolean };
    }
  | { type: 'update'; data?: { pattern: number; line: number; tick: number } }
  | {
      type: 'setParams';
      data?: {
        ticksPerRow?: number;
        patternLength?: number;
        tickInterval?: number;
        playlistLength?: number;
        loopIndex?: number;
        hasLoop?: boolean;
        patternLoop?: boolean;
      };
    }
  | { type: 'stop'; data?: unknown };

class SequencerProcessor extends AudioWorkletProcessor {
  private isPlaying = false;
  private isPatternLoop = false;
  private currentTick = 0;
  private currentLine = 0;
  private currentPattern = 0;
  private ticksPerRow = 3;
  private patternLength = 64;
  private tickInterval = 20; // 50Hz = 20ms
  private playlistLength = 0;
  private loopIndex = 0;
  private hasLoop = false;
  // Rendered-sample clock: nextTickSample is the sample index at which
  // the next tick is due. Counting samples keeps the cadence exact even
  // when tickInterval does not divide the render quantum evenly.
  private renderedSamples = 0;
  private nextTickSample = 0;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<SequencerWorkletIncomingMessage>) => {
      this.handleMessage(event.data);
    };
  }

  private samplesPerTick(): number {
    return (this.tickInterval / 1000) * sampleRate;
  }

  private postPosition(type: 'tick' | 'update' | 'stop'): void {
    this.port.postMessage({
      type,
      data: {
        isPlaying: this.isPlaying,
        currentPattern: this.currentPattern,
        currentLine: this.currentLine,
        currentTick: this.currentTick,
      },
    });
  }

  private scheduleTick(): void {
    if (!this.isPlaying) {
      return;
    }

    let nextTick = this.currentTick + 1;
    let nextLine = this.currentLine;
    let nextPattern = this.currentPattern;

    if (nextTick >= this.ticksPerRow) {
      nextTick = 0;
      nextLine++;

      if (nextLine >= this.patternLength) {
        nextLine = 0;
        // In song mode, advance to the next playlist position when the
        // pattern wraps. In pattern-loop mode, stay on the same playlist
        // position and just wrap rows.
        if (!this.isPatternLoop) {
          if (this.playlistLength > 0) {
            const lastIndex = this.playlistLength - 1;
            if (this.currentPattern >= lastIndex && this.hasLoop) {
              nextPattern = this.loopIndex;
            } else if (this.currentPattern < lastIndex) {
              nextPattern++;
            } else {
              // At last index but no loop defined - increment anyway
              // (will stop playback)
              nextPattern++;
            }
          } else {
            nextPattern++;
          }
        }
      }
    }

    this.currentTick = nextTick;
    this.currentLine = nextLine;
    this.currentPattern = nextPattern;

    // Emit the updated position so pattern wraps are sent immediately
    this.postPosition('tick');
  }

  private startSequencer(): void {
    this.isPlaying = true;
    this.nextTickSample = this.renderedSamples + this.samplesPerTick();

    // Emit the starting position immediately. Tick 0 carries the first
    // note's attack, so waiting a full interval before the first message
    // drops it and leaves the audible start one tick behind the
    // sequencer view.
    this.postPosition('tick');
  }

  private stopSequencer(): void {
    this.isPlaying = false;
    this.isPatternLoop = false;
    this.currentTick = 0;

    this.postPosition('stop');
  }

  private updatePosition(pattern: number, line: number, tick: number): void {
    this.currentPattern = pattern;
    this.currentLine = line;
    this.currentTick = tick;

    this.postPosition('update');
  }

  private setParams(params: {
    ticksPerRow?: number;
    patternLength?: number;
    tickInterval?: number;
    playlistLength?: number;
    loopIndex?: number;
    hasLoop?: boolean;
    patternLoop?: boolean;
  }): void {
    if (params.ticksPerRow !== undefined) {
      this.ticksPerRow = params.ticksPerRow;
    }
    if (params.patternLength !== undefined) {
      this.patternLength = params.patternLength;
    }
    if (params.tickInterval !== undefined) {
      this.tickInterval = params.tickInterval;
      // Reschedule the next tick two full new intervals ahead when
      // currently playing - the worker's timer reschedule landed the
      // next tick the same distance out. We must NOT restart the clock
      // through stop/start messages because the stop message would flip
      // isPlaying to false on the main thread, and the "safeIsPlaying"
      // guard would then suppress all subsequent tick messages.
      if (this.isPlaying) {
        this.nextTickSample = this.renderedSamples + 2 * this.samplesPerTick();
      }
    }
    if (params.playlistLength !== undefined) {
      this.playlistLength = params.playlistLength;
    }
    if (params.loopIndex !== undefined) {
      this.loopIndex = params.loopIndex;
    }
    if (params.hasLoop !== undefined) {
      this.hasLoop = params.hasLoop;
    }
    if (params.patternLoop !== undefined) {
      this.isPatternLoop = params.patternLoop;
    }
  }

  private handleMessage(message: SequencerWorkletIncomingMessage): void {
    const { type, data } = message;

    switch (type) {
      case 'start':
        if (data) {
          const { pattern, line, tick, patternLoop } = data;
          this.currentPattern = pattern ?? 0;
          this.currentLine = line ?? 0;
          this.currentTick = tick ?? 0;
          this.isPatternLoop = !!patternLoop;
        }
        this.startSequencer();
        break;

      case 'stop':
        this.stopSequencer();
        break;

      case 'update':
        if (data) {
          this.updatePosition(data.pattern, data.line, data.tick);
        }
        break;

      case 'setParams':
        if (data) {
          this.setParams(data);
        }
        break;
    }
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const channel = outputs[0]?.[0];
    if (channel) {
      // The node is a clock, not a source - it emits silence and exists
      // in the render graph only so process() is pulled each quantum.
      channel.fill(0);
    }
    const frames = channel?.length ?? 128;
    this.renderedSamples += frames;

    // Catch up on every tick whose sample boundary passed inside this
    // render quantum - the same backlog semantics the worker's
    // `while (now >= nextTickTime)` loop provided.
    while (this.isPlaying && this.nextTickSample <= this.renderedSamples) {
      this.scheduleTick();
      this.nextTickSample += this.samplesPerTick();
    }

    return true;
  }
}

registerProcessor('sequencer-processor', SequencerProcessor);

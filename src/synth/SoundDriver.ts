import { YM2149 } from './YM2149';
import { optimizeEvents } from './EventOptimizer';

export const DOSOUND_REGISTER_WRITE = 0xFF;
export const DOSOUND_END_MARKER = 0x00;
export const VBLANK_RATE = 50; // Hz
export const MIN_DELAY_CYCLES = 2; // Minimum delay in DOSOUND mode

export interface SoundEvent {
  type: 'register' | 'delay';
  register?: number;
  value?: number;
  delay?: number;
}

export interface Instrument {
  id: string;
  name: string;
  volume: number[];
  shift: number[];
  pitch: number[];
  noise: number[];
  mode: number[];
  /** Optional base key used for keyboard preview and pitch calculations. */
  base?: string;
  /** Optional default octave for this instrument. */
  octave?: number;
  // Optional sustain position in the envelope (0-based index). When set,
  // envelope progression should halt at this step until a key release
  // (note-off) occurs, after which the envelopes continue.
  sustain?: number | null;
  /** Optional per-instrument display color in 3-digit hex form (e.g. "#abc"). */
  color?: string | null;
  midi?: {
    channel?: number | null;
    program?: number | null;
  };
}

export interface Note {
  note: string;
  octave: number;
  instrument: string;
}

export interface Step {
  note: Note | null;
  // Optional per-line volume modifier (0-15) used by the tracker "volume column".
  // When undefined, the track keeps the previous modifier (default is 0xF = no attenuation).
  volume?: number | null;
}

export interface Pattern {
  id: string;
  name: string;
  step: Step[];
}

export interface Line {
  A: string;
  B: string;
  C: string;
}

export interface Song {
  title: string;
  author: string;
  year: number;
  speed: number;
  length: number;
  loop?: number | null;
  chip?: string;
  frame?: number;
  clock?: number;
  pattern: Pattern[];
  line: Line[];
  instrument: Instrument[];
}

export class SoundDriver {
  private ym2149: YM2149;
  private isPlaying: boolean = false;
  private currentDelay: number = 0;
  private eventIndex: number = 0;
  private events: SoundEvent[] = [];
  private playbackSpeed: number = 6;

  constructor(ym2149: YM2149) {
    this.ym2149 = ym2149;
  }

  setPlaybackSpeed(speed: number): void {
    const raw = Number.isFinite(speed) && speed > 0 ? Math.floor(speed) : MIN_DELAY_CYCLES;
    const clamped = Math.max(MIN_DELAY_CYCLES, raw);
    this.playbackSpeed = clamped % 2 === 0 ? clamped : clamped + 1;
  }

  convertSongToSoundEvents(song: Song): SoundEvent[] {
    const events: SoundEvent[] = [];
    
    for (let lineIndex = 0; lineIndex < song.line.length; lineIndex++) {
      const playlistEntry = song.line[lineIndex];
      // Process each track
      const tracks = [
        { patternId: playlistEntry.A, channel: 0 },
        { patternId: playlistEntry.B, channel: 1 },
        { patternId: playlistEntry.C, channel: 2 }
      ];

      for (const track of tracks) {
        if (track.patternId !== '--') {
          const pattern = song.pattern.find(p => p.id === track.patternId);
          if (pattern) {
            this.processPattern(pattern, track.channel, events);
          }
        }
      }

      // Add delay between lines
      events.push({
        type: 'delay',
        delay: this.playbackSpeed
      });
    }

    // End of song - silence all channels
    events.push({ type: 'register', register: 0x08, value: 0x00 }); // Channel A volume
    events.push({ type: 'register', register: 0x09, value: 0x00 }); // Channel B volume
    events.push({ type: 'register', register: 0x0A, value: 0x00 }); // Channel C volume
    events.push({ type: 'delay', delay: DOSOUND_END_MARKER });

    return optimizeEvents<SoundEvent>(events);
  }

  private processPattern(pattern: Pattern, channel: number, events: SoundEvent[]): void {
    const steps = pattern.step ?? [];
    const toneFineRegister = channel * 2;
    const toneCoarseRegister = channel * 2 + 1;
    const volumeRegister = 0x08 + channel;

    for (const step of steps) {
      if (!step) {
        events.push({ type: 'delay', delay: this.playbackSpeed });
        continue;
      }

      const volumeValue = this.clampVolume(step.volume);
      const note = step.note;

      if (note && note.note && note.note !== '===') {
        const period = this.getNotePeriod(note.note, note.octave);
        if (period > 0) {
          events.push({ type: 'register', register: toneFineRegister, value: period & 0xff });
          events.push({ type: 'register', register: toneCoarseRegister, value: (period >> 8) & 0x0f });
        }
        events.push({ type: 'register', register: volumeRegister, value: volumeValue });
      } else {
        events.push({ type: 'register', register: volumeRegister, value: 0x00 });
      }

      events.push({ type: 'delay', delay: this.playbackSpeed });
    }
  }

  private clampVolume(volume: number | null | undefined): number {
    if (typeof volume !== 'number' || !Number.isFinite(volume)) {
      return 0x0f;
    }
    return Math.max(0, Math.min(0x0f, Math.floor(volume)));
  }

  private getNotePeriod(noteName: string, octave: number): number {
    const normalized = noteName.trim().toUpperCase();
    const cleaned = normalized.replace(/[^A-G#]/g, '');
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const index = noteOrder.indexOf(cleaned);
    if (index === -1) {
      return 0;
    }

    const semitoneFromC0 = (Math.max(0, Math.min(9, Number.isFinite(octave) ? Math.floor(octave) : 0)) * 12) + index;
    const a4Index = 4 * 12 + noteOrder.indexOf('A');
    const semitoneFromA4 = semitoneFromC0 - a4Index;
    const frequency = 440 * Math.pow(2, semitoneFromA4 / 12);

    const clock = this.ym2149.getClock();
    const divider = Math.max(1, Math.round(clock / (16 * frequency)));
    return Math.min(0x0fff, divider);
  }

  playEvents(events: SoundEvent[]): void {
    this.events = events;
    this.eventIndex = 0;
    this.currentDelay = 0;
    this.isPlaying = true;
    this.processEvents();
  }

  private processEvents(): void {
    if (!this.isPlaying || this.eventIndex >= this.events.length) {
      this.isPlaying = false;
      return;
    }

    const event = this.events[this.eventIndex];

    if (event.type === 'register' && event.register !== undefined && event.value !== undefined) {
      this.ym2149.writeRegister(event.register, event.value);
      this.eventIndex++;
      this.processEvents(); // Process next event immediately
    } else if (event.type === 'delay' && event.delay !== undefined) {
      if (event.delay === DOSOUND_END_MARKER) {
        this.isPlaying = false;
        return;
      }
      
      this.currentDelay = event.delay;
      const delayMs = (this.currentDelay * 1000) / VBLANK_RATE;
      
      setTimeout(() => {
        this.eventIndex++;
        this.processEvents();
      }, delayMs);
    }
  }

  stop(): void {
    this.isPlaying = false;
    // Silence all channels
    this.ym2149.writeRegister(0x08, 0x00);
    this.ym2149.writeRegister(0x09, 0x00);
    this.ym2149.writeRegister(0x0A, 0x00);
  }

  exportToAssembly(events: SoundEvent[]): string {
    let assembly = 'music:\n\n';
    let lineCount = 0;
    
    for (const event of events) {
      if (event.type === 'register' && event.register !== undefined && event.value !== undefined) {
        assembly += `    dc.b $${event.register.toString(16).padStart(2, '0')},$${event.value.toString(16).padStart(2, '0')}`;
        
        // Add comment for common registers
        const registerNames = ['TA', 'TB', 'TC', 'NA', 'NB', 'NC', 'NF', 'MX', 'VA', 'VB', 'VC'];
        if (event.register < registerNames.length) {
          assembly += `       ; ${registerNames[event.register]}`;
        }
        assembly += '\n';
      } else if (event.type === 'delay' && event.delay !== undefined) {
        assembly += `    dc.b $ff,${event.delay}       ; DL ${event.delay * 2}\n`;
      }
      
      lineCount++;
      if (lineCount % 8 === 0) {
        assembly += '\n';
      }
    }
    
    return assembly;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

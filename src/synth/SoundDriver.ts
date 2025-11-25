import { YM2149 } from './YM2149';
import { NOTE_FREQUENCIES, NOTE_BASE_OCTAVE } from '../constants/music';

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
  volumeEnvelope: number[];
  arpeggioEnvelope: number[];
  pitchEnvelope: number[];
  noiseEnvelope: number[];
  modeEnvelope: number[];
  base?: string;
  octave?: number;
  // Optional sustain position in the envelope (0-based index). When set,
  // envelope progression should halt at this step until a key release
  // (note-off) occurs, after which the envelopes continue.
  sustain?: number | null;
}

export interface Note {
  note: string;
  octave: number;
  instrument: string;
}

export interface PatternLine {
  trackA: Note | null;
  trackB: Note | null;
  trackC: Note | null;
  // Optional per-line volume modifier (0-15) used by the tracker "volume column".
  // When undefined, the track keeps the previous modifier (default is 0xF = no attenuation).
  volume?: number | null;
}

export interface Pattern {
  id: string;
  name: string;
  lines: PatternLine[];
}

export interface Song {
  title: string;
  author: string;
  year: number;
  speed: number;
  patternLength: number;
  loop?: number | null;
  patterns: Pattern[];
  playlist: { trackA: string; trackB: string; trackC: string }[];
  instruments: Instrument[];
}

export class SoundDriver {
  private ym2149: YM2149;
  private isPlaying: boolean = false;
  private currentDelay: number = 0;
  private eventIndex: number = 0;
  private events: SoundEvent[] = [];
  private playbackSpeed: number = 6;
  private dosoundMode: boolean = true;

  constructor(ym2149: YM2149) {
    this.ym2149 = ym2149;
  }

  setDosoundMode(enabled: boolean): void {
    this.dosoundMode = enabled;
  }

  setPlaybackSpeed(speed: number): void {
    if (this.dosoundMode && speed % 2 !== 0) {
      // In DOSOUND mode, only even values are allowed
      this.playbackSpeed = speed + 1;
    } else {
      this.playbackSpeed = Math.max(MIN_DELAY_CYCLES, speed);
    }
  }

  convertSongToSoundEvents(song: Song): SoundEvent[] {
    const events: SoundEvent[] = [];
    
    for (let lineIndex = 0; lineIndex < song.playlist.length; lineIndex++) {
      const playlistEntry = song.playlist[lineIndex];
      
      // Check for GOTO command
      if (playlistEntry.trackA.startsWith('^^') || 
          playlistEntry.trackB.startsWith('^^') || 
          playlistEntry.trackC.startsWith('^^')) {
        break; // End playback on GOTO
      }

      // Process each track
      const tracks = [
        { patternId: playlistEntry.trackA, channel: 0 },
        { patternId: playlistEntry.trackB, channel: 1 },
        { patternId: playlistEntry.trackC, channel: 2 }
      ];

      for (const track of tracks) {
        if (track.patternId !== '--') {
          const pattern = song.patterns.find(p => p.id === track.patternId);
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

    return this.optimizeEvents(events);
  }

  private processPattern(pattern: Pattern, channel: number, events: SoundEvent[]): void {
    for (let lineIndex = 0; lineIndex < pattern.lines.length; lineIndex++) {
      const line = pattern.lines[lineIndex];
      let note: Note | null = null;

      switch (channel) {
        case 0: note = line.trackA; break;
        case 1: note = line.trackB; break;
        case 2: note = line.trackC; break;
      }

      if (note) {
        this.processNote(note, channel, events);
      }
    }
  }

  private processNote(note: Note, channel: number, events: SoundEvent[]): void {
    // Find instrument
    const instrument = this.findInstrument(note.instrument);
    if (!instrument) return;

    // Calculate note frequency
    const frequency = this.calculateNoteFrequency(note.note, note.octave);
    const period = this.frequencyToPeriod(frequency);

    // Channel registers
    const fineReg = channel * 2;
    const coarseReg = channel * 2 + 1;
    const volumeReg = 0x08 + channel;

    // Set tone period
    events.push({ type: 'register', register: fineReg, value: period & 0xFF });
    events.push({ type: 'register', register: coarseReg, value: (period >> 8) & 0x0F });

    // Set mixer (enable tone, disable noise for simplicity)
    const mixerValue = this.calculateMixerValue(channel, instrument);
    events.push({ type: 'register', register: 0x07, value: mixerValue });

    // Set volume (start with first envelope value)
    const initialVolume = instrument.volumeEnvelope[0] || 0;
    events.push({ type: 'register', register: volumeReg, value: initialVolume & 0x0F });
  }

  private findInstrument(instrumentId: string): Instrument | null {
    // This would be passed from the song context
    // For now, return a default instrument
    return {
      id: instrumentId,
      name: 'Default',
      volumeEnvelope: [0x0F, 0x0E, 0x0D, 0x0C],
      arpeggioEnvelope: [0, 0, 0, 0],
      pitchEnvelope: [0, 0, 0, 0],
      noiseEnvelope: [0, 0, 0, 0],
      modeEnvelope: Array(32).fill(0),
      sustain: null
    };
  }

  private calculateNoteFrequency(note: string, octave: number): number {
    const baseFreq = NOTE_FREQUENCIES[note] || 440.00;
    return baseFreq * Math.pow(2, octave - NOTE_BASE_OCTAVE);
  }

  private frequencyToPeriod(frequency: number): number {
    if (frequency <= 0) return 0;
    return Math.floor(2000000 / (16 * frequency));
  }

  private calculateMixerValue(channel: number, instrument: Instrument): number {
    // Default mixer: enable tone for all channels, disable noise
    let mixer = 0x38; // 00111000 - noise enabled for all channels, tone disabled

    const modeValue = (instrument.modeEnvelope && instrument.modeEnvelope.length > 0)
      ? instrument.modeEnvelope[0] || 0
      : 0;

    const toneActive = modeValue === 0 || modeValue === 2;
    const noiseActive = modeValue === 1 || modeValue === 2;

    if (toneActive) {
      mixer &= ~(1 << channel); // Enable tone for this channel
    }

    if (!noiseActive) {
      mixer |= (0x08 << channel); // Disable noise for this channel
    }

    return mixer;
  }

  private optimizeEvents(events: SoundEvent[]): SoundEvent[] {
    const optimized: SoundEvent[] = [];
    let lastRegisterValues: { [key: number]: number } = {};
    
    for (const event of events) {
      if (event.type === 'register' && event.register !== undefined && event.value !== undefined) {
        // Only add register write if value changed
        if (lastRegisterValues[event.register] !== event.value) {
          optimized.push(event);
          lastRegisterValues[event.register] = event.value;
        }
      } else if (event.type === 'delay') {
        optimized.push(event);
        // Clear register history on delay to allow re-sending same values
        lastRegisterValues = {};
      }
    }
    
    return optimized;
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

import type { Song, Instrument } from '../synth/SoundDriver';
import { SoundDriver } from '../synth/SoundDriver';
import { NOTE_FREQUENCIES, NOTES } from '../constants/music';

/**
 * Converts a song to DOSOUND XBIOS assembly format
 * @param song The song to export
 * @returns Assembly formatted string
 */
export function exportToAssembly(song: Song): string {
  const driver = new SoundDriver(null as any); // We only need the conversion logic
  const events = driver.convertSongToSoundEvents(song);
  
  let assembly = '';
  let currentLine = 0;
  let currentPart = 0;
  
  // Add header
  assembly += `; DOSOUND XBIOS Assembly Export\n`;
  assembly += `; Title: ${song.title}\n`;
  assembly += `; Author: ${song.author}\n`;
  assembly += `; Year: ${song.year}\n`;
  assembly += `; Speed: ${song.speed}\n\n`;
  assembly += `music:\n\n`;
  
  // Process events and add section comments
  let eventIndex = 0;
  while (eventIndex < events.length) {
    // Add line comment every 16 events (approximately)
    if (eventIndex % 16 === 0) {
      assembly += `    ; === LINE ${currentLine.toString(16).toUpperCase().padStart(2, '0')} ===\n\n`;
      currentLine++;
    }
    
    // Add part comment every 8 events
    if (eventIndex % 8 === 0) {
      assembly += `    ; --- PART ${currentPart.toString(16).toUpperCase().padStart(2, '0')} ---\n`;
      currentPart++;
    }
    
    const event = events[eventIndex];
    
    if (event.type === 'register' && event.register !== undefined && event.value !== undefined) {
      // Format register write as dc.b $XX,$YY
      assembly += `    dc.b $${event.register.toString(16).toUpperCase().padStart(2, '0')},$${event.value.toString(16).toUpperCase().padStart(2, '0')}`;
      
      // Add comment for common registers
      const registerComment = getRegisterComment(event.register, event.value);
      if (registerComment) {
        assembly += `       ; ${registerComment}`;
      }
      assembly += '\n';
      
    } else if (event.type === 'delay' && event.delay !== undefined) {
      // Format delay as dc.b $FF, <delay>
      if (event.delay === 0) {
        assembly += `    dc.b $ff,$00       ; END MARKER\n`;
      } else {
        assembly += `    dc.b $ff,${event.delay}       ; DL ${event.delay + 1}\n`;
      }
    }
    
    eventIndex++;
  }
  
  return assembly;
}

// Helper: hex formatting using short form for nibbles when possible
function toHex(value: number, forceByte: boolean = false): string {
  const v = value & 0xFF;
  if (!forceByte && v < 0x10) {
    return v.toString(16).toUpperCase();
  }
  return v.toString(16).toUpperCase().padStart(2, '0');
}

// Helper: format one dc.b line with TAB indent and aligned comment
function formatAsmLine(bytes: number[], comment: string): string {
  const code = '\t' + 'dc.b ' + bytes.map((b) => `$${toHex(b)}`).join(',');
  const targetCol = 20;
  const padLength = Math.max(1, targetCol - code.length);
  return code + ' '.repeat(padLength) + '; ' + comment + '\n';
}

// Helper: format DOSOUND delay in frames (20ms units)
function formatDelayLine(frames: number): string {
  const f = Math.max(1, frames); // at least 1 frame (DL 2 logically handled by caller)
  const n = f - 1;
  return formatAsmLine([0xff, n], `DL ${f}`);
}

// Parse base key string like "C-4" or "C#4" into note/octave
function parseBaseKeyForExport(rawBase?: string): { note: string; octave: number } {
  const fallback = 'C-4';
  const value = (rawBase || fallback).trim().toUpperCase();
  if (!value) {
    return { note: 'C', octave: 4 };
  }

  let notePart = value.charAt(0);
  let rest = value.slice(1);

  if (rest.startsWith('#')) {
    notePart += '#';
    rest = rest.slice(1);
  }

  if (rest.startsWith('-')) {
    rest = rest.slice(1);
  }

  const octave = parseInt(rest, 10);
  if (!Number.isFinite(octave)) {
    return { note: 'C', octave: 4 };
  }

  return { note: notePart, octave };
}

function formatNoteLabel(baseNote: string, baseOctave: number, semitoneOffset: number): string {
  const idx = NOTES.indexOf(baseNote);
  if (idx === -1) {
    // Fallback: just use base values
    return baseNote.includes('#') ? `${baseNote}${baseOctave}` : `${baseNote}-${baseOctave}`;
  }

  const total = idx + semitoneOffset;
  const n = NOTES.length;

  let octave = baseOctave;
  let noteIndex = idx;

  if (total >= 0) {
    octave += Math.floor(total / n);
    noteIndex = total % n;
  } else {
    const stepsDown = -total;
    const octaveDelta = Math.floor((stepsDown + n - 1) / n);
    octave -= octaveDelta;
    const mod = ((idx + semitoneOffset) % n + n) % n;
    noteIndex = mod;
  }

  const note = NOTES[noteIndex];
  return note.includes('#') ? `${note}${octave}` : `${note}-${octave}`;
}

function frequencyToPeriod(frequency: number): number {
  if (frequency <= 0) return 0;
  return Math.floor(2000000 / (16 * frequency));
}

function calculateMixerForInstrument(channel: number, instrument: Instrument): number {
  // Default mixer: enable tone for all channels, disable noise
  let mixer = 0x38; // 00111000 - noise enabled for all channels, tone disabled

  const modeValue =
    instrument.modeEnvelope && instrument.modeEnvelope.length > 0
      ? instrument.modeEnvelope[0] || 0
      : 0;

  const toneActive = modeValue === 0 || modeValue === 2;
  const noiseActive = modeValue === 1 || modeValue === 2;

  if (toneActive) {
    mixer &= ~(1 << channel); // Enable tone for this channel
  }

  if (!noiseActive) {
    mixer |= 0x08 << channel; // Disable noise for this channel
  }

  return mixer & 0xFF;
}

/**
 * Export a single instrument to DOSOUND-format assembly using its base note,
 * volume envelope and arpeggio envelope. Tone (TA) follows arpeggio over time.
 * Output follows strict formatting rules.
 */
export function exportInstrumentToAssembly(instrument: Instrument): string {
  const base = parseBaseKeyForExport(instrument.base || 'C-4');

  // Base frequency for the instrument's root note
  const baseFreq = NOTE_FREQUENCIES[base.note] || 440.0;
  const baseFrequency = baseFreq * Math.pow(2, base.octave - 4);

  const volumeEnv =
    instrument.volumeEnvelope && instrument.volumeEnvelope.length
      ? instrument.volumeEnvelope
      : [0x0f, 0x0e, 0x0c, 0x08, 0x04, 0x00];

  const arpeggioEnv = instrument.arpeggioEnvelope || [];

  const clampVol = (v: number) => Math.max(0, Math.min(0x0f, v | 0));
  const vols = volumeEnv.map(clampVol);

  // Number of envelope steps to consider (40ms per step)
  const stepsCount = Math.max(vols.length, arpeggioEnv.length || 1);

  type StepState = { volume: number; period: number; semitone: number };
  const states: StepState[] = [];

  for (let i = 0; i < stepsCount; i++) {
    const vol = i < vols.length ? vols[i] : vols[vols.length - 1] ?? 0;

    // Apply arpeggio in semitones on top of baseFrequency
    let frequency = baseFrequency;
    let semitone = 0;
    if (arpeggioEnv && arpeggioEnv.length > 0) {
      const idx = Math.min(i, arpeggioEnv.length - 1);
      const arpVal = typeof arpeggioEnv[idx] === 'number' ? (arpeggioEnv[idx] as number) : 0;
      semitone = arpVal | 0;
      if (semitone !== 0) {
        frequency = frequency * Math.pow(2, semitone / 12);
      }
    }

    const period = frequencyToPeriod(frequency);
    states.push({ volume: vol, period, semitone });
  }

  // Group consecutive identical states into segments
  interface Segment {
    volume: number;
    period: number;
    semitone: number; // arpeggio offset in semitones
    length: number;   // number of 40ms steps in this segment
  }

  const segments: Segment[] = [];
  if (states.length === 0) {
    // Fallback: single silent step
    segments.push({ volume: 0, period: frequencyToPeriod(baseFrequency), semitone: 0, length: 1 });
  } else {
    let current = states[0];
    let runLength = 1;
    for (let i = 1; i < states.length; i++) {
      const s = states[i];
      if (s.volume === current.volume && s.period === current.period) {
        runLength++;
      } else {
        segments.push({ volume: current.volume, period: current.period, semitone: current.semitone, length: runLength });
        current = s;
        runLength = 1;
      }
    }
    segments.push({ volume: current.volume, period: current.period, semitone: current.semitone, length: runLength });
  }

  const first = segments[0];

  const getCoarseFine = (p: number) => {
    const period = p & 0x0fff;
    return {
      coarse: (period >> 8) & 0x0f,
      fine: period & 0xff,
    };
  };

  // Initial mixer and noise setup for channel A
  const mixerValue = calculateMixerForInstrument(0, instrument);
  const noiseValue =
    instrument.noiseEnvelope && instrument.noiseEnvelope.length > 0
      ? Math.max(0, Math.min(0x1f, instrument.noiseEnvelope[0] | 0))
      : 0x00;

  let asm = '';

  // Header and START marker
  asm += 'music:\n\n';
  asm += '\t; START\n\n';

  // Mixer (MX ...)
  const mixerComment = getRegisterComment(0x07, mixerValue) || 'MX';
  asm += formatAsmLine([0x07, mixerValue], mixerComment);
  asm += '\n';

  // Initial volumes: set all channels, with A using first segment's volume
  const initialVol = first.volume ?? 0;
  asm += formatAsmLine([0x08, initialVol], 'VA');
  asm += formatAsmLine([0x09, 0x0], 'VB');
  asm += formatAsmLine([0x0A, 0x0], 'VC');
  asm += '\n';

  // Initial tone period for channel A
  const firstCF = getCoarseFine(first.period);
  const firstLabel = formatNoteLabel(base.note, base.octave, first.semitone || 0);
  asm += formatAsmLine([0x01, firstCF.coarse, 0x00, firstCF.fine], `TA ${firstLabel}`);

  // Optional noise register if any noise envelope is used
  if (noiseValue !== 0) {
    asm += formatAsmLine([0x06, noiseValue], 'NS');
  }

  const framesFor = (stepCount: number) => Math.max(1, stepCount) * 2; // 40ms -> 2 frames

  // Emit delay for the first segment
  asm += formatDelayLine(framesFor(first.length));

  // Subsequent segments: change VA/TA as needed, then delay
  let prevVolume = first.volume;
  let prevPeriod = first.period;

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.volume !== prevVolume) {
      asm += formatAsmLine([0x08, seg.volume], 'VA');
      prevVolume = seg.volume;
    }

    if (seg.period !== prevPeriod) {
      const cf = getCoarseFine(seg.period);
      const label = formatNoteLabel(base.note, base.octave, seg.semitone || 0);
      asm += formatAsmLine([0x01, cf.coarse, 0x00, cf.fine], `TA ${label}`);
      prevPeriod = seg.period;
    }

    asm += formatDelayLine(framesFor(seg.length));
  }

  // END block: silence channels and STOP marker
  asm += '\n';
  asm += '\t; END\n\n';
  asm += formatAsmLine([0x08, 0x0], 'VA');
  asm += formatAsmLine([0x09, 0x0], 'VB');
  asm += formatAsmLine([0x0A, 0x0], 'VC');
  asm += '\n';
  asm += formatAsmLine([0xff, 0x00], 'STOP');

  return asm;
}

/**
 * Gets a descriptive comment for common register writes
 */
function getRegisterComment(register: number, value: number): string {
  switch (register) {
    case 0x07: // Mixer
      const getChannelMode = (channel: 0 | 1 | 2): 'T' | 'N' => {
        const toneDisabledMask = 1 << channel;
        const noiseDisabledMask = 0x08 << channel;
        const toneEnabled = (value & toneDisabledMask) === 0;
        const noiseEnabled = (value & noiseDisabledMask) === 0;

        if (toneEnabled && !noiseEnabled) return 'T';
        if (noiseEnabled && !toneEnabled) return 'N';
        if (toneEnabled && noiseEnabled) return 'T';
        return 'N';
      };

      const a = getChannelMode(0);
      const b = getChannelMode(1);
      const c = getChannelMode(2);
      return `MX ${a}+${b}+${c}`;
      
    case 0x08: // Volume A
      return `VA ${value.toString(16).toUpperCase()}`;
    case 0x09: // Volume B  
      return `VB ${value.toString(16).toUpperCase()}`;
    case 0x0A: // Volume C
      return `VC ${value.toString(16).toUpperCase()}`;
      
    case 0x00: // Tone A fine
    case 0x01: // Tone A coarse
    case 0x02: // Tone B fine
    case 0x03: // Tone B coarse
    case 0x04: // Tone C fine
    case 0x05: // Tone C coarse
      // These are handled together in the actual export
      return '';
      
    case 0x06: // Noise period
      return `NP ${value.toString(16).toUpperCase()}`;
      
    default:
      return '';
  }
}

/**
 * Downloads the assembly content as a .s file
 */
export function downloadAssemblyFile(content: string, filename: string = 'music.s'): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
}

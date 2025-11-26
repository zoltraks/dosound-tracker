import type { Song, Instrument } from '../synth/SoundDriver';
import { NOTE_FREQUENCIES, NOTES, NOTE_BASE_OCTAVE, PATTERN_LENGTH } from '../constants/music';
import { VBLANK_RATE } from '../synth/SoundDriver';
import { YM_CLOCK, YM_LOG_VOLUME_TABLE } from '../synth/YM2149';

/**
 * Converts a song to DOSOUND XBIOS assembly format
 * @param song The song to export
 * @param isComplexDumpMode Whether to use complex dump mode (includes detailed comments and optimization)
 * @returns Assembly formatted string
 */
export function exportToAssembly(song: Song, isComplexDumpMode: boolean = false): string {
  // Simulate playback and collect register states per frame
  interface RegisterState {
    [register: number]: number;
  }
  
  interface FrameState {
    registers: RegisterState;
    lineIndex: number;
    tick: number;
  }
  
  const frames: FrameState[] = [];
  const ticksPerRow = song.speed || 6;
  
  // Initialize register state
  let currentRegs: RegisterState = {
    0x07: 0x38, // Mixer: all tones enabled, noise disabled
    0x08: 0x00, // Volume A
    0x09: 0x00, // Volume B
    0x0A: 0x00, // Volume C
  };
  
  // Track active notes and envelope positions per channel
  interface ChannelState {
    note: { note: string; octave: number; instrument: string } | null;
    envelopeStep: number;
    subTick: number;
    isNewNote: boolean; // Flag to ensure tone registers are written on first frame
    volumeModifier: number; // Per-channel volume modifier nibble (0-15)
    sustainIndex: number | null; // Optional sustain position for the current note
    released: boolean; // Whether a key-release has occurred for a sustained note
  }
  
  const channels: ChannelState[] = [
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f, sustainIndex: null, released: false },
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f, sustainIndex: null, released: false },
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f, sustainIndex: null, released: false },
  ];
  
  // Process each playlist entry
  for (let playlistIdx = 0; playlistIdx < song.playlist.length; playlistIdx++) {
    const playlistEntry = song.playlist[playlistIdx];
    
    // Check for GOTO command
    if (playlistEntry.trackA.startsWith('^^') || 
        playlistEntry.trackB.startsWith('^^') || 
        playlistEntry.trackC.startsWith('^^')) {
      break;
    }
    
    // Get patterns for each track
    const patterns = [
      song.patterns.find(p => p.id === playlistEntry.trackA),
      song.patterns.find(p => p.id === playlistEntry.trackB),
      song.patterns.find(p => p.id === playlistEntry.trackC),
    ];
    
    // Process each line in the pattern
    const lineCount = song.patternLength || 64;
    
    for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      // Get notes for this line
      const notes = [
        patterns[0]?.lines[lineIdx]?.trackA || null,
        patterns[1]?.lines[lineIdx]?.trackA || null,
        patterns[2]?.lines[lineIdx]?.trackA || null,
      ];
      // Per-line volume modifiers (shared pattern trackA volume)
      const volumes = [
        patterns[0]?.lines[lineIdx]?.volume,
        patterns[1]?.lines[lineIdx]?.volume,
        patterns[2]?.lines[lineIdx]?.volume,
      ];
      
      // Process each tick in this row
      for (let tick = 0; tick < ticksPerRow; tick++) {
        const newRegs: RegisterState = { ...currentRegs };
        
        // Process each channel
        for (let ch = 0; ch < 3; ch++) {
          const pattern = patterns[ch];
          const noteOnRow = notes[ch];
          const channelState = channels[ch];
          const volumeOnRow = volumes[ch];
          
          // On first tick of row, check for new note or note-off
          if (tick === 0) {
            if (!pattern) {
              channelState.note = null;
              channelState.envelopeStep = 0;
              channelState.subTick = 0;
              channelState.isNewNote = false;
              channelState.sustainIndex = null;
              channelState.released = false;
              newRegs[0x08 + ch] = 0x00;
              continue;
            }
            
            if (noteOnRow && noteOnRow.note === '===') {
              const sustainIndex = channelState.sustainIndex;

              if (
                sustainIndex === null ||
                sustainIndex === undefined ||
                sustainIndex < 0 ||
                !channelState.note
              ) {
                // No sustain defined (or no active note) - treat as hard mute
                channelState.note = null;
                channelState.envelopeStep = 0;
                channelState.subTick = 0;
                channelState.isNewNote = false;
                channelState.sustainIndex = null;
                channelState.released = false;
                newRegs[0x08 + ch] = 0x00;
                continue;
              }

              // Instrument has a sustain point and a note is active: this
              // note-off acts as a release trigger instead of an immediate
              // mute. Keep holding the last note and allow the envelope to
              // continue past the sustain position.
              channelState.released = true;
            } else if (noteOnRow && noteOnRow.note) {
              const isNew = !channelState.note ||
                channelState.note.note !== noteOnRow.note ||
                channelState.note.octave !== noteOnRow.octave ||
                channelState.note.instrument !== noteOnRow.instrument;

              if (isNew) {
                channelState.note = noteOnRow;
                channelState.envelopeStep = 0;
                channelState.subTick = 0;
                channelState.isNewNote = true; // Mark as new note to ensure tone registers are written

                const instrument = song.instruments.find(i => i.id === noteOnRow.instrument);
                const rawSustain = instrument ? (instrument as any).sustain : null;
                if (typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0) {
                  channelState.sustainIndex = Math.floor(rawSustain);
                } else {
                  channelState.sustainIndex = null;
                }
                channelState.released = false;
              } else {
                channelState.isNewNote = false;
              }
            } else {
              channelState.isNewNote = false;
            }

            // Update per-channel volume modifier when explicitly present on this row.
            if (volumeOnRow !== undefined && volumeOnRow !== null) {
              const clamped = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
              channelState.volumeModifier = clamped;
            }
          }
          
          // Update channel with current envelope step
          if (channelState.note) {
            const instrument = song.instruments.find(i => i.id === channelState.note!.instrument);
            if (instrument) {
              const rawStep = channelState.envelopeStep;
              const sustainIndex = channelState.sustainIndex;
              const isReleased = channelState.released;

              let step = rawStep;
              if (
                sustainIndex !== null &&
                sustainIndex !== undefined &&
                sustainIndex >= 0 &&
                !isReleased &&
                rawStep >= sustainIndex
              ) {
                step = sustainIndex;
              }

              applyInstrumentToRegisters(
                newRegs,
                ch,
                channelState.note,
                instrument,
                step,
                channelState.isNewNote,
                channelState.volumeModifier
              );
            }
          }
          
          // Advance envelope timing (every 2 frames = 40ms)
          if (channelState.note) {
            const sub = (channelState.subTick + 1) % 2;
            channelState.subTick = sub;
            if (sub === 0) {
              const rawStep = channelState.envelopeStep;
              const sustainIndex = channelState.sustainIndex;
              const isReleased = channelState.released;

              if (
                sustainIndex === null ||
                sustainIndex === undefined ||
                sustainIndex < 0 ||
                isReleased ||
                rawStep < sustainIndex
              ) {
                channelState.envelopeStep = rawStep + 1;
              }
            }
          }
        }
        
        // Store this frame only when envelope steps advance (every 40ms like instrument export)
        if (tick === 0 || (tick % 2 === 0)) {
          frames.push({
            registers: newRegs,
            lineIndex: playlistIdx * lineCount + lineIdx,
            tick: tick
          });
        }
        
        currentRegs = newRegs;
      }
    }
  }
  
  // Now convert frames to optimized assembly output
  return formatFramesToAssembly(frames, song, isComplexDumpMode);
}

function applyInstrumentToRegisters(
  regs: { [register: number]: number },
  channel: number,
  note: { note: string; octave: number },
  instrument: Instrument,
  envelopeStep: number,
  isNewNote: boolean,
  volumeModifier?: number | null
): void {
  const step = Math.max(0, envelopeStep);
  
  // Get envelope values
  const volumeEnv = instrument.volumeEnvelope || [0x0F];
  const arpeggioEnv = instrument.arpeggioEnvelope || [0];
  const pitchEnv = instrument.pitchEnvelope || [0];
  const modeEnv = instrument.modeEnvelope || [0];
  const noiseEnv = instrument.noiseEnvelope || [0];
  
  const volIdx = Math.min(step, volumeEnv.length - 1);
  const arpIdx = Math.min(step, arpeggioEnv.length - 1);
  const pitchIdx = Math.min(step, pitchEnv.length - 1);
  const modeIdx = Math.min(step, modeEnv.length - 1);
  const noiseIdx = Math.min(step, noiseEnv.length - 1);
  
  let volume = Math.max(0, Math.min(0x0F, volumeEnv[volIdx] || 0));
  const arpeggio = arpeggioEnv[arpIdx] || 0;
  const pitch = (pitchEnv[pitchIdx] || 0) | 0;
  const mode = modeEnv[modeIdx] || 0;
  const noisePeriod = Math.max(0, Math.min(0x1F, noiseEnv[noiseIdx] || 0));
  
  // Apply optional per-step volume modifier (0-15) as attenuation, 15 = no attenuation.
  if (volumeModifier !== undefined && volumeModifier !== null) {
    const mod = Math.max(0, Math.min(0x0f, volumeModifier | 0));
    volume = Math.floor((volume * mod) / 15);
  }

  // Set volume
  regs[0x08 + channel] = volume;
  
  // Calculate frequency with arpeggio (NOTE_FREQUENCIES are defined for NOTE_BASE_OCTAVE)
  const baseFreq = NOTE_FREQUENCIES[note.note] || 440.0;
  let frequency = baseFreq * Math.pow(2, note.octave - NOTE_BASE_OCTAVE);
  if (arpeggio !== 0) {
    frequency = frequency * Math.pow(2, arpeggio / 12);
  }
  let period = Math.floor(YM_CLOCK / (16 * frequency)) & 0x0FFF;
  if (pitch !== 0) {
    // Apply pitch envelope as a direct delta on the divider value.
    period = (period - pitch) & 0x0FFF;
  }
  
  // Update mixer based on mode
  const toneActive = mode === 0 || mode === 2;
  const noiseActive = mode === 1 || mode === 2;
  
  let mixer = regs[0x07] || 0x38;
  if (toneActive) {
    mixer &= ~(1 << channel);
  } else {
    mixer |= (1 << channel);
  }
  if (noiseActive) {
    mixer &= ~(0x08 << channel);
  } else {
    mixer |= (0x08 << channel);
  }
  regs[0x07] = mixer;
  
  // Set tone period if active (always set for new notes, even if not tone-active in current step)
  if (toneActive || isNewNote) {
    regs[channel * 2] = period & 0xFF;
    regs[channel * 2 + 1] = (period >> 8) & 0x0F;
  }
  
  // Set noise period if active
  if (noiseActive && noisePeriod > 0) {
    regs[0x06] = noisePeriod;
  }
}

function formatFramesToAssembly(frames: any[], song: Song, isComplexDumpMode: boolean = false): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // song parameter will be used for future optimization logic and pattern markers
  let asm = 'music:\n\n\t; START\n\n';
  
  if (frames.length === 0) {
    asm += '\t; END\n\n';
    asm += formatAsmLine([0x08, 0x00], 'VA 0');
    asm += formatAsmLine([0x09, 0x00], 'VB 0');
    asm += formatAsmLine([0x0A, 0x00], 'VC 0');
    asm += '\n';
    asm += formatAsmLine([0xff, 0x00], 'STOP');
    return asm;
  }
  
  if (isComplexDumpMode) {
    // Optimized dump for complex mode - track changes and skip unchanged registers
    let lastRegs: { [register: number]: number } = {};
    let lastLineIndex = -1;
    let frameCount = 0;
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const regs = frame.registers;
      const lineIndex = frame.lineIndex;
      
      // Add beat marker after each completed playlist position (every patternLength lines)
      if (lineIndex !== lastLineIndex && lineIndex > 0 && lineIndex % (song.patternLength || 64) === 0) {
        asm += '\n\t; ---\n\n';
      }
      lastLineIndex = lineIndex;
      
      // Write mixer register if changed (or first frame)
      if (i === 0 || (regs[0x07] || 0x38) !== (lastRegs[0x07] || 0x38)) {
        asm += formatAsmLine([0x07, regs[0x07] || 0x38], getRegisterComment(0x07, regs[0x07] || 0x38));
        lastRegs[0x07] = regs[0x07] || 0x38;
      }
      
      // Write tone registers for all three channels if changed
      for (let ch = 0; ch < 3; ch++) {
        const fineReg = ch * 2;
        const coarseReg = ch * 2 + 1;
        const fine = regs[fineReg] || 0;
        const coarse = regs[coarseReg] || 0;
        const lastFine = lastRegs[fineReg] || 0;
        const lastCoarse = lastRegs[coarseReg] || 0;
        
        if (i === 0 || fine !== lastFine || coarse !== lastCoarse) {
          const period = (coarse << 8) | fine;
          const { label: noteLabel, pitchDelta } = periodToNoteAndPitch(period);
          const channelLabel = String.fromCharCode(65 + ch); // A, B, C
          const pitchText = pitchDelta ? ` ${pitchDelta > 0 ? '+' : ''}${pitchDelta}` : '';
          const comment = noteLabel ? `T${channelLabel} ${noteLabel}${pitchText}` : `T${channelLabel}`;
          asm += formatAsmLine([coarseReg, coarse, fineReg, fine], comment);
          lastRegs[fineReg] = fine;
          lastRegs[coarseReg] = coarse;
        }
      }
      
      // Write volume registers if changed
      for (let ch = 0; ch < 3; ch++) {
        const reg = 0x08 + ch;
        if (i === 0 || (regs[reg] || 0x00) !== (lastRegs[reg] || 0x00)) {
          const channelLabel = String.fromCharCode(65 + ch); // A, B, C
          const value = regs[reg] || 0x00;
          asm += formatAsmLine([reg, value], `V${channelLabel} ${value}`);
          lastRegs[reg] = value;
        }
      }
      
      // Write noise register if changed
      if (i === 0 || (regs[0x06] || 0x00) !== (lastRegs[0x06] || 0x00)) {
        const value = regs[0x06] || 0x00;
        asm += formatAsmLine([0x06, value], `NS ${value}`);
        lastRegs[0x06] = value;
      }
      
      // Always add delay of 2 frames to maintain resolution
      asm += formatAsmLine([0xff, 0x01], 'DL 2');
      frameCount++;
    }
    
  } else {
    // Unoptimized dump - write all registers every frame
    let lastLineIndex = -1;
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const regs = frame.registers;
      const lineIndex = frame.lineIndex;
      
      // Add beat marker after each completed playlist position (every patternLength lines)
      if (lineIndex !== lastLineIndex && lineIndex > 0 && lineIndex % (song.patternLength || 64) === 0) {
        asm += '\n\t; ---\n\n';
      }
      lastLineIndex = lineIndex;
      
      // Write mixer register
      asm += formatAsmLine([0x07, regs[0x07] || 0x38], getRegisterComment(0x07, regs[0x07] || 0x38));
      
      // Write tone registers for all three channels
      for (let ch = 0; ch < 3; ch++) {
        const fineReg = ch * 2;
        const coarseReg = ch * 2 + 1;
        const fine = regs[fineReg] || 0;
        const coarse = regs[coarseReg] || 0;
        
        const period = (coarse << 8) | fine;
        const { label: noteLabel, pitchDelta } = periodToNoteAndPitch(period);
        const channelLabel = String.fromCharCode(65 + ch); // A, B, C
        const pitchText = pitchDelta ? ` ${pitchDelta > 0 ? '+' : ''}${pitchDelta}` : '';
        const comment = noteLabel ? `T${channelLabel} ${noteLabel}${pitchText}` : `T${channelLabel}`;
        asm += formatAsmLine([coarseReg, coarse, fineReg, fine], comment);
      }
      
      // Write volume registers for all three channels
      asm += formatAsmLine([0x08, regs[0x08] || 0x00], `VA ${regs[0x08] || 0x00}`);
      asm += formatAsmLine([0x09, regs[0x09] || 0x00], `VB ${regs[0x09] || 0x00}`);
      asm += formatAsmLine([0x0A, regs[0x0A] || 0x00], `VC ${regs[0x0A] || 0x00}`);
      
      // Write noise register
      asm += formatAsmLine([0x06, regs[0x06] || 0x00], `NS ${regs[0x06] || 0x00}`);
      
      // Add delay of 2 frames after each register set
      asm += formatAsmLine([0xff, 0x01], 'DL 2');
    }
  }
  
  // END marker
  asm += '\n\t; END\n\n';
  asm += formatAsmLine([0x08, 0x00], 'VA 0');
  asm += formatAsmLine([0x09, 0x00], 'VB 0');
  asm += formatAsmLine([0x0A, 0x00], 'VC 0');
  asm += '\n';
  asm += formatAsmLine([0xff, 0x00], 'STOP');
  
  return asm;
}

function periodToNoteAndPitch(period: number): { label: string; pitchDelta: number } {
  if (period === 0) {
    return { label: '', pitchDelta: 0 };
  }

  const targetFrequency = YM_CLOCK / (16 * period);

  let bestLabel = '';
  let bestPitchDelta = 0;
  let minDiff = Infinity;

  for (const noteName of Object.keys(NOTE_FREQUENCIES)) {
    for (let octave = 0; octave <= 8; octave++) {
      const freq = NOTE_FREQUENCIES[noteName] * Math.pow(2, octave - NOTE_BASE_OCTAVE);
      const diff = Math.abs(freq - targetFrequency);
      if (diff < minDiff) {
        minDiff = diff;
        const idealPeriod = Math.floor(YM_CLOCK / (16 * freq));
        bestPitchDelta = idealPeriod - period;
        bestLabel = noteName.includes('#') ? `${noteName}${octave}` : `${noteName}-${octave}`;
      }
    }
  }

  return { label: bestLabel, pitchDelta: bestPitchDelta };
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
// DOSOUND bug: $ff,N delays N+1 frames, so $ff,1 = 2 frames delay
function formatDelayLine(frames: number): string {
  // Minimum delay is 2 frames (40ms) - can't delay just 1 frame
  const f = Math.max(2, frames);
  const n = f - 1; // DOSOUND delay value: N = frames - 1
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
  return Math.floor(YM_CLOCK / (16 * frequency));
}

/**
 * Export a single instrument to DOSOUND-format assembly using its base note,
 * volume envelope and arpeggio envelope. Tone (TA) follows arpeggio over time.
 * Output follows strict formatting rules.
 */
export function exportInstrumentToAssembly(instrument: Instrument, song?: Song): string {
  const base = parseBaseKeyForExport(instrument.base || 'C-4');

  // Base frequency for the instrument's root note
  const baseFreq = NOTE_FREQUENCIES[base.note] || 440.0;
  const baseFrequency = baseFreq * Math.pow(2, base.octave - 4);

  const volumeEnv =
    instrument.volumeEnvelope && instrument.volumeEnvelope.length
      ? instrument.volumeEnvelope
      : [0x0f, 0x0e, 0x0c, 0x08, 0x04, 0x00];

  const arpeggioEnv = instrument.arpeggioEnvelope || [];
  const pitchEnv = instrument.pitchEnvelope || [];
  const modeEnv = instrument.modeEnvelope || [];
  const noiseEnv = instrument.noiseEnvelope || [];

  const clampVol = (v: number) => Math.max(0, Math.min(0x0f, v | 0));
  const vols = volumeEnv.map(clampVol);

  // Number of envelope steps to consider (40ms per step)
  const stepsCount = Math.max(
    vols.length,
    arpeggioEnv.length || 1,
    pitchEnv.length || 1,
    modeEnv.length || 1,
    noiseEnv.length || 1
  );

  // Optionally cap the number of steps based on the current song's
  // speed (ticks per row) and pattern length so the dump matches the
  // duration of one pattern in the sequencer.
  let maxSteps = stepsCount;
  if (song) {
    const rawSpeed = Number(song.speed);
    const baseSpeed = Number.isFinite(rawSpeed) && rawSpeed > 0 ? Math.floor(rawSpeed) : 6;
    const clampedSpeed = Math.max(2, baseSpeed);
    const evenSpeed = clampedSpeed & ~1; // enforce even speed (2,4,6,...)

    const rawLength = Number((song as any).patternLength);
    const patternLength = Number.isFinite(rawLength) && rawLength > 0
      ? Math.floor(rawLength)
      : PATTERN_LENGTH;

    // Envelopes advance every 40ms, i.e. every 2 ticks. With a speed
    // of S ticks per row this yields S/2 envelope steps per row.
    const stepsPerRow = Math.max(1, Math.floor(evenSpeed / 2));
    const maxBySong = patternLength * stepsPerRow;
    maxSteps = Math.min(stepsCount, maxBySong);
  }

  const totalSteps = Math.max(1, maxSteps);

  type StepState = { 
    volume: number; 
    period: number; 
    semitone: number;   // arpeggio semitone offset from base
    pitchDelta: number; // pitch envelope delta applied to divider
    mode: number;       // 0=tone, 1=noise, 2=tone+noise
    noisePeriod: number;
  };
  const states: StepState[] = [];

  for (let i = 0; i < totalSteps; i++) {
    const vol = i < vols.length ? vols[i] : vols[vols.length - 1] ?? 0;

    // Get mode for this step
    const modeIdx = modeEnv.length > 0 ? Math.min(i, modeEnv.length - 1) : 0;
    const mode = modeEnv.length > 0 ? (modeEnv[modeIdx] || 0) : 0;

    // Get noise period for this step
    const noiseIdx = noiseEnv.length > 0 ? Math.min(i, noiseEnv.length - 1) : 0;
    const noisePeriod = noiseEnv.length > 0 ? Math.max(0, Math.min(0x1f, noiseEnv[noiseIdx] | 0)) : 0;

    // Get pitch delta for this step (applied directly to divider value)
    let pitchDelta = 0;
    if (pitchEnv && pitchEnv.length > 0) {
      const pIdx = Math.min(i, pitchEnv.length - 1);
      const pVal = pitchEnv[pIdx];
      if (typeof pVal === 'number') {
        pitchDelta = pVal | 0;
      }
    }

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
    // Base divider from frequency
    let period = frequencyToPeriod(frequency) & 0x0fff;
    // Apply pitch delta directly on divider (positive = decrease divider)
    if (pitchDelta !== 0) {
      period = (period - pitchDelta) & 0x0fff;
    }

    states.push({ volume: vol, period, semitone, pitchDelta, mode, noisePeriod });
  }

  const getCoarseFine = (p: number) => {
    const period = p & 0x0fff;
    return {
      coarse: (period >> 8) & 0x0f,
      fine: period & 0xff,
    };
  };

  const getMixerForMode = (mode: number, channel: number = 0): number => {
    // Start with default: all tones enabled, all noise disabled (0x38 = 00111000)
    let mixer = 0x38;
    
    const toneActive = mode === 0 || mode === 2;
    const noiseActive = mode === 1 || mode === 2;

    // Modify only the specified channel
    if (!toneActive) {
      mixer |= (1 << channel); // Disable tone for this channel
    }
    if (noiseActive) {
      mixer &= ~(0x08 << channel); // Enable noise for this channel
    }

    return mixer & 0xFF;
  };

  let asm = '';

  // Header and START marker
  asm += 'music:\n\n';
  asm += '\t; START\n\n';

  if (states.length === 0) {
    // Fallback: empty instrument
    asm += formatAsmLine([0x07, 0x38], 'MX T+T+T');
    asm += '\n';
    asm += formatAsmLine([0x08, 0x0], 'VA 0');
    asm += formatAsmLine([0x09, 0x0], 'VB 0');
    asm += formatAsmLine([0x0A, 0x0], 'VC 0');
    asm += '\n';
    asm += formatDelayLine(2);
    asm += '\n';
    asm += '\t; END\n\n';
    asm += formatAsmLine([0x08, 0x0], 'VA 0');
    asm += formatAsmLine([0x09, 0x0], 'VB 0');
    asm += formatAsmLine([0x0A, 0x0], 'VC 0');
    asm += '\n';
    asm += formatAsmLine([0xff, 0x00], 'STOP');
    return asm;
  }

  const first = states[0];

  // Initial mixer based on first mode
  const initialMixer = getMixerForMode(first.mode, 0);
  const mixerComment = getRegisterComment(0x07, initialMixer) || 'MX';
  asm += formatAsmLine([0x07, initialMixer], mixerComment);

  // Initial volumes
  asm += formatAsmLine([0x08, first.volume], `VA ${first.volume}`);
  asm += formatAsmLine([0x09, 0x0], 'VB 0');
  asm += formatAsmLine([0x0A, 0x0], 'VC 0');

  // Initial tone period (only if tone is active)
  const firstToneActive = first.mode === 0 || first.mode === 2;
  if (firstToneActive) {
    const firstCF = getCoarseFine(first.period);
    const firstLabel = formatNoteLabel(base.note, base.octave, first.semitone || 0);
    const pitchText = first.pitchDelta ? ` ${first.pitchDelta > 0 ? '+' : ''}${first.pitchDelta}` : '';
    asm += formatAsmLine(
      [0x01, firstCF.coarse, 0x00, firstCF.fine],
      `TA ${firstLabel}${pitchText}`
    );
  }

  // Initial noise period (only if noise is active)
  const firstNoiseActive = first.mode === 1 || first.mode === 2;
  if (firstNoiseActive && first.noisePeriod > 0) {
    asm += formatAsmLine([0x06, first.noisePeriod], `NS ${first.noisePeriod}`);
  }

  // Emit delay for the first step (40ms = 2 frames)
  asm += formatDelayLine(2);

  // Subsequent steps: track changes
  let prevVolume = first.volume;
  let prevPeriod = first.period;
  let prevMode = first.mode;
  let prevNoisePeriod = first.noisePeriod;

  for (let i = 1; i < states.length; i++) {
    const step = states[i];
    const toneActive = step.mode === 0 || step.mode === 2;
    const noiseActive = step.mode === 1 || step.mode === 2;

    // Check if mode changed
    if (step.mode !== prevMode) {
      const newMixer = getMixerForMode(step.mode, 0);
      const comment = getRegisterComment(0x07, newMixer) || 'MX';
      asm += formatAsmLine([0x07, newMixer], comment);
      prevMode = step.mode;
    }

    // Update noise period if mode includes noise
    if (noiseActive && step.noisePeriod !== prevNoisePeriod) {
      asm += formatAsmLine([0x06, step.noisePeriod], `NS ${step.noisePeriod}`);
      prevNoisePeriod = step.noisePeriod;
    }

    // Update volume if changed
    if (step.volume !== prevVolume) {
      asm += formatAsmLine([0x08, step.volume], `VA ${step.volume}`);
      prevVolume = step.volume;
    }

    // Update tone period if mode includes tone AND period changed
    if (toneActive && step.period !== prevPeriod) {
      const cf = getCoarseFine(step.period);
      const label = formatNoteLabel(base.note, base.octave, step.semitone || 0);
      const pitchText = step.pitchDelta ? ` ${step.pitchDelta > 0 ? '+' : ''}${step.pitchDelta}` : '';
      asm += formatAsmLine(
        [0x01, cf.coarse, 0x00, cf.fine],
        `TA ${label}${pitchText}`
      );
      prevPeriod = step.period;
    }

    // Emit delay (40ms = 2 frames)
    asm += formatDelayLine(2);
  }

  // END block: silence channels and STOP marker
  asm += '\n';
  asm += '\t; END\n\n';
  asm += formatAsmLine([0x08, 0x0], 'VA 0');
  asm += formatAsmLine([0x09, 0x0], 'VB 0');
  asm += formatAsmLine([0x0A, 0x0], 'VC 0');
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
      return 'VA';
    case 0x09: // Volume B  
      return 'VB';
    case 0x0A: // Volume C
      return 'VC';
      
    case 0x00: // Tone A fine
    case 0x01: // Tone A coarse
    case 0x02: // Tone B fine
    case 0x03: // Tone B coarse
    case 0x04: // Tone C fine
    case 0x05: // Tone C coarse
      // These are handled together in the actual export
      return '';
      
    case 0x06: // Noise period
      return 'NS';
      
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

const WAV_SAMPLE_RATE = 44100;

interface YmNoiseState {
  lfsr: number;
  phase: number;
}

export interface WavExportResult {
  buffer: ArrayBuffer;
  sampleRate: number;
  totalSamples: number;
  durationSeconds: number;
}

function encodePcm16Wav(samples: number[], sampleRate: number): ArrayBuffer {
  const dataLength = samples.length;
  const buffer = new ArrayBuffer(44 + dataLength * 2);
  const view = new DataView(buffer);

  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + dataLength * 2, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  const byteRate = sampleRate * 2;
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataLength * 2, true);

  let offset = 44;
  for (let i = 0; i < dataLength; i++) {
    let s = samples[i];
    if (s > 1) s = 1;
    if (s < -1) s = -1;
    const v = s < 0 ? s * 32768 : s * 32767;
    view.setInt16(offset, v | 0, true);
    offset += 2;
  }

  return buffer;
}

function synthTickSamples(
  outSamples: number[],
  regs: { [register: number]: number },
  phases: number[],
  samplesPerTick: number,
  noiseState: YmNoiseState
): void {
  const mixer = regs[0x07] !== undefined ? regs[0x07] : 0x38;

  const periods = [0, 0, 0];
  const freqs = [0, 0, 0];
  const volumes = [0, 0, 0];
  const toneEnabled = [false, false, false];
  const noiseEnabled = [false, false, false];

  const rawNoisePeriod = regs[0x06] !== undefined ? regs[0x06] : 0;
  const effectiveNoisePeriod = (rawNoisePeriod & 0x1f) === 0 ? 1 : (rawNoisePeriod & 0x1f);
  const noiseFrequency = YM_CLOCK / (16 * effectiveNoisePeriod);
  const noiseStep = noiseFrequency / WAV_SAMPLE_RATE;

  for (let ch = 0; ch < 3; ch++) {
    const fineReg = ch * 2;
    const coarseReg = ch * 2 + 1;
    const fine = regs[fineReg] !== undefined ? regs[fineReg] : 0;
    const coarse = regs[coarseReg] !== undefined ? regs[coarseReg] : 0;
    const period = ((coarse & 0x0f) << 8) | (fine & 0xff);
    periods[ch] = period;
    if (period > 0) {
      freqs[ch] = YM_CLOCK / (16 * period);
    } else {
      freqs[ch] = 0;
    }
    const vol = regs[0x08 + ch] !== undefined ? regs[0x08 + ch] : 0;
    volumes[ch] = vol & 0x0f;
    toneEnabled[ch] = (mixer & (1 << ch)) === 0;
    noiseEnabled[ch] = (mixer & (0x08 << ch)) === 0;
  }

  for (let i = 0; i < samplesPerTick; i++) {
    // Advance shared noise LFSR according to YM clock and noise period
    noiseState.phase += noiseStep;
    if (noiseState.phase >= 1) {
      const advances = Math.floor(noiseState.phase);
      noiseState.phase -= advances;
      for (let a = 0; a < advances; a++) {
        const bit0 = noiseState.lfsr & 1;
        const bit3 = (noiseState.lfsr >> 3) & 1;
        const newBit = bit0 ^ bit3;
        noiseState.lfsr = ((noiseState.lfsr >> 1) | (newBit << 16)) & 0x1ffff;
      }
    }

    const noiseSample = (noiseState.lfsr & 1) ? 1 : -1;

    let mixed = 0;

    for (let ch = 0; ch < 3; ch++) {
      const vol = volumes[ch];
      if (vol <= 0) {
        continue;
      }

      const levelIndex = Math.max(0, Math.min(15, vol | 0));
      const baseLevel = YM_LOG_VOLUME_TABLE[levelIndex];
      let chValue = 0;

      if (toneEnabled[ch] && freqs[ch] > 0) {
        const inc = freqs[ch] / WAV_SAMPLE_RATE;
        let phase = phases[ch] + inc;
        if (phase >= 1) {
          phase -= Math.floor(phase);
        }
        phases[ch] = phase;
        const toneSample = phase < 0.5 ? 1 : -1;
        chValue += toneSample * baseLevel * 0.3;
      }

      if (noiseEnabled[ch]) {
        chValue += noiseSample * baseLevel * 0.4;
      }

      mixed += chValue;
    }

    let value = mixed;
    if (value > 1) value = 1;
    if (value < -1) value = -1;
    outSamples.push(value);
  }
}

export function exportSongRegisterDump(song: Song): { content: string; cycleCount: number } {
  const baseSpeed = song.speed || 6;
  const ticksPerRow = Math.max(1, Math.floor(baseSpeed / 2));
  const lineCount = song.patternLength || 64;

  type RegisterState = { [register: number]: number };

  let regs: RegisterState = {
    0x07: 0x38,
    0x08: 0x00,
    0x09: 0x00,
    0x0a: 0x00
  };

  interface DumpChannelState {
    note: { note: string; octave: number; instrument: string } | null;
    envelopeStep: number;
    subTick: number;
    isNewNote: boolean;
    volumeModifier: number;
    sustainIndex: number | null;
    released: boolean;
  }

  const channels: DumpChannelState[] = [
    {
      note: null,
      envelopeStep: 0,
      subTick: 0,
      isNewNote: false,
      volumeModifier: 0x0f,
      sustainIndex: null,
      released: false
    },
    {
      note: null,
      envelopeStep: 0,
      subTick: 0,
      isNewNote: false,
      volumeModifier: 0x0f,
      sustainIndex: null,
      released: false
    },
    {
      note: null,
      envelopeStep: 0,
      subTick: 0,
      isNewNote: false,
      volumeModifier: 0x0f,
      sustainIndex: null,
      released: false
    }
  ];

  const lines: string[] = [];
  let cycleCount = 0;

  lines.push('music:');

  for (let playlistIdx = 0; playlistIdx < song.playlist.length; playlistIdx++) {
    const playlistEntry = song.playlist[playlistIdx];

    if (
      playlistEntry.trackA.startsWith('^^') ||
      playlistEntry.trackB.startsWith('^^') ||
      playlistEntry.trackC.startsWith('^^')
    ) {
      break;
    }

    const patterns = [
      song.patterns.find(p => p.id === playlistEntry.trackA),
      song.patterns.find(p => p.id === playlistEntry.trackB),
      song.patterns.find(p => p.id === playlistEntry.trackC)
    ];

    for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      const notes = [
        patterns[0]?.lines[lineIdx]?.trackA || null,
        patterns[1]?.lines[lineIdx]?.trackA || null,
        patterns[2]?.lines[lineIdx]?.trackA || null
      ];

      const volumes = [
        patterns[0]?.lines[lineIdx]?.volume,
        patterns[1]?.lines[lineIdx]?.volume,
        patterns[2]?.lines[lineIdx]?.volume
      ];

      for (let tick = 0; tick < ticksPerRow; tick++) {
        const newRegs: RegisterState = { ...regs };

        for (let ch = 0; ch < 3; ch++) {
          const pattern = patterns[ch];
          const noteOnRow = notes[ch];
          const channelState = channels[ch];
          const volumeOnRow = volumes[ch];

          if (tick === 0) {
            if (!pattern) {
              channelState.note = null;
              channelState.envelopeStep = 0;
              channelState.subTick = 0;
              channelState.isNewNote = false;
              channelState.sustainIndex = null;
              channelState.released = false;
              newRegs[0x08 + ch] = 0x00;
              continue;
            }

            if (noteOnRow && noteOnRow.note === '===') {
              const sustainIndex = channelState.sustainIndex;

              if (
                sustainIndex === null ||
                sustainIndex === undefined ||
                sustainIndex < 0 ||
                !channelState.note
              ) {
                // No sustain defined (or no active note) - treat as hard mute
                channelState.note = null;
                channelState.envelopeStep = 0;
                channelState.subTick = 0;
                channelState.isNewNote = false;
                channelState.sustainIndex = null;
                channelState.released = false;
                newRegs[0x08 + ch] = 0x00;
                continue;
              }

              // Instrument has a sustain point and a note is active: this
              // note-off acts as a release trigger instead of an immediate
              // mute. Keep holding the last note and allow the envelope to
              // continue past the sustain position.
              channelState.released = true;
            } else if (noteOnRow && noteOnRow.note) {
              // Explicit note on this row: always treat as a new note and
              // retrigger the envelopes, matching the live sequencer.
              channelState.note = noteOnRow;
              channelState.envelopeStep = 0;
              channelState.subTick = 0;
              channelState.isNewNote = true;

              const instrument = song.instruments.find(i => i.id === noteOnRow.instrument);
              const rawSustain = instrument ? (instrument as any).sustain : null;
              if (typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0) {
                channelState.sustainIndex = Math.floor(rawSustain);
              } else {
                channelState.sustainIndex = null;
              }
              channelState.released = false;
            } else {
              channelState.isNewNote = false;
            }

            if (volumeOnRow !== undefined && volumeOnRow !== null) {
              const clamped = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
              channelState.volumeModifier = clamped;
            }
          }

          if (channelState.note) {
            const instrument = song.instruments.find(i => i.id === channelState.note!.instrument);
            if (instrument) {
              const rawStep = channelState.envelopeStep;
              const sustainIndex = channelState.sustainIndex;
              const isReleased = channelState.released;

              let step = rawStep;
              if (
                sustainIndex !== null &&
                sustainIndex !== undefined &&
                sustainIndex >= 0 &&
                !isReleased &&
                rawStep >= sustainIndex
              ) {
                step = sustainIndex;
              }

              applyInstrumentToRegisters(
                newRegs,
                ch,
                { note: channelState.note.note, octave: channelState.note.octave },
                instrument,
                step,
                channelState.isNewNote,
                channelState.volumeModifier
              );
            }
          }

          if (channelState.note) {
            const sub = (channelState.subTick + 1) % 2;
            channelState.subTick = sub;
            if (sub === 0) {
              const rawStep = channelState.envelopeStep;
              const sustainIndex = channelState.sustainIndex;
              const isReleased = channelState.released;

              if (
                sustainIndex === null ||
                sustainIndex === undefined ||
                sustainIndex < 0 ||
                isReleased ||
                rawStep < sustainIndex
              ) {
                channelState.envelopeStep = rawStep + 1;
              }
            }
          }
        }

        regs = newRegs;

        const taFine = regs[0x00] ?? 0;
        const taCoarse = regs[0x01] ?? 0;
        const tbFine = regs[0x02] ?? 0;
        const tbCoarse = regs[0x03] ?? 0;
        const tcFine = regs[0x04] ?? 0;
        const tcCoarse = regs[0x05] ?? 0;
        const ns = regs[0x06] ?? 0;
        const mx = regs[0x07] ?? 0x38;
        const va = regs[0x08] ?? 0;
        const vb = regs[0x09] ?? 0;
        const vc = regs[0x0a] ?? 0;

        const bytes = [
          taFine,
          taCoarse,
          tbFine,
          tbCoarse,
          tcFine,
          tcCoarse,
          ns,
          mx,
          va,
          vb,
          vc
        ];

        const line = '\t' + 'dc.b ' + bytes.map(b => `$${toHex(b, true)}`).join(',');
        lines.push(line);
        cycleCount++;
      }
    }
  }

  const content = lines.join('\n') + (lines.length ? '\n' : '');
  return { content, cycleCount };
}

export function exportSongToWav(song: Song): WavExportResult {
  const ticksPerRow = song.speed || 6;
  const lineCount = song.patternLength || 64;
  const samples: number[] = [];
  let regs: { [register: number]: number } = {
    0x07: 0x38,
    0x08: 0x00,
    0x09: 0x00,
    0x0a: 0x00
  };

  interface ChannelState {
    note: { note: string; octave: number; instrument: string } | null;
    envelopeStep: number;
    subTick: number;
    isNewNote: boolean;
    volumeModifier: number;
  }

  const channels: ChannelState[] = [
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f },
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f },
    { note: null, envelopeStep: 0, subTick: 0, isNewNote: false, volumeModifier: 0x0f }
  ];

  const phases = [0, 0, 0];
  const noiseState: YmNoiseState = {
    lfsr: 0x1ffff,
    phase: 0
  };
  const samplesPerTick = Math.max(1, Math.round(WAV_SAMPLE_RATE / VBLANK_RATE));

  for (let playlistIdx = 0; playlistIdx < song.playlist.length; playlistIdx++) {
    const playlistEntry = song.playlist[playlistIdx];

    if (
      playlistEntry.trackA.startsWith('^^') ||
      playlistEntry.trackB.startsWith('^^') ||
      playlistEntry.trackC.startsWith('^^')
    ) {
      break;
    }

    const patterns = [
      song.patterns.find(p => p.id === playlistEntry.trackA),
      song.patterns.find(p => p.id === playlistEntry.trackB),
      song.patterns.find(p => p.id === playlistEntry.trackC)
    ];

    for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      const notes = [
        patterns[0]?.lines[lineIdx]?.trackA || null,
        patterns[1]?.lines[lineIdx]?.trackA || null,
        patterns[2]?.lines[lineIdx]?.trackA || null
      ];

      const volumes = [
        patterns[0]?.lines[lineIdx]?.volume,
        patterns[1]?.lines[lineIdx]?.volume,
        patterns[2]?.lines[lineIdx]?.volume
      ];

      for (let tick = 0; tick < ticksPerRow; tick++) {
        const newRegs: { [register: number]: number } = { ...regs };

        for (let ch = 0; ch < 3; ch++) {
          const pattern = patterns[ch];
          const noteOnRow = notes[ch];
          const channelState = channels[ch];
          const volumeOnRow = volumes[ch];

          if (tick === 0) {
            if (!pattern) {
              channelState.note = null;
              channelState.envelopeStep = 0;
              channelState.subTick = 0;
              channelState.isNewNote = false;
              newRegs[0x08 + ch] = 0x00;
              continue;
            }

            if (noteOnRow && noteOnRow.note === '===') {
              channelState.note = null;
              channelState.envelopeStep = 0;
              channelState.subTick = 0;
              channelState.isNewNote = false;
              newRegs[0x08 + ch] = 0x00;
              continue;
            }

            if (noteOnRow && noteOnRow.note) {
              // Explicit note on this row: always treat as a new note and
              // retrigger the envelopes, matching the live sequencer.
              channelState.note = noteOnRow;
              channelState.envelopeStep = 0;
              channelState.subTick = 0;
              channelState.isNewNote = true;
            } else {
              channelState.isNewNote = false;
            }

            if (volumeOnRow !== undefined && volumeOnRow !== null) {
              const clamped = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
              channelState.volumeModifier = clamped;
            }
          }

          if (channelState.note) {
            const instrument = song.instruments.find(i => i.id === channelState.note!.instrument);
            if (instrument) {
              applyInstrumentToRegisters(
                newRegs,
                ch,
                channelState.note,
                instrument,
                channelState.envelopeStep,
                channelState.isNewNote,
                channelState.volumeModifier
              );
            }
          }

          if (channelState.note) {
            const sub = (channelState.subTick + 1) % 2;
            channelState.subTick = sub;
            if (sub === 0) {
              channelState.envelopeStep++;
            }
          }
        }

        synthTickSamples(samples, newRegs, phases, samplesPerTick, noiseState);
        regs = newRegs;
      }
    }
  }

  const totalSamples = samples.length;
  const buffer = encodePcm16Wav(samples, WAV_SAMPLE_RATE);
  const durationSeconds = totalSamples > 0 ? totalSamples / WAV_SAMPLE_RATE : 0;

  return {
    buffer,
    sampleRate: WAV_SAMPLE_RATE,
    totalSamples,
    durationSeconds
  };
}

export function downloadWavFile(buffer: ArrayBuffer, filename: string = 'music.wav'): void {
  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

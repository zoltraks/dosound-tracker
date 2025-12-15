import type { Song, Instrument, Pattern, Step } from '../synth/SoundDriver';
import { NOTE_FREQUENCIES, NOTES, NOTE_BASE_OCTAVE, PATTERN_LENGTH } from '../constants/music';
import { VBLANK_RATE } from '../synth/SoundDriver';
import { YM_CLOCK, YM_LOG_VOLUME_TABLE } from '../synth/YM2149';
import type { ExportStrategy } from '../constants/export';
import {
  simulateSong,
  type SimulationFrame,
} from '../utils/playbackSimulation';

function normalizeSongForExport(song: Song): Song {
  return {
    ...song,
    length: song.length ?? PATTERN_LENGTH,
    line: song.line ?? [],
    pattern: song.pattern ?? [],
    instrument: song.instrument ?? [],
  };
}

/**
 * Converts a song to DOSOUND XBIOS assembly format
 * @param song The song to export
 * @param isComplexDumpMode Whether to use complex dump mode (includes detailed comments and optimization)
 * @returns Assembly formatted string
 */
export function exportToAssembly(
  song: Song,
  isComplexDumpMode: boolean | ExportStrategy = false
): string {
  const normalizedSong = normalizeSongForExport(song);
  const strategy: ExportStrategy =
    typeof isComplexDumpMode === 'boolean'
      ? (isComplexDumpMode ? 'complex' : 'simple')
      : isComplexDumpMode;

  // Simulate playback and collect register states per frame
  const frames: SimulationFrame[] = [];
  
  simulateSong(normalizedSong, (frame) => {
    // Store this frame only when envelope steps advance (every 40ms like instrument export)
    // The simulation emits ticks based on song speed.
    // Original logic: if (tick === 0 || (tick % 2 === 0))
    if (frame.tick === 0 || (frame.tick % 2 === 0)) {
      frames.push(frame);
    }
  });
  
  // Now convert frames to optimized assembly output
  return formatFramesToAssembly(frames, normalizedSong, strategy);
}


function formatFramesToAssembly(frames: SimulationFrame[], song: Song, strategy: ExportStrategy): string {
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
  
  if (strategy === 'complex' || strategy === 'optimized') {
    // Optimized dump for complex mode - track changes and skip unchanged registers
    const lastRegs: { [register: number]: number } = {};
    let lastLineIndex = -1;
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const regs = frame.registers;
      const lineIndex = frame.lineIndex;
      const toneMeta = frame.toneMeta || {};
      
      // Add beat marker after each completed playlist position (every patternLength lines).
      // Also force tone registers to be re-emitted after the marker so that each
      // playlist position starts with explicit TA/TB/TC writes, even if the
      // underlying period value did not change.
      const patternLength = song.length ?? 64;
      if (lineIndex !== lastLineIndex && lineIndex > 0 && lineIndex % patternLength === 0) {
        asm += '\n\t; ---\n\n';

        // Clear cached tone registers (R0-R5) so next frame writes them again.
        for (let r = 0; r <= 5; r++) {
          delete lastRegs[r];
        }
      }
      lastLineIndex = lineIndex;
      
      // Write mixer register if changed (or first frame)
      if (i === 0 || (regs[0x07] || 0x38) !== (lastRegs[0x07] || 0x38)) {
        asm += formatAsmLine([0x07, regs[0x07] || 0x38], getRegisterComment(0x07, regs[0x07] || 0x38));
        lastRegs[0x07] = regs[0x07] || 0x38;
      }
      
      // Write tone registers for all three channels if changed and the channel is audible
      for (let ch = 0; ch < 3; ch++) {
        const fineReg = ch * 2;
        const coarseReg = ch * 2 + 1;
        const fine = regs[fineReg] || 0;
        const coarse = regs[coarseReg] || 0;
        const lastFine = lastRegs[fineReg] || 0;
        const lastCoarse = lastRegs[coarseReg] || 0;

        // Skip tone writes for fully silent channels (volume = 0) to avoid
        // exporting pitch-only changes once the instrument is muted.
        const volumeAtFrame = (regs[0x08 + ch] ?? 0) & 0x0f;
        if (volumeAtFrame === 0) {
          continue;
        }
        
        if (i === 0 || fine !== lastFine || coarse !== lastCoarse) {
          const period = (coarse << 8) | fine;
          const channelLabel = String.fromCharCode(65 + ch); // A, B, C

          // Prefer original note + pitch delta from playback simulation when available.
          const meta = toneMeta[ch];
          let comment: string;

          if (meta && meta.note && typeof meta.octave === 'number') {
            const baseLabel = meta.note.includes('#')
              ? `${meta.note}${meta.octave}`
              : `${meta.note}-${meta.octave}`;
            const delta = meta.pitchDelta || 0;
            const pitchText = delta ? ` ${delta > 0 ? '+' : ''}${delta}` : '';
            comment = `T${channelLabel} ${baseLabel}${pitchText}`;
          } else {
            const { label: noteLabel, pitchDelta } = periodToNoteAndPitch(period);
            const pitchText = pitchDelta ? ` ${pitchDelta > 0 ? '+' : ''}${pitchDelta}` : '';
            comment = noteLabel ? `T${channelLabel} ${noteLabel}${pitchText}` : `T${channelLabel}`;
          }

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
    }
    
  } else {
    // Unoptimized dump - write all registers every frame
    let lastLineIndex = -1;
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const regs = frame.registers;
      const lineIndex = frame.lineIndex;
      const toneMeta = frame.toneMeta || {};
      
      // Add beat marker after each completed playlist position (every patternLength lines)
      const patternLength = song.length ?? 64;
      if (lineIndex !== lastLineIndex && lineIndex > 0 && lineIndex % patternLength === 0) {
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
        const channelLabel = String.fromCharCode(65 + ch); // A, B, C

        const meta = toneMeta[ch];
        let comment: string;

        if (meta && meta.note && typeof meta.octave === 'number') {
          const baseLabel = meta.note.includes('#')
            ? `${meta.note}${meta.octave}`
            : `${meta.note}-${meta.octave}`;
          const delta = meta.pitchDelta || 0;
          const pitchText = delta ? ` ${delta > 0 ? '+' : ''}${delta}` : '';
          comment = `T${channelLabel} ${baseLabel}${pitchText}`;
        } else {
          const { label: noteLabel, pitchDelta } = periodToNoteAndPitch(period);
          const pitchText = pitchDelta ? ` ${pitchDelta > 0 ? '+' : ''}${pitchDelta}` : '';
          comment = noteLabel ? `T${channelLabel} ${noteLabel}${pitchText}` : `T${channelLabel}`;
        }

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
  
  if (strategy === 'optimized') {
    asm = combineDelayLines(asm);
  }

  return asm;
}

function combineDelayLines(asm: string): string {
  const lines = asm.split('\n');
  const out: string[] = [];
  let pendingFrames = 0;

  const flush = () => {
    if (pendingFrames > 0) {
      const merged = formatDelayLine(pendingFrames).trimEnd();
      out.push(merged);
      pendingFrames = 0;
    }
  };

  const delayRegex = /^\s*dc\.b\s+\$FF,\$[0-9A-Fa-f]+\s*;\s*DL\s+(\d+)\s*$/;

  for (const line of lines) {
    const match = delayRegex.exec(line);
    if (match) {
      const frames = parseInt(match[1], 10);
      if (Number.isFinite(frames) && frames > 0) {
        pendingFrames += frames;
        continue;
      }
    }

    flush();
    out.push(line);
  }

  flush();
  return out.join('\n');
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
 * volume envelope and shift envelope. Tone (TA) follows shift over time.
 * Output follows strict formatting rules.
 */
export function exportInstrumentToAssembly(instrument: Instrument, song?: Song): string {
  const base = parseBaseKeyForExport(instrument.base || 'C-4');

  // Base frequency for the instrument's root note
  const baseFreq = NOTE_FREQUENCIES[base.note] || 440.0;
  const baseFrequency = baseFreq * Math.pow(2, base.octave - 4);

  const volumeEnv =
    instrument.volume && instrument.volume.length
      ? instrument.volume
      : [0x0f, 0x0e, 0x0c, 0x08, 0x04, 0x00];

  const shiftEnv = instrument.shift || [];
  const pitchEnv = instrument.pitch || [];
  const modeEnv = instrument.mode || [];
  const noiseEnv = instrument.noise || [];

  const clampVol = (v: number) => Math.max(0, Math.min(0x0f, v | 0));
  const vols = volumeEnv.map(clampVol);

  // Number of envelope steps to consider (40ms per step)
  const stepsCount = Math.max(
    vols.length,
    shiftEnv.length || 1,
    pitchEnv.length || 1,
    modeEnv.length || 1,
    noiseEnv.length || 1
  );

  // Optionally cap the number of steps based on the current song's
  // speed (ticks per row) and pattern length so the dump matches the
  // duration of one pattern in the sequencer.
  let maxSteps = stepsCount;
  if (song) {
    const normalizedSong = normalizeSongForExport(song);
    const rawSpeed = Number(normalizedSong.speed);
    const baseSpeed = Number.isFinite(rawSpeed) && rawSpeed > 0 ? Math.floor(rawSpeed) : 6;
    const clampedSpeed = Math.max(2, baseSpeed);
    const evenSpeed = clampedSpeed & ~1; // enforce even speed (2,4,6,...)

    const rawLength = Number(normalizedSong.length);
    const patternLength = Number.isFinite(rawLength) && rawLength > 0 ? Math.floor(rawLength) : PATTERN_LENGTH;

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
    semitone: number;   // shift semitone offset from base
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

    // Apply shift in semitones on top of baseFrequency
    let frequency = baseFrequency;
    let semitone = 0;
    if (shiftEnv && shiftEnv.length > 0) {
      const idx = Math.min(i, shiftEnv.length - 1);
      const shiftVal = typeof shiftEnv[idx] === 'number' ? (shiftEnv[idx] as number) : 0;
      semitone = shiftVal | 0;
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
    case 0x07: { // Mixer
      const getChannelMode = (channel: 0 | 1 | 2): 'T' | 'N' | 'B' => {
        const toneDisabledMask = 1 << channel;
        const noiseDisabledMask = 0x08 << channel;
        const toneEnabled = (value & toneDisabledMask) === 0;
        const noiseEnabled = (value & noiseDisabledMask) === 0;

        if (toneEnabled && !noiseEnabled) return 'T';
        if (noiseEnabled && !toneEnabled) return 'N';
        if (toneEnabled && noiseEnabled) return 'B';
        return 'N';
      };

      const a = getChannelMode(0);
      const b = getChannelMode(1);
      const c = getChannelMode(2);
      return `MX ${a}+${b}+${c}`;
    }
      
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

function optimizeVgmDelays(
  commands: number[],
  loopCommandOffset: number
): { commands: number[]; loopCommandOffset: number } {
  if (commands.length === 0) {
    return { commands, loopCommandOffset };
  }

  // If no valid loop point, just optimize the whole stream.
  if (loopCommandOffset < 0 || loopCommandOffset > commands.length) {
    const merged = mergeVgmDelaySequence(commands);
    return { commands: merged, loopCommandOffset };
  }

  // Preserve the exact byte position of the loop command by optimizing the
  // prefix and suffix separately, then recomputing the loop offset as the
  // length of the optimized prefix.
  const pre = commands.slice(0, loopCommandOffset);
  const post = commands.slice(loopCommandOffset);

  const preMerged = mergeVgmDelaySequence(pre);
  const postMerged = mergeVgmDelaySequence(post);

  return {
    commands: preMerged.concat(postMerged),
    loopCommandOffset: preMerged.length,
  };
}

function mergeVgmDelaySequence(commands: number[]): number[] {
  const out: number[] = [];
  const len = commands.length;
  let i = 0;
  const SAMPLES_PER_TICK = 882; // Must match SAMPLES_PER_TICK in exportSongToVgm

  while (i < len) {
    const cmd = commands[i];

    // Merge runs of 0x63 (wait 1/50s) into a single 0x61 (arbitrary sample wait)
    if (cmd === 0x63) {
      let run = 0;
      while (i < len && commands[i] === 0x63) {
        run++;
        i++;
      }

      if (run >= 4) {
        const total = run * SAMPLES_PER_TICK;
        out.push(0x61, total & 0xff, (total >>> 8) & 0xff);
      } else {
        for (let k = 0; k < run; k++) {
          out.push(0x63);
        }
      }
      continue;
    }

    // AY8910 write (0xA0 rr vv)
    if (cmd === 0xa0) {
      if (i + 2 < len) {
        out.push(commands[i], commands[i + 1], commands[i + 2]);
        i += 3;
      } else {
        // Truncated command - copy remainder verbatim
        while (i < len) {
          out.push(commands[i++]);
        }
      }
      continue;
    }

    // Generic wait with explicit sample count (0x61 nn nn) - already optimal
    if (cmd === 0x61) {
      if (i + 2 < len) {
        out.push(commands[i], commands[i + 1], commands[i + 2]);
        i += 3;
      } else {
        while (i < len) {
          out.push(commands[i++]);
        }
      }
      continue;
    }

    // Other single-byte commands (including 0x62 and 0x66)
    out.push(cmd);
    i++;
  }

  return out;
}

export function parseAssemblyToBinary(assembly: string): Uint8Array {
  const lines = assembly.split(/\r?\n/);
  const bytes: number[] = [];

  for (const line of lines) {
    const idx = line.indexOf('dc.b');
    if (idx === -1) {
      continue;
    }

    const after = line.slice(idx + 'dc.b'.length);
    const codePart = after.split(';', 1)[0];
    const tokens = codePart
      .split(',')
      .map(token => token.trim())
      .filter(token => token.length > 0);

    for (const token of tokens) {
      if (!token.startsWith('$')) {
        continue;
      }

      const hex = token.slice(1);
      if (!hex) {
        continue;
      }

      const value = parseInt(hex, 16);
      if (!Number.isFinite(value)) {
        continue;
      }

      bytes.push(value & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

export function exportToBinary(
  song: Song,
  isComplexDumpMode: boolean | ExportStrategy = false
): Uint8Array {
  const assembly = exportToAssembly(song, isComplexDumpMode);
  return parseAssemblyToBinary(assembly);
}

export function downloadBinaryFile(bytes: Uint8Array, filename: string = 'music.bin'): void {
  const arrayBuffer: ArrayBuffer = bytes.buffer as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
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

export interface MaxExportResult {
  buffer: ArrayBuffer;
  frameCount: number;
}

function buildMaxShortChunk(typeChar: string, data: number[]): number[] {
  const typeCode = typeChar.charCodeAt(0) & 0xff;
  const length = data.length;
  const sizeByte = length > 0 ? (length - 1) & 0xff : 0;
  const chunk: number[] = [typeCode, sizeByte];
  chunk.push(...data);
  return chunk;
}

function buildMaxLongChunk(typeChar: string, data: number[]): number[] {
  const typeCode = typeChar.charCodeAt(0) & 0xff;
  const length = data.length;
  const size = length > 0 ? length - 1 : 0;
  const b0 = (size >>> 16) & 0xff;
  const b1 = (size >>> 8) & 0xff;
  const b2 = size & 0xff;
  const chunk: number[] = [typeCode, b0, b1, b2];
  chunk.push(...data);
  return chunk;
}

function buildMaxInfoChunk(song: Song): number[] | null {
  const title = (song.title || '').trim();
  const author = (song.author || '').trim();
  const yearValue =
    typeof song.year === 'number' && Number.isFinite(song.year) ? song.year : null;
  const year = yearValue !== null ? String(yearValue) : '';

  const lines: string[] = [];
  if (title) {
    lines.push(`T ${title}`);
  }
  if (author) {
    lines.push(`A ${author}`);
  }
  if (year) {
    lines.push(`Y ${year}`);
  }

  if (lines.length === 0) {
    return null;
  }

  const data: number[] = [];
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

  for (const line of lines) {
    if (encoder) {
      const encoded = encoder.encode(line);
      for (let i = 0; i < encoded.length; i++) {
        data.push(encoded[i]);
      }
    } else {
      for (let i = 0; i < line.length; i++) {
        const code = line.charCodeAt(i) & 0xff;
        data.push(code);
      }
    }
    data.push(0x00);
  }

  return buildMaxShortChunk('I', data);
}

function buildMaxStreamFromDumpBytes(
  dumpBytes: Uint8Array,
  strategy: ExportStrategy
): { streamFormat: number; streamData: number[]; frameCount: number } {
  const frameWidth = 11;
  if (dumpBytes.length === 0 || dumpBytes.length % frameWidth !== 0) {
    return { streamFormat: 0x08, streamData: [], frameCount: 0 };
  }

  const frameCount = dumpBytes.length / frameWidth;

  if (strategy === 'simple') {
    const data: number[] = [];
    for (let i = 0; i < dumpBytes.length; i++) {
      data.push(dumpBytes[i] & 0xff);
    }
    return { streamFormat: 0x08, streamData: data, frameCount };
  }

  const regCount = frameWidth;
  const regNumbers: number[] = [];
  for (let i = 0; i < regCount; i++) {
    regNumbers.push(i);
  }
  const prev: number[] = new Array(regCount).fill(0);
  const data: number[] = [];

  for (let frame = 0; frame < frameCount; frame++) {
    const base = frame * frameWidth;

    for (let i = 0; i < regCount; i++) {
      const value = dumpBytes[base + i] & 0xff;
      if (frame === 0 || value !== prev[i]) {
        const reg = regNumbers[i] & 0x7f;
        data.push(reg, value);
        prev[i] = value;
      }
    }

    // End-of-frame marker: use a register byte with the high bit set and
    // value $80 to indicate the end of the data frame with no extra delay.
    data.push(0x80, 0x80);
  }

  const streamData = strategy === 'optimized' ? optimizeReg7Delays(data) : data;

  return { streamFormat: 0x07, streamData, frameCount };
}

function optimizeReg7Delays(input: number[]): number[] {
  const out: number[] = [];
  const len = input.length;
  let i = 0;

  while (i < len) {
    const cmd = input[i] & 0xff;

    if (cmd === 0x80 && i + 1 < len) {
      let frames = 0;

      while (i < len && input[i] === 0x80 && i + 1 < len) {
        const value = input[i + 1] & 0xff;
        if ((value & 0x80) === 0) {
          break;
        }

        const extra = value & 0x7f;
        frames += 1 + extra;
        i += 2;
      }

      while (frames > 0) {
        const chunk = frames > 128 ? 128 : frames;
        const extra = chunk - 1;
        const value = 0x80 | (extra & 0x7f);
        out.push(0x80, value);
        frames -= chunk;
      }

      continue;
    }

    out.push(cmd);
    i++;
  }

  return out;
}

export function exportSongToMax(
  song: Song,
  strategy: ExportStrategy = 'simple'
): MaxExportResult {
  const dump = exportSongRegisterDump(song);
  const dumpBytes = parseAssemblyToBinary(dump.content);

  const { streamFormat, streamData, frameCount } = buildMaxStreamFromDumpBytes(
    dumpBytes,
    strategy
  );

  const fileBytes: number[] = [];

  // File header: magic "MAX "
  fileBytes.push(0x4d, 0x41, 0x58, 0x20);

  // Version chunk: 'V', size 0, version 1
  fileBytes.push(...buildMaxShortChunk('V', [0x01]));

  const infoChunk = buildMaxInfoChunk(song);
  if (infoChunk) {
    fileBytes.push(...infoChunk);
  }

  const chipData: number[] = [];
  chipData.push(0xa9);
  chipData.push(0x00);
  chipData.push((VBLANK_RATE >>> 8) & 0xff, VBLANK_RATE & 0xff);

  const ymClock = YM_CLOCK >>> 0;
  chipData.push(
    (ymClock >>> 24) & 0xff,
    (ymClock >>> 16) & 0xff,
    (ymClock >>> 8) & 0xff,
    ymClock & 0xff
  );

  fileBytes.push(...buildMaxShortChunk('C', chipData));

  const compression = 0x00;

  let streamDefData: number[];
  if (streamFormat === 0x08) {
    const frameSize = 11; // RAW8 AY/YM frame size in bytes
    streamDefData = [
      streamFormat & 0xff,
      compression,
      0x00,
      0x00,
      0x00,
      frameSize & 0xff,
    ];
  } else {
    streamDefData = [streamFormat & 0xff, compression];
  }

  fileBytes.push(...buildMaxShortChunk('S', streamDefData));

  fileBytes.push(...buildMaxLongChunk('d', streamData));

  const buffer = new Uint8Array(fileBytes).buffer;

  return {
    buffer,
    frameCount,
  };
}

export function exportInstrumentToMax(
  instrument: Instrument,
  song: Song,
  strategy: ExportStrategy = 'simple'
): MaxExportResult {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exportSongToMax(previewSong, strategy);
}

export function downloadMaxFile(buffer: ArrayBuffer, filename: string = 'music.max'): void {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
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
  const frames: SimulationFrame[] = [];
  
  simulateSong(song, (frame) => {
    // Mimic the behavior of the original exportSongRegisterDump which ran at half speed
    // (or rather, outputted one dump line for every 2 ticks of the 50Hz playback).
    // The original logic iterated `ticksPerRow = speed / 2` and outputted a line each iteration.
    // The simulation runs at full `speed`.
    // We capture frames at tick 0, 2, 4...
    if (frame.tick === 0 || (frame.tick % 2 === 0)) {
      frames.push(frame);
    }
  });

  const lines: string[] = [];
  let cycleCount = 0;

  lines.push('music:');

  for (const frame of frames) {
    const regs = frame.registers;

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

  const content = lines.join('\n') + (lines.length ? '\n' : '');
  return { content, cycleCount };
}

export interface VgmExportResult {
  buffer: ArrayBuffer;
  totalSamples: number;
}

function encodeUtf16LeNullTerminated(value: string): number[] {
  const bytes: number[] = [];
  const text = value || '';

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    bytes.push(code & 0xff, (code >>> 8) & 0xff);
  }

  bytes.push(0x00, 0x00);
  return bytes;
}

function buildGd3Tag(song: Song): Uint8Array | null {
  if (!song) {
    return null;
  }

  const title = (song.title || '').trim();
  const author = (song.author || '').trim();
  const yearValue =
    typeof song.year === 'number' && Number.isFinite(song.year) ? song.year : null;
  const release = yearValue !== null ? String(yearValue) : '';

  const fields: string[] = [
    title,
    '',
    'DOSOUND Tracker',
    '',
    '',
    '',
    author,
    '',
    release,
    '',
    ''
  ];

  if (!title && !author && !release) {
    return null;
  }

  const payloadBytes: number[] = [];
  for (const field of fields) {
    payloadBytes.push(...encodeUtf16LeNullTerminated(field));
  }

  const length = payloadBytes.length;
  const bytes: number[] = [];

  bytes.push(0x47, 0x64, 0x33, 0x20);
  bytes.push(0x00, 0x01, 0x00, 0x00);
  bytes.push(length & 0xff, (length >>> 8) & 0xff, (length >>> 16) & 0xff, (length >>> 24) & 0xff);
  bytes.push(...payloadBytes);

  return new Uint8Array(bytes);
}

function buildInstrumentPreviewSong(instrument: Instrument, sourceSong: Song): Song {
  const normalizedSong = normalizeSongForExport(sourceSong);
  const patternLength = normalizedSong.length || PATTERN_LENGTH;
  const speed = normalizedSong.speed || 6;

  const base = parseBaseKeyForExport(instrument.base || 'C-4');

  const step: Step[] = [];
  for (let i = 0; i < patternLength; i++) {
    step.push({
      note: i === 0 ? { note: base.note, octave: base.octave, instrument: instrument.id } : null,
      volume: undefined,
    });
  }

  const patternId = 'IP';
  const pattern: Pattern = {
    id: patternId,
    name: instrument.name || `Instrument ${instrument.id || ''}`,
    step,
  };

  const titleBase = sourceSong.title || '';
  const suffix = instrument.name
    ? ` - ${instrument.name}`
    : instrument.id
    ? ` - INST ${instrument.id}`
    : ' - Instrument';
  const title = titleBase ? `${titleBase}${suffix}` : `Instrument Preview${suffix}`;

  return {
    ...normalizedSong,
    title,
    speed,
    length: patternLength,
    pattern: [pattern],
    line: [{ A: patternId, B: '--', C: '--' }],
    loop: null,
    instrument: [instrument],
  };
}

export function exportSongToVgm(
  song: Song,
  strategy: ExportStrategy = 'simple'
): VgmExportResult {
  const normalizedSong = normalizeSongForExport(song);
  let commands: number[] = [];
  const SAMPLES_PER_TICK = 882; // 1/50 second at 44100 Hz
  let totalSamples = 0;

  const relevantRegs = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a];
  const lastRegs: { [register: number]: number } = {};
  
  const playlistLength = normalizedSong.line.length;
  let loopPlaylistIndex: number | null = null;
  if (normalizedSong.loop != null && playlistLength > 0) {
    const rawLoop = normalizedSong.loop as number;
    if (typeof rawLoop === 'number' && Number.isFinite(rawLoop)) {
      loopPlaylistIndex = Math.max(0, Math.min(playlistLength - 1, rawLoop | 0));
    }
  }

  let loopCommandOffset = -1;
  let loopSampleOffset = 0;

  const writeAyRegister = (register: number, value: number): void => {
    commands.push(0xa0, register & 0xff, value & 0xff);
  };

  simulateSong(song, (frame) => {
    const { registers, isFirstFrame, playlistIndex, patternLineIndex, tick } = frame;

    if (
      loopCommandOffset < 0 &&
      loopPlaylistIndex !== null &&
      playlistIndex === loopPlaylistIndex &&
      patternLineIndex === 0 &&
      tick === 0
    ) {
      loopCommandOffset = commands.length;
      loopSampleOffset = totalSamples;
    }

    for (let i = 0; i < relevantRegs.length; i++) {
      const reg = relevantRegs[i];
      const defaultValue = reg === 0x07 ? 0x38 : 0x00;
      const current = registers[reg] !== undefined ? registers[reg] : defaultValue;
      const previous = lastRegs[reg];
      if (isFirstFrame || previous !== current) {
        writeAyRegister(reg, current);
        lastRegs[reg] = current;
      }
    }

    commands.push(0x63);
    totalSamples += SAMPLES_PER_TICK;
  });

  commands.push(0x66);

  if (strategy === 'optimized') {
    const optimized = optimizeVgmDelays(commands, loopCommandOffset);
    commands = optimized.commands;
    loopCommandOffset = optimized.loopCommandOffset;
  }

  const dataOffset = 0x100;
  const headerSize = 0x100;

  const gd3Tag = buildGd3Tag(normalizedSong);
  const gd3Length = gd3Tag ? gd3Tag.length : 0;

  const fileSize = headerSize + commands.length + gd3Length;
  const eofOffset = fileSize - 4;

  const header = new Uint8Array(headerSize);
  header[0] = 0x56;
  header[1] = 0x67;
  header[2] = 0x6d;
  header[3] = 0x20;

  const writeUint32LE = (offset: number, value: number): void => {
    header[offset] = value & 0xff;
    header[offset + 1] = (value >>> 8) & 0xff;
    header[offset + 2] = (value >>> 16) & 0xff;
    header[offset + 3] = (value >>> 24) & 0xff;
  };

  writeUint32LE(0x04, eofOffset);
  writeUint32LE(0x08, 0x00000171);
  writeUint32LE(0x18, totalSamples);

  if (gd3Tag && gd3Length > 0) {
    const gd3Offset = headerSize + commands.length;
    const gd3OffsetRel = gd3Offset - 0x14;
    writeUint32LE(0x14, gd3OffsetRel);
  } else {
    writeUint32LE(0x14, 0);
  }

  if (loopCommandOffset >= 0 && loopSampleOffset > 0 && totalSamples > loopSampleOffset) {
    const loopDataOffset = dataOffset + loopCommandOffset;
    const loopOffset = loopDataOffset - 0x1c;
    const loopSamples = totalSamples - loopSampleOffset;
    writeUint32LE(0x1c, loopOffset);
    writeUint32LE(0x20, loopSamples);
  } else {
    writeUint32LE(0x1c, 0);
    writeUint32LE(0x20, 0);
  }
  writeUint32LE(0x24, VBLANK_RATE);

  const relativeDataOffset = dataOffset - 0x34;
  writeUint32LE(0x34, relativeDataOffset);

  writeUint32LE(0x74, YM_CLOCK);

  const fileBytes = new Uint8Array(fileSize);
  fileBytes.set(header, 0);
  fileBytes.set(new Uint8Array(commands), headerSize);

  if (gd3Tag && gd3Length > 0) {
    fileBytes.set(gd3Tag, headerSize + commands.length);
  }

  const buffer = fileBytes.buffer;

  return {
    buffer,
    totalSamples,
  };
}

export function downloadVgmFile(buffer: ArrayBuffer, filename: string = 'music.vgm'): void {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
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

export function exportSongToWav(song: Song): WavExportResult {
  const normalizedSong = normalizeSongForExport(song);
  const samples: number[] = [];
  const phases = [0, 0, 0];
  const noiseState: YmNoiseState = {
    lfsr: 0x1ffff,
    phase: 0
  };
  const samplesPerTick = Math.max(1, Math.round(WAV_SAMPLE_RATE / VBLANK_RATE));

  simulateSong(normalizedSong, (frame) => {
    synthTickSamples(samples, frame.registers, phases, samplesPerTick, noiseState);
  });

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

export function exportInstrumentToVgm(instrument: Instrument, song: Song): VgmExportResult {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exportSongToVgm(previewSong);
}

export function exportInstrumentToWav(instrument: Instrument, song: Song): WavExportResult {
  const previewSong = buildInstrumentPreviewSong(instrument, song);
  return exportSongToWav(previewSong);
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

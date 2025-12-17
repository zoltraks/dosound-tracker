import type { Song, Instrument } from '../synth/SoundDriver';
import {
  NOTE_FREQUENCIES,
  NOTE_BASE_OCTAVE,
  PATTERN_LENGTH,
} from '../constants/music';
import { YM_CLOCK } from '../synth/YM2149';
import type { ExportStrategy } from '../constants/export';
import { simulateSong, type SimulationFrame } from '../utils/playbackSimulation';
import {
  downloadFile,
  formatNoteLabel,
  frequencyToPeriod,
  normalizeSongForExport,
  parseBaseKeyForExport,
} from './core';

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
    if (frame.tick === 0 || frame.tick % 2 === 0) {
      frames.push(frame);
    }
  });

  // Now convert frames to optimized assembly output
  return formatFramesToAssembly(frames, normalizedSong, strategy);
}

function formatFramesToAssembly(
  frames: SimulationFrame[],
  song: Song,
  strategy: ExportStrategy
): string {
  // song parameter will be used for future optimization logic and pattern markers
  let asm = 'music:\n\n\t; START\n\n';

  if (frames.length === 0) {
    asm += '\t; END\n\n';
    asm += formatAsmLine([0x08, 0x00], 'VA 0');
    asm += formatAsmLine([0x09, 0x00], 'VB 0');
    asm += formatAsmLine([0x0a, 0x00], 'VC 0');
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
        asm += formatAsmLine(
          [0x07, regs[0x07] || 0x38],
          getRegisterComment(0x07, regs[0x07] || 0x38)
        );
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
            comment = noteLabel
              ? `T${channelLabel} ${noteLabel}${pitchText}`
              : `T${channelLabel}`;
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
      asm += formatAsmLine(
        [0x07, regs[0x07] || 0x38],
        getRegisterComment(0x07, regs[0x07] || 0x38)
      );

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
      asm += formatAsmLine([0x0a, regs[0x0a] || 0x00], `VC ${regs[0x0a] || 0x00}`);

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
  asm += formatAsmLine([0x0a, 0x00], 'VC 0');
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
  const v = value & 0xff;
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
    const patternLength =
      Number.isFinite(rawLength) && rawLength > 0 ? Math.floor(rawLength) : PATTERN_LENGTH;

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
    semitone: number; // shift semitone offset from base
    pitchDelta: number; // pitch envelope delta applied to divider
    mode: number; // 0=tone, 1=noise, 2=tone+noise
    noisePeriod: number;
  };
  const states: StepState[] = [];

  for (let i = 0; i < totalSteps; i++) {
    const vol = i < vols.length ? vols[i] : (vols[vols.length - 1] ?? 0);

    // Get mode for this step
    const modeIdx = modeEnv.length > 0 ? Math.min(i, modeEnv.length - 1) : 0;
    const mode = modeEnv.length > 0 ? modeEnv[modeIdx] || 0 : 0;

    // Get noise period for this step
    const noiseIdx = noiseEnv.length > 0 ? Math.min(i, noiseEnv.length - 1) : 0;
    const noisePeriod =
      noiseEnv.length > 0
        ? Math.max(0, Math.min(0x1f, noiseEnv[noiseIdx] | 0))
        : 0;

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
      mixer |= 1 << channel; // Disable tone for this channel
    }
    if (noiseActive) {
      mixer &= ~(0x08 << channel); // Enable noise for this channel
    }

    return mixer & 0xff;
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
    asm += formatAsmLine([0x0a, 0x0], 'VC 0');
    asm += '\n';
    asm += formatDelayLine(2);
    asm += '\n';
    asm += '\t; END\n\n';
    asm += formatAsmLine([0x08, 0x0], 'VA 0');
    asm += formatAsmLine([0x09, 0x0], 'VB 0');
    asm += formatAsmLine([0x0a, 0x0], 'VC 0');
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
  asm += formatAsmLine([0x0a, 0x0], 'VC 0');

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
  asm += formatAsmLine([0x0a, 0x0], 'VC 0');
  asm += '\n';
  asm += formatAsmLine([0xff, 0x00], 'STOP');

  return asm;
}

/**
 * Gets a descriptive comment for common register writes
 */
function getRegisterComment(register: number, value: number): string {
  switch (register) {
    case 0x07: {
      // Mixer
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

    case 0x08:
      // Volume A
      return 'VA';
    case 0x09:
      // Volume B
      return 'VB';
    case 0x0a:
      // Volume C
      return 'VC';

    case 0x00:
    case 0x01:
    case 0x02:
    case 0x03:
    case 0x04:
    case 0x05:
      // These are handled together in the actual export
      return '';

    case 0x06:
      // Noise period
      return 'NS';

    default:
      return '';
  }
}

/**
 * Downloads the assembly content as a .s file
 */
export function downloadAssemblyFile(content: string, filename: string = 'music.s'): void {
  downloadFile(content, filename, 'text/plain;charset=utf-8');
}

export function exportSongRegisterDump(song: Song): { content: string; cycleCount: number } {
  const frames: SimulationFrame[] = [];

  simulateSong(song, (frame) => {
    // Mimic the behavior of the original exportSongRegisterDump which ran at half speed
    // (or rather, outputted one dump line for every 2 ticks of the 50Hz playback).
    // The original logic iterated `ticksPerRow = speed / 2` and outputted a line each iteration.
    // The simulation runs at full `speed`.
    // We capture frames at tick 0, 2, 4...
    if (frame.tick === 0 || frame.tick % 2 === 0) {
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
      vc,
    ];

    const line = '\t' + 'dc.b ' + bytes.map((b) => `$${toHex(b, true)}`).join(',');
    lines.push(line);
    cycleCount++;
  }

  const content = lines.join('\n') + (lines.length ? '\n' : '');
  return { content, cycleCount };
}

import type { Song, Instrument } from '../synth/SoundDriver.ts';
import {
  NOTE_FREQUENCIES,
  NOTE_BASE_OCTAVE,
  PATTERN_LENGTH,
  pow2Octave,
  pow2Semitone,
} from '../constants/music.ts';
import { YM_CLOCK } from '../synth/YM2149.ts';
import type { ExportStrategy } from '../constants/export.ts';
import {
  simulateSong,
  type SimulationFrame,
  type ToneMetaByChannel,
} from '../utils/playback/playbackSimulation.ts';
import {
  downloadFile,
  formatNoteLabel,
  formatPitchDelta,
  frequencyToPeriod,
  normalizeSongForExport,
  parseBaseKeyForExport,
} from './core.ts';
import { Formatter } from '../utils/format/formatters.ts';
import { clampVolumeNibble } from '../utils/panel/volumeUtils.ts';
import { formatBaseKey } from '../utils/song/songFormat.ts';
import { normalizeSongSpeed } from '../utils/song/songSpeed.ts';

/**
 * Converts a song to DOSOUND XBIOS assembly format
 * @param song The song to export
 * @param isComplexDumpMode Whether to use complex dump mode (includes detailed comments and optimization)
 * @returns Assembly formatted string
 */
export function exportToAssembly(song: Song, strategy: ExportStrategy = 'complex'): string {
  const normalizedSong = normalizeSongForExport(song);
  const chipClock = normalizedSong.clock ?? YM_CLOCK;

  const frames: SimulationFrame[] = [];

  simulateSong(
    normalizedSong,
    (frame) => {
      // Store this frame only when envelope steps advance (every 2 ticks)
      // The simulation emits ticks based on song speed.
      if (frame.tick === 0 || frame.tick % 2 === 0) {
        frames.push(frame);
      }
    },
    { clock: chipClock },
  );

  return formatFramesToAssembly(frames, normalizedSong, strategy);
}

function formatFramesToAssembly(
  frames: SimulationFrame[],
  song: Song,
  strategy: ExportStrategy,
): string {
  const chipClock = song.clock ?? YM_CLOCK;
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

  if (strategy === 'complex' || strategy === 'tight') {
    const tight = strategy === 'tight';
    const lastRegs: { [register: number]: number } = {};
    let lastLineIndex = -1;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const regs = frame.registers;
      const lineIndex = frame.lineIndex;
      const toneMeta = frame.toneMeta || {};

      // Add beat marker after each completed playlist position (every patternLength lines).
      // Under complex and optimized the marker also forces tone registers to be
      // re-emitted so that each playlist position starts with explicit TA/TB/TC
      // writes, even if the underlying period value did not change. Tight
      // keeps the marker comment but drops the forced rewrite.
      const patternLength = song.length ?? 64;
      if (lineIndex !== lastLineIndex && lineIndex > 0 && lineIndex % patternLength === 0) {
        asm += '\n\t; ---\n\n';

        if (!tight) {
          // Clear cached tone registers (R0-R5) so next frame writes them again.
          for (let r = 0; r <= 5; r++) {
            delete lastRegs[r];
          }
        }
      }
      lastLineIndex = lineIndex;

      const mixer = regs[0x07] || 0x38;
      const lastMixer = lastRegs[0x07] || 0x38;
      let emitMixer = i === 0 || mixer !== lastMixer;
      if (emitMixer && tight && i !== 0) {
        // Tight keys mixer writes on audible bits: a channel whose volume
        // nibble is zero cannot sound, so enable-bit changes on it are
        // inaudible until its volume returns. The I/O bits (0xC0) always count.
        const diff = mixer ^ lastMixer;
        emitMixer =
          (diff & 0xc0) !== 0 ||
          [0, 1, 2].some(
            (ch) => ((regs[0x08 + ch] ?? 0) & 0x0f) !== 0 && (diff & (0x09 << ch)) !== 0,
          );
      }
      if (emitMixer) {
        asm += formatAsmLine([0x07, mixer], getRegisterComment(0x07, mixer));
        lastRegs[0x07] = mixer;
      }

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

          const meta = toneMeta[ch];
          const comment = buildToneComment(channelLabel, meta, period, chipClock);

          if (tight && i !== 0) {
            // Emit only the changed half of the period pair, keeping the
            // coarse-then-fine write order of the four-byte form.
            const bytes: number[] = [];
            if (coarse !== lastCoarse) {
              bytes.push(coarseReg, coarse);
            }
            if (fine !== lastFine) {
              bytes.push(fineReg, fine);
            }
            asm += formatAsmLine(bytes, comment);
          } else {
            asm += formatAsmLine([coarseReg, coarse, fineReg, fine], comment);
          }
          lastRegs[fineReg] = fine;
          lastRegs[coarseReg] = coarse;
        }
      }

      for (let ch = 0; ch < 3; ch++) {
        const reg = 0x08 + ch;
        if (i === 0 || (regs[reg] || 0x00) !== (lastRegs[reg] || 0x00)) {
          const channelLabel = String.fromCharCode(65 + ch); // A, B, C
          const value = regs[reg] || 0x00;
          asm += formatAsmLine([reg, value], `V${channelLabel} ${value}`);
          lastRegs[reg] = value;
        }
      }

      if (i === 0 || (regs[0x06] || 0x00) !== (lastRegs[0x06] || 0x00)) {
        const value = regs[0x06] || 0x00;
        asm += formatAsmLine([0x06, value], `NS ${value}`);
        lastRegs[0x06] = value;
      }

      asm += formatAsmLine([0xff, 0x01], 'DL 2');
    }
  } else {
    let lastLineIndex = -1;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const regs = frame.registers;
      const lineIndex = frame.lineIndex;
      const toneMeta = frame.toneMeta || {};

      const patternLength = song.length ?? 64;
      if (lineIndex !== lastLineIndex && lineIndex > 0 && lineIndex % patternLength === 0) {
        asm += '\n\t; ---\n\n';
      }
      lastLineIndex = lineIndex;

      asm += formatAsmLine(
        [0x07, regs[0x07] || 0x38],
        getRegisterComment(0x07, regs[0x07] || 0x38),
      );

      for (let ch = 0; ch < 3; ch++) {
        const fineReg = ch * 2;
        const coarseReg = ch * 2 + 1;
        const fine = regs[fineReg] || 0;
        const coarse = regs[coarseReg] || 0;

        const period = (coarse << 8) | fine;
        const channelLabel = String.fromCharCode(65 + ch); // A, B, C

        const meta = toneMeta[ch];
        const comment = buildToneComment(channelLabel, meta, period, chipClock);

        asm += formatAsmLine([coarseReg, coarse, fineReg, fine], comment);
      }

      asm += formatAsmLine([0x08, regs[0x08] || 0x00], `VA ${regs[0x08] || 0x00}`);
      asm += formatAsmLine([0x09, regs[0x09] || 0x00], `VB ${regs[0x09] || 0x00}`);
      asm += formatAsmLine([0x0a, regs[0x0a] || 0x00], `VC ${regs[0x0a] || 0x00}`);

      asm += formatAsmLine([0x06, regs[0x06] || 0x00], `NS ${regs[0x06] || 0x00}`);

      asm += formatAsmLine([0xff, 0x01], 'DL 2');
    }
  }

  asm += '\n\t; END\n\n';
  if (strategy === 'tight') {
    // Silence only channels whose last written volume is non-zero. Every
    // strategy emits all three volume registers at frame 0, so the final
    // frame's snapshot equals the last written values.
    const lastFrameRegs = frames[frames.length - 1].registers;
    for (let ch = 0; ch < 3; ch++) {
      const lastVolume = lastFrameRegs[0x08 + ch] ?? 0;
      if (lastVolume !== 0) {
        const channelLabel = String.fromCharCode(65 + ch); // A, B, C
        asm += formatAsmLine([0x08 + ch, 0x00], `V${channelLabel} 0`);
      }
    }
  } else {
    asm += formatAsmLine([0x08, 0x00], 'VA 0');
    asm += formatAsmLine([0x09, 0x00], 'VB 0');
    asm += formatAsmLine([0x0a, 0x00], 'VC 0');
  }
  asm += '\n';
  asm += formatAsmLine([0xff, 0x00], 'STOP');

  if (strategy === 'tight') {
    // The delay count is one byte ($FF,N delays N+1 frames), so a merged
    // run may not exceed 256 frames per command.
    asm = combineDelayLines(asm, { maxFramesPerCommand: 256 });
  }

  return asm;
}

function combineDelayLines(
  asm: string,
  { maxFramesPerCommand = Infinity }: { maxFramesPerCommand?: number } = {},
): string {
  const lines = asm.split('\n');
  const out: string[] = [];
  let pendingFrames = 0;

  const flush = () => {
    while (pendingFrames > 0) {
      const chunk = Math.min(pendingFrames, maxFramesPerCommand);
      out.push(formatDelayLine(chunk).trimEnd());
      pendingFrames -= chunk;
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

function periodToNoteAndPitch(
  period: number,
  clock: number = YM_CLOCK,
): { label: string; pitchDelta: number } {
  if (period === 0) {
    return { label: '', pitchDelta: 0 };
  }

  const targetFrequency = clock / (16 * period);

  let bestLabel = '';
  let bestPitchDelta = 0;
  let minDiff = Infinity;

  for (const noteName of Object.keys(NOTE_FREQUENCIES)) {
    for (let octave = 0; octave <= 8; octave++) {
      const freq = NOTE_FREQUENCIES[noteName] * pow2Octave(octave - NOTE_BASE_OCTAVE);
      const diff = Math.abs(freq - targetFrequency);
      if (diff < minDiff) {
        minDiff = diff;
        const idealPeriod = Math.floor(clock / (16 * freq));
        bestPitchDelta = idealPeriod - period;
        bestLabel = formatBaseKey(noteName, octave);
      }
    }
  }

  return { label: bestLabel, pitchDelta: bestPitchDelta };
}

// Helper: build the tone-register comment, preferring original note + pitch
// delta from playback simulation when available.
function buildToneComment(
  channelLabel: string,
  meta: ToneMetaByChannel[number] | undefined,
  period: number,
  chipClock: number,
): string {
  if (meta && meta.note && typeof meta.octave === 'number') {
    const baseLabel = meta.note.includes('#')
      ? `${meta.note}${meta.octave}`
      : `${meta.note}-${meta.octave}`;
    const delta = meta.pitchDelta || 0;
    const pitchText = formatPitchDelta(delta);
    return `T${channelLabel} ${baseLabel}${pitchText}`;
  }
  const { label: noteLabel, pitchDelta } = periodToNoteAndPitch(period, chipClock);
  const pitchText = formatPitchDelta(pitchDelta);
  return noteLabel ? `T${channelLabel} ${noteLabel}${pitchText}` : `T${channelLabel}`;
}

function formatAsmLine(bytes: number[], comment: string): string {
  const code = '\t' + 'dc.b ' + bytes.map((b) => `$${Formatter.hex(b, { noPad: true })}`).join(',');
  const targetCol = 20;
  const padLength = Math.max(1, targetCol - code.length);
  return code + ' '.repeat(padLength) + '; ' + comment + '\n';
}

// Helper: format DOSOUND delay in frames (one frame = 1000/frameRate ms)
// DOSOUND bug: $ff,N delays N+1 frames, so $ff,1 = 2 frames delay
function formatDelayLine(frames: number): string {
  // Minimum delay is 2 frames - can't delay just 1 frame
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
  const normalizedSong = song ? normalizeSongForExport(song) : undefined;
  const chipClock = normalizedSong?.clock ?? YM_CLOCK;
  const base = parseBaseKeyForExport(instrument.base || 'C-4');

  const baseFreq = NOTE_FREQUENCIES[base.note] || 440.0;
  const baseFrequency = baseFreq * pow2Octave(base.octave - 4);

  const volumeEnv =
    instrument.volume && instrument.volume.length
      ? instrument.volume
      : [0x0f, 0x0e, 0x0c, 0x08, 0x04, 0x00];

  const shiftEnv = instrument.shift || [];
  const pitchEnv = instrument.pitch || [];
  const modeEnv = instrument.mode || [];
  const noiseEnv = instrument.noise || [];

  const vols = volumeEnv.map(clampVolumeNibble);

  const stepsCount = Math.max(
    vols.length,
    shiftEnv.length || 1,
    pitchEnv.length || 1,
    modeEnv.length || 1,
    noiseEnv.length || 1,
  );

  // Optionally cap the number of steps based on the current song's
  // speed (ticks per row) and pattern length so the dump matches the
  // duration of one pattern in the sequencer.
  let maxSteps = stepsCount;
  if (normalizedSong) {
    const evenSpeed = normalizeSongSpeed(normalizedSong.speed);

    const rawLength = Number(normalizedSong.length);
    const patternLength =
      Number.isFinite(rawLength) && rawLength > 0 ? Math.floor(rawLength) : PATTERN_LENGTH;

    // Envelopes advance every 2 ticks. With a speed
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

    const modeIdx = modeEnv.length > 0 ? Math.min(i, modeEnv.length - 1) : 0;
    const mode = modeEnv.length > 0 ? modeEnv[modeIdx] || 0 : 0;

    const noiseIdx = noiseEnv.length > 0 ? Math.min(i, noiseEnv.length - 1) : 0;
    const noisePeriod =
      noiseEnv.length > 0 ? Math.max(0, Math.min(0x1f, noiseEnv[noiseIdx] | 0)) : 0;

    let pitchDelta = 0;
    if (pitchEnv && pitchEnv.length > 0) {
      const pIdx = Math.min(i, pitchEnv.length - 1);
      const pVal = pitchEnv[pIdx];
      if (typeof pVal === 'number') {
        pitchDelta = pVal | 0;
      }
    }

    let frequency = baseFrequency;
    let semitone = 0;
    if (shiftEnv && shiftEnv.length > 0) {
      const idx = Math.min(i, shiftEnv.length - 1);
      const shiftVal = typeof shiftEnv[idx] === 'number' ? (shiftEnv[idx] as number) : 0;
      semitone = shiftVal | 0;
      if (semitone !== 0) {
        frequency = frequency * pow2Semitone(semitone);
      }
    }
    let period = frequencyToPeriod(frequency, chipClock) & 0x0fff;
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

  const initialMixer = getMixerForMode(first.mode, 0);
  const mixerComment = getRegisterComment(0x07, initialMixer) || 'MX';
  asm += formatAsmLine([0x07, initialMixer], mixerComment);

  asm += formatAsmLine([0x08, first.volume], `VA ${first.volume}`);
  asm += formatAsmLine([0x09, 0x0], 'VB 0');
  asm += formatAsmLine([0x0a, 0x0], 'VC 0');

  const firstToneActive = first.mode === 0 || first.mode === 2;
  if (firstToneActive) {
    const firstCF = getCoarseFine(first.period);
    const firstLabel = formatNoteLabel(base.note, base.octave, first.semitone || 0);
    const pitchText = formatPitchDelta(first.pitchDelta);
    asm += formatAsmLine(
      [0x01, firstCF.coarse, 0x00, firstCF.fine],
      `TA ${firstLabel}${pitchText}`,
    );
  }

  const firstNoiseActive = first.mode === 1 || first.mode === 2;
  if (firstNoiseActive && first.noisePeriod > 0) {
    asm += formatAsmLine([0x06, first.noisePeriod], `NS ${first.noisePeriod}`);
  }

  asm += formatDelayLine(2);

  let prevVolume = first.volume;
  let prevPeriod = first.period;
  let prevMode = first.mode;
  let prevNoisePeriod = first.noisePeriod;

  for (let i = 1; i < states.length; i++) {
    const step = states[i];
    const toneActive = step.mode === 0 || step.mode === 2;
    const noiseActive = step.mode === 1 || step.mode === 2;

    if (step.mode !== prevMode) {
      const newMixer = getMixerForMode(step.mode, 0);
      const comment = getRegisterComment(0x07, newMixer) || 'MX';
      asm += formatAsmLine([0x07, newMixer], comment);
      prevMode = step.mode;
    }

    if (noiseActive && step.noisePeriod !== prevNoisePeriod) {
      asm += formatAsmLine([0x06, step.noisePeriod], `NS ${step.noisePeriod}`);
      prevNoisePeriod = step.noisePeriod;
    }

    if (step.volume !== prevVolume) {
      asm += formatAsmLine([0x08, step.volume], `VA ${step.volume}`);
      prevVolume = step.volume;
    }

    if (toneActive && step.period !== prevPeriod) {
      const cf = getCoarseFine(step.period);
      const label = formatNoteLabel(base.note, base.octave, step.semitone || 0);
      const pitchText = formatPitchDelta(step.pitchDelta);
      asm += formatAsmLine([0x01, cf.coarse, 0x00, cf.fine], `TA ${label}${pitchText}`);
      prevPeriod = step.period;
    }

    asm += formatDelayLine(2);
  }

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

    const bytes = [taFine, taCoarse, tbFine, tbCoarse, tcFine, tcCoarse, ns, mx, va, vb, vc];

    const line = '\t' + 'dc.b ' + bytes.map((b) => `$${Formatter.hex(b)}`).join(',');
    lines.push(line);
    cycleCount++;
  }

  const content = lines.join('\n') + (lines.length ? '\n' : '');
  return { content, cycleCount };
}

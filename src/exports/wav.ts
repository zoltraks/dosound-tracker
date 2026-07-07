import type { Instrument, Song } from '../synth/SoundDriver';
import { YM_LOG_VOLUME_TABLE } from '../synth/YM2149';
import { DEFAULT_SONG_FRAME, DEFAULT_SONG_CLOCK } from '../constants/song';
import { simulateSong } from '../utils/playbackSimulation';
import { downloadFile, exportInstrumentWith, normalizeSongForExport } from './core';

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
  noiseState: YmNoiseState,
  clock: number
): void {
  const mixer = regs[0x07] !== undefined ? regs[0x07] : 0x38;

  const periods = [0, 0, 0];
  const freqs = [0, 0, 0];
  const volumes = [0, 0, 0];
  const toneEnabled = [false, false, false];
  const noiseEnabled = [false, false, false];

  const rawNoisePeriod = regs[0x06] !== undefined ? regs[0x06] : 0;
  const effectiveNoisePeriod = (rawNoisePeriod & 0x1f) === 0 ? 1 : rawNoisePeriod & 0x1f;
  const noiseFrequency = clock / (16 * effectiveNoisePeriod);
  const noiseStep = noiseFrequency / WAV_SAMPLE_RATE;

  for (let ch = 0; ch < 3; ch++) {
    const fineReg = ch * 2;
    const coarseReg = ch * 2 + 1;
    const fine = regs[fineReg] !== undefined ? regs[fineReg] : 0;
    const coarse = regs[coarseReg] !== undefined ? regs[coarseReg] : 0;
    const period = ((coarse & 0x0f) << 8) | (fine & 0xff);
    periods[ch] = period;
    if (period > 0) {
      freqs[ch] = clock / (16 * period);
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

    const noiseSample = noiseState.lfsr & 1 ? 1 : -1;

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

export function exportSongToWav(song: Song): WavExportResult {
  const normalizedSong = normalizeSongForExport(song);
  const frameRate = normalizedSong.frame ?? DEFAULT_SONG_FRAME;
  const chipClock = normalizedSong.clock ?? DEFAULT_SONG_CLOCK;
  const samples: number[] = [];
  const phases = [0, 0, 0];
  const noiseState: YmNoiseState = {
    lfsr: 0x1ffff,
    phase: 0,
  };
  const samplesPerTick = Math.max(1, Math.round(WAV_SAMPLE_RATE / frameRate));

  simulateSong(normalizedSong, (frame) => {
    synthTickSamples(samples, frame.registers, phases, samplesPerTick, noiseState, chipClock);
  }, { clock: chipClock });

  const totalSamples = samples.length;
  const buffer = encodePcm16Wav(samples, WAV_SAMPLE_RATE);
  const durationSeconds = totalSamples > 0 ? totalSamples / WAV_SAMPLE_RATE : 0;

  return {
    buffer,
    sampleRate: WAV_SAMPLE_RATE,
    totalSamples,
    durationSeconds,
  };
}

export function exportInstrumentToWav(instrument: Instrument, song: Song): WavExportResult {
  return exportInstrumentWith(instrument, song, exportSongToWav);
}

export function downloadWavFile(buffer: ArrayBuffer, filename: string = 'music.wav'): void {
  downloadFile(buffer, filename, 'audio/wav');
}

// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseSongFromYaml } from '../../src/utils/song/songParser.ts';
import { exportToAssembly } from '../../src/exports/asm.ts';
import { exportToBinary } from '../../src/exports/bin.ts';
import { ENVELOPE_LENGTH } from '../../src/constants/music.ts';
import type { Instrument, Song } from '../../src/synth/SoundDriver.ts';

const inst = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'i',
  volume: new Array(ENVELOPE_LENGTH).fill(15),
  shift: new Array(ENVELOPE_LENGTH).fill(0),
  pitch: new Array(ENVELOPE_LENGTH).fill(0),
  noise: new Array(ENVELOPE_LENGTH).fill(0),
  mode: new Array(ENVELOPE_LENGTH).fill(0),
  base: 'C-4',
  ...overrides,
});

const env = (values: number[]): number[] => {
  const arr = new Array(ENVELOPE_LENGTH).fill(values[values.length - 1] ?? 0);
  values.forEach((v, i) => {
    arr[i] = v;
  });
  return arr;
};

const song = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 4,
  length: 4,
  pattern: [
    {
      id: '00',
      name: 'P0',
      step: [
        { note: { note: 'C', octave: 4, instrument: '00' }, volume: null },
        { note: null, volume: null },
        { note: null, volume: null },
        { note: null, volume: null },
      ],
    },
  ],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [inst()],
  ...overrides,
});

/** Extracts every command byte from a generated DOSOUND assembly listing. */
const commandBytes = (asm: string): number[] => {
  const bytes: number[] = [];
  for (const line of asm.split('\n')) {
    const idx = line.indexOf('dc.b');
    if (idx === -1) continue;
    const codePart = line.slice(idx + 'dc.b'.length).split(';', 1)[0];
    for (const token of codePart.split(',')) {
      const t = token.trim();
      if (t.startsWith('$')) {
        bytes.push(parseInt(t.slice(1), 16) & 0xff);
      }
    }
  }
  return bytes;
};

/**
 * Replays the emitted command stream the way the DOSOUND routine does:
 * register-value pairs latch instantly, `$FF,N` waits N+1 frames, `$FF,0`
 * stops. Returns the register snapshot held during each frame.
 */
const decodeFrames = (asm: string): number[][] => {
  const regs = new Array(16).fill(0);
  const frames: number[][] = [];
  const bytes = commandBytes(asm);
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const reg = bytes[i];
    const value = bytes[i + 1];
    if (reg === 0xff) {
      if (value === 0) {
        break;
      }
      for (let f = 0; f < value + 1; f++) {
        frames.push(regs.slice());
      }
    } else {
      regs[reg] = value;
    }
  }
  return frames;
};

/**
 * The subset of register state a listener can hear: noise period, mixer I/O
 * bits, per-channel volume, and - only while a channel is audible - its tone
 * period and mixer enable bits. A silent channel's enable bits and period are
 * inaudible, which is exactly what the compact dedups rely on.
 */
const audibleSignature = (regs: number[]): number[] => {
  const sig = [regs[0x06] ?? 0, (regs[0x07] ?? 0) & 0xc0];
  for (let ch = 0; ch < 3; ch++) {
    const volume = (regs[0x08 + ch] ?? 0) & 0x0f;
    sig.push(volume);
    if (volume !== 0) {
      sig.push(regs[ch * 2] ?? 0, regs[ch * 2 + 1] ?? 0, (regs[0x07] ?? 0) & (0x09 << ch));
    }
  }
  return sig;
};

const delayValues = (asm: string): number[] =>
  Array.from(asm.matchAll(/;\s*DL\s+(\d+)/g)).map((m) => Number(m[1]));

const mixerWriteCount = (asm: string): number => (asm.match(/dc\.b \$7,\$[0-9A-F]+/g) || []).length;

describe('exportToAssembly compact strategy', () => {
  it('emits a two-byte tone line when only the fine period byte changes', () => {
    const s = song({ instrument: [inst({ pitch: env([0, 2, 4, 6, 8, 10, 12, 14]) })] });
    const compact = exportToAssembly(s, 'compact');
    const optimized = exportToAssembly(s, 'optimized');
    try {
      // Fine-only writes land as a lone R0 pair: `dc.b $0,$ll`.
      expect(compact).toMatch(/dc\.b \$0,\$[0-9A-F]+\s*;\s*TA/);
      // The optimized path always emits the four-byte pair for a tone change.
      expect(optimized).not.toMatch(/dc\.b \$0,/);
      expect(commandBytes(compact).length).toBeLessThan(commandBytes(optimized).length);
    } catch (error) {
      console.log(compact);
      throw error;
    }
  });

  it('emits a two-byte coarse line when only the high period byte changes', () => {
    // A synthetic pitch delta of 256 moves the C-4 period 0x1DD to 0x0DD -
    // same fine byte, coarse 1 -> 0. The delta exceeds the UI pitch range on
    // purpose: the fixture exercises the coarse-only emission path.
    const s = song({ instrument: [inst({ pitch: env([0, 256]) })] });
    const compact = exportToAssembly(s, 'compact');
    try {
      expect(compact).toMatch(/dc\.b \$1,\$0+\s*;\s*TA/);
      expect(compact).not.toMatch(/dc\.b \$1,\$0+,\$0,\$DD/);
    } catch (error) {
      console.log(compact);
      throw error;
    }
  });

  it('splits merged delays at the 256-frame command maximum', () => {
    // One playlist position of 160 rows at speed 4 produces a ~318-frame run
    // of identical frames after the first row's note - past the 256 frames a
    // single $FF,N command can hold.
    const steps = Array.from({ length: 160 }, (_, i) =>
      i === 0
        ? { note: { note: 'C', octave: 4, instrument: '00' }, volume: null }
        : { note: null, volume: null },
    );
    const s = song({ length: 160, pattern: [{ id: '00', name: 'P0', step: steps }] });
    const compact = exportToAssembly(s, 'compact');
    const complex = exportToAssembly(s, 'complex');
    try {
      const compactDelays = delayValues(compact);
      const complexDelays = delayValues(complex);
      expect(compactDelays.length).toBeGreaterThan(1);
      expect(Math.max(...compactDelays)).toBeLessThanOrEqual(256);
      expect(compactDelays.reduce((acc, n) => acc + n, 0)).toBe(
        complexDelays.reduce((acc, n) => acc + n, 0),
      );
      // The optimized merge stays unbounded for byte identity - this fixture
      // shows the >256-frame count compact now splits.
      const optimizedDelays = delayValues(exportToAssembly(s, 'optimized'));
      expect(optimizedDelays.some((n) => n > 256)).toBe(true);
    } catch (error) {
      console.log(compact.slice(0, 2000));
      throw error;
    }
  });

  it('drops mixer writes that only change silent-channel bits', () => {
    // Volume dies at step 1 while mode flips the channel to noise: the mixer
    // change only touches a channel the listener cannot hear.
    const s = song({
      instrument: [inst({ volume: env([15, 0]), mode: env([0, 1]), noise: env([4]) })],
    });
    const compact = exportToAssembly(s, 'compact');
    const complex = exportToAssembly(s, 'complex');
    try {
      expect(mixerWriteCount(complex)).toBeGreaterThanOrEqual(2);
      expect(mixerWriteCount(compact)).toBe(1);
      expect(compact).not.toContain('dc.b $7,$31');
    } catch (error) {
      console.log(compact, complex);
      throw error;
    }
  });

  it('re-emits the mixer when a channel with changed enable bits becomes audible', () => {
    // Volume returns at step 2 while the channel is still noise-only: the
    // mixer write deferred by the silent frame must land exactly then.
    const s = song({
      instrument: [inst({ volume: env([15, 0, 15]), mode: env([0, 1]), noise: env([4]) })],
    });
    const compact = exportToAssembly(s, 'compact');
    try {
      expect(compact).toContain('dc.b $7,$31');
      expect(mixerWriteCount(compact)).toBe(2);
    } catch (error) {
      console.log(compact);
      throw error;
    }
  });

  it('does not rewrite unchanged tone registers across playlist positions', () => {
    // A '--' entry keeps the held note sounding across the boundary; complex
    // and optimized force a TA rewrite after the marker, compact does not.
    const s = song({
      line: [
        { A: '00', B: '--', C: '--' },
        { A: '--', B: '--', C: '--' },
      ],
    });
    const compact = exportToAssembly(s, 'compact');
    const optimized = exportToAssembly(s, 'optimized');
    try {
      const toneLines = (asm: string) => (asm.match(/;\s*T[ABC] /g) || []).length;
      expect(toneLines(optimized)).toBeGreaterThan(toneLines(compact));
      expect(toneLines(compact)).toBe(1);
    } catch (error) {
      console.log(compact, optimized);
      throw error;
    }
  });

  it('silences only the channels still audible in the END block', () => {
    // Only channel A plays; B and C stay at volume zero, so their zero writes
    // are redundant under compact.
    const s = song();
    const compact = exportToAssembly(s, 'compact');
    const optimized = exportToAssembly(s, 'optimized');
    try {
      const compactEnd = compact.slice(compact.indexOf('; END'));
      const optimizedEnd = optimized.slice(optimized.indexOf('; END'));
      expect(compactEnd).toContain('dc.b $8,$0');
      expect(compactEnd).not.toContain('dc.b $9,$0');
      expect(compactEnd).not.toContain('dc.b $A,$0');
      expect(optimizedEnd).toContain('dc.b $9,$0');
      expect(optimizedEnd).toContain('dc.b $A,$0');
    } catch (error) {
      console.log(compact);
      throw error;
    }
  });

  it('produces a replay-equivalent stream: identical audible register state per frame', () => {
    // Rich fixture: pitch movement, a noise-mode flip during silence, volume
    // returning, and noise writes on top.
    const s = song({
      instrument: [
        inst({
          volume: env([15, 0, 15, 15, 14, 12, 8, 4]),
          mode: env([0, 1, 1, 0, 0, 2, 2, 0]),
          pitch: env([0, 4, 8, 4, 0, 2, 6, 10]),
          noise: env([0, 4, 6, 0, 0, 8, 8, 0]),
        }),
      ],
    });
    const complexFrames = decodeFrames(exportToAssembly(s, 'complex'));
    const compactFrames = decodeFrames(exportToAssembly(s, 'compact'));
    try {
      expect(compactFrames.length).toBe(complexFrames.length);
      for (let i = 0; i < complexFrames.length; i++) {
        expect(audibleSignature(compactFrames[i])).toEqual(audibleSignature(complexFrames[i]));
      }
    } catch (error) {
      console.log('complex frames', complexFrames.length, 'compact frames', compactFrames.length);
      throw error;
    }
  });

  it('keeps the existing strategies free of compact emission shapes', () => {
    const s = song({ instrument: [inst({ pitch: env([0, 2, 4, 6]) })] });
    try {
      for (const strategy of ['simple', 'complex', 'optimized'] as const) {
        const asm = exportToAssembly(s, strategy);
        // Tone changes always arrive as the four-byte coarse+fine pair.
        expect(asm).not.toMatch(/dc\.b \$0,\$[0-9A-F]+\s*;\s*TA/);
        expect(asm).not.toMatch(/dc\.b \$1,\$[0-9A-F]+\s*;\s*TA/);
      }
    } catch (error) {
      console.log('strategy shape mismatch');
      throw error;
    }
  });

  it('feeds the compact stream through the binary export unchanged', () => {
    const s = song({ instrument: [inst({ pitch: env([0, 2, 4]) })] });
    try {
      const asmBytes = commandBytes(exportToAssembly(s, 'compact'));
      const binBytes = Array.from(exportToBinary(s, 'compact'));
      expect(binBytes).toEqual(asmBytes);
    } catch (error) {
      console.log('binary mismatch');
      throw error;
    }
  });

  it('shrinks the bundled demo song relative to optimized', () => {
    const bundled = parseSongFromYaml(readFileSync('test/fixtures/bundled-song.yaml', 'utf-8'));
    try {
      const compactBytes = commandBytes(exportToAssembly(bundled, 'compact')).length;
      const optimizedBytes = commandBytes(exportToAssembly(bundled, 'optimized')).length;
      expect(compactBytes).toBeLessThan(optimizedBytes);
    } catch (error) {
      console.log('bundled measurement failed');
      throw error;
    }
  });
});

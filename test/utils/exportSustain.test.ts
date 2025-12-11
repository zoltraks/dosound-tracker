import { describe, it, expect } from 'vitest';
import { parseSongFromYaml } from '../../src/utils/songParser';
import { exportSongRegisterDump } from '../../src/exports/asm';
import { exportSongToVgm } from '../../src/exports/vgm';

const SUSTAIN_SONG_YAML = `
song:
  title: Sustain Test
  author: Test
  year: 2025
  speed: 6
  length: 4
  loop: 0
  playlist:
    - A: "01"
  pattern:
    - number: "01"
      steps:
        - note: "C-4"
          instrument: "00"
        - space: true
        - off: true
        - space: true
  instrument:
    - number: "00"
      sustain: 0
      volume: [15, 14, 13, 12, 11, 10]
`;

function extractVaFromRegisterDump(content: string): number[] {
  const lines = content.split('\n').filter(line => line.startsWith('\tdc.b '));

  return lines.map(line => {
    const [, bytePart] = line.split('dc.b ');
    const parts = bytePart.split(',');
    const bytes = parts.map(part => {
      const hex = part.trim().replace('$', '');
      return parseInt(hex, 16) || 0;
    });

    // VA is the 9th byte: [TA fine, TA coarse, TB fine, TB coarse,
    // TC fine, TC coarse, NS, MX, VA, VB, VC]
    return bytes[8] ?? 0;
  });
}

function extractVaFramesFromVgm(buffer: ArrayBuffer): number[] {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  const dataOffsetRel = view.getUint32(0x34, true);
  const dataStart = 0x34 + dataOffsetRel;

  const frames: number[] = [];
  let currentVa = 0;

  for (let i = dataStart; i < bytes.length; ) {
    const cmd = bytes[i];

    if (cmd === 0xa0 && i + 2 < bytes.length) {
      const reg = bytes[i + 1];
      const value = bytes[i + 2];
      if (reg === 0x08) {
        currentVa = value & 0x0f;
      }
      i += 3;
      continue;
    }

    if (cmd === 0x63) {
      // 1/60 second wait: one sequencer tick in our exporter
      frames.push(currentVa);
      i += 1;
      continue;
    }

    if (cmd === 0x66) {
      break;
    }

    // Unexpected command type - stop parsing to keep the test stable
    break;
  }

  return frames;
}

describe('sustain and note-off handling', () => {
  it('holds volume at sustain until note-off, then releases, for both dump and VGM export', () => {
    const song = parseSongFromYaml(SUSTAIN_SONG_YAML);

    const { content } = exportSongRegisterDump(song);
    const { buffer } = exportSongToVgm(song);

    const vaDump = extractVaFromRegisterDump(content);
    expect(vaDump.length).toBeGreaterThan(0);

    const firstVa = vaDump[0];

    // In the register dump, ticksPerRow = speed / 2 = 3.
    // Our test pattern has two rows before the OFF line, so 3 * 2 = 6 ticks.
    const dumpPreOffTicks = 6;
    const vaDumpPreOff = vaDump.slice(0, dumpPreOffTicks);
    expect(vaDumpPreOff.every(v => v === firstVa)).toBe(true);

    const vaDumpPostOff = vaDump.slice(dumpPreOffTicks);
    expect(vaDumpPostOff.some(v => v < firstVa)).toBe(true);

    const vaFrames = extractVaFramesFromVgm(buffer);
    expect(vaFrames.length).toBeGreaterThan(0);

    // In the VGM export, ticksPerRow = speed = 6.
    // Two rows before OFF => 12 frames.
    const vgmPreOffFrames = 12;
    const vaVgmPreOff = vaFrames.slice(0, vgmPreOffFrames);
    expect(vaVgmPreOff.length).toBe(vgmPreOffFrames);
    expect(vaVgmPreOff.every(v => v === firstVa)).toBe(true);

    const vaVgmPostOff = vaFrames.slice(vgmPreOffFrames);
    expect(vaVgmPostOff.some(v => v < firstVa)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { parseSongFromYaml } from '../../src/utils/songParser';
import { exportSongRegisterDump } from '../../src/utils/assemblyExport';

describe('exportSongRegisterDump', () => {
  it('exports correct register dump for Noise Test song', () => {
    const yaml = `
song:
  title: Noise Test
  year: 2025
  speed: 2
  length: 4
  playlist:
    - A: "00"
    - B: "00"
    - C: "00"
    - {}
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      volume: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      noise: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      mode: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
`;

    const song = parseSongFromYaml(yaml);
    const { content } = exportSongRegisterDump(song);

    const expected = [
      'music:',
      '\tdc.b $DD,$01,$00,$00,$00,$00,$04,$31,$01,$00,$00',
      '\tdc.b $DD,$01,$00,$00,$00,$00,$05,$31,$02,$00,$00',
      '\tdc.b $DD,$01,$00,$00,$00,$00,$06,$31,$03,$00,$00',
      '\tdc.b $DD,$01,$00,$00,$00,$00,$07,$31,$04,$00,$00',
      '\tdc.b $DD,$01,$DD,$01,$00,$00,$04,$23,$05,$01,$00',
      '\tdc.b $DD,$01,$DD,$01,$00,$00,$05,$23,$06,$02,$00',
      '\tdc.b $DD,$01,$DD,$01,$00,$00,$06,$23,$07,$03,$00',
      '\tdc.b $DD,$01,$DD,$01,$00,$00,$07,$23,$08,$04,$00',
      '\tdc.b $DD,$01,$DD,$01,$DD,$01,$04,$07,$09,$05,$01',
      '\tdc.b $DD,$01,$DD,$01,$DD,$01,$05,$07,$0A,$06,$02',
      '\tdc.b $DD,$01,$DD,$01,$DD,$01,$06,$07,$0B,$07,$03',
      '\tdc.b $DD,$01,$DD,$01,$DD,$01,$07,$07,$0C,$08,$04',
      '\tdc.b $DD,$01,$DD,$01,$DD,$01,$08,$07,$0D,$09,$05',
      '\tdc.b $DD,$01,$DD,$01,$DD,$01,$09,$07,$0E,$0A,$06',
      '\tdc.b $DD,$01,$DD,$01,$DD,$01,$0A,$07,$0F,$0B,$07',
      '\tdc.b $DD,$01,$DD,$01,$DD,$01,$0B,$07,$0E,$0C,$08',
    ].join('\n') + '\n';

    expect(content).toBe(expected);
  });
});

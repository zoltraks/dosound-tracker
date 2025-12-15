import { describe, it, expect } from 'vitest';
import { parseSongFromYaml } from '../../src/utils/songParser';
import { exportToAssembly } from '../../src/exports/asm';

const OPTIMIZED_SONG_YAML = `
song:
  title: Optimize Test
  author: Test
  year: 2025
  speed: 8
  length: 1
  line:
    - A: "00"
      B: "--"
      C: "--"
  pattern:
    - number: "00"
      steps:
        - note: "C-4"
          instrument: "00"
  instrument:
    - number: "00"
      volume: [15,15,15,15]
      noise: [0,0,0,0]
      mode: [0,0,0,0]
`;

describe('exportToAssembly optimized strategy', () => {
  it('combines consecutive delay frames when using optimized strategy', () => {
    const song = parseSongFromYaml(OPTIMIZED_SONG_YAML);

    const complexAsm = exportToAssembly(song, 'complex');
    const optimizedAsm = exportToAssembly(song, 'optimized');

    const complexDelays = Array.from(complexAsm.matchAll(/DL\s+(\d+)/g));
    const optimizedDelays = Array.from(optimizedAsm.matchAll(/DL\s+(\d+)/g));

    expect(complexDelays.length).toBeGreaterThan(0);
    expect(optimizedDelays.length).toBeGreaterThan(0);

    const sumComplex = complexDelays.reduce((acc, m) => acc + Number(m[1] || 0), 0);
    const sumOptimized = optimizedDelays.reduce((acc, m) => acc + Number(m[1] || 0), 0);
    expect(sumOptimized).toBe(sumComplex);

    const complexDelay2Count = complexDelays.filter(m => Number(m[1]) === 2).length;
    const optimizedDelay2Count = optimizedDelays.filter(m => Number(m[1]) === 2).length;

    // For this fixture we expect at least one DL 2 in the complex output
    // and fewer DL 2 entries after optimization.
    expect(complexDelay2Count).toBeGreaterThan(0);
    expect(optimizedDelay2Count).toBeLessThan(complexDelay2Count);

    // Optimized output should contain at least one delay longer than 2 frames,
    // indicating that multiple DL 2 entries have been merged.
    const hasLongDelayOptimized = optimizedDelays.some(m => Number(m[1]) > 2);
    expect(hasLongDelayOptimized).toBe(true);
  });
});

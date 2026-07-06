import { describe, it, expect } from 'vitest';
import { compressZX0, decompressZX0 } from '../../src/utils/zx0';

function roundTrip(input: Uint8Array): void {
  const compressed = compressZX0(input);
  const decompressed = decompressZX0(compressed);
  expect(decompressed).toEqual(input);
}

describe('ZX0 compression', () => {
  it('round-trips a single byte', () => {
    roundTrip(new Uint8Array([0x42]));
  });

  it('round-trips two bytes', () => {
    roundTrip(new Uint8Array([0x42, 0x43]));
  });

  it('round-trips a run of zeros', () => {
    roundTrip(new Uint8Array(256));
  });

  it('round-trips a repeating two-byte pattern', () => {
    const input = new Uint8Array(256);
    for (let i = 0; i < input.length; i++) input[i] = i & 1 ? 0xab : 0xcd;
    roundTrip(input);
  });

  it('round-trips an ascending byte sequence', () => {
    const input = new Uint8Array(512);
    for (let i = 0; i < input.length; i++) input[i] = i & 0xff;
    roundTrip(input);
  });

  it('round-trips a pseudo-random buffer deterministically', () => {
    let seed = 0xdeadbeef >>> 0;
    const input = new Uint8Array(1000);
    for (let i = 0; i < input.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      input[i] = seed & 0xff;
    }
    roundTrip(input);
  });

  it('round-trips a 1000-byte frame-shaped payload with structured repetition', () => {
    const input = new Uint8Array(1000);
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 40; col++) {
        input[row * 40 + col] = col < 10 ? 0x20 : col < 30 ? (row & 0xff) : 0xa0;
      }
    }
    roundTrip(input);
  });

  it('compresses repetitive data to substantially fewer bytes', () => {
    const input = new Uint8Array(1024);
    input.fill(0x20);
    const compressed = compressZX0(input);
    expect(compressed.length).toBeLessThan(input.length / 8);
  });

  it('rejects empty input', () => {
    expect(() => compressZX0(new Uint8Array(0))).toThrow();
  });

  it('respects maxOffset: 1023 by producing a valid stream that round-trips with the standard decompressor', () => {
    // Build a 2048-byte input where the second half repeats the first half.
    // With maxOffset 1023 the compressor cannot reference the first half from
    // the second half (distance >= 1024), so it must emit literals instead of
    // long back-references. The output must still be a valid ZX0 stream that
    // the standard (unbounded) decompressor can decode.
    const input = new Uint8Array(2048);
    for (let i = 0; i < 1024; i++) {
      input[i] = i & 0xff;
      input[i + 1024] = input[i];
    }
    const compressed = compressZX0(input, { maxOffset: 1023 });
    const decompressed = decompressZX0(compressed);
    expect(decompressed).toEqual(input);
  });

  it('compresses the same input more tightly without the maxOffset constraint', () => {
    // Build a 2048-byte input where the first 1024 bytes are pseudo-random
    // (using all 4 bytes of each LCG step to avoid short-period low-byte
    // repetition) and the second 1024 bytes are identical to the first.
    // The unconstrained compressor can use a back-reference at offset 1024,
    // while the constrained one (maxOffset 1023) must emit the second half
    // as literals.
    let seed = 0x12345678 >>> 0;
    const input = new Uint8Array(2048);
    for (let i = 0; i < 1024; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      input[i] = (seed >>> 24) & 0xff;
      input[i + 1] = (seed >>> 16) & 0xff;
      input[i + 2] = (seed >>> 8) & 0xff;
      input[i + 3] = seed & 0xff;
      input[i + 1024] = input[i];
      input[i + 1025] = input[i + 1];
      input[i + 1026] = input[i + 2];
      input[i + 1027] = input[i + 3];
    }
    const constrained = compressZX0(input, { maxOffset: 1023 });
    const unconstrained = compressZX0(input);
    expect(unconstrained.length).toBeLessThan(constrained.length);
  });
});

describe('ZX0 decompression', () => {
  it('rejects truncated input', () => {
    expect(() => decompressZX0(new Uint8Array(0))).toThrow();
  });

  it('rejects an invalid back-reference', () => {
    expect(() => decompressZX0(new Uint8Array([0x00]))).toThrow();
  });
});

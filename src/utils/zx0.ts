/**
 * ZX0 v2 optimal compressor and decompressor.
 *
 * Algorithm ported from Einar Saukas's Salvador reference implementation,
 * BSD 3-Clause licensed.
 *   Source: https://github.com/einar-saukas/ZX0
 *   (c) Copyright 2021 by Einar Saukas. All rights reserved.
 *
 * This port preserves Salvador's dynamic-programming optimal parser and bit
 * stream emitter exactly, so output bytes match Salvador (v2 format, forward,
 * non-classic) byte-for-byte for any given input.
 */

const INITIAL_OFFSET = 1;
const MAX_OFFSET_ZX0 = 32640;

interface Block {
  bits: number;
  index: number;
  offset: number;
  chain: Block | null;
}

function offsetCeiling(index: number, offsetLimit: number): number {
  if (index > offsetLimit) return offsetLimit;
  if (index < INITIAL_OFFSET) return INITIAL_OFFSET;
  return index;
}

function eliasGammaBits(value: number): number {
  let bits = 1;
  let v = value;
  while ((v >>>= 1) !== 0) bits += 2;
  return bits;
}

function optimize(input: Uint8Array, skip: number, offsetLimit: number): Block {
  const inputSize = input.length;
  const maxOffsetEver = offsetCeiling(inputSize - 1, offsetLimit);

  const lastLiteral: (Block | null)[] = new Array(maxOffsetEver + 1).fill(null);
  const lastMatch: (Block | null)[] = new Array(maxOffsetEver + 1).fill(null);
  const optimal: (Block | null)[] = new Array(inputSize).fill(null);
  const matchLength: number[] = new Array(maxOffsetEver + 1).fill(0);
  const bestLength: number[] = new Array(inputSize).fill(0);

  if (inputSize > 2) bestLength[2] = 2;

  lastMatch[INITIAL_OFFSET] = {
    bits: -1,
    index: skip - 1,
    offset: INITIAL_OFFSET,
    chain: null,
  };

  for (let index = skip; index < inputSize; index++) {
    let bestLengthSize = 2;
    const maxOffset = offsetCeiling(index, offsetLimit);

    for (let offset = 1; offset <= maxOffset; offset++) {
      if (
        index !== skip &&
        index >= offset &&
        input[index] === input[index - offset]
      ) {
        const ll = lastLiteral[offset];
        if (ll) {
          const length = index - ll.index;
          const bits = ll.bits + 1 + eliasGammaBits(length);
          const block: Block = { bits, index, offset, chain: ll };
          lastMatch[offset] = block;
          const cur = optimal[index];
          if (!cur || cur.bits > bits) optimal[index] = block;
        }

        matchLength[offset]++;
        if (matchLength[offset] > 1) {
          if (bestLengthSize < matchLength[offset]) {
            let bits =
              optimal[index - bestLength[bestLengthSize]]!.bits +
              eliasGammaBits(bestLength[bestLengthSize] - 1);
            do {
              bestLengthSize++;
              const bits2 =
                optimal[index - bestLengthSize]!.bits +
                eliasGammaBits(bestLengthSize - 1);
              if (bits2 <= bits) {
                bestLength[bestLengthSize] = bestLengthSize;
                bits = bits2;
              } else {
                bestLength[bestLengthSize] = bestLength[bestLengthSize - 1];
              }
            } while (bestLengthSize < matchLength[offset]);
          }
          const length = bestLength[matchLength[offset]];
          const bits =
            optimal[index - length]!.bits +
            8 +
            eliasGammaBits(Math.floor((offset - 1) / 128) + 1) +
            eliasGammaBits(length - 1);
          const lm = lastMatch[offset];
          if (!lm || lm.index !== index || lm.bits > bits) {
            const block: Block = {
              bits,
              index,
              offset,
              chain: optimal[index - length],
            };
            lastMatch[offset] = block;
            const cur = optimal[index];
            if (!cur || cur.bits > bits) optimal[index] = block;
          }
        }
      } else {
        matchLength[offset] = 0;
        const lm = lastMatch[offset];
        if (lm) {
          const length = index - lm.index;
          const bits = lm.bits + 1 + eliasGammaBits(length) + length * 8;
          const block: Block = { bits, index, offset: 0, chain: lm };
          lastLiteral[offset] = block;
          const cur = optimal[index];
          if (!cur || cur.bits > bits) optimal[index] = block;
        }
      }
    }
  }

  return optimal[inputSize - 1]!;
}

function compress(
  optimal: Block,
  input: Uint8Array,
  skip: number,
  backwardsMode: boolean,
  invertMode: boolean
): Uint8Array {
  const outputSize = Math.floor((optimal.bits + 25) / 8);
  const output = new Uint8Array(outputSize);

  let prev: Block | null = null;
  let cur: Block | null = optimal;
  while (cur) {
    const next: Block | null = cur.chain;
    cur.chain = prev;
    prev = cur;
    cur = next;
  }

  let outputIndex = 0;
  let bitIndex = 0;
  let bitMask = 0;
  let backtrack = true;
  let inputIndex = skip;
  let lastOffset = INITIAL_OFFSET;

  function writeByte(value: number): void {
    output[outputIndex++] = value & 0xff;
  }

  function writeBit(value: number): void {
    if (backtrack) {
      if (value) output[outputIndex - 1] |= 1;
      backtrack = false;
      return;
    }
    if (!bitMask) {
      bitMask = 128;
      bitIndex = outputIndex;
      writeByte(0);
    }
    if (value) output[bitIndex] |= bitMask;
    bitMask >>>= 1;
  }

  function writeInterlacedEliasGamma(
    value: number,
    bwd: boolean,
    inv: boolean
  ): void {
    let i = 2;
    while (i <= value) i <<= 1;
    i >>>= 1;
    while ((i >>>= 1) !== 0) {
      writeBit(bwd ? 1 : 0);
      const bit = value & i ? 1 : 0;
      writeBit(inv ? 1 - bit : bit);
    }
    writeBit(bwd ? 0 : 1);
  }

  let prevBlock = prev!;
  let block: Block | null = prevBlock.chain;
  while (block) {
    const length = block.index - prevBlock.index;

    if (!block.offset) {
      writeBit(0);
      writeInterlacedEliasGamma(length, backwardsMode, false);
      for (let j = 0; j < length; j++) writeByte(input[inputIndex++]);
    } else if (block.offset === lastOffset) {
      writeBit(0);
      writeInterlacedEliasGamma(length, backwardsMode, false);
      inputIndex += length;
    } else {
      writeBit(1);
      writeInterlacedEliasGamma(
        Math.floor((block.offset - 1) / 128) + 1,
        backwardsMode,
        invertMode
      );
      if (backwardsMode) {
        writeByte(((block.offset - 1) % 128) << 1);
      } else {
        writeByte((127 - ((block.offset - 1) % 128)) << 1);
      }
      backtrack = true;
      writeInterlacedEliasGamma(length - 1, backwardsMode, false);
      inputIndex += length;
      lastOffset = block.offset;
    }

    prevBlock = block;
    block = block.chain;
  }

  writeBit(1);
  writeInterlacedEliasGamma(256, backwardsMode, invertMode);

  return output;
}

/**
 * Optimally compress `input` as a ZX0 v2 stream (forward, non-classic).
 * Output is byte-for-byte equivalent to Salvador's default invocation.
 *
 * @param options.maxOffset - Maximum back-reference distance in bytes.
 *   Defaults to MAX_OFFSET_ZX0 (32640). Set to 1023 for ring-buffer output
 *   where the decompressor's sliding window is limited to 1024 bytes.
 */
export function compressZX0(
  input: Uint8Array,
  options?: { maxOffset?: number }
): Uint8Array {
  if (input.length === 0) {
    throw new Error('ZX0 cannot compress an empty input');
  }
  if (input.length === 1) {
    // Salvador requires input_size > skip; a single-byte input is a literal
    // sequence of length 1 followed by the end marker. The optimizer's
    // bestLength[2] init assumes inputSize > 2, but the literal-only path
    // handles short inputs correctly through the lastMatch fake-start block.
  }
  const offsetLimit = options?.maxOffset ?? MAX_OFFSET_ZX0;
  const optimal = optimize(input, 0, offsetLimit);
  return compress(optimal, input, 0, false, true);
}

/**
 * Decompress a ZX0 v2 stream (forward, non-classic) produced by Salvador or
 * `compressZX0`. Used for round-trip verification in tests and for
 * application-side decode where needed.
 */
export function decompressZX0(input: Uint8Array): Uint8Array {
  const output: number[] = [];
  let inputIndex = 0;
  let bitMask = 0;
  let bitValue = 0;
  let backtrack = false;
  let lastByte = 0;
  let lastOffset = INITIAL_OFFSET;

  function readByte(): number {
    if (inputIndex >= input.length) {
      throw new Error('ZX0 input truncated');
    }
    lastByte = input[inputIndex++];
    return lastByte;
  }

  function readBit(): number {
    if (backtrack) {
      backtrack = false;
      return lastByte & 1;
    }
    bitMask >>>= 1;
    if (bitMask === 0) {
      bitMask = 128;
      bitValue = readByte();
    }
    return bitValue & bitMask ? 1 : 0;
  }

  function readInterlacedEliasGamma(inverted: boolean): number {
    let value = 1;
    while (!readBit()) {
      const bit = readBit();
      value = (value << 1) | (inverted ? 1 - bit : bit);
    }
    return value;
  }

  function writeBytes(offset: number, length: number): void {
    if (offset > output.length) {
      throw new Error('ZX0 invalid back-reference');
    }
    for (let n = 0; n < length; n++) {
      output.push(output[output.length - offset]);
    }
  }

  let state: 'literals' | 'newOffset' = 'literals';

  while (true) {
    if (state === 'literals') {
      const length = readInterlacedEliasGamma(false);
      for (let i = 0; i < length; i++) output.push(readByte());
      if (readBit()) {
        state = 'newOffset';
        continue;
      }
      // copy from last offset
      const repLength = readInterlacedEliasGamma(false);
      writeBytes(lastOffset, repLength);
      state = readBit() ? 'newOffset' : 'literals';
      continue;
    }

    // newOffset
    const high = readInterlacedEliasGamma(true);
    if (high === 256) break;
    lastOffset = high * 128 - (readByte() >>> 1);
    backtrack = true;
    const length = readInterlacedEliasGamma(false) + 1;
    writeBytes(lastOffset, length);
    state = readBit() ? 'newOffset' : 'literals';
  }

  return Uint8Array.from(output);
}

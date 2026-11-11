// @vitest-environment node

import { describe, it, expect, vi } from 'vitest';
import { RegisterFile } from '../../src/synth/registerFile.ts';

describe('RegisterFile', () => {
  it('stores masked values and flushes the written pair', () => {
    const onFlush = vi.fn();
    const file = new RegisterFile(onFlush, 16);

    file.write(8, 0x10f);

    expect(file.read(8)).toBe(0x0f);
    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith([[8, 0x0f]]);
  });

  it('ignores out-of-range registers and duplicate writes', () => {
    const onFlush = vi.fn();
    const file = new RegisterFile(onFlush, 16);

    file.write(-1, 0x01);
    file.write(16, 0x01);
    file.write(8, 0x0f);
    file.write(8, 0x0f);

    expect(file.read(16)).toBe(0);
    expect(file.read(8)).toBe(0x0f);
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it('coalesces batched writes into a single flush in order', () => {
    const onFlush = vi.fn();
    const file = new RegisterFile(onFlush, 16);

    file.beginBatch();
    file.write(0, 0x1c);
    file.write(1, 0x01);
    file.write(8, 0x0f);
    expect(onFlush).not.toHaveBeenCalled();
    file.endBatch();

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith([
      [0, 0x1c],
      [1, 0x01],
      [8, 0x0f],
    ]);
  });

  it('flushes once for nested batches at depth zero', () => {
    const onFlush = vi.fn();
    const file = new RegisterFile(onFlush, 16);

    file.beginBatch();
    file.write(0, 0x1c);
    file.beginBatch();
    file.write(1, 0x01);
    file.endBatch();
    expect(onFlush).not.toHaveBeenCalled();
    file.endBatch();

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith([
      [0, 0x1c],
      [1, 0x01],
    ]);
  });

  it('flushes nothing for an empty or unbalanced batch', () => {
    const onFlush = vi.fn();
    const file = new RegisterFile(onFlush, 16);

    file.beginBatch();
    file.endBatch();
    file.endBatch();

    expect(onFlush).not.toHaveBeenCalled();
  });

  it('force stores without dedup or flush', () => {
    const onFlush = vi.fn();
    const file = new RegisterFile(onFlush, 16);

    file.write(8, 0x0f);
    file.force(8, 0x00);

    expect(file.read(8)).toBe(0);
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it('zero clears the mirror and readers return copies', () => {
    const onFlush = vi.fn();
    const file = new RegisterFile(onFlush, 16);

    file.write(0, 0x1c);
    file.write(8, 0x0f);
    const snapshot = file.snapshot();
    const array = file.toArray();
    file.zero();

    expect(snapshot[0]).toBe(0x1c);
    expect(array[8]).toBe(0x0f);
    expect(file.read(0)).toBe(0);
    expect(file.read(8)).toBe(0);
    expect(file.raw()).toEqual(new Array(16).fill(0));
  });
});

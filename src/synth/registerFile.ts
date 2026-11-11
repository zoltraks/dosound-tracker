import type { YMRegisters } from './YM2149.ts';

// Shared YM register mirror for both sound engines: bounds and mask checks,
// write deduplication, and nested beginBatch/endBatch coalescing. The owning
// engine supplies one onFlush callback for its own side effect - the internal
// engine recomputes state and audio nodes, the Ayumi engine posts messages to
// its worklet.
export class RegisterFile {
  private registers: number[];
  private batchDepth = 0;
  private pending: Array<[number, number]> = [];
  private readonly onFlush: (pairs: Array<[number, number]>) => void;

  constructor(onFlush: (pairs: Array<[number, number]>) => void, size: number) {
    this.onFlush = onFlush;
    this.registers = new Array<number>(size).fill(0);
  }

  write(register: number, value: number): void {
    if (register < 0 || register >= this.registers.length) return;

    const masked = value & 0xff;
    if (this.registers[register] === masked) return;

    this.registers[register] = masked;

    if (this.batchDepth > 0) {
      this.pending.push([register, masked]);
      return;
    }

    this.onFlush([[register, masked]]);
  }

  // Direct store for silence/reset paths that must bypass dedup and batching;
  // the caller runs its own flush afterwards.
  force(register: number, value: number): void {
    if (register < 0 || register >= this.registers.length) return;
    this.registers[register] = value & 0xff;
  }

  beginBatch(): void {
    this.batchDepth += 1;
  }

  endBatch(): void {
    this.batchDepth = Math.max(0, this.batchDepth - 1);
    if (this.batchDepth === 0 && this.pending.length > 0) {
      const pairs = this.pending;
      this.pending = [];
      this.onFlush(pairs);
    }
  }

  read(register: number): number {
    return this.registers[register] ?? 0;
  }

  // Live view for state decoders like deriveYmState; callers must not mutate.
  raw(): number[] {
    return this.registers;
  }

  snapshot(): YMRegisters {
    return { ...this.registers };
  }

  toArray(): number[] {
    return Array.from({ length: this.registers.length }, (_, i) => this.registers[i] || 0);
  }

  zero(): void {
    this.registers.fill(0);
  }
}

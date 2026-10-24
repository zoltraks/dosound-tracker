import { describe, it, expect, vi } from 'vitest';
import { scheduleJsonSave, clearScheduledSave } from '../../src/hooks/useStorage';
import { computeEffectiveVolume } from '../../src/utils/trackUtils';
import { parseAssemblyToBinary } from '../../src/exports/bin';
import {
  parseMidiConfigurationFromYaml,
  buildMidiConfigurationYaml,
  MidiConfigurationFormatError,
} from '../../src/utils/midiConfiguration';
import type { MidiConfiguration } from '../../src/utils/midiUtils';
import { StorageKeys } from '../../src/utils/storageKeys';
import type { MutableRefObject } from 'react';
import type { Pattern } from '../../src/synth/SoundDriver';
import yaml from 'js-yaml';

const ref = (): MutableRefObject<{ kind: 'timeout' | 'idle'; id: number } | null> => ({
  current: null,
});

describe('scheduleJsonSave reschedule and error branches', () => {
  it('clears a pending timeout before rescheduling', () => {
    vi.useFakeTimers();
    const r = ref();
    try {
      scheduleJsonSave(StorageKeys.SONG, { t: 1 } as never, r, 1000);
      const first = r.current;
      scheduleJsonSave(StorageKeys.SONG, { t: 2 } as never, r, 50);
      expect(r.current).not.toBe(first);
      vi.advanceTimersByTime(60);
      expect(localStorage.getItem(StorageKeys.SONG)).toBe(JSON.stringify({ t: 2 }));
    } catch (error) {
      console.log('reschedule mismatch');
      throw error;
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels a pending idle save when rescheduling', () => {
    const cancelled: number[] = [];
    const win = window as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const origIdle = win.requestIdleCallback;
    const origCancel = win.cancelIdleCallback;
    win.requestIdleCallback = () => 42;
    win.cancelIdleCallback = (id) => cancelled.push(id);
    const r = ref();
    try {
      scheduleJsonSave(StorageKeys.SONG, { t: 1 } as never, r, 10);
      scheduleJsonSave(StorageKeys.SONG, { t: 2 } as never, r, 10);
      expect(cancelled).toContain(42);
      clearScheduledSave(r);
      expect(cancelled.filter((c) => c === 42)).toHaveLength(2);
    } catch (error) {
      console.log('idle-cancel mismatch');
      throw error;
    } finally {
      win.requestIdleCallback = origIdle;
      win.cancelIdleCallback = origCancel;
    }
  });

  it('warns but survives when localStorage throws', () => {
    vi.useFakeTimers();
    const r = ref();
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
    try {
      scheduleJsonSave(StorageKeys.SONG, { t: 1 } as never, r, 10);
      expect(() => vi.advanceTimersByTime(20)).not.toThrow();
    } catch (error) {
      console.log('quota mismatch');
      throw error;
    } finally {
      Storage.prototype.setItem = original;
      vi.useRealTimers();
    }
  });
});

describe('computeEffectiveVolume', () => {
  const pattern = (volumes: (number | null | undefined)[]): Pattern => ({
    id: '00',
    name: 'P',
    step: volumes.map((v) => ({ note: null, volume: v as number | null })),
  });

  it('carries the last set volume forward', () => {
    try {
      expect(computeEffectiveVolume(pattern([5, null, null]), 2)).toBe(5);
      expect(computeEffectiveVolume(pattern([5, null, 9]), 2)).toBe(9);
      expect(computeEffectiveVolume(pattern([5, null, 9]), 1)).toBe(5);
      expect(computeEffectiveVolume(pattern([null, null]), 1)).toBe(15);
      expect(computeEffectiveVolume(null, 0)).toBe(15);
      expect(computeEffectiveVolume(pattern([99, null]), 1)).toBe(15);
    } catch (error) {
      console.log('volume-carry mismatch');
      throw error;
    }
  });
});

describe('parseAssemblyToBinary token edge cases', () => {
  it('skips bare $, non-hex, and non-$ tokens', () => {
    const asm = ['\tdc.b $08,$', '\tdc.b $zz,$1f', '\tdc.b xx,$09', '\tdc.b $ff,$00'].join('\n');
    try {
      expect(Array.from(parseAssemblyToBinary(asm))).toEqual([0x08, 0x1f, 0x09, 0xff, 0x00]);
    } catch (error) {
      console.log('token mismatch', parseAssemblyToBinary(asm));
      throw error;
    }
  });
});

describe('midiConfiguration yaml round-trip and coercion', () => {
  const current: MidiConfiguration = {
    inputEnabled: false,
    outputEnabled: false,
    inputId: 'in-a',
    outputId: 'out-a',
    ignoreInputVolume: false,
    ignoreOutputVolume: false,
  };

  it('builds yaml containing the midi root', () => {
    try {
      const text = buildMidiConfigurationYaml(current);
      const doc = yaml.load(text) as { midi: Record<string, unknown> };
      expect(doc.midi).toBeDefined();
    } catch (error) {
      console.log('build mismatch');
      throw error;
    }
  });

  it('coerces string and number booleans and ids', () => {
    const text = `
midi:
  input:
    enable: "yes"
    device: "  in-x  "
    agnostic: 1
  output:
    enable: "0"
    device: ""
    agnostic: "no"
`;
    try {
      const parsed = parseMidiConfigurationFromYaml(text, current);
      expect(parsed.inputEnabled).toBe(true);
      expect(parsed.inputId).toBe('in-x');
      expect(parsed.ignoreInputVolume).toBe(true);
      expect(parsed.outputEnabled).toBe(false);
      expect(parsed.outputId).toBeNull();
      expect(parsed.ignoreOutputVolume).toBe(false);
    } catch (error) {
      console.log('coerce mismatch');
      throw error;
    }
  });

  it('keeps fallbacks for unparseable values and rejects missing root', () => {
    const text = `
midi:
  input:
    enable: "maybe"
    device: 42
`;
    try {
      const parsed = parseMidiConfigurationFromYaml(text, current);
      expect(parsed.inputEnabled).toBe(false);
      expect(parsed.inputId).toBe('in-a');
      expect(() => parseMidiConfigurationFromYaml('song: {}', current)).toThrow(
        MidiConfigurationFormatError,
      );
    } catch (error) {
      console.log('fallback mismatch');
      throw error;
    }
  });
});

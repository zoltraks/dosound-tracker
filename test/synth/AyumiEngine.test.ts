// @vitest-environment node

import { describe, it, expect, vi } from 'vitest';
import { AyumiEngine, type AyumiWorkletNode } from '../../src/synth/AyumiEngine.ts';
import type { AyumiWorkletMessage } from '../../src/workers/ayumiWorklet.ts';
import type { Instrument } from '../../src/synth/SoundDriver.ts';

const makeNode = () => {
  const messages: AyumiWorkletMessage[] = [];
  const node: AyumiWorkletNode = {
    port: {
      postMessage: vi.fn((message: AyumiWorkletMessage) => {
        messages.push(message);
      }),
      close: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  return { node, messages };
};

const makeInstrument = (overrides: Partial<Instrument> = {}): Instrument => ({
  id: '00',
  name: 'inst',
  volume: [0x0f],
  shift: [0],
  pitch: [0],
  noise: [0],
  mode: [0],
  ...overrides,
});

describe('AyumiEngine register mirror and messaging', () => {
  it('posts a write message and mirrors the value', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    try {
      engine.writeRegister(8, 0x0f);
      expect(engine.getRegisters()[8]).toBe(0x0f);
      expect(messages).toEqual([{ type: 'write', register: 8, value: 0x0f }]);
    } catch (error) {
      console.log('mirror write mismatch:', JSON.stringify(messages));
      throw error;
    }
  });

  it('skips duplicate writes to the same register', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    engine.writeRegister(8, 0x0f);
    engine.writeRegister(8, 0x0f);
    try {
      expect(messages).toHaveLength(1);
    } catch (error) {
      console.log('dedup mismatch:', JSON.stringify(messages));
      throw error;
    }
  });

  it('masks values to a byte and ignores out-of-range registers', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    engine.writeRegister(8, 0x1ff);
    engine.writeRegister(16, 0x01);
    engine.writeRegister(-1, 0x01);
    try {
      expect(engine.getRegisters()[8]).toBe(0xff);
      expect(messages).toEqual([{ type: 'write', register: 8, value: 0xff }]);
    } catch (error) {
      console.log('mask mismatch:', JSON.stringify(messages));
      throw error;
    }
  });

  it('coalesces batched writes into one writes message', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    try {
      engine.beginBatch();
      engine.writeRegister(0, 0x1c);
      engine.writeRegister(1, 0x01);
      engine.endBatch();
      expect(messages).toEqual([
        {
          type: 'writes',
          pairs: [
            [0, 0x1c],
            [1, 0x01],
          ],
        },
      ]);
    } catch (error) {
      console.log('batch mismatch:', JSON.stringify(messages));
      throw error;
    }
  });

  it('silenceAll posts zeroed volume registers', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    engine.writeRegister(8, 0x0f);
    engine.writeRegister(9, 0x0f);
    engine.writeRegister(10, 0x0f);
    messages.length = 0;
    engine.silenceAll();
    try {
      expect(engine.getRegisters()[8]).toBe(0);
      expect(engine.getRegisters()[9]).toBe(0);
      expect(engine.getRegisters()[10]).toBe(0);
      expect(messages).toEqual([
        { type: 'write', register: 8, value: 0 },
        { type: 'write', register: 9, value: 0 },
        { type: 'write', register: 10, value: 0 },
      ]);
    } catch (error) {
      console.log('silence mismatch:', JSON.stringify(messages));
      throw error;
    }
  });

  it('reset zeroes the mirror and posts the reset message', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    engine.writeRegister(8, 0x0f);
    messages.length = 0;
    engine.reset();
    try {
      expect(engine.getRegistersArray().every((v) => v === 0)).toBe(true);
      expect(messages).toEqual([{ type: 'reset' }]);
    } catch (error) {
      console.log('reset mismatch:', JSON.stringify(messages));
      throw error;
    }
  });

  it('setClock posts a clock message and getClock reflects it', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    engine.setClock(1_000_000);
    try {
      expect(engine.getClock()).toBe(1_000_000);
      expect(messages).toEqual([{ type: 'clock', clock: 1_000_000 }]);
    } catch (error) {
      console.log('clock mismatch:', JSON.stringify(messages));
      throw error;
    }
  });

  it('getState derives the channel view from the mirror', () => {
    const { node } = makeNode();
    const engine = new AyumiEngine(node);
    engine.writeRegister(0, 0x34);
    engine.writeRegister(1, 0x02);
    engine.writeRegister(7, 0x3e);
    engine.writeRegister(8, 0x0c);
    const state = engine.getState();
    try {
      expect(state.channels[0].tonePeriod).toBe(0x234);
      expect(state.channels[0].toneEnabled).toBe(true);
      expect(state.channels[0].volume).toBe(0x0c);
      expect(state.channels[1].toneEnabled).toBe(false);
    } catch (error) {
      console.log('state mismatch:', JSON.stringify(state.channels));
      throw error;
    }
  });

  it('dispose closes the port and disconnects the node', () => {
    const { node } = makeNode();
    const engine = new AyumiEngine(node);
    engine.dispose();
    try {
      expect(node.port.close).toHaveBeenCalled();
      expect(node.disconnect).toHaveBeenCalled();
    } catch (error) {
      console.log('dispose mismatch');
      throw error;
    }
  });
});

describe('AyumiEngine instrument path', () => {
  it('routes updateChannelWithInstrument through batched writes', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    engine.updateChannelWithInstrument(0, makeInstrument(), { note: 'C', octave: 4 });
    try {
      expect(messages.some((m) => m.type === 'writes')).toBe(true);
      const pairs =
        messages.find((m) => m.type === 'writes')?.type === 'writes'
          ? (messages.find((m) => m.type === 'writes') as { pairs: [number, number][] }).pairs
          : [];
      const volumeWrite = pairs.find(([register]) => register === 8);
      const mixerWrite = pairs.find(([register]) => register === 7);
      expect(volumeWrite?.[1]).toBe(0x0f);
      expect(mixerWrite?.[1]).toBeDefined();
      expect(engine.getRegisters()[8]).toBe(0x0f);
    } catch (error) {
      console.log('instrument writes mismatch:', JSON.stringify(messages));
      throw error;
    }
  });

  it('silences the channel for a note-off', () => {
    const { node, messages } = makeNode();
    const engine = new AyumiEngine(node);
    engine.updateChannelWithInstrument(0, makeInstrument(), { note: '===', octave: 4 });
    try {
      expect(engine.getRegisters()[8]).toBe(0);
    } catch (error) {
      console.log('note-off mismatch:', JSON.stringify(messages));
      throw error;
    }
  });
});

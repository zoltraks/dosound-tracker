// @vitest-environment node

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createSoundEngine } from '../../src/synth/soundEngine.ts';
import { YM2149 } from '../../src/synth/YM2149.ts';
import { AyumiEngine } from '../../src/synth/AyumiEngine.ts';
import { DEFAULT_SOUND_ENGINE_ID } from '../../src/constants/sound.ts';
import { createAudioContextStub } from './audioContextStub.ts';

const makeAyumiContext = () => {
  const { context } = createAudioContextStub();
  const ctx = context as AudioContext & { audioWorklet: { addModule: ReturnType<typeof vi.fn> } };
  ctx.audioWorklet = { addModule: vi.fn(() => Promise.resolve()) };
  return ctx;
};

describe('createSoundEngine', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a YM2149 engine for the default internal id', async () => {
    const { context } = createAudioContextStub();
    const engine = await createSoundEngine(DEFAULT_SOUND_ENGINE_ID, context, 2000000);

    expect(engine).toBeInstanceOf(YM2149);
    expect(engine.getClock()).toBe(2000000);
    engine.dispose();
  });

  it('returns an AyumiEngine for the ayumi id', async () => {
    const context = makeAyumiContext();
    vi.stubGlobal(
      'AudioWorkletNode',
      class {
        port = { postMessage: vi.fn(), close: vi.fn() };
        connect = vi.fn();
        disconnect = vi.fn();
      },
    );

    const engine = await createSoundEngine('ayumi', context, 1000000);

    expect(engine).toBeInstanceOf(AyumiEngine);
    expect(engine.getClock()).toBe(1000000);
    engine.dispose();
  });
});

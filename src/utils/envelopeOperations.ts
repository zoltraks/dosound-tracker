export interface EnvelopeAdvanceResult {
  nextTickTime: number;
  subTick: number;
  rawStep: number;
}

export interface EnvelopeAdvanceArgs {
  now: number;
  nextTickTime: number | null | undefined;
  subTick: number | null | undefined;
  rawStep: number | null | undefined;
  sustainIndex: number | null | undefined;
  released: boolean;
  tickIntervalMs?: number;
}

export function advanceEnvelopeTick({
  now,
  nextTickTime,
  subTick,
  rawStep,
  sustainIndex,
  released,
  tickIntervalMs = 20,
}: EnvelopeAdvanceArgs): EnvelopeAdvanceResult {
  const interval = tickIntervalMs;

  let next = nextTickTime;
  if (!next) {
    next = now + interval;
  }

  let st = subTick ?? 0;
  let step = rawStep ?? 0;

  while (now >= next) {
    st = (st + 1) % 2;

    if (st === 0) {
      const sustain = sustainIndex;
      if (
        sustain === null ||
        sustain === undefined ||
        sustain < 0 ||
        released ||
        step < sustain
      ) {
        step = step + 1;
      }
    }

    next += interval;
  }

  return {
    nextTickTime: next,
    subTick: st,
    rawStep: step,
  };
}

export function resolveEnvelopeStep(
  rawStep: number,
  sustainIndex: number | null | undefined,
  released: boolean
): number {
  const sustain = sustainIndex;
  if (sustain !== null && sustain !== undefined && sustain >= 0 && !released && rawStep >= sustain) {
    return sustain;
  }

  return rawStep;
}

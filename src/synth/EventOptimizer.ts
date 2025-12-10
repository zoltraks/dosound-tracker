export type SoundEventLike = {
  type: 'register' | 'delay';
  register?: number;
  value?: number;
  delay?: number;
};

/**
 * Optimize a sequence of register/delay events by skipping redundant
 * register writes with unchanged values. Delay events always pass
 * through and reset the register history.
 */
export const optimizeEvents = <T extends SoundEventLike>(events: T[]): T[] => {
  const optimized: T[] = [];
  let lastRegisterValues: { [key: number]: number } = {};

  for (const event of events) {
    if (event.type === 'register' && event.register !== undefined && event.value !== undefined) {
      if (lastRegisterValues[event.register] !== event.value) {
        optimized.push(event);
        lastRegisterValues[event.register] = event.value;
      }
    } else if (event.type === 'delay') {
      optimized.push(event);
      // Clear register history on delay to allow re-sending same values
      lastRegisterValues = {};
    }
  }

  return optimized;
};

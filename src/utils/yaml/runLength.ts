export type RunLengthNode = {
  wait?: boolean | number;
  space?: boolean | number;
  off?: boolean | number;
  volume?: number;
  [key: string]: unknown;
};

// Expands run-length compressed step nodes (`wait: N`, `space: N`, `off: N`,
// with or without `volume`) into individual nodes. Expansion is bounded to the
// remaining capacity so a crafted count cannot exhaust memory.
export const expandRunNodes = <T>(
  rawNodes: unknown[],
  capacity: number,
  makeWait: (volume?: number) => T,
  makeOff: (volume?: number) => T,
): T[] => {
  const expanded: T[] = [];

  for (const node of rawNodes) {
    if (node && typeof node === 'object') {
      const ln = node as RunLengthNode;
      const keys = Object.keys(ln);
      const hasVolume = Object.prototype.hasOwnProperty.call(ln, 'volume');
      const onlySpaceOrOff = keys.every((k) => k === 'wait' || k === 'space' || k === 'off');
      const onlySpaceOffVolume = keys.every(
        (k) => k === 'wait' || k === 'space' || k === 'off' || k === 'volume',
      );

      const spaceVal = ln.wait ?? ln.space;
      const offVal = ln.off;
      const isNumericSpace =
        typeof spaceVal === 'number' && Number.isFinite(spaceVal) && spaceVal > 0;
      const isNumericOff = typeof offVal === 'number' && Number.isFinite(offVal) && offVal > 0;

      const rawCount =
        isNumericSpace || isNumericOff ? ((isNumericSpace ? spaceVal : offVal) as number) : 0;
      const count = Math.min(rawCount, Math.max(0, capacity - expanded.length));
      const isOff = isNumericOff && !isNumericSpace;

      if (!hasVolume && onlySpaceOrOff && (isNumericSpace || isNumericOff)) {
        for (let i = 0; i < count; i++) {
          expanded.push(isOff ? makeOff() : makeWait());
        }
        continue;
      }

      if (hasVolume && onlySpaceOffVolume && (isNumericSpace || isNumericOff)) {
        for (let i = 0; i < count; i++) {
          expanded.push(isOff ? makeOff(ln.volume) : makeWait(ln.volume));
        }
        continue;
      }

      if (hasVolume && keys.length === 1 && expanded.length < capacity) {
        expanded.push(makeWait(ln.volume));
        continue;
      }
    }

    expanded.push(node as T);
  }

  return expanded;
};

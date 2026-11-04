// Normalizes a raw speed value to the tracker contract: a positive integer,
// minimum 2, forced even. Non-positive or non-numeric input falls back to 6.
export const normalizeSongSpeed = (raw: unknown): number => {
  const speedRaw = Number(raw);
  const baseSpeed = Number.isFinite(speedRaw) && speedRaw > 0 ? Math.floor(speedRaw) : 6;
  const clampedSpeed = Math.max(2, baseSpeed);
  return clampedSpeed & ~1; // enforce even speed (2,4,6,...)
};

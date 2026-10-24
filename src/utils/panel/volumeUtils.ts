/**
 * Clamp a numeric value to the 4-bit volume nibble range 0..15.
 * Fractional input is truncated toward zero, matching the historical `| 0` coercion.
 */
export function clampVolumeNibble(value: number): number {
  return Math.max(0, Math.min(0x0f, Math.trunc(value)));
}

export function clearIntervalRef(
  ref: { current: number | null }
): void {
  if (ref.current !== null) {
    window.clearInterval(ref.current);
    ref.current = null;
  }
}

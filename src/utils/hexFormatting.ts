export function formatHexId(value: number, minWidth: number = 2): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return ''.padStart(minWidth, '0');
  }

  const intValue = Math.floor(numeric);
  return intValue.toString(16).toUpperCase().padStart(minWidth, '0');
}

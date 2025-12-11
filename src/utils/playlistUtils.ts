export function formatPatternDisplay(patternId: string): string {
  if (patternId === '--') return '--';
  if (patternId.startsWith('^^')) return patternId;
  return patternId;
}

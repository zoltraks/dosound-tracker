export function sanitizeFilenameToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '_');
}

export function getUnsafeSongTitleTokenForExport(songTitle: string): string {
  return sanitizeFilenameToken(songTitle);
}

export function getSafeSongTitleForExport(songTitle: string): string {
  return sanitizeFilenameToken(songTitle) || 'music';
}

export function getSafeInstrumentIdForExport(instrumentId?: string | null): string {
  const rawInstId = instrumentId || 'inst';
  return sanitizeFilenameToken(rawInstId) || 'inst';
}

export function buildSongExportBaseName(songTitle: string): string {
  return getSafeSongTitleForExport(songTitle);
}

export function buildPatternExportBaseName(songTitle: string): string {
  return `${getSafeSongTitleForExport(songTitle)}_pattern`;
}

export function buildInstrumentExportBaseName(songTitle: string, instrumentId?: string | null): string {
  return `${getSafeSongTitleForExport(songTitle)}_inst_${getSafeInstrumentIdForExport(instrumentId)}`;
}

export function buildDumpExportBaseName(songTitle: string): string {
  return `${getSafeSongTitleForExport(songTitle)}_dump`;
}

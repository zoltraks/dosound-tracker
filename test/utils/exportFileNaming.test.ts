import { describe, expect, it } from 'vitest';
import {
  buildDumpExportBaseName,
  buildInstrumentExportBaseName,
  buildPatternExportBaseName,
  buildSongExportBaseName,
  getSafeInstrumentIdForExport,
  getSafeSongTitleForExport,
  getUnsafeSongTitleTokenForExport,
  sanitizeFilenameToken,
} from '../../src/utils/exportFileNaming';

describe('exportFileNaming', () => {
  it('sanitizeFilenameToken replaces non-alphanumeric characters with underscores', () => {
    expect(sanitizeFilenameToken('Hello World!')).toBe('Hello_World_');
    expect(sanitizeFilenameToken('a/b\\c')).toBe('a_b_c');
  });

  it('getUnsafeSongTitleTokenForExport matches legacy behavior (no fallback)', () => {
    expect(getUnsafeSongTitleTokenForExport('My Song')).toBe('My_Song');
    expect(getUnsafeSongTitleTokenForExport('')).toBe('');
  });

  it('getSafeSongTitleForExport applies music fallback when empty after sanitization', () => {
    expect(getSafeSongTitleForExport('My Song')).toBe('My_Song');
    expect(getSafeSongTitleForExport('')).toBe('music');
    expect(getSafeSongTitleForExport('***')).toBe('___');
  });

  it('getSafeInstrumentIdForExport applies inst fallback', () => {
    expect(getSafeInstrumentIdForExport('0A')).toBe('0A');
    expect(getSafeInstrumentIdForExport('inst 1')).toBe('inst_1');
    expect(getSafeInstrumentIdForExport('')).toBe('inst');
    expect(getSafeInstrumentIdForExport(null)).toBe('inst');
  });

  it('build*ExportBaseName functions compose expected filenames', () => {
    expect(buildSongExportBaseName('My Song')).toBe('My_Song');
    expect(buildPatternExportBaseName('My Song')).toBe('My_Song_pattern');
    expect(buildInstrumentExportBaseName('My Song', '0A')).toBe('My_Song_inst_0A');
    expect(buildDumpExportBaseName('My Song')).toBe('My_Song_dump');

    // fallback behavior
    expect(buildSongExportBaseName('')).toBe('music');
    expect(buildInstrumentExportBaseName('', '')).toBe('music_inst_inst');
  });
});

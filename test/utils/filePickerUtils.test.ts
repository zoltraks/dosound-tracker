import { describe, expect, it } from 'vitest';
import {
  buildHref,
  getFileLabel,
  getSortedUniqueFiles,
  normalizeDirectory,
  parseListFileText,
  stripExtension,
} from '../../src/utils/filePickerUtils';

describe('filePickerUtils', () => {
  it('normalizeDirectory trims and removes trailing slashes', () => {
    expect(normalizeDirectory('')).toBe('');
    expect(normalizeDirectory('  download/  ')).toBe('download');
    expect(normalizeDirectory('repo/path////')).toBe('repo/path');
  });

  it('buildHref encodes path segments and joins with normalized directory', () => {
    expect(buildHref('subdir', 'file name.txt')).toBe('subdir/file%20name.txt');
    expect(buildHref('subdir/', 'nested/file name.txt')).toBe('subdir/nested/file%20name.txt');
    expect(buildHref('', 'nested/file name.txt')).toBe('nested/file%20name.txt');
  });

  it('getFileLabel returns the last path segment', () => {
    expect(getFileLabel('a/b/c.txt')).toBe('c.txt');
    expect(getFileLabel('c.txt')).toBe('c.txt');
  });

  it('stripExtension removes only the last extension', () => {
    expect(stripExtension('file.txt')).toBe('file');
    expect(stripExtension('file.name.txt')).toBe('file.name');
    expect(stripExtension('.gitkeep')).toBe('.gitkeep');
  });

  it('parseListFileText trims, filters empty lines, and ignores list.txt/.gitkeep', () => {
    const text = [
      '  a.txt  ',
      '',
      'LIST.txt',
      '.gitkeep',
      'b.txt',
      'b.txt',
    ].join('\n');

    expect(parseListFileText(text)).toEqual(['a.txt', 'b.txt']);
  });

  it('getSortedUniqueFiles normalizes whitespace and sorts with optional descending', () => {
    const files = [' b.txt ', 'a.txt', 'A.txt', '', 'a.txt'];

    expect(getSortedUniqueFiles(files, false)).toEqual(['a.txt', 'A.txt', 'b.txt']);
    expect(getSortedUniqueFiles(files, true)).toEqual(['b.txt', 'a.txt', 'A.txt']);
  });
});

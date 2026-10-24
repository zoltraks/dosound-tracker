export const LIST_FILE_NAME = 'LIST.txt';

export function normalizeDirectory(directory: string): string {
  const trimmed = directory.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/u, '');
}

export function buildHref(directory: string, file: string): string {
  const normalizedDir = normalizeDirectory(directory);
  const encodedPath = file
    .split(/[\\/]/u)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  if (!normalizedDir) {
    return encodedPath;
  }

  return `${normalizedDir}/${encodedPath}`;
}

export function getFileLabel(file: string): string {
  const parts = file.split(/[\\/]/u);
  return parts[parts.length - 1] || file;
}

export function stripExtension(name: string): string {
  const lastDot = name.lastIndexOf('.');
  if (lastDot <= 0) return name;
  return name.slice(0, lastDot);
}

export function parseListFileText(text: string): string[] {
  const lines = text.split(/\r?\n/u);
  const trimmed = lines.map((line) => line.trim());
  const nonEmpty = trimmed.filter((line) => line.length > 0);
  const validFiles = nonEmpty.filter((line) => {
    const base = (line.split(/[\\/]/u).pop() || '').toLowerCase();
    return base !== '.gitkeep' && base !== 'list.txt';
  });

  return Array.from(new Set(validFiles));
}

export function getSortedUniqueFiles(files: string[], sortDescending: boolean): string[] {
  const normalized = files.map((file) => file.trim()).filter((file) => file.length > 0);

  if (normalized.length === 0) {
    return [];
  }

  const unique = Array.from(new Set(normalized));

  unique.sort((a, b) => {
    const cmp = a.localeCompare(b, undefined, { sensitivity: 'base' });
    return sortDescending ? -cmp : cmp;
  });

  return unique;
}

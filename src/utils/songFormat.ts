export const DEFAULT_BASE_KEY = 'C-4';

export const formatBaseKey = (note: string, octave: number): string => {
  const upperNote = note.toUpperCase();
  return upperNote.endsWith('#')
    ? `${upperNote}${octave}`
    : `${upperNote}-${octave}`;
};

export const parseBaseKey = (value: unknown): { note: string; octave: number } | null => {
  if (typeof value !== 'string') return null;
  const raw = value.trim().toUpperCase();
  if (!raw) return null;

  let notePart = raw.charAt(0);
  let rest = raw.slice(1);

  if (rest.startsWith('#')) {
    notePart += '#';
    rest = rest.slice(1);
  }

  if (rest.startsWith('-')) {
    rest = rest.slice(1);
  }

  const octave = parseInt(rest, 10);
  if (!Number.isFinite(octave)) return null;

  return { note: notePart, octave };
};

export const ensureBaseKey = (
  value?: string,
  fallback: string = DEFAULT_BASE_KEY
): { note: string; octave: number } => {
  const parsed = parseBaseKey(value);
  if (parsed) {
    return parsed;
  }

  const fallbackParsed = parseBaseKey(fallback);
  if (fallbackParsed) {
    return fallbackParsed;
  }

  return { note: 'C', octave: 4 };
};

/**
 * Normalize an arbitrary YAML color value to a 3-digit hex string (e.g. "#abc")
 * or null when the value is missing/invalid.
 *
 * Accepts either 3-digit or 6-digit hex with optional leading '#'. For 6-digit
 * colors, each channel is quantized to the nearest 4-bit value so that the
 * resulting 3-digit color approximates the original.
 */
export const normalizeInstrumentColor = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const raw = value.trim();
  if (!raw) {
    return null;
  }

  let lower = raw.toLowerCase();

  if (!lower.startsWith('#')) {
    if (!/^[0-9a-f]{3}(?:[0-9a-f]{3})?$/u.test(lower)) {
      return null;
    }
    lower = `#${lower}`;
  }

  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/u.test(lower)) {
    return null;
  }

  const hex = lower.slice(1);

  if (hex.length === 3) {
    return `#${hex}`;
  }

  const toNibble = (pair: string): string => {
    const value8 = parseInt(pair, 16);
    if (!Number.isFinite(value8)) {
      return '0';
    }
    const nibble = Math.round(value8 / 17);
    const clamped = Math.max(0, Math.min(15, nibble));
    return clamped.toString(16);
  };

  const r = toNibble(hex.slice(0, 2));
  const g = toNibble(hex.slice(2, 4));
  const b = toNibble(hex.slice(4, 6));

  return `#${r}${g}${b}`;
};

/**
 * Quotes YAML key values that match a provided key pattern.
 * Handles both list entries (`- key: value`) and nested object keys.
 */
export const quoteYamlValues = (text: string, keyPattern: string): string => {
  const regex = new RegExp(`^(\\s*-\\s+|\\s+)(${keyPattern}):\\s*(.+)$`, 'gm');

  return text.replace(regex, (_match: string, indent: string, key: string, value: string) => {
    let inner = String(value).trim();

    if (
      (inner.startsWith('"') && inner.endsWith('"')) ||
      (inner.startsWith("'") && inner.endsWith("'"))
    ) {
      inner = inner.slice(1, -1);
    }

    inner = inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    return `${indent}${key}: "${inner}"`;
  });
};

/**
 * Canonical options for YAML song-data emitters.
 * Instrument export keeps its own options (`flowLevel`, default quoting).
 */
export const YAML_DUMP_OPTIONS = {
  indent: 2,
  lineWidth: -1,
  quotingType: '"',
} as const;

/**
 * Coerces a YAML scalar into a finite number.
 * Accepts a finite `number`, or a `string` that trims to a finite `Number()`.
 * Returns `null` for every other input; callers apply their own floor,
 * clamp, and default math.
 */
export const coerceYamlNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

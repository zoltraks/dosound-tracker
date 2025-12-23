/**
 * Quotes YAML key values that match a provided key pattern.
 * Handles both list entries (`- key: value`) and nested object keys.
 */
export const quoteYamlValues = (text: string, keyPattern: string): string => {
  const regex = new RegExp(
    `^(\\s*-\\s+|\\s+)(${keyPattern}):\\s*(.+)$`,
    'gm',
  );

  return text.replace(
    regex,
    (_match: string, indent: string, key: string, value: string) => {
      let inner = String(value).trim();

      if (
        (inner.startsWith('"') && inner.endsWith('"')) ||
        (inner.startsWith('\'') && inner.endsWith('\''))
      ) {
        inner = inner.slice(1, -1);
      }

      inner = inner.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      return `${indent}${key}: "${inner}"`;
    },
  );
};

/**
 * Type-safe utility functions for common validation and type checking patterns
 */

/**
 * Type guard to check if a value is a string
 */
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Type guard to check if a value is a number
 */
export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Type guard to check if a value is a boolean
 */
export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Type guard to check if a value is an object (not null)
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * Type guard to check if a value is an array
 */
export const isArray = (value: unknown): value is unknown[] => {
  return Array.isArray(value);
};

/**
 * Safe string to number conversion with fallback
 */
export const safeParseNumber = (value: string | null | undefined, fallback: number = 0): number => {
  if (value === null || value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = parseInt(value.trim(), 10);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safe hex string to number conversion
 */
export const safeParseHex = (value: string | null | undefined, fallback: number = 0): number => {
  if (value === null || value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = parseInt(value.trim(), 16);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Clamps a number between min and max values
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Checks if a value is within a range (inclusive)
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Type-safe object property access with fallback
 */
export const safeGet = <T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback: T[K]
): T[K] => {
  return obj?.[key] ?? fallback;
};

/**
 * Type-safe array element access with fallback
 */
export const safeGetAt = <T>(
  array: T[] | null | undefined,
  index: number,
  fallback: T
): T => {
  if (!array || index < 0 || index >= array.length) {
    return fallback;
  }
  return array[index] ?? fallback;
};

/**
 * Validates that a string matches a pattern
 */
export const isValidHex = (value: string): boolean => {
  return /^[0-9A-Fa-f]+$/.test(value);
};

/**
 * Validates that a string is a valid instrument ID (2-character hex)
 */
export const isValidInstrumentId = (value: string): boolean => {
  return /^[0-9A-Fa-f]{2}$/.test(value);
};

/**
 * Type-safe way to convert unknown to string
 */
export const toString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
};

/**
 * Type-safe way to convert unknown to boolean
 */
export const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return false;
};

// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { coerceYamlNumber, YAML_DUMP_OPTIONS } from '../../../src/utils/yaml/yamlUtils.ts';

describe('coerceYamlNumber', () => {
  it('returns finite numbers unchanged', () => {
    try {
      expect(coerceYamlNumber(7)).toBe(7);
      expect(coerceYamlNumber(-2.5)).toBe(-2.5);
      expect(coerceYamlNumber(0)).toBe(0);
    } catch (error) {
      console.log('number coercion mismatch');
      throw error;
    }
  });

  it('parses numeric and padded strings', () => {
    try {
      expect(coerceYamlNumber('12')).toBe(12);
      expect(coerceYamlNumber('  3.5  ')).toBe(3.5);
      expect(coerceYamlNumber('-4')).toBe(-4);
    } catch (error) {
      console.log('string coercion mismatch');
      throw error;
    }
  });

  it('rejects empty, non-numeric, and non-finite input', () => {
    try {
      expect(coerceYamlNumber('')).toBeNull();
      expect(coerceYamlNumber('   ')).toBeNull();
      expect(coerceYamlNumber('abc')).toBeNull();
      expect(coerceYamlNumber(null)).toBeNull();
      expect(coerceYamlNumber(undefined)).toBeNull();
      expect(coerceYamlNumber(NaN)).toBeNull();
      expect(coerceYamlNumber(Infinity)).toBeNull();
      expect(coerceYamlNumber(true)).toBeNull();
      expect(coerceYamlNumber({})).toBeNull();
    } catch (error) {
      console.log('rejection mismatch');
      throw error;
    }
  });
});

describe('YAML_DUMP_OPTIONS', () => {
  it('carries the canonical emitter options', () => {
    try {
      expect(YAML_DUMP_OPTIONS).toEqual({ indent: 2, lineWidth: -1, quotingType: '"' });
    } catch (error) {
      console.log('dump options mismatch');
      throw error;
    }
  });
});

import { describe, it, expect } from 'vitest';
import { Formatter } from '../../src/utils/formatters';

describe('Formatter', () => {
  describe('hex', () => {
    it('should format numbers as hex strings', () => {
      expect(Formatter.hex(0)).toBe('00');
      expect(Formatter.hex(15)).toBe('0F');
      expect(Formatter.hex(255)).toBe('FF');
    });

    it('should handle custom pad widths', () => {
      expect(Formatter.hex(15, { padWidth: 4 })).toBe('000F');
      expect(Formatter.hex(255, { padWidth: 1 })).toBe('FF');
    });

    it('should handle uppercase option', () => {
      expect(Formatter.hex(255, { uppercase: true })).toBe('FF');
      expect(Formatter.hex(255, { uppercase: false })).toBe('ff');
    });

    it('should handle prefix and suffix', () => {
      expect(Formatter.hex(15, { prefix: '0x' })).toBe('0x0F');
      expect(Formatter.hex(15, { suffix: 'h' })).toBe('0Fh');
    });

    it('should handle negative numbers', () => {
      expect(Formatter.hex(-10)).toBe('0A');
    });
  });

  describe('signed', () => {
    it('should format positive numbers with plus sign', () => {
      expect(Formatter.signed(5)).toBe('+5');
      expect(Formatter.signed(0)).toBe('+0');
    });

    it('should format negative numbers with minus sign', () => {
      expect(Formatter.signed(-5)).toBe('-5');
    });
  });

  describe('mode', () => {
    it('should format mode values correctly', () => {
      expect(Formatter.mode(0)).toBe('TONE');
      expect(Formatter.mode(1)).toBe('NOISE');
      expect(Formatter.mode(2)).toBe('BOTH');
    });

    it('should handle invalid mode values', () => {
      expect(Formatter.mode(99)).toBe('UNKNOWN');
    });
  });

  describe('envelopeValue', () => {
    it('should format volume as hex', () => {
      expect(Formatter.envelopeValue('volume', 15)).toBe('0F');
    });

    it('should format pitch as signed', () => {
      expect(Formatter.envelopeValue('pitch', 5)).toBe('+5');
      expect(Formatter.envelopeValue('pitch', -3)).toBe('-3');
    });

    it('should format mode as string', () => {
      expect(Formatter.envelopeValue('mode', 0)).toBe('TONE');
    });
  });

  describe('instrumentId', () => {
    it('should handle numeric input', () => {
      expect(Formatter.instrumentId(15)).toBe('0F');
      expect(Formatter.instrumentId(0)).toBe('00');
    });

    it('should handle string hex input', () => {
      expect(Formatter.instrumentId('A')).toBe('0A');
      expect(Formatter.instrumentId('0F')).toBe('0F');
    });

    it('should handle null/undefined', () => {
      expect(Formatter.instrumentId(null)).toBe('');
      expect(Formatter.instrumentId(undefined)).toBe('');
    });

    it('should handle invalid strings', () => {
      expect(Formatter.instrumentId('invalid')).toBe('');
    });
  });

  describe('instrumentSlot', () => {
    it('should format slot IDs', () => {
      expect(Formatter.instrumentSlot(0)).toBe('INST 00');
      expect(Formatter.instrumentSlot(15)).toBe('INST 0F');
      expect(Formatter.instrumentSlot(255)).toBe('INST FF');
    });
  });
});

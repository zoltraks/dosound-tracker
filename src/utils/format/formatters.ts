import type { EnvelopePanelType } from '../envelope/envelopeTypes.ts';

export interface FormatOptions {
  padWidth?: number;
  uppercase?: boolean;
  prefix?: string;
  suffix?: string;
  noPad?: boolean; // Don't pad for values < 16
}

export class Formatter {
  static hex(value: number, options: FormatOptions = {}): string {
    const { padWidth = 2, uppercase = true, prefix = '', suffix = '', noPad = false } = options;
    const hex = Math.abs(value).toString(16);
    const formatted = uppercase ? hex.toUpperCase() : hex;

    if (noPad && Math.abs(value) < 0x10) {
      return `${prefix}${formatted}${suffix}`;
    }

    const padded = formatted.padStart(padWidth, '0');
    return `${prefix}${padded}${suffix}`;
  }

  static signed(value: number): string {
    return value >= 0 ? `+${value}` : value.toString();
  }

  /**
   * Format mode value as string
   * @param value - Mode number (0=TONE, 1=NOISE, 2=BOTH)
   * @returns Mode name string
   */
  static mode(value: number): string {
    switch (value) {
      case 0:
        return 'TONE';
      case 1:
        return 'NOISE';
      case 2:
        return 'BOTH';
      default:
        return 'UNKNOWN';
    }
  }

  static envelopeValue(type: EnvelopePanelType, value: number): string {
    switch (type) {
      case 'volume':
      case 'noise':
        return Formatter.hex(value, { padWidth: 2, uppercase: true, noPad: false });
      case 'shift':
      case 'pitch':
        return Formatter.signed(value);
      case 'mode':
        return Formatter.mode(value);
      default:
        return value.toString();
    }
  }
}

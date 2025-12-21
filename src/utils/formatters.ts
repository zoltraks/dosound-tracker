export interface FormatOptions {
  padWidth?: number;
  uppercase?: boolean;
  prefix?: string;
  suffix?: string;
  noPad?: boolean; // Don't pad for values < 16
}

export class Formatter {
  /**
   * Format number as hexadecimal string
   * @param value - Number to format
   * @param options - Formatting options
   * @returns Formatted hex string
   */
  static hex(value: number, options: FormatOptions = {}): string {
    const { padWidth = 2, uppercase = true, prefix = '', suffix = '', noPad = false } = options;
    const hex = Math.abs(value).toString(16);
    const formatted = uppercase ? hex.toUpperCase() : hex;

    // If noPad is true and value < 16, don't pad (matches original toHex behavior)
    if (noPad && Math.abs(value) < 0x10) {
      return `${prefix}${formatted}${suffix}`;
    }

    // Otherwise, pad to specified width
    const padded = formatted.padStart(padWidth, '0');
    return `${prefix}${padded}${suffix}`;
  }

  /**
   * Format number with sign prefix
   * @param value - Number to format
   * @returns Signed string (e.g., "+5", "-3")
   */
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
      case 0: return 'TONE';
      case 1: return 'NOISE';
      case 2: return 'BOTH';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Format envelope value based on type
   * @param type - Envelope parameter type
   * @param value - Value to format
   * @returns Formatted string appropriate for type
   */
  static envelopeValue(type: string, value: number): string {
    switch (type) {
      case 'volume':
      case 'noise':
        return Formatter.hex(value);
      case 'shift':
      case 'pitch':
        return Formatter.signed(value);
      case 'mode':
        return Formatter.mode(value);
      default:
        return value.toString();
    }
  }

  /**
   * Format instrument ID to consistent format
   * @param value - Raw instrument ID (number, string, or null)
   * @returns Normalized 2-digit hex string or empty string
   */
  static instrumentId(value?: string | number | null): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      return Formatter.hex(value, { padWidth: 2, uppercase: true, noPad: false });
    }

    if (typeof value === 'string') {
      const parsed = parseInt(value, 16);
      if (isNaN(parsed)) {
        return '';
      }
      return Formatter.hex(parsed, { padWidth: 2, uppercase: true, noPad: false });
    }

    return '';
  }

  /**
   * Format instrument slot ID with prefix
   * @param slotIndex - Slot index number
   * @returns Formatted slot ID (e.g., "INST 01")
   */
  static instrumentSlot(slotIndex: number): string {
    return `INST ${Formatter.hex(slotIndex, { padWidth: 2, uppercase: true, noPad: false })}`;
  }
}

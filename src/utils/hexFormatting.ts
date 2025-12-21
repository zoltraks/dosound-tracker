import { Formatter } from './formatters';

export function formatHexId(value: number, minWidth: number = 2): string {
  return Formatter.hex(value, { padWidth: minWidth, uppercase: true });
}

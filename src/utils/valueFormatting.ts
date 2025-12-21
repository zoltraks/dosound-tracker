import type { EnvelopePanelType } from './envelopeTypes';
import { Formatter } from './formatters';

export function formatEnvelopeValue(type: EnvelopePanelType, value: number): string {
  return Formatter.envelopeValue(type, value);
}

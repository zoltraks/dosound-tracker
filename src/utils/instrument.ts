import type { Instrument } from '../synth/SoundDriver';

const isAllZero = (values: number[] | undefined | null): boolean => {
  if (!values || values.length === 0) {
    return true;
  }
  return values.every(v => v === 0);
};

/**
 * Treat an instrument slot as empty when all parameters are at their
 * default "cleared" values:
 * - name is empty/whitespace
 * - volume envelope all zeroes
 * - arpeggio envelope all zeroes
 * - pitch envelope all zeroes
 * - noise envelope all zeroes
 * - mode all zeroes
 */
export const isInstrumentEmpty = (inst: Instrument | undefined | null): boolean => {
  if (!inst) {
    return true;
  }

  const nameEmpty = !inst.name || !inst.name.trim();

  const volumeEmpty = isAllZero(inst.volume);
  const arpeggioEmpty = isAllZero(inst.arpeggio);
  const pitchEmpty = isAllZero(inst.pitch);
  const noiseEmpty = isAllZero(inst.noiseEnvelope);
  const modeEmpty = isAllZero(inst.mode);

  return nameEmpty && volumeEmpty && arpeggioEmpty && pitchEmpty && noiseEmpty && modeEmpty;
};

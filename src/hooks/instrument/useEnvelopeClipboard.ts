import { useCallback } from 'react';
import { logger } from '../../utils/log/logger.ts';
import type { Instrument } from '../../synth/SoundDriver.ts';
import type { NavigationSection } from '../../constants/navigation.ts';
import { getClipboardApiOrReport } from '../../utils/track/trackUtils.ts';
import {
  generateEnvelopeClipboardData,
  parseEnvelopeClipboardData,
} from '../../utils/envelope/envelopeClipboard.ts';
import type { EnvelopePanelType } from '../../utils/envelope/envelopeTypes.ts';

const ENVELOPE_SECTIONS: readonly NavigationSection[] = [
  'mode',
  'volume',
  'shift',
  'pitch',
  'noise',
];

interface UseEnvelopeClipboardArgs {
  activeSection: NavigationSection;
  currentInstrument: Instrument;
  updateInstrument: (patch: Partial<Instrument>) => void;
  setError: (message: string) => void;
}

interface UseEnvelopeClipboardResult {
  isEnvelopeSectionActive: boolean;
  handleCopyEnvelope: () => Promise<void>;
  handlePasteEnvelope: () => Promise<void>;
}

export function useEnvelopeClipboard({
  activeSection,
  currentInstrument,
  updateInstrument,
  setError,
}: UseEnvelopeClipboardArgs): UseEnvelopeClipboardResult {
  const envelopeSection = ENVELOPE_SECTIONS.includes(activeSection)
    ? (activeSection as EnvelopePanelType)
    : null;

  const handleCopyEnvelope = useCallback(async () => {
    if (!envelopeSection) {
      return;
    }

    const clipboard = getClipboardApiOrReport('write', setError);
    if (!clipboard) {
      return;
    }

    try {
      const yamlContent = generateEnvelopeClipboardData(
        envelopeSection,
        currentInstrument[envelopeSection],
        envelopeSection === 'volume' ? currentInstrument.sustain : undefined,
      );
      await clipboard.writeText(yamlContent);
    } catch (error) {
      logger.error('Failed to copy envelope', error);
      const message = error instanceof Error ? error.message : String(error);
      setError('Failed to copy envelope to clipboard.\n\n' + message);
    }
  }, [envelopeSection, currentInstrument, setError]);

  const handlePasteEnvelope = useCallback(async () => {
    if (!envelopeSection) {
      return;
    }

    try {
      const clipboard = getClipboardApiOrReport('read', setError);
      if (!clipboard) {
        return;
      }

      const text = await clipboard.readText();
      if (!text || !text.trim()) {
        setError('Clipboard is empty or does not contain envelope data.');
        return;
      }

      let parsed;
      try {
        parsed = parseEnvelopeClipboardData(text, envelopeSection);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setError('Failed to paste envelope from clipboard.\n\n' + message);
        return;
      }

      updateInstrument({
        [envelopeSection]: parsed.data,
        ...(envelopeSection === 'volume' && parsed.sustain !== undefined
          ? { sustain: parsed.sustain }
          : {}),
      });
    } catch (error) {
      logger.error('Failed to paste envelope', error);
      const message = error instanceof Error ? error.message : String(error);
      setError('Failed to paste envelope from clipboard.\n\n' + message);
    }
  }, [envelopeSection, updateInstrument, setError]);

  return {
    isEnvelopeSectionActive: envelopeSection !== null,
    handleCopyEnvelope,
    handlePasteEnvelope,
  };
}

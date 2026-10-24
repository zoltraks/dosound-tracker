import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import yaml from 'js-yaml';
import type { NavigationSection } from '../constants/navigation';
import type { InstrumentTypeInfo } from './useInstrumentWarnings';
import { logger } from '../utils/logger';

export interface UseInstrumentFileLoadingParams {
  loadInstrument: (content: string) => void;
  setInstrumentError: (value: string) => void;
  setActiveSection: (section: NavigationSection) => void;
  ignoreInstrumentTypeWarning: boolean;
  openInstrumentTypeWarning: (content: string, info: InstrumentTypeInfo) => void;
  confirmInstrumentTypeWarning: () => string | null;
  cancelInstrumentTypeWarning: () => void;
}

export interface UseInstrumentFileLoadingResult {
  instrumentFileInputRef: RefObject<HTMLInputElement | null>;
  isRepositoryInstrumentOpen: boolean;
  setIsRepositoryInstrumentOpen: (open: boolean) => void;
  handleLoadInstrumentClick: () => void;
  handleOpenRepositoryInstrumentPicker: () => void;
  handleInstrumentFileContent: (content: string) => void;
  handleConfirmInstrumentTypeWarning: () => void;
  handleCancelInstrumentTypeWarning: () => void;
  handlePickRepositoryInstrument: (fileUrl: string) => void;
}

export function useInstrumentFileLoading({
  loadInstrument,
  setInstrumentError,
  setActiveSection,
  ignoreInstrumentTypeWarning,
  openInstrumentTypeWarning,
  confirmInstrumentTypeWarning,
  cancelInstrumentTypeWarning,
}: UseInstrumentFileLoadingParams): UseInstrumentFileLoadingResult {
  const instrumentFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRepositoryInstrumentOpen, setIsRepositoryInstrumentOpen] = useState(false);

  const handleLoadInstrumentClick = useCallback(() => {
    if (instrumentFileInputRef.current) {
      instrumentFileInputRef.current.value = '';
      instrumentFileInputRef.current.click();
    }
  }, []);

  const handleOpenRepositoryInstrumentPicker = useCallback(() => {
    setIsRepositoryInstrumentOpen(true);
  }, []);

  const handleInstrumentFileContent = useCallback(
    (content: string) => {
      if (!content) {
        return;
      }

      let parsed: unknown;
      try {
        parsed = yaml.load(content) as unknown;
      } catch (error) {
        logger.error('Error loading instrument', error);
        setInstrumentError('Error loading instrument file.');
        return;
      }

      if (!parsed || typeof parsed !== 'object' || !('instrument' in parsed)) {
        loadInstrument(content);
        setActiveSection('instrumentList');
        return;
      }

      const root = parsed as { instrument?: unknown };
      const node = root.instrument;

      if (!node || typeof node !== 'object') {
        loadInstrument(content);
        setActiveSection('instrumentList');
        return;
      }

      const instNode = node as { [key: string]: unknown; type?: unknown };
      const hasTypeField = Object.prototype.hasOwnProperty.call(instNode, 'type');
      const rawType = instNode.type;

      let detectedType: string | null = null;
      if (typeof rawType === 'string') {
        detectedType = rawType;
      } else if (rawType != null) {
        detectedType = String(rawType);
      }

      const normalizedType = detectedType ? detectedType.trim().toLowerCase() : '';
      const isDosoundType = normalizedType === 'dosound';

      if (!hasTypeField || !isDosoundType) {
        if (ignoreInstrumentTypeWarning) {
          loadInstrument(content);
          setActiveSection('instrumentList');
          return;
        }

        openInstrumentTypeWarning(content, { hasTypeField, detectedType });
        return;
      }

      loadInstrument(content);
      setActiveSection('instrumentList');
    },
    [
      ignoreInstrumentTypeWarning,
      loadInstrument,
      setActiveSection,
      setInstrumentError,
      openInstrumentTypeWarning,
    ],
  );

  const handleConfirmInstrumentTypeWarning = useCallback(() => {
    const content = confirmInstrumentTypeWarning();
    if (!content) {
      return;
    }

    loadInstrument(content);
    setActiveSection('instrumentList');
  }, [confirmInstrumentTypeWarning, loadInstrument, setActiveSection]);

  const handleCancelInstrumentTypeWarning = useCallback(() => {
    cancelInstrumentTypeWarning();
  }, [cancelInstrumentTypeWarning]);

  const handlePickRepositoryInstrument = useCallback(
    (fileUrl: string) => {
      fetch(fileUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to load instrument file.');
          }

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            throw new Error('Instrument file appears to be HTML, treating as missing.');
          }

          return response.text();
        })
        .then((text) => {
          handleInstrumentFileContent(text);
        })
        .catch((error) => {
          logger.error('Error loading repository instrument', error);
          setInstrumentError('Error loading instrument file.');
        })
        .finally(() => {
          setIsRepositoryInstrumentOpen(false);
        });
    },
    [handleInstrumentFileContent, setInstrumentError],
  );

  return {
    instrumentFileInputRef,
    isRepositoryInstrumentOpen,
    setIsRepositoryInstrumentOpen,
    handleLoadInstrumentClick,
    handleOpenRepositoryInstrumentPicker,
    handleInstrumentFileContent,
    handleConfirmInstrumentTypeWarning,
    handleCancelInstrumentTypeWarning,
    handlePickRepositoryInstrument,
  };
}

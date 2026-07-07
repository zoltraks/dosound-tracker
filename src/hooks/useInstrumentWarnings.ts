import { useCallback, useState } from 'react';
import { useLocalStorageState } from './useLocalStorageState';

export interface InstrumentTypeInfo {
  hasTypeField: boolean;
  detectedType: string | null;
}

interface UseInstrumentWarningsResult {
  isInstrumentTypeWarningOpen: boolean;
  ignoreInstrumentTypeWarning: boolean;
  instrumentTypeWarningIgnoreChecked: boolean;
  pendingInstrumentTypeInfo: InstrumentTypeInfo | null;
  setInstrumentTypeWarningIgnoreChecked: (checked: boolean) => void;
  openInstrumentTypeWarning: (content: string, info: InstrumentTypeInfo) => void;
  confirmInstrumentTypeWarning: () => string | null;
  cancelInstrumentTypeWarning: () => void;
}

const STORAGE_KEY = 'dosound-tracker-ignore-inst-type-warning';

export function useInstrumentWarnings(): UseInstrumentWarningsResult {
  const [isInstrumentTypeWarningOpen, setIsInstrumentTypeWarningOpen] = useState(false);
  const [ignoreInstrumentTypeWarning, setIgnoreInstrumentTypeWarning] = useLocalStorageState<boolean>(
    STORAGE_KEY,
    false,
    {
      read: (stored) => stored === '1',
      write: (value) => value ? '1' : '0',
    }
  );
  const [instrumentTypeWarningIgnoreChecked, setInstrumentTypeWarningIgnoreChecked] = useState(false);
  const [pendingInstrumentContent, setPendingInstrumentContent] = useState<string | null>(null);
  const [pendingInstrumentTypeInfo, setPendingInstrumentTypeInfo] = useState<InstrumentTypeInfo | null>(null);

  const openInstrumentTypeWarning = useCallback(
    (content: string, info: InstrumentTypeInfo) => {
      setPendingInstrumentContent(content);
      setPendingInstrumentTypeInfo(info);
      setInstrumentTypeWarningIgnoreChecked(ignoreInstrumentTypeWarning);
      setIsInstrumentTypeWarningOpen(true);
    },
    [ignoreInstrumentTypeWarning],
  );

  const confirmInstrumentTypeWarning = useCallback((): string | null => {
    if (!pendingInstrumentContent) {
      setIsInstrumentTypeWarningOpen(false);
      return null;
    }

    if (instrumentTypeWarningIgnoreChecked && !ignoreInstrumentTypeWarning) {
      setIgnoreInstrumentTypeWarning(true);
    }

    const content = pendingInstrumentContent;

    setIsInstrumentTypeWarningOpen(false);
    setPendingInstrumentContent(null);
    setPendingInstrumentTypeInfo(null);

    return content;
  }, [
    pendingInstrumentContent,
    instrumentTypeWarningIgnoreChecked,
    ignoreInstrumentTypeWarning,
    setIgnoreInstrumentTypeWarning,
  ]);

  const cancelInstrumentTypeWarning = useCallback(() => {
    setIsInstrumentTypeWarningOpen(false);
    setPendingInstrumentContent(null);
    setPendingInstrumentTypeInfo(null);
  }, []);

  return {
    isInstrumentTypeWarningOpen,
    ignoreInstrumentTypeWarning,
    instrumentTypeWarningIgnoreChecked,
    pendingInstrumentTypeInfo,
    setInstrumentTypeWarningIgnoreChecked,
    openInstrumentTypeWarning,
    confirmInstrumentTypeWarning,
    cancelInstrumentTypeWarning,
  };
}

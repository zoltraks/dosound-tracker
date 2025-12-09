import { useState } from 'react';

interface InstrumentDeleteUsage {
  instrumentId: string;
  instrumentName: string;
  usageCount: number;
  patternCount: number;
}

export interface UseModalStateResult {
  isNewSongConfirmOpen: boolean;
  setIsNewSongConfirmOpen: (open: boolean) => void;
  isAboutOpen: boolean;
  setIsAboutOpen: (open: boolean) => void;
  isChangelogOpen: boolean;
  setIsChangelogOpen: (open: boolean) => void;
  changelogContent: string;
  setChangelogContent: (value: string) => void;
   isManualOpen: boolean;
   setIsManualOpen: (open: boolean) => void;
   manualContent: string;
   setManualContent: (value: string) => void;
  isOptimizeConfirmOpen: boolean;
  setIsOptimizeConfirmOpen: (open: boolean) => void;
  isRenumberConfirmOpen: boolean;
  setIsRenumberConfirmOpen: (open: boolean) => void;
  isResetConfirmOpen: boolean;
  setIsResetConfirmOpen: (open: boolean) => void;
  isQuitConfirmOpen: boolean;
  setIsQuitConfirmOpen: (open: boolean) => void;
  optimizeSummary: string;
  setOptimizeSummary: (value: string) => void;
  renumberSummary: string;
  setRenumberSummary: (value: string) => void;
  isTransposeOpen: boolean;
  setIsTransposeOpen: (open: boolean) => void;
  transposeSummary: string;
  setTransposeSummary: (value: string) => void;
  instrumentOperationSummary: string;
  setInstrumentOperationSummary: (value: string) => void;
  midiLoadError: string;
  setMidiLoadError: (value: string) => void;
  midiCopySummary: string;
  setMidiCopySummary: (value: string) => void;
  isDownloadOpen: boolean;
  setIsDownloadOpen: (open: boolean) => void;
  isMidiModalOpen: boolean;
  setIsMidiModalOpen: (open: boolean) => void;
  isDebugInfoOpen: boolean;
  setIsDebugInfoOpen: (open: boolean) => void;
  isInstrumentDeleteOpen: boolean;
  setIsInstrumentDeleteOpen: (open: boolean) => void;
  instrumentDeleteUsage: InstrumentDeleteUsage;
  setInstrumentDeleteUsage: (value: InstrumentDeleteUsage) => void;
  isInstrumentMidiOpen: boolean;
  setIsInstrumentMidiOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
}

export function useModalState(): UseModalStateResult {
  const [isNewSongConfirmOpen, setIsNewSongConfirmOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [changelogContent, setChangelogContent] = useState('');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualContent, setManualContent] = useState('');
  const [isOptimizeConfirmOpen, setIsOptimizeConfirmOpen] = useState(false);
  const [isRenumberConfirmOpen, setIsRenumberConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isQuitConfirmOpen, setIsQuitConfirmOpen] = useState(false);
  const [optimizeSummary, setOptimizeSummary] = useState('');
  const [renumberSummary, setRenumberSummary] = useState('');
  const [isTransposeOpen, setIsTransposeOpen] = useState(false);
  const [transposeSummary, setTransposeSummary] = useState('');
  const [instrumentOperationSummary, setInstrumentOperationSummary] = useState('');
  const [midiLoadError, setMidiLoadError] = useState('');
  const [midiCopySummary, setMidiCopySummary] = useState('');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState(false);
  const [isDebugInfoOpen, setIsDebugInfoOpen] = useState(false);
  const [isInstrumentDeleteOpen, setIsInstrumentDeleteOpen] = useState(false);
  const [instrumentDeleteUsage, setInstrumentDeleteUsage] = useState<InstrumentDeleteUsage>({
    instrumentId: '',
    instrumentName: '',
    usageCount: 0,
    patternCount: 0,
  });
  const [isInstrumentMidiOpen, setIsInstrumentMidiOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return {
    isNewSongConfirmOpen,
    setIsNewSongConfirmOpen,
    isAboutOpen,
    setIsAboutOpen,
    isChangelogOpen,
    setIsChangelogOpen,
    changelogContent,
    setChangelogContent,
    isManualOpen,
    setIsManualOpen,
    manualContent,
    setManualContent,
    isOptimizeConfirmOpen,
    setIsOptimizeConfirmOpen,
    isRenumberConfirmOpen,
    setIsRenumberConfirmOpen,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    isQuitConfirmOpen,
    setIsQuitConfirmOpen,
    optimizeSummary,
    setOptimizeSummary,
    renumberSummary,
    setRenumberSummary,
    isTransposeOpen,
    setIsTransposeOpen,
    transposeSummary,
    setTransposeSummary,
    instrumentOperationSummary,
    setInstrumentOperationSummary,
    midiLoadError,
    setMidiLoadError,
    midiCopySummary,
    setMidiCopySummary,
    isDownloadOpen,
    setIsDownloadOpen,
    isMidiModalOpen,
    setIsMidiModalOpen,
    isDebugInfoOpen,
    setIsDebugInfoOpen,
    isInstrumentDeleteOpen,
    setIsInstrumentDeleteOpen,
    instrumentDeleteUsage,
    setInstrumentDeleteUsage,
    isInstrumentMidiOpen,
    setIsInstrumentMidiOpen,
    isExportModalOpen,
    setIsExportModalOpen,
  };
}

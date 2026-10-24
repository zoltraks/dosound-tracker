/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { normalizeInstrumentId } from '../../utils/playback/playbackUtils.ts';
import type { TransposeOptions, TransposeResult } from '../song/useTrackOperations.ts';

export interface UseTransposeDialogParams {
  transposeScope: 'line' | 'song';
  transposeTrackScope: 'current' | 'all';
  transposeInstrumentScope: 'all' | 'selected';
  transposeAmount: number;
  transposeAmountInput: string;
  setTransposeAmount: Dispatch<SetStateAction<number>>;
  setTransposeAmountInput: Dispatch<SetStateAction<string>>;
  setIsTransposeOpen: (open: boolean) => void;
  setTransposeSummary: (value: string) => void;
  playlistLength: number;
  currentPatternIndex: number;
  targetTrackId: 'A' | 'B' | 'C';
  currentInstrumentId: string;
  applyTranspose: (options: TransposeOptions) => TransposeResult | null;
}

export interface UseTransposeDialogResult {
  handleOpenTranspose: () => void;
  handleCancelTranspose: () => void;
  handleConfirmTranspose: () => void;
  handleTransposeAmountChange: (value: string) => void;
  handleCloseTransposeSummary: () => void;
}

export function useTransposeDialog({
  transposeScope,
  transposeTrackScope,
  transposeInstrumentScope,
  transposeAmount,
  transposeAmountInput,
  setTransposeAmount,
  setTransposeAmountInput,
  setIsTransposeOpen,
  setTransposeSummary,
  playlistLength,
  currentPatternIndex,
  targetTrackId,
  currentInstrumentId,
  applyTranspose,
}: UseTransposeDialogParams): UseTransposeDialogResult {
  const handleOpenTranspose = useCallback(() => {
    // When opening, keep the last-used transpose settings and just ensure the
    // input text reflects the current numeric amount.
    setTransposeAmountInput(String(transposeAmount));
    setIsTransposeOpen(true);
  }, [transposeAmount]);

  const handleCancelTranspose = useCallback(() => {
    setIsTransposeOpen(false);
  }, []);

  const handleConfirmTranspose = useCallback(() => {
    // Parse the semitone offset from the text input so negative values and
    // partial edits are handled correctly.
    let semitones = 0;
    const trimmed = transposeAmountInput.trim();

    if (trimmed !== '' && trimmed !== '-' && trimmed !== '+') {
      const parsed = Number(trimmed);
      if (Number.isFinite(parsed)) {
        semitones = Math.round(parsed);
      }
    }

    if (playlistLength === 0) {
      setTransposeSummary('No playlist entries to transpose.');
      setIsTransposeOpen(false);
      return;
    }

    if (semitones === 0) {
      setTransposeSummary('No transposition applied because the semitone offset is 0.');
      setIsTransposeOpen(false);
      return;
    }

    const selectedInstrumentId = normalizeInstrumentId(currentInstrumentId);

    const result = applyTranspose({
      semitones,
      scope: transposeScope,
      trackScope: transposeTrackScope,
      instrumentScope: transposeInstrumentScope,
      currentPatternIndex,
      targetTrackId,
      selectedInstrumentId,
      normalizeInstrumentId,
    });

    if (!result || result.patternCount === 0) {
      setTransposeSummary('No patterns found for the selected scope to transpose.');
      setIsTransposeOpen(false);
      return;
    }

    setIsTransposeOpen(false);

    const directionLabel = semitones > 0 ? `+${semitones}` : `${semitones}`;
    const scopeLabel =
      transposeScope === 'line'
        ? 'Current playlist position only'
        : 'Entire song (all playlist positions)';
    const trackLabel =
      transposeTrackScope === 'current'
        ? `Current track only (Track ${targetTrackId})`
        : 'All tracks (A, B, C)';
    const instrumentLabel =
      transposeInstrumentScope === 'selected'
        ? `Selected instrument only (${selectedInstrumentId})`
        : 'All instruments';

    const lines: string[] = [];
    lines.push('Transposition complete.');
    lines.push('');
    lines.push(`Semitone offset: ${directionLabel}`);
    lines.push(`Scope: ${scopeLabel}`);
    lines.push(`Track scope: ${trackLabel}`);
    lines.push(`Instrument scope: ${instrumentLabel}`);
    lines.push('');
    lines.push(`Patterns touched: ${result.patternCount}`);
    lines.push(`Notes transposed: ${result.notesChanged}`);

    if (result.clippedLow > 0 || result.clippedHigh > 0) {
      lines.push('');
      lines.push(`Notes clipped at bottom of range: ${result.clippedLow}`);
      lines.push(`Notes clipped at top of range: ${result.clippedHigh}`);
    }

    setTransposeSummary(lines.join('\n'));
  }, [
    transposeAmountInput,
    playlistLength,
    transposeScope,
    transposeTrackScope,
    transposeInstrumentScope,
    currentPatternIndex,
    targetTrackId,
    currentInstrumentId,
    normalizeInstrumentId,
    applyTranspose,
  ]);

  const handleTransposeAmountChange = useCallback((value: string) => {
    // Allow arbitrary text (including just "-" while typing) but only update
    // the numeric amount when the value parses to a finite number.
    setTransposeAmountInput(value);

    const trimmed = value.trim();
    if (!trimmed || trimmed === '-' || trimmed === '+') {
      return;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      const clamped = Math.max(-99, Math.min(99, parsed));
      setTransposeAmount(clamped);
    }
  }, []);

  const handleCloseTransposeSummary = useCallback(() => {
    setTransposeSummary('');
  }, []);

  return {
    handleOpenTranspose,
    handleCancelTranspose,
    handleConfirmTranspose,
    handleTransposeAmountChange,
    handleCloseTransposeSummary,
  };
}

import { useMemo, useCallback } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Pattern, Instrument } from '../synth/SoundDriver';
import { computeEffectiveVolume } from '../utils/trackUtils';
import {
  buildInstrumentColorMap,
  getTrackNotes as getTrackNotesForPattern,
} from '../utils/trackRendering';

export interface UseTrackRenderingParams {
  pattern: Pattern | null;
  patternLength: number;
  instruments: Instrument[];
  currentLine: number;
  sectionName: NavigationSection;
  onLineChange: (lineIndex: number) => void;
  setActiveSection: (section: NavigationSection) => void;
  setCurrentColumn: (column: 'note' | 'volume') => void;
}

export interface UseTrackRenderingResult {
  trackNotes: (Pattern['step'][number]['note'])[];
  instrumentColorMap: Map<string, string>;
  effectiveVolume: number;
  handleLineClick: (lineIndex: number, column?: 'note' | 'volume') => void;
}

export function useTrackRendering({
  pattern,
  patternLength,
  instruments,
  currentLine,
  sectionName,
  onLineChange,
  setActiveSection,
  setCurrentColumn,
}: UseTrackRenderingParams): UseTrackRenderingResult {
  const instrumentColorMap = useMemo(() => {
    return buildInstrumentColorMap(instruments);
  }, [instruments]);

  const effectiveVolume = useMemo(() => {
    return computeEffectiveVolume(pattern, currentLine);
  }, [pattern, currentLine]);

  const trackNotes = useMemo(() => {
    return getTrackNotesForPattern(pattern, patternLength);
  }, [pattern, patternLength]);

  const handleLineClick = useCallback(
    (lineIndex: number, column: 'note' | 'volume' = 'note') => {
      onLineChange(lineIndex);
      setActiveSection(sectionName);
      setCurrentColumn(column);
    },
    [onLineChange, sectionName, setActiveSection, setCurrentColumn]
  );

  return {
    trackNotes,
    instrumentColorMap,
    effectiveVolume,
    handleLineClick,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { ENVELOPE_LENGTH, NOISE_MAX } from '../constants/music';
import {
  applyEnvelopeDelta,
  clampEnvelopeValue,
  getEnvelopeSectionName,
  type EnvelopePanelType,
} from '../utils/envelopeTypes';
import {
  copyEnvelopeValueFromLastPosition,
  getMovedEnvelopePosition,
  getNextEnvelopePosition,
  parseEnvelopeHexValue,
  parseEnvelopeModeValue,
  repeatEnvelopePatternToLength,
  rotateEnvelopeData,
  shiftEnvelopeDataValues,
  toggleSustainIndex,
} from '../utils/envelopePanelUtils';

type KeyboardEvent = ReactKeyboardEvent;

export interface UseEnvelopeEditorParams {
  type: EnvelopePanelType;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  data?: number[];
  fallbackData?: number[];
  onChange?: (data: number[]) => void;
  sustainIndex?: number | null;
  onSustainChange?: (index: number | null) => void;
  advanceOnDelete?: boolean;
}

export interface UseEnvelopeEditorResult {
  sectionName: NavigationSection;
  isActive: boolean;
  envelopeData: number[];
  currentPosition: number;
  handleKeyDown: (event: KeyboardEvent) => void;
  handlePositionClick: (position: number) => void;
  handleValueChange: (delta: number) => void;
  setValueAt: (index: number, value: number) => void;
  cycleValueAt: (index: number, cycleFn: (current: number) => number) => void;
  lastPositionRef: React.MutableRefObject<number | null>;
}

export function useEnvelopeEditor({
  type,
  activeSection,
  setActiveSection,
  data,
  fallbackData,
  onChange,
  sustainIndex,
  onSustainChange,
  advanceOnDelete,
}: UseEnvelopeEditorParams): UseEnvelopeEditorResult {
  const sectionName = useMemo(() => getEnvelopeSectionName(type), [type]) as NavigationSection;
  const isActive = activeSection === sectionName;
  const lastPositionRef = useRef<number | null>(null);
  const shouldAdvanceOnDelete = advanceOnDelete ?? (type !== 'mode');

  const initialData = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    if (fallbackData && fallbackData.length > 0) {
      return fallbackData;
    }
    return Array(ENVELOPE_LENGTH).fill(0);
  }, [data, fallbackData]);

  const [envelopeData, setEnvelopeData] = useState<number[]>(initialData);
  const [currentPosition, setCurrentPosition] = useState(0);

  useEffect(() => {
    if (data) {
      setEnvelopeData(data);
    }
  }, [data]);

  const commitData = useCallback(
    (producer: (prev: number[]) => number[]) => {
      setEnvelopeData(prev => {
        const next = producer(prev);
        onChange?.(next);
        return next;
      });
    },
    [onChange]
  );

  const handleValueChange = useCallback(
    (delta: number) => {
      commitData(prev => {
        const next = [...prev];
        const currentValue = next[currentPosition] ?? 0;
        next[currentPosition] = applyEnvelopeDelta(type, currentValue, delta);
        return next;
      });
    },
    [commitData, currentPosition, type]
  );

  const handlePositionClick = useCallback(
    (position: number) => {
      lastPositionRef.current = currentPosition;
      setCurrentPosition(position);
      setActiveSection(sectionName);
    },
    [currentPosition, sectionName, setActiveSection]
  );

  const setValueAt = useCallback(
    (index: number, value: number) => {
      commitData(prev => {
        const next = [...prev];
        next[index] = clampEnvelopeValue(type, value);
        return next;
      });
    },
    [commitData, type]
  );

  const cycleValueAt = useCallback(
    (index: number, cycleFn: (current: number) => number) => {
      commitData(prev => {
        const next = [...prev];
        const currentValue = next[index] ?? 0;
        next[index] = clampEnvelopeValue(type, cycleFn(currentValue));
        return next;
      });
    },
    [commitData, type]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive) return;

      const key = event.key.toUpperCase();
      const digitMatch = event.code.match(/^Digit([0-9])$/u);
      const hexKey = digitMatch ? digitMatch[1] : key;

      if (event.ctrlKey && event.shiftKey) {
        if (key === 'BACKSPACE') {
          event.preventDefault();
          commitData(() => Array(ENVELOPE_LENGTH).fill(0));
          return;
        }

        if (key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
          event.preventDefault();
          commitData(prev => rotateEnvelopeData(prev, key === 'ARROWLEFT' ? 'left' : 'right'));
          return;
        }

        if (key === 'ARROWUP' || key === 'ARROWDOWN') {
          event.preventDefault();
          const delta = key === 'ARROWUP' ? 1 : -1;
          commitData(prev => shiftEnvelopeDataValues(type, prev, delta));
          return;
        }

        if (type === 'shift' && key === 'ENTER') {
          event.preventDefault();
          commitData(prev => repeatEnvelopePatternToLength(prev, currentPosition));
          return;
        }
      }

      if (key === 'ARROWLEFT') {
        event.preventDefault();
        lastPositionRef.current = currentPosition;
        setCurrentPosition(prev => getMovedEnvelopePosition(prev, 'left'));
        return;
      }

      if (key === 'ARROWRIGHT') {
        event.preventDefault();
        lastPositionRef.current = currentPosition;
        setCurrentPosition(prev => getMovedEnvelopePosition(prev, 'right'));
        return;
      }

      if (key === 'ARROWUP') {
        event.preventDefault();
        handleValueChange(1);
        return;
      }

      if (key === 'ARROWDOWN') {
        event.preventDefault();
        handleValueChange(-1);
        return;
      }

      if (key === 'BACKSPACE' || key === 'DELETE') {
        event.preventDefault();
        commitData(prev => {
          const next = [...prev];
          next[currentPosition] = 0;
          return next;
        });

        if (shouldAdvanceOnDelete) {
          lastPositionRef.current = currentPosition;
          const nextPosition = getNextEnvelopePosition(currentPosition);
          setCurrentPosition(nextPosition);
        }
        return;
      }

      const handleHexInput = () => {
        event.preventDefault();
        const parsed = parseEnvelopeHexValue(
          type,
          hexKey,
          event.shiftKey,
          type === 'noise' ? NOISE_MAX : undefined
        );
        if (parsed == null) {
          return;
        }
        setValueAt(currentPosition, parsed);
        lastPositionRef.current = currentPosition;
        const nextPosition = getNextEnvelopePosition(currentPosition);
        setCurrentPosition(nextPosition);
      };

      if ((type === 'volume' || type === 'shift' || type === 'noise') && /^[0-9A-F]$/u.test(hexKey)) {
        handleHexInput();
        return;
      }

      if (type === 'mode' && (key === 'T' || key === 'N' || key === 'B')) {
        event.preventDefault();
        const parsed = parseEnvelopeModeValue(key);
        if (parsed != null) {
          setValueAt(currentPosition, parsed);
          lastPositionRef.current = currentPosition;
          const nextPosition = getNextEnvelopePosition(currentPosition);
          setCurrentPosition(nextPosition);
        }
        return;
      }

      if (
        (type === 'pitch' || type === 'noise' || type === 'shift' || type === 'volume') &&
        event.key === ' '
      ) {
        event.preventDefault();
        if (lastPositionRef.current !== null) {
          commitData(prev =>
            copyEnvelopeValueFromLastPosition(prev, currentPosition, lastPositionRef.current ?? 0)
          );
        }
        return;
      }

      if (type === 'mode' && event.key === ' ') {
        event.preventDefault();
        cycleValueAt(currentPosition, current => {
          const next = current + 1;
          return next > 2 ? 0 : next;
        });
        return;
      }

      if (type === 'volume' && key === 'S' && onSustainChange) {
        event.preventDefault();
        onSustainChange(toggleSustainIndex(currentPosition, sustainIndex ?? null));
      }
    },
    [
      commitData,
      currentPosition,
      cycleValueAt,
      handleValueChange,
      isActive,
      setValueAt,
      sustainIndex,
      type,
      onSustainChange,
    ]
  );

  return {
    sectionName,
    isActive,
    envelopeData,
    currentPosition,
    handleKeyDown,
    handlePositionClick,
    handleValueChange,
    setValueAt,
    cycleValueAt,
    lastPositionRef,
  };
}

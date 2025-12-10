import React, { useCallback, useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberSpinnerProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  ariaLabel?: string;
  className?: string;
  inputRef?: (el: HTMLInputElement | null) => void;
  onInputKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onInputFocus?: () => void;
}

const NumberSpinner: React.FC<NumberSpinnerProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  ariaLabel,
  className = '',
  inputRef,
  onInputKeyDown,
  onInputFocus
}) => {
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInputValue('');
    } else {
      setInputValue(String((value as number) | 0));
    }
  }, [value]);

  const parseValue = useCallback((raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '-') return null;
    const parsed = parseInt(trimmed, 10);
    if (!Number.isFinite(parsed)) return null;
    return parsed | 0;
  }, []);

  const clampValue = useCallback(
    (val: number): number => {
      let next = val;
      if (typeof min === 'number' && next < min) next = min;
      if (typeof max === 'number' && next > max) next = max;
      return next;
    },
    [min, max]
  );

  const commitValue = useCallback(
    (raw: string) => {
      const parsed = parseValue(raw);
      if (parsed === null) {
        setInputValue('');
        return;
      }
      const clamped = clampValue(parsed);
      setInputValue(String(clamped));
      onChange(clamped);
    },
    [clampValue, onChange, parseValue]
  );

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (/^-?\d*$/.test(next)) {
      setInputValue(next);
    }
  }, []);

  const getBaseForDelta = useCallback((): number => {
    const fromInput = parseValue(inputValue);
    if (fromInput !== null) return fromInput;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof min === 'number') return min;
    return 0;
  }, [inputValue, min, parseValue, value]);

  const adjustBy = useCallback(
    (delta: number) => {
      const parsed = parseValue(inputValue);
      const hasCurrentValue =
        parsed !== null || (typeof value === 'number' && Number.isFinite(value));

      if (!hasCurrentValue && delta > 0) {
        const initial = typeof min === 'number' ? min : 0;
        commitValue(String(initial));
        return;
      }

      const base = getBaseForDelta();
      const next = base + delta;
      commitValue(String(next));
    },
    [commitValue, getBaseForDelta, inputValue, min, parseValue, value]
  );

  const handleBlur = useCallback(() => {
    commitValue(inputValue);
  }, [commitValue, inputValue]);

  const handleKeyDownInternal = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.ctrlKey && event.key === 'ArrowUp') {
        event.preventDefault();
        adjustBy(step);
        return;
      }
      if (event.ctrlKey && event.key === 'ArrowDown') {
        event.preventDefault();
        adjustBy(-step);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        commitValue(inputValue);
      }
      if (onInputKeyDown) {
        onInputKeyDown(event);
      }
    },
    [adjustBy, commitValue, inputValue, onInputKeyDown, step]
  );

  const currentParsed = parseValue(inputValue);

  return (
    <span className={`number-spinner ${className}`.trim()}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="-?[0-9]*"
        className="info-input number-spinner-input"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDownInternal}
        onFocus={onInputFocus}
        aria-label={ariaLabel || label || 'Number input'}
        role="spinbutton"
        aria-valuenow={currentParsed ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
      />
      <button
        type="button"
        onClick={() => adjustBy(step)}
        aria-label="Increase value"
        className="number-spinner-button"
      >
        <ChevronUp className="h-3 w-3 rotate-90" />
      </button>
      <button
        type="button"
        onClick={() => adjustBy(-step)}
        aria-label="Decrease value"
        className="number-spinner-button"
      >
        <ChevronDown className="h-3 w-3 rotate-90" />
      </button>
    </span>
  );
}

export default NumberSpinner;

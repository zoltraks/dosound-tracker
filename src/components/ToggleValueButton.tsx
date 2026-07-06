import React, { useCallback } from 'react';

interface ToggleValueButtonProps {
  value: number;
  values: number[];
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
}

const ToggleValueButton: React.FC<ToggleValueButtonProps> = ({
  value,
  values,
  formatValue,
  onChange,
  ariaLabel,
  className = '',
}) => {
  const handleClick = useCallback(() => {
    const currentIndex = values.indexOf(value);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % values.length : 0;
    onChange(values[nextIndex]);
  }, [onChange, value, values]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`toggle-value-button ${className}`.trim()}
    >
      {formatValue(value)}
    </button>
  );
};

export default ToggleValueButton;

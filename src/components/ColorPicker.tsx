import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';

export interface ColorPickerProps {
  /**
   * Currently selected color in 3-digit or 6-digit hex format (e.g. "#888").
   * When omitted or invalid, the picker falls back to a safe default.
   */
  value?: string;
  /**
   * Called whenever the selected color changes (via palette or custom input).
   */
  onChange?: (color: string) => void;
  /**
   * Optional title text. Defaults to "Color Picker".
   */
  title?: string;
  /**
   * Optional extra class name for the root container.
   */
  className?: string;
}

interface PaletteTone {
  name: string;
  shades: string[];
}

interface PaletteEntry {
  tone: string;
  shadeIndex: number;
  color: string;
}

const DEFAULT_COLOR = '#888';

const BASE_PALETTE: PaletteTone[] = [
  { name: 'gray', shades: ['#000', '#222', '#444', '#666', '#888', '#aaa', '#ccc', '#eee'] },
  { name: 'red', shades: ['#900', '#b33', '#d55', '#f77', '#f99', '#fbb', '#fdd', '#fee'] },
  { name: 'green', shades: ['#090', '#3b3', '#5d5', '#7f7', '#9f9', '#bfb', '#dfd', '#efe'] },
  { name: 'blue', shades: ['#009', '#33b', '#55d', '#77f', '#99f', '#bbf', '#ddf', '#eef'] },
  { name: 'orange', shades: ['#930', '#b53', '#d75', '#f97', '#fb9', '#fdb', '#fec', '#fee'] },
  { name: 'cyan', shades: ['#099', '#3bb', '#5dd', '#7ff', '#9ff', '#bff', '#dff', '#eff'] },
  { name: 'yellow', shades: ['#990', '#bb3', '#dd5', '#ff7', '#ff9', '#ffb', '#ffd', '#ffe'] },
  { name: 'magenta', shades: ['#909', '#b3b', '#d5d', '#f7f', '#f9f', '#fbf', '#fdf', '#fef'] },
];

const PALETTE_ENTRIES: PaletteEntry[] = BASE_PALETTE.flatMap(tone =>
  tone.shades.map((color, shadeIndex) => ({ tone: tone.name, shadeIndex, color }))
);

const normalizeColor = (raw: string | undefined): string => {
  if (!raw) {
    return DEFAULT_COLOR;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return DEFAULT_COLOR;
  }

  const lower = trimmed.toLowerCase();

  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/u.test(lower)) {
    return DEFAULT_COLOR;
  }

  return lower;
};

const getTextColorForBackground = (color: string): string => {
  const hex = color.startsWith('#') ? color.slice(1) : color;

  let r: number;
  let g: number;
  let b: number;

  if (hex.length === 3) {
    const rHex = hex[0];
    const gHex = hex[1];
    const bHex = hex[2];
    r = parseInt(rHex + rHex, 16);
    g = parseInt(gHex + gHex, 16);
    b = parseInt(bHex + bHex, 16);
  } else if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    return '#000000';
  }

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128 ? '#ffffff' : '#000000';
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  title,
  className,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(() => normalizeColor(value));
  const [customValue, setCustomValue] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  useEffect(() => {
    setSelectedColor(normalizeColor(value));
  }, [value]);

  const emitChange = useCallback(
    (nextColor: string) => {
      const normalized = normalizeColor(nextColor);
      setSelectedColor(normalized);
      if (onChange) {
        onChange(normalized);
      }
    },
    [onChange]
  );

  const handleColorSelect = useCallback(
    (color: string) => {
      emitChange(color);
      setShowCustomInput(false);
      setCustomValue('');
    },
    [emitChange]
  );

  const handleCustomInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let next = event.target.value.toLowerCase();
      next = next.replace(/[^0-9a-f]/gu, '');

      if (next.length > 3) {
        next = next.slice(0, 3);
      }

      setCustomValue(next);

      if (next.length === 3) {
        emitChange(`#${next}`);
      }
    },
    [emitChange]
  );

  const handleCustomSubmit = useCallback(() => {
    if (customValue.length === 3) {
      setShowCustomInput(false);
      setCustomValue('');
    }
  }, [customValue.length]);

  const handleCancelCustom = useCallback(() => {
    setShowCustomInput(false);
    setCustomValue('');
  }, []);

  const effectivePreviewColor = useMemo(() => {
    if (customValue.length === 3) {
      return `#${customValue}`;
    }
    return selectedColor;
  }, [customValue, selectedColor]);

  const previewTextColor = useMemo(
    () => getTextColorForBackground(effectivePreviewColor),
    [effectivePreviewColor]
  );

  const rootClassName = useMemo(() => {
    const parts = ['color-picker'];
    if (className && className.trim()) {
      parts.push(className.trim());
    }
    return parts.join(' ');
  }, [className]);

  return (
    <div className={rootClassName}>
      <div className="color-picker-title">{title || 'Color Picker'}</div>

      <div
        className="color-preview-bar"
        style={{ backgroundColor: effectivePreviewColor }}
      >
        <span
          className="color-preview-label"
          style={{ color: previewTextColor }}
        >
          {effectivePreviewColor}
        </span>
      </div>

      <div className="color-picker-grid">
        {PALETTE_ENTRIES.map(entry => {
          const { tone, shadeIndex, color } = entry;
          const isSelected = selectedColor === color;
          const key = `${tone}-${shadeIndex}`;
          const checkColor = getTextColorForBackground(color);

          return (
            <button
              key={key}
              type="button"
              className={`color-grid-cell${isSelected ? ' color-grid-cell-selected' : ''}`}
              style={{
                backgroundColor: color,
                borderColor: isSelected ? '#facc15' : undefined,
              }}
              onClick={() => handleColorSelect(color)}
              title={color}
              aria-label={color}
            >
              <span className="color-grid-cell-inner">
                {isSelected && (
                  <Check
                    size={14}
                    style={{ color: checkColor }}
                    aria-hidden="true"
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {!showCustomInput ? (
        <button
          type="button"
          className="command-btn color-picker-hex-toggle"
          onClick={() => setShowCustomInput(true)}
        >
          HEX
        </button>
      ) : (
        <div className="color-picker-custom">
          <div className="color-picker-custom-row">
            <div className="color-picker-custom-input">
              <span className="color-picker-custom-prefix">#</span>
              <input
                type="text"
                value={customValue}
                onChange={handleCustomInputChange}
                maxLength={3}
                className="info-input color-picker-custom-input-field"
                aria-label="Custom hex color"
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              className="command-btn color-picker-apply-btn"
              onClick={handleCustomSubmit}
              disabled={customValue.length !== 3}
            >
              Apply
            </button>
            <button
              type="button"
              className="command-btn color-picker-cancel-btn"
              onClick={handleCancelCustom}
            >
              Cancel
            </button>
          </div>
          {customValue.length === 3 && (
            <div className="color-picker-custom-preview">
              <div
                className="color-picker-custom-swatch"
                style={{ backgroundColor: `#${customValue}` }}
              />
              <span className="color-picker-custom-preview-label">
                Preview: #{customValue}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

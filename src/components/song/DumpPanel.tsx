import { Formatter } from '../../utils/format/formatters.ts';
import React, { useEffect, useRef, useState } from 'react';
import { logger } from '../../utils/log/logger.ts';
import type { SoundEngine } from '../../synth/soundEngine.ts';

interface DumpPanelProps {
  ym2149: SoundEngine | null;
  ym2149b?: SoundEngine | null;
}

interface DerivedRegisters {
  toneA: number;
  toneB: number;
  toneC: number;
  volumeA: number;
  volumeB: number;
  volumeC: number;
  mixer: number;
  noisePeriod: number;
}

export const DumpPanel: React.FC<DumpPanelProps> = ({ ym2149, ym2149b }) => {
  const ym2149Ref = useRef<SoundEngine | null>(null);
  const ym2149bRef = useRef<SoundEngine | null>(null);
  const [activeChip, setActiveChip] = useState<0 | 1>(0);
  const [derived, setDerived] = useState<DerivedRegisters>({
    toneA: 0,
    toneB: 0,
    toneC: 0,
    volumeA: 0,
    volumeB: 0,
    volumeC: 0,
    mixer: 0,
    noisePeriod: 0,
  });

  useEffect(() => {
    ym2149Ref.current = ym2149;
    ym2149bRef.current = ym2149b ?? null;
  }, [ym2149, ym2149b]);

  useEffect(() => {
    const updateInterval = window.setInterval(() => {
      const currentYm2149 =
        activeChip === 0 ? ym2149Ref.current : (ym2149bRef.current ?? ym2149Ref.current);
      if (!currentYm2149) {
        setDerived((prev) => {
          if (
            prev.toneA === 0 &&
            prev.toneB === 0 &&
            prev.toneC === 0 &&
            prev.volumeA === 0 &&
            prev.volumeB === 0 &&
            prev.volumeC === 0 &&
            prev.mixer === 0 &&
            prev.noisePeriod === 0
          ) {
            return prev;
          }
          return {
            toneA: 0,
            toneB: 0,
            toneC: 0,
            volumeA: 0,
            volumeB: 0,
            volumeC: 0,
            mixer: 0,
            noisePeriod: 0,
          };
        });
        return;
      }

      const registers = currentYm2149.getRegistersArray();

      const toneA = ((registers[1] & 0x0f) << 8) | (registers[0] || 0);
      const toneB = ((registers[3] & 0x0f) << 8) | (registers[2] || 0);
      const toneC = ((registers[5] & 0x0f) << 8) | (registers[4] || 0);

      const volumeA = registers[8] & 0x0f;
      const volumeB = registers[9] & 0x0f;
      const volumeC = registers[10] & 0x0f;

      const mixer = registers[7] || 0;
      const noisePeriod = registers[6] & 0x1f;

      setDerived({
        toneA,
        toneB,
        toneC,
        volumeA,
        volumeB,
        volumeC,
        mixer,
        noisePeriod,
      });
    }, 100);

    return () => clearInterval(updateInterval);
  }, [activeChip]);

  const formatHex = (value: number, width: number) => {
    return Formatter.hex(value, { padWidth: width });
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      return;
    }

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        void navigator.clipboard.writeText(text).catch((error) => {
          logger.error('Failed to copy to clipboard', error);
        });
        return;
      }

      if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (error) {
      logger.error('Clipboard copy failed', error);
    }
  };

  const rows = [
    {
      leftLabel: 'TA',
      leftValue: `$${formatHex(derived.toneA, 4)}`,
      rightLabel: 'VA',
      rightValue: `$${formatHex(derived.volumeA, 1)}`,
    },
    {
      leftLabel: 'TB',
      leftValue: `$${formatHex(derived.toneB, 4)}`,
      rightLabel: 'VB',
      rightValue: `$${formatHex(derived.volumeB, 1)}`,
    },
    {
      leftLabel: 'TC',
      leftValue: `$${formatHex(derived.toneC, 4)}`,
      rightLabel: 'VC',
      rightValue: `$${formatHex(derived.volumeC, 1)}`,
    },
    {
      leftLabel: 'MX',
      leftValue: `$${formatHex(derived.mixer, 2)}`,
      rightLabel: 'NS',
      rightValue: `$${formatHex(derived.noisePeriod, 2)}`,
    },
  ];

  const handleCopyDump = () => {
    const TARGET_LEFT_WIDTH = 10;

    const lines: string[] = rows.map((row) => {
      const leftText = `${row.leftLabel} ${row.leftValue}`;
      const hasRight = !!row.rightLabel && !!row.rightValue;

      if (!hasRight) {
        return leftText;
      }

      const paddingSpaces = Math.max(1, TARGET_LEFT_WIDTH - leftText.length);
      const paddedLeft = leftText + ' '.repeat(paddingSpaces);

      const isNoiseRow = row.rightLabel === 'NS';
      const rightSeparator = isNoiseRow ? ' ' : '  ';

      return `${paddedLeft}${row.rightLabel}${rightSeparator}${row.rightValue}`;
    });

    copyToClipboard(lines.join('\n'));
  };

  return (
    <div className="dump-panel">
      {ym2149b && (
        <div className="chip-switcher" role="group" aria-label="Dump chip">
          {([0, 1] as const).map((chip) => (
            <button
              key={chip}
              type="button"
              className={`chip-switcher-button ${activeChip === chip ? 'active' : ''}`}
              aria-pressed={activeChip === chip}
              onClick={(event) => {
                event.stopPropagation();
                setActiveChip(chip);
              }}
            >
              {chip === 0 ? 'CHIP 1' : 'CHIP 2'}
            </button>
          ))}
        </div>
      )}
      <div
        className="dump-header"
        role="button"
        tabIndex={0}
        aria-label="Copy register dump to clipboard"
        onClick={handleCopyDump}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleCopyDump();
          }
        }}
      >
        Dump
      </div>
      <div className="dump-content">
        <div className="register-grid">
          {rows.map((row, index) => (
            <React.Fragment key={index}>
              <div className="register-item">
                <span className="register-name">{row.leftLabel}</span>
                <span
                  className="register-value"
                  role="button"
                  aria-label={`Copy ${row.leftLabel} value ${row.leftValue}`}
                  onClick={() => copyToClipboard(row.leftValue)}
                >
                  {row.leftValue}
                </span>
              </div>
              {row.rightLabel && (
                <div className="register-item">
                  <span className="register-name">{row.rightLabel}</span>
                  <span
                    className="register-value"
                    role="button"
                    aria-label={`Copy ${row.rightLabel} value ${row.rightValue}`}
                    onClick={() => copyToClipboard(row.rightValue)}
                  >
                    {row.rightValue}
                  </span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { YM2149 } from '../synth/ym2149/YM2149';

interface DumpPanelProps {
  ym2149: YM2149 | null;
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

export const DumpPanel: React.FC<DumpPanelProps> = ({ ym2149 }) => {
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
    if (!ym2149) return;

    const updateInterval = setInterval(() => {
      const registers = ym2149.getRegistersArray();

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
    }, 100); // Update every 100ms

    return () => clearInterval(updateInterval);
  }, [ym2149]);

  const formatHex = (value: number, width: number) => {
    return value.toString(16).toUpperCase().padStart(width, '0');
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
      rightLabel: 'NF',
      rightValue: `$${formatHex(derived.noisePeriod, 2)}`,
    },
  ];

  return (
    <div className="dump-panel">
      <div className="dump-header">Dump</div>
      <div className="dump-content">
        <div className="register-grid">
          {rows.map((row, index) => (
            <React.Fragment key={index}>
              <div className="register-item">
                <span className="register-name">{row.leftLabel}</span>
                <span className="register-value">{row.leftValue}</span>
              </div>
              {row.rightLabel && (
                <div className="register-item">
                  <span className="register-name">{row.rightLabel}</span>
                  <span className="register-value">{row.rightValue}</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

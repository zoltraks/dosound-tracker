import React, { useEffect, useState } from 'react';
import { YM2149 } from '../synth/ym2149/YM2149';

interface DumpPanelProps {
  ym2149: YM2149 | null;
}

export const DumpPanel: React.FC<DumpPanelProps> = ({ ym2149 }) => {
  const [registers, setRegisters] = useState<number[]>(Array(14).fill(0));

  useEffect(() => {
    if (!ym2149) return;

    const updateInterval = setInterval(() => {
      const currentRegisters = ym2149.getRegistersArray();
      setRegisters(currentRegisters);
    }, 100); // Update every 100ms

    return () => clearInterval(updateInterval);
  }, [ym2149]);

  const formatRegisterValue = (value: number) => {
    return value.toString(16).padStart(2, '0').toUpperCase();
  };

  const getRegisterName = (index: number) => {
    const names = [
      'TA', 'TB', 'TC', 'NA', 'NB', 'NC', 'NF', 
      'MX', 'VA', 'VB', 'VC', 'EF', 'EL', 'EH'
    ];
    return names[index] || `R${index}`;
  };

  return (
    <div className="dump-panel">
      <div className="dump-header">Register Dump</div>
      <div className="dump-content">
        <div className="register-grid">
          {registers.map((value, index) => (
            <div key={index} className="register-item">
              <span className="register-name">{getRegisterName(index)}</span>
              <span className="register-value">${formatRegisterValue(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

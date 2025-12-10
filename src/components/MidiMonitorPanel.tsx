import React, { useEffect, useRef } from 'react';
import type { MidiMonitorEntry } from '../hooks/useMidi';

interface MidiMonitorPanelProps {
  title: string;
  entries: MidiMonitorEntry[];
  onCopy: (entries: MidiMonitorEntry[], label: string) => void;
}

export const MidiMonitorPanel: React.FC<MidiMonitorPanelProps> = ({
  title,
  entries,
  onCopy,
}) => {
  const count = entries.length;

  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = bodyRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [count]);

  const handleCopyClick = () => {
    if (count === 0) return;
    onCopy(entries, title);
  };

  return (
    <div className="midi-monitor-panel">
      <div className="midi-monitor-title">
        <span>{title}</span>
        <button
          className="midi-monitor-copy-btn"
          type="button"
          onClick={handleCopyClick}
          disabled={count === 0}
        >
          COPY
        </button>
      </div>
      <div className="midi-monitor-header">
        <span className="midi-col time">Time</span>
        <span className="midi-col data">Data</span>
        <span className="midi-col device">Device</span>
        <span className="midi-col channel">Ch</span>
        <span className="midi-col type">Type</span>
        <span className="midi-col note">Note</span>
        <span className="midi-col value">Value</span>
      </div>
      <div className="midi-monitor-body" ref={bodyRef}>
        {entries.map(entry => (
          <div key={entry.id} className="midi-monitor-row">
            <span className="midi-col time">{entry.time}</span>
            <span className="midi-col data">{entry.data}</span>
            <span className="midi-col device">{entry.device}</span>
            <span className="midi-col channel">{entry.channel}</span>
            <span className="midi-col type">{entry.type}</span>
            <span className="midi-col note">{entry.note}</span>
            <span className="midi-col value">{entry.value ?? ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

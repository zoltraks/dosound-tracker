import React from 'react';
import type { MidiDeviceInfo } from '../hooks/useMidi';

interface MidiDeviceSelectProps {
  id: string;
  label: string;
  devices: MidiDeviceInfo[];
  disabled: boolean;
  selectedId: string | null;
  emptyLabel: string;
  noneLabel: string;
  onChange: (nextId: string | null) => void;
}

export const MidiDeviceSelect: React.FC<MidiDeviceSelectProps> = ({
  id,
  label,
  devices,
  disabled,
  selectedId,
  emptyLabel,
  noneLabel,
  onChange,
}) => {
  const hasDevices = devices.length > 0;

  return (
    <div className="midi-device-column">
      <label className="midi-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="midi-select"
        value={selectedId || ''}
        onChange={event => {
          const nextId = event.target.value || null;
          onChange(nextId);
        }}
        disabled={disabled}
      >
        {!hasDevices && <option value="">{emptyLabel}</option>}
        {hasDevices && <option value="">{noneLabel}</option>}
        {devices.map(device => (
          <option key={device.id} value={device.id}>
            {device.name}
          </option>
        ))}
      </select>
    </div>
  );
};

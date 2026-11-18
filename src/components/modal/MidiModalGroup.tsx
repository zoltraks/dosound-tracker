import React from 'react';
import type {
  MidiConfiguration,
  MidiDeviceInfo,
  MidiMonitorEntry,
} from '../../hooks/midi/useMidi.ts';

// The MIDI dialog loads on demand like the settings modal: it opens only on
// explicit user action, so keeping it out of the entry chunk protects the
// bundle budget.
const MidiModal = React.lazy(async () => {
  const { MidiModal } = await import('../../modals/midi/MidiModal.tsx');
  return { default: MidiModal };
});

export interface MidiModalGroupParams {
  isMidiSupported: boolean;
  midiAccessError: string | null;
  midiConfiguration: MidiConfiguration;
  midiDevices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  midiInMonitor: MidiMonitorEntry[];
  midiOutMonitor: MidiMonitorEntry[];
  onSaveMidiConfiguration: (configuration: MidiConfiguration) => void;
  onCloseMidi: () => void;
  onClearMidiMonitors: () => void;
  onRescanMidiDevices: () => void;
  onLiveMidiConfigurationChange: (patch: Partial<MidiConfiguration>) => void;
  onMidiSystemReset: () => void;
}

export interface MidiModalGroupProps extends MidiModalGroupParams {
  isMidiModalOpen: boolean;
  setMidiCopySummary: (value: string) => void;
  setMidiLoadError: (value: string) => void;
}

export function MidiModalGroup({
  isMidiModalOpen,
  isMidiSupported,
  midiAccessError,
  midiConfiguration,
  midiDevices,
  midiInMonitor,
  midiOutMonitor,
  onSaveMidiConfiguration,
  onCloseMidi,
  onClearMidiMonitors,
  onRescanMidiDevices,
  onLiveMidiConfigurationChange,
  setMidiCopySummary,
  setMidiLoadError,
  onMidiSystemReset,
}: MidiModalGroupProps) {
  if (!isMidiModalOpen) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <MidiModal
        isOpen={isMidiModalOpen}
        isSupported={isMidiSupported}
        accessError={midiAccessError}
        configuration={midiConfiguration}
        devices={midiDevices}
        inMonitor={midiInMonitor}
        outMonitor={midiOutMonitor}
        onSave={onSaveMidiConfiguration}
        onCancel={onCloseMidi}
        onClear={onClearMidiMonitors}
        onRescan={onRescanMidiDevices}
        onChangeConfig={onLiveMidiConfigurationChange}
        onCopySummary={setMidiCopySummary}
        onLoadError={setMidiLoadError}
        onSystemReset={onMidiSystemReset}
      />
    </React.Suspense>
  );
}

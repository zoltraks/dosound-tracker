/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';
import type { MidiConfiguration } from './useMidi';

export interface UseMidiDialogParams {
  midiConfiguration: MidiConfiguration;
  setMidiConfiguration: (configuration: MidiConfiguration) => void;
  setIsMidiModalOpen: (open: boolean) => void;
  resetMidiProgramCache: () => void;
  clearMidiMonitors: () => void;
  refreshMidiDevices: () => void;
  sendSystemReset: () => void;
}

export interface UseMidiDialogResult {
  handleLiveMidiConfigChange: (patch: Partial<MidiConfiguration>) => void;
  handleShowMidi: () => void;
  handleCloseMidi: () => void;
  handleSaveMidiConfig: (configuration: MidiConfiguration) => void;
  handleClearMidiMonitors: () => void;
  handleRescanMidiDevices: () => void;
  handleMidiSystemReset: () => void;
}

export function useMidiDialog({
  midiConfiguration,
  setMidiConfiguration,
  setIsMidiModalOpen,
  resetMidiProgramCache,
  clearMidiMonitors,
  refreshMidiDevices,
  sendSystemReset,
}: UseMidiDialogParams): UseMidiDialogResult {
  const handleLiveMidiConfigChange = useCallback(
    (patch: Partial<MidiConfiguration>) => {
      setMidiConfiguration({ ...midiConfiguration, ...patch });
    },
    [midiConfiguration, setMidiConfiguration],
  );

  const handleShowMidi = useCallback(() => {
    setIsMidiModalOpen(true);
  }, []);

  const handleCloseMidi = useCallback(() => {
    resetMidiProgramCache();
    setIsMidiModalOpen(false);
  }, [resetMidiProgramCache]);

  const handleSaveMidiConfig = useCallback(
    (configuration: MidiConfiguration) => {
      setMidiConfiguration(configuration);
      resetMidiProgramCache();
      setIsMidiModalOpen(false);
    },
    [resetMidiProgramCache, setMidiConfiguration],
  );

  const handleClearMidiMonitors = useCallback(() => {
    clearMidiMonitors();
  }, [clearMidiMonitors]);

  const handleRescanMidiDevices = useCallback(() => {
    refreshMidiDevices();
  }, [refreshMidiDevices]);

  const handleMidiSystemReset = useCallback(() => {
    sendSystemReset();
  }, [sendSystemReset]);

  return {
    handleLiveMidiConfigChange,
    handleShowMidi,
    handleCloseMidi,
    handleSaveMidiConfig,
    handleClearMidiMonitors,
    handleRescanMidiDevices,
    handleMidiSystemReset,
  };
}

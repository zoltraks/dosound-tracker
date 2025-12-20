import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { MidiConfiguration, MidiDeviceInfo, MidiMonitorEntry } from '../hooks/useMidi';
import { MidiMonitorPanel } from '../components/MidiMonitorPanel';
import { MidiDeviceSelect } from '../components/MidiDeviceSelect';
import { buildMidiConfigurationYaml, parseMidiConfigurationFromYaml, MidiConfigurationFormatError } from '../utils/midiConfig';
import { downloadFile } from '../utils/fileOperations';

interface MidiModalProps {
  isOpen: boolean;
  isSupported: boolean;
  accessError: string | null;
  configuration: MidiConfiguration;
  devices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  inMonitor: MidiMonitorEntry[];
  outMonitor: MidiMonitorEntry[];
  onSave: (configuration: MidiConfiguration) => void;
  onCancel: () => void;
  onClear: () => void;
  onRescan: () => void;
  onChangeConfig: (patch: Partial<MidiConfiguration>) => void;
  onCopySummary?: (summary: string) => void;
  onLoadError?: (message: string) => void;
  onSystemReset: () => void;
}

export const MidiModal: React.FC<MidiModalProps> = ({
  isOpen,
  isSupported,
  accessError,
  configuration,
  devices,
  inMonitor,
  outMonitor,
  onSave,
  onCancel,
  onClear,
  onRescan,
  onChangeConfig,
  onCopySummary,
  onLoadError,
  onSystemReset,
}) => {
  const [localConfig, setLocalConfig] = useState<MidiConfiguration>(configuration);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(configuration);
    }
  }, [isOpen, configuration]);

  useEffect(() => {
    if (!isOpen) return;
  }, [isOpen]);

  const hasInputs = devices.inputs.length > 0;
  const hasOutputs = devices.outputs.length > 0;

  const effectiveInputId = useMemo(() => {
    return localConfig.inputId;
  }, [localConfig.inputId]);

  const effectiveOutputId = useMemo(() => {
    return localConfig.outputId;
  }, [localConfig.outputId]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      inputEnabled: localConfig.inputEnabled && !!effectiveInputId,
      outputEnabled: localConfig.outputEnabled && !!effectiveOutputId,
      inputId: effectiveInputId || null,
      outputId: effectiveOutputId || null,
      ignoreInputVolume: localConfig.ignoreInputVolume,
      ignoreOutputVolume: localConfig.ignoreOutputVolume,
    });
  };

  const handleExportConfig = () => {
    try {
      const yamlContent = buildMidiConfigurationYaml(localConfig);

      downloadFile(yamlContent, 'midi-configuration.yaml', 'text/yaml');
    } catch (error) {
      console.error('Failed to export MIDI configuration:', error);
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = (e.target?.result ?? '') as string;
        const nextConfig = parseMidiConfigurationFromYaml(text, localConfig);

        setLocalConfig(nextConfig);
        onChangeConfig(nextConfig);
      } catch (error) {
        if (error instanceof MidiConfigurationFormatError) {
          console.error(error.message);
          if (onLoadError) {
            onLoadError(error.message);
          }
        } else {
          console.error('Failed to load MIDI configuration file:', error);
          if (onLoadError) {
            const message = error instanceof Error ? error.message : String(error);
            onLoadError(`Failed to load MIDI configuration file: ${message}`);
          }
        }
      } finally {
        input.value = '';
      }
    };

    reader.readAsText(file);
    reader.onerror = () => {
      const error = reader.error;
      if (onLoadError) {
        const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
        onLoadError(`Failed to read MIDI configuration file: ${message}`);
      }
    };
  };

  const handleCopyMonitor = (entries: MidiMonitorEntry[], label: string) => {
    const count = entries.length;
    if (count === 0) {
      return;
    }

    if (
      typeof navigator === 'undefined' ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== 'function'
    ) {
      return;
    }

    const padRight = (value: string, width: number) => {
      const truncated = value.length > width ? value.slice(0, width) : value;
      if (truncated.length >= width) return truncated;
      return truncated + ' '.repeat(width - truncated.length);
    };

    const padLeft = (value: string, width: number) => {
      const truncated = value.length > width ? value.slice(0, width) : value;
      if (truncated.length >= width) return truncated;
      return ' '.repeat(width - truncated.length) + truncated;
    };

    const header =
      `${padRight('Time', 12)}  ` +
      `${padRight('Data', 17)}  ` +
      `${padRight('Device', 20)}  ` +
      `${padRight('Ch', 2)}  ` +
      `${padRight('Type', 10)}  ` +
      `${padRight('Note', 4)}  ` +
      `${padRight('Value', 5)}`;

    const lines = entries.map(entry => {
      const device = entry.device ? entry.device.slice(0, 20) : '';
      const valueText = entry.value == null ? '' : String(entry.value);

      return (
        `${padRight(entry.time, 12)}  ` +
        `${padRight(entry.data, 17)}  ` +
        `${padRight(device, 20)}  ` +
        `${padRight(entry.channel, 2)}  ` +
        `${padRight(entry.type, 10)}  ` +
        `${padRight(entry.note, 4)}  ` +
        `${padLeft(valueText, 5)}`
      );
    });

    const text = [header, ...lines].join('\n');
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (onCopySummary) {
          const eventsWord = count === 1 ? 'event' : 'events';
          onCopySummary(`Copied ${count} ${label} ${eventsWord} to clipboard.`);
        }
      })
      .catch(() => undefined);
  };

  const supportMessage = !isSupported
    ? 'Web MIDI API is not supported in this environment.'
    : accessError
    ? `Could not access MIDI devices: ${accessError}`
    : '';

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog midi-modal">
        <div className="modal-title">MIDI</div>
        <div className="modal-body midi-modal-body">
          {supportMessage && (
            <div className="midi-warning">
              {supportMessage}
            </div>
          )}

          <div className="midi-io-columns">
            <div className="midi-io-column">
              <div className="midi-checkbox-group">
                <label className="midi-checkbox">
                  <input
                    type="checkbox"
                    checked={localConfig.inputEnabled}
                    disabled={!isSupported || !hasInputs}
                    onChange={event => {
                      const checked = event.target.checked;
                      setLocalConfig((prev: MidiConfiguration) => ({ ...prev, inputEnabled: checked }));
                      onChangeConfig({ inputEnabled: checked });
                    }}
                  />
                  <span>Enable MIDI input</span>
                </label>
                <label className="midi-checkbox">
                  <input
                    type="checkbox"
                    checked={localConfig.ignoreInputVolume}
                    onChange={event => {
                      const checked = event.target.checked;
                      setLocalConfig((prev: MidiConfiguration) => ({ ...prev, ignoreInputVolume: checked }));
                      onChangeConfig({ ignoreInputVolume: checked });
                    }}
                  />
                  <span>Ignore input volume</span>
                </label>
              </div>

              <MidiDeviceSelect
                id="midi-input-select"
                label="MIDI Input Device"
                devices={devices.inputs}
                disabled={!isSupported || !hasInputs}
                selectedId={effectiveInputId}
                emptyLabel="No input devices"
                noneLabel="(none)"
                onChange={nextId => {
                  setLocalConfig(prev => ({ ...prev, inputId: nextId }));
                  onChangeConfig({ inputId: nextId });
                }}
              />

              <MidiMonitorPanel
                title="MIDI IN"
                entries={inMonitor}
                onCopy={handleCopyMonitor}
              />
            </div>

            <div className="midi-io-column">
              <div className="midi-checkbox-group">
                <label className="midi-checkbox">
                  <input
                    type="checkbox"
                    checked={localConfig.outputEnabled}
                    disabled={!isSupported || !hasOutputs}
                    onChange={event => {
                      const checked = event.target.checked;
                      setLocalConfig((prev: MidiConfiguration) => ({ ...prev, outputEnabled: checked }));
                      onChangeConfig({ outputEnabled: checked });
                    }}
                  />
                  <span>Enable MIDI output</span>
                </label>
                <label className="midi-checkbox">
                  <input
                    type="checkbox"
                    checked={localConfig.ignoreOutputVolume}
                    onChange={event => {
                      const checked = event.target.checked;
                      setLocalConfig((prev: MidiConfiguration) => ({ ...prev, ignoreOutputVolume: checked }));
                      onChangeConfig({ ignoreOutputVolume: checked });
                    }}
                  />
                  <span>Ignore output volume</span>
                </label>
              </div>

              <MidiDeviceSelect
                id="midi-output-select"
                label="MIDI Output Device"
                devices={devices.outputs}
                disabled={!isSupported || !hasOutputs}
                selectedId={effectiveOutputId}
                emptyLabel="No output devices"
                noneLabel="(none)"
                onChange={nextId => {
                  setLocalConfig(prev => ({ ...prev, outputId: nextId }));
                  onChangeConfig({ outputId: nextId });
                }}
              />

              <MidiMonitorPanel
                title="MIDI OUT"
                entries={outMonitor}
                onCopy={handleCopyMonitor}
              />
            </div>
          </div>
        </div>

        <div className="modal-actions midi-actions">
          <div className="midi-actions-left">
            <button
              className="command-btn"
              type="button"
              onClick={onCancel}
            >
              CANCEL
            </button>
            <button
              className="command-btn"
              type="button"
              onClick={onClear}
            >
              CLEAR
            </button>
            <button
              className="command-btn"
              type="button"
              onClick={onRescan}
            >
              RESCAN
            </button>
            <button
              className="command-btn"
              type="button"
              onClick={onSystemReset}
              disabled={!localConfig.outputEnabled || !effectiveOutputId}
            >
              RESET
            </button>
          </div>
          <div className="midi-actions-right">
            <button
              className="command-btn"
              type="button"
              onClick={handleLoadClick}
            >
              LOAD
            </button>
            <button
              className="command-btn"
              type="button"
              onClick={handleExportConfig}
            >
              SAVE
            </button>
            <button
              className="command-btn"
              type="button"
              onClick={handleSave}
            >
              OK
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".yaml,.yml,text/yaml,text/x-yaml"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

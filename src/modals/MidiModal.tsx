import React, { useEffect, useMemo, useRef, useState } from 'react';
import yaml from 'js-yaml';
import type { MidiConfig, MidiDeviceInfo, MidiMonitorEntry } from '../hooks/useMidi';

interface MidiModalProps {
  isOpen: boolean;
  isSupported: boolean;
  accessError: string | null;
  config: MidiConfig;
  devices: {
    inputs: MidiDeviceInfo[];
    outputs: MidiDeviceInfo[];
  };
  inMonitor: MidiMonitorEntry[];
  outMonitor: MidiMonitorEntry[];
  onSave: (config: MidiConfig) => void;
  onCancel: () => void;
  onClear: () => void;
  onRescan: () => void;
  onChangeConfig: (patch: Partial<MidiConfig>) => void;
}

export const MidiModal: React.FC<MidiModalProps> = ({
  isOpen,
  isSupported,
  accessError,
  config,
  devices,
  inMonitor,
  outMonitor,
  onSave,
  onCancel,
  onClear,
  onRescan,
  onChangeConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<MidiConfig>(config);

  const inScrollRef = useRef<HTMLDivElement | null>(null);
  const outScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  useEffect(() => {
    const container = inScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [inMonitor.length]);

  useEffect(() => {
    const container = outScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [outMonitor.length]);

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
      const inputNode: Record<string, unknown> = {
        enable: !!localConfig.inputEnabled,
        agnostic: !!localConfig.ignoreInputVolume,
      };
      if (localConfig.inputId) {
        inputNode.device = localConfig.inputId;
      }

      const outputNode: Record<string, unknown> = {
        enable: !!localConfig.outputEnabled,
        agnostic: !!localConfig.ignoreOutputVolume,
      };
      if (localConfig.outputId) {
        outputNode.device = localConfig.outputId;
      }

      const exportData = {
        midi: {
          version: 1,
          input: inputNode,
          output: outputNode,
        },
      };

      const yamlContent = yaml.dump(exportData, {
        indent: 2,
        lineWidth: -1,
        quotingType: '"',
      });

      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'midi-config.yaml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to export MIDI config:', error);
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
        const parsed = yaml.load(text) as unknown;

        if (!parsed || typeof parsed !== 'object' || !('midi' in (parsed as Record<string, unknown>))) {
          // eslint-disable-next-line no-console
          console.error('Invalid MIDI config file: missing "midi" root key.');
          return;
        }

        type MidiFileRoot = {
          midi?: unknown;
        };

        const root = parsed as MidiFileRoot;
        const node = root.midi;
        if (!node || typeof node !== 'object') {
          // eslint-disable-next-line no-console
          console.error('Invalid MIDI config file: "midi" section is not an object.');
          return;
        }

        const midiNode = node as {
          version?: unknown;
          input?: unknown;
          output?: unknown;
        };

        const inputNode =
          midiNode.input && typeof midiNode.input === 'object'
            ? (midiNode.input as Record<string, unknown>)
            : {};
        const outputNode =
          midiNode.output && typeof midiNode.output === 'object'
            ? (midiNode.output as Record<string, unknown>)
            : {};

        const parseBool = (value: unknown, fallback: boolean): boolean => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'number') {
            if (!Number.isFinite(value)) return fallback;
            return value !== 0;
          }
          if (typeof value === 'string') {
            const trimmed = value.trim().toLowerCase();
            if (trimmed === 'true' || trimmed === 'yes' || trimmed === 'y' || trimmed === '1') {
              return true;
            }
            if (trimmed === 'false' || trimmed === 'no' || trimmed === 'n' || trimmed === '0') {
              return false;
            }
            return fallback;
          }
          return fallback;
        };

        const parseDeviceId = (value: unknown, fallback: string | null): string | null => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed || null;
          }
          return fallback;
        };

        const nextConfig: MidiConfig = {
          inputEnabled: parseBool(inputNode.enable, localConfig.inputEnabled),
          outputEnabled: parseBool(outputNode.enable, localConfig.outputEnabled),
          inputId: parseDeviceId(inputNode.device, localConfig.inputId),
          outputId: parseDeviceId(outputNode.device, localConfig.outputId),
          ignoreInputVolume: parseBool(
            inputNode.agnostic,
            localConfig.ignoreInputVolume,
          ),
          ignoreOutputVolume: parseBool(
            outputNode.agnostic,
            localConfig.ignoreOutputVolume,
          ),
        };

        setLocalConfig(nextConfig);
        onChangeConfig(nextConfig);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load MIDI config file:', error);
      } finally {
        input.value = '';
      }
    };

    reader.readAsText(file);
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
                      setLocalConfig(prev => ({ ...prev, inputEnabled: checked }));
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
                      setLocalConfig(prev => ({ ...prev, ignoreInputVolume: checked }));
                      onChangeConfig({ ignoreInputVolume: checked });
                    }}
                  />
                  <span>Ignore input volume</span>
                </label>
              </div>

              <div className="midi-device-column">
                <label className="midi-label" htmlFor="midi-input-select">
                  MIDI Input Device
                </label>
                <select
                  id="midi-input-select"
                  className="midi-select"
                  value={effectiveInputId || ''}
                  onChange={event => {
                    const nextId = event.target.value || null;
                    setLocalConfig(prev => ({ ...prev, inputId: nextId }));
                    onChangeConfig({ inputId: nextId });
                  }}
                  disabled={!isSupported || !hasInputs}
                >
                  {!hasInputs && <option value="">No input devices</option>}
                  {hasInputs && (
                    <option value="">(none)</option>
                  )}
                  {devices.inputs.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="midi-monitor-panel">
                <div className="midi-monitor-title">MIDI IN</div>
                <div className="midi-monitor-header">
                  <span className="midi-col time">Time</span>
                  <span className="midi-col data">Data</span>
                  <span className="midi-col device">Device</span>
                  <span className="midi-col channel">Ch</span>
                  <span className="midi-col type">Type</span>
                  <span className="midi-col note">Note</span>
                  <span className="midi-col value">Value</span>
                </div>
                <div className="midi-monitor-body" ref={inScrollRef}>
                  {inMonitor.map(entry => (
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
                      setLocalConfig(prev => ({ ...prev, outputEnabled: checked }));
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
                      setLocalConfig(prev => ({ ...prev, ignoreOutputVolume: checked }));
                      onChangeConfig({ ignoreOutputVolume: checked });
                    }}
                  />
                  <span>Ignore output volume</span>
                </label>
              </div>

              <div className="midi-device-column">
                <label className="midi-label" htmlFor="midi-output-select">
                  MIDI Output Device
                </label>
                <select
                  id="midi-output-select"
                  className="midi-select"
                  value={effectiveOutputId || ''}
                  onChange={event => {
                    const nextId = event.target.value || null;
                    setLocalConfig(prev => ({ ...prev, outputId: nextId }));
                    onChangeConfig({ outputId: nextId });
                  }}
                  disabled={!isSupported || !hasOutputs}
                >
                  {!hasOutputs && <option value="">No output devices</option>}
                  {hasOutputs && (
                    <option value="">(none)</option>
                  )}
                  {devices.outputs.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="midi-monitor-panel">
                <div className="midi-monitor-title">MIDI OUT</div>
                <div className="midi-monitor-header">
                  <span className="midi-col time">Time</span>
                  <span className="midi-col data">Data</span>
                  <span className="midi-col device">Device</span>
                  <span className="midi-col channel">Ch</span>
                  <span className="midi-col type">Type</span>
                  <span className="midi-col note">Note</span>
                  <span className="midi-col value">Value</span>
                </div>
                <div className="midi-monitor-body" ref={outScrollRef}>
                  {outMonitor.map(entry => (
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
            </div>
          </div>
        </div>

        <div className="modal-actions midi-actions">
          <div className="midi-actions-left">
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
              onClick={onCancel}
            >
              CANCEL
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

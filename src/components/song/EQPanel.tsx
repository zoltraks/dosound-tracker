import React, { useEffect, useRef, useState } from 'react';
import type { SoundEngine } from '../../synth/soundEngine.ts';

interface EQPanelProps {
  ym2149?: SoundEngine | null;
  ym2149b?: SoundEngine | null;
  channelMutes: boolean[];
  onToggleChannelMute: (channelIndex: number) => void;
}

export const EQPanel: React.FC<EQPanelProps> = ({
  ym2149,
  ym2149b,
  channelMutes,
  onToggleChannelMute,
}) => {
  const [volumes, setVolumes] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  const ym2149Ref = useRef<SoundEngine | null | undefined>(null);
  const ym2149bRef = useRef<SoundEngine | null | undefined>(null);

  useEffect(() => {
    ym2149Ref.current = ym2149;
    ym2149bRef.current = ym2149b;
  }, [ym2149, ym2149b]);

  useEffect(() => {
    const updateInterval = window.setInterval(() => {
      const readChannels = (engine: SoundEngine | null | undefined): number[] => {
        if (!engine) {
          return [0, 0, 0];
        }
        return engine
          .getState()
          .channels.map((channel) =>
            channel.toneEnabled || channel.noiseEnabled ? channel.volume : 0,
          );
      };
      // Six meters: chip 1 feeds A-C, chip 2 feeds D-F when present.
      const next = [...readChannels(ym2149Ref.current), ...readChannels(ym2149bRef.current)];
      const meterCount = ym2149bRef.current ? 6 : 3;
      const sliced = next.slice(0, meterCount);
      setVolumes((prev) => {
        const comparable = prev.slice(0, meterCount);
        if (comparable.every((value, index) => value === sliced[index])) {
          return prev;
        }
        return sliced;
      });
    }, 50);

    return () => window.clearInterval(updateInterval);
  }, []);

  const getBarHeight = (volume: number) => {
    return (volume / 15) * 100; // Volume is 0-15
  };

  return (
    <div className="eq-panel">
      <div className="eq-header">EQ</div>
      <div className="eq-content">
        <div className="volume-bars">
          {volumes.slice(0, ym2149b ? 6 : 3).map((volume, index) => (
            <div key={index} className="volume-bar-container">
              <div
                className={`volume-bar ${channelMutes[index] ? 'muted' : ''}`}
                role="button"
                aria-label={`${channelMutes[index] ? 'Unmute' : 'Mute'} channel ${String.fromCharCode(65 + index)}`}
                onClick={() => onToggleChannelMute(index)}
              >
                <div
                  className="volume-fill"
                  style={{ height: `${channelMutes[index] ? 0 : getBarHeight(volume)}%` }}
                />
              </div>
              <span className={`channel-label ${channelMutes[index] ? 'muted' : ''}`}>
                {String.fromCharCode(65 + index)} {/* A, B, C */}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

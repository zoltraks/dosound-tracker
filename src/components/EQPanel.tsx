import React, { useEffect, useState } from 'react';
import { YM2149 } from '../synth/YM2149';

interface EQPanelProps {
  ym2149?: YM2149 | null;
  channelMutes: boolean[];
  onToggleChannelMute: (channelIndex: number) => void;
}

export const EQPanel: React.FC<EQPanelProps> = ({ ym2149, channelMutes, onToggleChannelMute }) => {
  const [volumes, setVolumes] = useState<number[]>([0, 0, 0]);

  useEffect(() => {
    if (!ym2149) return;

    const updateInterval = setInterval(() => {
      const state = ym2149.getState();
      setVolumes(state.channels.map(channel => channel.volume));
    }, 50); // Update every 50ms for smooth visualization

    return () => clearInterval(updateInterval);
  }, [ym2149]);

  const getBarHeight = (volume: number) => {
    return (volume / 15) * 100; // Volume is 0-15
  };

  return (
    <div className="eq-panel">
      <div className="eq-header">EQ</div>
      <div className="eq-content">
        <div className="volume-bars">
          {volumes.map((volume, index) => (
            <div key={index} className="volume-bar-container">
              <div
                className={`volume-bar ${channelMutes[index] ? 'muted' : ''}`}
                onClick={() => onToggleChannelMute(index)}
              >
                <div 
                  className="volume-fill"
                  style={{ height: `${getBarHeight(volume)}%` }}
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

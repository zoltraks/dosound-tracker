import React, { useEffect, useRef, useState } from 'react';
import { YM2149 } from '../synth/YM2149';

interface EQPanelProps {
  ym2149?: YM2149 | null;
  channelMutes: boolean[];
  onToggleChannelMute: (channelIndex: number) => void;
}

export const EQPanel: React.FC<EQPanelProps> = ({ ym2149, channelMutes, onToggleChannelMute }) => {
  const [volumes, setVolumes] = useState<number[]>([0, 0, 0]);

  const ym2149Ref = useRef<YM2149 | null | undefined>(null);

  useEffect(() => {
    ym2149Ref.current = ym2149;
  }, [ym2149]);

  useEffect(() => {
    const updateInterval = window.setInterval(() => {
      const currentYm2149 = ym2149Ref.current;
      if (!currentYm2149) {
        setVolumes(prev => {
          if (prev[0] === 0 && prev[1] === 0 && prev[2] === 0) {
            return prev;
          }
          return [0, 0, 0];
        });
        return;
      }

      const state = currentYm2149.getState();
      const next = state.channels.map(channel => channel.volume);
      setVolumes(prev => {
        if (prev[0] === next[0] && prev[1] === next[1] && prev[2] === next[2]) {
          return prev;
        }
        return next;
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

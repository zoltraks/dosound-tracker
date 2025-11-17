import React from 'react';

interface CommandPanelProps {
  onNewSong: () => void;
  onLoadSong: () => void;
  onSaveSong: () => void;
  onNewInstrument: () => void;
  onSaveInstrument: () => void;
  onLoadInstrument: () => void;
  onPlaySong: () => void;
  onStopSong: () => void;
  onExportData: () => void;
  isPlaying: boolean;
  isDosoundMode: boolean;
  onToggleDosoundMode: () => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  onNewSong,
  onLoadSong,
  onSaveSong,
  onNewInstrument,
  onSaveInstrument,
  onLoadInstrument,
  onPlaySong,
  onStopSong,
  onExportData,
  isPlaying,
  isDosoundMode,
  onToggleDosoundMode
}) => {
  return (
    <div className="command-panel">
      {/* Song Operations */}
      <div className="command-row">
        <button onClick={onNewSong} className="command-btn">NEW SONG</button>
        <button onClick={onLoadSong} className="command-btn">LOAD SONG</button>
        <button onClick={onSaveSong} className="command-btn">SAVE SONG</button>
        <button onClick={() => {}} className="command-btn">INSERT LINE</button>
        <button onClick={() => {}} className="command-btn">DELETE LINE</button>
      </div>

      {/* Instrument Operations */}
      <div className="command-row">
        <button onClick={onNewInstrument} className="command-btn">NEW INST</button>
        <button onClick={onLoadInstrument} className="command-btn">LOAD INST</button>
        <button onClick={onSaveInstrument} className="command-btn">SAVE INST</button>
        <button onClick={() => {}} className="command-btn">CLONE INST</button>
        <button onClick={() => {}} className="command-btn">DELETE INST</button>
      </div>

      {/* Pattern Operations */}
      <div className="command-row">
        <button onClick={() => {}} className="command-btn">NEW PATTERN</button>
        <button onClick={() => {}} className="command-btn">COPY PATTERN</button>
        <button onClick={() => {}} className="command-btn">PASTE PATTERN</button>
        <button onClick={() => {}} className="command-btn">DELETE PATTERN</button>
        <button onClick={() => {}} className="command-btn">TRANSPOSE</button>
      </div>

      {/* Playback Operations */}
      <div className="command-row">
        <button 
          onClick={isPlaying ? onStopSong : onPlaySong} 
          className={`command-btn ${isPlaying ? 'playing' : ''}`}
        >
          {isPlaying ? 'STOP SONG' : 'PLAY SONG'}
        </button>
        <button onClick={() => {}} className="command-btn">PLAY PATTERN</button>
        <button onClick={() => {}} className="command-btn">PLAY INST</button>
        <button 
          onClick={onToggleDosoundMode} 
          className={`command-btn ${isDosoundMode ? 'active' : ''}`}
        >
          DOSOUND MODE
        </button>
        <button onClick={onExportData} className="command-btn">EXPORT DATA</button>
      </div>
    </div>
  );
};

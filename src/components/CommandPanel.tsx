import React from 'react';

interface CommandPanelProps {
  onNewSong: () => void;
  onLoadSong: () => void;
  onSaveSong: () => void;
  onNewInstrument: () => void;
  onSaveInstrument: () => void;
  onExportInstrument: () => void;
  onLoadInstrument: () => void;
  onDeleteInstrument: () => void;
  onPlaySong: () => void;
  onStopSong: () => void;
  onPlayPattern: () => void;
  onStopPattern: () => void;
  onExportData: () => void;
  onAddLine: () => void;
  onDeleteLine: () => void;
  isPlaying: boolean;
  isPatternPlaying: boolean;
  isDosoundMode: boolean;
  onToggleDosoundMode: () => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  onNewSong,
  onLoadSong,
  onSaveSong,
  onNewInstrument,
  onSaveInstrument,
  onExportInstrument,
  onLoadInstrument,
  onDeleteInstrument,
  onPlaySong,
  onStopSong,
  onPlayPattern,
  onStopPattern,
  onExportData,
  onAddLine,
  onDeleteLine,
  isPlaying,
  isPatternPlaying,
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
        <button onClick={onAddLine} className="command-btn">ADD LINE</button>
        <button onClick={onDeleteLine} className="command-btn">DELETE LINE</button>
      </div>

      {/* Instrument Operations */}
      <div className="command-row">
        <button onClick={onNewInstrument} className="command-btn">NEW INST</button>
        <button onClick={onLoadInstrument} className="command-btn">LOAD INST</button>
        <button onClick={onSaveInstrument} className="command-btn">SAVE INST</button>
        <button onClick={() => {}} className="command-btn">CLONE INST</button>
        <button onClick={onDeleteInstrument} className="command-btn">DELETE INST</button>
        <button onClick={onExportInstrument} className="command-btn">EXPORT INST</button>
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
          onClick={isPlaying && !isPatternPlaying ? onStopSong : onPlaySong} 
          className={`command-btn ${isPlaying && !isPatternPlaying ? 'playing' : ''}`}
        >
          {isPlaying && !isPatternPlaying ? 'STOP SONG' : 'PLAY SONG'}
        </button>
        <button 
          onClick={isPatternPlaying ? onStopPattern : onPlayPattern} 
          className={`command-btn ${isPatternPlaying ? 'playing' : ''}`}
        >
          {isPatternPlaying ? 'STOP PATTERN' : 'PLAY PATTERN'}
        </button>
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

import React, { type RefObject } from 'react';
import type { NavigationSection } from '../../constants/navigation.ts';

interface FileInputsProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  instrumentFileInputRef: RefObject<HTMLInputElement | null>;
  onLoadSong: (file: File) => void;
  onLoadInstrument: (file: File) => void;
  setPosition: (pattern: number, line: number, tick: number) => void;
  setSharedCurrentLine: (line: number) => void;
  setActiveSection: (section: NavigationSection) => void;
  setChannelMutes: (mutes: boolean[]) => void;
}

export const FileInputs: React.FC<FileInputsProps> = ({
  fileInputRef,
  instrumentFileInputRef,
  onLoadSong,
  onLoadInstrument,
  setPosition,
  setSharedCurrentLine,
  setActiveSection,
  setChannelMutes,
}) => {
  return (
    <>
      <input
        ref={fileInputRef}
        id="song-file-input"
        type="file"
        accept=".yaml,.yml"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onLoadSong(file);
            setPosition(0, 0, 0);
            setSharedCurrentLine(0);
            setActiveSection('playlist');
            setChannelMutes([false, false, false, false, false, false]);
          }
        }}
      />
      <input
        ref={instrumentFileInputRef}
        id="instrument-file-input"
        type="file"
        accept=".yaml,.yml"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onLoadInstrument(file);
          }
        }}
      />
    </>
  );
};

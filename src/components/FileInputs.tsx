import React, { type RefObject } from 'react';
import type { NavigationSection } from '../constants/navigation';

interface FileInputsProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  instrumentFileInputRef: RefObject<HTMLInputElement | null>;
  onLoadSong: (file: File) => void;
  onLoadInstrument: (content: string) => void;
  setPosition: (pattern: number, line: number, tick: number) => void;
  setSharedCurrentLine: (line: number) => void;
  setActiveSection: (section: NavigationSection) => void;
  setChannelMutes: (mutes: [boolean, boolean, boolean]) => void;
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
            setChannelMutes([false, false, false]);
            // This will be handled by the useDataManagement hook
          }
        }}
      />
      <input
        ref={instrumentFileInputRef}
        type="file"
        accept=".yaml,.yml"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) {
            return;
          }

          const reader = new FileReader();
          reader.onload = ev => {
            const text = typeof ev.target?.result === 'string'
              ? ev.target.result
              : String(ev.target?.result ?? '');
            onLoadInstrument(text);
          };
          reader.readAsText(file);
        }}
      />
    </>
  );
};

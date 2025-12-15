import React, { useMemo } from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Instrument } from '../synth/SoundDriver';
import { ToneNoisePanel } from './ToneNoisePanel';
import { EnvelopePanel } from './EnvelopePanel';
import { renderMarkdown } from '../utils/markdown';

interface EnvelopeSectionProps {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentInstrument: Instrument;
  updateInstrument: (patch: Partial<Instrument>) => void;
  messages: string[];
  currentMessageIndex: number;
  isNotesVisible: boolean;
  onNotesClick: () => void;
}

export const EnvelopeSection: React.FC<EnvelopeSectionProps> = ({
  activeSection,
  setActiveSection,
  currentInstrument,
  updateInstrument,
  messages,
  currentMessageIndex,
  isNotesVisible,
  onNotesClick,
}) => {
  const currentMessageHtml = useMemo(() => {
    if (
      messages.length > 0 &&
      currentMessageIndex >= 0 &&
      currentMessageIndex < messages.length
    ) {
      return renderMarkdown(messages[currentMessageIndex]);
    }
    return '';
  }, [messages, currentMessageIndex]);

  return (
    <div className="middle-column">
      <ToneNoisePanel
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        data={currentInstrument.mode}
        onChange={(data: number[]) => {
          updateInstrument({ mode: data });
        }}
      />

      <EnvelopePanel
        type="volume"
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        data={currentInstrument.volume}
        onChange={(data: number[]) => {
          updateInstrument({ volume: data });
        }}
        sustainIndex={
          typeof currentInstrument.sustain === 'number' && currentInstrument.sustain >= 0
            ? Math.floor(currentInstrument.sustain)
            : null
        }
        onSustainChange={index => {
          updateInstrument({ sustain: index });
        }}
      />

      <EnvelopePanel
        type="arpeggio"
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        data={currentInstrument.arpeggio}
        onChange={(data: number[]) => {
          updateInstrument({ arpeggio: data });
        }}
      />

      <EnvelopePanel
        type="pitch"
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        data={currentInstrument.pitch}
        onChange={(data: number[]) => {
          updateInstrument({ pitch: data });
        }}
      />

      <EnvelopePanel
        type="noise"
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        data={currentInstrument.noise}
        onChange={(data: number[]) => {
          updateInstrument({ noise: data });
        }}
      />

      <div className="message-panel" aria-hidden="true" onClick={onNotesClick}>
        <div
          className={`notes-content${isNotesVisible ? '' : ' notes-hidden'}`}
          dangerouslySetInnerHTML={{
            __html: currentMessageHtml,
          }}
        />
      </div>
    </div>
  );
};

import React from 'react';
import type { NavigationSection } from '../constants/navigation';
import type { Instrument } from '../synth/SoundDriver';
import { ToneNoisePanel } from './ToneNoisePanel';
import { EnvelopePanel } from './EnvelopePanel';
import { renderMarkdown } from '../utils/markdown';

interface InstrumentSectionProps {
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  currentInstrument: Instrument;
  updateInstrument: (patch: Partial<Instrument>) => void;
  messages: string[];
  currentMessageIndex: number;
  isNotesVisible: boolean;
  onNotesClick: () => void;
}

export const InstrumentSection: React.FC<InstrumentSectionProps> = ({
  activeSection,
  setActiveSection,
  currentInstrument,
  updateInstrument,
  messages,
  currentMessageIndex,
  isNotesVisible,
  onNotesClick,
}) => {
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
        data={currentInstrument.noiseEnvelope}
        onChange={(data: number[]) => {
          updateInstrument({ noiseEnvelope: data });
        }}
      />

      <div className="notes-panel" aria-hidden="true" onClick={onNotesClick}>
        <div
          className={`notes-content${isNotesVisible ? '' : ' notes-hidden'}`}
          dangerouslySetInnerHTML={{
            __html:
              messages.length > 0 && currentMessageIndex >= 0 && currentMessageIndex < messages.length
                ? renderMarkdown(messages[currentMessageIndex])
                : '',
          }}
        />
      </div>
    </div>
  );
};

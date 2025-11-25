import React, { useRef, useEffect } from 'react';
import type { NavigationSection } from '../constants/navigation';
import { KEYBOARD_TO_NOTE, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music';
import { YM2149 } from '../synth/YM2149';
import type { Instrument } from '../synth/SoundDriver';

interface HeaderPanelProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  title: string;
  currentOctave: number;
  onOctaveChange: (octave: number) => void;
  onShowAbout: () => void;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  ym2149: YM2149 | null;
  currentInstrument: Instrument;
  previewChannel: number;
}

export const HeaderPanel: React.FC<HeaderPanelProps> = ({
  isDarkMode,
  onToggleTheme,
  title,
  currentOctave,
  onOctaveChange,
  onShowAbout,
  activeSection,
  setActiveSection,
  ym2149,
  currentInstrument,
  previewChannel
}) => {
  const octaveRef = useRef<HTMLDivElement | null>(null);
  const isOctaveActive = activeSection === 'octave';

  // Simple instrument preview state for octave selection
  const previewTimerRef = useRef<number | null>(null);
  const previewSubTickRef = useRef<number>(0);
  const previewEnvelopeStepRef = useRef<number>(0);

  const stopPreview = () => {
    if (!ym2149) return;

    if (previewTimerRef.current !== null) {
      window.clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    const volumeRegister = 0x08 + previewChannel;
    ym2149.writeRegister(volumeRegister, 0x00);
  };

  const playPreviewNote = (note: string, octave: number) => {
    if (!ym2149) return;

    if (previewTimerRef.current !== null) {
      window.clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    const channel = previewChannel;
    const instrument = currentInstrument as any;
    const noteData = { note, octave };

    // Initialize envelope timing
    previewSubTickRef.current = 0;
    previewEnvelopeStepRef.current = 0;

    // Apply initial state (step 0)
    ym2149.updateChannelWithInstrument(channel, instrument, noteData, 0);

    // Start envelope timer - 20ms tick, advance envelope step every 40ms
    previewTimerRef.current = window.setInterval(() => {
      const currentSub = (previewSubTickRef.current ?? 0) + 1;
      previewSubTickRef.current = currentSub;

      let currentStep = previewEnvelopeStepRef.current ?? 0;
      if (currentSub % 2 === 0) {
        currentStep = currentStep + 1;
        previewEnvelopeStepRef.current = currentStep;
      }

      ym2149.updateChannelWithInstrument(channel, instrument, noteData, currentStep);
    }, 20);
  };

  const parseBaseKey = (value?: string): { note: string; octave: number } | null => {
    if (!value) return null;
    const raw = value.trim().toUpperCase();
    if (!raw) return null;

    let notePart = raw.charAt(0);
    let rest = raw.slice(1);

    if (rest.startsWith('#')) {
      notePart += '#';
      rest = rest.slice(1);
    }

    if (rest.startsWith('-')) {
      rest = rest.slice(1);
    }

    const octave = parseInt(rest, 10);
    if (!Number.isFinite(octave)) return null;

    return { note: notePart, octave };
  };

  const baseKeyData = parseBaseKey(currentInstrument.base || 'C-4');

  const handleOctaveKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOctaveActive) {
      return;
    }

    const rawKey = event.key;
    const keyUpper = rawKey.toUpperCase();

    // Space: preview instrument base note at its own base octave (like PianoKeyboard)
    if (rawKey === ' ') {
      if (baseKeyData) {
        event.preventDefault();
        event.stopPropagation();
        playPreviewNote(baseKeyData.note, baseKeyData.octave);
      }
      return;
    }

    // Computer keyboard piano layout (Z-M, Q-P, etc.)
    if (KEYBOARD_TO_NOTE[keyUpper]) {
      event.preventDefault();
      event.stopPropagation();
      const { note, octaveOffset } = KEYBOARD_TO_NOTE[keyUpper];
      const finalOctave = Math.max(
        MIN_OCTAVE,
        Math.min(MAX_OCTAVE, currentOctave + octaveOffset)
      );
      playPreviewNote(note, finalOctave);
      return;
    }

    const key = rawKey;

    if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === ' '
    ) {
      event.preventDefault();
      event.stopPropagation();
    }

    let nextOctave = currentOctave;

    if (key === 'ArrowLeft' || key === 'ArrowDown') {
      nextOctave = Math.max(0, currentOctave - 1);
    } else if (key === 'ArrowRight' || key === 'ArrowUp') {
      nextOctave = Math.min(7, currentOctave + 1);
    } else {
      return;
    }

    if (nextOctave !== currentOctave) {
      onOctaveChange(nextOctave);
    }
  };

  const handleOctaveKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isOctaveActive) {
      return;
    }

    const rawKey = event.key;
    const keyUpper = rawKey.toUpperCase();

    if (rawKey === ' ' || KEYBOARD_TO_NOTE[keyUpper]) {
      event.preventDefault();
      event.stopPropagation();
      stopPreview();
    }
  };

  useEffect(() => {
    if (isOctaveActive && octaveRef.current) {
      octaveRef.current.focus();
    }
    if (!isOctaveActive) {
      stopPreview();
    }
  }, [isOctaveActive]);

  return (
    <header className="header-panel">
      <div className="header-left">
        <div className="logo" onClick={onShowAbout} title="About DOSOUND Tracker">🎶</div>
        <h1 className="title">DOSOUND Tracker</h1>
      </div>
      
      <div className="header-center">
        <span className="song-title">{title}</span>
      </div>
      
      <div className="header-right">
        {/* Octave Selection */}
        <div
          ref={octaveRef}
          className={`octave-selection ${isOctaveActive ? 'active' : ''}`}
          tabIndex={0}
          onKeyDown={handleOctaveKeyDown}
          onKeyUp={handleOctaveKeyUp}
          onClick={() => setActiveSection('octave')}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              className={`octave-button ${currentOctave === i ? 'active' : ''}`}
              onClick={() => onOctaveChange(i)}
            >
              {i}
            </button>
          ))}
        </div>
        
        <button 
          className="theme-toggle"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀️' : '🌑'}
        </button>
      </div>
    </header>
  );
};

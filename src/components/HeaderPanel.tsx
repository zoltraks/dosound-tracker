/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect } from 'react';
import type { NavigationSection } from '../constants/navigation.ts';
import { KEYBOARD_TO_NOTE, MIN_OCTAVE, MAX_OCTAVE } from '../constants/music.ts';
import type { SoundEngine } from '../synth/soundEngine.ts';
import type { Instrument } from '../synth/SoundDriver.ts';
import { DEFAULT_SONG_FRAME } from '../constants/song.ts';
import LogoDark from '../assets/svg/logo-dark.svg';
import LogoLight from '../assets/svg/logo-light.svg';
import { usePreviewEnvelope } from '../hooks/playback/usePreviewEnvelope.ts';
import { parseBaseKey } from '../utils/song/songFormat.ts';

interface HeaderPanelProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  title: string;
  currentOctave: number;
  onOctaveChange: (octave: number) => void;
  onShowAbout: () => void;
  activeSection: NavigationSection;
  setActiveSection: (section: NavigationSection) => void;
  ym2149: SoundEngine | null;
  currentInstrument: Instrument;
  previewChannel: number;
  tickIntervalMs?: number;
  hasDownloads: boolean;
  onShowDownloads: () => void;
  onPreviewMidiNoteOn?: (
    ymChannel: number,
    instrument: Instrument,
    note: string,
    octave: number,
  ) => void;
  onPreviewMidiNoteOff?: (ymChannel: number) => void;
  onToggleCommandPanelMobile: () => void;
  onShowSettings: () => void;
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
  previewChannel,
  tickIntervalMs = 1000 / DEFAULT_SONG_FRAME,
  hasDownloads,
  onShowDownloads,
  onPreviewMidiNoteOn,
  onPreviewMidiNoteOff,
  onToggleCommandPanelMobile,
  onShowSettings,
}) => {
  const octaveRef = useRef<HTMLDivElement | null>(null);
  const isOctaveActive = activeSection === 'octave';

  const handleTitleClick = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const preview = usePreviewEnvelope({ ym2149 });

  const stopPreview = () => {
    preview.stop();

    if (onPreviewMidiNoteOff) {
      onPreviewMidiNoteOff(previewChannel);
    }
  };

  const playPreviewNote = (note: string, octave: number) => {
    if (!ym2149) return;

    const channel = previewChannel;

    preview.start('octave', {
      channel,
      instrument: currentInstrument,
      noteData: { note, octave },
      tickIntervalMs,
      honorSustain: false,
    });

    if (onPreviewMidiNoteOn) {
      onPreviewMidiNoteOn(channel, currentInstrument, note, octave);
    }
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
      const finalOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, currentOctave + octaveOffset));
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

    let nextOctave: number;

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
    // Stop only a preview that actually started - an unconditional stop on
    // mount or a section flip reached the channel volume register through
    // handleHardStopLivePreview even with nothing playing.
    if (!isOctaveActive && preview.hasState()) {
      stopPreview();
    }
  }, [isOctaveActive]);

  return (
    <>
      <header className="header-panel">
        <div className="header-left">
          <div
            className="logo"
            role="button"
            tabIndex={0}
            aria-label="About DOSOUND Tracker"
            onClick={onShowAbout}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onShowAbout();
              }
            }}
            title="About DOSOUND Tracker"
          >
            <img
              src={isDarkMode ? LogoDark : LogoLight}
              alt="DOSOUND Tracker logo"
              className="logo-image"
            />
          </div>
          <h1 className="application-name" onClick={handleTitleClick}>
            DOSOUND Tracker
          </h1>
        </div>

        <div className="header-center">
          <span className="song-title">{title}</span>
        </div>

        <div className="header-right">
          {hasDownloads && (
            <button
              className="theme-toggle download-toggle"
              onClick={onShowDownloads}
              title="Show available downloads"
              aria-label="Show available downloads"
            >
              ⏬
            </button>
          )}
          <div
            ref={octaveRef}
            className={`octave-selection ${isOctaveActive ? 'active' : ''}`}
            role="group"
            aria-label="Octave selection"
            tabIndex={0}
            onKeyDown={handleOctaveKeyDown}
            onKeyUp={handleOctaveKeyUp}
            onClick={() => setActiveSection('octave')}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <button
                key={i}
                className={`octave-button ${currentOctave === i ? 'active' : ''}`}
                aria-label={`Octave ${i}`}
                aria-pressed={currentOctave === i}
                onClick={() => {
                  onOctaveChange(i);
                  if (octaveRef.current) {
                    octaveRef.current.focus();
                  }
                }}
              >
                {i}
              </button>
            ))}
          </div>

          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '☀️' : '🌑'}
          </button>
          <button
            className="theme-toggle"
            onClick={onShowSettings}
            title="Settings"
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </header>

      <div
        className="header-panel-song-mobile"
        role="button"
        tabIndex={0}
        aria-label="Toggle command panel"
        onClick={onToggleCommandPanelMobile}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onToggleCommandPanelMobile();
          }
        }}
      >
        <span className="song-title">{title}</span>
      </div>
    </>
  );
};

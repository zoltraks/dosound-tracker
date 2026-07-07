import { useCallback, useRef, useMemo } from 'react';
import type { Song, Pattern, Note, Instrument } from '../synth/SoundDriver';
import { YM2149 } from '../synth/YM2149';
import type { SequencerState } from './useSequencer';
import { updateChannelWithInstrument, normalizeInstrumentId } from '../utils/playbackUtils';
import { Formatter } from '../utils/formatters';
import type { PlaybackSimulationState } from './usePlaybackSimulation';
import { mapSongLineToPlaylistEntries } from '../types/playlist';

interface UseSequencerIntegrationArgs {
  currentSong: Song;
  patternsById: Map<string, Pattern>;
  instrumentsById: Map<string, Instrument>;
  channelMutes: boolean[];
  ym2149Ref: React.MutableRefObject<YM2149 | null>;
  midiHelpersRef: React.MutableRefObject<{
    sendInstrumentMidiNoteOn: (
      ymChannel: number,
      instrument: Instrument | undefined,
      note: string,
      octave: number,
      volumeFromStep?: number | null
    ) => void;
    sendInstrumentMidiNoteOffForChannel: (ymChannel: number) => void;
  } | null>;
  playbackState: PlaybackSimulationState;
  isDebugMode: boolean;
  setSharedCurrentLine: (line: number) => void;
  setIsLinePlaying: (isPlaying: boolean) => void;
  stop: () => void;
  setPosition: (pattern: number, line: number, tick?: number) => void;
  currentInstrument: Instrument | null;
}

export function useSequencerIntegration({
  currentSong,
  patternsById,
  instrumentsById,
  channelMutes,
  ym2149Ref,
  midiHelpersRef,
  playbackState,
  isDebugMode,
  setSharedCurrentLine,
  setIsLinePlaying,
  stop,
  setPosition,
  currentInstrument,
}: UseSequencerIntegrationArgs) {
  const {
    channelSubTickRef,
    channelEnvelopeStepRef,
    lastNotesRef,
    lastSequencerPositionRef,
    channelVolumeModifierRef,
    channelSustainRef,
    channelReleasedRef,
    debugTickCounterRef,
    debugLastRowRef,
    debugLastTimeRef,
    wasPlayingRef,
    resetPlaybackState,
  } = playbackState;

  const lastUiRowRef = useRef<{ pattern: number; line: number } | null>(null);
  const linePlayingRef = useRef(false);

  const instrumentLookup = useMemo(() => {
    const map = new Map<string, Instrument>();
    for (const inst of currentSong.instrument) {
      if (!inst || !inst.id) continue;
      const key = normalizeInstrumentId(inst.id);
      if (key) {
        if (!map.has(key)) {
          map.set(key, inst);
        }
      }
    }
    return map;
  }, [currentSong.instrument]);

  const playlistEntries = useMemo(
    () => mapSongLineToPlaylistEntries(currentSong.line),
    [currentSong.line]
  );
  
  const sequencerCallback = useCallback((state: SequencerState) => {
    const lastUiRow = lastUiRowRef.current;
    if (
      !lastUiRow ||
      lastUiRow.pattern !== state.currentPattern ||
      lastUiRow.line !== state.currentLine
    ) {
      lastUiRowRef.current = {
        pattern: state.currentPattern,
        line: state.currentLine
      };
      setSharedCurrentLine(state.currentLine);
    }

    const nextIsLinePlaying = state.isPatternLoop && state.isPlaying;
    if (linePlayingRef.current !== nextIsLinePlaying) {
      linePlayingRef.current = nextIsLinePlaying;
      setIsLinePlaying(nextIsLinePlaying);
    }

    if (ym2149Ref.current) {
      const ym2149 = ym2149Ref.current;

      const wasPlaying = wasPlayingRef.current;

      if (!state.isPlaying) {
        if (wasPlaying) {
          resetPlaybackState();
        }
        wasPlayingRef.current = false;
        lastSequencerPositionRef.current = null;
        return;
      }

      wasPlayingRef.current = true;

      debugTickCounterRef.current = (debugTickCounterRef.current + 1) >>> 0;

      const lastPos = lastSequencerPositionRef.current;
      const wrappedOrJumped =
        lastPos && state.currentPattern !== lastPos.pattern; // Only treat as wrap/jump if pattern actually changes

      // Detect if this is the first tick after starting playback
      const isFirstTick = !lastPos;

      lastSequencerPositionRef.current = {
        pattern: state.currentPattern,
        line: state.currentLine
      };

      if (wrappedOrJumped || isFirstTick) {
        // Always reset sub-tick timing on wrap/jump or first tick so
        // envelope steps realign, but avoid forcibly clearing notes just
        // because the playlist advanced to the next pattern.
        channelSubTickRef.current = [0, 0, 0];

        if (isFirstTick) {
          channelEnvelopeStepRef.current = [0, 0, 0];
          lastNotesRef.current = [null, null, null];
          channelSustainRef.current = [null, null, null];
          channelReleasedRef.current = [false, false, false];
          channelVolumeModifierRef.current = [0x0f, 0x0f, 0x0f];
          debugTickCounterRef.current = 0;
          debugLastRowRef.current = null;
        }
      }

      const playlistLength = playlistEntries.length;

      if (playlistLength === 0) {
        stop();
        resetPlaybackState();
        return;
      }

      const effectivePatternIndex = state.currentPattern;

      if (effectivePatternIndex < 0 || effectivePatternIndex >= playlistLength) {
        const rawLoop = currentSong.loop;
        const hasLoop = typeof rawLoop === 'number' && Number.isFinite(rawLoop);

        if (!hasLoop) {
          resetPlaybackState();
          setPosition(0, 0, 0);
          stop();
          return;
        }
      }

      const currentPlaylistEntry = playlistEntries[effectivePatternIndex];
      
      if (currentPlaylistEntry) {
        const patternA = currentPlaylistEntry.A ? patternsById.get(currentPlaylistEntry.A) : undefined;
        const patternB = currentPlaylistEntry.B ? patternsById.get(currentPlaylistEntry.B) : undefined;
        const patternC = currentPlaylistEntry.C ? patternsById.get(currentPlaylistEntry.C) : undefined;
        
        // Get current line data (patterns are track-agnostic - read trackA data for any track)
        const lineA = patternA?.step[state.currentLine];
        const lineB = patternB?.step[state.currentLine];
        const lineC = patternC?.step[state.currentLine];

        const noteA = lineA?.note || null;
        const noteB = patternB ? (lineB?.note || null) : null; // Read A for track B
        const noteC = patternC ? (lineC?.note || null) : null; // Read A for track C

        const notes = [noteA, noteB, noteC];
        const patterns = [patternA, patternB, patternC];
        const volumes = [
          lineA?.volume,
          patternB ? lineB?.volume : undefined,
          patternC ? lineC?.volume : undefined
        ];
        const lastNotes = lastNotesRef.current;

        const lastLogged = debugLastRowRef.current;
        const shouldLogRow =
          isDebugMode &&
          state.isPlaying &&
          (!lastLogged ||
            lastLogged.pattern !== effectivePatternIndex ||
            lastLogged.line !== state.currentLine);

        if (shouldLogRow) {
          try {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            const timeStr = `${hh}:${mm}:${ss}.${ms}`;

            const nowMs = now.getTime();
            const lastMs = debugLastTimeRef.current;
            const rawDelta = lastMs != null ? nowMs - lastMs : 0;
            const clampedDelta = Math.max(0, Math.min(999, rawDelta | 0));
            const deltaStr = String(clampedDelta).padStart(3, '0');

            const tickCount = debugTickCounterRef.current;
            const cycle = Math.floor(tickCount / 2) & 0xffff;
            const cycleHex = Formatter.hex(cycle, { padWidth: 4, uppercase: true });
            const stepHex = Formatter.hex(state.currentLine, { padWidth: 2, uppercase: true });

            const channelStrings = [0, 1, 2].map(ch => {
              const noteOnRow = notes[ch];
              const volumeOnRow = volumes[ch];

              let volText: string;
              if (volumeOnRow === undefined || volumeOnRow === null) {
                volText = '-';
              } else {
                const clampedVol = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
                volText = clampedVol.toString(16).toUpperCase();
              }

              if (!noteOnRow) {
                return `--- -- ${volText}`;
              }

              if (noteOnRow.note === '===') {
                return `=== -- ${volText}`;
              }

              const baseNote = noteOnRow.note || '';
              const formattedNote = baseNote.includes('#') ? baseNote : `${baseNote}-`;
              const noteText = `${formattedNote}${noteOnRow.octave}`;
              const rawInst = noteOnRow.instrument as unknown;
              let instText = '';

              if (typeof rawInst === 'number' && Number.isFinite(rawInst)) {
                instText = Formatter.hex(rawInst, { padWidth: 2, uppercase: true });
              } else if (typeof rawInst === 'string') {
                const trimmed = rawInst.trim();
                if (trimmed) {
                  const sanitized = trimmed.startsWith('$') ? trimmed.slice(1) : trimmed;
                  const upper = sanitized.toUpperCase();
                  if (/^[0-9A-F]{1,2}$/.test(upper)) {
                    instText = upper.padStart(2, '0');
                  } else {
                    instText = upper;
                  }
                }
              }

              const safeInst = instText && instText.trim().length > 0 ? instText : '--';
              return `${noteText} ${safeInst} ${volText}`;
            });

            const debugLine = `${timeStr} | ${deltaStr} | ${cycleHex} | ${stepHex} | ${channelStrings[0]} | ${channelStrings[1]} | ${channelStrings[2]} |`;
            setTimeout(() => console.log(debugLine), 0);
            debugLastRowRef.current = {
              pattern: effectivePatternIndex,
              line: state.currentLine
            };
            debugLastTimeRef.current = nowMs;
          } catch (error) {
            console.error('Debug logging failed:', error);
          }
        }

        ym2149.beginBatch();
        try {
          for (let ch = 0; ch < 3; ch++) {
            if (channelMutes[ch]) {
              const volumeRegister = 8 + ch;
              ym2149.writeRegister(volumeRegister, 0x00);
              continue;
            }

            const pattern = patterns[ch];
            const noteOnRow = notes[ch];
            const volumeOnRow = volumes[ch];
            const last = lastNotes[ch];

            // If no pattern is assigned on this channel for the current
            // playlist position, treat it as sustain/no-op: keep any
            // previously playing note sounding instead of forcing an
            // immediate rest here. Initial startup silence is still
            // handled separately by the isFirstTick logic below.
            if (!pattern) {
              // Nothing to do on this row for this channel; fall through so
              // envelope timing and note-hold behaviour continue unchanged.
            }

            // Explicit note-off event on this row. Only act on the first tick of the
            // row so we match the offline export logic.
            if (state.currentTick === 0 && noteOnRow && noteOnRow.note === '===') {
              // For MIDI output, treat this as an explicit key release and
              // send a matching Note Off for any active note on this
              // playback channel.
              const helpers = midiHelpersRef.current;
              if (helpers) {
                helpers.sendInstrumentMidiNoteOffForChannel(ch);
              }

              const sustainIndex = channelSustainRef.current[ch];

              if (
                sustainIndex === null ||
                sustainIndex === undefined ||
                sustainIndex < 0 ||
                !last
              ) {
                // No sustain defined (or no active note) - treat as hard mute
                channelEnvelopeStepRef.current[ch] = 0;
                channelSubTickRef.current[ch] = 0;
                updateChannelWithInstrument(
                  ym2149, 
                  ch, 
                  null, 
                  instrumentLookup, 
                  currentInstrument, 
                  currentSong.instrument[0], 
                  0
                );
                lastNotes[ch] = null;
                channelSustainRef.current[ch] = null;
                channelReleasedRef.current[ch] = false;
                continue;
              }

              // Instrument has a sustain point and a note is active: this
              // note-off acts as a release trigger instead of an immediate
              // mute. Keep holding the last note and allow the envelope to
              // continue past the sustain position.
              channelReleasedRef.current[ch] = true;
              // Do not reset envelope step or clear lastNotes; fall through
            }

            // On the very first tick after starting playback, if there is no
            // explicit note on this row, ensure the channel starts from a
            // silent state so we do not accidentally reuse a stale note from a
            // previous run. Afterwards, notes are allowed to sustain naturally
            // across pattern boundaries unless an explicit note-off or rest is
            // present in the data.
            if (isFirstTick && !noteOnRow) {
              channelEnvelopeStepRef.current[ch] = 0;
              channelSubTickRef.current[ch] = 0;
              updateChannelWithInstrument(
                ym2149, 
                ch, 
                null, 
                instrumentLookup, 
                currentInstrument, 
                currentSong.instrument[0], 
                0
              );
              lastNotes[ch] = null;
              channelSustainRef.current[ch] = null;
              channelReleasedRef.current[ch] = false;
              continue;
            }

            // Determine active note: explicit note on this row if present, otherwise
            // continue holding the last active note.
            let activeNote: Note | null = last;
            const hasExplicitNote = !!(noteOnRow && noteOnRow.note && noteOnRow.note !== '===');

            // Update per-channel volume modifier when a volume nibble is present on this row.
            if (volumeOnRow !== undefined && volumeOnRow !== null) {
              const clamped = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
              channelVolumeModifierRef.current[ch] = clamped;
            }

            if (hasExplicitNote) {
              // New explicit note on this row
              activeNote = noteOnRow;

              // Retrigger envelopes and send MIDI output only on the first tick of the
              // row so that the same note is not re-sent multiple times when
              // ticksPerRow > 1.
              if (state.currentTick === 0) {
                channelEnvelopeStepRef.current[ch] = 0;
                channelSubTickRef.current[ch] = 0;

                // Resolve sustain position for the instrument used by this note.
                const instId = activeNote && typeof activeNote.instrument === 'string'
                  ? activeNote.instrument
                  : '';
                const instrument = instrumentsById.get(instId);
                const rawSustain = instrument?.sustain ?? null;
                if (typeof rawSustain === 'number' && Number.isFinite(rawSustain) && rawSustain >= 0) {
                  channelSustainRef.current[ch] = Math.floor(rawSustain);
                } else {
                  channelSustainRef.current[ch] = null;
                }
                channelReleasedRef.current[ch] = false;

                let volumeForMidi: number | null = null;
                if (volumeOnRow !== undefined && volumeOnRow !== null) {
                  volumeForMidi = Math.max(0, Math.min(0x0f, (volumeOnRow as number) | 0));
                }

                if (instrument && activeNote && activeNote.note && activeNote.note !== '===') {
                  const helpers = midiHelpersRef.current;
                  if (helpers) {
                    helpers.sendInstrumentMidiNoteOn(
                      ch,
                      instrument,
                      activeNote.note,
                      activeNote.octave,
                      volumeForMidi
                    );
                  }
                }
              }
            }

            if (activeNote && activeNote.note && activeNote.note !== '===') {
              // Use current step as envelope tick (so a freshly triggered note
              // starts at step 0, matching the piano keyboard behaviour), then
              // advance the step every 2 ticks.
              const rawStep = channelEnvelopeStepRef.current[ch];
              const sustainIndex = channelSustainRef.current[ch];
              const isReleased = channelReleasedRef.current[ch];

              // While the key is held and a sustain index is defined, clamp
              // the effective envelope position at the sustain step. Once a
              // key-release has occurred while at or before sustain, jump to
              // the first post-sustain step immediately for this tick.
              let step = rawStep;
              const hasSustain =
                sustainIndex !== null &&
                sustainIndex !== undefined &&
                sustainIndex >= 0;

              if (hasSustain) {
                if (!isReleased && rawStep >= sustainIndex) {
                  step = sustainIndex;
                } else if (isReleased && rawStep <= sustainIndex) {
                  step = sustainIndex + 1;
                }
              }
              const volumeModifier = channelVolumeModifierRef.current[ch];

              updateChannelWithInstrument(
                ym2149, 
                ch, 
                activeNote, 
                instrumentLookup, 
                currentInstrument, 
                currentSong.instrument[0], 
                step, 
                volumeModifier
              );

              // Envelope progression at 25 Hz: only advance on every second tick
              const sub = (channelSubTickRef.current[ch] + 1) % 2;
              channelSubTickRef.current[ch] = sub;
              if (sub === 0) {
                // Advance the underlying envelope step only if either there is
                // no sustain point, the note has been released, or we have
                // not yet reached the sustain index. This implements a
                // classic hold-at-sustain-until-release behaviour.
                if (
                  sustainIndex === null ||
                  sustainIndex === undefined ||
                  sustainIndex < 0 ||
                  isReleased ||
                  rawStep < sustainIndex
                ) {
                  channelEnvelopeStepRef.current[ch] = rawStep + 1;
                }
              }
              lastNotes[ch] = activeNote;
            } else {
              // No active note at all. Explicit rests and hard mutes are
              // already handled above (no pattern, note-off without
              // sustain, or initial startup row). Leaving the YM2149
              // registers as-is here avoids brief drop-outs if state
              // transiently reports no note for a single tick.
              channelEnvelopeStepRef.current[ch] = 0;
              channelSubTickRef.current[ch] = 0;
              lastNotes[ch] = null;
              channelSustainRef.current[ch] = null;
              channelReleasedRef.current[ch] = false;
            }
          }
        } finally {
          ym2149.endBatch();
        }
      }
    }
  }, [
    currentSong,
    playlistEntries,
    patternsById,
    channelMutes,
    instrumentsById,
    channelSubTickRef,
    channelEnvelopeStepRef,
    lastNotesRef,
    lastSequencerPositionRef,
    channelVolumeModifierRef,
    channelSustainRef,
    channelReleasedRef,
    debugTickCounterRef,
    debugLastRowRef,
    debugLastTimeRef,
    wasPlayingRef,
    lastUiRowRef,
    linePlayingRef,
    isDebugMode,
    setSharedCurrentLine,
    setIsLinePlaying,
    resetPlaybackState,
    stop,
    setPosition,
    currentInstrument,
    ym2149Ref,
    midiHelpersRef,
    instrumentLookup // added dependency
  ]);

  return {
    sequencerCallback
  };
}

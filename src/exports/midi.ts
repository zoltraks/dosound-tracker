import type { Instrument, Song, Note } from '../synth/SoundDriver.ts';
import { NOTES, PATTERN_LENGTH } from '../constants/music.ts';
import {
  downloadFile,
  exportInstrumentWith,
  normalizeSongForExport,
  resolveExportTiming,
} from './core.ts';
import { clampVolumeNibble } from '../utils/panel/volumeUtils.ts';
import { normalizeInstrumentId } from '../utils/instrument/instrumentSelection.ts';
import { buildPatternLookup, isPatternTrackId } from '../utils/song/songLookup.ts';

export interface MidiExportResult {
  buffer: ArrayBuffer;
  warnings: string[];
}

// Ticks per quarter note declared in the SMF header division field.
const MIDI_DIVISION = 96;
// One tracker row maps to a sixteenth note: 96/4 MIDI ticks.
const MIDI_TICKS_PER_ROW = 24;
// Tempo meta event payload limit (3 bytes).
const MIDI_MAX_TEMPO = 0xffffff;
// Ordering of simultaneous events inside a tick, applied on stable sort.
const ORDER_PROGRAM_CHANGE = 0;
const ORDER_CONTROL_CHANGE = 1;
const ORDER_NOTE_OFF = 2;
const ORDER_NOTE_ON = 3;

interface MidiEvent {
  tick: number;
  order: number;
  data: number[];
}

interface HeldNote {
  note: number;
  channel: number;
}

function writeVarLen(value: number): number[] {
  let remaining = Math.max(0, value | 0);
  const bytes = [remaining & 0x7f];
  remaining >>>= 7;
  while (remaining > 0) {
    bytes.unshift((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }
  return bytes;
}

function resolveMidiChannel(instrument: Instrument | undefined, fallback: number): number {
  const raw = instrument?.midi?.channel;
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 1 && raw <= 16) {
    return raw - 1;
  }
  return fallback;
}

function resolveMidiProgram(instrument: Instrument | undefined): number | null {
  const raw = instrument?.midi?.program;
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= 127) {
    return raw;
  }
  return null;
}

function buildTrackEvents(song: Song, channelIndex: number, warnings: Set<string>): MidiEvent[] {
  const events: MidiEvent[] = [];
  const instrumentsByNormId = new Map<string, Instrument>();
  for (const inst of song.instrument) {
    if (!inst) continue;
    const key = normalizeInstrumentId(inst.id);
    if (!instrumentsByNormId.has(key)) {
      instrumentsByNormId.set(key, inst);
    }
  }

  const patternsById = buildPatternLookup(song.pattern);

  const trackKey = channelIndex === 0 ? 'A' : channelIndex === 1 ? 'B' : 'C';
  const lineCount = song.length || PATTERN_LENGTH;
  const lastProgramByChannel = new Map<number, number>();

  let held: HeldNote | null = null;
  let volumeModifier = 0x0f;
  let tick = 0;

  const emitNoteOff = (atTick: number): void => {
    if (held) {
      events.push({
        tick: atTick,
        order: ORDER_NOTE_OFF,
        data: [0x90 | held.channel, held.note, 0x00],
      });
      held = null;
    }
  };

  const emitVolumeChange = (atTick: number, modifier: number, channel: number): void => {
    events.push({
      tick: atTick,
      order: ORDER_CONTROL_CHANGE,
      data: [0xb0 | channel, 0x07, Math.round((modifier * 127) / 15)],
    });
  };

  for (const entry of song.line) {
    const trackId = entry?.[trackKey];
    const hasPattern = isPatternTrackId(trackId);
    const pattern = hasPattern ? patternsById.get(trackId) : undefined;
    const positionStart = tick;

    if (hasPattern) {
      // A playlist position with a real pattern restarts the channel - the
      // previously held note is cut, matching the playback simulation.
      emitNoteOff(positionStart);
    }

    for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
      const rowTick = positionStart + lineIdx * MIDI_TICKS_PER_ROW;
      const step = pattern?.step[lineIdx];
      const rowNote = (step?.note || null) as Note | null;
      const rowVolume = step?.volume;

      const volumeChanged = rowVolume !== undefined && rowVolume !== null;
      const nextModifier = volumeChanged ? clampVolumeNibble(rowVolume as number) : volumeModifier;

      if (rowNote && rowNote.note === '===') {
        emitNoteOff(rowTick);
        if (volumeChanged && nextModifier !== volumeModifier) {
          volumeModifier = nextModifier;
          emitVolumeChange(rowTick, volumeModifier, channelIndex);
        }
      } else if (rowNote && rowNote.note) {
        const instrument = instrumentsByNormId.get(normalizeInstrumentId(rowNote.instrument));
        const midiChannel = resolveMidiChannel(instrument, channelIndex);
        const noteIndex = NOTES.indexOf(rowNote.note);

        emitNoteOff(rowTick);

        if (volumeChanged && nextModifier !== volumeModifier) {
          volumeModifier = nextModifier;
          emitVolumeChange(rowTick, volumeModifier, midiChannel);
        }

        if (noteIndex === -1) {
          warnings.add('Notes with unrecognized names were skipped.');
        } else {
          const program = resolveMidiProgram(instrument);
          if (program !== null && lastProgramByChannel.get(midiChannel) !== program) {
            lastProgramByChannel.set(midiChannel, program);
            events.push({
              tick: rowTick,
              order: ORDER_PROGRAM_CHANGE,
              data: [0xc0 | midiChannel, program],
            });
          }

          let midiNote = (rowNote.octave + 1) * 12 + noteIndex;
          if (midiNote < 0 || midiNote > 127) {
            midiNote = Math.max(0, Math.min(127, midiNote));
            warnings.add('Notes outside the MIDI range 0-127 were clamped.');
          }

          const velocity = Math.max(1, Math.round((volumeModifier * 127) / 15));
          events.push({
            tick: rowTick,
            order: ORDER_NOTE_ON,
            data: [0x90 | midiChannel, midiNote, velocity],
          });
          held = { note: midiNote, channel: midiChannel };
        }
      } else if (volumeChanged && nextModifier !== volumeModifier) {
        volumeModifier = nextModifier;
        emitVolumeChange(rowTick, volumeModifier, held ? held.channel : channelIndex);
      }
    }

    tick = positionStart + lineCount * MIDI_TICKS_PER_ROW;
  }

  emitNoteOff(tick);

  events.sort((a, b) => (a.tick === b.tick ? a.order - b.order : a.tick - b.tick));
  return events;
}

function encodeTrack(events: MidiEvent[], endTick: number): number[] {
  const bytes: number[] = [];
  let lastTick = 0;

  for (const event of events) {
    bytes.push(...writeVarLen(event.tick - lastTick));
    bytes.push(...event.data);
    lastTick = event.tick;
  }

  bytes.push(...writeVarLen(Math.max(0, endTick - lastTick)));
  bytes.push(0xff, 0x2f, 0x00);
  return bytes;
}

function encodeTrackChunk(events: number[]): number[] {
  const chunk = [0x4d, 0x54, 0x72, 0x6b]; // 'MTrk'
  const length = events.length;
  chunk.push((length >>> 24) & 0xff, (length >>> 16) & 0xff, (length >>> 8) & 0xff, length & 0xff);
  chunk.push(...events);
  return chunk;
}

export function exportSongToMidi(song: Song): MidiExportResult {
  const normalizedSong = normalizeSongForExport(song);
  const { frameRate, speed } = resolveExportTiming(normalizedSong);
  const warnings = new Set<string>();

  warnings.add(
    'Instrument envelopes (volume, shift, pitch, noise, mode) are not representable in MIDI and were dropped.',
  );
  warnings.add('Sustain and release rows are exported as plain note-offs.');
  warnings.add('Chip, clock, and stereo metadata are not carried by MIDI.');

  // One tracker row is a sixteenth note at 96 PPQ, so a quarter note spans
  // four rows: tempo = 4 * row_seconds in microseconds.
  const tempo = Math.max(
    1,
    Math.min(MIDI_MAX_TEMPO, Math.round((4 * speed * 1000000) / frameRate)),
  );

  const totalTicks =
    (normalizedSong.line.length || 0) *
    (normalizedSong.length || PATTERN_LENGTH) *
    MIDI_TICKS_PER_ROW;

  const conductorEvents: MidiEvent[] = [
    {
      tick: 0,
      order: 0,
      data: [0xff, 0x51, 0x03, (tempo >>> 16) & 0xff, (tempo >>> 8) & 0xff, tempo & 0xff],
    },
    {
      tick: 0,
      order: 1,
      data: [0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08],
    },
  ];

  const chunks: number[][] = [];
  chunks.push(encodeTrackChunk(encodeTrack(conductorEvents, 0)));

  for (let ch = 0; ch < 3; ch++) {
    const events = buildTrackEvents(normalizedSong, ch, warnings);
    chunks.push(encodeTrackChunk(encodeTrack(events, totalTicks)));
  }

  const header: number[] = [
    0x4d,
    0x54,
    0x68,
    0x64, // 'MThd'
    0x00,
    0x00,
    0x00,
    0x06, // header length
    0x00,
    0x01, // format 1
    (chunks.length >>> 8) & 0xff,
    chunks.length & 0xff,
    (MIDI_DIVISION >>> 8) & 0xff,
    MIDI_DIVISION & 0xff,
  ];

  const fileBytes: number[] = [...header];
  for (const chunk of chunks) {
    fileBytes.push(...chunk);
  }

  return {
    buffer: new Uint8Array(fileBytes).buffer,
    warnings: Array.from(warnings),
  };
}

export function downloadMidiFile(buffer: ArrayBuffer, filename: string = 'music.mid'): void {
  downloadFile(buffer, filename, 'audio/midi');
}

export function exportInstrumentToMidi(instrument: Instrument, song: Song): MidiExportResult {
  return exportInstrumentWith(instrument, song, exportSongToMidi);
}

import type { Instrument, Song, Pattern, Step } from '../../synth/SoundDriver.ts';
import { Formatter } from '../../utils/format/formatters.ts';
import { formatInstrumentSlotId } from '../../utils/instrument/instrumentSelection.ts';
import { normalizeInstrumentId } from '../../utils/instrument/instrumentSelection.ts';
import { normalizePatternId } from '../../utils/pattern/patternUtils.ts';

export interface RenumberSongResult {
  renumberedSong: Song;
  nextCurrentInstrument: Instrument | null;
  summary: string;
}

export function renumberSongData(
  song: Song,
  currentInstrument: Instrument | null,
): RenumberSongResult {
  const patternById = new Map<string, Pattern>();
  song.pattern.forEach((pattern) => {
    if (pattern && typeof pattern.id === 'string') {
      patternById.set(normalizePatternId(pattern.id), pattern);
    }
  });

  const orderedPatternIds: string[] = [];
  const seenPatternIds = new Set<string>();

  const addPatternId = (rawId: string) => {
    const normalized = normalizePatternId(rawId);
    if (!normalized || normalized === '--') {
      return;
    }
    if (!patternById.has(normalized) || seenPatternIds.has(normalized)) {
      return;
    }

    seenPatternIds.add(normalized);
    orderedPatternIds.push(normalized);
  };

  song.line.forEach((entry) => {
    if (!entry) return;
    if (typeof entry.A === 'string') addPatternId(entry.A);
    if (typeof entry.B === 'string') addPatternId(entry.B);
    if (typeof entry.C === 'string') addPatternId(entry.C);
  });

  song.pattern.forEach((pattern) => {
    if (!pattern || typeof pattern.id !== 'string') return;
    const idNorm = normalizePatternId(pattern.id);
    if (!patternById.has(idNorm) || seenPatternIds.has(idNorm)) {
      return;
    }
    seenPatternIds.add(idNorm);
    orderedPatternIds.push(idNorm);
  });

  const patternIdMap: Record<string, string> = {};
  orderedPatternIds.forEach((oldId, index) => {
    patternIdMap[oldId] = Formatter.hex(index, { padWidth: 2, uppercase: true });
  });

  const remapPatternId = (rawId: string): string => {
    const trimmed = rawId.trim();
    if (!trimmed) return rawId;
    if (trimmed === '--') return trimmed;
    const mapped = patternIdMap[normalizePatternId(trimmed)];
    return mapped || trimmed;
  };

  const newPlaylist = song.line.map((entry) => {
    if (!entry) return entry;
    return {
      A: typeof entry.A === 'string' ? remapPatternId(entry.A) : entry.A,
      B: typeof entry.B === 'string' ? remapPatternId(entry.B) : entry.B,
      C: typeof entry.C === 'string' ? remapPatternId(entry.C) : entry.C,
    };
  });

  const remappedPatterns: Pattern[] = orderedPatternIds
    .map<Pattern | null>((oldId) => {
      const original = patternById.get(oldId);
      if (!original) {
        return null;
      }

      const newId = patternIdMap[oldId];
      const newSteps: Step[] = (original.step || []).map((line) => ({
        note: line.note ? { ...line.note } : null,
        ...(line.volume !== undefined ? { volume: line.volume } : {}),
      }));

      return {
        ...original,
        id: newId,
        step: newSteps,
      };
    })
    .filter((pattern): pattern is Pattern => Boolean(pattern));

  const instruments = song.instrument || [];
  const instrumentsSorted = [...instruments].sort((a, b) => {
    const nameA = (a?.name || '').toLowerCase();
    const nameB = (b?.name || '').toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    const idA = parseInt(normalizeInstrumentId(a?.id) || '0', 16);
    const idB = parseInt(normalizeInstrumentId(b?.id) || '0', 16);
    return idA - idB;
  });

  const instrumentIdMap: Record<string, string> = {};

  const newInstruments: Instrument[] = instrumentsSorted.map((inst, index) => {
    const oldIdNorm = normalizeInstrumentId(inst.id);
    const newId = formatInstrumentSlotId(index);
    if (oldIdNorm) {
      instrumentIdMap[oldIdNorm] = newId;
    }
    return {
      ...inst,
      id: newId,
    };
  });

  const remappedPatternsWithInstruments: Pattern[] = remappedPatterns.map((pattern) => {
    const steps = (pattern.step || []).map((line) => {
      const newLine: Step = { ...line };

      const note = newLine.note;
      if (note && typeof note.instrument === 'string') {
        const raw = normalizeInstrumentId(note.instrument);
        const mapped = instrumentIdMap[raw];
        if (mapped) {
          newLine.note = {
            ...note,
            instrument: mapped,
          };
        }
      }

      return newLine;
    });

    return {
      ...pattern,
      step: steps,
    };
  });

  let nextCurrentInstrument = currentInstrument;
  if (currentInstrument) {
    const currentIdNorm = normalizeInstrumentId(currentInstrument.id);
    const mappedId = instrumentIdMap[currentIdNorm];
    if (mappedId) {
      const updatedFromList = newInstruments.find((inst) => inst.id === mappedId);
      nextCurrentInstrument = updatedFromList || { ...currentInstrument, id: mappedId };
    }
  }

  const renumberedSong: Song = {
    ...song,
    pattern: remappedPatternsWithInstruments,
    line: newPlaylist,
    instrument: newInstruments,
  };

  const summaryLines: string[] = [];
  summaryLines.push('Renumbering complete.');
  summaryLines.push('');

  const patternMappingLines: string[] = [];
  orderedPatternIds.forEach((oldId) => {
    const newId = patternIdMap[oldId];
    if (!newId || newId === oldId) {
      return;
    }
    const pattern = patternById.get(oldId);
    const name = pattern && pattern.name ? pattern.name : '';
    patternMappingLines.push(`- ${oldId} -> ${newId}${name ? ` (${name})` : ''}`);
  });

  const instrumentMappingLines: string[] = [];
  instrumentsSorted.forEach((inst) => {
    const oldIdRaw = inst.id || '';
    const oldIdNorm = normalizeInstrumentId(oldIdRaw);
    const mapped = oldIdNorm ? instrumentIdMap[oldIdNorm] : '';
    if (!mapped || mapped === oldIdNorm) {
      return;
    }
    const name = inst.name || '';
    instrumentMappingLines.push(`- ${oldIdRaw} -> ${mapped}${name ? ` (${name})` : ''}`);
  });

  const hasPatternChanges = patternMappingLines.length > 0;
  const hasInstrumentChanges = instrumentMappingLines.length > 0;

  if (hasPatternChanges || hasInstrumentChanges) {
    summaryLines.push(`Patterns: ${song.pattern.length} -> ${renumberedSong.pattern.length}`);
    summaryLines.push(
      `Instruments: ${song.instrument.length} -> ${renumberedSong.instrument.length}`,
    );

    if (hasPatternChanges) {
      summaryLines.push('');
      summaryLines.push('Pattern ID mapping (old -> new):');
      patternMappingLines.forEach((line) => summaryLines.push(line));
    }
    if (hasInstrumentChanges) {
      summaryLines.push('');
      summaryLines.push('Instrument ID mapping (old -> new):');
      instrumentMappingLines.forEach((line) => summaryLines.push(line));
    }
  } else {
    summaryLines.push('No pattern or instrument IDs were renumbered.');
  }

  return {
    renumberedSong,
    nextCurrentInstrument,
    summary: summaryLines.join('\n'),
  };
}

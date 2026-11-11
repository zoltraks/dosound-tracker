import type { Instrument, Song } from '../../synth/SoundDriver.ts';
import type { ExportStrategy, ExportType } from '../../constants/export.ts';
import {
  buildInstrumentExportBaseName,
  buildPatternExportBaseName,
  buildSongExportBaseName,
} from './exportFileNaming.ts';

// Structural view of the hook's ExportContext - only the fields the summary
// helpers read, so this module stays free of a hook import.
export interface ExportSummaryContext {
  type: ExportType;
  strategy: ExportStrategy;
  playlistIndex: number;
  instrument: Instrument | null;
}

export interface ResolvedExportScope {
  scopedSong: Song;
  instrument: Instrument | null;
  filenameBase: string;
  // The scope the export actually produced. Falls back to 'song' when an
  // instrument scope arrives without an instrument, matching the
  // pattern-or-song else-branch of the original handlers.
  scopeType: ExportType;
}

export function resolveExportScope(
  ctx: ExportSummaryContext,
  song: Song,
  getScopedSongForPattern: (playlistIndex: number) => Song | null,
): ResolvedExportScope {
  if (ctx.type === 'instrument' && ctx.instrument) {
    return {
      scopedSong: song,
      instrument: ctx.instrument,
      filenameBase: buildInstrumentExportBaseName(song.title, ctx.instrument.id),
      scopeType: 'instrument',
    };
  }

  let scopedSong: Song = song;
  if (ctx.type === 'pattern') {
    const scoped = getScopedSongForPattern(ctx.playlistIndex);
    if (scoped) {
      scopedSong = scoped;
    }
  }

  return {
    scopedSong,
    instrument: null,
    filenameBase:
      ctx.type === 'pattern'
        ? buildPatternExportBaseName(song.title)
        : buildSongExportBaseName(song.title),
    scopeType: ctx.type === 'pattern' ? 'pattern' : 'song',
  };
}

export function buildExportScopeLines(
  ctx: ExportSummaryContext,
  includeStrategy: boolean,
): string[] {
  const lines: string[] = [];
  if (ctx.type === 'song') {
    lines.push('Scope: Song');
  } else if (ctx.type === 'pattern') {
    lines.push('Scope: Pattern (current playlist position)');
    lines.push(`Playlist index: ${ctx.playlistIndex}`);
  } else if (ctx.type === 'instrument') {
    lines.push('Scope: Instrument');
    lines.push(`Instrument ID: ${ctx.instrument ? ctx.instrument.id : 'n/a'}`);
  }
  if (includeStrategy && ctx.type !== 'instrument') {
    lines.push(`Strategy: ${ctx.strategy}`);
  }
  return lines;
}

export function buildExportErrorLines(format: string, error: unknown): string[] {
  const lines: string[] = [];
  lines.push(`${format} export failed.`);
  if (error instanceof Error) {
    lines.push(`Error: ${error.message}`);
  }
  return lines;
}

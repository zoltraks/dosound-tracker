import { useCallback, useMemo, useState } from 'react';
import type { Song, Instrument } from '../../synth/SoundDriver.ts';
import type { ExportType, ExportStrategy } from '../../constants/export.ts';
import { logger } from '../../utils/log/logger.ts';
import { buildDumpExportBaseName } from '../../utils/export/exportFileNaming.ts';
import {
  buildExportErrorLines,
  buildExportScopeLines,
  resolveExportScope,
} from '../../utils/export/exportSummary.ts';
import {
  mapSongLineToPlaylistEntries,
  mapPlaylistEntriesToSongLine,
} from '../../types/playlist.ts';

export interface ExportContext {
  type: ExportType;
  strategy: ExportStrategy;
  playlistIndex: number;
  currentLine: number;
  instrument: Instrument | null;
}

interface UseExportOperationsArgs {
  song: Song;
}

interface UseExportOperationsResult {
  soundExportSummary: string;
  dumpExportSummary: string;
  exportDataWithContext: (ctx: ExportContext) => void;
  exportBinWithContext: (ctx: ExportContext) => void;
  exportVgmWithContext: (ctx: ExportContext) => void;
  exportWavWithContext: (ctx: ExportContext) => void;
  exportMaxWithContext: (ctx: ExportContext) => void;
  exportMidiWithContext: (ctx: ExportContext) => void;
  exportModWithContext: (ctx: ExportContext) => void;
  exportDumpWithContext: (ctx: ExportContext) => void;
  handleCloseSoundExportSummary: () => void;
  handleCloseDumpExportSummary: () => void;
}

export function useExportOperations({ song }: UseExportOperationsArgs): UseExportOperationsResult {
  const [soundExportSummary, setSoundExportSummary] = useState('');
  const [dumpExportSummary, setDumpExportSummary] = useState('');
  const playlistEntries = useMemo(() => mapSongLineToPlaylistEntries(song.line), [song.line]);

  const getScopedSongForPattern = useCallback(
    (playlistIndex: number): Song | null => {
      const entriesLength = playlistEntries.length;
      if (entriesLength === 0) {
        return null;
      }
      const rawIndex = playlistIndex;
      const index = Math.max(
        0,
        Math.min(entriesLength - 1, Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0),
      );
      const entry = playlistEntries[index];
      const serializedLine = mapPlaylistEntriesToSongLine([entry]);
      return {
        ...song,
        line: serializedLine,
        loop: null,
      };
    },
    [playlistEntries, song],
  );

  const exportDataWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportToAssembly, exportInstrumentToAssembly, downloadAssemblyFile } =
          await import('../../exports/export.ts');
        const { scopedSong, instrument, filenameBase } = resolveExportScope(
          ctx,
          song,
          getScopedSongForPattern,
        );

        let assemblyContent: string;
        if (instrument) {
          assemblyContent = exportInstrumentToAssembly(instrument, song);
        } else {
          assemblyContent = exportToAssembly(scopedSong, ctx.strategy);
        }

        const filename = `${filenameBase}.s`;
        downloadAssemblyFile(assemblyContent, filename);

        const lines: string[] = [];
        lines.push('DATA export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(...buildExportScopeLines(ctx, true));

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware DATA export failed', error);
        setSoundExportSummary(buildExportErrorLines('DATA', error).join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportMaxWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToMax, exportInstrumentToMax, downloadMaxFile } =
          await import('../../exports/export.ts');
        const { scopedSong, instrument, filenameBase, scopeType } = resolveExportScope(
          ctx,
          song,
          getScopedSongForPattern,
        );
        const summaryCtx = { ...ctx, type: scopeType };

        if (instrument) {
          const result = exportInstrumentToMax(instrument, song, ctx.strategy);
          const filename = `${filenameBase}.max`;
          downloadMaxFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('MAX export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push(`Frames: ${result.frameCount}`);
          lines.push(...buildExportScopeLines(summaryCtx, true));

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        const result = exportSongToMax(scopedSong, ctx.strategy);
        const filename = `${filenameBase}.max`;
        downloadMaxFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('MAX export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Frames: ${result.frameCount}`);
        lines.push(...buildExportScopeLines(summaryCtx, true));

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware MAX export failed', error);
        setSoundExportSummary(buildExportErrorLines('MAX', error).join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportMidiWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToMidi, exportInstrumentToMidi, downloadMidiFile } =
          await import('../../exports/export.ts');
        const { scopedSong, instrument, filenameBase, scopeType } = resolveExportScope(
          ctx,
          song,
          getScopedSongForPattern,
        );
        const summaryCtx = { ...ctx, type: scopeType };

        if (instrument) {
          const result = exportInstrumentToMidi(instrument, song);
          const filename = `${filenameBase}.mid`;
          downloadMidiFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('MIDI export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push(...buildExportScopeLines(summaryCtx, false));
          for (const warning of result.warnings) {
            lines.push(`Note: ${warning}`);
          }

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        const result = exportSongToMidi(scopedSong);
        const filename = `${filenameBase}.mid`;
        downloadMidiFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('MIDI export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(...buildExportScopeLines(summaryCtx, false));
        for (const warning of result.warnings) {
          lines.push(`Note: ${warning}`);
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware MIDI export failed', error);
        setSoundExportSummary(buildExportErrorLines('MIDI', error).join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportModWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToMod, exportInstrumentToMod, downloadModFile } =
          await import('../../exports/export.ts');
        const { scopedSong, instrument, filenameBase, scopeType } = resolveExportScope(
          ctx,
          song,
          getScopedSongForPattern,
        );
        const summaryCtx = { ...ctx, type: scopeType };

        if (instrument) {
          const result = exportInstrumentToMod(instrument, song);
          const filename = `${filenameBase}.mod`;
          downloadModFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('MOD export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push(...buildExportScopeLines(summaryCtx, false));
          for (const warning of result.warnings) {
            lines.push(`Note: ${warning}`);
          }

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        const result = exportSongToMod(scopedSong);
        const filename = `${filenameBase}.mod`;
        downloadModFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('MOD export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(...buildExportScopeLines(summaryCtx, false));
        for (const warning of result.warnings) {
          lines.push(`Note: ${warning}`);
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware MOD export failed', error);
        setSoundExportSummary(buildExportErrorLines('MOD', error).join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportBinWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const {
          exportToBinary,
          parseAssemblyToBinary,
          downloadBinaryFile,
          exportInstrumentToAssembly,
        } = await import('../../exports/export.ts');
        const { scopedSong, instrument, filenameBase } = resolveExportScope(
          ctx,
          song,
          getScopedSongForPattern,
        );

        let bytes: Uint8Array;
        if (instrument) {
          const asm = exportInstrumentToAssembly(instrument, song);
          bytes = parseAssemblyToBinary(asm);
        } else {
          bytes = exportToBinary(scopedSong, ctx.strategy);
        }

        const filename = `${filenameBase}.bin`;
        downloadBinaryFile(bytes, filename);

        const lines: string[] = [];
        lines.push('BIN export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Bytes: ${bytes.length}`);
        lines.push(...buildExportScopeLines(ctx, true));

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware BIN export failed', error);
        setSoundExportSummary(buildExportErrorLines('BIN', error).join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportVgmWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToVgm, exportInstrumentToVgm, downloadVgmFile } =
          await import('../../exports/export.ts');
        const { scopedSong, instrument, filenameBase, scopeType } = resolveExportScope(
          ctx,
          song,
          getScopedSongForPattern,
        );
        const summaryCtx = { ...ctx, type: scopeType };

        if (instrument) {
          const result = exportInstrumentToVgm(instrument, song);
          const filename = `${filenameBase}.vgm`;
          downloadVgmFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('VGM export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push(`Total samples: ${result.totalSamples}`);
          lines.push(...buildExportScopeLines(summaryCtx, false));

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        const result = exportSongToVgm(scopedSong, ctx.strategy);
        const filename = `${filenameBase}.vgm`;
        downloadVgmFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('VGM export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Total samples: ${result.totalSamples}`);
        lines.push(...buildExportScopeLines(summaryCtx, false));

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware VGM export failed', error);
        setSoundExportSummary(buildExportErrorLines('VGM', error).join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportWavWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToWav, exportInstrumentToWav, downloadWavFile } =
          await import('../../exports/export.ts');
        const { scopedSong, instrument, filenameBase, scopeType } = resolveExportScope(
          ctx,
          song,
          getScopedSongForPattern,
        );
        const summaryCtx = { ...ctx, type: scopeType };

        if (instrument) {
          const result = exportInstrumentToWav(instrument, song);
          const filename = `${filenameBase}.wav`;
          downloadWavFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('WAV export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push(`Sample rate: ${result.sampleRate} Hz`);
          lines.push('Channels: 1 (mono)');
          lines.push('Bit depth: 16-bit');
          lines.push(`Total samples: ${result.totalSamples}`);
          lines.push(`Duration: ${result.durationSeconds.toFixed(2)} seconds`);
          lines.push(...buildExportScopeLines(summaryCtx, false));

          if (result.totalSamples === 0) {
            lines.push('');
            lines.push('Warning: song produced 0 samples (empty playlist or no active notes).');
          }

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        const result = exportSongToWav(scopedSong);
        const filename = `${filenameBase}.wav`;
        downloadWavFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('WAV export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Sample rate: ${result.sampleRate} Hz`);
        lines.push('Channels: 1 (mono)');
        lines.push('Bit depth: 16-bit');
        lines.push(`Total samples: ${result.totalSamples}`);
        lines.push(`Duration: ${result.durationSeconds.toFixed(2)} seconds`);
        lines.push(...buildExportScopeLines(summaryCtx, false));

        if (result.totalSamples === 0) {
          lines.push('');
          lines.push('Warning: song produced 0 samples (empty playlist or no active notes).');
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware WAV export failed', error);
        setSoundExportSummary(buildExportErrorLines('WAV', error).join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportDumpWithContext = useCallback(
    async (ctx: ExportContext) => {
      void ctx;
      try {
        const { exportSongRegisterDump, downloadAssemblyFile } =
          await import('../../exports/export.ts');
        const { content, cycleCount } = exportSongRegisterDump(song);
        const filename = `${buildDumpExportBaseName(song.title)}.s`;

        downloadAssemblyFile(content, filename);

        const lines: string[] = [];
        lines.push('Dump export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Cycles: ${cycleCount}`);

        if (cycleCount === 0) {
          lines.push('');
          lines.push('Warning: song produced 0 cycles (empty playlist or no active notes).');
        }

        setDumpExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Dump export failed', error);
        setDumpExportSummary(buildExportErrorLines('Dump', error).join('\n'));
      }
    },
    [song],
  );

  const handleCloseSoundExportSummary = useCallback(() => {
    setSoundExportSummary('');
  }, []);

  const handleCloseDumpExportSummary = useCallback(() => {
    setDumpExportSummary('');
  }, []);

  return {
    soundExportSummary,
    dumpExportSummary,
    exportDataWithContext,
    exportBinWithContext,
    exportVgmWithContext,
    exportWavWithContext,
    exportMaxWithContext,
    exportMidiWithContext,
    exportModWithContext,
    exportDumpWithContext,
    handleCloseSoundExportSummary,
    handleCloseDumpExportSummary,
  };
}

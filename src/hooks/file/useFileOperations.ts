import { useCallback, useMemo, useState } from 'react';
import type { Song, Instrument } from '../../synth/SoundDriver.ts';
import type { ExportType, ExportStrategy } from '../../constants/export.ts';
import { logger } from '../../utils/log/logger.ts';
import {
  buildInstrumentExportBaseName,
  buildPatternExportBaseName,
  buildSongExportBaseName,
  buildDumpExportBaseName,
} from '../../utils/export/exportFileNaming.ts';
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

interface UseFileOperationsArgs {
  song: Song;
  exportStrategy: ExportStrategy;
}

interface UseFileOperationsResult {
  soundExportSummary: string;
  dumpExportSummary: string;
  handleExportVgm: () => void;
  handleExportWav: () => void;
  handleExportDump: () => void;
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

export function useFileOperations({
  song,
  exportStrategy,
}: UseFileOperationsArgs): UseFileOperationsResult {
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

  const handleExportVgm = useCallback(async () => {
    try {
      const { exportSongToVgm, downloadVgmFile } = await import('../../exports/export.ts');
      const result = exportSongToVgm(song, exportStrategy);
      const filename = `${buildSongExportBaseName(song.title)}.vgm`;
      downloadVgmFile(result.buffer, filename);

      const lines: string[] = [];
      lines.push('VGM export completed.');
      lines.push('');
      lines.push(`File: ${filename}`);
      lines.push(`Total samples: ${result.totalSamples}`);

      setSoundExportSummary(lines.join('\n'));
    } catch (error) {
      logger.error('VGM export failed', error);
      const lines: string[] = [];
      lines.push('VGM export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setSoundExportSummary(lines.join('\n'));
    }
  }, [song, exportStrategy]);

  const handleExportWav = useCallback(async () => {
    try {
      const { exportSongToWav, downloadWavFile } = await import('../../exports/export.ts');
      const result = exportSongToWav(song);
      const filename = `${buildSongExportBaseName(song.title)}.wav`;

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

      if (result.totalSamples === 0) {
        lines.push('');
        lines.push('Warning: song produced 0 samples (empty playlist or no active notes).');
      }

      setSoundExportSummary(lines.join('\n'));
    } catch (error) {
      logger.error('WAV export failed', error);
      const lines: string[] = [];
      lines.push('WAV export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setSoundExportSummary(lines.join('\n'));
    }
  }, [song]);

  const handleExportDump = useCallback(async () => {
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
      const lines: string[] = [];
      lines.push('Dump export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setDumpExportSummary(lines.join('\n'));
    }
  }, [song]);

  const exportDataWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportToAssembly, exportInstrumentToAssembly, downloadAssemblyFile } =
          await import('../../exports/export.ts');
        let assemblyContent: string;
        let filenameBase: string;

        if (ctx.type === 'instrument' && ctx.instrument) {
          assemblyContent = exportInstrumentToAssembly(ctx.instrument, song);
          filenameBase = buildInstrumentExportBaseName(song.title, ctx.instrument.id);
        } else {
          let scopedSong: Song = song;
          if (ctx.type === 'pattern') {
            const scoped = getScopedSongForPattern(ctx.playlistIndex);
            if (scoped) {
              scopedSong = scoped;
            }
          }
          assemblyContent = exportToAssembly(scopedSong, ctx.strategy);
          filenameBase =
            ctx.type === 'pattern'
              ? buildPatternExportBaseName(song.title)
              : buildSongExportBaseName(song.title);
        }

        const filename = `${filenameBase}.s`;
        downloadAssemblyFile(assemblyContent, filename);

        const lines: string[] = [];
        lines.push('DATA export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        if (ctx.type === 'song') {
          lines.push('Scope: Song');
        } else if (ctx.type === 'pattern') {
          lines.push('Scope: Pattern (current playlist position)');
          lines.push(`Playlist index: ${ctx.playlistIndex}`);
        } else if (ctx.type === 'instrument') {
          lines.push('Scope: Instrument');
          lines.push(`Instrument ID: ${ctx.instrument ? ctx.instrument.id : 'n/a'}`);
        }
        if (ctx.type !== 'instrument') {
          lines.push(`Strategy: ${ctx.strategy}`);
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware DATA export failed', error);
        const lines: string[] = [];
        lines.push('DATA export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportMaxWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToMax, exportInstrumentToMax, downloadMaxFile } =
          await import('../../exports/export.ts');
        if (ctx.type === 'instrument' && ctx.instrument) {
          const result = exportInstrumentToMax(ctx.instrument, song, ctx.strategy);
          const filename = `${buildInstrumentExportBaseName(song.title, ctx.instrument.id)}.max`;
          downloadMaxFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('MAX export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push(`Frames: ${result.frameCount}`);
          lines.push('Scope: Instrument');
          lines.push(`Instrument ID: ${ctx.instrument.id}`);

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        let scopedSong: Song = song;
        if (ctx.type === 'pattern') {
          const scoped = getScopedSongForPattern(ctx.playlistIndex);
          if (scoped) {
            scopedSong = scoped;
          }
        }

        const result = exportSongToMax(scopedSong, ctx.strategy);
        const filenameBase =
          ctx.type === 'pattern'
            ? buildPatternExportBaseName(song.title)
            : buildSongExportBaseName(song.title);
        const filename = `${filenameBase}.max`;
        downloadMaxFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('MAX export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Frames: ${result.frameCount}`);
        if (ctx.type === 'pattern') {
          lines.push('Scope: Pattern (current playlist position)');
          lines.push(`Playlist index: ${ctx.playlistIndex}`);
        } else {
          lines.push('Scope: Song');
        }
        lines.push(`Strategy: ${ctx.strategy}`);

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware MAX export failed', error);
        const lines: string[] = [];
        lines.push('MAX export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportMidiWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToMidi, exportInstrumentToMidi, downloadMidiFile } =
          await import('../../exports/export.ts');
        if (ctx.type === 'instrument' && ctx.instrument) {
          const result = exportInstrumentToMidi(ctx.instrument, song);
          const filename = `${buildInstrumentExportBaseName(song.title, ctx.instrument.id)}.mid`;
          downloadMidiFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('MIDI export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push('Scope: Instrument');
          lines.push(`Instrument ID: ${ctx.instrument.id}`);
          for (const warning of result.warnings) {
            lines.push(`Note: ${warning}`);
          }

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        let scopedSong: Song = song;
        if (ctx.type === 'pattern') {
          const scoped = getScopedSongForPattern(ctx.playlistIndex);
          if (scoped) {
            scopedSong = scoped;
          }
        }

        const result = exportSongToMidi(scopedSong);
        const filenameBase =
          ctx.type === 'pattern'
            ? buildPatternExportBaseName(song.title)
            : buildSongExportBaseName(song.title);
        const filename = `${filenameBase}.mid`;
        downloadMidiFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('MIDI export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        if (ctx.type === 'pattern') {
          lines.push('Scope: Pattern (current playlist position)');
          lines.push(`Playlist index: ${ctx.playlistIndex}`);
        } else {
          lines.push('Scope: Song');
        }
        for (const warning of result.warnings) {
          lines.push(`Note: ${warning}`);
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware MIDI export failed', error);
        const lines: string[] = [];
        lines.push('MIDI export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportModWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToMod, exportInstrumentToMod, downloadModFile } =
          await import('../../exports/export.ts');
        if (ctx.type === 'instrument' && ctx.instrument) {
          const result = exportInstrumentToMod(ctx.instrument, song);
          const filename = `${buildInstrumentExportBaseName(song.title, ctx.instrument.id)}.mod`;
          downloadModFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('MOD export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push('Scope: Instrument');
          lines.push(`Instrument ID: ${ctx.instrument.id}`);
          for (const warning of result.warnings) {
            lines.push(`Note: ${warning}`);
          }

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        let scopedSong: Song = song;
        if (ctx.type === 'pattern') {
          const scoped = getScopedSongForPattern(ctx.playlistIndex);
          if (scoped) {
            scopedSong = scoped;
          }
        }

        const result = exportSongToMod(scopedSong);
        const filenameBase =
          ctx.type === 'pattern'
            ? buildPatternExportBaseName(song.title)
            : buildSongExportBaseName(song.title);
        const filename = `${filenameBase}.mod`;
        downloadModFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('MOD export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        if (ctx.type === 'pattern') {
          lines.push('Scope: Pattern (current playlist position)');
          lines.push(`Playlist index: ${ctx.playlistIndex}`);
        } else {
          lines.push('Scope: Song');
        }
        for (const warning of result.warnings) {
          lines.push(`Note: ${warning}`);
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware MOD export failed', error);
        const lines: string[] = [];
        lines.push('MOD export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
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
        let bytes: Uint8Array;
        let filenameBase: string;

        if (ctx.type === 'instrument' && ctx.instrument) {
          const asm = exportInstrumentToAssembly(ctx.instrument, song);
          bytes = parseAssemblyToBinary(asm);
          filenameBase = buildInstrumentExportBaseName(song.title, ctx.instrument.id);
        } else {
          let scopedSong: Song = song;
          if (ctx.type === 'pattern') {
            const scoped = getScopedSongForPattern(ctx.playlistIndex);
            if (scoped) {
              scopedSong = scoped;
            }
          }

          bytes = exportToBinary(scopedSong, ctx.strategy);
          filenameBase =
            ctx.type === 'pattern'
              ? buildPatternExportBaseName(song.title)
              : buildSongExportBaseName(song.title);
        }

        const filename = `${filenameBase}.bin`;
        downloadBinaryFile(bytes, filename);

        const lines: string[] = [];
        lines.push('BIN export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Bytes: ${bytes.length}`);
        if (ctx.type === 'song') {
          lines.push('Scope: Song');
        } else if (ctx.type === 'pattern') {
          lines.push('Scope: Pattern (current playlist position)');
          lines.push(`Playlist index: ${ctx.playlistIndex}`);
        } else if (ctx.type === 'instrument') {
          lines.push('Scope: Instrument');
          lines.push(`Instrument ID: ${ctx.instrument ? ctx.instrument.id : 'n/a'}`);
        }
        if (ctx.type !== 'instrument') {
          lines.push(`Strategy: ${ctx.strategy}`);
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware BIN export failed', error);
        const lines: string[] = [];
        lines.push('BIN export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportVgmWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToVgm, exportInstrumentToVgm, downloadVgmFile } =
          await import('../../exports/export.ts');
        if (ctx.type === 'instrument' && ctx.instrument) {
          const result = exportInstrumentToVgm(ctx.instrument, song);
          const filename = `${buildInstrumentExportBaseName(song.title, ctx.instrument.id)}.vgm`;
          downloadVgmFile(result.buffer, filename);

          const lines: string[] = [];
          lines.push('VGM export completed.');
          lines.push('');
          lines.push(`File: ${filename}`);
          lines.push(`Total samples: ${result.totalSamples}`);
          lines.push('Scope: Instrument');
          lines.push(`Instrument ID: ${ctx.instrument.id}`);

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        let scopedSong: Song = song;
        if (ctx.type === 'pattern') {
          const scoped = getScopedSongForPattern(ctx.playlistIndex);
          if (scoped) {
            scopedSong = scoped;
          }
        }

        const result = exportSongToVgm(scopedSong, ctx.strategy);
        const filenameBase =
          ctx.type === 'pattern'
            ? buildPatternExportBaseName(song.title)
            : buildSongExportBaseName(song.title);
        const filename = `${filenameBase}.vgm`;
        downloadVgmFile(result.buffer, filename);

        const lines: string[] = [];
        lines.push('VGM export completed.');
        lines.push('');
        lines.push(`File: ${filename}`);
        lines.push(`Total samples: ${result.totalSamples}`);
        if (ctx.type === 'pattern') {
          lines.push('Scope: Pattern (current playlist position)');
          lines.push(`Playlist index: ${ctx.playlistIndex}`);
        } else {
          lines.push('Scope: Song');
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware VGM export failed', error);
        const lines: string[] = [];
        lines.push('VGM export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportWavWithContext = useCallback(
    async (ctx: ExportContext) => {
      try {
        const { exportSongToWav, exportInstrumentToWav, downloadWavFile } =
          await import('../../exports/export.ts');
        if (ctx.type === 'instrument' && ctx.instrument) {
          const result = exportInstrumentToWav(ctx.instrument, song);
          const filename = `${buildInstrumentExportBaseName(song.title, ctx.instrument.id)}.wav`;
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
          lines.push('Scope: Instrument');
          lines.push(`Instrument ID: ${ctx.instrument.id}`);

          if (result.totalSamples === 0) {
            lines.push('');
            lines.push('Warning: song produced 0 samples (empty playlist or no active notes).');
          }

          setSoundExportSummary(lines.join('\n'));
          return;
        }

        let scopedSong: Song = song;
        if (ctx.type === 'pattern') {
          const scoped = getScopedSongForPattern(ctx.playlistIndex);
          if (scoped) {
            scopedSong = scoped;
          }
        }

        const result = exportSongToWav(scopedSong);
        const filenameBase =
          ctx.type === 'pattern'
            ? buildPatternExportBaseName(song.title)
            : buildSongExportBaseName(song.title);
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
        if (ctx.type === 'pattern') {
          lines.push('Scope: Pattern (current playlist position)');
          lines.push(`Playlist index: ${ctx.playlistIndex}`);
        } else {
          lines.push('Scope: Song');
        }

        if (result.totalSamples === 0) {
          lines.push('');
          lines.push('Warning: song produced 0 samples (empty playlist or no active notes).');
        }

        setSoundExportSummary(lines.join('\n'));
      } catch (error) {
        logger.error('Context-aware WAV export failed', error);
        const lines: string[] = [];
        lines.push('WAV export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song, getScopedSongForPattern],
  );

  const exportDumpWithContext = useCallback(
    (ctx: ExportContext) => {
      void ctx;
      void handleExportDump();
    },
    [handleExportDump],
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
    handleExportVgm,
    handleExportWav,
    handleExportDump,
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

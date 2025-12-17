import { useCallback, useState } from 'react';
import type { Song, Instrument } from '../synth/SoundDriver';
import type { ExportType, ExportStrategy } from '../constants/export';
import {
  buildInstrumentExportBaseName,
  buildPatternExportBaseName,
  buildSongExportBaseName,
  buildDumpExportBaseName,
  getUnsafeSongTitleTokenForExport,
} from '../utils/exportFileNaming';
import {
  exportToAssembly,
  exportSongRegisterDump,
  exportInstrumentToAssembly,
  downloadAssemblyFile,
} from '../exports/asm';
import { exportToBinary, parseAssemblyToBinary, downloadBinaryFile } from '../exports/bin';
import { exportSongToVgm, exportInstrumentToVgm, downloadVgmFile } from '../exports/vgm';
import { exportSongToWav, exportInstrumentToWav, downloadWavFile } from '../exports/wav';
import { exportSongToMax, exportInstrumentToMax, downloadMaxFile } from '../exports/max';

interface ExportContext {
  type: ExportType;
  strategy: ExportStrategy;
  playlistIndex: number;
  currentLine: number;
  instrument: Instrument | null;
}

interface UseFileOperationsArgs {
  song: Song;
  isComplexDumpMode: boolean;
}

interface UseFileOperationsResult {
  soundExportSummary: string;
  dumpExportSummary: string;
  handleExportData: () => void;
  handleExportBin: () => void;
  handleExportVgm: () => void;
  handleExportWav: () => void;
  handleExportMax: () => void;
  handleExportDump: () => void;
  exportDataWithContext: (ctx: ExportContext) => void;
  exportBinWithContext: (ctx: ExportContext) => void;
  exportVgmWithContext: (ctx: ExportContext) => void;
  exportWavWithContext: (ctx: ExportContext) => void;
  exportMaxWithContext: (ctx: ExportContext) => void;
  exportDumpWithContext: (ctx: ExportContext) => void;
  handleCloseSoundExportSummary: () => void;
  handleCloseDumpExportSummary: () => void;
}

export function useFileOperations({ song, isComplexDumpMode }: UseFileOperationsArgs): UseFileOperationsResult {
  const [soundExportSummary, setSoundExportSummary] = useState('');
  const [dumpExportSummary, setDumpExportSummary] = useState('');

  const handleExportData = useCallback(() => {
    try {
      const assemblyContent = exportToAssembly(song, isComplexDumpMode);
      const filename = `${getUnsafeSongTitleTokenForExport(song.title)}.s`;
      downloadAssemblyFile(assemblyContent, filename);

      const lines: string[] = [];
      lines.push('DATA export completed.');
      lines.push('');
      lines.push(`File: ${filename}`);

      setSoundExportSummary(lines.join('\n'));
    } catch (error) {
      console.error('Export failed:', error);
      const lines: string[] = [];
      lines.push('DATA export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setSoundExportSummary(lines.join('\n'));
    }
  }, [song, isComplexDumpMode]);

  const handleExportBin = useCallback(() => {
    try {
      const bytes = exportToBinary(song, isComplexDumpMode);
      const filename = `${getUnsafeSongTitleTokenForExport(song.title)}.bin`;
      downloadBinaryFile(bytes, filename);

      const lines: string[] = [];
      lines.push('BIN export completed.');
      lines.push('');
      lines.push(`File: ${filename}`);
      lines.push(`Bytes: ${bytes.length}`);

      setSoundExportSummary(lines.join('\n'));
    } catch (error) {
      console.error('Binary export failed:', error);
      const lines: string[] = [];
      lines.push('BIN export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setSoundExportSummary(lines.join('\n'));
    }
  }, [song, isComplexDumpMode]);

  const handleExportVgm = useCallback(() => {
    try {
      const result = exportSongToVgm(song);
      const filename = `${buildSongExportBaseName(song.title)}.vgm`;
      downloadVgmFile(result.buffer, filename);

      const lines: string[] = [];
      lines.push('VGM export completed.');
      lines.push('');
      lines.push(`File: ${filename}`);
      lines.push(`Total samples: ${result.totalSamples}`);

      setSoundExportSummary(lines.join('\n'));
    } catch (error) {
      console.error('VGM export failed:', error);
      const lines: string[] = [];
      lines.push('VGM export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setSoundExportSummary(lines.join('\n'));
    }
  }, [song]);

  const handleExportMax = useCallback(() => {
    try {
      const strategy: ExportStrategy = isComplexDumpMode ? 'complex' : 'simple';
      const result = exportSongToMax(song, strategy);
      const filename = `${buildSongExportBaseName(song.title)}.max`;
      downloadMaxFile(result.buffer, filename);

      const lines: string[] = [];
      lines.push('MAX export completed.');
      lines.push('');
      lines.push(`File: ${filename}`);
      lines.push(`Frames: ${result.frameCount}`);

      setSoundExportSummary(lines.join('\n'));
    } catch (error) {
      console.error('MAX export failed:', error);
      const lines: string[] = [];
      lines.push('MAX export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setSoundExportSummary(lines.join('\n'));
    }
  }, [song, isComplexDumpMode]);

  const handleExportWav = useCallback(() => {
    try {
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
      console.error('WAV export failed:', error);
      const lines: string[] = [];
      lines.push('WAV export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setSoundExportSummary(lines.join('\n'));
    }
  }, [song]);

  const handleExportDump = useCallback(() => {
    try {
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
      console.error('Dump export failed:', error);
      const lines: string[] = [];
      lines.push('Dump export failed.');
      if (error instanceof Error) {
        lines.push(`Error: ${error.message}`);
      }
      setDumpExportSummary(lines.join('\n'));
    }
  }, [song]);

  const exportDataWithContext = useCallback(
    (ctx: ExportContext) => {
      try {
        let assemblyContent: string;
        let filenameBase: string;

        if (ctx.type === 'instrument' && ctx.instrument) {
          assemblyContent = exportInstrumentToAssembly(ctx.instrument, song);
          filenameBase = buildInstrumentExportBaseName(song.title, ctx.instrument.id);
        } else {
          let scopedSong: Song = song;
          if (ctx.type === 'pattern' && song.line.length > 0) {
            const playlistLength = song.line.length;
            const rawIndex = ctx.playlistIndex;
            const index = Math.max(
              0,
              Math.min(playlistLength - 1, Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0)
            );
            const entry = song.line[index];
            scopedSong = {
              ...song,
              line: [entry],
              loop: null,
            };
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
        console.error('Context-aware DATA export failed:', error);
        const lines: string[] = [];
        lines.push('DATA export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song]
  );

  const exportMaxWithContext = useCallback(
    (ctx: ExportContext) => {
      try {
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
        if (ctx.type === 'pattern' && song.line.length > 0) {
          const playlistLength = song.line.length;
          const rawIndex = ctx.playlistIndex;
          const index = Math.max(
            0,
            Math.min(playlistLength - 1, Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0)
          );
          const entry = song.line[index];
          scopedSong = {
            ...song,
            line: [entry],
            loop: null,
          };
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
        console.error('Context-aware MAX export failed:', error);
        const lines: string[] = [];
        lines.push('MAX export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song]
  );

  const exportBinWithContext = useCallback(
    (ctx: ExportContext) => {
      try {
        let bytes: Uint8Array;
        let filenameBase: string;

        if (ctx.type === 'instrument' && ctx.instrument) {
          const asm = exportInstrumentToAssembly(ctx.instrument, song);
          bytes = parseAssemblyToBinary(asm);
          filenameBase = buildInstrumentExportBaseName(song.title, ctx.instrument.id);
        } else {
          let scopedSong: Song = song;
          if (ctx.type === 'pattern' && song.line.length > 0) {
            const playlistLength = song.line.length;
            const rawIndex = ctx.playlistIndex;
            const index = Math.max(
              0,
              Math.min(playlistLength - 1, Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0)
            );
            const entry = song.line[index];
            scopedSong = {
              ...song,
              line: [entry],
              loop: null,
            };
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
        console.error('Context-aware BIN export failed:', error);
        const lines: string[] = [];
        lines.push('BIN export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song]
  );

  const exportVgmWithContext = useCallback(
    (ctx: ExportContext) => {
      try {
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
        if (ctx.type === 'pattern' && song.line.length > 0) {
          const playlistLength = song.line.length;
          const rawIndex = ctx.playlistIndex;
          const index = Math.max(
            0,
            Math.min(playlistLength - 1, Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0)
          );
          const entry = song.line[index];
          scopedSong = {
            ...song,
            line: [entry],
            loop: null,
          };
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
        console.error('Context-aware VGM export failed:', error);
        const lines: string[] = [];
        lines.push('VGM export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song]
  );

  const exportWavWithContext = useCallback(
    (ctx: ExportContext) => {
      try {
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
        if (ctx.type === 'pattern' && song.line.length > 0) {
          const playlistLength = song.line.length;
          const rawIndex = ctx.playlistIndex;
          const index = Math.max(
            0,
            Math.min(playlistLength - 1, Number.isFinite(rawIndex) ? Math.floor(rawIndex) : 0)
          );
          const entry = song.line[index];
          scopedSong = {
            ...song,
            line: [entry],
            loop: null,
          };
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
        console.error('Context-aware WAV export failed:', error);
        const lines: string[] = [];
        lines.push('WAV export failed.');
        if (error instanceof Error) {
          lines.push(`Error: ${error.message}`);
        }
        setSoundExportSummary(lines.join('\n'));
      }
    },
    [song]
  );

  const exportDumpWithContext = useCallback(
    (ctx: ExportContext) => {
      void ctx;
      handleExportDump();
    },
    [handleExportDump]
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
    handleExportData,
    handleExportBin,
    handleExportVgm,
    handleExportWav,
    handleExportMax,
    handleExportDump,
    exportDataWithContext,
    exportBinWithContext,
    exportVgmWithContext,
    exportWavWithContext,
    exportMaxWithContext,
    exportDumpWithContext,
    handleCloseSoundExportSummary,
    handleCloseDumpExportSummary,
  };
}

import { useCallback, useState } from 'react';
import type { Song, Instrument } from '../synth/SoundDriver';
import type { ExportType, ExportStrategy } from '../constants/export';
import {
  exportToAssembly,
  exportSongToWav,
  exportSongRegisterDump,
  exportSongToVgm,
  exportToBinary,
  downloadAssemblyFile,
  downloadBinaryFile,
  downloadVgmFile,
  downloadWavFile,
} from '../utils/assemblyExport';

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
  handleExportDump: () => void;
  exportDataWithContext: (ctx: ExportContext) => void;
  exportBinWithContext: (ctx: ExportContext) => void;
  exportVgmWithContext: (ctx: ExportContext) => void;
  exportWavWithContext: (ctx: ExportContext) => void;
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
      const filename = `${song.title.replace(/[^a-zA-Z0-9]/g, '_')}.s`;
      downloadAssemblyFile(assemblyContent, filename);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', error);
    }
  }, [song, isComplexDumpMode]);

  const handleExportBin = useCallback(() => {
    try {
      const bytes = exportToBinary(song, isComplexDumpMode);
      const filename = `${song.title.replace(/[^a-zA-Z0-9]/g, '_')}.bin`;
      downloadBinaryFile(bytes, filename);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Binary export failed:', error);
    }
  }, [song, isComplexDumpMode]);

  const handleExportVgm = useCallback(() => {
    try {
      const result = exportSongToVgm(song);
      const safeTitle = song.title.replace(/[^a-zA-Z0-9]/g, '_') || 'music';
      const filename = `${safeTitle}.vgm`;
      downloadVgmFile(result.buffer, filename);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('VGM export failed:', error);
    }
  }, [song]);

  const handleExportWav = useCallback(() => {
    try {
      const result = exportSongToWav(song);
      const safeTitle = song.title.replace(/[^a-zA-Z0-9]/g, '_') || 'music';
      const filename = `${safeTitle}.wav`;

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
      // eslint-disable-next-line no-console
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
      const safeTitle = song.title.replace(/[^a-zA-Z0-9]/g, '_') || 'music';
      const filename = `${safeTitle}_dump.s`;

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
      // eslint-disable-next-line no-console
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
      // Context-aware routing will be implemented together with the ExportModal.
      // For now, delegate to the existing song-wide handler.
      void ctx;
      handleExportData();
    },
    [handleExportData]
  );

  const exportBinWithContext = useCallback(
    (ctx: ExportContext) => {
      void ctx;
      handleExportBin();
    },
    [handleExportBin]
  );

  const exportVgmWithContext = useCallback(
    (ctx: ExportContext) => {
      void ctx;
      handleExportVgm();
    },
    [handleExportVgm]
  );

  const exportWavWithContext = useCallback(
    (ctx: ExportContext) => {
      void ctx;
      handleExportWav();
    },
    [handleExportWav]
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
    handleExportDump,
    exportDataWithContext,
    exportBinWithContext,
    exportVgmWithContext,
    exportWavWithContext,
    exportDumpWithContext,
    handleCloseSoundExportSummary,
    handleCloseDumpExportSummary,
  };
}

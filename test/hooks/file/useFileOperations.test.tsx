import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import {
  useFileOperations,
  type ExportContext,
} from '../../../src/hooks/file/useFileOperations.ts';
import { ENVELOPE_LENGTH } from '../../../src/constants/music.ts';
import type { Instrument, Pattern, Song, Step } from '../../../src/synth/SoundDriver.ts';
import type { ExportStrategy, ExportType } from '../../../src/constants/export.ts';
import * as exportModule from '../../../src/exports/export.ts';

vi.mock('../../../src/exports/export.ts', () => ({
  exportToAssembly: vi.fn(() => 'SONG ASM'),
  exportInstrumentToAssembly: vi.fn(() => 'INST ASM'),
  exportSongRegisterDump: vi.fn(() => ({ content: 'DUMP', cycleCount: 7 })),
  exportToBinary: vi.fn(() => new Uint8Array([1, 2, 3, 4])),
  parseAssemblyToBinary: vi.fn(() => new Uint8Array([1, 2, 3])),
  exportSongToVgm: vi.fn(() => ({ buffer: new ArrayBuffer(8), totalSamples: 1234 })),
  exportInstrumentToVgm: vi.fn(() => ({ buffer: new ArrayBuffer(8), totalSamples: 99 })),
  exportSongToWav: vi.fn(() => ({
    buffer: new ArrayBuffer(8),
    sampleRate: 44100,
    totalSamples: 100,
    durationSeconds: 2.5,
  })),
  exportInstrumentToWav: vi.fn(() => ({
    buffer: new ArrayBuffer(8),
    sampleRate: 44100,
    totalSamples: 50,
    durationSeconds: 1.25,
  })),
  exportSongToMax: vi.fn(() => ({ buffer: new ArrayBuffer(8), frameCount: 64 })),
  exportInstrumentToMax: vi.fn(() => ({ buffer: new ArrayBuffer(8), frameCount: 12 })),
  exportSongToMidi: vi.fn(() => ({ buffer: new ArrayBuffer(8), warnings: [] })),
  exportInstrumentToMidi: vi.fn(() => ({
    buffer: new ArrayBuffer(8),
    warnings: ['first warning', 'second warning'],
  })),
  exportSongToMod: vi.fn(() => ({ buffer: new ArrayBuffer(8), warnings: [] })),
  exportInstrumentToMod: vi.fn(() => ({
    buffer: new ArrayBuffer(8),
    warnings: ['mod warning'],
  })),
  downloadAssemblyFile: vi.fn(),
  downloadBinaryFile: vi.fn(),
  downloadVgmFile: vi.fn(),
  downloadWavFile: vi.fn(),
  downloadMaxFile: vi.fn(),
  downloadMidiFile: vi.fn(),
  downloadModFile: vi.fn(),
}));

afterEach(() => cleanup());

const instrument = (id: string, name = ''): Instrument => ({
  id,
  name,
  volume: new Array(ENVELOPE_LENGTH).fill(0),
  shift: new Array(ENVELOPE_LENGTH).fill(0),
  pitch: new Array(ENVELOPE_LENGTH).fill(0),
  noise: new Array(ENVELOPE_LENGTH).fill(0),
  mode: new Array(ENVELOPE_LENGTH).fill(0),
});

const pattern = (id: string): Pattern => ({
  id,
  name: `Pattern ${id}`,
  step: Array.from({ length: 2 }, () => ({
    note: { note: 'C', octave: 4, instrument: '00' },
    volume: null,
  })) as Step[],
});

const song = (overrides: Partial<Song> = {}): Song => ({
  title: 'T',
  author: 'A',
  year: 2025,
  speed: 6,
  length: 4,
  pattern: [pattern('00')],
  line: [{ A: '00', B: '--', C: '--' }],
  instrument: [instrument('00')],
  ...overrides,
});

const ctx = (overrides: Partial<ExportContext> = {}): ExportContext => ({
  type: 'song' as ExportType,
  strategy: 'tight' as ExportStrategy,
  playlistIndex: 0,
  currentLine: 0,
  instrument: null,
  ...overrides,
});

const renderOperations = () =>
  renderHook(() => useFileOperations({ song: song(), exportStrategy: 'tight' }));

describe('useFileOperations export summaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('summarises a DATA export for the song scope', async () => {
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportDataWithContext(ctx());
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        ['DATA export completed.', '', 'File: T.s', 'Scope: Song', 'Strategy: tight'].join('\n'),
      );
      expect(exportModule.downloadAssemblyFile).toHaveBeenCalledWith('SONG ASM', 'T.s');
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });

  it('summarises a DATA export for the pattern scope', async () => {
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportDataWithContext(ctx({ type: 'pattern', playlistIndex: 0 }));
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        [
          'DATA export completed.',
          '',
          'File: T_pattern.s',
          'Scope: Pattern (current playlist position)',
          'Playlist index: 0',
          'Strategy: tight',
        ].join('\n'),
      );
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });

  it('summarises a DATA export for the instrument scope without a strategy line', async () => {
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportDataWithContext(
        ctx({ type: 'instrument', instrument: instrument('00') }),
      );
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        [
          'DATA export completed.',
          '',
          'File: T_inst_00.s',
          'Scope: Instrument',
          'Instrument ID: 00',
        ].join('\n'),
      );
      expect(exportModule.downloadAssemblyFile).toHaveBeenCalledWith('INST ASM', 'T_inst_00.s');
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });

  it('summarises a BIN export with the bytes line', async () => {
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportBinWithContext(ctx());
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        [
          'BIN export completed.',
          '',
          'File: T.bin',
          'Bytes: 4',
          'Scope: Song',
          'Strategy: tight',
        ].join('\n'),
      );
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });

  it('summarises a VGM export for the song scope without a strategy line', async () => {
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportVgmWithContext(ctx());
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        ['VGM export completed.', '', 'File: T.vgm', 'Total samples: 1234', 'Scope: Song'].join(
          '\n',
        ),
      );
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });

  it('summarises a VGM export for the instrument scope', async () => {
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportVgmWithContext(
        ctx({ type: 'instrument', instrument: instrument('00') }),
      );
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        [
          'VGM export completed.',
          '',
          'File: T_inst_00.vgm',
          'Total samples: 99',
          'Scope: Instrument',
          'Instrument ID: 00',
        ].join('\n'),
      );
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });

  it('summarises a WAV export with the audio detail lines', async () => {
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportWavWithContext(ctx());
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        [
          'WAV export completed.',
          '',
          'File: T.wav',
          'Sample rate: 44100 Hz',
          'Channels: 1 (mono)',
          'Bit depth: 16-bit',
          'Total samples: 100',
          'Duration: 2.50 seconds',
          'Scope: Song',
        ].join('\n'),
      );
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });

  it('summarises a MIDI instrument export with note lines per warning', async () => {
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportMidiWithContext(
        ctx({ type: 'instrument', instrument: instrument('00') }),
      );
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        [
          'MIDI export completed.',
          '',
          'File: T_inst_00.mid',
          'Scope: Instrument',
          'Instrument ID: 00',
          'Note: first warning',
          'Note: second warning',
        ].join('\n'),
      );
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });

  it('summarises a failing export with the shared error lines', async () => {
    vi.mocked(exportModule.exportToAssembly).mockImplementationOnce(() => {
      throw new Error('assembly exploded');
    });
    const { result } = renderOperations();
    await act(async () => {
      result.current.exportDataWithContext(ctx());
    });
    try {
      expect(result.current.soundExportSummary).toBe(
        ['DATA export failed.', 'Error: assembly exploded'].join('\n'),
      );
    } catch (error) {
      console.log('summary mismatch:', JSON.stringify(result.current.soundExportSummary));
      throw error;
    }
  });
});

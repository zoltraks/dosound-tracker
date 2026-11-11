// @vitest-environment node

import { describe, expect, it } from 'vitest';
import {
  buildExportStrategyNote,
  exportStrategyApplies,
} from '../../../src/utils/export/exportStrategy.ts';
import type { ExportFormat, ExportType } from '../../../src/constants/export.ts';

const ALL_FORMATS: ExportFormat[] = ['data', 'dump', 'bin', 'vgm', 'max', 'wav', 'mod', 'midi'];
const ALL_SCOPES: ExportType[] = ['song', 'pattern', 'instrument'];

describe('exportStrategy', () => {
  it('marks DATA, BIN, VGM, and MAX under the song and pattern scopes', () => {
    for (const scope of ['song', 'pattern'] as const) {
      for (const format of ALL_FORMATS) {
        try {
          expect(exportStrategyApplies(format, scope)).toBe(
            ['data', 'bin', 'vgm', 'max'].includes(format),
          );
        } catch (error) {
          console.log('scope', scope, 'format', format);
          throw error;
        }
      }
    }
  });

  it('marks only MAX under the instrument scope', () => {
    for (const format of ALL_FORMATS) {
      try {
        expect(exportStrategyApplies(format, 'instrument')).toBe(format === 'max');
      } catch (error) {
        console.log('format', format);
        throw error;
      }
    }
  });

  it('never marks DUMP, WAV, MOD, or MIDI under any scope', () => {
    for (const scope of ALL_SCOPES) {
      for (const format of ['dump', 'wav', 'mod', 'midi'] as const) {
        try {
          expect(exportStrategyApplies(format, scope)).toBe(false);
        } catch (error) {
          console.log('scope', scope, 'format', format);
          throw error;
        }
      }
    }
  });

  it('builds the scope-specific caption text', () => {
    try {
      expect(buildExportStrategyNote('song')).toBe(
        '* uses the strategy - MAX selects a stream format; for VGM only TIGHT differs',
      );
      expect(buildExportStrategyNote('pattern')).toBe(
        '* uses the strategy - MAX selects a stream format; for VGM only TIGHT differs',
      );
      expect(buildExportStrategyNote('instrument')).toBe(
        '* uses the strategy - MAX selects a stream format',
      );
    } catch (error) {
      console.log('note mismatch');
      throw error;
    }
  });
});

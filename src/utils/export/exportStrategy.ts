import type { ExportFormat, ExportType } from '../../constants/export.ts';

const SCOPE_STRATEGY_FORMATS: Record<ExportType, ReadonlySet<ExportFormat>> = {
  song: new Set<ExportFormat>(['data', 'bin', 'vgm', 'max']),
  pattern: new Set<ExportFormat>(['data', 'bin', 'vgm', 'max']),
  instrument: new Set<ExportFormat>(['max']),
};

export function exportStrategyApplies(format: ExportFormat, scope: ExportType): boolean {
  return SCOPE_STRATEGY_FORMATS[scope].has(format);
}

export function buildExportStrategyNote(scope: ExportType): string {
  if (scope === 'instrument') {
    return '* uses the strategy - MAX selects a stream format';
  }
  return '* uses the strategy - MAX selects a stream format; for VGM only TIGHT differs';
}

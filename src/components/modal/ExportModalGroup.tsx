import React from 'react';
import type { ExportType, ExportStrategy, ExportFormat } from '../../constants/export.ts';

// Export modals load on demand: they are opened by explicit user action,
// so keeping them out of the entry chunk protects the bundle budget.
const ExportModal = React.lazy(async () => {
  const { ExportModal } = await import('../../modals/export/ExportModal.tsx');
  return { default: ExportModal };
});

export interface ExportModalGroupParams {
  pendingExportType: ExportType;
  pendingExportStrategy: ExportStrategy;
  pendingChipStream: 1 | 2;
  onChangeExportType: (type: ExportType) => void;
  onChangeExportStrategy: (strategy: ExportStrategy) => void;
  onChangeChipStream: (chip: 1 | 2) => void;
  onExportFormat: (format: ExportFormat) => void;
  onConfirmExport: () => void;
  onCancelExport: () => void;
}

export interface ExportModalGroupProps extends ExportModalGroupParams {
  isExportModalOpen: boolean;
}

export function ExportModalGroup({
  isExportModalOpen,
  pendingExportType,
  pendingExportStrategy,
  pendingChipStream,
  onChangeExportType,
  onChangeExportStrategy,
  onChangeChipStream,
  onExportFormat,
  onConfirmExport,
  onCancelExport,
}: ExportModalGroupProps) {
  if (!isExportModalOpen) {
    return null;
  }

  return (
    <React.Suspense fallback={null}>
      <ExportModal
        isOpen={isExportModalOpen}
        exportType={pendingExportType}
        exportStrategy={pendingExportStrategy}
        chipStream={pendingChipStream}
        onChangeType={onChangeExportType}
        onChangeStrategy={onChangeExportStrategy}
        onChangeChipStream={onChangeChipStream}
        onExportFormat={onExportFormat}
        onConfirm={onConfirmExport}
        onCancel={onCancelExport}
      />
    </React.Suspense>
  );
}

import { AboutModal } from '../../modals/information/AboutModal.tsx';
import { MarkdownModal } from '../../modals/information/MarkdownModal.tsx';

export interface DocumentModalGroupParams {
  aboutVersion: string;
  aboutRuntimeLabel: string | null;
  aboutRuntimeDetails: string[];
  viewZoomFactor: number | null;
  onShowChangelog: () => void;
  onCloseChangelog: () => void;
  onShowManual: () => void;
  onCloseManual: () => void;
}

export interface DocumentModalGroupProps extends DocumentModalGroupParams {
  isAboutOpen: boolean;
  setIsAboutOpen: (value: boolean) => void;
  isChangelogOpen: boolean;
  changelogContent: string;
  isManualOpen: boolean;
  manualContent: string;
}

export function DocumentModalGroup({
  isAboutOpen,
  aboutVersion,
  aboutRuntimeLabel,
  aboutRuntimeDetails,
  setIsAboutOpen,
  isChangelogOpen,
  changelogContent,
  onShowChangelog,
  onCloseChangelog,
  isManualOpen,
  manualContent,
  onShowManual,
  onCloseManual,
}: DocumentModalGroupProps) {
  return (
    <>
      <AboutModal
        isOpen={isAboutOpen}
        version={aboutVersion}
        runtimeLabel={aboutRuntimeLabel ?? undefined}
        runtimeDetails={aboutRuntimeDetails}
        onClose={() => setIsAboutOpen(false)}
        onShowChangelog={onShowChangelog}
        onShowManual={onShowManual}
      />

      <MarkdownModal
        isOpen={isChangelogOpen}
        title="Changes"
        content={changelogContent}
        downloadHref="CHANGELOG.md"
        showTitle={false}
        onClose={onCloseChangelog}
      />

      <MarkdownModal
        isOpen={isManualOpen}
        title="Manual"
        content={manualContent}
        downloadHref="MANUAL.md"
        showTitle={false}
        onClose={onCloseManual}
      />
    </>
  );
}

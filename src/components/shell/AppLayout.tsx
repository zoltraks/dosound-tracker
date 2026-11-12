import React from 'react';
import type { TextScale, ThemeVariant } from '../../types/settings.ts';

interface AppLayoutProps {
  theme: ThemeVariant;
  textScale: TextScale;
  header: React.ReactNode;
  commandPanel: React.ReactNode;
  trackerSection: React.ReactNode;
  envelopeSection: React.ReactNode;
  songSection: React.ReactNode;
  pianoKeyboard: React.ReactNode;
  fileInputs: React.ReactNode;
  modals: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  theme,
  textScale,
  header,
  commandPanel,
  trackerSection,
  envelopeSection,
  songSection,
  pianoKeyboard,
  fileInputs,
  modals,
}) => {
  const scaleClass = textScale === '100' ? '' : ` app-scale-${textScale}`;
  return (
    <div className={`app ${theme}${scaleClass}`}>
      <div
        className={`app-initial-overlay ${
          theme === 'light' ? 'app-initial-overlay-light' : 'app-initial-overlay-dark'
        }`}
      />
      {header}
      {commandPanel}

      <main className="main-content">
        {trackerSection}
        {envelopeSection}
        {songSection}
      </main>

      {pianoKeyboard}
      {fileInputs}
      {modals}
    </div>
  );
};

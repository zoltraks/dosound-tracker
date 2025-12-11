import React from 'react';

interface AppLayoutProps {
  isDarkMode: boolean;
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
  isDarkMode,
  header,
  commandPanel,
  trackerSection,
  envelopeSection,
  songSection,
  pianoKeyboard,
  fileInputs,
  modals,
}) => {
  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      <div
        className={`app-initial-overlay ${
          isDarkMode ? 'app-initial-overlay-dark' : 'app-initial-overlay-light'
        }`}
      />
      {header}
      {commandPanel}

      <div className="main-content">
        {trackerSection}
        {envelopeSection}
        {songSection}
      </div>

      {pianoKeyboard}
      {fileInputs}
      {modals}
    </div>
  );
};

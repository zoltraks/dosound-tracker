import React from 'react';

interface AppLayoutProps {
  isDarkMode: boolean;
  header: React.ReactNode;
  commandPanel: React.ReactNode;
  tracksSection: React.ReactNode;
  instrumentSection: React.ReactNode;
  infoSection: React.ReactNode;
  pianoKeyboard: React.ReactNode;
  fileInputs: React.ReactNode;
  modals: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  isDarkMode,
  header,
  commandPanel,
  tracksSection,
  instrumentSection,
  infoSection,
  pianoKeyboard,
  fileInputs,
  modals,
}) => {
  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      {header}
      {commandPanel}

      <div className="main-content">
        {tracksSection}
        {instrumentSection}
        {infoSection}
      </div>

      {pianoKeyboard}
      {fileInputs}
      {modals}
    </div>
  );
};

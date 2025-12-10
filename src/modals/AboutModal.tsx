import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  version: string;
  onClose: () => void;
  onShowChangelog: () => void;
  onShowManual: () => void;
  runtimeLabel?: string | null;
  runtimeDetails?: string[];
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  version,
  onClose,
  onShowChangelog,
  onShowManual,
  runtimeLabel,
  runtimeDetails,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-title">About</div>
        <div className="modal-body">
          DOSOUND Tracker
          <br />
          <br />
          Made by Zoltar X / New Generation
          <br />
          <br />
          Version: <b>{version}</b>
          <br />
          <br />
          {runtimeLabel && runtimeDetails && runtimeDetails.length > 0 && (
            <>
              {runtimeDetails.map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
              <br />
            </>
          )}
        </div>
        <div className="modal-actions about-actions">
          <div className="about-actions-left">
            <button className="command-btn" onClick={onShowChangelog}>
              CHANGES
            </button>
            <button className="command-btn" onClick={onShowManual}>
              MANUAL
            </button>
          </div>
          <div className="about-actions-right">
            <button className="command-btn" onClick={onClose}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

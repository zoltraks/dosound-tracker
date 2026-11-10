import React from 'react';

interface DialogFrameProps {
  label: string;
  className?: string;
  backdropStyle?: React.CSSProperties;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  children: React.ReactNode;
}

export const DialogFrame: React.FC<DialogFrameProps> = ({
  label,
  className,
  backdropStyle,
  onKeyDown,
  children,
}) => {
  const dialogClassName = className ? `modal-dialog ${className}` : 'modal-dialog';
  return (
    <div className="modal-backdrop" style={backdropStyle}>
      <div
        className={dialogClassName}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>
  );
};

import type { ReactNode } from 'react';

interface AppContainerProps {
  children: ReactNode;
}

export const AppContainer = ({ children }: AppContainerProps) => {
  return <div className="app-root-container">{children}</div>;
};

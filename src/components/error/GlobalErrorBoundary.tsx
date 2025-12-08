import type { ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

export const GlobalErrorBoundary = ({ children }: GlobalErrorBoundaryProps) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

import type { ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface SectionErrorBoundaryProps {
  children: ReactNode;
}

export const SectionErrorBoundary = ({ children }: SectionErrorBoundaryProps) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

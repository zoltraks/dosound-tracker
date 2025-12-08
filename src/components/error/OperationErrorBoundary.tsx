import type { ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

interface OperationErrorBoundaryProps {
  children: ReactNode;
}

export const OperationErrorBoundary = ({ children }: OperationErrorBoundaryProps) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

import { ReactNode } from 'react';

interface MarketsLayoutProps {
  children: ReactNode;
}

export default function MarketsLayout({ children }: MarketsLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      {children}
    </div>
  );
} 
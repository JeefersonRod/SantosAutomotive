import type { ReactNode } from 'react';

interface CardProps {
  interactive?: boolean;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ className = '', interactive = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-surface-200 rounded-2xl shadow-sm ${interactive ? 'tech-card hover:border-brand-primary/30' : ''} ${className}`}
      {...props}
    />
  );
}

import type { ReactNode } from 'react';

type BadgeTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red';

interface BadgeProps {
  tone?: BadgeTone;
  children?: ReactNode;
  className?: string;
  title?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-100 text-surface-600 border-surface-200',
  blue: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  red: 'bg-red-50 text-red-600 border-red-200',
};

export function Badge({ className = '', tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}

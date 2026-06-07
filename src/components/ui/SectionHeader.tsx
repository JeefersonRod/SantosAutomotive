import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-display font-bold text-surface-900">{title}</h2>
        {description && <p className="mt-1 text-sm font-medium text-surface-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

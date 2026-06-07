import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 bg-white p-8 text-center">
      {icon && <div className="mb-4 text-surface-300">{icon}</div>}
      <h2 className="text-lg font-display font-bold text-surface-900">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm font-medium text-surface-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

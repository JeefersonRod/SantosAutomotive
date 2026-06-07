import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-surface-200 bg-surface-50 p-5">
      <div>
        <h3 className="text-sm font-display font-bold text-surface-900">{title}</h3>
        {description && <p className="mt-1 text-xs font-medium text-surface-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

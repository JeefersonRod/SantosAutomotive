import type { ReactNode } from 'react';
import { Card } from './Card';

interface MetricCardProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  helper?: string;
}

export function MetricCard({ icon, label, value, helper }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        {icon && <div className="rounded-xl bg-brand-primary/10 p-3 text-brand-primary">{icon}</div>}
        <div>
          <p className="micro-label">{label}</p>
          <div className="mt-1 text-2xl font-display font-bold text-surface-950">{value}</div>
          {helper && <p className="mt-1 text-xs font-medium text-surface-500">{helper}</p>}
        </div>
      </div>
    </Card>
  );
}

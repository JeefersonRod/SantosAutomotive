import { Badge } from './Badge';

type Status = 'pending' | 'in_progress' | 'completed' | 'active' | 'inactive' | 'paid' | 'unpaid' | 'partial';

const statusMeta: Record<Status, { label: string; tone: 'neutral' | 'blue' | 'green' | 'amber' | 'red' }> = {
  pending: { label: 'Pendente', tone: 'amber' },
  in_progress: { label: 'Em andamento', tone: 'blue' },
  completed: { label: 'Concluído', tone: 'green' },
  active: { label: 'Ativo', tone: 'green' },
  inactive: { label: 'Inativo', tone: 'neutral' },
  paid: { label: 'Pago', tone: 'green' },
  unpaid: { label: 'Em aberto', tone: 'red' },
  partial: { label: 'Parcial', tone: 'amber' },
};

export function StatusBadge({ status }: { status: Status }) {
  const meta = statusMeta[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

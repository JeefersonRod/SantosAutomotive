import { ShieldAlert } from 'lucide-react';
import { EmptyState } from './EmptyState';

export function AccessDeniedState() {
  return (
    <EmptyState
      icon={<ShieldAlert className="h-12 w-12" />}
      title="Acesso restrito"
      description="Seu perfil não tem permissão para acessar esta área. Fale com um administrador da oficina se precisar liberar este módulo."
    />
  );
}

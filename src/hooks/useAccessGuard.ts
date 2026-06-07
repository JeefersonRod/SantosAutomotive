import { usePermissions } from './usePermissions';

export function useAccessGuard(allowedRoles: string[]) {
  const { role } = usePermissions();
  return allowedRoles.includes(role);
}

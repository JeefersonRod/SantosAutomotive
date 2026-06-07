import { useAuth } from '../contexts/AuthContext';

const staffRoles = ['super_admin', 'admin', 'attendant', 'technician'];
const adminRoles = ['super_admin', 'admin'];

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.permissions || 'technician';

  return {
    role,
    isSuperAdmin: role === 'super_admin',
    isAdmin: adminRoles.includes(role),
    isStaff: staffRoles.includes(role),
    isTechnician: role === 'technician',
    isAttendant: role === 'attendant',
    isClient: role === 'client',
    canManageWorkshopData: ['super_admin', 'admin', 'attendant'].includes(role),
    canViewFinance: adminRoles.includes(role) || role === 'attendant',
  };
}

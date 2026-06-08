import { apiRequest } from './api';
import { StaffMember } from '../types';

export const staffService = {
  list: () => apiRequest<StaffMember[]>('/api/staff'),
  listActive: async () => {
    const staff = await apiRequest<StaffMember[]>('/api/staff');
    return staff.filter(member => member.active);
  },
  listRequests: () => apiRequest<unknown[]>('/api/staff-requests'),
  create: (payload: unknown) => apiRequest<StaffMember>('/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  update: (staffId: number, payload: unknown) => apiRequest<StaffMember>(`/api/staff/${staffId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  remove: (staffId: number) => apiRequest<{ success?: boolean }>(`/api/staff/${staffId}`, {
    method: 'DELETE',
  }),
  removeRequest: (requestId: number) => apiRequest<{ success?: boolean }>(`/api/staff-requests/${requestId}`, {
    method: 'DELETE',
  }),
};

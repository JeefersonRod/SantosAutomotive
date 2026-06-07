import { apiRequest } from './api';
import { StaffMember } from '../types';

export const staffService = {
  list: () => apiRequest<StaffMember[]>('/api/staff'),
  listActive: async () => {
    const staff = await apiRequest<StaffMember[]>('/api/staff');
    return staff.filter(member => member.active);
  },
  listRequests: () => apiRequest<unknown[]>('/api/staff-requests'),
};

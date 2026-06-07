import { apiRequest } from './api';
import { StaffMember } from '../types';

export const staffService = {
  list: () => apiRequest<StaffMember[]>('/api/staff'),
  listRequests: () => apiRequest<unknown[]>('/api/staff-requests'),
};

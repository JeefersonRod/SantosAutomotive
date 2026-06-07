import { apiRequest } from './api';

export const reportService = {
  stats: (query = '') => apiRequest<Record<string, unknown>>(`/api/stats${query}`),
};

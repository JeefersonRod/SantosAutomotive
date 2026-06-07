import { apiRequest } from './api';

export const reportService = {
  stats: <T = Record<string, unknown>>(query = '') => apiRequest<T>(`/api/stats${query}`),
};

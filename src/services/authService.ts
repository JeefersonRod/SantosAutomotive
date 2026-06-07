import { apiRequest } from './api';
import { User } from '../types';

export const authService = {
  me: () => apiRequest<User>('/api/auth/me', { skipAuthHandling: true }),
  login: (username: string, password: string) => apiRequest<User>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    skipAuthHandling: true,
  }),
  logout: () => apiRequest<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
    skipAuthHandling: true,
  }),
};

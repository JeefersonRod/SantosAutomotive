import { apiRequest } from './api';
import { ServiceOrder } from '../types';

export const orderService = {
  list: () => apiRequest<ServiceOrder[]>('/api/orders'),
  get: (orderId: number) => apiRequest<ServiceOrder>(`/api/orders/${orderId}`),
  create: (payload: unknown) => apiRequest<ServiceOrder>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  update: (orderId: number, payload: unknown) => apiRequest<ServiceOrder>(`/api/orders/${orderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  remove: (orderId: number) => apiRequest<{ success?: boolean }>(`/api/orders/${orderId}`, {
    method: 'DELETE',
  }),
  updateStatus: (orderId: number, payload: { status: string; create_note: boolean }) => (
    apiRequest<ServiceOrder>(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  ),
};

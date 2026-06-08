import { apiRequest } from './api';
import { Client, ServiceOrder, Vehicle } from '../types';

export const clientService = {
  list: () => apiRequest<Client[]>('/api/clients'),
  getVehicles: (clientId: number) => apiRequest<Vehicle[]>(`/api/clients/${clientId}/vehicles`),
  getOrders: (clientId: number) => apiRequest<ServiceOrder[]>(`/api/clients/${clientId}/orders`),
  create: (payload: unknown) => apiRequest<Client>('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  update: (clientId: number, payload: unknown) => apiRequest<Client>(`/api/clients/${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  remove: (clientId: number) => apiRequest<{ success?: boolean }>(`/api/clients/${clientId}`, {
    method: 'DELETE',
  }),
};

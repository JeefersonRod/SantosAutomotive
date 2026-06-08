import { apiRequest } from './api';
import { Vehicle } from '../types';

export const vehicleService = {
  list: () => apiRequest<Vehicle[]>('/api/vehicles'),
  create: (payload: unknown) => apiRequest<Vehicle>('/api/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  update: (vehicleId: number, payload: unknown) => apiRequest<Vehicle>(`/api/vehicles/${vehicleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  remove: (vehicleId: number) => apiRequest<{ success?: boolean }>(`/api/vehicles/${vehicleId}`, {
    method: 'DELETE',
  }),
};

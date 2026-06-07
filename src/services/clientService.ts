import { apiRequest } from './api';
import { Client, ServiceOrder, Vehicle } from '../types';

export const clientService = {
  list: () => apiRequest<Client[]>('/api/clients'),
  getVehicles: (clientId: number) => apiRequest<Vehicle[]>(`/api/clients/${clientId}/vehicles`),
  getOrders: (clientId: number) => apiRequest<ServiceOrder[]>(`/api/clients/${clientId}/orders`),
};

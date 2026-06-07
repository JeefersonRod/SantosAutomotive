import { apiRequest } from './api';
import { ServiceOrder } from '../types';

export const orderService = {
  list: () => apiRequest<ServiceOrder[]>('/api/orders'),
  get: (orderId: number) => apiRequest<ServiceOrder>(`/api/orders/${orderId}`),
};

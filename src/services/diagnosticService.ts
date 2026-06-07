import { apiRequest } from './api';

export const diagnosticService = {
  getOrderTests: (orderId: number) => apiRequest<unknown[]>(`/api/orders/${orderId}/tests`),
};

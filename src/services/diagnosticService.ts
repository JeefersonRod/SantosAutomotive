import { apiRequest } from './api';
import { OrderTest } from '../types';

export const diagnosticService = {
  getOrderTests: (orderId: number) => apiRequest<OrderTest[]>(`/api/orders/${orderId}/tests`),
  saveOrderTest: (orderId: number, payload: Pick<OrderTest, 'component_name' | 'result' | 'notes'>) => (
    apiRequest<OrderTest>(`/api/orders/${orderId}/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  ),
  removeOrderTest: (testId: number) => apiRequest<{ success?: boolean }>(`/api/orders/tests/${testId}`, {
    method: 'DELETE',
  }),
};

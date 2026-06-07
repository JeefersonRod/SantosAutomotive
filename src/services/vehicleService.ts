import { apiRequest } from './api';
import { Vehicle } from '../types';

export const vehicleService = {
  list: () => apiRequest<Vehicle[]>('/api/vehicles'),
};

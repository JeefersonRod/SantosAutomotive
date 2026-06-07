import { apiRequest } from './api';
import { Note } from '../types';

export const financeService = {
  listNotes: () => apiRequest<Note[]>('/api/notes'),
};

import { apiRequest } from './api';
import { Note } from '../types';

export const financeService = {
  listNotes: () => apiRequest<Note[]>('/api/notes'),
  getNote: (noteId: number) => apiRequest<Note>(`/api/notes/${noteId}`),
  createNote: (payload: unknown) => apiRequest<Note>('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  updateNote: (noteId: number, payload: unknown) => apiRequest<Note>(`/api/notes/${noteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  removeNote: (noteId: number) => apiRequest<{ success?: boolean }>(`/api/notes/${noteId}`, {
    method: 'DELETE',
  }),
};

export type AccessRole = 'super_admin' | 'admin' | 'technician' | 'attendant' | 'client';

export interface ApiListState {
  loading: boolean;
  error?: string;
}

export interface ScheduleEntry {
  id: string | number;
  title: string;
  starts_at: string;
  ends_at?: string;
  status?: 'scheduled' | 'done' | 'cancelled';
}

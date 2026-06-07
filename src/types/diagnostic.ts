export interface DiagnosticChecklist {
  fuel_level?: string;
  scratches?: boolean;
  spare_tire?: boolean;
  triangle?: boolean;
  jack?: boolean;
  documents?: boolean;
  personal_items?: boolean;
  [key: string]: unknown;
}

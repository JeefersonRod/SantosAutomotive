export type ChecklistStatus = 'present' | 'absent' | 'not_checked';

export const CHECKLIST_ITEMS = [
  { key: 'scratches', label: 'Avarias/Riscos' },
  { key: 'spare_tire', label: 'Estepe' },
  { key: 'triangle', label: 'Triangulo' },
  { key: 'jack', label: 'Macaco' },
  { key: 'documents', label: 'Documentos' },
  { key: 'personal_items', label: 'Itens pessoais' }
] as const;

export const CHECKLIST_STATUS_OPTIONS: Array<{
  value: ChecklistStatus;
  label: string;
  shortLabel: string;
  className: string;
  printMark: string;
}> = [
  {
    value: 'present',
    label: 'Presente / OK',
    shortLabel: 'Presente',
    className: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    printMark: 'Presente'
  },
  {
    value: 'absent',
    label: 'Ausente / Nao',
    shortLabel: 'Ausente',
    className: 'bg-red-50 border-red-200 text-red-700',
    printMark: 'Ausente'
  },
  {
    value: 'not_checked',
    label: 'Nao verificado',
    shortLabel: 'Nao verificado',
    className: 'bg-surface-50 border-surface-200 text-surface-500',
    printMark: 'Nao verificado'
  }
];

export const getChecklistStatusMeta = (status: unknown) =>
  CHECKLIST_STATUS_OPTIONS.find((option) => option.value === status) || CHECKLIST_STATUS_OPTIONS[2];

export const normalizeChecklistStatus = (value: unknown): ChecklistStatus => {
  if (value === true || value === 'present' || value === 'presente') return 'present';
  if (value === false || value === 'absent' || value === 'ausente') return 'absent';
  return 'not_checked';
};

export const createDefaultChecklist = () => ({
  fuel_level: 'not_checked',
  scratches: 'not_checked' as ChecklistStatus,
  spare_tire: 'not_checked' as ChecklistStatus,
  triangle: 'not_checked' as ChecklistStatus,
  jack: 'not_checked' as ChecklistStatus,
  documents: 'not_checked' as ChecklistStatus,
  personal_items: 'not_checked' as ChecklistStatus
});

export const normalizeChecklist = (checklist?: Record<string, any> | null) => {
  const normalized = createDefaultChecklist();
  if (!checklist) return normalized;

  return {
    ...normalized,
    ...checklist,
    fuel_level: checklist.fuel_level || normalized.fuel_level,
    scratches: normalizeChecklistStatus(checklist.scratches),
    spare_tire: normalizeChecklistStatus(checklist.spare_tire),
    triangle: normalizeChecklistStatus(checklist.triangle),
    jack: normalizeChecklistStatus(checklist.jack),
    documents: normalizeChecklistStatus(checklist.documents),
    personal_items: normalizeChecklistStatus(checklist.personal_items)
  };
};

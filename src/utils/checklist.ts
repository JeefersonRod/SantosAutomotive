export type ChecklistStatus = 'present' | 'absent' | 'not_checked';

export const CHECKLIST_ITEMS = [
  { key: 'scratches', label: 'Avarias/Riscos' },
  { key: 'check_engine_light', label: 'Luz injeção acesa' },
  { key: 'abs_light', label: 'Luz ABS acesa' },
  { key: 'airbag_light', label: 'Luz Airbag acesa' },
  { key: 'eps_light', label: 'Luz EPS acesa' },
  { key: 'battery_light', label: 'Luz bateria acesa' },
  { key: 'temperature_light', label: 'Luz temperatura acesa' },
  { key: 'other_panel_lights', label: 'Outras luzes acesas' },
  { key: 'visible_leak', label: 'Vazamento visível' },
  { key: 'worn_tires', label: 'Pneu gasto' },
  { key: 'coolant_irregular', label: 'Arrefecimento irregular' },
  { key: 'spare_tire', label: 'Estepe' },
  { key: 'triangle', label: 'Triângulo' },
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
    label: 'Ausente / Não',
    shortLabel: 'Ausente',
    className: 'bg-red-50 border-red-200 text-red-700',
    printMark: 'Ausente'
  },
  {
    value: 'not_checked',
    label: 'Não verificado',
    shortLabel: 'Não verificado',
    className: 'bg-surface-50 border-surface-200 text-surface-500',
    printMark: 'Não verificado'
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
  check_engine_light: 'not_checked' as ChecklistStatus,
  abs_light: 'not_checked' as ChecklistStatus,
  airbag_light: 'not_checked' as ChecklistStatus,
  eps_light: 'not_checked' as ChecklistStatus,
  battery_light: 'not_checked' as ChecklistStatus,
  temperature_light: 'not_checked' as ChecklistStatus,
  other_panel_lights: 'not_checked' as ChecklistStatus,
  visible_leak: 'not_checked' as ChecklistStatus,
  worn_tires: 'not_checked' as ChecklistStatus,
  coolant_irregular: 'not_checked' as ChecklistStatus,
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
    check_engine_light: normalizeChecklistStatus(checklist.check_engine_light),
    abs_light: normalizeChecklistStatus(checklist.abs_light),
    airbag_light: normalizeChecklistStatus(checklist.airbag_light),
    eps_light: normalizeChecklistStatus(checklist.eps_light),
    battery_light: normalizeChecklistStatus(checklist.battery_light),
    temperature_light: normalizeChecklistStatus(checklist.temperature_light),
    other_panel_lights: normalizeChecklistStatus(checklist.other_panel_lights),
    visible_leak: normalizeChecklistStatus(checklist.visible_leak),
    worn_tires: normalizeChecklistStatus(checklist.worn_tires),
    coolant_irregular: normalizeChecklistStatus(checklist.coolant_irregular),
    spare_tire: normalizeChecklistStatus(checklist.spare_tire),
    triangle: normalizeChecklistStatus(checklist.triangle),
    jack: normalizeChecklistStatus(checklist.jack),
    documents: normalizeChecklistStatus(checklist.documents),
    personal_items: normalizeChecklistStatus(checklist.personal_items)
  };
};

import { ServiceOrder } from '../types';
import { getChecklistStatusMeta, normalizeChecklist } from './checklist';
import {
  getDiagnosticStatusGroup,
  getDiagnosticStatusLabel,
  isTechnicalSymptomTest,
  parseTechnicalSymptomNotes,
  summarizeDiagnosticTest
} from './diagnosticTemplates';

export type TechnicalHistoryEventType =
  | 'order'
  | 'checklist'
  | 'symptom'
  | 'diagnostic'
  | 'status'
  | 'note';

export interface TechnicalHistoryEvent {
  type: TechnicalHistoryEventType;
  label: string;
  detail: string;
  tone: 'neutral' | 'warning' | 'success' | 'danger';
}

const statusLabels: Record<ServiceOrder['status'], string> = {
  pending: 'O.S. em recepcao',
  in_progress: 'O.S. em diagnostico / execucao',
  completed: 'O.S. concluida'
};

const checklistEventLabels: Record<string, string> = {
  fuel_level: 'Combustivel na reserva',
  check_engine_light: 'Luz de injecao acesa',
  abs_light: 'Luz ABS acesa',
  airbag_light: 'Luz Airbag acesa',
  eps_light: 'Luz EPS acesa',
  visible_leak: 'Vazamento visivel',
  worn_tires: 'Pneu gasto',
  coolant_irregular: 'Arrefecimento irregular',
  scratches: 'Avaria externa relevante',
  spare_tire: 'Estepe ausente',
  triangle: 'Triangulo ausente',
  jack: 'Macaco ausente',
  documents: 'Documentos ausentes'
};

export const deriveChecklistHistory = (checklistInput?: Record<string, any> | null): TechnicalHistoryEvent[] => {
  const checklist = normalizeChecklist(checklistInput);
  const events: TechnicalHistoryEvent[] = [];

  if (checklist.fuel_level === 'Reserva') {
    events.push({
      type: 'checklist',
      label: checklistEventLabels.fuel_level,
      detail: 'Registrado no checklist de entrada.',
      tone: 'warning'
    });
  }

  Object.entries(checklistEventLabels)
    .filter(([key]) => key !== 'fuel_level')
    .forEach(([key, label]) => {
      const status = checklist[key];
      if (status === 'present' || status === 'absent') {
        const isMissingEquipment = ['spare_tire', 'triangle', 'jack', 'documents'].includes(key);
        const shouldCreateEvent = isMissingEquipment ? status === 'absent' : status === 'present';
        if (!shouldCreateEvent) return;

        events.push({
          type: 'checklist',
          label,
          detail: getChecklistStatusMeta(status).printMark,
          tone: isMissingEquipment ? 'warning' : 'danger'
        });
      }
    });

  return events;
};

export const deriveDiagnosticHistory = (order: Pick<ServiceOrder, 'tests'>): TechnicalHistoryEvent[] => {
  const events: TechnicalHistoryEvent[] = [];

  (order.tests || []).forEach((test) => {
    if (isTechnicalSymptomTest(test)) {
      parseTechnicalSymptomNotes(test.notes).forEach((symptom) => {
        events.push({
          type: 'symptom',
          label: 'Sintoma tecnico constatado',
          detail: symptom,
          tone: 'warning'
        });
      });
      return;
    }

    const summary = summarizeDiagnosticTest(test);
    const group = getDiagnosticStatusGroup(test.result);
    if (group === 'failed') {
      events.push({
        type: 'diagnostic',
        label: 'Falha encontrada',
        detail: summary.title,
        tone: 'danger'
      });
    } else if (group === 'approved') {
      events.push({
        type: 'diagnostic',
        label: 'Item testado e descartado',
        detail: summary.title,
        tone: 'success'
      });
    } else if (group === 'inconclusive') {
      events.push({
        type: 'diagnostic',
        label: 'Teste inconclusivo',
        detail: summary.title,
        tone: 'warning'
      });
    } else {
      events.push({
        type: 'diagnostic',
        label: 'Teste nao realizado',
        detail: `${summary.title} (${getDiagnosticStatusLabel(test.result)})`,
        tone: 'neutral'
      });
    }
  });

  return events;
};

export const deriveOrderTechnicalHistory = (order: ServiceOrder): TechnicalHistoryEvent[] => {
  const events: TechnicalHistoryEvent[] = [
    {
      type: 'order',
      label: 'O.S. criada',
      detail: order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'Data nao informada',
      tone: 'neutral'
    },
    {
      type: 'status',
      label: statusLabels[order.status],
      detail: order.status === 'completed' ? 'Servico finalizado.' : 'Status operacional atual.',
      tone: order.status === 'completed' ? 'success' : 'neutral'
    }
  ];

  events.push(...deriveChecklistHistory(order.checklist));
  events.push(...deriveDiagnosticHistory(order));

  if (order.note_id) {
    events.push({
      type: 'note',
      label: 'Nota gerada',
      detail: 'Existe nota vinculada a esta O.S.',
      tone: 'success'
    });
  }

  return events;
};

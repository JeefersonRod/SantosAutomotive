import { OrderTest } from '../types';

export type DiagnosticFieldType = 'text' | 'number' | 'select' | 'textarea';

export type DiagnosticResultStatus = 'aprovado' | 'reprovado' | 'inconclusivo' | 'nao_realizado';

export interface DiagnosticField {
  key: string;
  label: string;
  type: DiagnosticFieldType;
  unit?: string;
  placeholder?: string;
  options?: string[];
  reference?: string;
}

export interface DiagnosticTemplate {
  key: string;
  name: string;
  category: string;
  shortName: string;
  fields: DiagnosticField[];
}

export const DIAGNOSTIC_RESULT_OPTIONS: Array<{ value: DiagnosticResultStatus; label: string }> = [
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'inconclusivo', label: 'Inconclusivo' },
  { value: 'nao_realizado', label: 'Nao realizado' }
];

export const DIAGNOSTIC_TEMPLATES: DiagnosticTemplate[] = [
  {
    key: 'battery_charging',
    name: 'Bateria e sistema de carga',
    shortName: 'Bateria/Carga',
    category: 'Eletrica/Bateria',
    fields: [
      { key: 'battery_type', label: 'Tipo de bateria', type: 'select', options: ['comum', 'EFB', 'AGM'] },
      { key: 'visual_inspection', label: 'Inspecao visual da bateria', type: 'textarea', placeholder: 'Bornes, fixacao, vazamento, caixa, zinabre...' },
      { key: 'battery_voltage', label: 'Tensao da bateria', type: 'number', unit: 'V', reference: 'Esperado: 12,6V a 12,8V' },
      { key: 'cranking_drop', label: 'Queda durante partida', type: 'number', unit: 'V', reference: 'Minimo recomendado: 10,5V' },
      { key: 'scanner_voltage', label: 'Tensao processada no scanner', type: 'number', unit: 'V' },
      { key: 'alternator_charge', label: 'Carga do alternador', type: 'select', options: ['comum', 'pilotado'] },
      { key: 'cca_standard', label: 'CCA norma', type: 'text', placeholder: 'SAE, EN, DIN...' },
      { key: 'cca_value', label: 'CCA valor', type: 'number' },
      { key: 'soc', label: 'SOC', type: 'number', unit: '%', reference: 'Minimo: 70%' },
      { key: 'soh', label: 'SOH', type: 'number', unit: '%', reference: 'Minimo: 70%' },
      { key: 'resistance', label: 'Resistencia interna', type: 'number', unit: 'mOhm' },
      { key: 'negative_cable_ddp', label: 'DDP cabo negativo na partida', type: 'number', unit: 'mV', reference: 'Maximo: 300 mV' },
      { key: 'positive_cable_ddp', label: 'DDP cabo positivo na partida', type: 'number', unit: 'mV', reference: 'Maximo: 300 mV' },
      { key: 'cranking_current', label: 'Corrente de partida', type: 'number', unit: 'A' },
      { key: 'charging_current', label: 'Corrente de carga', type: 'number', unit: 'A' }
    ]
  },
  {
    key: 'fuel_af',
    name: 'Combustivel e A/F',
    shortName: 'Combustivel A/F',
    category: 'Combustivel/A/F',
    fields: [
      { key: 'fuel_type', label: 'Tipo de combustivel', type: 'select', options: ['alcool', 'gasolina', 'mistura'] },
      { key: 'scanner_af', label: 'Relacao A/F no scanner', type: 'text', placeholder: 'Ex: 13,2:1' },
      { key: 'reference_af', label: 'Referencia A/F', type: 'select', options: ['13,2:1', '9,0:1', 'outro'] },
      { key: 'fault_codes', label: 'Codigos de falha', type: 'textarea', placeholder: 'DTCs encontrados...' },
      { key: 'recall', label: 'Recall/verificacao tecnica', type: 'textarea' }
    ]
  },
  {
    key: 'fuel_supply',
    name: 'Alimentacao de combustivel',
    shortName: 'Alimentacao',
    category: 'Alimentacao',
    fields: [
      { key: 'pump_voltage', label: 'Alimentacao da bomba comum', type: 'number', unit: 'V' },
      { key: 'pump_pwm', label: 'Bomba pilotada ciclo PWM', type: 'number', unit: '%' },
      { key: 'pressure', label: 'Pressao', type: 'number', unit: 'BAR' },
      { key: 'flow', label: 'Vazao', type: 'number', unit: 'L/H' },
      { key: 'max_pressure', label: 'Pressao maxima', type: 'number', unit: 'BAR' },
      { key: 'tightness', label: 'Estanqueidade', type: 'select', options: ['sim', 'nao', 'nao verificado'] },
      { key: 'pump_current', label: 'Corrente da bomba', type: 'number', unit: 'A' },
      { key: 'injection_time', label: 'Tempo de injecao', type: 'number', unit: 'ms' },
      { key: 'injector_voltage', label: 'Alimentacao do injetor', type: 'number', unit: 'V' },
      { key: 'spray_pattern', label: 'Formato do leque do injetor', type: 'text' },
      { key: 'injector_resistance', label: 'Resistencia do injetor', type: 'text' },
      { key: 'canister_seal', label: 'Valvula canister vedacao', type: 'text' },
      { key: 'canister_pwm', label: 'Canister tensao/PWM', type: 'text' },
      { key: 'flange_inspection', label: 'Inspecao flange/resistencia', type: 'textarea' }
    ]
  },
  {
    key: 'map_maf_air_mass',
    name: 'MAP / MAF / Massa de ar',
    shortName: 'MAP/MAF',
    category: 'MAP/MAF',
    fields: [
      { key: 'sensor_type', label: 'Tipo', type: 'select', options: ['MAP', 'MAF analogico', 'MAF digital'] },
      { key: 'map_key_mbar', label: 'MAP chave ligada scanner', type: 'number', unit: 'mbar' },
      { key: 'map_key_volts', label: 'MAP chave ligada', type: 'number', unit: 'V' },
      { key: 'map_idle_mbar', label: 'MAP marcha lenta absoluta', type: 'number', unit: 'mbar' },
      { key: 'map_idle_volts', label: 'MAP marcha lenta', type: 'number', unit: 'V' },
      { key: 'map_accel_volts', label: 'MAP aceleracao variacao', type: 'number', unit: 'V' },
      { key: 'map_accel_mbar', label: 'MAP aceleracao', type: 'number', unit: 'mbar' },
      { key: 'barometric_pressure', label: 'Pressao barometrica local', type: 'number', unit: 'mbar' },
      { key: 'reading_table', label: 'Tabela de leitura', type: 'textarea', placeholder: 'Sensor / chave ligada / marcha lenta / aceleracao' }
    ]
  },
  {
    key: 'temperature_sensors',
    name: 'Sensores de temperatura',
    shortName: 'Temperaturas',
    category: 'Sensores',
    fields: [
      { key: 'ect_cold', label: 'Agua ECT frio', type: 'number', unit: 'C' },
      { key: 'ect_hot', label: 'Agua ECT quente', type: 'number', unit: 'C' },
      { key: 'iat_cold', label: 'Ar IAT frio', type: 'number', unit: 'C' },
      { key: 'iat_hot', label: 'Ar IAT quente', type: 'number', unit: 'C' },
      { key: 'external_cold', label: 'Sensor externo frio', type: 'number', unit: 'C' },
      { key: 'external_hot', label: 'Sensor externo quente', type: 'number', unit: 'C' },
      { key: 'fuel_cold', label: 'Combustivel frio', type: 'number', unit: 'C' },
      { key: 'fuel_hot', label: 'Combustivel quente', type: 'number', unit: 'C' },
      { key: 'cold_difference', label: 'Diferenca fase fria', type: 'number', unit: 'C', reference: 'Maximo recomendado: 3 C' }
    ]
  },
  {
    key: 'ckp_cmp',
    name: 'CKP / CMP',
    shortName: 'CKP/CMP',
    category: 'Sensores',
    fields: [
      { key: 'sensor', label: 'Sensor avaliado', type: 'select', options: ['CKP rotacao', 'CMP fase', 'CKP e CMP'] },
      { key: 'sensor_type', label: 'Tipo', type: 'select', options: ['indutivo', 'hall', 'magneto resistivo'] },
      { key: 'power_supply', label: 'Alimentacao', type: 'text' },
      { key: 'resistance', label: 'Resistencia', type: 'text' },
      { key: 'reference', label: 'Referencia', type: 'text' },
      { key: 'scanner_rpm', label: 'RPM scanner', type: 'number', unit: 'RPM' },
      { key: 'sync_notes', label: 'Sincronismo/observacao de sinal', type: 'textarea' }
    ]
  },
  {
    key: 'throttle_pedal_tbi',
    name: 'Sistema de aceleracao / Pedal / TBI',
    shortName: 'Pedal/TBI',
    category: 'Aceleracao/TBI',
    fields: [
      { key: 'track_1_power', label: 'Alimentacao pista 1', type: 'number', unit: 'V' },
      { key: 'track_2_power', label: 'Alimentacao pista 2', type: 'number', unit: 'V' },
      { key: 'track_1_ground', label: 'Massa pista 1', type: 'text' },
      { key: 'track_2_ground', label: 'Massa pista 2', type: 'text' },
      { key: 'track_1_signal', label: 'Sinal pista 1', type: 'number', unit: 'V' },
      { key: 'track_2_signal', label: 'Sinal pista 2', type: 'number', unit: 'V', reference: 'TBI: pista 1 + pista 2 proximo de 5V' },
      { key: 'ford_pwm', label: 'Sinal PWM Ford', type: 'number', unit: '%' },
      { key: 'pedal', label: 'Pedal do acelerador', type: 'textarea' },
      { key: 'tbi', label: 'Corpo de borboleta TBI', type: 'textarea' },
      { key: 'ecu_processing', label: 'UCE processa sinal', type: 'select', options: ['sim', 'nao'] },
      { key: 'coherence', label: 'Coerencia do pedal/TBI', type: 'textarea' }
    ]
  },
  {
    key: 'ignition_system',
    name: 'Sistema de ignicao',
    shortName: 'Ignicao',
    category: 'Ignicao',
    fields: [
      { key: 'primary_coil', label: 'Bobina primario', type: 'text' },
      { key: 'secondary_coil', label: 'Bobina secundario', type: 'text' },
      { key: 'power_supply', label: 'Alimentacao', type: 'number', unit: 'V' },
      { key: 'current', label: 'Corrente', type: 'number', unit: 'A' },
      { key: 'trigger_voltage', label: 'Tensao de disparo', type: 'text', placeholder: 'V/KV' },
      { key: 'charge_time', label: 'Tempo de carregamento', type: 'text' },
      { key: 'burn_time', label: 'Tempo de queima', type: 'text' },
      { key: 'residual', label: 'Residual', type: 'select', options: ['sim', 'nao'] },
      { key: 'pulse', label: 'Pulso', type: 'select', options: ['positivo', 'negativo'] },
      { key: 'spark_wire', label: 'Cabo de vela', type: 'text' },
      { key: 'st_terminal', label: 'ST supressor no terminal', type: 'text' },
      { key: 'sc_wire', label: 'SC supressor no cabo', type: 'text' },
      { key: 'resistance_reference', label: 'Referencia resistencia', type: 'text', placeholder: 'VW/Audi 6 kOhm; 2,5 a 7,5 kOhm' },
      { key: 'misfire', label: 'Falha de combustao', type: 'select', options: ['sim', 'nao'] },
      { key: 'cylinders', label: 'Cilindros P0301 a P0306', type: 'text' },
      { key: 'spark_plugs', label: 'Velas de ignicao', type: 'textarea', placeholder: 'Aplicacao, torque, flashing over, trincas, gap...' }
    ]
  },
  {
    key: 'lambda_sensor',
    name: 'Sonda lambda',
    shortName: 'Sonda lambda',
    category: 'Sonda Lambda',
    fields: [
      { key: 'identification', label: 'Identificacao correta', type: 'textarea', placeholder: 'Pre/pos, estreita/larga, finger, planar, X-Four, AF, 5/5, 5/6...' },
      { key: 'heater_pre', label: 'Aquecedor pre', type: 'textarea', placeholder: 'Resistencia, alimentacao, PWM/Hz, corrente...' },
      { key: 'heater_post', label: 'Aquecedor pos', type: 'textarea', placeholder: 'Resistencia, alimentacao, PWM/Hz, corrente...' },
      { key: 'calibration_resistance', label: 'Resistencia de calibracao', type: 'text' },
      { key: 'reference_voltage', label: 'Tensao de referencia', type: 'text' },
      { key: 'signal_negative', label: 'Negativo do sinal / quedas', type: 'text' },
      { key: 'voltage_response', label: 'Resposta em tensao', type: 'text' },
      { key: 'current_response', label: 'Resposta em corrente', type: 'text' },
      { key: 'stft', label: 'STFT positivo/negativo', type: 'text' },
      { key: 'ltft', label: 'LTFT positivo/negativo', type: 'text' },
      { key: 'obd_processing', label: 'Processamento scanner/OBD', type: 'textarea' }
    ]
  },
  {
    key: 'af_loss_causes',
    name: 'Causas provaveis de perda de A/F',
    shortName: 'Perda A/F',
    category: 'Causas provaveis',
    fields: [
      {
        key: 'selected_cause',
        label: 'Causa selecionada',
        type: 'select',
        options: [
          'problemas eletricos e bateria',
          'sensor de nivel / boia',
          'sonda lambda',
          'combustivel de ma qualidade',
          'entrada falsa de ar/vacuo',
          'sensores de temperatura',
          'injecao/bomba',
          'carter contaminado'
        ]
      },
      { key: 'evidence', label: 'Evidencia encontrada', type: 'textarea' },
      { key: 'recommended_action', label: 'Acao recomendada', type: 'textarea' }
    ]
  }
];

const GUIDED_PREFIX = 'Diagnostico guiado:';
const OBS_PREFIX = 'Observacoes:';

export const getDiagnosticTemplate = (templateKey?: string) =>
  DIAGNOSTIC_TEMPLATES.find((template) => template.key === templateKey);

export const getDiagnosticTemplateByName = (name?: string) =>
  DIAGNOSTIC_TEMPLATES.find((template) => template.name === name || template.shortName === name);

export const getDiagnosticStatusLabel = (status?: string) =>
  DIAGNOSTIC_RESULT_OPTIONS.find((option) => option.value === status)?.label || status || 'Nao informado';

export const getDiagnosticCategories = () =>
  Array.from(new Set(DIAGNOSTIC_TEMPLATES.map((template) => template.category)));

export const createEmptyDiagnosticValues = (template: DiagnosticTemplate) =>
  template.fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = '';
    return acc;
  }, {});

export const buildDiagnosticNotes = (
  template: DiagnosticTemplate,
  values: Record<string, string>,
  observations: string
) => {
  const lines = [
    `${GUIDED_PREFIX} ${template.name}`,
    ...template.fields
      .map((field) => {
        const value = String(values[field.key] || '').trim();
        return value ? `${field.label}: ${value}${field.unit ? ` ${field.unit}` : ''}` : '';
      })
      .filter(Boolean)
  ];

  const trimmedObservations = observations.trim();
  if (trimmedObservations) {
    lines.push(`${OBS_PREFIX} ${trimmedObservations}`);
  }

  return lines.join('\n');
};

export const parseDiagnosticNotes = (template: DiagnosticTemplate, notes?: string) => {
  const values = createEmptyDiagnosticValues(template);
  let observations = '';

  (notes || '').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(GUIDED_PREFIX)) return;

    if (trimmed.startsWith(OBS_PREFIX)) {
      observations = trimmed.slice(OBS_PREFIX.length).trim();
      return;
    }

    const separatorIndex = trimmed.indexOf(':');
    if (separatorIndex === -1) return;

    const label = trimmed.slice(0, separatorIndex).trim();
    const field = template.fields.find((item) => item.label === label);
    if (!field) return;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (field.unit && value.endsWith(` ${field.unit}`)) {
      value = value.slice(0, -field.unit.length).trim();
    }
    values[field.key] = value;
  });

  return { values, observations };
};

export const isGuidedDiagnosticTest = (test: Pick<OrderTest, 'component_name' | 'notes'>) =>
  Boolean(getDiagnosticTemplateByName(test.component_name)) || Boolean(test.notes?.startsWith(GUIDED_PREFIX));

export const summarizeDiagnosticTest = (test: OrderTest) => {
  const template = getDiagnosticTemplateByName(test.component_name);
  if (!template) {
    return {
      title: test.component_name,
      status: getDiagnosticStatusLabel(test.result),
      lines: test.notes ? [test.notes] : []
    };
  }

  const parsed = parseDiagnosticNotes(template, test.notes);
  const lines = template.fields
    .map((field) => {
      const value = parsed.values[field.key];
      return value ? `${field.label}: ${value}${field.unit ? ` ${field.unit}` : ''}` : '';
    })
    .filter(Boolean);

  if (parsed.observations) {
    lines.push(`Observacoes: ${parsed.observations}`);
  }

  return {
    title: template.name,
    category: template.category,
    status: getDiagnosticStatusLabel(test.result),
    lines
  };
};

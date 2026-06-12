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
  system: string;
  component: string;
  shortName: string;
  aliases?: string[];
  relatedSystems?: string[];
  relatedComponents?: string[];
  possibleDtcs?: string[];
  fields: DiagnosticField[];
}

export const DIAGNOSTIC_RESULT_OPTIONS: Array<{ value: DiagnosticResultStatus; label: string }> = [
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
  { value: 'inconclusivo', label: 'Inconclusivo' },
  { value: 'nao_realizado', label: 'Nao realizado' }
];

export const TECHNICAL_SYMPTOM_TEST_NAME = 'Sintomas tecnicos constatados';

export const TECHNICAL_SYMPTOM_OPTIONS = [
  'Nao liga / nao da partida',
  'Liga e morre',
  'Demora para pegar',
  'Falha / engasga',
  'Marcha lenta irregular',
  'Perda de potencia',
  'Consumo alto',
  'Luz de injecao acesa',
  'Luz de bateria acesa',
  'Superaquecimento',
  'Fumaca',
  'Cheiro de combustivel',
  'Vazamento',
  'Barulho anormal',
  'Vibracao',
  'Bateria descarregando',
  'Ar-condicionado nao gela',
  'Intermitente',
  'Revisao preventiva / sem queixa'
] as const;

const TEST_CONDITION_FIELDS: DiagnosticField[] = [
  {
    key: 'test_condition',
    label: 'Condicao do teste',
    type: 'select',
    options: ['chave ligada', 'marcha lenta', 'RPM informado']
  },
  { key: 'rpm', label: 'RPM informado', type: 'number', unit: 'RPM', placeholder: 'Preencher quando a condicao for RPM informado' }
];

const PANEL_LIGHT_FIELDS: DiagnosticField[] = [
  {
    key: 'panel_lights',
    label: 'Luzes de painel como evidencia tecnica',
    type: 'select',
    options: ['injecao', 'ABS', 'airbag', 'EPS', 'bateria', 'temperatura', 'outras', 'nenhuma']
  },
  { key: 'panel_light_notes', label: 'Observacao das luzes de painel', type: 'textarea' }
];

const withCondition = (fields: DiagnosticField[]) => [...TEST_CONDITION_FIELDS, ...fields];

export const DIAGNOSTIC_TEMPLATES: DiagnosticTemplate[] = [
  {
    key: 'electrical_power_supply',
    name: 'Sistema eletrico e alimentacao',
    shortName: 'Eletrico base',
    category: 'Sistema Eletrico e Alimentacao',
    system: 'Sistema Eletrico e Alimentacao',
    component: 'Bateria, alternador, aterramentos e cabos',
    aliases: ['Bateria e sistema de carga'],
    relatedSystems: ['partida e carga', 'alimentacao ECU'],
    relatedComponents: ['bateria', 'alternador', 'aterramentos', 'cabos', 'alimentacao ECU'],
    fields: [
      ...PANEL_LIGHT_FIELDS,
      { key: 'battery_rest_voltage', label: 'Tensao em repouso', type: 'number', unit: 'V', reference: 'Esperado: 12,6V a 12,8V' },
      { key: 'cranking_voltage', label: 'Tensao durante partida', type: 'number', unit: 'V', reference: 'Minimo recomendado: 10,5V' },
      { key: 'charging_voltage', label: 'Tensao de carga', type: 'number', unit: 'V' },
      { key: 'voltage_drop', label: 'Queda de tensao', type: 'number', unit: 'mV' },
      { key: 'current', label: 'Corrente medida', type: 'number', unit: 'A' },
      { key: 'ground_notes', label: 'Aterramentos e cabos', type: 'textarea', placeholder: 'Bornes, zinabre, aperto, oxidacao, cabo positivo/negativo...' },
      { key: 'ecu_power_notes', label: 'Alimentacao ECU', type: 'textarea' },
      { key: 'technical_notes', label: 'Observacoes do sistema eletrico', type: 'textarea' }
    ]
  },
  {
    key: 'fuel_low_pressure',
    name: 'Alimentacao de combustivel - baixa pressao',
    shortName: 'Baixa pressao',
    category: 'Sistema de Alimentacao de Combustivel',
    system: 'Sistema de Alimentacao de Combustivel',
    component: 'Bomba baixa, filtro e linha',
    aliases: ['Alimentacao de combustivel'],
    relatedComponents: ['bomba baixa', 'filtro combustivel', 'linha de combustivel'],
    possibleDtcs: ['P0087'],
    fields: withCondition([
      { key: 'pump_voltage', label: 'Alimentacao da bomba baixa', type: 'number', unit: 'V' },
      { key: 'pump_pwm', label: 'Comando/PWM da bomba', type: 'number', unit: '%' },
      { key: 'low_pressure', label: 'Pressao de baixa', type: 'number', unit: 'BAR' },
      { key: 'flow', label: 'Vazao', type: 'number', unit: 'L/H' },
      { key: 'filter_condition', label: 'Filtro combustivel', type: 'select', options: ['ok', 'restrito', 'contaminado', 'nao verificado'] },
      { key: 'tightness', label: 'Estanqueidade', type: 'select', options: ['sim', 'nao', 'nao verificado'] },
      { key: 'notes', label: 'Observacoes', type: 'textarea' }
    ])
  },
  {
    key: 'fuel_high_pressure',
    name: 'Alimentacao de combustivel - alta pressao',
    shortName: 'Alta pressao',
    category: 'Sistema de Alimentacao de Combustivel',
    system: 'Sistema de Alimentacao de Combustivel',
    component: 'Bomba alta, rail, sensor e regulador',
    relatedComponents: ['bomba alta', 'rail', 'sensor pressao rail', 'regulador'],
    possibleDtcs: ['P0087', 'P0190', 'P0191'],
    fields: withCondition([
      { key: 'rail_pressure_target', label: 'Pressao rail desejada', type: 'number', unit: 'BAR' },
      { key: 'rail_pressure_actual', label: 'Pressao rail medida', type: 'number', unit: 'BAR' },
      { key: 'rail_sensor_signal', label: 'Sinal sensor pressao rail', type: 'number', unit: 'V' },
      { key: 'regulator_command', label: 'Comando regulador', type: 'text', placeholder: 'PWM, corrente, duty...' },
      { key: 'leak_return', label: 'Retorno/vazamento dos injetores', type: 'textarea' },
      { key: 'notes', label: 'Observacoes', type: 'textarea' }
    ])
  },
  {
    key: 'fuel_injectors',
    name: 'Injetores de combustivel',
    shortName: 'Injetores',
    category: 'Sistema de Alimentacao de Combustivel',
    system: 'Sistema de Alimentacao de Combustivel',
    component: 'Injetores',
    relatedComponents: ['injetores'],
    fields: withCondition([
      { key: 'injection_time', label: 'Tempo de injecao', type: 'number', unit: 'ms' },
      { key: 'injector_voltage', label: 'Alimentacao do injetor', type: 'number', unit: 'V' },
      { key: 'injector_resistance', label: 'Resistencia do injetor', type: 'text' },
      { key: 'spray_pattern', label: 'Padrao de pulverizacao/leque', type: 'text' },
      { key: 'balance_test', label: 'Teste de balanceamento/retorno', type: 'textarea' },
      { key: 'notes', label: 'Observacoes', type: 'textarea' }
    ])
  },
  {
    key: 'air_map',
    name: 'Admissao - MAP',
    shortName: 'MAP',
    category: 'Sistema de Admissao',
    system: 'Sistema de Admissao',
    component: 'MAP',
    aliases: ['MAP / MAF / Massa de ar'],
    relatedComponents: ['MAP'],
    possibleDtcs: ['P0106'],
    fields: withCondition([
      { key: 'map_key_mbar', label: 'MAP chave ligada scanner', type: 'number', unit: 'mbar' },
      { key: 'map_key_volts', label: 'MAP chave ligada', type: 'number', unit: 'V' },
      { key: 'map_idle_mbar', label: 'MAP marcha lenta absoluta', type: 'number', unit: 'mbar' },
      { key: 'map_idle_volts', label: 'MAP marcha lenta', type: 'number', unit: 'V' },
      { key: 'map_accel_volts', label: 'MAP aceleracao variacao', type: 'number', unit: 'V' },
      { key: 'barometric_pressure', label: 'Pressao barometrica local', type: 'number', unit: 'mbar' },
      { key: 'notes', label: 'Observacoes', type: 'textarea' }
    ])
  },
  {
    key: 'air_maf_iat',
    name: 'Admissao - MAF e IAT',
    shortName: 'MAF/IAT',
    category: 'Sistema de Admissao',
    system: 'Sistema de Admissao',
    component: 'MAF e IAT',
    aliases: ['Sensores de temperatura'],
    relatedComponents: ['MAF', 'IAT'],
    possibleDtcs: ['P0101', 'P0110'],
    fields: withCondition([
      { key: 'maf_type', label: 'Tipo MAF', type: 'select', options: ['analogico', 'digital', 'nao aplicado'] },
      { key: 'maf_reading', label: 'Leitura MAF', type: 'text', placeholder: 'g/s, kg/h, Hz ou V' },
      { key: 'iat_cold', label: 'IAT frio', type: 'number', unit: 'C' },
      { key: 'iat_hot', label: 'IAT quente', type: 'number', unit: 'C' },
      { key: 'cold_difference', label: 'Diferenca fase fria', type: 'number', unit: 'C', reference: 'Maximo recomendado: 3 C' },
      { key: 'notes', label: 'Observacoes', type: 'textarea' }
    ])
  },
  {
    key: 'air_leaks_filter',
    name: 'Admissao - filtro, mangueiras e vazamentos',
    shortName: 'Vazamentos ar',
    category: 'Sistema de Admissao',
    system: 'Sistema de Admissao',
    component: 'Filtro de ar, mangueiras, vazamentos e coletor',
    relatedComponents: ['filtro de ar', 'mangueiras', 'vazamentos', 'coletor'],
    fields: withCondition([
      { key: 'air_filter_condition', label: 'Filtro de ar', type: 'select', options: ['ok', 'sujo', 'restrito', 'ausente', 'nao verificado'] },
      { key: 'hoses_condition', label: 'Mangueiras/admissao', type: 'select', options: ['ok', 'ressecadas', 'soltas', 'trincadas', 'nao verificado'] },
      { key: 'leak_test', label: 'Teste de vazamento/entrada falsa', type: 'textarea' },
      { key: 'manifold_notes', label: 'Coletor', type: 'textarea' }
    ])
  },
  {
    key: 'cooling_system',
    name: 'Sistema de arrefecimento',
    shortName: 'Arrefecimento',
    category: 'Sistema de Arrefecimento',
    system: 'Sistema de Arrefecimento',
    component: 'ECT, valvula, ventoinha, bomba e fluido',
    aliases: ['Sensores de temperatura'],
    relatedComponents: ['ECT', 'valvula termostatica', 'ventoinha', "bomba d'agua", 'reservatorio', 'pressao do sistema', 'tipo do fluido'],
    fields: withCondition([
      { key: 'ect_cold', label: 'ECT frio', type: 'number', unit: 'C' },
      { key: 'ect_hot', label: 'ECT quente', type: 'number', unit: 'C' },
      { key: 'fan_activation', label: 'Acionamento da ventoinha', type: 'text' },
      { key: 'thermostatic_valve', label: 'Valvula termostatica', type: 'select', options: ['ok', 'travada aberta', 'travada fechada', 'nao verificada'] },
      { key: 'system_pressure', label: 'Pressao do sistema', type: 'number', unit: 'BAR' },
      { key: 'fluid_type', label: 'Tipo/condicao do fluido', type: 'text' },
      { key: 'reservoir_notes', label: 'Reservatorio e vazamentos', type: 'textarea' }
    ])
  },
  {
    key: 'ckp_sensor',
    name: 'CKP - sensor de rotacao',
    shortName: 'CKP',
    category: 'Sistema CKP/CMP e Sincronismo',
    system: 'Sistema CKP/CMP e Sincronismo',
    component: 'CKP',
    aliases: ['CKP / CMP'],
    relatedComponents: ['CKP', 'roda fonica'],
    possibleDtcs: ['P0335'],
    fields: withCondition([
      { key: 'sensor_type', label: 'Tipo CKP', type: 'select', options: ['indutivo', 'hall', 'magneto resistivo'] },
      { key: 'power_supply', label: 'Alimentacao', type: 'text' },
      { key: 'resistance', label: 'Resistencia', type: 'text' },
      { key: 'scanner_rpm', label: 'RPM scanner', type: 'number', unit: 'RPM' },
      { key: 'signal_notes', label: 'Sinal e roda fonica', type: 'textarea' }
    ])
  },
  {
    key: 'cmp_sensor',
    name: 'CMP - sensor de fase',
    shortName: 'CMP',
    category: 'Sistema CKP/CMP e Sincronismo',
    system: 'Sistema CKP/CMP e Sincronismo',
    component: 'CMP',
    aliases: ['CKP / CMP'],
    relatedComponents: ['CMP', 'sincronismo'],
    possibleDtcs: ['P0340'],
    fields: withCondition([
      { key: 'sensor_type', label: 'Tipo CMP', type: 'select', options: ['indutivo', 'hall', 'magneto resistivo'] },
      { key: 'power_supply', label: 'Alimentacao', type: 'text' },
      { key: 'reference', label: 'Referencia', type: 'text' },
      { key: 'phase_signal', label: 'Sinal de fase', type: 'textarea' },
      { key: 'sync_notes', label: 'Sincronismo CKP/CMP', type: 'textarea' }
    ])
  },
  {
    key: 'pedal_app',
    name: 'Pedal APP',
    shortName: 'Pedal APP',
    category: 'Sistema Pedal / TBI',
    system: 'Sistema Pedal / TBI',
    component: 'APP (pedal)',
    aliases: ['Sistema de aceleracao / Pedal / TBI'],
    relatedComponents: ['APP', 'pedal'],
    fields: withCondition([
      { key: 'track_1_power', label: 'Alimentacao pista 1', type: 'number', unit: 'V' },
      { key: 'track_2_power', label: 'Alimentacao pista 2', type: 'number', unit: 'V' },
      { key: 'track_1_signal', label: 'Sinal pista 1', type: 'number', unit: 'V' },
      { key: 'track_2_signal', label: 'Sinal pista 2', type: 'number', unit: 'V' },
      { key: 'pedal_coherence', label: 'Coerencia do pedal', type: 'textarea' }
    ])
  },
  {
    key: 'tbi_throttle',
    name: 'TBI - corpo de borboleta',
    shortName: 'TBI',
    category: 'Sistema Pedal / TBI',
    system: 'Sistema Pedal / TBI',
    component: 'TPS, corpo de borboleta e motor eletronico',
    aliases: ['Sistema de aceleracao / Pedal / TBI'],
    relatedComponents: ['TPS', 'corpo de borboleta', 'motor do corpo eletronico'],
    fields: withCondition([
      { key: 'tps_1_signal', label: 'Sinal TPS 1', type: 'number', unit: 'V' },
      { key: 'tps_2_signal', label: 'Sinal TPS 2', type: 'number', unit: 'V', reference: 'Soma das pistas proxima de 5V quando aplicavel' },
      { key: 'motor_command', label: 'Comando do motor TBI', type: 'text' },
      { key: 'tbi_cleaning_condition', label: 'Condicao mecanica/carbonizacao', type: 'textarea' },
      { key: 'ecu_processing', label: 'ECU processa sinal', type: 'select', options: ['sim', 'nao', 'inconclusivo'] }
    ])
  },
  {
    key: 'ignition_system',
    name: 'Sistema de ignicao',
    shortName: 'Ignicao',
    category: 'Sistema de Ignicao',
    system: 'Sistema de Ignicao',
    component: 'Bobinas, velas, cabos e misfire',
    relatedComponents: ['bobinas', 'velas', 'cabos', 'misfire'],
    fields: withCondition([
      { key: 'primary_coil', label: 'Bobina primario', type: 'text' },
      { key: 'secondary_coil', label: 'Bobina secundario', type: 'text' },
      { key: 'power_supply', label: 'Alimentacao', type: 'number', unit: 'V' },
      { key: 'current', label: 'Corrente', type: 'number', unit: 'A' },
      { key: 'burn_time', label: 'Tempo de queima', type: 'text' },
      { key: 'spark_wire', label: 'Cabos', type: 'text' },
      { key: 'spark_plugs', label: 'Velas', type: 'textarea', placeholder: 'Aplicacao, torque, trincas, gap...' },
      { key: 'misfire', label: 'Misfire/falha de combustao', type: 'select', options: ['sim', 'nao', 'inconclusivo'] },
      { key: 'cylinders', label: 'Cilindros envolvidos', type: 'text' }
    ])
  },
  {
    key: 'emissions_lambda',
    name: 'Emissoes - sonda lambda',
    shortName: 'Sonda lambda',
    category: 'Sistema de Emissoes',
    system: 'Sistema de Emissoes',
    component: 'Sonda lambda e aquecedor',
    aliases: ['Sonda lambda'],
    relatedComponents: ['sonda lambda', 'aquecedor da sonda'],
    fields: withCondition([
      { key: 'identification', label: 'Identificacao correta', type: 'textarea', placeholder: 'Pre/pos, estreita/larga, planar, AF...' },
      { key: 'heater_pre', label: 'Aquecedor pre', type: 'textarea', placeholder: 'Resistencia, alimentacao, PWM/Hz, corrente...' },
      { key: 'heater_post', label: 'Aquecedor pos', type: 'textarea' },
      { key: 'reference_voltage', label: 'Tensao de referencia', type: 'text' },
      { key: 'voltage_response', label: 'Resposta em tensao', type: 'text' },
      { key: 'current_response', label: 'Resposta em corrente', type: 'text' },
      { key: 'stft', label: 'STFT', type: 'text' },
      { key: 'ltft', label: 'LTFT', type: 'text' },
      { key: 'obd_processing', label: 'Processamento scanner/OBD', type: 'textarea' }
    ])
  },
  {
    key: 'emissions_egr_catalyst_canister',
    name: 'Emissoes - EGR, catalisador e canister',
    shortName: 'EGR/Cat/Canister',
    category: 'Sistema de Emissoes',
    system: 'Sistema de Emissoes',
    component: 'EGR, catalisador e canister',
    aliases: ['Causas provaveis de perda de A/F', 'Combustivel e A/F'],
    relatedComponents: ['EGR', 'catalisador', 'canister'],
    possibleDtcs: ['P0401'],
    fields: withCondition([
      { key: 'egr_condition', label: 'EGR', type: 'select', options: ['ok', 'travada aberta', 'travada fechada', 'restrita', 'nao verificada'] },
      { key: 'catalyst_condition', label: 'Catalisador', type: 'textarea' },
      { key: 'canister_seal', label: 'Canister vedacao', type: 'text' },
      { key: 'canister_pwm', label: 'Canister tensao/PWM', type: 'text' },
      { key: 'af_evidence', label: 'Evidencia de perda de A/F', type: 'textarea' },
      { key: 'recommended_action', label: 'Acao recomendada', type: 'textarea' }
    ])
  },
  {
    key: 'electrical_communication',
    name: 'Sistema eletrico e comunicacao',
    shortName: 'Comunicacao',
    category: 'Sistema Eletrico e Comunicacao',
    system: 'Sistema Eletrico e Comunicacao',
    component: 'Rede CAN, modulos e ECU',
    relatedComponents: ['rede CAN', 'modulos', 'ECU', 'alimentacao dos modulos'],
    fields: [
      ...PANEL_LIGHT_FIELDS,
      { key: 'module_power', label: 'Alimentacao dos modulos', type: 'text' },
      { key: 'module_ground', label: 'Aterramento dos modulos', type: 'text' },
      { key: 'can_high', label: 'CAN High', type: 'text' },
      { key: 'can_low', label: 'CAN Low', type: 'text' },
      { key: 'network_resistance', label: 'Resistencia da rede', type: 'text' },
      { key: 'scanner_communication', label: 'Comunicacao com scanner', type: 'select', options: ['normal', 'intermitente', 'sem comunicacao'] },
      { key: 'module_notes', label: 'Modulos/ECU', type: 'textarea' }
    ]
  }
];
const GUIDED_PREFIX = 'Diagnostico guiado:';
const OBS_PREFIX = 'Observacoes:';

export const getDiagnosticTemplate = (templateKey?: string) =>
  DIAGNOSTIC_TEMPLATES.find((template) => template.key === templateKey);

export const getDiagnosticTemplateByName = (name?: string) =>
  DIAGNOSTIC_TEMPLATES.find((template) =>
    template.name === name ||
    template.shortName === name ||
    Boolean(name && template.aliases?.includes(name))
  );

export const getDiagnosticStatusLabel = (status?: string) =>
  DIAGNOSTIC_RESULT_OPTIONS.find((option) => option.value === status)?.label || status || 'Nao informado';

export const getDiagnosticStatusGroup = (status?: string) => {
  if (status === 'reprovado') return 'failed';
  if (status === 'aprovado') return 'approved';
  if (status === 'nao_realizado') return 'not_done';
  return 'inconclusive';
};

export const getDiagnosticCategories = () =>
  Array.from(new Set(DIAGNOSTIC_TEMPLATES.map((template) => template.system)));

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

export const isTechnicalSymptomTest = (test: Pick<OrderTest, 'component_name'>) =>
  test.component_name === TECHNICAL_SYMPTOM_TEST_NAME;

export const buildTechnicalSymptomNotes = (symptoms: string[]) =>
  symptoms.length ? symptoms.map((symptom) => `Sintoma: ${symptom}`).join('\n') : '';

export const parseTechnicalSymptomNotes = (notes?: string) =>
  (notes || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^Sintoma:\s*/i, '').trim())
    .filter(Boolean);

export const summarizeDiagnosticTest = (test: OrderTest) => {
  const template = getDiagnosticTemplateByName(test.component_name);
  if (!template) {
    return {
      title: test.component_name,
      system: 'Teste livre',
      component: test.component_name,
      status: getDiagnosticStatusLabel(test.result),
      lines: test.notes ? [test.notes] : []
    };
  }

  const parsed = parseDiagnosticNotes(template, test.notes);
  let lines = template.fields
    .map((field) => {
      const value = parsed.values[field.key];
      return value ? `${field.label}: ${value}${field.unit ? ` ${field.unit}` : ''}` : '';
    })
    .filter(Boolean);

  if (lines.length === 0 && test.notes) {
    lines = test.notes
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith(GUIDED_PREFIX));
  }

  if (parsed.observations) {
    lines.push(`Observacoes: ${parsed.observations}`);
  }

  return {
    title: template.name,
    system: template.system,
    component: template.component,
    category: template.category,
    status: getDiagnosticStatusLabel(test.result),
    lines
  };
};

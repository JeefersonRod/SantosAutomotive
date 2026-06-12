export const CUSTOM_OPTION = '__custom__';
export const NO_VERSION_OPTION = '__no_version__';

export interface VehicleModelOption {
  name: string;
  versions?: string[];
  engines?: string[];
}

export interface VehicleMakeOption {
  make: string;
  models: VehicleModelOption[];
}

export const FUEL_OPTIONS = [
  'Diesel',
  'Flex',
  'Gasolina',
  'Etanol',
  'GNV',
  'Hibrido',
  'Eletrico'
] as const;

export const COMMON_DIESEL_ENGINES = [
  '2.0 Turbo Diesel',
  '2.2 Diesel',
  '2.3 Diesel',
  '2.4 Diesel',
  '2.5 Diesel',
  '2.7 Diesel',
  '2.8 Diesel',
  '2.8 JTD',
  '3.0 Diesel',
  '3.2 Diesel',
  '2.5 TDI'
] as const;

export const VEHICLE_CATALOG: VehicleMakeOption[] = [
  { make: 'Toyota', models: [{ name: 'Hilux', engines: ['2.4 Diesel', '2.8 Diesel', '3.0 Diesel'] }] },
  { make: 'Ford', models: [{ name: 'Ranger', engines: ['2.2 Diesel', '3.0 Diesel', '3.2 Diesel'] }] },
  { make: 'Chevrolet', models: [{ name: 'S10', engines: ['2.4 Flex', '2.5 Flex', '2.8 Diesel'] }] },
  {
    make: 'Mitsubishi',
    models: [
      {
        name: 'L200',
        versions: ['GL', 'GLS', 'HPE', 'Triton', 'Outdoor', 'Savana'],
        engines: ['2.5 Diesel', '3.2 Diesel', '2.4 Diesel']
      }
    ]
  },
  { make: 'Nissan', models: [{ name: 'Frontier', engines: ['2.3 Diesel', '2.5 Diesel'] }] },
  { make: 'Volkswagen', models: [{ name: 'Amarok', engines: ['2.0 Turbo Diesel', '3.0 Diesel'] }] },
  { make: 'Mercedes', models: [{ name: 'Sprinter', engines: ['2.2 Diesel', '2.1 Diesel'] }] },
  { make: 'Iveco', models: [{ name: 'Daily', engines: ['2.3 Diesel', '3.0 Diesel', '2.8 JTD'] }] },
  { make: 'Renault', models: [{ name: 'Master', engines: ['2.3 Diesel', '2.5 Diesel'] }] },
  { make: 'Fiat', models: [{ name: 'Ducato', engines: ['2.3 Diesel', '2.8 JTD'] }] },
  { make: 'Peugeot', models: [{ name: 'Boxer', engines: ['2.3 Diesel', '2.8 Diesel'] }] },
  { make: 'Citroen', models: [{ name: 'Jumper', engines: ['2.3 Diesel', '2.8 Diesel'] }] },
  { make: 'Hyundai', models: [{ name: 'HR', engines: ['2.5 Diesel'] }] },
  { make: 'Kia', models: [{ name: 'Bongo', engines: ['2.5 Diesel'] }] }
];

export const getMakeOptions = () => VEHICLE_CATALOG.map((item) => item.make);

export const getModelsForMake = (make?: string) =>
  VEHICLE_CATALOG.find((item) => item.make === make)?.models || [];

export const getModelOption = (make?: string, model?: string) =>
  getModelsForMake(make).find((item) => item.name === model);

export const getVersionsForModel = (make?: string, model?: string) =>
  getModelOption(make, model)?.versions || [];

export const getEnginesForModel = (make?: string, model?: string) => {
  const modelEngines = getModelOption(make, model)?.engines || [];
  return Array.from(new Set([...modelEngines, ...COMMON_DIESEL_ENGINES]));
};

export const getYearOptions = () => {
  const nextYear = new Date().getFullYear() + 1;
  const years: number[] = [];
  for (let year = nextYear; year >= 1980; year -= 1) {
    years.push(year);
  }
  return years;
};

export const normalizeVehicleText = (value: string) =>
  value.trim().replace(/\s+/g, ' ');

export const normalizePlate = (value: string) =>
  value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

export const formatPlateForDisplay = (value: string) => {
  const normalized = normalizePlate(value);
  if (/^[A-Z]{3}[0-9]{4}$/.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  }
  return normalized;
};

export const composeModelWithVersion = (model: string, version?: string) => {
  const cleanModel = normalizeVehicleText(model);
  const cleanVersion = normalizeVehicleText(version || '');
  if (!cleanVersion || cleanVersion === NO_VERSION_OPTION) return cleanModel;
  return `${cleanModel} ${cleanVersion}`;
};

export const parseModelWithVersion = (make: string, savedModel: string) => {
  const models = getModelsForMake(make);
  const cleanSavedModel = normalizeVehicleText(savedModel);

  for (const model of models) {
    if (cleanSavedModel === model.name) {
      return { model: model.name, version: NO_VERSION_OPTION };
    }

    const prefix = `${model.name} `;
    if (cleanSavedModel.startsWith(prefix)) {
      const version = cleanSavedModel.slice(prefix.length).trim();
      if (model.versions?.includes(version)) {
        return { model: model.name, version };
      }
    }
  }

  return { model: cleanSavedModel, version: NO_VERSION_OPTION };
};

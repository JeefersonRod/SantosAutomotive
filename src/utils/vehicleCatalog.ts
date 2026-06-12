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

export const COMMON_ENGINE_DISPLACEMENTS = [
  '1.0',
  '1.3',
  '1.4',
  '1.5',
  '1.6',
  '1.8',
  '2.0',
  '2.2',
  '2.3',
  '2.4',
  '2.5',
  '2.7',
  '2.8',
  '3.0',
  '3.2'
] as const;

export const VEHICLE_CATALOG: VehicleMakeOption[] = [
  {
    make: 'Toyota',
    models: [
      { name: 'Hilux', engines: ['2.4', '2.8', '3.0'] },
      { name: 'SW4', engines: ['2.7', '2.8', '3.0'] }
    ]
  },
  { make: 'Ford', models: [{ name: 'Ranger', engines: ['2.2', '3.0', '3.2'] }] },
  {
    make: 'Chevrolet',
    models: [
      { name: 'S10', engines: ['2.4', '2.5', '2.8'] },
      { name: 'Trailblazer', engines: ['2.8', '3.6'] }
    ]
  },
  {
    make: 'Mitsubishi',
    models: [
      {
        name: 'L200',
        versions: ['GL', 'GLS', 'HPE', 'Triton', 'Outdoor', 'Savana'],
        engines: ['2.4', '2.5', '3.2']
      },
      { name: 'Pajero Dakar', engines: ['3.2'] },
      { name: 'Pajero Full', engines: ['3.2', '3.8'] },
      { name: 'Pajero Sport', engines: ['2.4', '2.5', '3.0'] }
    ]
  },
  {
    make: 'Nissan',
    models: [
      { name: 'Frontier', engines: ['2.3', '2.5'] },
      { name: 'X-Trail', engines: ['2.0', '2.5'] }
    ]
  },
  { make: 'Volkswagen', models: [{ name: 'Amarok', engines: ['2.0', '3.0'] }] },
  { make: 'Mercedes', models: [{ name: 'Sprinter', engines: ['2.1', '2.2'] }] },
  { make: 'Iveco', models: [{ name: 'Daily', engines: ['2.3', '2.8', '3.0'] }] },
  { make: 'Renault', models: [{ name: 'Master', engines: ['2.3', '2.5'] }] },
  {
    make: 'Fiat',
    models: [
      { name: 'Ducato', engines: ['2.3', '2.8'] },
      { name: 'Toro', engines: ['1.3', '1.8', '2.0'] }
    ]
  },
  { make: 'Peugeot', models: [{ name: 'Boxer', engines: ['2.3', '2.8'] }] },
  { make: 'Citroen', models: [{ name: 'Jumper', engines: ['2.3', '2.8'] }] },
  { make: 'Hyundai', models: [{ name: 'HR', engines: ['2.5'] }] },
  { make: 'Kia', models: [{ name: 'Bongo', engines: ['2.5'] }] },
  {
    make: 'Jeep',
    models: [
      { name: 'Renegade', engines: ['1.3', '1.8', '2.0'] },
      { name: 'Compass', engines: ['1.3', '2.0'] },
      { name: 'Commander', engines: ['1.3', '2.0'] }
    ]
  },
  {
    make: 'Ram',
    models: [
      { name: 'Rampage', engines: ['2.0'] },
      { name: '1500', engines: ['3.0', '5.7'] },
      { name: '2500', engines: ['5.7', '6.7'] }
    ]
  },
  {
    make: 'Dodge',
    models: [
      { name: 'RAM', engines: ['5.2', '5.9', '6.7'] }
    ]
  }
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
  return Array.from(new Set([...modelEngines, ...COMMON_ENGINE_DISPLACEMENTS]));
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

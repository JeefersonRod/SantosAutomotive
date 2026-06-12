import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, Car, User, Hash, X, Camera, Fuel, Gauge, Calendar, Palette, Wand2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IMaskInput } from 'react-imask';
import { toast } from 'sonner';
import { Vehicle, Client } from '../types';
import ImageUpload from './ImageUpload';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { clientService, vehicleService } from '../services';
import { SearchableSelect } from './ui';
import {
  CUSTOM_OPTION,
  FUEL_OPTIONS,
  NO_VERSION_OPTION,
  composeModelWithVersion,
  formatPlateForDisplay,
  getEnginesForModel,
  getMakeOptions,
  getModelsForMake,
  getVersionsForModel,
  getYearOptions,
  normalizePlate,
  normalizeVehicleText,
  parseModelWithVersion
} from '../utils/vehicleCatalog';

export default function VehiclesTab() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [fuelFilter, setFuelFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleVersion, setVehicleVersion] = useState(NO_VERSION_OPTION);
  const [customMake, setCustomMake] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customVersion, setCustomVersion] = useState('');
  const [customEngine, setCustomEngine] = useState('');
  const [formData, setFormData] = useState({
    client_id: 0,
    make: '',
    model: '',
    year: new Date().getFullYear(),
    plate: '',
    color: '',
    vin: '',
    engine: '',
    fuel: '',
    hp: '',
    image_url: ''
  });
  const makeOptions = getMakeOptions();
  const modelOptions = getModelsForMake(formData.make);
  const versionOptions = getVersionsForModel(formData.make, formData.model);
  const engineOptions = getEnginesForModel(formData.make, formData.model);
  const yearOptions = getYearOptions();
  const formYearOptions = Array.from(new Set([...yearOptions, formData.year].filter(Boolean))).sort((a, b) => Number(a) - Number(b));
  const formFuelOptions = Array.from(new Set([...FUEL_OPTIONS, formData.fuel].filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  const makeSelectOptions = [
    ...makeOptions.map((make) => ({ value: make, label: make })),
    { value: CUSTOM_OPTION, label: 'Outra marca' }
  ];
  const modelSelectOptions = [
    ...modelOptions.map((model) => ({ value: model.name, label: model.name })),
    { value: CUSTOM_OPTION, label: 'Outro modelo' }
  ];
  const versionSelectOptions = [
    { value: NO_VERSION_OPTION, label: 'Nao informado' },
    ...versionOptions.map((version) => ({ value: version, label: version })),
    { value: CUSTOM_OPTION, label: 'Personalizada' }
  ];
  const yearSelectOptions = formYearOptions.map((year) => ({ value: String(year), label: String(year) }));
  const fuelSelectOptions = formFuelOptions.map((fuel) => ({ value: fuel, label: fuel }));
  const engineSelectOptions = [
    { value: '', label: 'Selecione' },
    ...engineOptions.map((engine) => ({ value: engine, label: engine })),
    { value: CUSTOM_OPTION, label: 'Personalizada' }
  ];

  useEffect(() => {
    fetchVehicles();
    fetchClients();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.list();
      if (Array.isArray(data)) {
        setVehicles(data);
      } else {
        console.error('Vehicles data is not an array:', data);
        setVehicles([]);
      }
    } catch (err) { 
      console.error('Failed to fetch vehicles:', err);
      setVehicles([]);
    } finally { 
      setLoading(false); 
    }
  };

  const fetchClients = async () => {
    try {
      const data = await clientService.list();
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        console.error('Clients data is not an array:', data);
        setClients([]);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setClients([]);
    }
  };

  const handleOpenModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      const knownMake = makeOptions.includes(vehicle.make);
      const parsedModel = parseModelWithVersion(knownMake ? vehicle.make : '', vehicle.model);
      const knownModel = knownMake && getModelsForMake(vehicle.make).some((model) => model.name === parsedModel.model);
      const knownEngine = knownModel && getEnginesForModel(vehicle.make, parsedModel.model).includes(vehicle.engine || '');
      setEditingVehicle(vehicle);
      setVehicleVersion(parsedModel.version || NO_VERSION_OPTION);
      setCustomMake(knownMake ? '' : vehicle.make);
      setCustomModel(knownModel ? '' : vehicle.model);
      setCustomVersion('');
      setCustomEngine(knownEngine ? '' : vehicle.engine || '');
      setFormData({
        client_id: vehicle.client_id,
        make: knownMake ? vehicle.make : CUSTOM_OPTION,
        model: knownModel ? parsedModel.model : CUSTOM_OPTION,
        year: vehicle.year || 2024,
        plate: vehicle.plate,
        color: vehicle.color || '',
        vin: vehicle.vin || '',
        engine: knownEngine ? vehicle.engine || '' : (vehicle.engine ? CUSTOM_OPTION : ''),
        fuel: vehicle.fuel || '',
        hp: vehicle.hp || '',
        image_url: vehicle.image_url || ''
      });
    } else {
      setEditingVehicle(null);
      setVehicleVersion(NO_VERSION_OPTION);
      setCustomMake('');
      setCustomModel('');
      setCustomVersion('');
      setCustomEngine('');
      setFormData({ client_id: clients[0]?.id || 0, make: '', model: '', year: new Date().getFullYear(), plate: '', color: '', vin: '', engine: '', fuel: 'Diesel', hp: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user?.permissions === 'technician') {
      toast.error('Tecnicos nao podem cadastrar veiculos.');
      return;
    }

    const plate = normalizePlate(formData.plate);
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/;
    const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    const make = normalizeVehicleText(formData.make === CUSTOM_OPTION ? customMake : formData.make);
    const model = normalizeVehicleText(formData.model === CUSTOM_OPTION ? customModel : formData.model);
    const version = normalizeVehicleText(vehicleVersion === CUSTOM_OPTION ? customVersion : vehicleVersion);
    const engine = normalizeVehicleText(formData.engine === CUSTOM_OPTION ? customEngine : formData.engine);

    if (!oldFormat.test(plate) && !mercosulFormat.test(plate)) {
      toast.error('Placa invalida. Use o formato AAA-9999 ou ABC1D23 (Mercosul).');
      return;
    }

    if (!make || !model) {
      toast.error('Selecione marca e modelo do veiculo.');
      return;
    }

    if (!formData.fuel) {
      toast.error('Selecione o combustivel do veiculo.');
      return;
    }

    if (formData.engine === CUSTOM_OPTION && !engine) {
      toast.error('Informe a motorizacao personalizada.');
      return;
    }

    const dataToSave = {
      ...formData,
      plate,
      make,
      model: composeModelWithVersion(model, version),
      engine
    };

    try {
      if (editingVehicle) {
        await vehicleService.update(editingVehicle.id, dataToSave);
      } else {
        await vehicleService.create(dataToSave);
      }
      fetchVehicles();
      setIsModalOpen(false);
      toast.success(editingVehicle ? 'Veiculo atualizado!' : 'Veiculo cadastrado!');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof ApiError ? err.message : 'Erro de conexao ao salvar veiculo');
    }
  };
  const deleteVehicle = async (id: number) => {
    if (window.confirm('Excluir veículo? Isso removerá também suas ordens.')) {
      try {
        await vehicleService.remove(id);
        fetchVehicles();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Erro ao excluir veículo');
      }
    }
  };

  const fuelOptions = Array.from(new Set([...FUEL_OPTIONS, ...vehicles.map(v => v.fuel).filter(Boolean)])).sort();
  const filterYearOptions = Array.from(new Set(vehicles.map(v => v.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a));

  const filteredVehicles = Array.isArray(vehicles) ? vehicles.filter(v => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const normalizedPlateSearch = normalizePlate(searchTerm);
    const matchesSearch =
      normalizePlate(v.plate || '').includes(normalizedPlateSearch) ||
      v.model.toLowerCase().includes(normalizedSearch) ||
      v.make.toLowerCase().includes(normalizedSearch) ||
      v.client_name?.toLowerCase().includes(normalizedSearch);
    const matchesFuel = fuelFilter === 'all' || v.fuel === fuelFilter;
    const matchesYear = yearFilter === 'all' || String(v.year) === yearFilter;

    return matchesSearch && matchesFuel && matchesYear;
  }) : [];

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-brand-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por placa, modelo ou cliente..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`bg-white px-4 py-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-colors ${
            showFilters || fuelFilter !== 'all' || yearFilter !== 'all'
              ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/5'
              : 'text-surface-600 border-surface-200 hover:bg-surface-50'
          }`}
        >
          <Filter className="w-4 h-4" /> Filtros
        </button>
        {user?.permissions !== 'technician' && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-xl shadow-brand-primary/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-6 h-6" /> Novo Veículo
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white border border-surface-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todos os combustíveis</option>
            {fuelOptions.map(fuel => (
              <option key={fuel} value={fuel}>{fuel}</option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todos os anos</option>
            {filterYearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-5">
        {loading ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-surface-200 shadow-sm">
            <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-surface-400 font-bold uppercase tracking-[0.2em] text-[10px]">Acessando banco de dados automotivo...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-surface-300 border-dashed">
            <div className="w-24 h-24 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <Car className="w-12 h-12 text-surface-200" />
            </div>
            <h3 className="text-2xl font-display font-bold text-surface-900">Nenhum veículo registrado</h3>
            <p className="text-surface-500 mt-3 font-medium">Tente ajustar sua busca ou adicione um novo veículo.</p>
          </div>
        ) : (
          filteredVehicles.map(vehicle => (
            <motion.div 
              layout 
              key={vehicle.id} 
              className="bg-white p-6 rounded-[2.5rem] border border-surface-200 flex flex-col sm:flex-row justify-between items-center hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-surface-200/50 transition-all group tech-card"
            >
              <div className="flex items-center gap-8 w-full sm:w-auto">
                <div className="w-24 h-24 bg-surface-50 rounded-[1.5rem] flex items-center justify-center text-surface-300 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all duration-500 shadow-inner overflow-hidden border border-surface-100">
                  {vehicle.image_url ? (
                    <img src={vehicle.image_url} alt={vehicle.model} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <Car className="w-10 h-10" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-display font-bold text-2xl text-surface-950 group-hover:text-brand-primary transition-colors">{vehicle.make} {vehicle.model}</h3>
                    <span className="px-3 py-1 bg-surface-950 text-white text-[10px] font-mono font-bold rounded-lg tracking-wider uppercase border border-surface-800 shadow-sm data-value">
                      {formatPlateForDisplay(vehicle.plate)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-surface-500 mt-3 font-medium items-center">
                    <span className="flex items-center gap-2"><User className="w-4 h-4 text-brand-primary" />{vehicle.client_name}</span>
                    <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-surface-400" />{vehicle.year || 'N/I'}</span>
                    {vehicle.engine && (
                      <>
                        <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                        <span className="flex items-center gap-2"><Gauge className="w-4 h-4 text-surface-400" />{vehicle.engine}</span>
                      </>
                    )}
                    {vehicle.fuel && (
                      <>
                        <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                        <span className="flex items-center gap-2"><Fuel className="w-4 h-4 text-surface-400" />{vehicle.fuel}</span>
                      </>
                    )}
                    {vehicle.hp && (
                      <>
                        <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                        <span className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-surface-400" />{vehicle.hp} Cv</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6 sm:mt-0 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => handleOpenModal(vehicle)} 
                  className="p-4 bg-brand-primary/10 hover:bg-brand-primary/15 rounded-2xl text-brand-primary transition-all hover:shadow-sm"
                  title="Editar"
                >
                  <Edit2 className="w-6 h-6" />
                </button>
                {user?.permissions !== 'technician' && (
                  <button 
                    onClick={() => deleteVehicle(vehicle.id)} 
                    className="p-4 bg-brand-accent/10 hover:bg-brand-accent/15 rounded-2xl text-brand-accent transition-all hover:shadow-sm"
                    title="Excluir"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-surface-950/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden my-8"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
              
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-display font-bold text-surface-950 tracking-tight">{editingVehicle ? 'Editar' : 'Novo'} Veículo</h2>
                  <p className="text-surface-500 mt-1 font-medium">Cadastre as especificações técnicas do veículo.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-surface-100 rounded-2xl transition-colors">
                  <X className="w-7 h-7 text-surface-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <ImageUpload 
                  label="Foto do Veículo"
                  value={formData.image_url}
                  onChange={(val) => setFormData({ ...formData, image_url: val })}
                />
                
                {!editingVehicle && (
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Proprietário</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-brand-primary transition-colors" />
                      <select 
                        required 
                        className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all font-bold appearance-none" 
                        value={formData.client_id} 
                        onChange={e => setFormData({...formData, client_id: parseInt(e.target.value)})}
                      >
                        <option value="">Selecione um cliente</option>
                        {Array.isArray(clients) && clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <SearchableSelect
                      label="Marca"
                      required
                      value={formData.make}
                      options={makeSelectOptions}
                      searchPlaceholder="Buscar marca..."
                      onChange={(make) => {
                        setFormData({ ...formData, make, model: make === CUSTOM_OPTION ? CUSTOM_OPTION : '', engine: '', fuel: formData.fuel || 'Diesel' });
                        setVehicleVersion(NO_VERSION_OPTION);
                        setCustomModel('');
                        setCustomVersion('');
                        setCustomEngine('');
                      }}
                    />
                    {formData.make === CUSTOM_OPTION && (
                      <input
                        required
                        placeholder="Marca personalizada"
                        className="w-full px-6 py-4 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-bold"
                        value={customMake}
                        onChange={(e) => setCustomMake(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <SearchableSelect
                      label="Modelo"
                      required
                      disabled={!formData.make}
                      value={formData.model}
                      options={modelSelectOptions}
                      searchPlaceholder="Buscar modelo..."
                      onChange={(model) => {
                        setFormData({ ...formData, model, engine: '' });
                        setVehicleVersion(NO_VERSION_OPTION);
                        setCustomModel('');
                        setCustomVersion('');
                        setCustomEngine('');
                      }}
                    />
                    {formData.model === CUSTOM_OPTION && (
                      <input
                        required
                        placeholder="Modelo personalizado"
                        className="w-full px-6 py-4 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-bold"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <SearchableSelect
                      label="Versao"
                      value={vehicleVersion}
                      options={versionSelectOptions}
                      searchPlaceholder="Buscar versao..."
                      onChange={(version) => {
                        setVehicleVersion(version);
                        setCustomVersion('');
                      }}
                    />
                    {vehicleVersion === CUSTOM_OPTION && (
                      <input
                        required
                        placeholder="Versao personalizada"
                        className="w-full px-6 py-4 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-bold"
                        value={customVersion}
                        onChange={(e) => setCustomVersion(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <SearchableSelect
                      label="Ano"
                      value={formData.year}
                      options={yearSelectOptions}
                      searchPlaceholder="Buscar ano..."
                      icon={<Calendar className="w-5 h-5" />}
                      onChange={(year) => setFormData({...formData, year: parseInt(year)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Placa</label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-brand-primary transition-colors z-10" />
                      <IMaskInput
                        mask={[
                          { mask: 'aaa-0000' },
                          { mask: 'aaa0a00' }
                        ]}
                        prepare={(str) => str.toUpperCase()}
                        required 
                        placeholder="ABC-1234"
                        className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all font-bold font-mono uppercase tracking-widest" 
                        value={formatPlateForDisplay(formData.plate)}
                        onAccept={(value) => setFormData({...formData, plate: normalizePlate(String(value))})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Cor</label>
                    <div className="relative group">
                      <Palette className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-brand-primary transition-colors" />
                      <input
                        className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all font-bold"
                        value={formData.color}
                        onChange={e => setFormData({...formData, color: e.target.value})}
                        placeholder="Ex: Prata"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <SearchableSelect
                      label="Combustivel"
                      required
                      value={formData.fuel}
                      options={fuelSelectOptions}
                      searchPlaceholder="Buscar combustivel..."
                      icon={<Fuel className="w-5 h-5" />}
                      onChange={(fuel) => setFormData({...formData, fuel})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <SearchableSelect
                      label="Motorizacao"
                      value={formData.engine}
                      options={engineSelectOptions}
                      searchPlaceholder="Buscar motorizacao..."
                      icon={<Gauge className="w-5 h-5" />}
                      onChange={(engine) => {
                        setFormData({ ...formData, engine });
                        setCustomEngine('');
                      }}
                    />
                    {formData.engine === CUSTOM_OPTION && (
                      <input
                        required
                        placeholder="Motorizacao personalizada"
                        className="w-full px-6 py-4 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-bold"
                        value={customEngine}
                        onChange={(e) => setCustomEngine(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Potencia (Cv)</label>
                    <div className="relative group">
                      <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-brand-primary transition-colors" />
                      <input
                        className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all font-bold data-value"
                        value={formData.hp}
                        onChange={e => setFormData({...formData, hp: e.target.value})}
                        placeholder="Ex: 150"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-surface-100 hover:bg-surface-200 text-surface-600 rounded-2xl font-bold transition-all active:scale-[0.98]"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-brand-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {editingVehicle ? <Edit2 className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
                    {editingVehicle ? 'Atualizar' : 'Salvar'} Veículo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

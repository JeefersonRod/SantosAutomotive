import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  Receipt, 
  Plus, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Wrench,
  Package,
  UserPlus,
  CarFront,
  Camera,
  ArrowUpRight,
  StickyNote,
  Hash,
  Trash2,
  Calendar,
  Filter,
  CheckSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { Vehicle, OrderItem, StaffMember, ServiceOrder, Product } from '../types';
import MultiImageUpload from './MultiImageUpload';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = '/api';

interface Stats {
  clients: number;
  vehicles: number;
  activeOrders: number;
  pending: number;
  inProgress: number;
  completed: number;
  revenue: number;
  partsRevenue: number;
  laborRevenue: number;
  notesCount: number;
}

export default function DashboardTab({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ 
    clients: 0, 
    vehicles: 0, 
    activeOrders: 0, 
    pending: 0,
    inProgress: 0,
    completed: 0,
    revenue: 0,
    partsRevenue: 0,
    laborRevenue: 0,
    notesCount: 0
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');
  
  // Quick OS Form State
  const [osForm, setOsForm] = useState({
    vehicle_id: '',
    description: '',
    technician_ids: [] as number[],
    notes: '',
    checklist: {
      fuel_level: '1/4',
      scratches: false,
      spare_tire: true,
      triangle: true,
      jack: true,
      documents: true,
      personal_items: false
    } as Record<string, any>,
    items: [] as OrderItem[],
    checkin_images: [] as string[],
    entry_date: new Date().toISOString().split('T')[0],
    exit_date: '',
    is_priority: false
  });
  const [newItem, setNewItem] = useState<OrderItem>({ description: '', price: 0, quantity: 1, type: 'parts' });

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/staff`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaff(data.filter((m: StaffMember) => m.active));
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const fetchStats = async () => {
    try {
      let url = `${API_URL}/stats`;
      const now = new Date();
      if (dateFilter !== 'all') {
        const start = new Date();
        if (dateFilter === 'today') start.setHours(0,0,0,0);
        if (dateFilter === '7days') start.setDate(now.getDate() - 7);
        if (dateFilter === '30days') start.setDate(now.getDate() - 30);
        url += `?start_date=${start.toISOString()}`;
      }

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (data && typeof data === 'object' && !data.error) {
        setStats(data);
      } else {
        console.error('Stats data is invalid:', data);
      }
    } catch (err) { 
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) { console.error(err); }
  };

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecentOrders(data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to fetch recent orders:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`${API_URL}/vehicles`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setVehicles(data);
      } else {
        console.error('Vehicles data is not an array:', data);
        setVehicles([]);
      }
    } catch (err) { 
      console.error('Failed to fetch vehicles:', err);
      setVehicles([]);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchStats(),
        fetchVehicles(),
        fetchStaff(),
        fetchProducts(),
        fetchRecentOrders()
      ]);
      setLoading(false);
    };
    loadAll();
  }, [dateFilter]);

  const handleCreateOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osForm.vehicle_id) return alert('Selecione um veículo');
    if (!osForm.description) return alert('Informe a descrição do serviço');
    if (osForm.items.length === 0) return alert('Adicione pelo menos um item à OS');

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: parseInt(osForm.vehicle_id),
          description: osForm.description,
          technician_ids: osForm.technician_ids,
          items: osForm.items,
          notes: osForm.notes,
          checklist: osForm.checklist,
          checkin_images: osForm.checkin_images,
          entry_date: osForm.entry_date,
          exit_date: osForm.exit_date,
          is_priority: osForm.is_priority
        }),
        credentials: 'include'
      });
      if (res.ok) {
        toast.success('Ordem de Serviço criada com sucesso!');
        setOsForm({ 
          vehicle_id: '', 
          description: '', 
          technician_ids: [], 
          notes: '', 
          checklist: {
            fuel_level: '1/4',
            scratches: false,
            spare_tire: true,
            triangle: true,
            jack: true,
            documents: true,
            personal_items: false
          },
          items: [], 
          checkin_images: [],
          entry_date: new Date().toISOString().split('T')[0],
          exit_date: '',
          is_priority: false
        });
        fetchStats();
      } else {
        const errData = await res.json();
        toast.error(`Erro: ${errData.error || 'Falha ao criar OS'}`);
      }
    } catch (err) { 
      console.error(err); 
      toast.error('Erro de conexão ao criar OS');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (newItem.description && newItem.price > 0) {
      setOsForm({ ...osForm, items: [...osForm.items, { ...newItem, quantity: newItem.quantity || 1 }] });
      setNewItem({ description: '', price: 0, quantity: 1, type: 'parts' });
    }
  };

  const removeItem = (index: number) => {
    const newItems = [...osForm.items];
    newItems.splice(index, 1);
    setOsForm({ ...osForm, items: newItems });
  };

  const totalOS = osForm.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  return (
    <div className="space-y-10 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="micro-label text-surface-950 mb-1">Gerenciamento</p>
          <h2 className="text-3xl font-display font-bold text-brand-primary tracking-tight">Santos Automotive</h2>
        </div>
        
        {/* Date Filters */}
        <div className="flex bg-white p-1 rounded-xl border border-surface-200 shadow-sm">
          {(['today', '7days', '30days', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                dateFilter === f 
                  ? 'bg-brand-primary text-white shadow-md' 
                  : 'text-surface-500 hover:bg-surface-50'
              }`}
            >
              {f === 'today' ? 'Hoje' : f === '7days' ? '7 Dias' : f === '30days' ? '30 Dias' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="w-5 h-5" />} 
          label="Clientes" 
          value={stats.clients} 
          color="blue" 
          onClick={() => onNavigate('clients')}
        />
        <StatCard 
          icon={<CarFront className="w-5 h-5" />} 
          label="Veículos" 
          value={stats.vehicles} 
          color="indigo" 
          onClick={() => onNavigate('vehicles')}
        />
        <StatCard 
          icon={<Clock className="w-5 h-5" />} 
          label="OS Ativas" 
          value={stats.activeOrders} 
          color="amber" 
          onClick={() => onNavigate('orders')}
        />
        <StatCard 
          icon={<StickyNote className="w-5 h-5" />} 
          label="Notas" 
          value={stats.notesCount} 
          color="indigo" 
          onClick={() => onNavigate('notes')}
        />
        { (user?.permissions === 'admin' || user?.permissions === 'super_admin') && (
          <StatCard 
            icon={<TrendingUp className="w-5 h-5" />} 
            label="Faturamento" 
            value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
            color="emerald" 
            onClick={() => onNavigate('orders')}
          />
        )}
      </div>

      {/* Revenue Breakdown */}
        { (user?.permissions === 'admin' || user?.permissions === 'super_admin') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Peças</p>
              <p className="text-lg font-display font-bold text-surface-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.partsRevenue)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Mão de Obra</p>
              <p className="text-lg font-display font-bold text-surface-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.laborRevenue)}
              </p>
            </div>
          </div>
        )}

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Quick Actions & OS Creation */}
        <div className="lg:col-span-2 space-y-10">
          {/* Quick Actions */}
          {user?.permissions !== 'technician' && (
            <section className="space-y-5">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-display font-bold text-surface-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-primary" />
                  Ações Rápidas
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <QuickActionCard 
                  icon={<UserPlus className="w-6 h-6" />}
                  title="Novo Cliente"
                  desc="Cadastre um novo proprietário"
                  color="blue"
                  onClick={() => onNavigate('clients')}
                />
                <QuickActionCard 
                  icon={<Car className="w-6 h-6" />}
                  title="Novo Veículo"
                  desc="Adicione um carro à frota"
                  color="indigo"
                  onClick={() => onNavigate('vehicles')}
                />
              </div>
            </section>
          )}

      {/* New OS Form */}
      {user?.permissions !== 'technician' && (
        <section className="space-y-5">
          <h3 className="text-lg font-display font-bold text-surface-900 px-2 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-primary" />
            Entrada de Veículo (Nova OS)
          </h3>
          <div className="bg-white rounded-3xl border border-surface-200 p-8 shadow-sm tech-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Wrench className="w-24 h-24" />
            </div>
            
            <form onSubmit={handleCreateOS} className="space-y-8 relative z-10">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="micro-label ml-1">Veículo do Cliente</label>
                  <select 
                    required
                    className="w-full px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none font-medium"
                    value={osForm.vehicle_id}
                    onChange={e => setOsForm({ ...osForm, vehicle_id: e.target.value })}
                  >
                    <option value="">Selecione um veículo...</option>
                    {Array.isArray(vehicles) && vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.model} ({v.client_name})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="micro-label ml-1">Descrição do Serviço</label>
                  <input 
                    required
                    placeholder="Ex: Revisão de 40k, Troca de Óleo..."
                    className="w-full px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold"
                    value={osForm.description}
                    onChange={e => setOsForm({ ...osForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="micro-label ml-1">Técnicos (Opcional)</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-surface-50 border border-surface-200 rounded-2xl max-h-32 overflow-y-auto">
                    {staff.map(s => (
                      <label key={s.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-surface-100 shadow-sm hover:border-brand-primary transition-all">
                        <input 
                          type="checkbox"
                          checked={osForm.technician_ids.includes(s.id)}
                          onChange={(e) => {
                            const ids = e.target.checked 
                              ? [...osForm.technician_ids, s.id]
                              : osForm.technician_ids.filter(id => id !== s.id);
                            setOsForm({...osForm, technician_ids: ids});
                          }}
                          className="w-3.5 h-3.5 text-brand-primary rounded border-surface-300 focus:ring-brand-primary"
                        />
                        <span className="text-[10px] font-bold text-surface-700">{s.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="micro-label ml-1">Observações / Sintomas</label>
                  <textarea 
                    rows={2}
                    placeholder="Ex: Barulho na suspensão..."
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-medium text-sm"
                    value={osForm.notes}
                    onChange={e => setOsForm({ ...osForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="micro-label ml-1">Data de Entrada</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold"
                    value={osForm.entry_date}
                    onChange={e => setOsForm({ ...osForm, entry_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="micro-label ml-1">Previsão de Saída</label>
                  <input 
                    type="date"
                    className="w-full px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold"
                    value={osForm.exit_date}
                    onChange={e => setOsForm({ ...osForm, exit_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="micro-label ml-1">Prioridade</label>
                <div 
                  onClick={() => setOsForm({...osForm, is_priority: !osForm.is_priority})}
                  className={`w-full p-4 border rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                    osForm.is_priority 
                      ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                      : 'bg-surface-50 border-surface-200 text-surface-500'
                  }`}
                >
                  <span className="font-bold text-sm">Marcar como Prioridade</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    osForm.is_priority ? 'bg-brand-primary border-brand-primary' : 'border-surface-300'
                  }`}>
                    {osForm.is_priority && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>

              <MultiImageUpload 
                label="Vistoria de Entrada (Fotos do Veículo)"
                values={osForm.checkin_images}
                onChange={(imgs) => setOsForm({ ...osForm, checkin_images: imgs })}
              />

              {/* Checklist Section */}
              <div className="space-y-4 bg-surface-50 p-6 rounded-2xl border border-surface-200">
                <h4 className="micro-label flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Checklist de Vistoria
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-surface-400 uppercase">Combustível</label>
                    <select 
                      className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-xs font-bold outline-none"
                      value={osForm.checklist.fuel_level}
                      onChange={e => setOsForm({...osForm, checklist: {...osForm.checklist, fuel_level: e.target.value}})}
                    >
                      <option value="Reserva">Reserva</option>
                      <option value="1/4">1/4</option>
                      <option value="1/2">1/2</option>
                      <option value="3/4">3/4</option>
                      <option value="Cheio">Cheio</option>
                    </select>
                  </div>
                  {[
                    { key: 'scratches', label: 'Avarias/Riscos' },
                    { key: 'spare_tire', label: 'Estepe' },
                    { key: 'triangle', label: 'Triângulo' },
                    { key: 'jack', label: 'Macaco' },
                    { key: 'documents', label: 'Documentos' },
                    { key: 'personal_items', label: 'Itens Pessoais' }
                  ].map(item => (
                    <div key={item.key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-surface-400 uppercase">{item.label}</label>
                      <button
                        type="button"
                        onClick={() => setOsForm({...osForm, checklist: {...osForm.checklist, [item.key]: !osForm.checklist[item.key]}})}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                          osForm.checklist[item.key] 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                            : 'bg-white border-surface-200 text-surface-400'
                        }`}
                      >
                        {osForm.checklist[item.key] ? 'PRESENTE/OK' : 'AUSENTE/NÃO'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-5 bg-surface-50 p-6 rounded-2xl border border-surface-200">
                <div className="flex justify-between items-center">
                  <h4 className="micro-label">Itens e Serviços Iniciais</h4>
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-surface-200 shadow-sm">
                    <span className="text-[10px] font-bold text-surface-400 uppercase">Total:</span>
                    <span className="text-sm font-bold text-brand-primary data-value">R$ {totalOS.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <div className="sm:col-span-2 relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input 
                      list="product-suggestions"
                      placeholder="Descrição ou selecione produto..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-medium"
                      value={newItem.description}
                      onChange={e => {
                        const val = e.target.value;
                        const product = products.find(p => p.name === val);
                        if (product) {
                          setNewItem({ ...newItem, description: product.name, price: product.price, type: 'parts' });
                        } else {
                          setNewItem({ ...newItem, description: val });
                        }
                      }}
                    />
                    <datalist id="product-suggestions">
                      {products.map(p => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </div>
                  <div className="sm:col-span-1 relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input 
                      type="number"
                      placeholder="Qtd"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold"
                      value={newItem.quantity || ''}
                      onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                    />
                  </div>
                  <input 
                    type="number"
                    placeholder="Preço"
                    className="sm:col-span-1 w-full px-4 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold data-value"
                    value={newItem.price || ''}
                    onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                  />
                  <div className="sm:col-span-2 flex gap-2">
                    <select 
                      className="flex-1 px-3 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-xs font-bold appearance-none"
                      value={newItem.type}
                      onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
                    >
                      <option value="parts">Peça</option>
                      <option value="labor">Mão de Obra</option>
                    </select>
                    <button 
                      type="button"
                      onClick={addItem}
                      className="bg-brand-primary text-white p-3 rounded-xl hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Added Items List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {osForm.items.map((item, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx} 
                      className="flex justify-between items-center p-3 bg-white rounded-xl border border-surface-200 shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'parts' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                          {item.type === 'parts' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-surface-900">{item.description}</p>
                          <p className="micro-label !text-[8px]">{item.type === 'parts' ? 'Peça' : 'Mão de Obra'} • Qtd: {item.quantity || 1}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-surface-900 data-value">R$ {(item.price * (item.quantity || 1)).toFixed(2)}</span>
                        <button 
                          type="button" 
                          onClick={() => removeItem(idx)}
                          className="p-1.5 hover:bg-brand-accent/10 rounded-lg text-surface-300 hover:text-brand-accent transition-colors"
                        >
                          <Plus className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-brand-primary/20 active:scale-[0.99] flex items-center justify-center gap-3"
              >
                <Receipt className="w-6 h-6" />
                Gerar Ordem de Serviço
              </button>
            </form>
          </div>
        </section>
      )}
        </div>

        {/* Sidebar / Recent Activity */}
        <div className="space-y-10">
          <section className="space-y-5">
            <h3 className="text-lg font-display font-bold text-surface-900 px-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Dicas de Gestão
            </h3>
            <div className="bg-surface-950 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full -mt-16 -mr-16 blur-3xl group-hover:bg-brand-primary/30 transition-all duration-700"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                  <TrendingUp className="w-6 h-6 text-brand-secondary" />
                </div>
                <h4 className="text-xl font-display font-bold mb-3">Mantenha sua oficina organizada!</h4>
                <p className="text-surface-400 text-sm leading-relaxed mb-8">
                  Lembre-se de atualizar o status das ordens de serviço assim que o trabalho for concluído. Isso ajuda no controle de faturamento e satisfação do cliente.
                </p>
                <button 
                  onClick={() => onNavigate('orders')}
                  className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold text-sm hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Ver Ordens Ativas
                  <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h3 className="text-lg font-display font-bold text-surface-900 px-2">Resumo de Status</h3>
            <div className="bg-white rounded-3xl border border-surface-200 p-6 space-y-3 shadow-sm">
              <StatusRow label="Pendentes" count={stats.pending} color="bg-surface-100 text-surface-600" icon={<AlertCircle className="w-4 h-4" />} />
              <StatusRow label="Em Execução" count={stats.inProgress} color="bg-amber-50 text-amber-600" icon={<Clock className="w-4 h-4" />} />
              <StatusRow label="Concluídas" count={stats.completed} color="bg-emerald-50 text-emerald-600" icon={<CheckCircle2 className="w-4 h-4" />} />
            </div>
          </section>

          {recentOrders.length > 0 && (
            <section className="space-y-5">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-lg font-display font-bold text-surface-900">Ordens Recentes</h3>
                <button onClick={() => onNavigate('orders')} className="text-xs font-bold text-brand-primary hover:underline">Ver todas</button>
              </div>
              <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden shadow-sm">
                {recentOrders.map((order, i) => (
                  <div 
                    key={order.id} 
                    className={`p-4 flex items-center justify-between hover:bg-surface-50 transition-colors cursor-pointer ${i !== recentOrders.length - 1 ? 'border-bottom border-surface-100' : ''}`}
                    onClick={() => onNavigate('orders')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                        order.status === 'in_progress' ? 'bg-amber-50 text-amber-600' : 
                        'bg-surface-50 text-surface-400'
                      }`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-surface-900">{order.vehicle_model}</p>
                        <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">{order.plate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-brand-primary">R$ {(order.total_amount || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-surface-400 font-medium">{order.status === 'completed' ? 'Concluída' : order.status === 'in_progress' ? 'Em Execução' : 'Pendente'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick }: { icon: any, label: string, value: any, color: string, onClick: () => void }) {
  const colors: any = {
    blue: 'bg-blue-50 text-brand-primary border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <motion.button 
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className="bg-white p-6 rounded-3xl border border-surface-200 flex items-center gap-5 text-left shadow-sm hover:shadow-xl hover:shadow-surface-200/50 transition-all tech-card"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colors[color]} shadow-inner`}>
        {icon}
      </div>
      <div>
        <p className="micro-label mb-1">{label}</p>
        <p className="text-xl font-bold text-surface-950 data-value">{value}</p>
      </div>
    </motion.button>
  );
}

function QuickActionCard({ icon, title, desc, color, onClick }: { icon: any, title: string, desc: string, color: string, onClick: () => void }) {
  const colors: any = {
    blue: 'bg-blue-50 text-brand-primary group-hover:bg-brand-primary group-hover:text-white',
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
  };

  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 p-6 bg-white rounded-3xl border border-surface-200 hover:border-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/5 transition-all group text-left tech-card"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${colors[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-bold text-surface-900">{title}</p>
        <p className="text-xs text-surface-500 font-medium">{desc}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
    </button>
  );
}

function StatusRow({ label, count, color, icon }: { label: string, count: number, color: string, icon: any }) {
  return (
    <div className="flex justify-between items-center p-3.5 rounded-2xl hover:bg-surface-50 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
          {icon}
        </div>
        <span className="font-bold text-surface-700 text-sm">{label}</span>
      </div>
      <span className="font-bold text-surface-950 data-value">{count}</span>
    </div>
  );
}

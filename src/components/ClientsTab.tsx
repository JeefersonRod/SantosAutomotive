import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, User, Phone, Mail, FileText, X, ChevronRight, Car as CarIcon, ArrowLeft, Receipt, Clock, CheckCircle2, AlertCircle, TrendingUp, Calendar, Camera, ArrowUpRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IMaskInput } from 'react-imask';
import { toast } from 'sonner';
import { Client, Vehicle, ServiceOrder } from '../types';
import ImageUpload from './ImageUpload';

import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { clientService } from '../services';

export default function ClientsTab() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [contactFilter, setContactFilter] = useState<'all' | 'phone' | 'email' | 'document'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([]);
  const [clientOrders, setClientOrders] = useState<ServiceOrder[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    image_url: ''
  });

  useEffect(() => {
    console.log('ClientsTab mounted, user:', user);
    fetchClients();
  }, [user]);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: number) => {
    try {
      const [vehicles, orders] = await Promise.all([
        clientService.getVehicles(clientId),
        clientService.getOrders(clientId)
      ]);

      if (Array.isArray(vehicles)) {
        setClientVehicles(vehicles);
      } else {
        console.error('Client vehicles data is not an array:', vehicles);
        setClientVehicles([]);
      }

      if (Array.isArray(orders)) {
        setClientOrders(orders);
      } else {
        console.error('Client orders data is not an array:', orders);
        setClientOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch client details:', err);
      setClientVehicles([]);
      setClientOrders([]);
    }
  };

  const handleOpenModal = (e: React.MouseEvent, client?: Client) => {
    console.log('handleOpenModal called', { client, isModalOpen });
    // alert('Abrindo modal...'); // Temporary debug
    e.preventDefault();
    e.stopPropagation();
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        document: client.document || '',
        image_url: client.image_url || ''
      });
    } else {
      setEditingClient(null);
      setFormData({ name: '', email: '', phone: '', document: '', image_url: '' });
    }
    setIsModalOpen(true);
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    fetchClientDetails(client.id);
  };

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting client form...', formData);
    
    try {
      if (user?.permissions === 'technician') {
        toast.error('Técnicos não podem cadastrar clientes.');
        return;
      }

      const name = (formData.name || '').trim();
      const phone = (formData.phone || '').trim();
      const email = (formData.email || '').trim();
      const documentVal = (formData.document || '').trim();

      if (!name) {
        toast.error('O nome é obrigatório.');
        return;
      }

      if (!phone) {
        toast.error('O telefone é obrigatório.');
        return;
      }

      if (!validatePhone(phone)) {
        toast.error('O telefone deve ter entre 10 e 11 números (DDD + número).');
        return;
      }

      if (email && !validateEmail(email)) {
        toast.error('Por favor, insira um e-mail válido.');
        return;
      }

      // Format phone for storage: (XX) XXXXX-XXXX
      const digits = phone.replace(/\D/g, '');
      const formattedPhone = digits.length === 11 
        ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
        : `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      
      const dataToSave = { 
        ...formData, 
        name,
        phone: formattedPhone,
        email: email || null,
        document: documentVal || null
      };

      if (editingClient) {
        await clientService.update(editingClient.id, dataToSave);
      } else {
        await clientService.create(dataToSave);
      }
      await fetchClients();
      if (selectedClient && editingClient && selectedClient.id === editingClient.id) {
        setSelectedClient({ ...selectedClient, ...dataToSave });
      }
      setIsModalOpen(false);
      toast.success(editingClient ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!');
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err instanceof ApiError ? `Erro ao salvar cliente: ${err.message}` : 'Ocorreu um erro inesperado ao tentar salvar o cliente.');
    }
  };

  const deleteClient = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Excluir cliente? Isso removerá também seus veículos e ordens.')) {
      try {
        await clientService.remove(id);
        fetchClients();
        if (selectedClient?.id === id) setSelectedClient(null);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'Erro ao excluir cliente');
      }
    }
  };

  const filteredClients = Array.isArray(clients) ? clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document?.includes(searchTerm) ||
      c.phone?.includes(searchTerm);
    const matchesContact =
      contactFilter === 'all' ||
      (contactFilter === 'phone' && !!c.phone) ||
      (contactFilter === 'email' && !!c.email) ||
      (contactFilter === 'document' && !!c.document);

    return matchesSearch && matchesContact;
  }) : [];

  const totalSpent = Array.isArray(clientOrders) ? clientOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0) : 0;

  if (selectedClient) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="space-y-10 pb-12"
      >
        <button 
          onClick={() => setSelectedClient(null)}
          className="flex items-center gap-2 text-surface-500 hover:text-surface-900 transition-colors font-bold text-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar para lista
        </button>

        {/* Client Header Card */}
        <div className="bg-white rounded-[2.5rem] border border-surface-200 overflow-hidden shadow-sm tech-card">
          <div className="bg-surface-950 p-10 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
                  {selectedClient.image_url ? (
                    <img src={selectedClient.image_url} alt={selectedClient.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-12 h-12 text-white/50" />
                  )}
                </div>
                <div>
                  <h2 className="text-4xl font-display font-bold tracking-tight">{selectedClient.name}</h2>
                  <div className="flex items-center gap-6 mt-3">
                    <span className="flex items-center gap-2 text-surface-400 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-brand-secondary" />
                      Desde {new Date(selectedClient.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="w-1.5 h-1.5 bg-surface-800 rounded-full"></span>
                    <span className="text-brand-secondary text-xs font-bold uppercase tracking-[0.2em] bg-brand-secondary/10 px-3 py-1 rounded-lg">ID #{selectedClient.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={(e) => handleOpenModal(e, selectedClient)}
                  className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all backdrop-blur-md border border-white/10 group"
                >
                  <Edit2 className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                </button>
                {user?.permissions !== 'technician' && (
                  <button 
                    onClick={(e) => deleteClient(e, selectedClient.id)}
                    className="bg-brand-accent/10 hover:bg-brand-accent/20 p-4 rounded-2xl transition-all backdrop-blur-md border border-brand-accent/20 text-brand-accent group"
                  >
                    <Trash2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-10 grid md:grid-cols-3 gap-12 bg-surface-50/30">
            <div className="space-y-4">
              <p className="micro-label">Informações de Contato</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white rounded-xl border border-surface-200 flex items-center justify-center shadow-sm group-hover:border-brand-primary transition-colors">
                    <Phone className="w-5 h-5 text-surface-400 group-hover:text-brand-primary transition-colors" />
                  </div>
                  <span className="font-bold text-surface-700 data-value">{selectedClient.phone || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 bg-white rounded-xl border border-surface-200 flex items-center justify-center shadow-sm group-hover:border-brand-primary transition-colors">
                    <Mail className="w-5 h-5 text-surface-400 group-hover:text-brand-primary transition-colors" />
                  </div>
                  <span className="font-bold text-surface-700">{selectedClient.email || 'Não informado'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <p className="micro-label">Documentação</p>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-white rounded-xl border border-surface-200 flex items-center justify-center shadow-sm group-hover:border-brand-primary transition-colors">
                  <FileText className="w-5 h-5 text-surface-400 group-hover:text-brand-primary transition-colors" />
                </div>
                <span className="font-bold text-surface-700 data-value">{selectedClient.document || 'Não informado'}</span>
              </div>
            </div>
            <div className="space-y-4">
              <p className="micro-label">Resumo Financeiro</p>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-surface-950 data-value">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Total Investido</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Vehicles Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-display font-bold flex items-center gap-3 text-surface-900">
                <CarIcon className="w-6 h-6 text-brand-primary" />
                Veículos ({clientVehicles.length})
              </h3>
            </div>

            <div className="grid gap-5">
              {clientVehicles.length === 0 ? (
                <div className="bg-white border border-dashed border-surface-300 rounded-[2.5rem] p-16 text-center">
                  <div className="w-20 h-20 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CarIcon className="w-10 h-10 text-surface-200" />
                  </div>
                  <p className="text-surface-500 font-bold">Nenhum veículo cadastrado.</p>
                </div>
              ) : (
                clientVehicles.map(vehicle => (
                  <div key={vehicle.id} className="bg-white p-6 rounded-3xl border border-surface-200 flex justify-between items-center shadow-sm hover:border-brand-primary/30 transition-all group tech-card">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-surface-50 rounded-2xl flex items-center justify-center text-surface-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all shadow-inner">
                        <CarIcon className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-surface-950 text-lg">{vehicle.make} {vehicle.model}</h4>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="px-3 py-1 bg-surface-950 text-white text-[10px] font-mono font-bold rounded-lg tracking-wider uppercase border border-surface-800 shadow-sm">
                            {vehicle.plate}
                          </span>
                          <span className="text-xs text-surface-400 font-bold uppercase tracking-widest">{vehicle.year || 'Ano N/I'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="micro-label mb-1">Cor</p>
                      <p className="text-sm font-bold text-surface-700">{vehicle.color || 'N/I'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Orders Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-display font-bold flex items-center gap-3 text-surface-900">
                <Receipt className="w-6 h-6 text-brand-primary" />
                Histórico de Ordens ({clientOrders.length})
              </h3>
            </div>

            <div className="grid gap-5">
              {clientOrders.length === 0 ? (
                <div className="bg-white border border-dashed border-surface-300 rounded-[2.5rem] p-16 text-center">
                  <div className="w-20 h-20 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Receipt className="w-10 h-10 text-surface-200" />
                  </div>
                  <p className="text-surface-500 font-bold">Nenhuma ordem de serviço.</p>
                </div>
              ) : (
                clientOrders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm hover:border-brand-primary/30 transition-all group tech-card">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                          order.status === 'in_progress' ? 'bg-brand-primary/5 text-brand-primary' : 
                          'bg-surface-50 text-surface-400'
                        }`}>
                          {order.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : 
                           order.status === 'in_progress' ? <Clock className="w-6 h-6" /> : 
                           <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-surface-950">OS #{order.id}</p>
                          <p className="micro-label !text-[8px] mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-surface-950 data-value">R$ {(order.total_amount || 0).toFixed(2)}</p>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg mt-2 inline-block ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                          order.status === 'in_progress' ? 'bg-brand-primary/10 text-brand-primary' : 
                          'bg-surface-100 text-surface-600'
                        }`}>
                          {order.status === 'completed' ? 'Concluída' : 
                           order.status === 'in_progress' ? 'Em Andamento' : 
                           'Pendente'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-500 bg-surface-50 p-3 rounded-xl border border-surface-100">
                      <CarIcon className="w-4 h-4 text-brand-primary" />
                      <span className="font-bold text-surface-700">{order.vehicle_model}</span>
                      <span className="w-1 h-1 bg-surface-300 rounded-full"></span>
                      <span className="font-mono font-bold uppercase tracking-wider text-surface-600">{order.plate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-brand-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nome, placa ou telefone..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`bg-white px-4 py-4 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-colors ${
            showFilters || contactFilter !== 'all'
              ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/5'
              : 'text-surface-600 border-surface-200 hover:bg-surface-50'
          }`}
        >
          <Filter className="w-4 h-4" /> Filtros
        </button>
        {user?.permissions !== 'technician' && (
          <button 
            id="add-client-btn"
            onClick={(e) => {
              console.log('Add Client button clicked');
              handleOpenModal(e);
            }}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all shadow-xl shadow-brand-primary/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-6 h-6" /> Novo Cliente
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white border border-surface-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
          <select
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value as typeof contactFilter)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todos os clientes</option>
            <option value="phone">Com telefone</option>
            <option value="email">Com e-mail</option>
            <option value="document">Com documento</option>
          </select>
        </div>
      )}

      <div className="grid gap-5">
        {loading ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-surface-200 shadow-sm">
            <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-surface-400 font-bold uppercase tracking-[0.2em] text-[10px]">Sincronizando banco de dados...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2.5rem] border border-surface-300 border-dashed">
            <div className="w-24 h-24 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <User className="w-12 h-12 text-surface-200" />
            </div>
            <h3 className="text-2xl font-display font-bold text-surface-900">Nenhum cliente encontrado</h3>
            <p className="text-surface-500 mt-3 font-medium">Tente ajustar sua busca ou adicione um novo registro.</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <motion.div 
              layout 
              key={client.id} 
              onClick={() => handleViewDetails(client)}
              className="bg-white p-6 rounded-[2.5rem] border border-surface-200 flex flex-col sm:flex-row justify-between items-center cursor-pointer hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-surface-200/50 transition-all group tech-card"
            >
              <div className="flex items-center gap-8 w-full sm:w-auto">
                <div className="w-20 h-20 bg-surface-50 rounded-[1.5rem] flex items-center justify-center text-surface-300 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all duration-500 shadow-inner overflow-hidden border border-surface-100">
                  {client.image_url ? (
                    <img src={client.image_url} alt={client.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-10 h-10" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-2xl text-surface-950 group-hover:text-brand-primary transition-colors">{client.name}</h3>
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-surface-500 mt-3 font-medium">
                    {client.phone && <span className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-brand-primary" /><span className="data-value">{client.phone}</span></span>}
                    {client.document && <span className="flex items-center gap-2.5"><FileText className="w-4 h-4 text-surface-400" /><span className="data-value">{client.document}</span></span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 mt-6 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                <div className="hidden lg:flex flex-col items-end">
                  <p className="micro-label mb-1.5">Cliente desde</p>
                  <p className="text-sm font-bold text-surface-900 data-value">{new Date(client.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleOpenModal(e, client)} 
                    className="p-4 hover:bg-brand-primary/5 rounded-2xl text-surface-300 hover:text-brand-primary transition-all hover:shadow-sm"
                    title="Editar"
                  >
                    <Edit2 className="w-6 h-6" />
                  </button>
                  {user?.permissions !== 'technician' && (
                    <button 
                      onClick={(e) => deleteClient(e, client.id)} 
                      className="p-4 hover:bg-brand-accent/5 rounded-2xl text-surface-300 hover:text-brand-accent transition-all hover:shadow-sm"
                      title="Excluir"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-50 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300">
                  <ChevronRight className="w-7 h-7 text-surface-300 group-hover:text-white transition-all group-hover:translate-x-0.5" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center p-4 bg-surface-950/60 backdrop-blur-md overflow-y-auto">
            {console.log('Rendering Modal', { isModalOpen })}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden my-8"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-brand-secondary"></div>
              
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-display font-bold text-surface-950 tracking-tight">{editingClient ? 'Editar' : 'Novo'} Cliente</h2>
                  <p className="text-surface-500 mt-1 font-medium">Cadastre os dados técnicos e de contato.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-surface-100 rounded-2xl transition-colors">
                  <X className="w-7 h-7 text-surface-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <ImageUpload 
                  label="Avatar do Cliente"
                  value={formData.image_url}
                  onChange={(val) => setFormData({ ...formData, image_url: val })}
                />
                
                <div className="space-y-2">
                  <label className="micro-label ml-1">Nome Completo (Obrigatório)</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-brand-primary transition-colors" />
                    <input 
                      required
                      placeholder="Ex: João da Silva"
                      className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all font-medium" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="micro-label ml-1">Email de Contato</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-brand-primary transition-colors" />
                    <input 
                      type="email" 
                      placeholder="joao@exemplo.com"
                      className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all font-medium" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Telefone / WhatsApp</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-brand-primary transition-colors z-10" />
                      <IMaskInput
                        mask="(00) 00000-0000"
                        unmask={true}
                        required
                        placeholder="(11) 99999-9999"
                        className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all font-bold data-value"
                        value={formData.phone}
                        onAccept={(value) => setFormData({...formData, phone: value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="micro-label ml-1">CPF ou CNPJ</label>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-brand-primary transition-colors z-10" />
                      <IMaskInput
                        mask={[
                          { mask: '000.000.000-00' },
                          { mask: '00.000.000/0000-00' }
                        ]}
                        unmask={true}
                        placeholder="000.000.000-00"
                        className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all font-bold data-value"
                        value={formData.document}
                        onAccept={(value) => setFormData({...formData, document: value})}
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
                    id="save-client-btn"
                    type="submit" 
                    className="flex-[2] py-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-brand-primary/20 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {editingClient ? <Edit2 className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
                    {editingClient ? 'Atualizar' : 'Salvar'} Cliente
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

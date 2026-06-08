import React, { useState, useEffect } from 'react';
import { Search, StickyNote, Eye, Printer, ChevronRight, Calendar, User, Car as CarIcon, DollarSign, Plus, Trash2, Package, Hash, Pencil, Share2, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IMaskInput } from 'react-imask';
import { toast } from 'sonner';
import { Note, Vehicle, NoteItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { financeService, vehicleService } from '../services';
import { useLocation } from 'react-router-dom';
import ServiceNotePrintView from './print/ServiceNotePrintView';

export default function NotesTab() {
  const { user } = useAuth();
  const location = useLocation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<'all' | 'note' | 'budget'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedItemsForDiscount, setSelectedItemsForDiscount] = useState<number[]>([]);
  const [handledEditId, setHandledEditId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    manual_client_name: '',
    manual_vehicle_model: '',
    manual_plate: '',
    mode: 'select' as 'select' | 'manual',
    document_type: 'note' as 'note' | 'budget',
    payment_status: 'unpaid' as 'paid' | 'unpaid' | 'partial',
    paid_amount: 0,
    items: [] as { description: string; price: number; quantity: number; type: 'service' | 'part'; discount_percent?: number }[]
  });
  const [newItem, setNewItem] = useState({ description: '', price: 0, quantity: 1, type: 'part' as 'service' | 'part' });

  useEffect(() => {
    fetchNotes();
    fetchVehicles();
  }, []);

  const fetchNotes = async () => {
    try {
      const data = await financeService.listNotes();
      setNotes(data);
    } catch (err) {
      console.error('Failed to fetch notes', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.list();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    }
  };

  const fetchNoteDetails = async (id: number) => {
    try {
      const data = await financeService.getNote(id);
      setViewingNote(data);
    } catch (err) {
      console.error('Failed to fetch note details', err);
    }
  };

  const getItemPrice = (item: Pick<NoteItem, 'price'>) => Number(item.price || 0);
  const getItemQuantity = (item: Pick<NoteItem, 'quantity' | 'type'>) =>
    item.type === 'service' ? 1 : Number(item.quantity || 1);
  const getItemSubtotal = (item: Pick<NoteItem, 'price' | 'quantity' | 'type' | 'discount_percent'>) => {
    const itemTotal = getItemPrice(item) * getItemQuantity(item);
    const discount = item.discount_percent ? itemTotal * (Number(item.discount_percent) / 100) : 0;
    return itemTotal - discount;
  };
  const formatMoneyValue = (value: unknown) => Number(value || 0).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.mode === 'select' && !formData.vehicle_id) return toast.error('Selecione um veículo');
    if (formData.mode === 'manual' && (!formData.manual_client_name || !formData.manual_vehicle_model || !formData.manual_plate)) {
      return toast.error('Preencha todos os dados do cliente e veículo');
    }
    if (formData.items.length === 0) return toast.error('Adicione pelo menos um item');

    let client_id = null;
    let vehicle_id = null;

    if (formData.mode === 'select') {
      const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id));
      if (!selectedVehicle) return;
      client_id = selectedVehicle.client_id;
      vehicle_id = selectedVehicle.id;
    }

    const total = formData.items.reduce((sum, item) => sum + getItemSubtotal(item), 0);

    const payload = {
      client_id,
      vehicle_id,
      manual_client_name: formData.mode === 'manual' ? formData.manual_client_name : null,
      manual_vehicle_model: formData.mode === 'manual' ? formData.manual_vehicle_model : null,
      manual_plate: formData.mode === 'manual' ? formData.manual_plate : null,
      document_type: formData.document_type,
      total_amount: total,
      payment_status: formData.payment_status,
      paid_amount: formData.paid_amount,
      items: formData.items
    };

    try {
      if (editingNote) {
        await financeService.updateNote(editingNote.id, payload);
      } else {
        await financeService.createNote(payload);
      }
      setIsModalOpen(false);
      setEditingNote(null);
      setFormData({
        vehicle_id: '',
        manual_client_name: '',
        manual_vehicle_model: '',
        manual_plate: '',
        mode: 'select',
        document_type: 'note',
        payment_status: 'unpaid',
        paid_amount: 0,
        items: []
      });
      fetchNotes();
      toast.success(editingNote ? 'Nota atualizada!' : 'Nota gerada com sucesso!');
    } catch (err) {
      console.error('Failed to save note', err);
      toast.error(err instanceof ApiError ? `Erro ao salvar nota: ${err.message}` : 'Erro de conexão ao salvar nota');
    }
  };

  const fillNoteForm = (note: Note) => {
    setEditingNote(note);
    setFormData({
      vehicle_id: note.vehicle_id?.toString() || '',
      manual_client_name: note.manual_client_name || '',
      manual_vehicle_model: note.manual_vehicle_model || '',
      manual_plate: note.manual_plate || '',
      mode: note.vehicle_id ? 'select' : 'manual',
      document_type: note.document_type || 'note',
      payment_status: note.payment_status || 'unpaid',
      paid_amount: note.paid_amount || 0,
      items: note.items?.map(i => ({
        description: i.description,
        price: i.price || 0,
        quantity: i.quantity,
        type: i.type,
        discount_percent: i.discount_percent || 0
      })) || []
    });
  };

  const openEditModal = async (note: Note) => {
    try {
      const noteWithItems = await financeService.getNote(note.id);
      fillNoteForm(noteWithItems);
      setViewingNote(null);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load note for edit', err);
      toast.error(err instanceof ApiError ? `Erro ao carregar nota: ${err.message}` : 'Erro de conexão ao carregar nota');
    }
  };

  useEffect(() => {
    const editId = Number(new URLSearchParams(location.search).get('edit'));
    if (!editId || handledEditId === editId) return;

    setHandledEditId(editId);
    openEditModal({ id: editId } as Note);
  }, [location.search, handledEditId]);

  const deleteNote = async (note: Note) => {
    const confirmation = window.prompt('Para excluir esta nota, digite exatamente: EU QUERO EXCLUIR');
    if (confirmation !== 'EU QUERO EXCLUIR') {
      toast.error('Exclusao cancelada. O texto de confirmacao nao confere.');
      return;
    }

    try {
      await financeService.removeNote(note.id);
      setViewingNote(null);
      if (editingNote?.id === note.id) {
        setEditingNote(null);
        setIsModalOpen(false);
      }
      await fetchNotes();
      toast.success('Nota excluida');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro de conexao ao excluir nota');
    }
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setFormData({
      vehicle_id: '',
      manual_client_name: '',
      manual_vehicle_model: '',
      manual_plate: '',
      mode: 'select',
      document_type: 'note',
      payment_status: 'unpaid',
      paid_amount: 0,
      items: []
    });
    setIsModalOpen(true);
  };

  const applyDiscount = () => {
    const newItems = [...formData.items];
    selectedItemsForDiscount.forEach(idx => {
      newItems[idx] = { ...newItems[idx], discount_percent: discountPercent };
    });
    setFormData({ ...formData, items: newItems });
    setDiscountModalOpen(false);
    setSelectedItemsForDiscount([]);
    setDiscountPercent(0);
  };

  const addItem = () => {
    if (newItem.description) {
      const itemToAdd = {
        ...newItem,
        quantity: newItem.type === 'service' ? 1 : newItem.quantity
      };
      setFormData({ ...formData, items: [...formData.items, itemToAdd] });
      setNewItem({ description: '', price: 0, quantity: 1, type: 'service' });
    }
  };

  const removeItem = (idx: number) => {
    const newItems = [...formData.items];
    newItems.splice(idx, 1);
    setFormData({ ...formData, items: newItems });
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.id.toString().includes(searchTerm);
    const matchesDocument = documentFilter === 'all' || note.document_type === documentFilter;
    const matchesPayment = paymentFilter === 'all' || note.payment_status === paymentFilter;

    return matchesSearch && matchesDocument && matchesPayment;
  });

  const cleanupPrintMode = () => {
    document.body.classList.remove('printing-document');
    window.removeEventListener('afterprint', cleanupPrintMode);
  };

  const handlePrint = () => {
    document.body.classList.add('printing-document');
    window.addEventListener('afterprint', cleanupPrintMode);
    setTimeout(() => {
      window.print();
    }, 100);
    window.setTimeout(cleanupPrintMode, 3000);
  };

  const handleShare = async () => {
    if (!viewingNote) return;

    // Try Web Share API first (works on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${viewingNote.document_type === 'budget' ? 'Orçamento' : 'Nota de Serviço'} #${viewingNote.id}`,
          text: `Confira o ${viewingNote.document_type === 'budget' ? 'orçamento' : 'nota de serviço'} da Santos Automotive para o veículo ${viewingNote.vehicle_model} (${viewingNote.plate}). Total: R$ ${formatMoneyValue(viewingNote.total_amount)}`,
          url: window.location.href
        });
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        } else {
          return; // User cancelled
        }
      }
    }

    // Fallback to print (which allows saving as PDF)
    handlePrint();
  };

  const calculateTotals = (items: Array<Pick<NoteItem, 'price' | 'quantity' | 'type' | 'discount_percent'>>) => {
    const services = items.filter(i => i.type === 'service').reduce((sum, i) => sum + getItemSubtotal(i), 0);
    const parts = items.filter(i => i.type === 'part').reduce((sum, i) => sum + getItemSubtotal(i), 0);
    return { services, parts, total: services + parts };
  };

  const currentTotals = calculateTotals(formData.items);
  const viewingTotals = viewingNote ? calculateTotals(viewingNote.items || []) : { services: 0, parts: 0, total: 0 };
  const viewingItems = viewingNote?.items || [];
  const viewingServices = viewingItems.filter(item => item.type === 'service');
  const viewingParts = viewingItems.filter(item => item.type === 'part');
  const filledRowsCount =
    viewingItems.length +
    (viewingServices.length > 0 ? 1 : 0) +
    (viewingParts.length > 0 ? 1 : 0);

  return (
    <>
      {viewingNote && (
        <div className="print-document-root">
          <ServiceNotePrintView note={viewingNote} />
        </div>
      )}
      <div className="space-y-6 print-scope-hidden">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 print:hidden">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-brand-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, placa ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`bg-white px-4 py-3 rounded-2xl border flex items-center justify-center gap-2 font-bold text-sm transition-colors ${
            showFilters || documentFilter !== 'all' || paymentFilter !== 'all'
              ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/5'
              : 'text-surface-600 border-surface-200 hover:bg-surface-50'
          }`}
        >
          <Filter className="w-4 h-4" /> Filtros
        </button>
        <button 
          onClick={openCreateModal}
          className="bg-brand-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nova Nota Manual
        </button>
      </div>

      {showFilters && (
        <div className="bg-white border border-surface-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 print:hidden">
          <select
            value={documentFilter}
            onChange={(e) => setDocumentFilter(e.target.value as typeof documentFilter)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todos os documentos</option>
            <option value="note">Notas</option>
            <option value="budget">Orçamentos</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as typeof paymentFilter)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todos os pagamentos</option>
            <option value="unpaid">Não pago</option>
            <option value="partial">Parcial</option>
            <option value="paid">Pago</option>
          </select>
        </div>
      )}

      <div className="print:hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white border border-surface-200 rounded-[2rem] p-12 text-center">
            <div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <StickyNote className="w-8 h-8 text-surface-300" />
            </div>
            <h3 className="text-lg font-bold text-surface-900">Nenhuma nota encontrada</h3>
            <p className="text-surface-500">As notas são geradas automaticamente quando uma OS é concluída ou podem ser criadas manualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={note.id}
                className="bg-white border border-surface-200 rounded-[2rem] p-6 hover:shadow-xl hover:shadow-surface-900/5 transition-all group cursor-pointer"
                onClick={() => fetchNoteDetails(note.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                    <StickyNote className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Nota #</span>
                    <p className="text-lg font-display font-bold text-surface-900">{note.id}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-surface-400" />
                    <span className="text-sm font-bold text-surface-900">{note.client_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CarIcon className="w-4 h-4 text-surface-400" />
                    <span className="text-sm font-medium text-surface-600">{note.vehicle_model} • <span className="font-bold">{note.plate}</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-surface-400" />
                    <span className="text-sm text-surface-500">{new Date(note.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                  <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Total</span>
                      <span className="text-lg font-display font-bold text-brand-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(note.total_amount)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(note); }}
                        className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                        title="Editar Nota"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNote(note); }}
                        className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        title="Excluir Nota"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all">
                        <Eye className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Note Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold text-surface-900">
                  {editingNote ? `Editar ${formData.document_type === 'note' ? 'Nota' : 'Orçamento'} #${editingNote.id}` : `Nova ${formData.document_type === 'note' ? 'Nota' : 'Orçamento'}`}
                </h2>
                <div className="flex items-center gap-2">
                  {editingNote && (
                    <button
                      type="button"
                      onClick={() => deleteNote(editingNote)}
                      className="p-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                      title="Excluir Nota"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button onClick={() => { setIsModalOpen(false); setEditingNote(null); }} className="p-2 hover:bg-surface-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex bg-surface-100 p-1 rounded-2xl">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, mode: 'select' })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${formData.mode === 'select' ? 'bg-white text-brand-primary shadow-sm' : 'text-surface-500'}`}
                    >
                      Selecionar Existente
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, mode: 'manual' })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${formData.mode === 'manual' ? 'bg-white text-brand-primary shadow-sm' : 'text-surface-500'}`}
                    >
                      Entrada Manual
                    </button>
                  </div>
                  <div className="flex bg-surface-100 p-1 rounded-2xl">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, document_type: 'note' })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${formData.document_type === 'note' ? 'bg-white text-brand-primary shadow-sm' : 'text-surface-500'}`}
                    >
                      Nota de Serviço
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, document_type: 'budget' })}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${formData.document_type === 'budget' ? 'bg-white text-brand-primary shadow-sm' : 'text-surface-500'}`}
                    >
                      Orçamento
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.mode === 'select' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Veículo / Cliente</label>
                      <select 
                        required
                        className="w-full px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none font-medium"
                        value={formData.vehicle_id}
                        onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })}
                      >
                        <option value="">Selecione um veículo...</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.plate} - {v.model} ({v.client_name})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Nome do Cliente</label>
                        <input 
                          required
                          type="text"
                          className="w-full px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-medium"
                          value={formData.manual_client_name}
                          onChange={e => setFormData({ ...formData, manual_client_name: e.target.value })}
                          placeholder="Ex: João Silva"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Modelo do Veículo</label>
                        <input 
                          required
                          type="text"
                          className="w-full px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-medium"
                          value={formData.manual_vehicle_model}
                          onChange={e => setFormData({ ...formData, manual_vehicle_model: e.target.value })}
                          placeholder="Ex: Honda Civic"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Placa</label>
                        <IMaskInput
                          mask={[
                            { mask: 'aaa-0000' },
                            { mask: 'aaa0a00' }
                          ]}
                          prepare={(str) => str.toUpperCase()}
                          required
                          className="w-full px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-medium uppercase"
                          value={formData.manual_plate}
                          onAccept={(value) => setFormData({ ...formData, manual_plate: value })}
                          placeholder="Ex: ABC-1234"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Status de Pagamento</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all appearance-none font-medium"
                        value={formData.payment_status}
                        onChange={e => setFormData({ ...formData, payment_status: e.target.value as any })}
                      >
                        <option value="unpaid">Não Pago</option>
                        <option value="partial">Parcial</option>
                        <option value="paid">Pago</option>
                      </select>
                      {formData.payment_status === 'partial' && (
                        <input 
                          type="number"
                          placeholder="Valor Pago"
                          className="w-32 px-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-bold"
                          value={formData.paid_amount || ''}
                          onChange={e => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-surface-50 p-6 rounded-2xl border border-surface-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h4 className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Itens da Nota</h4>
                      <button 
                        type="button"
                        onClick={() => setDiscountModalOpen(true)}
                        className="text-[10px] font-bold text-brand-primary uppercase tracking-widest hover:underline"
                      >
                        Aplicar Desconto
                      </button>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentTotals.total)}</span>
                      <div className="flex gap-4 mt-1">
                        <span className="text-[8px] font-bold text-surface-400 uppercase tracking-widest">Serviços: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentTotals.services)}</span>
                        <span className="text-[8px] font-bold text-surface-400 uppercase tracking-widest">Peças: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentTotals.parts)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-2">
                      <select 
                        className="w-full px-3 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-xs font-bold appearance-none"
                        value={newItem.type}
                        onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}
                      >
                        <option value="part">Peça</option>
                        <option value="service">Serviço</option>
                      </select>
                    </div>
                    <div className="sm:col-span-4 relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input 
                        placeholder="Descrição..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-medium"
                        value={newItem.description}
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                      />
                    </div>
                    {newItem.type === 'part' && (
                      <div className="sm:col-span-2 relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="Qtd"
                          className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold"
                          value={newItem.quantity || ''}
                          onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                    <div className={newItem.type === 'part' ? "sm:col-span-2 relative" : "sm:col-span-4 relative"}>
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input 
                        type="number"
                        placeholder="Preço (Opcional)"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold"
                        value={newItem.price || ''}
                        onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={addItem}
                      className="sm:col-span-2 bg-brand-primary text-white p-3 rounded-xl hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-surface-200 shadow-sm">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${item.type === 'service' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {item.type === 'service' ? 'Serviço' : 'Peça'}
                              </span>
                              <span className="text-sm font-bold text-surface-800">{item.description}</span>
                              {item.discount_percent ? (
                                <span className="text-[8px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded">-{item.discount_percent}%</span>
                              ) : null}
                            </div>
                            {item.type === 'part' && (
                              <span className="text-[10px] text-surface-400 font-bold uppercase tracking-widest">Qtd: {item.quantity}</span>
                            )}
                          </div>
                          <div className="flex gap-4 items-center">
                            <div className="flex flex-col items-end">
                              <span className={`font-bold ${item.discount_percent ? 'text-surface-400 line-through text-xs' : 'text-surface-900'}`}>
                                {getItemPrice(item) > 0 ? `R$ ${formatMoneyValue(getItemPrice(item) * getItemQuantity(item))}` : 'A definir'}
                              </span>
                              {item.discount_percent ? (
                                <span className="font-bold text-brand-primary">
                                  R$ {formatMoneyValue(getItemSubtotal(item))}
                                </span>
                              ) : null}
                            </div>
                            <button type="button" onClick={() => removeItem(idx)} className="p-1.5 hover:bg-brand-accent/10 text-surface-300 hover:text-brand-accent transition-colors rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-brand-primary/20 active:scale-[0.99]"
                >
                  {editingNote ? 'Salvar Alterações' : 'Gerar Nota'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Discount Modal */}
      <AnimatePresence>
        {discountModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-display font-bold text-surface-900 mb-6">Aplicar Desconto</h3>
              
              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Porcentagem de Desconto (%)</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input 
                      type="number"
                      className="w-full pl-12 pr-4 py-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-bold text-lg"
                      placeholder="0"
                      value={discountPercent || ''}
                      onChange={e => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Selecionar Itens para Aplicar</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-surface-100 rounded-2xl p-3 bg-surface-50">
                    {formData.items.map((item, idx) => (
                      <label key={idx} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${selectedItemsForDiscount.includes(idx) ? 'bg-white border-brand-primary shadow-sm' : 'bg-transparent border-transparent hover:bg-white/50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedItemsForDiscount.includes(idx) ? 'bg-brand-primary border-brand-primary' : 'border-surface-300'}`}>
                            {selectedItemsForDiscount.includes(idx) && <Plus className="w-3 h-3 text-white" />}
                          </div>
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={selectedItemsForDiscount.includes(idx)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedItemsForDiscount([...selectedItemsForDiscount, idx]);
                              else setSelectedItemsForDiscount(selectedItemsForDiscount.filter(i => i !== idx));
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-surface-900">{item.description}</span>
                            <span className="text-[10px] text-surface-400 font-bold uppercase tracking-widest">{item.type === 'service' ? 'Serviço' : 'Peça'}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-surface-600">R$ {formatMoneyValue(getItemPrice(item) * getItemQuantity(item))}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setDiscountModalOpen(false)}
                  className="flex-1 py-3 bg-surface-100 text-surface-600 rounded-xl font-bold hover:bg-surface-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={applyDiscount}
                  className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
                >
                  Aplicar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Detail Modal */}
      <AnimatePresence>
        {viewingNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md print:p-0 print:bg-white print:static print:z-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none print:w-full print:static"
            >
              <div className="p-6 border-b border-surface-100 flex items-center justify-between print:hidden">
                <h3 className="text-xl font-display font-bold">{viewingNote.document_type === 'budget' ? 'Orçamento' : 'Nota de Serviço'} #{viewingNote.id}</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 bg-surface-50 hover:bg-surface-100 text-surface-600 rounded-xl transition-colors flex items-center gap-2"
                    title="Imprimir ou Salvar como PDF"
                  >
                    <Printer className="w-5 h-5" />
                    <span className="text-sm font-bold">Imprimir</span>
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-xl transition-colors flex items-center gap-2"
                    title="Compartilhar como PDF"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-bold">Compartilhar</span>
                  </button>
                  <button
                    onClick={() => deleteNote(viewingNote)}
                    className="p-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-colors flex items-center gap-2"
                    title="Excluir Nota"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-sm font-bold">Excluir</span>
                  </button>
                  <button 
                    onClick={() => setViewingNote(null)}
                    className="p-2 bg-surface-50 hover:bg-surface-100 text-surface-600 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 print:overflow-visible print:p-0 bg-white print:text-black">
                {/* Print Header - Matching Image Precisely */}
                <div className="text-center mb-4">
                  <h1 className="text-sm font-bold italic uppercase tracking-tight">R.A SANTOS COMERCIO DE PEÇAS ACESSORIOS E SERVIÇOS</h1>
                  <p className="text-[12px] font-bold uppercase italic mt-1">{viewingNote.document_type === 'budget' ? 'ORÇAMENTO' : 'NOTA DE SERVIÇO'}</p>
                  <div className="mt-1">
                    <p className="text-[10px] font-bold">CNPJ: 21.418.588/0001-78 &nbsp;&nbsp; TEL: (21) 99895-6306</p>
                    <p className="text-[10px] font-bold italic">RUA ALMERINDA FERREIRA DE ALMEIDA N:239</p>
                    <p className="text-[10px] font-bold italic uppercase">PAPUCAIA CACHOEIRAS DE MACACU</p>
                  </div>
                </div>

                {/* Document Info - Matching Image Precisely */}
                <div className="space-y-0.5 mb-4 text-[10px] font-bold uppercase italic">
                  <p>DATA: {new Date(viewingNote.created_at).toLocaleDateString('pt-BR')}</p>
                  <p>VEICULO: {viewingNote.vehicle_model}</p>
                  <p>PLACA: {viewingNote.plate}</p>
                  <p>PROXIMA TROCA DE OLEO E FILTRO: ___________________________________</p>
                  <p>CLIENTE: {viewingNote.client_name}</p>
                </div>

                {/* Items Table - Grid Style Matching Image Precisely */}
                <div className="mb-0">
                  <table className="w-full border-collapse border border-black">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="border-r border-black py-0.5 px-1 text-[9px] font-bold uppercase w-10 text-center">Qut.</th>
                        <th className="border-r border-black py-0.5 px-1 text-[9px] font-bold uppercase">Descrição</th>
                        <th className="border-r border-black py-0.5 px-1 text-[9px] font-bold uppercase w-24 text-center">Preço unit.</th>
                        <th className="py-0.5 px-1 text-[9px] font-bold uppercase w-24 text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingServices.length > 0 && (
                        <tr className="border-b border-black h-5 bg-surface-100">
                          <td colSpan={4} className="px-1 text-[9px] font-bold uppercase italic">Servicos / Mao de obra</td>
                        </tr>
                      )}
                      {viewingServices.map((item, idx) => (
                        <tr key={`service-${idx}`} className="border-b border-black h-5">
                          <td className="border-r border-black px-1 text-[9px] font-bold text-center">1</td>
                          <td className="border-r border-black px-1 text-[9px] font-bold uppercase italic">
                            {item.description}
                            {item.discount_percent ? ` (-${item.discount_percent}%)` : ''}
                          </td>
                          <td className="border-r border-black px-1 text-[9px] font-bold text-right">
                            R$ {formatMoneyValue(item.price)}
                          </td>
                          <td className="px-1 text-[9px] font-bold text-right">
                            R$ {formatMoneyValue(getItemSubtotal(item))}
                          </td>
                        </tr>
                      ))}
                      {viewingParts.length > 0 && (
                        <tr className="border-b border-black h-5 bg-surface-100">
                          <td colSpan={4} className="px-1 text-[9px] font-bold uppercase italic">Pecas / Itens aplicados</td>
                        </tr>
                      )}
                      {viewingParts.map((item, idx) => (
                        <tr key={`part-${idx}`} className="border-b border-black h-5">
                          <td className="border-r border-black px-1 text-[9px] font-bold text-center">
                            {getItemQuantity(item)}
                          </td>
                          <td className="border-r border-black px-1 text-[9px] font-bold uppercase italic">
                            {item.description}
                            {item.discount_percent ? ` (-${item.discount_percent}%)` : ''}
                          </td>
                          <td className="border-r border-black px-1 text-[9px] font-bold text-right">
                            R$ {formatMoneyValue(item.price)}
                          </td>
                          <td className="px-1 text-[9px] font-bold text-right">
                            R$ {formatMoneyValue(getItemSubtotal(item))}
                          </td>
                        </tr>
                      ))}
                      {/* Empty Rows to fill space like in the image */}
                      {Array.from({ length: Math.max(0, 30 - filledRowsCount) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="border-b border-black h-5">
                          <td className="border-r border-black px-1"></td>
                          <td className="border-r border-black px-1"></td>
                          <td className="border-r border-black px-1 text-[9px] font-bold">R$</td>
                          <td className="px-1 text-[9px] font-bold">R$</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Section - Matching Image Layout Precisely */}
                <div className="w-40 mt-0">
                  <table className="w-full border-collapse border border-black border-t-0 text-[10px] font-bold uppercase italic">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="border-r border-black px-1 py-0.5 w-16">Peças</td>
                        <td className="px-1 py-0.5 text-right">R$ {formatMoneyValue(viewingTotals.parts)}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="border-r border-black px-1 py-0.5">Serviço</td>
                        <td className="px-1 py-0.5 text-right">R$ {formatMoneyValue(viewingTotals.services)}</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black px-1 py-0.5">Valor total</td>
                        <td className="px-1 py-0.5 text-right">R$ {formatMoneyValue(viewingTotals.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Payment Info (Custom addition for utility) */}
                {viewingNote.payment_status !== 'unpaid' && (
                  <div className="mt-4 text-[10px] font-bold uppercase italic text-surface-600">
                    PAGAMENTO: {viewingNote.payment_status === 'paid' ? 'TOTALMENTE PAGO' : `PARCIAL (PAGO R$ ${formatMoneyValue(viewingNote.paid_amount)})`}
                    {viewingNote.payment_status === 'partial' && ` - SALDO: R$ ${formatMoneyValue(viewingTotals.total - (viewingNote.paid_amount || 0))}`}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}

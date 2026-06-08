import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit2, CheckCircle2, Clock, AlertCircle, X, Wrench, Package, Car, User, Hash, Camera, Filter, Receipt, ChevronRight, Printer, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ServiceOrder, OrderItem, Vehicle, StaffMember } from '../types';
import MultiImageUpload from './MultiImageUpload';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../services/api';
import { diagnosticService, orderService, staffService, vehicleService } from '../services';
import { FormSection, LoadingState } from './ui';
import { CHECKLIST_ITEMS, CHECKLIST_STATUS_OPTIONS, createDefaultChecklist, normalizeChecklist } from '../utils/checklist';
import ServiceOrderPrintView from './print/ServiceOrderPrintView';
import {
  DIAGNOSTIC_RESULT_OPTIONS,
  DIAGNOSTIC_TEMPLATES,
  DiagnosticField,
  DiagnosticResultStatus,
  buildDiagnosticNotes,
  createEmptyDiagnosticValues,
  getDiagnosticCategories,
  getDiagnosticStatusLabel,
  getDiagnosticTemplate,
  getDiagnosticTemplateByName,
  isGuidedDiagnosticTest,
  parseDiagnosticNotes,
  summarizeDiagnosticTest
} from '../utils/diagnosticTemplates';

const ORDER_STATUS_OPTIONS: Array<{
  value: ServiceOrder['status'];
  label: string;
  shortLabel: string;
  helper: string;
  selectClass: string;
  badgeClass: string;
}> = [
  {
    value: 'pending',
    label: 'Recepcao / aguardando diagnostico',
    shortLabel: 'Recepcao',
    helper: 'O.S. aberta e aguardando triagem tecnica.',
    selectClass: 'bg-amber-50 text-amber-700 border-amber-100',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-100'
  },
  {
    value: 'in_progress',
    label: 'Em diagnostico / execucao',
    shortLabel: 'Em trabalho',
    helper: 'Servico em diagnostico, reparo ou testes.',
    selectClass: 'bg-brand-primary/5 text-brand-primary border-brand-primary/10',
    badgeClass: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'
  },
  {
    value: 'completed',
    label: 'Finalizada',
    shortLabel: 'Finalizada',
    helper: 'Servico finalizado, pronto para nota/pagamento.',
    selectClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100'
  }
];

const getOrderStatusMeta = (status: ServiceOrder['status']) =>
  ORDER_STATUS_OPTIONS.find((option) => option.value === status) || ORDER_STATUS_OPTIONS[0];

export default function OrdersTab({ onNavigate }: { onNavigate: (tab: any, options?: { search?: string }) => void }) {
  const { user } = useAuth();
  const canLoadStaff = user?.permissions === 'super_admin' || user?.permissions === 'admin';
  const canManageNotes = user?.permissions === 'super_admin' || user?.permissions === 'admin' || user?.permissions === 'attendant';
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceOrder['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'priority' | 'normal'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [modalMode, setModalMode] = useState<'full' | 'checklist' | 'tests'>('full');
  const [printOrder, setPrintOrder] = useState<ServiceOrder | null>(null);
  const [loadedTests, setLoadedTests] = useState<ServiceOrder['tests']>([]);
  const [selectedDiagnosticCategory, setSelectedDiagnosticCategory] = useState(getDiagnosticCategories()[0]);
  const [selectedDiagnosticTemplateKey, setSelectedDiagnosticTemplateKey] = useState(DIAGNOSTIC_TEMPLATES[0].key);
  const [diagnosticValues, setDiagnosticValues] = useState<Record<string, string>>(createEmptyDiagnosticValues(DIAGNOSTIC_TEMPLATES[0]));
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResultStatus>('inconclusivo');
  const [diagnosticObservations, setDiagnosticObservations] = useState('');
  const [manualTestName, setManualTestName] = useState('');
  
  const [formData, setFormData] = useState({
    vehicle_id: 0,
    technician_ids: [] as number[],
    description: '',
    status: 'pending' as const,
    notes: '',
    checklist: createDefaultChecklist() as Record<string, any>,
    items: [] as OrderItem[],
    checkin_images: [] as string[],
    tests: [] as { component_name: string; result: string; notes: string }[],
    entry_date: new Date().toISOString().split('T')[0],
    exit_date: '',
    is_priority: false
  });

  const [newItem, setNewItem] = useState<OrderItem>({ description: '', price: 0, quantity: 1, type: 'parts' });
  const diagnosticCategories = getDiagnosticCategories();
  const selectedDiagnosticTemplate = getDiagnosticTemplate(selectedDiagnosticTemplateKey) || DIAGNOSTIC_TEMPLATES[0];
  const guidedDiagnosticTests = formData.tests.filter((test) => isGuidedDiagnosticTest(test));
  const freeDiagnosticTests = formData.tests.filter((test) => !isGuidedDiagnosticTest(test));
  const canEditDiagnostics = user?.permissions !== 'attendant' && user?.permissions !== 'client';

  useEffect(() => {
    fetchOrders();
    fetchVehicles();
    if (canLoadStaff) {
      fetchStaff();
    } else {
      setStaff([]);
    }
  }, [canLoadStaff]);

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

  const fetchOrders = async () => {
    try {
      const data = await orderService.list();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error('Orders data is not an array:', data);
        setOrders([]);
      }
    } catch (err) { 
      console.error('Failed to fetch orders:', err);
      setOrders([]);
    } finally { 
      setLoading(false); 
    }
  };

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
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await staffService.listActive();
      if (Array.isArray(data)) {
        setStaff(data);
      } else {
        console.error('Staff data is not an array:', data);
        setStaff([]);
      }
    } catch (err) { 
      console.error('Failed to fetch staff:', err);
      setStaff([]);
    }
  };

  const safeParseImages = (imagesJson: any): string[] => {
    if (!imagesJson) return [];
    try {
      if (typeof imagesJson === 'string') {
        return JSON.parse(imagesJson);
      }
      if (Array.isArray(imagesJson)) return imagesJson;
      return [];
    } catch (e) {
      return [];
    }
  };

  const resetDiagnosticForm = (templateKey = selectedDiagnosticTemplateKey) => {
    const template = getDiagnosticTemplate(templateKey) || DIAGNOSTIC_TEMPLATES[0];
    setSelectedDiagnosticTemplateKey(template.key);
    setSelectedDiagnosticCategory(template.category);
    setDiagnosticValues(createEmptyDiagnosticValues(template));
    setDiagnosticResult('inconclusivo');
    setDiagnosticObservations('');
  };

  const loadDiagnosticTemplate = (templateKey: string, existingTest?: NonNullable<ServiceOrder['tests']>[number]) => {
    const template = getDiagnosticTemplate(templateKey);
    if (!template) return;

    setSelectedDiagnosticTemplateKey(template.key);
    setSelectedDiagnosticCategory(template.category);

    if (existingTest) {
      const parsed = parseDiagnosticNotes(template, existingTest.notes);
      setDiagnosticValues(parsed.values);
      setDiagnosticObservations(parsed.observations);
      setDiagnosticResult(
        DIAGNOSTIC_RESULT_OPTIONS.some((option) => option.value === existingTest.result)
          ? existingTest.result as DiagnosticResultStatus
          : 'inconclusivo'
      );
      return;
    }

    const savedTest = formData.tests.find((test) => test.component_name === template.name);
    if (savedTest) {
      const parsed = parseDiagnosticNotes(template, savedTest.notes);
      setDiagnosticValues(parsed.values);
      setDiagnosticObservations(parsed.observations);
      setDiagnosticResult(
        DIAGNOSTIC_RESULT_OPTIONS.some((option) => option.value === savedTest.result)
          ? savedTest.result as DiagnosticResultStatus
          : 'inconclusivo'
      );
      return;
    }

    resetDiagnosticForm(template.key);
  };

  const updateDiagnosticField = (fieldKey: string, value: string) => {
    setDiagnosticValues((current) => ({ ...current, [fieldKey]: value }));
  };

  const saveGuidedDiagnosticToForm = () => {
    if (!canEditDiagnostics) {
      toast.error('Seu perfil pode visualizar diagnosticos, mas nao alterar testes tecnicos.');
      return;
    }

    const notes = buildDiagnosticNotes(selectedDiagnosticTemplate, diagnosticValues, diagnosticObservations);
    const nextTest = {
      component_name: selectedDiagnosticTemplate.name,
      result: diagnosticResult,
      notes
    };

    const existingIndex = formData.tests.findIndex((test) => test.component_name === selectedDiagnosticTemplate.name);
    const nextTests = [...formData.tests];

    if (existingIndex >= 0) {
      nextTests[existingIndex] = { ...nextTests[existingIndex], ...nextTest };
    } else {
      nextTests.push(nextTest);
    }

    setFormData({ ...formData, tests: nextTests });
    toast.success('Diagnostico guiado adicionado ao resumo. Clique em Salvar para gravar na O.S.');
  };

  const addManualDiagnosticTest = () => {
    const name = manualTestName.trim();
    if (!name) {
      toast.error('Informe o nome do teste livre.');
      return;
    }

    if (formData.tests.some((test) => test.component_name.toLowerCase() === name.toLowerCase())) {
      toast.error('Esse teste ja foi adicionado.');
      return;
    }

    setFormData({
      ...formData,
      tests: [...formData.tests, { component_name: name, result: '', notes: '' }]
    });
    setManualTestName('');
  };

  const removeDiagnosticTestFromForm = (index: number) => {
    const nextTests = [...formData.tests];
    nextTests.splice(index, 1);
    setFormData({ ...formData, tests: nextTests });
  };

  const saveTestsOnly = async () => {
    if (!editingOrder) return;
    if (!canEditDiagnostics) {
      toast.error('Seu perfil pode visualizar diagnosticos, mas nao alterar testes tecnicos.');
      return;
    }

    try {
      const keptIds = new Set(formData.tests.map((test) => test.id).filter(Boolean));
      const removedTests = (loadedTests || []).filter((test) => test.id && !keptIds.has(test.id));

      await Promise.all(removedTests.map((test) => diagnosticService.removeOrderTest(test.id!)));
      await Promise.all(formData.tests.map((test) => diagnosticService.saveOrderTest(editingOrder.id, {
        component_name: test.component_name,
        result: test.result,
        notes: test.notes
      })));

      const updatedTests = await diagnosticService.getOrderTests(editingOrder.id);
      setFormData({ ...formData, tests: updatedTests });
      setLoadedTests(updatedTests);
      await fetchOrders();
      setIsModalOpen(false);
      toast.success('Diagnosticos salvos na O.S.');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof ApiError ? err.message : 'Erro ao salvar diagnosticos');
    }
  };

  const renderDiagnosticField = (field: DiagnosticField) => {
    const value = diagnosticValues[field.key] || '';
    const baseClass = 'w-full px-3 py-2 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium';

    return (
      <div key={field.key} className={field.type === 'textarea' ? 'space-y-1 sm:col-span-2' : 'space-y-1'}>
        <label className="text-[10px] font-bold text-surface-500 uppercase ml-1">{field.label}</label>
        {field.type === 'select' ? (
          <select className={baseClass} value={value} onChange={(e) => updateDiagnosticField(field.key, e.target.value)}>
            <option value="">Selecione</option>
            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea
            rows={3}
            className={baseClass}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => updateDiagnosticField(field.key, e.target.value)}
          />
        ) : (
          <div className="relative">
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              step={field.type === 'number' ? 'any' : undefined}
              className={`${baseClass} ${field.unit ? 'pr-12' : ''}`}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => updateDiagnosticField(field.key, e.target.value)}
            />
            {field.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-surface-400">{field.unit}</span>}
          </div>
        )}
        {field.reference && <p className="text-[10px] font-semibold text-brand-primary ml-1">{field.reference}</p>}
      </div>
    );
  };

  const handleOpenModal = async (order?: ServiceOrder, mode: 'full' | 'checklist' | 'tests' = 'full') => {
    setModalMode(mode);
    if (order) {
      setEditingOrder(order);
      try {
        const data = await orderService.get(order.id);
        setFormData({
          vehicle_id: data.vehicle_id,
          technician_ids: data.technician_ids || [],
          description: data.description || '',
          status: data.status,
          notes: data.notes || '',
          checklist: normalizeChecklist(data.checklist),
          items: data.items || [],
          checkin_images: safeParseImages(data.checkin_images),
          tests: data.tests || [],
          entry_date: data.entry_date ? new Date(data.entry_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          exit_date: data.exit_date ? new Date(data.exit_date).toISOString().split('T')[0] : '',
          is_priority: !!data.is_priority
        });
        setLoadedTests(data.tests || []);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        toast.error(err instanceof ApiError ? err.message : 'Erro ao carregar ordem');
      }
    } else {
      setEditingOrder(null);
      setFormData({ 
        vehicle_id: vehicles[0]?.id || 0, 
        technician_ids: [], 
        description: '', 
        status: 'pending', 
        notes: '', 
        checklist: createDefaultChecklist(),
        items: [], 
        checkin_images: [],
        tests: [],
        entry_date: new Date().toISOString().split('T')[0],
        exit_date: '',
        is_priority: false
      });
      setLoadedTests([]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalMode === 'tests' && editingOrder) {
      await saveTestsOnly();
      return;
    }

    if (!formData.vehicle_id) {
      toast.error('Selecione o veiculo da O.S.');
      return;
    }

    const description = formData.description.trim();
    if (!description) {
      toast.error('Informe a queixa inicial ou o servico solicitado.');
      return;
    }

    const invalidItem = formData.items.find((item) => !item.description?.trim() || Number(item.price) < 0 || Number(item.quantity || 1) <= 0);
    if (invalidItem) {
      toast.error('Revise os itens da O.S.: descricao, quantidade e valor precisam estar validos.');
      return;
    }
    
    let create_note = false;
    if (formData.status === 'completed' && (!editingOrder || editingOrder.status !== 'completed')) {
      create_note = window.confirm('Deseja converter esta Ordem de Serviço em uma Nota de Serviço?');
    }

    try {
      const payload = {
        ...formData,
        description,
        notes: formData.notes.trim(),
        items: formData.items.map((item) => ({
          ...item,
          description: item.description.trim(),
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1
        }))
      };

      if (editingOrder) {
        await orderService.update(editingOrder.id, { ...payload, create_note });
      } else {
        await orderService.create({ ...payload, create_note });
      }
      fetchOrders();
      setIsModalOpen(false);
      toast.success(editingOrder ? 'Ordem atualizada!' : 'Ordem criada com sucesso!');
    } catch (err) { 
      console.error(err);
      toast.error(err instanceof ApiError ? err.message : 'Erro de conexão ao salvar ordem');
    }
  };

  const deleteOrder = async (id: number) => {
    const confirmation = window.prompt('Para excluir esta O.S., digite exatamente: EU QUERO EXCLUIR');
    if (confirmation !== 'EU QUERO EXCLUIR') {
      toast.error('Exclusao cancelada. O texto de confirmacao nao confere.');
      return;
    }

    try {
      await orderService.remove(id);
      fetchOrders();
      toast.success('Ordem excluida');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro de conexao');
    }
  };

  const generateNoteFromOrder = async (order: ServiceOrder) => {
    if (order.note_id) {
      onNavigate('notes', { search: `?edit=${order.note_id}` });
      return;
    }

    if (!window.confirm(`Gerar Nota de Servico da OS #${order.id}?`)) return;

    try {
      await orderService.generateNote(order.id);
      await fetchOrders();
      toast.success('Nota de servico gerada a partir da O.S.');
      onNavigate('notes');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao gerar nota da O.S.');
    }
  };

  const cleanupPrintMode = () => {
    document.body.classList.remove('printing-document');
    setPrintOrder(null);
    window.removeEventListener('afterprint', cleanupPrintMode);
  };

  const handlePrintOrder = async (orderSummary: ServiceOrder) => {
    try {
      const orderDetails = await orderService.get(orderSummary.id);
      const printableOrder: ServiceOrder = {
        ...orderSummary,
        ...orderDetails,
        vehicle_model: orderDetails.vehicle_model || orderSummary.vehicle_model,
        plate: orderDetails.plate || orderSummary.plate,
        customer_name: orderDetails.customer_name || orderSummary.customer_name,
        customer_phone: orderDetails.customer_phone || orderSummary.customer_phone,
        technician_names: orderDetails.technician_names || orderSummary.technician_names,
        note_id: orderDetails.note_id || orderSummary.note_id,
        checkin_images: safeParseImages(orderDetails.checkin_images)
      };

      setPrintOrder(printableOrder);
      document.body.classList.add('printing-document');
      window.addEventListener('afterprint', cleanupPrintMode);
      window.setTimeout(() => window.print(), 80);
      window.setTimeout(cleanupPrintMode, 3000);
    } catch (err) {
      document.body.classList.remove('printing-document');
      console.error('Erro ao imprimir OS:', err);
      toast.error(err instanceof ApiError ? err.message : 'Erro ao imprimir OS');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    let create_note = false;
    if (status === 'completed') {
      create_note = window.confirm('Deseja converter esta Ordem de Serviço em uma Nota de Serviço?');
    }

    try {
      await orderService.updateStatus(id, { status, create_note });
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao atualizar status');
    }
  };

  const addOrderItem = () => {
    const description = newItem.description.trim();
    const price = Number(newItem.price) || 0;
    const quantity = Number(newItem.quantity) || 1;

    if (!description) {
      toast.error('Informe a descricao do item ou servico.');
      return;
    }

    if (price <= 0) {
      toast.error('Informe um valor maior que zero para o item.');
      return;
    }

    if (quantity <= 0) {
      toast.error('Informe uma quantidade valida.');
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, description, price, quantity }]
    });
    setNewItem({ description: '', price: 0, quantity: 1, type: 'parts' });
  };

  const filteredOrders = orders.filter(o => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !normalizedSearch ||
      o.id.toString().includes(normalizedSearch) ||
      o.customer_name?.toLowerCase().includes(normalizedSearch) ||
      o.plate?.toLowerCase().includes(normalizedSearch) ||
      o.vehicle_model?.toLowerCase().includes(normalizedSearch) ||
      o.description?.toLowerCase().includes(normalizedSearch) ||
      o.technician_names?.some((name) => name.toLowerCase().includes(normalizedSearch));
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'all' ||
      (priorityFilter === 'priority' && o.is_priority) ||
      (priorityFilter === 'normal' && !o.is_priority);

    return matchesSearch && matchesStatus && matchesPriority;
  });
  const isFullModal = modalMode === 'full';
  const showChecklistModalSection = modalMode === 'full' || modalMode === 'checklist';
  const showTestsModalSection = modalMode === 'full' || modalMode === 'tests';
  const modalTitle =
    modalMode === 'checklist'
      ? 'Checklist da O.S.'
      : modalMode === 'tests'
        ? 'Diagnostico e testes da O.S.'
        : `${editingOrder ? 'Editar' : 'Nova'} Ordem de Servico`;
  const modalDescription =
    modalMode === 'checklist'
      ? 'Atualize a vistoria de entrada sem abrir a edicao completa.'
      : modalMode === 'tests'
        ? 'Atualize diagnosticos e testes sem abrir a edicao completa.'
        : 'Preencha os dados tecnicos do servico.';

  return (
    <>
      {printOrder && (
        <div className="print-document-root">
          <ServiceOrderPrintView order={printOrder} />
        </div>
      )}
      <div className="space-y-8 print-scope-hidden">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-brand-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por OS, cliente, placa, modelo ou tecnico..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`bg-white px-4 py-3.5 rounded-2xl border flex items-center gap-2 font-bold text-sm transition-colors ${
              showFilters || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/5'
                : 'text-surface-600 border-surface-200 hover:bg-surface-50'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>
          {user?.permissions !== 'technician' && (
            <button onClick={() => handleOpenModal()} className="bg-brand-primary text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all active:scale-95">
              <Plus className="w-5 h-5" /> Nova Ordem
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border border-surface-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em execução</option>
            <option value="completed">Concluída</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none font-medium text-sm"
          >
            <option value="all">Todas as prioridades</option>
            <option value="priority">Prioritárias</option>
            <option value="normal">Sem prioridade</option>
          </select>
        </div>
      )}

      {/* Orders List */}
      <div className="grid gap-5">
        {loading ? (
          <LoadingState label="Carregando ordens de serviço..." />
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-surface-300">
            <Receipt className="w-12 h-12 text-surface-200 mx-auto mb-4" />
            <p className="text-surface-500 font-medium">Nenhuma ordem de serviço encontrada.</p>
          </div>
        ) : filteredOrders.map(order => (
          <motion.div 
            layout 
            key={order.id} 
            className={`p-6 rounded-3xl border flex flex-col lg:flex-row justify-between gap-6 transition-all tech-card group ${
              order.is_priority 
                ? 'bg-red-50 border-red-300 shadow-xl shadow-red-100 ring-2 ring-red-300/70'
                : 'bg-white border-surface-200 hover:shadow-xl hover:shadow-surface-200/50'
            }`}
          >
            <div className="flex gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform ${
                order.is_priority ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-200' : 'bg-surface-50 text-brand-primary border-surface-100'
              }`}>
                <Car className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-display font-bold text-xl text-surface-900 flex items-center gap-2">
                    {order.vehicle_model}
                    {order.is_priority && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-full uppercase tracking-wide shadow-md shadow-red-200 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5" /> Prioridade
                      </span>
                    )}
                  </h3>
                  <span className="px-3 py-1 bg-surface-950 text-white text-[10px] font-mono font-bold rounded-lg tracking-wider uppercase shadow-sm">{order.plate}</span>
                </div>
                {order.description && (
                  <p className="text-sm font-bold text-brand-primary mb-2 line-clamp-1">{order.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-surface-500 font-medium">
                  <span className="flex items-center gap-2"><User className="w-4 h-4 text-brand-primary" />{order.customer_name}</span>
                  {order.technician_names && order.technician_names.length > 0 && (
                    <span className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-brand-primary" />
                      {order.technician_names.join(', ')}
                    </span>
                  )}
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-surface-400" />Entrada: {order.entry_date ? new Date(order.entry_date).toLocaleDateString('pt-BR') : (order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : 'N/A')}</span>
                  {order.exit_date && (
                    <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Saída: {new Date(order.exit_date).toLocaleDateString('pt-BR')}</span>
                  )}
                  <span className="flex items-center gap-2"><Hash className="w-4 h-4 text-surface-400" />OS #{order.id}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(order, 'checklist')}
                    className="px-3 py-2 bg-white border border-surface-200 text-surface-700 rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Checklist
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenModal(order, 'tests')}
                    className="px-3 py-2 bg-white border border-surface-200 text-surface-700 rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Diagnostico/Testes
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-8">
              {/* Check-in Images Preview */}
              {(() => {
                const imgs = safeParseImages(order.checkin_images);
                if (imgs.length === 0) return null;
                return (
                  <div className="flex -space-x-3">
                    {imgs.slice(0, 3).map((img, i) => (
                      <div key={i} className="w-10 h-10 rounded-xl border-2 border-white overflow-hidden bg-surface-100 shadow-sm ring-1 ring-surface-100">
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    {imgs.length > 3 && (
                      <div className="w-10 h-10 rounded-xl border-2 border-white bg-surface-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-surface-100">
                        +{imgs.length - 3}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="text-right">
                <p className="micro-label mb-1">Total Estimado</p>
                <p className="text-2xl font-bold text-brand-primary data-value">R$ {(order.total_amount || 0).toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select 
                    value={order.status} 
                    onChange={(e) => updateStatus(order.id, e.target.value)} 
                    className={`text-xs font-bold py-2.5 pl-4 pr-10 rounded-xl appearance-none cursor-pointer border transition-all ${getOrderStatusMeta(order.status).selectClass}`}
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="completed">Concluído</option>
                  </select>
                  <ChevronRight className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none opacity-50" />
                </div>
                
                {canManageNotes && (
                  <button 
                    onClick={() => generateNoteFromOrder(order)}
                    className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary/20 transition-all flex items-center gap-2 font-bold text-xs"
                    title={order.note_id ? 'Abrir nota da O.S.' : 'Gerar nota da O.S.'}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>{order.note_id ? 'Abrir Nota' : 'Gerar Nota'}</span>
                  </button>
                )}
                
                <div className="flex gap-1 bg-surface-50 p-1 rounded-xl border border-surface-200">
                  <button onClick={() => handlePrintOrder(order)} className="p-2 bg-white text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg transition-all hover:shadow-sm" title="Imprimir OS"><Printer className="w-4 h-4" /></button>
                  <button onClick={() => handleOpenModal(order)} className="p-2 bg-white text-brand-primary hover:bg-brand-primary hover:text-white rounded-lg transition-all hover:shadow-sm" title="Editar"><Edit2 className="w-4 h-4" /></button>
                  {user?.permissions !== 'technician' && (
                    <button onClick={() => deleteOrder(order.id)} className="p-2 bg-white text-brand-accent hover:bg-brand-accent hover:text-white rounded-lg transition-all hover:shadow-sm" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-surface-950/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="bg-white w-full max-w-3xl rounded-[2rem] p-8 shadow-2xl my-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-primary to-brand-secondary" />
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-display font-bold text-surface-900">{modalTitle}</h2>
                  <p className="text-sm text-surface-500 font-medium">{modalDescription}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-100 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {isFullModal && (
                <FormSection title="Cliente, veiculo, responsaveis e status" description="Vincule a O.S. ao veiculo atendido, tecnicos e etapa operacional.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!editingOrder && (
                    <div className="space-y-2">
                      <label className="micro-label ml-1">Veículo / Cliente</label>
                      <select 
                        required 
                        className="w-full p-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-medium transition-all" 
                        value={formData.vehicle_id} 
                        onChange={e => setFormData({...formData, vehicle_id: parseInt(e.target.value)})}
                      >
                        <option value="">Selecione um veículo</option>
                        {Array.isArray(vehicles) && vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model} ({v.client_name})</option>)}
                      </select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Técnicos Responsáveis</label>
                    {canLoadStaff ? (
                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-surface-50 border border-surface-200 rounded-2xl max-h-40 overflow-y-auto ${user?.permissions === 'technician' ? 'opacity-60 pointer-events-none' : ''}`}>
                        {Array.isArray(staff) && staff.map(s => (
                          <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded-lg transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.technician_ids.includes(s.id)}
                              onChange={(e) => {
                                const ids = e.target.checked
                                  ? [...formData.technician_ids, s.id]
                                  : formData.technician_ids.filter(id => id !== s.id);
                                setFormData({...formData, technician_ids: ids});
                              }}
                              className="w-4 h-4 text-brand-primary rounded border-surface-300 focus:ring-brand-primary"
                            />
                            <span className="text-sm font-medium text-surface-700">{s.name}</span>
                          </label>
                        ))}
                        {staff.length === 0 && <p className="text-xs text-surface-400 col-span-full">Nenhum técnico cadastrado.</p>}
                      </div>
                    ) : (
                      <p className="text-xs font-medium text-surface-400 bg-surface-50 border border-surface-200 rounded-2xl p-4">
                        Atribuição de técnico restrita a administradores.
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Status do Serviço</label>
                    <select 
                      className={`w-full p-4 border rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-bold transition-all ${getOrderStatusMeta(formData.status).selectClass}`}
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="completed">Concluído</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Prioridade</label>
                    <div 
                      onClick={() => setFormData({...formData, is_priority: !formData.is_priority})}
                      className={`w-full p-4 border rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                        formData.is_priority 
                          ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' 
                          : 'bg-surface-50 border-surface-200 text-surface-500'
                      }`}
                    >
                      <span className="font-bold text-sm">Marcar como Prioridade</span>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        formData.is_priority ? 'bg-brand-primary border-brand-primary' : 'border-surface-300'
                      }`}>
                        {formData.is_priority && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>
                </div>
                </FormSection>
                )}

                {isFullModal && (
                <FormSection title="Prazos da O.S." description="Controle datas de entrada e previsao ou saida sem alterar o schema atual.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Data de Entrada</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-bold transition-all" 
                      value={formData.entry_date} 
                      onChange={e => setFormData({...formData, entry_date: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="micro-label ml-1">Previsão/Data de Saída</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-bold transition-all" 
                      value={formData.exit_date} 
                      onChange={e => setFormData({...formData, exit_date: e.target.value})} 
                    />
                  </div>
                </div>
                </FormSection>
                )}

                {isFullModal && (
                <FormSection title="Queixa e descricao do servico" description="Registre o relato inicial e as observacoes internas da oficina.">
                <div className="space-y-2">
                  <label className="micro-label ml-1">Descrição do Serviço Principal</label>
                  <input 
                    disabled={user?.permissions === 'technician'}
                    required
                    placeholder="Ex: Revisão de 40.000km, Troca de Embreagem..."
                    className="w-full p-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-bold transition-all disabled:opacity-60" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="micro-label ml-1">Relato do Cliente / Observações</label>
                  <textarea 
                    rows={3}
                    placeholder="Descreva os sintomas ou observações adicionais..."
                    className="w-full p-4 bg-surface-50 border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary font-medium transition-all" 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})} 
                  />
                </div>

                </FormSection>
                )}

                {showChecklistModalSection && (
                <FormSection title="Vistoria de entrada" description="Registre fotos e checklist do estado do veiculo na chegada.">
                <MultiImageUpload 
                  label="Vistoria de Entrada (Fotos do Veículo)"
                  values={formData.checkin_images}
                  onChange={(imgs) => setFormData({ ...formData, checkin_images: imgs })}
                />

                {/* Checklist Section */}
                <div className="space-y-4 bg-surface-50 p-6 rounded-3xl border border-surface-200">
                  <h4 className="micro-label flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Checklist de Vistoria
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-surface-400 uppercase">Combustível</label>
                      <select 
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl text-xs font-bold outline-none"
                        value={formData.checklist.fuel_level}
                        onChange={e => setFormData({...formData, checklist: {...formData.checklist, fuel_level: e.target.value}})}
                      >
                        <option value="not_checked">Nao verificado</option>
                        <option value="Reserva">Reserva</option>
                        <option value="1/4">1/4</option>
                        <option value="1/2">1/2</option>
                        <option value="3/4">3/4</option>
                        <option value="Cheio">Cheio</option>
                      </select>
                    </div>
                    {CHECKLIST_ITEMS.map(item => (
                      <div key={item.key} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-surface-400 uppercase">{item.label}</label>
                        <div className="grid grid-cols-1 gap-1">
                          {CHECKLIST_STATUS_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setFormData({...formData, checklist: {...formData.checklist, [item.key]: option.value}})}
                              className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                formData.checklist[item.key] === option.value
                                  ? option.className
                                  : 'bg-white border-surface-200 text-surface-400'
                              }`}
                            >
                              {option.shortLabel}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </FormSection>
                )}

                {showTestsModalSection && (
                <FormSection title="Diagnostico guiado" description="Selecione um modelo tecnico, preencha apenas o que foi medido e salve no resumo da O.S.">
                <div className="space-y-5 bg-surface-50 p-4 sm:p-6 rounded-3xl border border-surface-200">
                  <div className="space-y-3">
                    <h3 className="micro-label">Modelos de diagnostico guiado</h3>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {diagnosticCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedDiagnosticCategory(category);
                            const firstTemplate = DIAGNOSTIC_TEMPLATES.find((template) => template.category === category);
                            if (firstTemplate) loadDiagnosticTemplate(firstTemplate.key);
                          }}
                          className={`whitespace-nowrap px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                            selectedDiagnosticCategory === category
                              ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                              : 'bg-white text-surface-600 border-surface-200 hover:border-brand-primary hover:text-brand-primary'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DIAGNOSTIC_TEMPLATES.filter((template) => template.category === selectedDiagnosticCategory).map((template) => (
                        <button
                          key={template.key}
                          type="button"
                          onClick={() => loadDiagnosticTemplate(template.key)}
                          className={`text-left p-3 rounded-2xl border transition-all ${
                            selectedDiagnosticTemplateKey === template.key
                              ? 'bg-white border-brand-primary text-brand-primary shadow-sm'
                              : 'bg-white/70 border-surface-200 text-surface-700 hover:border-brand-primary/40'
                          }`}
                        >
                          <span className="block text-xs font-black">{template.shortName}</span>
                          <span className="block text-[11px] font-semibold text-surface-400">{template.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`${canEditDiagnostics ? 'bg-white' : 'bg-surface-100'} p-4 rounded-3xl border border-surface-200 space-y-4`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-base font-display font-bold text-surface-900">{selectedDiagnosticTemplate.name}</h3>
                        <p className="text-xs font-medium text-surface-500">{selectedDiagnosticTemplate.category}</p>
                      </div>
                      <select
                        disabled={!canEditDiagnostics}
                        className="px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-60"
                        value={diagnosticResult}
                        onChange={(e) => setDiagnosticResult(e.target.value as DiagnosticResultStatus)}
                      >
                        {DIAGNOSTIC_RESULT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {!canEditDiagnostics && (
                      <p className="text-xs font-semibold text-surface-500 bg-white border border-surface-200 rounded-2xl p-3">
                        Seu perfil visualiza diagnosticos tecnicos, mas nao altera testes nesta etapa.
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[46vh] overflow-y-auto pr-1">
                      {selectedDiagnosticTemplate.fields.map(renderDiagnosticField)}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-surface-500 uppercase ml-1">Observacoes finais</label>
                        <textarea
                          disabled={!canEditDiagnostics}
                          rows={3}
                          className="w-full px-3 py-2 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium disabled:opacity-60"
                          placeholder="Conclusao, evidencia, proximo passo ou ressalva tecnica..."
                          value={diagnosticObservations}
                          onChange={(e) => setDiagnosticObservations(e.target.value)}
                        />
                      </div>
                    </div>

                    {canEditDiagnostics && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button type="button" onClick={saveGuidedDiagnosticToForm} className="btn-primary rounded-2xl py-3">
                          <CheckCircle2 className="w-4 h-4" />
                          Salvar no resumo
                        </button>
                        <button type="button" onClick={() => resetDiagnosticForm()} className="px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl text-sm font-bold text-surface-600 hover:bg-surface-100 transition-colors">
                          Limpar campos
                        </button>
                      </div>
                    )}
                  </div>

                  {canEditDiagnostics && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Teste livre ou componente manual..."
                        className="flex-1 px-4 py-3 bg-white border border-surface-200 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium"
                        value={manualTestName}
                        onChange={(e) => setManualTestName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addManualDiagnosticTest();
                          }
                        }}
                      />
                      <button type="button" onClick={addManualDiagnosticTest} className="px-4 py-3 bg-white border border-surface-200 rounded-2xl text-sm font-bold text-brand-primary hover:border-brand-primary transition-colors">
                        + Teste livre
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="micro-label">Resumo dos diagnosticos salvos</h3>
                    {formData.tests.length === 0 ? (
                      <p className="text-center py-4 text-surface-400 text-xs font-medium italic">Nenhum diagnostico registrado nesta O.S.</p>
                    ) : (
                      <>
                        {guidedDiagnosticTests.map((test) => {
                          const originalIndex = formData.tests.indexOf(test);
                          const summary = summarizeDiagnosticTest(test);
                          const template = getDiagnosticTemplateByName(test.component_name);
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={`${test.component_name}-${originalIndex}`}
                              className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div>
                                  <span className="text-sm font-bold text-brand-primary flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {summary.title}
                                  </span>
                                  {summary.category && <p className="text-[11px] font-bold text-surface-400 uppercase mt-1">{summary.category}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase">
                                    {summary.status}
                                  </span>
                                  {canEditDiagnostics && template && (
                                    <button type="button" onClick={() => loadDiagnosticTemplate(template.key, test)} className="px-3 py-1.5 bg-surface-50 border border-surface-200 rounded-xl text-[11px] font-bold text-surface-600 hover:text-brand-primary hover:border-brand-primary transition-colors">
                                      Editar
                                    </button>
                                  )}
                                  {canEditDiagnostics && (
                                    <button type="button" onClick={() => removeDiagnosticTestFromForm(originalIndex)} className="p-1.5 hover:bg-red-50 text-surface-300 hover:text-red-500 transition-colors rounded-lg">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {summary.lines.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs font-medium text-surface-600">
                                  {summary.lines.slice(0, 8).map((line) => <p key={line}>{line}</p>)}
                                  {summary.lines.length > 8 && <p className="text-surface-400">+ {summary.lines.length - 8} campos preenchidos</p>}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}

                        {freeDiagnosticTests.map((test) => {
                          const originalIndex = formData.tests.indexOf(test);
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={`${test.component_name}-${originalIndex}`}
                              className="bg-white p-4 rounded-2xl border border-surface-200 shadow-sm space-y-3"
                            >
                              <div className="flex justify-between items-center gap-3">
                                <span className="text-sm font-bold text-surface-800 flex items-center gap-2">
                                  <Wrench className="w-4 h-4 text-brand-primary" />
                                  {test.component_name}
                                </span>
                                {canEditDiagnostics && (
                                  <button type="button" onClick={() => removeDiagnosticTestFromForm(originalIndex)} className="p-1.5 hover:bg-red-50 text-surface-300 hover:text-red-500 transition-colors rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-surface-400 uppercase ml-1">Resultado do teste</label>
                                  <input
                                    disabled={!canEditDiagnostics}
                                    placeholder="Ex: 4.2 bar, 12.5 kg/h..."
                                    className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-bold disabled:opacity-60"
                                    value={test.result}
                                    onChange={(e) => {
                                      const nt = [...formData.tests];
                                      nt[originalIndex].result = e.target.value;
                                      setFormData({ ...formData, tests: nt });
                                    }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-surface-400 uppercase ml-1">Observacoes tecnicas</label>
                                  <input
                                    disabled={!canEditDiagnostics}
                                    placeholder="Condicao, oscilacao, etc..."
                                    className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 text-sm font-medium disabled:opacity-60"
                                    value={test.notes || ''}
                                    onChange={(e) => {
                                      const nt = [...formData.tests];
                                      nt[originalIndex].notes = e.target.value;
                                      setFormData({ ...formData, tests: nt });
                                    }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
                </FormSection>
                )}
                {isFullModal && (
                <FormSection title="Itens e valores" description="Pecas aqui sao itens manuais internos da O.S.; nao criam estoque nem produto.">
                <div className="space-y-5 bg-surface-50 p-6 rounded-3xl border border-surface-200">
                  <div className="flex justify-between items-center">
                    <h3 className="micro-label">Peças e Mão de Obra</h3>
                    <div className="bg-white px-4 py-1.5 rounded-xl border border-surface-200 shadow-sm">
                      <span className="text-sm font-bold text-brand-primary data-value">R$ {formData.items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-[3] relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input 
                        placeholder="Descrição do item ou serviço..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-medium" 
                        value={newItem.description} 
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                      />
                    </div>
                    <div className="flex-1 relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input 
                        type="number" 
                        placeholder="Qtd" 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold" 
                        value={newItem.quantity || ''} 
                        onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} 
                      />
                    </div>
                    <input 
                      type="number" 
                      placeholder="Preço" 
                      className="flex-1 p-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm font-bold data-value" 
                      value={newItem.price || ''} 
                      onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} 
                    />
                    <div className="flex-1 flex gap-2">
                      <select 
                        className="flex-1 p-3 bg-white border border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-xs font-bold appearance-none" 
                        value={newItem.type} 
                        onChange={e => setNewItem({...newItem, type: e.target.value as any})}
                      >
                        <option value="parts">Peca aplicada</option>
                        <option value="labor">Servico / Mao de obra</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={addOrderItem}
                        className="bg-brand-primary text-white p-3 rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-surface-200 shadow-sm group">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === 'parts' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                            {item.type === 'parts' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-surface-800">{item.description}</span>
                            <span className="text-[10px] text-surface-400 font-bold uppercase tracking-widest">
                              {item.type === 'parts' ? 'Peca aplicada' : 'Servico'} - Qtd: {item.quantity || 1}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-4 items-center">
                          <span className="font-bold text-surface-900 data-value">R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                          <button type="button" onClick={() => { const ni = [...formData.items]; ni.splice(idx, 1); setFormData({...formData, items: ni}); }} className="p-1.5 hover:bg-brand-accent/10 text-surface-300 hover:text-brand-accent transition-colors rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </FormSection>
                )}

                <button 
                  type="submit" 
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all active:scale-[0.99]"
                >
                  {modalMode === 'full' ? 'Salvar Ordem de Servico' : 'Salvar acao rapida'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Car, CheckCircle2, ClipboardCheck, Search, User, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Client, StaffMember, Vehicle } from '../../types';
import { ApiError } from '../../services/api';
import { clientService, orderService, staffService, vehicleService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { Badge, Button, Card, FormSection, Input, LoadingState, PageHeader, Select, Textarea } from '../../components/ui';

type Step = 'client' | 'vehicle' | 'complaint' | 'review';

const stepOrder: Step[] = ['client', 'vehicle', 'complaint', 'review'];
const stepLabels: Record<Step, string> = {
  client: 'Cliente',
  vehicle: 'Veiculo',
  complaint: 'Queixa',
  review: 'Revisao'
};

const createDefaultChecklist = () => ({
  fuel_level: '1/4',
  scratches: false,
  spare_tire: true,
  triangle: true,
  jack: true,
  documents: true,
  personal_items: false
});

export default function ReceptionTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user } = useAuth();
  const canAssignStaff = user?.permissions === 'super_admin' || user?.permissions === 'admin';

  const [step, setStep] = useState<Step>('client');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    document: ''
  });

  const [vehicleForm, setVehicleForm] = useState({
    plate: '',
    model: '',
    make: '',
    year: '',
    color: ''
  });

  const [orderForm, setOrderForm] = useState({
    complaint: '',
    receptionNotes: '',
    isPriority: false,
    technicianIds: [] as number[]
  });

  useEffect(() => {
    loadInitialData();
  }, [canAssignStaff]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [clientsData, vehiclesData, staffData] = await Promise.all([
        clientService.list(),
        vehicleService.list(),
        canAssignStaff ? staffService.listActive() : Promise.resolve([])
      ]);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (err) {
      console.error('Failed to load reception data:', err);
      toast.error(err instanceof ApiError ? err.message : 'Erro ao carregar atendimento');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const term = clientSearch.toLowerCase().trim();
    if (!term) return clients.slice(0, 8);
    return clients.filter((client) =>
      client.name?.toLowerCase().includes(term) ||
      client.phone?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.document?.toLowerCase().includes(term)
    ).slice(0, 12);
  }, [clients, clientSearch]);

  const filteredVehicles = useMemo(() => {
    const term = vehicleSearch.toLowerCase().trim();
    const eligibleVehicles = selectedClient
      ? vehicles.filter((vehicle) => vehicle.client_id === selectedClient.id)
      : vehicles;

    if (!term) return eligibleVehicles.slice(0, 8);
    return eligibleVehicles.filter((vehicle) =>
      vehicle.plate?.toLowerCase().includes(term) ||
      vehicle.model?.toLowerCase().includes(term) ||
      vehicle.make?.toLowerCase().includes(term) ||
      vehicle.client_name?.toLowerCase().includes(term)
    ).slice(0, 12);
  }, [selectedClient, vehicleSearch, vehicles]);

  const currentStepIndex = stepOrder.indexOf(step);

  const moveToStep = (targetStep: Step) => {
    if (targetStep === 'vehicle' && !selectedClient) return toast.error('Selecione ou cadastre um cliente primeiro.');
    if (targetStep === 'complaint' && !selectedVehicle) return toast.error('Selecione ou cadastre um veiculo primeiro.');
    if (targetStep === 'review' && !orderForm.complaint.trim()) return toast.error('Informe a queixa inicial do cliente.');
    setStep(targetStep);
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setSelectedVehicle(null);
    setVehicleSearch('');
    setStep('vehicle');
  };

  const selectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setStep('complaint');
  };

  const createQuickClient = async () => {
    const name = clientForm.name.trim();
    if (!name) return toast.error('Informe o nome do cliente.');

    const duplicate = clients.find((client) =>
      client.name?.toLowerCase() === name.toLowerCase() ||
      (clientForm.phone && client.phone === clientForm.phone) ||
      (clientForm.email && client.email?.toLowerCase() === clientForm.email.toLowerCase()) ||
      (clientForm.document && client.document === clientForm.document)
    );

    if (duplicate) {
      selectClient(duplicate);
      toast.info('Cliente existente selecionado.');
      return;
    }

    setSaving(true);
    try {
      const client = await clientService.create({
        name,
        phone: clientForm.phone.trim() || null,
        email: clientForm.email.trim() || null,
        document: clientForm.document.trim() || null
      });
      setClients((current) => [client, ...current]);
      selectClient(client);
      toast.success('Cliente cadastrado.');
    } catch (err) {
      console.error('Failed to create quick client:', err);
      toast.error(err instanceof ApiError ? err.message : 'Erro ao cadastrar cliente');
    } finally {
      setSaving(false);
    }
  };

  const createQuickVehicle = async () => {
    if (!selectedClient) return toast.error('Selecione um cliente primeiro.');
    const plate = vehicleForm.plate.trim().toUpperCase();
    const model = vehicleForm.model.trim();

    if (!plate || !model) return toast.error('Informe placa e modelo do veiculo.');

    const duplicate = vehicles.find((vehicle) => vehicle.plate?.toUpperCase() === plate);
    if (duplicate) {
      selectVehicle(duplicate);
      toast.info('Veiculo existente selecionado.');
      return;
    }

    setSaving(true);
    try {
      const vehicle = await vehicleService.create({
        client_id: selectedClient.id,
        plate,
        model,
        make: vehicleForm.make.trim() || 'Nao informado',
        year: vehicleForm.year ? Number(vehicleForm.year) : null,
        color: vehicleForm.color.trim() || null
      });
      const vehicleWithClient = { ...vehicle, client_name: selectedClient.name };
      setVehicles((current) => [vehicleWithClient, ...current]);
      selectVehicle(vehicleWithClient);
      toast.success('Veiculo cadastrado.');
    } catch (err) {
      console.error('Failed to create quick vehicle:', err);
      toast.error(err instanceof ApiError ? err.message : 'Erro ao cadastrar veiculo');
    } finally {
      setSaving(false);
    }
  };

  const createServiceOrder = async () => {
    if (!selectedClient) return toast.error('Selecione um cliente.');
    if (!selectedVehicle) return toast.error('Selecione um veiculo.');
    const complaint = orderForm.complaint.trim();
    if (!complaint) return toast.error('Informe a queixa inicial.');

    setSaving(true);
    try {
      const order = await orderService.create({
        vehicle_id: selectedVehicle.id,
        technician_ids: canAssignStaff ? orderForm.technicianIds : [],
        description: complaint,
        notes: orderForm.receptionNotes.trim(),
        status: 'pending',
        is_priority: orderForm.isPriority,
        entry_date: new Date().toISOString().split('T')[0],
        exit_date: '',
        checklist: createDefaultChecklist(),
        checkin_images: [],
        items: [],
        tests: [],
        create_note: false
      });
      setCreatedOrderId(order.id);
      toast.success(`O.S. #${order.id} criada.`);
    } catch (err) {
      console.error('Failed to create service order from reception:', err);
      toast.error(err instanceof ApiError ? err.message : 'Erro ao criar O.S.');
    } finally {
      setSaving(false);
    }
  };

  const resetFlow = () => {
    setStep('client');
    setSelectedClient(null);
    setSelectedVehicle(null);
    setCreatedOrderId(null);
    setClientSearch('');
    setVehicleSearch('');
    setClientForm({ name: '', phone: '', email: '', document: '' });
    setVehicleForm({ plate: '', model: '', make: '', year: '', color: '' });
    setOrderForm({ complaint: '', receptionNotes: '', isPriority: false, technicianIds: [] });
  };

  if (loading) {
    return <LoadingState label="Carregando atendimento..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atendimento"
        description="Recepcao rapida para localizar cliente, vincular veiculo e abrir O.S."
        actions={createdOrderId && (
          <Button variant="secondary" onClick={() => onNavigate('orders')} icon={<ClipboardCheck className="w-4 h-4" />}>
            Abrir O.S.
          </Button>
        )}
      />

      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stepOrder.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => moveToStep(item)}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                step === item
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : index < currentStepIndex
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-surface-200 bg-white text-surface-500'
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider">Etapa {index + 1}</span>
              <span className="mt-1 flex items-center gap-2 text-sm font-bold">
                {index < currentStepIndex ? <CheckCircle2 className="w-4 h-4" /> : null}
                {stepLabels[item]}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {createdOrderId ? (
        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="green">O.S. criada</Badge>
              <h2 className="mt-3 text-2xl font-display font-bold text-surface-950">Ordem #{createdOrderId}</h2>
              <p className="mt-1 text-sm font-medium text-surface-500">
                Atendimento registrado para {selectedClient?.name} - {selectedVehicle?.plate}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={resetFlow}>Novo atendimento</Button>
              <Button onClick={() => onNavigate('orders')} icon={<ArrowRight className="w-4 h-4" />}>Abrir O.S.</Button>
            </div>
          </div>
        </Card>
      ) : null}

      {!createdOrderId && step === 'client' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <FormSection title="Buscar cliente" description="Pesquise por nome, telefone, CPF/CNPJ ou e-mail para evitar duplicidade.">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Nome, telefone, documento ou e-mail"
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
            />
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div key={client.id}>
                  <Card interactive className="p-4" onClick={() => selectClient(client)}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-surface-900">{client.name}</p>
                        <p className="text-xs font-medium text-surface-500">{client.phone || 'Sem telefone'} {client.email ? `- ${client.email}` : ''}</p>
                      </div>
                      <Button size="sm" variant="secondary">Selecionar</Button>
                    </div>
                  </Card>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <p className="rounded-xl border border-dashed border-surface-200 bg-white p-4 text-sm font-medium text-surface-500">
                  Nenhum cliente encontrado. Cadastre ao lado com os dados minimos.
                </p>
              )}
            </div>
          </FormSection>

          <FormSection title="Cadastro rapido" description="Use apenas os dados minimos para iniciar o atendimento.">
            <Input label="Nome" required value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} />
            <Input label="Telefone" value={clientForm.phone} onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })} />
            <Input label="E-mail" type="email" value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} />
            <Input label="CPF/CNPJ" value={clientForm.document} onChange={(event) => setClientForm({ ...clientForm, document: event.target.value })} />
            <Button onClick={createQuickClient} disabled={saving} icon={<User className="w-4 h-4" />}>Cadastrar e continuar</Button>
          </FormSection>
        </div>
      )}

      {!createdOrderId && step === 'vehicle' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <FormSection title="Buscar veiculo" description={`Cliente selecionado: ${selectedClient?.name || 'nenhum'}.`}>
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Placa, modelo ou marca"
              value={vehicleSearch}
              onChange={(event) => setVehicleSearch(event.target.value)}
            />
            <div className="space-y-2">
              {filteredVehicles.map((vehicle) => (
                <div key={vehicle.id}>
                  <Card interactive className="p-4" onClick={() => selectVehicle(vehicle)}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-surface-900">{vehicle.plate} - {vehicle.model}</p>
                        <p className="text-xs font-medium text-surface-500">{vehicle.make || 'Marca nao informada'} {vehicle.year ? `- ${vehicle.year}` : ''}</p>
                      </div>
                      <Button size="sm" variant="secondary">Selecionar</Button>
                    </div>
                  </Card>
                </div>
              ))}
              {filteredVehicles.length === 0 && (
                <p className="rounded-xl border border-dashed border-surface-200 bg-white p-4 text-sm font-medium text-surface-500">
                  Nenhum veiculo deste cliente encontrado. Cadastre ao lado.
                </p>
              )}
            </div>
          </FormSection>

          <FormSection title="Cadastro rapido de veiculo" description="O veiculo sera vinculado ao cliente selecionado.">
            <Input label="Placa" required value={vehicleForm.plate} onChange={(event) => setVehicleForm({ ...vehicleForm, plate: event.target.value.toUpperCase() })} />
            <Input label="Modelo" required value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} />
            <Input label="Marca" value={vehicleForm.make} onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Ano" type="number" value={vehicleForm.year} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} />
              <Input label="Cor" value={vehicleForm.color} onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setStep('client')}>Voltar</Button>
              <Button onClick={createQuickVehicle} disabled={saving} icon={<Car className="w-4 h-4" />}>Cadastrar e continuar</Button>
            </div>
          </FormSection>
        </div>
      )}

      {!createdOrderId && step === 'complaint' && (
        <FormSection title="Queixa inicial e recepcao" description="Esses dados abrem a O.S. com status Recepcao/Pendente.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-surface-400">Cliente</p>
              <p className="mt-1 font-bold text-surface-900">{selectedClient?.name}</p>
              <p className="text-sm text-surface-500">{selectedClient?.phone || selectedClient?.email || 'Contato nao informado'}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-surface-400">Veiculo</p>
              <p className="mt-1 font-bold text-surface-900">{selectedVehicle?.plate} - {selectedVehicle?.model}</p>
              <p className="text-sm text-surface-500">{selectedVehicle?.make || 'Marca nao informada'}</p>
            </Card>
          </div>
          <Textarea
            label="Queixa inicial do cliente"
            required
            placeholder="Ex: falhando em baixa, luz da injecao acesa, demora para pegar..."
            value={orderForm.complaint}
            onChange={(event) => setOrderForm({ ...orderForm, complaint: event.target.value })}
          />
          <Textarea
            label="Observacoes da recepcao"
            placeholder="Ex: cliente deixou chave reserva, autorizou diagnostico inicial..."
            value={orderForm.receptionNotes}
            onChange={(event) => setOrderForm({ ...orderForm, receptionNotes: event.target.value })}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => setOrderForm({ ...orderForm, isPriority: !orderForm.isPriority })}
              className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all ${
                orderForm.isPriority
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-surface-200 bg-white text-surface-600'
              }`}
            >
              <span>
                <span className="block text-sm font-bold">Prioridade</span>
                <span className="text-xs font-medium">Marcar atendimento como prioritario</span>
              </span>
              <AlertCircle className="w-5 h-5" />
            </button>

            {canAssignStaff && (
              <Select
                label="Tecnico responsavel"
                multiple
                value={orderForm.technicianIds.map(String)}
                onChange={(event) => {
                  const selectedIds = Array.from(event.target.selectedOptions).map((option) => Number((option as HTMLOptionElement).value));
                  setOrderForm({ ...orderForm, technicianIds: selectedIds });
                }}
                className="min-h-28"
              >
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </Select>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setStep('vehicle')}>Voltar</Button>
            <Button onClick={() => moveToStep('review')} icon={<ArrowRight className="w-4 h-4" />}>Revisar atendimento</Button>
          </div>
        </FormSection>
      )}

      {!createdOrderId && step === 'review' && (
        <FormSection title="Revisao e criacao da O.S." description="Confira os dados antes de abrir a Ordem de Servico.">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-4">
              <Badge tone="blue">Cliente</Badge>
              <p className="mt-3 font-bold text-surface-900">{selectedClient?.name}</p>
              <p className="text-sm text-surface-500">{selectedClient?.phone || 'Sem telefone'}</p>
            </Card>
            <Card className="p-4">
              <Badge tone="blue">Veiculo</Badge>
              <p className="mt-3 font-bold text-surface-900">{selectedVehicle?.plate}</p>
              <p className="text-sm text-surface-500">{selectedVehicle?.model}</p>
            </Card>
            <Card className="p-4">
              <Badge tone={orderForm.isPriority ? 'amber' : 'neutral'}>{orderForm.isPriority ? 'Prioritaria' : 'Normal'}</Badge>
              <p className="mt-3 font-bold text-surface-900">Status: pending</p>
              <p className="text-sm text-surface-500">Recepcao / Pendente</p>
            </Card>
          </div>
          <Card className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-surface-400">Queixa inicial</p>
            <p className="mt-2 text-sm font-medium text-surface-700">{orderForm.complaint}</p>
            {orderForm.receptionNotes && (
              <p className="mt-3 text-sm text-surface-500">{orderForm.receptionNotes}</p>
            )}
          </Card>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setStep('complaint')}>Voltar</Button>
            <Button onClick={createServiceOrder} disabled={saving} icon={<Wrench className="w-4 h-4" />}>
              Criar O.S.
            </Button>
          </div>
        </FormSection>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Phone, Mail, BadgeCheck, MoreVertical, Trash2, Edit2, ShieldCheck, X as CloseIcon, UserPlus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IMaskInput } from 'react-imask';
import { toast } from 'sonner';
import { StaffMember } from '../types';
import { useAuth } from '../contexts/AuthContext';

const API_URL = '/api';

const AVAILABLE_ROLES = {
  mechanic: { label: 'Mecânica', color: 'bg-blue-500', text: 'text-blue-500' },
  electrical: { label: 'Elétrica', color: 'bg-amber-500', text: 'text-amber-500' },
  electronics: { label: 'Eletrônica', color: 'bg-cyan-500', text: 'text-cyan-500' },
  programming: { label: 'Programação', color: 'bg-indigo-500', text: 'text-indigo-500' },
  admin: { label: 'Administrativo', color: 'bg-emerald-500', text: 'text-emerald-500' },
  attendant: { label: 'Atendimento', color: 'bg-purple-500', text: 'text-purple-500' },
  other: { label: 'Outros', color: 'bg-surface-400', text: 'text-surface-400' },
};

export default function StaffTab() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<Partial<StaffMember>>({
    roles: [],
    permissions: 'technician',
    active: true
  });

  useEffect(() => {
    fetchStaff();
    fetchRequests();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API_URL}/staff`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaff(data);
      } else {
        console.error('Staff data is not an array:', data);
        setStaff([]);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/staff-requests`, { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        console.error('Staff requests data is not an array:', data);
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to fetch staff requests:', err);
      setRequests([]);
    }
  };

  const handleOpenModal = (member?: StaffMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({ ...member, password: '' });
    } else {
      setEditingMember(null);
      setFormData({ roles: [], permissions: 'technician', active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.roles || formData.roles.length === 0) return;

    const method = editingMember ? 'PUT' : 'POST';
    const url = editingMember ? `${API_URL}/staff/${editingMember.id}` : `${API_URL}/staff`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (res.ok) {
        fetchStaff();
        setIsModalOpen(false);
        toast.success(editingMember ? 'Integrante atualizado!' : 'Integrante cadastrado!');
        
        // If this was from a request, delete it
        const requestId = (window as any).pendingRequestId;
        if (requestId) {
          await fetch(`${API_URL}/staff-requests/${requestId}`, { method: 'DELETE', credentials: 'include' });
          fetchRequests();
          delete (window as any).pendingRequestId;
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Erro ao salvar integrante');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão ao salvar integrante');
    }
  };

  const handleRolesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.currentTarget.selectedOptions) as HTMLOptionElement[];
    const roles = selectedOptions.map(option => option.value);
    setFormData({ ...formData, roles });
  };

  const handleDeleteMember = async (id: number) => {
    if (confirm('Deseja realmente remover este integrante?')) {
      try {
        const res = await fetch(`${API_URL}/staff/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
          fetchStaff();
          toast.success('Integrante removido');
        } else {
          toast.error('Erro ao remover integrante');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro de conexão');
      }
    }
  };

  const handleApproveRequest = (request: any) => {
    setEditingMember(null);
    setFormData({ 
      name: request.name, 
      roles: ['mechanic'], 
      permissions: 'technician', 
      active: true 
    });
    setIsModalOpen(true);
    // We'll delete the request after successful staff creation in handleSubmit
    (window as any).pendingRequestId = request.id;
  };

  const handleRejectRequest = async (id: number) => {
    if (confirm('Deseja recusar esta solicitação?')) {
      try {
        const res = await fetch(`${API_URL}/staff-requests/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
          fetchRequests();
          toast.success('Solicitação recusada');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao recusar solicitação');
      }
    }
  };

  const filteredStaff = Array.isArray(staff) ? staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.roles.some(r => r.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = !selectedRole || member.roles.includes(selectedRole);
    return matchesSearch && matchesRole;
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou cargo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar xl:max-w-[520px]">
          <button 
            onClick={() => setSelectedRole(null)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
              !selectedRole 
                ? 'bg-brand-primary text-white border-brand-primary' 
                : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
            }`}
          >
            Todos
          </button>
          {Object.entries(AVAILABLE_ROLES).map(([key, { label }]) => (
            <button 
              key={key} 
              onClick={() => setSelectedRole(key === selectedRole ? null : key)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                selectedRole === key 
                  ? 'bg-brand-primary text-white border-brand-primary' 
                  : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Novo Integrante
        </button>
      </div>

      {/* Registration Requests */}
      {requests.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-display font-bold text-surface-900 flex items-center gap-2 px-2">
            <UserPlus className="w-5 h-5 text-brand-primary" />
            Solicitações de Acesso ({requests.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-brand-primary/20 rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-surface-900">{req.name}</p>
                    <p className="text-[10px] text-surface-400 uppercase font-bold tracking-wider">Aguardando Aprovação</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApproveRequest(req)}
                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    title="Aprovar e Configurar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleRejectRequest(req.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    title="Recusar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Staff Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredStaff.map((member) => (
              <motion.div
                layout
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Roles Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/20" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-surface-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-surface-950 flex items-center gap-1.5">
                        {member.name}
                        {member.active && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.roles.map(roleKey => (
                          <span key={roleKey} className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">
                            {AVAILABLE_ROLES[roleKey as keyof typeof AVAILABLE_ROLES]?.label || roleKey}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(user?.permissions === 'super_admin' || (member.permissions !== 'admin' && member.permissions !== 'super_admin')) ? (
                      <>
                        <button 
                          onClick={() => handleOpenModal(member)}
                          className="p-2 hover:bg-surface-100 text-surface-400 hover:text-brand-primary rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-2 hover:bg-red-50 text-surface-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="p-2 text-surface-300 cursor-not-allowed" title="Apenas o administrador chefe pode gerenciar contas administrativas">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <Phone className="w-4 h-4" />
                    {member.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <Mail className="w-4 h-4" />
                    {member.email || 'N/A'}
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-100 flex justify-between items-center">
                  <div className="flex gap-1">
                    {member.roles.slice(0, 2).map(roleKey => (
                      <span key={roleKey} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${AVAILABLE_ROLES[roleKey as keyof typeof AVAILABLE_ROLES]?.color || 'bg-surface-400'} bg-opacity-10 ${AVAILABLE_ROLES[roleKey as keyof typeof AVAILABLE_ROLES]?.text || 'text-surface-400'}`}>
                        {AVAILABLE_ROLES[roleKey as keyof typeof AVAILABLE_ROLES]?.label || roleKey}
                      </span>
                    ))}
                    {member.roles.length > 2 && (
                      <span className="text-[10px] font-bold text-surface-400 px-1 py-1">+{member.roles.length - 2}</span>
                    )}
                  </div>
                  {!member.active && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-red-100 text-red-600">
                      Inativo
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-surface-100 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-display font-bold text-surface-950">{editingMember ? 'Editar' : 'Novo'} Integrante</h3>
                  <p className="text-sm text-surface-500">Preencha os dados do colaborador.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-surface-700">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    placeholder="Ex: Carlos Oliveira"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-surface-700">Cargos / Setores</label>
                  <select
                    multiple
                    required
                    size={Math.min(Object.keys(AVAILABLE_ROLES).length, 7)}
                    value={formData.roles || []}
                    onChange={handleRolesChange}
                    className="w-full min-h-36 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none text-sm font-semibold text-surface-700"
                  >
                    {Object.entries(AVAILABLE_ROLES).map(([key, { label }]) => (
                      <option key={key} value={key} className="py-2 px-2">
                        {label}
                      </option>
                    ))}
                  </select>
                  {(!formData.roles || formData.roles.length === 0) && (
                    <p className="text-[10px] text-red-500 font-medium">Selecione pelo menos um cargo.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700">Usuário</label>
                    <input 
                      required
                      type="text" 
                      value={formData.username || ''}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                      placeholder="Ex: carlos.o"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-surface-700">Nível de Acesso</label>
                    <select 
                      value={formData.permissions}
                      onChange={(e) => setFormData({...formData, permissions: e.target.value as StaffMember['permissions']})}
                      className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    >
                      {user?.permissions === 'super_admin' && (
                        <>
                          <option value="super_admin">Administrador Chefe</option>
                          <option value="admin">Administrador</option>
                        </>
                      )}
                      {user?.permissions !== 'super_admin' && editingMember?.permissions === 'admin' && (
                        <option value="admin">Administrador (Bloqueado)</option>
                      )}
                      {user?.permissions !== 'super_admin' && editingMember?.permissions === 'super_admin' && (
                        <option value="super_admin">Administrador Chefe (Bloqueado)</option>
                      )}
                      <option value="attendant">Atendente</option>
                      <option value="technician">Técnico</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-surface-700">Senha {editingMember && '(deixe em branco para manter)'}</label>
                  <input 
                    required={!editingMember}
                    type="password" 
                    value={formData.password || ''}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-surface-700">Telefone</label>
                  <IMaskInput
                    mask="(00) 00000-0000"
                    unmask={true}
                    value={formData.phone || ''}
                    onAccept={(value) => setFormData({...formData, phone: value})}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-surface-700">E-mail</label>
                  <input 
                    type="email" 
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-primary/20 outline-none"
                    placeholder="email@santosauto.com"
                  />
                </div>

                {editingMember && (
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="w-4 h-4 text-brand-primary rounded border-surface-300 focus:ring-brand-primary"
                    />
                    <label htmlFor="active" className="text-sm font-bold text-surface-700">Integrante Ativo</label>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-surface-200 text-surface-600 font-bold rounded-xl hover:bg-surface-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {editingMember ? 'Atualizar' : 'Salvar'}
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

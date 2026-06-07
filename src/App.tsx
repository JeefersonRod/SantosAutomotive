import React, { useState, useEffect } from 'react';
import { Wrench, Receipt, StickyNote, Users, Car as CarIcon, LayoutDashboard, Menu, X, ChevronRight, LogOut, Bell, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate, HashRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useNotifications } from './hooks/useNotifications';
import { Toaster } from 'sonner';
import Login from './components/Login';
import DashboardTab from './components/DashboardTab';
import ClientsTab from './components/ClientsTab';
import VehiclesTab from './components/VehiclesTab';
import OrdersTab from './components/OrdersTab';
import NotesTab from './components/NotesTab';
import InventoryTab from './components/InventoryTab';
import StaffTab from './components/StaffTab';
import UserProfileModal from './components/UserProfileModal';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', title: 'Dashboard', description: 'Visão geral da operação da oficina.', icon: LayoutDashboard, path: '/', roles: ['super_admin', 'admin', 'attendant', 'technician'] },
  { id: 'orders', label: 'Ordens', title: 'Ordens', description: 'Acompanhe serviços, status e responsáveis.', icon: Receipt, path: '/orders', roles: ['super_admin', 'admin', 'attendant', 'technician'] },
  { id: 'notes', label: 'Notas', title: 'Notas de Serviço', description: 'Visualize, crie e imprima notas para clientes.', icon: StickyNote, path: '/notes', roles: ['super_admin', 'admin', 'attendant'] },
  { id: 'inventory', label: 'Produtos', title: 'Estoque de Peças', description: 'Gerencie peças, lubrificantes e itens de reposição.', icon: Package, path: '/inventory', roles: ['super_admin', 'admin', 'attendant', 'technician', 'client'] },
  { id: 'clients', label: 'Clientes', title: 'Gestão de Clientes', description: 'Visualize e gerencie sua base de proprietários.', icon: Users, path: '/clients', roles: ['super_admin', 'admin', 'attendant'] },
  { id: 'vehicles', label: 'Frota', title: 'Frota de Veículos', description: 'Gerencie especificações técnicas e proprietários.', icon: CarIcon, path: '/vehicles', roles: ['super_admin', 'admin', 'attendant', 'technician'] },
  { id: 'staff', label: 'Equipe', title: 'Equipe da Oficina', description: 'Gerencie técnicos e colaboradores por setor.', icon: Users, path: '/staff', roles: ['super_admin', 'admin'] },
] as const;

function AppContent() {
  const { user, loading, logout } = useAuth();
  const { permission, requestPermission } = useNotifications(user?.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const filteredNavItems = NAV_ITEMS.filter(item => 
    item.roles.includes(user.permissions || 'technician')
  );

  const activeTab = NAV_ITEMS.find(item => 
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.id || 'dashboard';
  const activeNavItem = NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-surface-50 text-surface-900 font-sans selection:bg-brand-primary/10">
      {/* Background Grid Accent */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 print:hidden" 
           style={{ backgroundImage: 'radial-gradient(#0066FF 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-surface-200 z-40 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:block print:hidden`}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="bg-surface-950 p-1 rounded-xl shadow-lg shadow-brand-primary/10 overflow-hidden w-10 h-10 flex items-center justify-center border border-surface-800">
                <img 
                  src="/logo.jpg" 
                  alt="Santos Automotive Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-brand-primary');
                    const icon = document.createElement('div');
                    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrench text-white w-6 h-6"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
                    e.currentTarget.parentElement?.appendChild(icon.firstChild as Node);
                  }}
                />
              </div>
              {isSidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h1 className="text-lg font-display font-bold tracking-tight notranslate" translate="no">Santos Automotive</h1>
                  <p className="micro-label">Tech Manager</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1">
            {filteredNavItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all group relative ${
                  activeTab === item.id 
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
                    : 'text-surface-500 hover:bg-surface-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-surface-400 group-hover:text-brand-primary'}`} />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 text-left">
                    {item.label}
                  </motion.span>
                )}
                {activeTab === item.id && isSidebarOpen && (
                  <motion.div layoutId="activeTab" className="absolute right-3">
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </motion.div>
                )}
              </Link>
            ))}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-surface-100 space-y-2">
            <button 
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-all font-bold"
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span>Sair</span>}
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full flex items-center justify-center p-2 hover:bg-surface-100 rounded-lg text-surface-400"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} min-h-screen relative z-10 print:ml-0`}>
        {/* Top Header for Mobile & Desktop Title */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-surface-200 sticky top-0 z-30 px-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <div className="md:hidden bg-surface-950 p-1 rounded-lg w-10 h-10 flex items-center justify-center overflow-hidden border border-surface-800">
              <img 
                src="/logo.jpg" 
                alt="Santos Automotive Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-brand-primary');
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrench text-white w-5 h-5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
                  e.currentTarget.parentElement?.appendChild(icon.firstChild as Node);
                }}
              />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-display font-bold text-surface-900 leading-tight">
                {activeNavItem.title}
              </h2>
              <p className="hidden sm:block text-sm text-surface-500 font-medium mt-1">
                {activeNavItem.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {permission === 'default' && (
              <button 
                onClick={requestPermission}
                className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-colors flex items-center gap-2"
                title="Ativar Notificações"
              >
                <span className="text-xs font-bold hidden sm:inline">Ativar Alertas</span>
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                </div>
              </button>
            )}
            
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-4 hover:bg-surface-50 p-1.5 rounded-2xl transition-all group"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold group-hover:text-brand-primary transition-colors">{user.name}</span>
                <span className="micro-label text-emerald-500">
                  {user.permissions === 'super_admin' ? 'Administrador Chefe' : user.permissions === 'admin' ? 'Administrador' : user.permissions === 'attendant' ? 'Atendente' : 'Técnico'}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-surface-100 border border-surface-200 flex items-center justify-center text-brand-primary font-bold group-hover:border-brand-primary/30 group-hover:bg-brand-primary/5 transition-all">
                {user.name.charAt(0)}
              </div>
            </button>
          </div>
        </header>
        
        <div className="max-w-7xl mx-auto px-6 py-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Routes>
                <Route path="/" element={<DashboardTab onNavigate={(tab) => navigate(NAV_ITEMS.find(i => i.id === tab)?.path || '/')} />} />
                <Route path="/orders" element={<OrdersTab onNavigate={(tab) => navigate(NAV_ITEMS.find(i => i.id === tab)?.path || '/')} />} />
                <Route path="/notes" element={<NotesTab />} />
                <Route path="/inventory" element={<InventoryTab />} />
                <Route path="/clients" element={<ClientsTab />} />
                <Route path="/vehicles" element={<VehiclesTab />} />
                <Route path="/staff" element={<StaffTab />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 px-6 py-3 flex justify-around z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] print:hidden">
        {filteredNavItems.map((item) => (
          <Link 
            key={item.id}
            to={item.path} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === item.id ? 'text-brand-primary' : 'text-surface-400'}`}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
            {activeTab === item.id && (
              <motion.div layoutId="mobileActive" className="w-1 h-1 rounded-full bg-brand-primary mt-0.5" />
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" expand={false} richColors closeButton />
      </AuthProvider>
    </HashRouter>
  );
}

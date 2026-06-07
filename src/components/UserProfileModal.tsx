import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Shield, LogOut, Calendar, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'Administrador Chefe';
      case 'admin': return 'Administrador';
      case 'attendant': return 'Atendente';
      default: return 'Técnico';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative"
          >
            {/* Header/Banner */}
            <div className="h-32 bg-gradient-to-br from-brand-primary to-brand-secondary relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-8 -mt-12 relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-white p-1.5 shadow-xl mb-4">
                  <div className="w-full h-full rounded-[1.6rem] bg-surface-100 flex items-center justify-center text-3xl font-bold text-brand-primary border border-surface-200">
                    {user.name.charAt(0)}
                  </div>
                </div>
                
                <h2 className="text-2xl font-display font-bold text-surface-950 tracking-tight">{user.name}</h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold mt-2 border border-emerald-100 uppercase tracking-wider">
                  <Shield className="w-3 h-3" />
                  {getRoleLabel(user.permissions)}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-2xl border border-surface-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-surface-400 border border-surface-200">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">E-mail / Usuário</p>
                    <p className="text-sm font-medium text-surface-900">{user.email || user.username || 'Não informado'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-2xl border border-surface-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-surface-400 border border-surface-200">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Departamento</p>
                    <p className="text-sm font-medium text-surface-900">{user.department || 'Geral'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-2xl border border-surface-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-surface-400 border border-surface-200">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Membro desde</p>
                    <p className="text-sm font-medium text-surface-900">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-surface-100">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-[0.98]"
                >
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

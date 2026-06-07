import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Loader2, Lock, User as UserIcon, Wrench } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,209,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,102,255,0.22) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(0,102,255,0.24),transparent_36%),linear-gradient(180deg,rgba(2,6,23,0.1),rgba(2,6,23,0.92))]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#111622]/95 border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-surface-950 rounded-2xl border border-white/10 p-2 shadow-lg shadow-brand-primary/10 mb-4">
              <img src="/logo.svg" alt="Santos Automotive" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Santos Automotive</h1>
            <p className="text-surface-400 font-medium mt-1">Sistema interno da oficina</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/25 p-4 rounded-2xl flex items-center gap-3 text-red-300 text-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-400 uppercase tracking-wider ml-1">E-mail ou usuário</label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-brand-secondary transition-colors" />
                <input
                  required
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-[#1a1f2b] border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all font-medium placeholder:text-surface-500"
                  placeholder="e-mail ou usuário"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-400 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-brand-secondary transition-colors" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-[#1a1f2b] border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary transition-all font-medium placeholder:text-surface-500"
                  placeholder="digite sua senha"
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full h-14 bg-brand-primary text-white rounded-2xl font-bold text-base shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Wrench className="w-5 h-5" />
                  Entrar no sistema
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-surface-500">
            Acesso exclusivo aos integrantes da oficina.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

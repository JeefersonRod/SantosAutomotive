import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Cpu, Gauge, KeyRound, Loader2, Lock, ShieldCheck, User as UserIcon, Wrench, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-[#05070d] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,102,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(0,209,255,0.12) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(115deg,rgba(2,6,23,0.95)_0%,rgba(2,6,23,0.72)_42%,rgba(15,23,42,0.96)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-secondary/70 to-transparent" />

      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:flex flex-col justify-between px-12 xl:px-16 py-12 border-r border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-white/10 p-1.5 shadow-lg shadow-black/30">
              <img src="/logo.svg" alt="Santos Automotive" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.24em] uppercase text-brand-secondary">Santos Automotive</p>
              <h1 className="text-3xl font-display font-bold tracking-tight">Central da Oficina</h1>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-brand-secondary/30 bg-brand-secondary/10 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary mb-8">
              <ShieldCheck className="w-4 h-4" />
              Acesso interno da equipe
            </div>
            <h2 className="font-display font-bold text-5xl xl:text-6xl leading-[1.02] tracking-tight">
              Diagnóstico, ordens e programação em um só painel.
            </h2>
            <p className="mt-6 text-lg text-surface-300 leading-8 max-w-xl">
              Ambiente de trabalho para mecânicos, atendentes e programadores de injeção eletrônica da Santos Automotive.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-3 max-w-xl">
              {[
                { icon: Gauge, label: 'Diagnóstico' },
                { icon: Cpu, label: 'Injeção' },
                { icon: Zap, label: 'Elétrica' },
              ].map((item) => (
                <div key={item.label} className="border border-white/10 bg-white/[0.04] rounded-2xl p-4">
                  <item.icon className="w-6 h-6 text-brand-secondary mb-4" />
                  <span className="text-sm font-bold text-surface-200">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-surface-500">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)]" />
            SISTEMA OPERACIONAL DA OFICINA
          </div>
        </section>

        <main className="min-h-screen flex items-center justify-center px-5 py-8 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-[460px]"
          >
            <div className="lg:hidden flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white border border-white/10 p-2 shadow-lg shadow-black/30 mb-4">
                <img src="/logo.svg" alt="Santos Automotive" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs font-bold tracking-[0.22em] uppercase text-brand-secondary">Acesso interno</p>
              <h1 className="text-3xl font-display font-bold tracking-tight mt-2">Santos Automotive</h1>
            </div>

            <div className="bg-[#10131d]/90 border border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-black/40">
              <div className="mb-8">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-secondary">Login da equipe</p>
                    <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mt-2">Entrar no sistema</h2>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/15 border border-brand-primary/30 flex items-center justify-center">
                    <KeyRound className="w-6 h-6 text-brand-secondary" />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-surface-900 border border-white/10 overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-brand-primary via-brand-secondary to-emerald-400" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
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
                      className="w-full h-14 pl-12 pr-4 bg-[#171b27] border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary transition-all font-medium placeholder:text-surface-500"
                      placeholder="seu usuário da oficina"
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
                      className="w-full h-14 pl-12 pr-4 bg-[#171b27] border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary transition-all font-medium placeholder:text-surface-500"
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
                      Acessar painel
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 pt-6 border-t border-white/10 flex items-start gap-3 text-sm text-surface-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>
                  Uso exclusivo dos integrantes da oficina. Para recuperar acesso, fale com o administrador.
                </p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

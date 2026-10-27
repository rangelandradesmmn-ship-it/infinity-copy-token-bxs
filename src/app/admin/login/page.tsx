'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authenticateUser } from '@/lib/dataService';
import { ShieldCheck, ArrowRight, AlertCircle, KeyRound, Loader2, Lock, ArrowLeft } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authenticateUser(email, password);

      if (res.success && res.user) {
        if (res.user.role === 'admin') {
          router.push('/admin');
        } else {
          setError('Acesso negado: esta conta é de parceiro e não possui privilégios de administrador.');
        }
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação do administrador.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@saas.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 selection:bg-purple-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -translate-y-1/2 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-purple-900/40 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-950/60">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300 text-[11px] font-semibold tracking-wider uppercase mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            Acesso Restrito
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Super Administrador</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Informe suas credenciais master para gerenciar a plataforma, parceiros e a landing page global.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-start gap-2.5 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-2 mb-6">
            <KeyRound className="w-4 h-4 shrink-0" />
            <span>Instruções de segurança enviadas para {email}!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              E-mail Administrativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@saas.com"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Senha Master</label>
              <button
                type="button"
                onClick={() => {
                  if (!email) {
                    setError('Digite seu e-mail no campo acima.');
                  } else {
                    setResetSent(true);
                    setTimeout(() => setResetSent(false), 5000);
                  }
                }}
                className="text-[11px] text-purple-400 hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-purple-950/50 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Entrar no Painel Master</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Admin Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-2.5">
            Credenciais Padrão do Administrador:
          </p>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="px-3.5 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 text-xs font-medium transition-colors"
            >
              Preencher: admin@saas.com (senha: admin123)
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Início</span>
          </Link>
          <Link
            href="/painel/login"
            className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
          >
            Acesso Parceiros &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

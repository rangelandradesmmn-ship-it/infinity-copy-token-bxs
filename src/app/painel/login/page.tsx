'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllUsers, setCurrentSessionUserId } from '@/lib/dataService';
import { LogIn, ArrowRight, AlertCircle, KeyRound, Loader2 } from 'lucide-react';

export default function UserLoginPage() {
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
      const users = await getAllUsers();
      const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

      if (match) {
        setCurrentSessionUserId(match.id);
        if (match.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/painel');
        }
      } else {
        setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('senha123456');
  };

  const handleForgotPassword = () => {
    if (!email) {
      setError('Por favor, informe seu e-mail no campo acima para receber as instruções.');
      return;
    }
    setResetSent(true);
    setTimeout(() => setResetSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Acessar Painel</h1>
          <p className="text-xs text-slate-400 mt-1">
            Entre com suas credenciais para gerenciar suas personalizações.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 mb-6">
            <KeyRound className="w-4 h-4 shrink-0" />
            <span>Instruções de recuperação enviadas para {email}!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              E-mail Cadastrado
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Senha</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[11px] text-blue-400 hover:underline"
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
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-950/40 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins for instant review */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
            Acesso Rápido para Demonstração:
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => quickLoginAs('joao@parceiro.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              João Silva (/p/joao)
            </button>
            <button
              type="button"
              onClick={() => quickLoginAs('maria@parceiro.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              Maria Santos (/p/maria)
            </button>
            <button
              type="button"
              onClick={() => quickLoginAs('admin@saas.com')}
              className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800 transition-colors"
            >
              Super Admin
            </button>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-400">
          Ainda não tem conta de parceiro?{' '}
          <Link href="/painel/cadastro" className="text-blue-400 hover:underline font-semibold">
            Cadastre-se Gratuitamente
          </Link>
        </div>
      </div>
    </div>
  );
}

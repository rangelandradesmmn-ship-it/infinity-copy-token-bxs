'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerNewUser, setCurrentSessionUserId } from '@/lib/dataService';
import { generateSlug } from '@/lib/security';
import { UserPlus, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function UserRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [slugCandidate, setSlugCandidate] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle name change and automatically suggest slug
  const handleNameChange = (val: string) => {
    setName(val);
    setSlugCandidate(generateSlug(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !email.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerNewUser(name, email, slugCandidate);

      if (res.success && res.user) {
        setSuccess('Cadastro concluído com sucesso! Redirecionando...');
        setCurrentSessionUserId(res.user.id);
        setTimeout(() => {
          router.push('/painel');
        }, 1200);
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao registrar novo usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Criar Conta de Parceiro</h1>
          <p className="text-xs text-slate-400 mt-1">
            Receba sua landing page clonada e comece a divulgar em minutos.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 mb-6">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ex: João da Silva"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Endereço de E-mail
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Slug da Sua URL Exclusiva
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-400">
              <span className="text-slate-500">/p/</span>
              <input
                type="text"
                value={slugCandidate}
                onChange={(e) => setSlugCandidate(generateSlug(e.target.value))}
                placeholder="seunome"
                required
                className="w-full bg-transparent text-blue-400 font-mono outline-none ml-0.5"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Sua página será: seudominio.com/p/{slugCandidate || 'seunome'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Senha de Acesso
            </label>
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
                <span>Cadastrar e Criar Minha Landing Page</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-400">
          Já possui conta cadastrada?{' '}
          <Link href="/painel/login" className="text-blue-400 hover:underline font-semibold">
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
}

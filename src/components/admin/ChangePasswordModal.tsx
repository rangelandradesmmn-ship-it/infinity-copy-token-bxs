'use client';

import React, { useState } from 'react';
import { UserWithSettings } from '@/types';
import { updateUserPassword } from '@/lib/dataService';
import {
  KeyRound,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  User,
} from 'lucide-react';

interface ChangePasswordModalProps {
  user: UserWithSettings | null;
  currentAdminId?: string;
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged?: () => void;
}

export function ChangePasswordModal({
  user,
  currentAdminId,
  isOpen,
  onClose,
  onPasswordChanged,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !user) return null;

  const isSelf = currentAdminId === user.id || user.email === 'rangelandradesmmn@gmail.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem. Por favor, verifique.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserPassword(user.id, newPassword, currentAdminId || user.id);
      if (res.success) {
        setSuccess(res.message);
        setNewPassword('');
        setConfirmPassword('');
        if (onPasswordChanged) onPasswordChanged();
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1600);
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError('');
    setSuccess('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-purple-900/40 rounded-3xl p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isSelf ? 'Alterar Minha Senha' : 'Alterar Senha do Usuário'}
            </h3>
            <p className="text-xs text-slate-400">
              {isSelf
                ? 'Defina uma nova senha para sua conta de Administrador.'
                : 'Defina uma nova senha de acesso para este parceiro.'}
            </p>
          </div>
        </div>

        {/* Target User Info Badge */}
        <div className="mb-5 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{user.name}</span>
              <span className="text-[11px] text-slate-400 block truncate">{user.email}</span>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              user.role === 'admin'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
          >
            {user.role === 'admin' ? 'Super Admin' : 'Parceiro'}
          </span>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950/40 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Salvar Nova Senha</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

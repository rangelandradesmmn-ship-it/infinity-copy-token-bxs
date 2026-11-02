'use client';

import React, { useState } from 'react';
import { UserWithSettings } from '@/types';
import { deleteUserPermanently } from '@/lib/dataService';
import {
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  MessageSquare,
  BarChart3,
  Sliders,
  UserCheck,
} from 'lucide-react';

interface DeleteUserModalProps {
  user: UserWithSettings | null;
  currentAdminId?: string;
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted?: () => void;
}

export function DeleteUserModal({
  user,
  currentAdminId,
  isOpen,
  onClose,
  onUserDeleted,
}: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !user) return null;

  const isMaster =
    user.role === 'admin' ||
    user.id === currentAdminId ||
    user.email === 'rangelandradesmmn@gmail.com' ||
    user.email === 'admin@saas.com';

  const handleClose = () => {
    if (loading) return;
    setError('');
    setSuccess('');
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (isMaster) {
      setError('A conta do Super Administrador Master não pode ser excluída.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await deleteUserPermanently(
        user.id,
        currentAdminId || 'user-rangel-0001'
      );
      if (res.success) {
        setSuccess(res.message);
        if (onUserDeleted) onUserDeleted();
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1400);
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir o usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-red-900/40 rounded-3xl p-6 shadow-2xl relative">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Excluir Usuário Permanentemente
            </h3>
            <p className="text-xs text-slate-400">
              Esta ação é definitiva e removerá todos os dados do parceiro em todos os módulos.
            </p>
          </div>
        </div>

        {/* Cartão de Identificação do Usuário */}
        <div className="mb-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{user.name}</span>
              <span className="text-[11px] text-slate-400 block truncate">{user.email}</span>
              <span className="text-[10px] text-purple-400 font-mono block">/p/{user.slug}</span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {user.role === 'admin' ? 'Super Admin' : 'Parceiro'}
          </span>
        </div>

        {/* Lista de Registros Eliminados */}
        <div className="mb-5 p-4 rounded-2xl bg-red-950/30 border border-red-900/40 text-xs space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Serão eliminados permanentemente:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px]">
            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <UserCheck className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Perfil e credenciais de login</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Página clonada (/p/{user.slug})</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <Sliders className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Link de afiliado e WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <BarChart3 className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Histórico de acessos e métricas</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800 col-span-1 sm:col-span-2">
              <MessageSquare className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Todas as mensagens e chamados privados no chat</span>
            </div>
          </div>
        </div>

        {/* Alerta de Sucesso */}
        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Alerta de Erro */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={loading || isMaster}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Excluindo todos os dados...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Definitivamente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

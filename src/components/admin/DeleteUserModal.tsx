'use client';

import React, { useState } from 'react';
import { UserWithSettings } from '@/types';
import { deleteUserPermanently, deleteMultipleUsersPermanently } from '@/lib/dataService';
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
  Users,
} from 'lucide-react';

interface DeleteUserModalProps {
  user?: UserWithSettings | null;
  users?: UserWithSettings[] | null;
  currentAdminId?: string;
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted?: () => void;
}

export function DeleteUserModal({
  user,
  users,
  currentAdminId,
  isOpen,
  onClose,
  onUserDeleted,
}: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const isBatch = Boolean(users && users.length > 0);
  const targetUsers = isBatch ? (users || []) : (user ? [user] : []);

  if (targetUsers.length === 0) return null;

  const hasMaster = targetUsers.some(
    (u) =>
      u.role === 'admin' ||
      u.id === currentAdminId ||
      u.email === 'rangelandradesmmn@gmail.com' ||
      u.email === 'admin@saas.com'
  );

  const handleClose = () => {
    if (loading) return;
    setError('');
    setSuccess('');
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!isBatch && hasMaster) {
      setError('A conta do Super Administrador Master não pode ser excluída.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isBatch) {
        const userIds = targetUsers.map((u) => u.id);
        const res = await deleteMultipleUsersPermanently(
          userIds,
          currentAdminId || 'user-rangel-0001'
        );
        if (res.success) {
          setSuccess(res.message);
          if (onUserDeleted) onUserDeleted();
          setTimeout(() => {
            setSuccess('');
            onClose();
          }, 1500);
        } else {
          setError(res.message);
        }
      } else {
        const single = targetUsers[0];
        const res = await deleteUserPermanently(
          single.id,
          currentAdminId || 'user-rangel-0001'
        );
        if (res.success) {
          setSuccess(res.message);
          if (onUserDeleted) onUserDeleted();
          setTimeout(() => {
            setSuccess('');
            onClose();
          }, 1500);
        } else {
          setError(res.message);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir o(s) usuário(s).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-red-900/40 rounded-3xl p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
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
        <div className="flex items-center gap-3.5 mb-5 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
            {isBatch ? <Users className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isBatch
                ? `Excluir ${targetUsers.length} Usuários Selecionados`
                : 'Excluir Usuário Permanentemente'}
            </h3>
            <p className="text-xs text-slate-400">
              {isBatch
                ? `Esta ação é irreversível e eliminará todos os registros de ${targetUsers.length} parceiros simultaneamente.`
                : 'Esta ação é definitiva e removerá todos os dados do parceiro em todos os módulos.'}
            </p>
          </div>
        </div>

        {/* Conteúdo com rolagem */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Visualização do(s) Usuário(s) */}
          {isBatch ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
                <span>Parceiros selecionados ({targetUsers.length}):</span>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-950 border border-slate-800">
                {targetUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[11px] shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{u.name}</span>
                        <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono shrink-0 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      /p/{u.slug}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 font-bold text-sm">
                  {targetUsers[0].name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{targetUsers[0].name}</span>
                  <span className="text-[11px] text-slate-400 block truncate">{targetUsers[0].email}</span>
                  <span className="text-[10px] text-purple-400 font-mono block">/p/{targetUsers[0].slug}</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {targetUsers[0].role === 'admin' ? 'Super Admin' : 'Parceiro'}
              </span>
            </div>
          )}

          {/* Lista de Registros Eliminados */}
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/40 text-xs space-y-2">
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
                <span>Página clonada exclusiva</span>
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
                <span>Todas as mensagens e chamados no chat</span>
              </div>
            </div>
          </div>

          {/* Alerta de Sucesso */}
          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Alerta de Erro */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-4 mt-2 border-t border-slate-800/80 shrink-0">
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
            disabled={loading || (!isBatch && hasMaster)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Excluindo todos os registros...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isBatch
                    ? `Sim, Excluir (${targetUsers.length}) Definitivamente`
                    : 'Sim, Excluir Definitivamente'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserWithSettings, UserStatus } from '@/types';
import { toggleUserStatus, setCurrentSessionUserId } from '@/lib/dataService';
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal';
import { DeleteUserModal } from '@/components/admin/DeleteUserModal';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  User,
  LogIn,
  KeyRound,
  Shield,
  Trash2,
} from 'lucide-react';

interface AdminUsersTableProps {
  users: UserWithSettings[];
  currentAdminId?: string;
  onUserStatusChanged: () => void;
}

export function AdminUsersTable({
  users,
  currentAdminId,
  onUserStatusChanged,
}: AdminUsersTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<UserWithSettings | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<UserWithSettings | null>(null);
  const [batchDeleteModalUsers, setBatchDeleteModalUsers] = useState<UserWithSettings[] | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.slug.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ? true : u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const selectableUsers = filtered.filter(
    (u) =>
      u.role !== 'admin' &&
      u.id !== currentAdminId &&
      u.email.toLowerCase() !== 'rangelandradesmmn@gmail.com' &&
      u.email.toLowerCase() !== 'admin@saas.com'
  );

  const isAllSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedUserIds.has(u.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(selectableUsers.map((u) => u.id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleOpenBatchDelete = () => {
    const selected = users.filter((u) => selectedUserIds.has(u.id));
    if (selected.length > 0) {
      setBatchDeleteModalUsers(selected);
    }
  };

  const handleToggleStatus = async (user: UserWithSettings) => {
    if (user.role === 'admin') return; // Cannot block an admin
    const newStatus: UserStatus = user.status === 'active' ? 'blocked' : 'active';
    setUpdatingId(user.id);
    try {
      await toggleUserStatus(user.id, newStatus, currentAdminId || 'user-rangel-0001');
      onUserStatusChanged();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLoginAs = (userId: string) => {
    setCurrentSessionUserId(userId);
  };

  const partnersCount = users.filter((u) => u.role !== 'admin').length;
  const adminsCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Gerenciamento de Usuários e Acessos</h2>
          <p className="text-xs text-slate-400">
            Controle de contas, URLs exclusivas, alteração de senhas e status de acesso.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou slug..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                roleFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('user')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                roleFilter === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Parceiros ({partnersCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-purple-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admins ({adminsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedUserIds.size > 0 && (
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-red-950/70 border border-purple-500/40 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs">
              {selectedUserIds.size}
            </span>
            <div>
              <span className="text-xs font-bold text-white block">
                {selectedUserIds.size}{' '}
                {selectedUserIds.size === 1
                  ? 'parceiro selecionado'
                  : 'parceiros selecionados'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Selecione ações coletivas para os parceiros marcados
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
            >
              Desmarcar todos
            </button>

            <button
              type="button"
              onClick={handleOpenBatchDelete}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-950/50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Selecionados ({selectedUserIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Selecionar todos os parceiros visíveis"
                  className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 align-middle"
                  title={
                    isAllSelected
                      ? 'Desmarcar todos'
                      : 'Selecionar todos os parceiros visíveis'
                  }
                />
              </th>
              <th className="py-3 px-4">Usuário</th>
              <th className="py-3 px-4">Tipo / Papel</th>
              <th className="py-3 px-4">URL Exclusiva</th>
              <th className="py-3 px-4">Cadastro / WhatsApp</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((user) => {
              const isAdmin = user.role === 'admin';
              const isBlocked = user.status === 'blocked';
              const isSelected = selectedUserIds.has(user.id);
              const publicUrl = `/p/${user.slug}`;

              return (
                <tr
                  key={user.id}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-purple-950/30 hover:bg-purple-950/40 border-l-2 border-l-purple-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-4 px-3 w-10 text-center">
                    {!isAdmin ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUser(user.id)}
                        aria-label={`Selecionar ${user.name}`}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 align-middle"
                      />
                    ) : (
                      <span className="text-slate-600 text-xs select-none">•</span>
                    )}
                  </td>

                  {/* User Avatar & Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        {user.settings?.profile_image_url ? (
                          <Image
                            src={user.settings.profile_image_url}
                            alt={user.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-white block text-sm">
                          {user.name}
                        </span>
                        <span className="text-xs text-slate-400 block">{user.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-4">
                    {isAdmin ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                        <Shield className="w-3 h-3 text-purple-400" /> Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
                        <User className="w-3 h-3 text-blue-400" /> Parceiro
                      </span>
                    )}
                  </td>

                  {/* Slug / Public URL */}
                  <td className="py-4 px-4 font-mono text-xs text-blue-400">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                        {publicUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(user.slug, user.id)}
                        title="Copiar URL"
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedId === user.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Settings summary */}
                  <td className="py-4 px-4 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400">Link: </span>
                      {user.settings?.registration_url ? (
                        <span className="text-emerald-400 truncate max-w-[160px] inline-block align-bottom">
                          {user.settings.registration_url}
                        </span>
                      ) : (
                        <span className="text-slate-400">Padrão da Matriz</span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <span className="text-slate-400">WhatsApp: </span>
                      {user.settings?.whatsapp_number ? (
                        <span className="text-green-400">
                          {user.settings.whatsapp_country_code} {user.settings.whatsapp_number}
                        </span>
                      ) : (
                        <span className="text-slate-400">Padrão da Matriz</span>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    {isBlocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                        <ShieldAlert className="w-3 h-3" /> Bloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Ativo
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Password Change Action */}
                      <button
                        type="button"
                        onClick={() => setPasswordModalUser(user)}
                        className="p-2 rounded-lg bg-purple-950/70 hover:bg-purple-900 border border-purple-800 text-purple-300 hover:text-white transition-colors"
                        title={`Alterar senha de ${user.name}`}
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <Link
                        href={publicUrl}
                        target="_blank"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Abrir landing page pública deste usuário"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {!isAdmin && (
                        <Link
                          href="/painel"
                          onClick={() => handleLoginAs(user.id)}
                          className="p-2 rounded-lg bg-blue-950/70 hover:bg-blue-900 border border-blue-800 text-blue-300 hover:text-white transition-colors"
                          title="Acessar painel como este usuário"
                        >
                          <LogIn className="w-4 h-4" />
                        </Link>
                      )}

                      {!isAdmin ? (
                        <>
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => handleToggleStatus(user)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isBlocked
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {isBlocked ? 'Desbloquear' : 'Bloquear'}
                          </button>

                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => setDeleteModalUser(user)}
                            className="p-2 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-400 hover:text-white transition-colors"
                            title={`Excluir permanentemente ${user.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-purple-400/80 px-2 py-1 font-mono">
                          Master
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  Nenhum usuário encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal
        user={passwordModalUser}
        currentAdminId={currentAdminId}
        isOpen={Boolean(passwordModalUser)}
        onClose={() => setPasswordModalUser(null)}
        onPasswordChanged={onUserStatusChanged}
      />

      {/* Single Delete User Modal */}
      <DeleteUserModal
        user={deleteModalUser}
        currentAdminId={currentAdminId}
        isOpen={Boolean(deleteModalUser)}
        onClose={() => setDeleteModalUser(null)}
        onUserDeleted={() => {
          if (deleteModalUser) {
            setSelectedUserIds((prev) => {
              const next = new Set(prev);
              next.delete(deleteModalUser.id);
              return next;
            });
          }
          onUserStatusChanged();
        }}
      />

      {/* Batch Delete Users Modal */}
      <DeleteUserModal
        users={batchDeleteModalUsers}
        currentAdminId={currentAdminId}
        isOpen={Boolean(batchDeleteModalUsers)}
        onClose={() => setBatchDeleteModalUsers(null)}
        onUserDeleted={() => {
          clearSelection();
          onUserStatusChanged();
        }}
      />
    </div>
  );
}

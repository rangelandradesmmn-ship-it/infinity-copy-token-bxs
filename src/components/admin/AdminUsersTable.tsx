'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserWithSettings, UserStatus } from '@/types';
import { toggleUserStatus, setCurrentSessionUserId } from '@/lib/dataService';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  User,
  Sliders,
  LogIn,
} from 'lucide-react';

interface AdminUsersTableProps {
  users: UserWithSettings[];
  onUserStatusChanged: () => void;
}

export function AdminUsersTable({ users, onUserStatusChanged }: AdminUsersTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter regular users (hide super admin from affiliate user table)
  const regularUsers = users.filter((u) => u.role !== 'admin');

  const filtered = regularUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.slug.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (user: UserWithSettings) => {
    const newStatus: UserStatus = user.status === 'active' ? 'blocked' : 'active';
    setUpdatingId(user.id);
    try {
      await toggleUserStatus(user.id, newStatus, 'admin-uuid-0001');
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">Gerenciamento de Parceiros</h2>
          <p className="text-xs text-slate-400">
            Controle de contas, URLs exclusivas e status de acesso dos usuários.
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
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({regularUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ativos ({regularUsers.filter((u) => u.status === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('blocked')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'blocked'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bloqueados ({regularUsers.filter((u) => u.status === 'blocked').length})
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Parceiro</th>
              <th className="py-3 px-4">URL Exclusiva</th>
              <th className="py-3 px-4">Cadastro / WhatsApp</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((user) => {
              const isBlocked = user.status === 'blocked';
              const publicUrl = `/p/${user.slug}`;

              return (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
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
                      <Link
                        href={publicUrl}
                        target="_blank"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Abrir landing page pública deste usuário"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <Link
                        href="/painel"
                        onClick={() => handleLoginAs(user.id)}
                        className="p-2 rounded-lg bg-blue-950/70 hover:bg-blue-900 border border-blue-800 text-blue-300 hover:text-white transition-colors"
                        title="Acessar painel como este usuário"
                      >
                        <LogIn className="w-4 h-4" />
                      </Link>

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
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  Nenhum parceiro encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

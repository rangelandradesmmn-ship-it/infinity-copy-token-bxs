'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AdminDashboardMetrics,
  UserWithSettings,
  AdminAuditLog,
  LandingPageVersion,
} from '@/types';
import {
  getCurrentSessionUser,
  getAdminDashboardMetrics,
  getAllUsers,
  getAuditLogs,
  getPublishedLandingPage,
  getLandingPageVersions,
} from '@/lib/dataService';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMetricsOverview } from '@/components/admin/AdminMetricsOverview';
import { AdminLeaderboard } from '@/components/admin/AdminLeaderboard';
import { AdminUsersTable } from '@/components/admin/AdminUsersTable';
import { AdminAuditTable } from '@/components/admin/AdminAuditTable';
import { VersionHistoryModal } from '@/components/admin/VersionHistoryModal';
import { Palette, ExternalLink, Loader2, RefreshCw, History, Trophy } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [users, setUsers] = useState<UserWithSettings[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [versions, setVersions] = useState<LandingPageVersion[]>([]);
  const [publishedVersionNumber, setPublishedVersionNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const loadData = async () => {
    try {
      const [m, u, a, p, v] = await Promise.all([
        getAdminDashboardMetrics(),
        getAllUsers(),
        getAuditLogs(),
        getPublishedLandingPage(),
        getLandingPageVersions(),
      ]);
      setMetrics(m);
      setUsers(u);
      setAuditLogs(a);
      setPublishedVersionNumber(p.versionNumber);
      setVersions(v);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function checkAuthAndLoad() {
      const user = await getCurrentSessionUser();
      if (!user || user.role !== 'admin') {
        router.replace('/admin/login');
        return;
      }
      setAuthorized(true);
      await loadData();
    }
    checkAuthAndLoad();
  }, [router]);

  if (!authorized || loading || !metrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="text-sm font-medium">Verificando permissões de Super Admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">Dashboard do Administrador</h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Visão geral de métricas, ranking de parceiros e sincronização das landing pages.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Histórico de Versões</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/admin/editor"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950/40 transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Abrir Editor Master</span>
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="p-6 space-y-8 overflow-y-auto">
          {/* Master Synchronization Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-800/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
                <span>Versão Publicada Oficial: #{publishedVersionNumber}</span>
              </div>
              <h2 className="text-lg font-extrabold text-white">
                Sincronização Global das Landing Pages
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                Todas as alterações publicadas no Editor Master refletem instantaneamente em todas as URLs dos parceiros, preservando os dados individuais de cada usuário (nome, foto, link de cadastro e WhatsApp).
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Restaurar Versão</span>
              </button>
              <Link
                href="/admin/editor"
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-lg"
              >
                Editar Conteúdo Master
              </Link>
              <Link
                href="/"
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <span>Ver ao Vivo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Metrics */}
          <AdminMetricsOverview metrics={metrics} />

          {/* Feature 2: Ranking de Desempenho (Leaderboard) */}
          <AdminLeaderboard topUsers={metrics.topUsers} />

          {/* Users Table */}
          <AdminUsersTable users={users} onUserStatusChanged={loadData} />

          {/* Audit Logs */}
          <AdminAuditTable logs={auditLogs} />
        </main>
      </div>

      {/* Feature 1: Histórico de Versões Modal */}
      <VersionHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        versions={versions}
        currentVersionNumber={publishedVersionNumber}
        testUsers={users}
        onRestored={() => {
          loadData();
        }}
      />
    </div>
  );
}

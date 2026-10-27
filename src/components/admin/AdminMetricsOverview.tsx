'use client';

import React from 'react';
import { AdminDashboardMetrics } from '@/types';
import { Users, UserCheck, UserX, Eye, MousePointerClick, MessageCircle, TrendingUp } from 'lucide-react';

interface AdminMetricsOverviewProps {
  metrics: AdminDashboardMetrics;
}

export function AdminMetricsOverview({ metrics }: AdminMetricsOverviewProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {/* Total Users */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Usuários
          </span>
          <Users className="w-4 h-4 text-purple-400" />
        </div>
        <p className="text-2xl font-extrabold text-white">{metrics.totalUsers}</p>
        <span className="text-[11px] text-slate-400">Cadastrados</span>
      </div>

      {/* Active Users */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Ativos
          </span>
          <UserCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-2xl font-extrabold text-emerald-400">{metrics.activeUsers}</p>
        <span className="text-[11px] text-slate-400">Páginas online</span>
      </div>

      {/* Blocked Users */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Bloqueados
          </span>
          <UserX className="w-4 h-4 text-red-400" />
        </div>
        <p className="text-2xl font-extrabold text-red-400">{metrics.blockedUsers}</p>
        <span className="text-[11px] text-slate-400">Contas suspensas</span>
      </div>

      {/* Total Views */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Acessos Globais
          </span>
          <Eye className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-2xl font-extrabold text-white">
          {metrics.totalViews.toLocaleString('pt-BR')}
        </p>
        <span className="text-[11px] text-slate-400">Visualizações</span>
      </div>

      {/* Reg Clicks */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Cliques Cadastro
          </span>
          <MousePointerClick className="w-4 h-4 text-indigo-400" />
        </div>
        <p className="text-2xl font-extrabold text-white">
          {metrics.totalRegistrationClicks.toLocaleString('pt-BR')}
        </p>
        <span className="text-[11px] text-slate-400">Links pessoais</span>
      </div>

      {/* WA Clicks */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Cliques WhatsApp
          </span>
          <MessageCircle className="w-4 h-4 text-green-400" />
        </div>
        <p className="text-2xl font-extrabold text-white">
          {metrics.totalWhatsappClicks.toLocaleString('pt-BR')}
        </p>
        <span className="text-[11px] text-slate-400">Contatos diretos</span>
      </div>

      {/* Global CTR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            CTR Global
          </span>
          <TrendingUp className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-2xl font-extrabold text-amber-400">{metrics.globalCtr}%</p>
        <span className="text-[11px] text-slate-400">Cliques / Acessos</span>
      </div>
    </div>
  );
}

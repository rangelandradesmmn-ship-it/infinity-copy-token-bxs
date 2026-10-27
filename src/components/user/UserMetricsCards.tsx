'use client';

import React from 'react';
import { UserMetrics } from '@/types';
import { Eye, UserCheck, MessageCircle, TrendingUp } from 'lucide-react';

interface UserMetricsCardsProps {
  metrics: UserMetrics;
}

export function UserMetricsCards({ metrics }: UserMetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Total Views */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total de Acessos
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold text-white">
          {metrics.total_views.toLocaleString('pt-BR')}
        </p>
        <p className="text-xs text-slate-400 mt-1">Visualizações únicas registradas</p>
      </div>

      {/* Registration Clicks */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cliques em Cadastro
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold text-white">
          {metrics.registration_clicks.toLocaleString('pt-BR')}
        </p>
        <p className="text-xs text-slate-400 mt-1">Cliques no seu link pessoal</p>
      </div>

      {/* WhatsApp Clicks */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cliques no WhatsApp
          </span>
          <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold text-white">
          {metrics.whatsapp_clicks.toLocaleString('pt-BR')}
        </p>
        <p className="text-xs text-slate-400 mt-1">Inícios de conversa direta</p>
      </div>

      {/* CTR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Taxa de Interação
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold text-white">
          {metrics.ctr}%
        </p>
        <p className="text-xs text-slate-400 mt-1">Relação cliques / acessos</p>
      </div>
    </div>
  );
}

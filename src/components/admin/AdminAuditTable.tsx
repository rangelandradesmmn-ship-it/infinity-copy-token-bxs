'use client';

import React from 'react';
import { AdminAuditLog } from '@/types';
import { ShieldCheck, History } from 'lucide-react';

interface AdminAuditTableProps {
  logs: AdminAuditLog[];
}

export function AdminAuditTable({ logs }: AdminAuditTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-bold text-white">Log de Auditoria Administrativa</h2>
      </div>
      <p className="text-xs text-slate-400 mb-6">
        Histórico transparente de publicações globais, bloqueios e alterações operacionais.
      </p>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-300 block mt-0.5">
                  {String(log.details?.note || log.details?.reason || JSON.stringify(log.details))}
                </span>
              </div>
            </div>

            <div className="text-slate-400 text-[11px] shrink-0 font-mono">
              {new Date(log.created_at).toLocaleString('pt-BR')}
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-6">
            Nenhum registro de auditoria disponível no momento.
          </p>
        )}
      </div>
    </div>
  );
}

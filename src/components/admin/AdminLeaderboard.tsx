'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserWithSettings } from '@/types';
import {
  Trophy,
  Medal,
  Award,
  Eye,
  MousePointerClick,
  MessageCircle,
  TrendingUp,
  ExternalLink,
  User,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

interface LeaderboardUser {
  user: UserWithSettings;
  views: number;
  regClicks: number;
  waClicks: number;
  ctr: number;
}

interface AdminLeaderboardProps {
  topUsers: LeaderboardUser[];
}

export function AdminLeaderboard({ topUsers }: AdminLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'views' | 'regClicks' | 'waClicks' | 'ctr'>('views');

  // Sort list dynamically based on chosen criteria
  const sorted = [...topUsers].sort((a, b) => {
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'regClicks') return b.regClicks - a.regClicks;
    if (sortBy === 'waClicks') return b.waClicks - a.waClicks;
    if (sortBy === 'ctr') return b.ctr - a.ctr;
    return 0;
  });

  const podium = sorted.slice(0, 3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header and sorting tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ranking de Desempenho dos Parceiros</h2>
            <p className="text-xs text-slate-400">
              Identifique quem gera mais tráfego, cadastros e conversões pelo WhatsApp.
            </p>
          </div>
        </div>

        {/* Sorting options */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl p-1 text-xs">
          <button
            type="button"
            onClick={() => setSortBy('views')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              sortBy === 'views' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Mais Acessos</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('regClicks')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              sortBy === 'regClicks'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Cliques Cadastro</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('waClicks')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              sortBy === 'waClicks'
                ? 'bg-green-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('ctr')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              sortBy === 'ctr'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>CTR (%)</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {podium.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {podium.map((item, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            const badgeColor = isFirst
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : isSecond
              ? 'bg-slate-400/20 text-slate-300 border-slate-400/40'
              : 'bg-amber-700/20 text-amber-600 border-amber-700/40';

            const borderHighlight = isFirst
              ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-slate-950'
              : 'border-slate-800 bg-slate-950/60';

            return (
              <div
                key={item.user.id}
                className={`p-5 rounded-2xl border ${borderHighlight} flex flex-col justify-between relative overflow-hidden shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeColor}`}
                    >
                      {isFirst ? (
                        <>
                          <Trophy className="w-3.5 h-3.5" /> 1º Lugar (Ouro)
                        </>
                      ) : isSecond ? (
                        <>
                          <Medal className="w-3.5 h-3.5" /> 2º Lugar (Prata)
                        </>
                      ) : (
                        <>
                          <Award className="w-3.5 h-3.5" /> 3º Lugar (Bronze)
                        </>
                      )}
                    </span>

                    <span className="text-xs font-mono text-blue-400">
                      /p/{item.user.slug}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0">
                      {item.user.settings?.profile_image_url ? (
                        <Image
                          src={item.user.settings.profile_image_url}
                          alt={item.user.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{item.user.name}</h3>
                      <p className="text-xs text-slate-400">{item.user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/90 rounded-xl text-center text-xs border border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Acessos</span>
                    <strong className="text-white text-sm">{item.views}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">Cadastros</span>
                    <strong className="text-emerald-400 text-sm">{item.regClicks}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block">WhatsApp</span>
                    <strong className="text-green-400 text-sm">{item.waClicks}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Ranked Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <th className="py-3 px-4 w-12 text-center">Posição</th>
              <th className="py-3 px-4">Parceiro</th>
              <th className="py-3 px-4 text-center">Acessos</th>
              <th className="py-3 px-4 text-center">Cliques Cadastro</th>
              <th className="py-3 px-4 text-center">Cliques WhatsApp</th>
              <th className="py-3 px-4 text-center">CTR (%)</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sorted.map((item, index) => {
              const position = index + 1;
              const isTop3 = position <= 3;

              return (
                <tr key={item.user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        position === 1
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : position === 2
                          ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                          : position === 3
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {position}º
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                        {item.user.settings?.profile_image_url ? (
                          <Image
                            src={item.user.settings.profile_image_url}
                            alt={item.user.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{item.user.name}</span>
                          {item.user.status === 'blocked' ? (
                            <ShieldAlert className="w-3 h-3 text-red-400" />
                          ) : (
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-blue-400">
                          /p/{item.user.slug}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-white text-xs">
                    {item.views}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400 text-xs">
                    {item.regClicks}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-green-400 text-xs">
                    {item.waClicks}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-bold text-purple-400 text-xs">{item.ctr}%</span>
                      <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden md:block">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(item.ctr, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/p/${item.user.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                      title="Abrir página pública"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

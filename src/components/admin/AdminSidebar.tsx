'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Palette,
  Users,
  History,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Visão Geral',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      label: 'Editor Master',
      href: '/admin/editor',
      icon: Palette,
      active: pathname === '/admin/editor',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
          A
        </div>
        <div>
          <span className="font-extrabold text-white text-sm tracking-tight block">
            Super Admin
          </span>
          <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase block">
            Controle Master
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="p-4 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href="/painel"
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ver Painel do Usuário</span>
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>Página Principal (Master)</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}

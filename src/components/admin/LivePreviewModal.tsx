'use client';

import React, { useState } from 'react';
import { LandingPageContent, UserWithSettings } from '@/types';
import { LandingRenderer } from '@/components/landing/LandingRenderer';
import { Smartphone, Monitor, X, ShieldCheck, User } from 'lucide-react';

interface LivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: LandingPageContent;
  testUsers: UserWithSettings[];
}

export function LivePreviewModal({
  isOpen,
  onClose,
  content,
  testUsers,
}: LivePreviewModalProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedUserSlug, setSelectedUserSlug] = useState<string>('master');

  if (!isOpen) return null;

  const selectedUser =
    selectedUserSlug === 'master'
      ? undefined
      : testUsers.find((u) => u.slug === selectedUserSlug);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col">
      {/* Top Controls Bar */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-white">Prévia em Tempo Real</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
            Modo Rascunho / Não Publicado
          </span>
        </div>

        {/* Affiliate Selector & Device Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Visualizar como:</span>
            <select
              value={selectedUserSlug}
              onChange={(e) => setSelectedUserSlug(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="master">Página Master (Matriz Oficial)</option>
              {testUsers
                .filter((u) => u.role !== 'admin')
                .map((u) => (
                  <option key={u.id} value={u.slug}>
                    Parceiro: {u.name} (/p/{u.slug})
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded-lg transition-colors ${
                device === 'desktop' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Prévia Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded-lg transition-colors ${
                device === 'mobile' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Prévia Mobile (390px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 sm:p-6 flex items-start justify-center">
        <div
          className={`transition-all duration-300 bg-slate-950 rounded-2xl overflow-y-auto shadow-2xl border border-slate-800 ${
            device === 'mobile'
              ? 'w-[390px] h-[780px] border-4 border-slate-700 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8)]'
              : 'w-full h-full max-w-6xl'
          }`}
        >
          <LandingRenderer content={content} user={selectedUser} isPreview={true} />
        </div>
      </div>
    </div>
  );
}

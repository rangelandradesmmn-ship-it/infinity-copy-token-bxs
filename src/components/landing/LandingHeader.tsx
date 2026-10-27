'use client';

import React from 'react';
import Link from 'next/link';
import { UserWithSettings, LandingPageContent } from '@/types';
import { MessageCircle, LogIn, ShieldCheck } from 'lucide-react';

interface LandingHeaderProps {
  brand: LandingPageContent['brand'];
  user?: UserWithSettings;
  whatsAppUrl: string;
  onWhatsAppClick: () => void;
  isPreview?: boolean;
}

export function LandingHeader({
  brand,
  user,
  whatsAppUrl,
  onWhatsAppClick,
  isPreview = false,
}: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          {brand.logoUrl ? (
            <div className="h-9 flex items-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-9 w-auto max-w-[180px] object-contain rounded-lg"
              />
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md shrink-0"
              style={{ backgroundColor: brand.primaryColor || '#2563eb' }}
            >
              {brand.name ? brand.name.charAt(0).toUpperCase() : 'N'}
            </div>
          )}
          <span className="font-bold text-white text-base sm:text-lg tracking-tight">
            {brand.name}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user.name}</span>
            </div>
          ) : null}

          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWhatsAppClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/60 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}

          {!isPreview && (
            <Link
              href="/painel"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Área do Membro</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

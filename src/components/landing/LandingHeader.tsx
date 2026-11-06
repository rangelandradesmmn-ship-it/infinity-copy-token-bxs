'use client';

import React from 'react';
import Link from 'next/link';
import { UserWithSettings, LandingPageContent } from '@/types';
import { MessageCircle, LogIn, ShieldCheck, ExternalLink, Calculator } from 'lucide-react';

interface LandingHeaderProps {
  brand: LandingPageContent['brand'];
  user?: UserWithSettings;
  whatsAppUrl: string;
  onWhatsAppClick: () => void;
  isPreview?: boolean;
  backofficeUrl?: string;
  backofficeButtonText?: string;
  backofficeEnabled?: boolean;
  simulatorUrl?: string;
  simulatorButtonText?: string;
  simulatorEnabled?: boolean;
}

export function LandingHeader({
  brand,
  user,
  whatsAppUrl,
  onWhatsAppClick,
  isPreview = false,
  backofficeUrl = 'https://www.infinitycopy.pro/login',
  backofficeButtonText = 'Acessar backoffice',
  backofficeEnabled = true,
  simulatorUrl = 'https://calculadora-bxsignals.vercel.app/',
  simulatorButtonText = 'SIMULADOR ONLINE',
  simulatorEnabled = true,
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
          <span className="font-bold text-white text-sm sm:text-base md:text-lg tracking-tight truncate max-w-[130px] sm:max-w-none">
            {brand.name}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 hover:bg-emerald-900/60 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}

          {simulatorEnabled !== false && simulatorUrl && (
            <a
              href={simulatorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 shadow-sm shadow-emerald-600/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              title={simulatorButtonText || 'SIMULADOR ONLINE'}
            >
              <Calculator className="w-3.5 h-3.5 shrink-0 text-emerald-100" />
              <span className="hidden sm:inline">{simulatorButtonText || 'SIMULADOR ONLINE'}</span>
              <span className="sm:hidden">Simulador</span>
            </a>
          )}

          {backofficeEnabled !== false && backofficeUrl && (
            <a
              href={backofficeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 shadow-sm shadow-blue-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              title={backofficeButtonText || 'Acessar backoffice'}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-blue-100" />
              <span className="hidden sm:inline">{backofficeButtonText || 'Acessar backoffice'}</span>
              <span className="sm:hidden">Backoffice</span>
            </a>
          )}

          {!isPreview && (
            <Link
              href="/painel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-lg text-xs sm:text-sm font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Área do Membro</span>
              <span className="sm:hidden">Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

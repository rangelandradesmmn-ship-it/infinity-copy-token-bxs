'use client';

import React from 'react';
import { UserWithSettings, LandingPageContent } from '@/types';
import { ShieldCheck } from 'lucide-react';

interface FooterSectionProps {
  footer: LandingPageContent['footer'];
  brand: LandingPageContent['brand'];
  user?: UserWithSettings;
}

export function FooterSection({ footer, brand, user }: FooterSectionProps) {
  return (
    <footer className="py-12 bg-slate-950 border-t border-slate-900 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <div className="h-8 flex items-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="h-8 w-auto max-w-[140px] object-contain rounded-md"
                />
              </div>
            ) : null}
            <div>
              <span className="text-base font-bold text-white tracking-tight block">
                {brand.name}
              </span>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Página Oficial do Parceiro: <strong>{user.name}</strong></span>
            </div>
          )}

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <a href={footer.privacyLink} className="hover:text-white transition-colors">
              Política de Privacidade (LGPD)
            </a>
            <a href={footer.termsLink} className="hover:text-white transition-colors">
              Termos de Uso
            </a>
          </div>
        </div>

        <div className="pt-6 text-center text-xs text-slate-400 leading-relaxed max-w-3xl mx-auto">
          <p>{footer.legalText}</p>
          <p className="mt-2 text-slate-400">
            © {new Date().getFullYear()} {footer.companyName}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

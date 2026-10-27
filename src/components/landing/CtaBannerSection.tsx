'use client';

import React from 'react';
import { LandingPageContent } from '@/types';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';

interface CtaBannerSectionProps {
  ctaBanner: LandingPageContent['ctaBanner'];
  brand: LandingPageContent['brand'];
  registrationUrl: string;
  whatsAppUrl: string;
  onRegistrationClick: () => void;
  onWhatsAppClick: () => void;
}

export function CtaBannerSection({
  ctaBanner,
  brand,
  registrationUrl,
  whatsAppUrl,
  onRegistrationClick,
  onWhatsAppClick,
}: CtaBannerSectionProps) {
  if (!ctaBanner.enabled) return null;

  return (
    <section className="py-20 md:py-28 bg-slate-950 text-white relative overflow-hidden">
      {/* Background radial gradient */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${brand.primaryColor || '#2563eb'} 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center shadow-2xl relative">
          {ctaBanner.urgencyBadge && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{ctaBanner.urgencyBadge}</span>
            </div>
          )}

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
            {ctaBanner.title}
          </h2>

          <p className="text-slate-300 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {ctaBanner.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onRegistrationClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: brand.primaryColor || '#2563eb' }}
            >
              <span>{ctaBanner.ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onWhatsAppClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-semibold text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>{ctaBanner.whatsappCtaText}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

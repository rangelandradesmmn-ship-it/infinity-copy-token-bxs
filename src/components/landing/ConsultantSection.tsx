'use client';

import React from 'react';
import Image from 'next/image';
import { UserWithSettings, LandingPageContent } from '@/types';
import { ShieldCheck, MessageCircle, User, Award, CheckCircle } from 'lucide-react';

interface ConsultantSectionProps {
  consultantSection: LandingPageContent['consultantSection'];
  user?: UserWithSettings;
  whatsAppUrl: string;
  onWhatsAppClick: () => void;
  accentColor?: string;
}

export function ConsultantSection({
  consultantSection,
  user,
  whatsAppUrl,
  onWhatsAppClick,
}: ConsultantSectionProps) {
  if (!consultantSection.enabled) return null;

  const displayName = user?.name || 'Equipe Central de Atendimento';
  const profileImageUrl = user?.settings?.profile_image_url;

  return (
    <section className="py-16 md:py-20 bg-slate-900/90 border-y border-slate-800 text-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            {/* Avatar / Photo */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-emerald-500 shadow-xl bg-slate-800 flex items-center justify-center relative">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={displayName}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-slate-400" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-2 rounded-full shadow-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Content & Details */}
            <div className="text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-3">
                <Award className="w-3.5 h-3.5" />
                <span>{consultantSection.consultantLabel}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                {displayName}
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                {consultantSection.customDescription}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-slate-400 mb-6">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Atendimento Personalizado
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Suporte Direto
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Credencial Verificada
                </span>
              </div>

              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onWhatsAppClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950 transition-all duration-200"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Falar Diretamente com {displayName.split(' ')[0]}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

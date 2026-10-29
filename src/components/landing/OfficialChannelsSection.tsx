'use client';

import React from 'react';
import { OfficialChannels, LandingPageContent } from '@/types';
import { MessageCircle, Send, Video, ExternalLink, Sparkles, Clock, Users } from 'lucide-react';

interface OfficialChannelsSectionProps {
  officialChannels?: OfficialChannels;
  brand: LandingPageContent['brand'];
}

export function OfficialChannelsSection({
  officialChannels,
  brand,
}: OfficialChannelsSectionProps) {
  if (!officialChannels || !officialChannels.enabled) return null;

  const { whatsappGroup, telegramGroup, googleMeet } = officialChannels;

  // Don't render if all 3 channels are disabled
  const hasAnyChannel =
    (whatsappGroup?.enabled && whatsappGroup?.url) ||
    (telegramGroup?.enabled && telegramGroup?.url) ||
    (googleMeet?.enabled && googleMeet?.url);

  if (!hasAnyChannel) return null;

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden border-t border-slate-800/80">
      {/* Decorative background glows */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: '#25D366' }}
      />
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: '#229ED9' }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          {officialChannels.badge && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 backdrop-blur-md mb-4 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{officialChannels.badge}</span>
            </div>
          )}

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            {officialChannels.title}
          </h2>

          {officialChannels.subtitle && (
            <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed">
              {officialChannels.subtitle}
            </p>
          )}
        </div>

        {/* 3 Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* 1. WhatsApp Official Group */}
          {whatsappGroup?.enabled && whatsappGroup?.url && (
            <div className="group relative flex flex-col justify-between p-7 rounded-3xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/70 transition-all duration-300 shadow-xl shadow-emerald-950/20 hover:shadow-emerald-900/30 hover:-translate-y-1">
              {/* Card top badge */}
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="w-13 h-13 w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner">
                  <MessageCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-800/80 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  WhatsApp VIP
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  Grupo Oficial WhatsApp
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  {whatsappGroup.description ||
                    'Participe da nossa comunidade oficial no WhatsApp, troque experiências e receba avisos prioritários.'}
                </p>
              </div>

              <a
                href={whatsappGroup.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-950/50 transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{whatsappGroup.buttonText || 'Entrar no Grupo WhatsApp'}</span>
                <ExternalLink className="w-4 h-4 ml-auto opacity-70" />
              </a>
            </div>
          )}

          {/* 2. Telegram Official Group/Channel */}
          {telegramGroup?.enabled && telegramGroup?.url && (
            <div className="group relative flex flex-col justify-between p-7 rounded-3xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-500/70 transition-all duration-300 shadow-xl shadow-sky-950/20 hover:shadow-sky-900/30 hover:-translate-y-1">
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner">
                  <Send className="w-6 h-6 text-sky-400" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-950/80 border border-sky-800/80 text-sky-300">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  Telegram
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">
                  Canal Oficial Telegram
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  {telegramGroup.description ||
                    'Receba alertas em tempo real, análises de mercado, vídeos e materiais oficiais diretamente no Telegram.'}
                </p>
              </div>

              <a
                href={telegramGroup.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 shadow-lg shadow-sky-950/50 transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                <span>{telegramGroup.buttonText || 'Entrar no Canal Telegram'}</span>
                <ExternalLink className="w-4 h-4 ml-auto opacity-70" />
              </a>
            </div>
          )}

          {/* 3. Google Meet Room */}
          {googleMeet?.enabled && googleMeet?.url && (
            <div className="group relative flex flex-col justify-between p-7 rounded-3xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/70 transition-all duration-300 shadow-xl shadow-amber-950/20 hover:shadow-amber-900/30 hover:-translate-y-1">
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner">
                  <Video className="w-6 h-6 text-amber-400" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-800/80 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Ao Vivo
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                  Sala Google Meet
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {googleMeet.description ||
                    'Participe das nossas apresentações oficiais ao vivo, tire dúvidas com líderes e assista às mentorias práticas.'}
                </p>

                {googleMeet.scheduleText && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-amber-300/90 mb-6">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{googleMeet.scheduleText}</span>
                  </div>
                )}
              </div>

              <a
                href={googleMeet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-950/50 transition-all duration-200"
              >
                <Video className="w-4 h-4 text-slate-950" />
                <span>{googleMeet.buttonText || 'Acessar Sala Google Meet'}</span>
                <ExternalLink className="w-4 h-4 ml-auto opacity-70" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

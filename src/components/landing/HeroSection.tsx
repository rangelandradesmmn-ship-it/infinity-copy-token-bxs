'use client';

import React from 'react';
import Image from 'next/image';
import { UserWithSettings, LandingPageContent, OfficialChannels } from '@/types';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { Sparkles, ArrowRight, MessageCircle, ShieldCheck, User, Send, Video } from 'lucide-react';
import { FONT_FAMILY_MAP } from './LandingRenderer';

interface HeroSectionProps {
  hero: LandingPageContent['hero'];
  brand: LandingPageContent['brand'];
  officialChannels?: OfficialChannels;
  user?: UserWithSettings;
  registrationUrl: string;
  whatsAppUrl: string;
  onRegistrationClick: () => void;
  onWhatsAppClick: () => void;
}

const TITLE_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-2xl sm:text-3xl lg:text-4xl leading-tight', // Compacto (excelente para caber textos longos)
  md: 'text-3xl sm:text-4xl lg:text-5xl leading-tight', // Médio equilibrado
  lg: 'text-4xl sm:text-5xl lg:text-6xl leading-[1.12]', // Grande
  xl: 'text-5xl sm:text-6xl lg:text-7xl leading-[1.08]', // Extra grande
};

const TITLE_MAX_WIDTH_CLASSES: Record<string, string> = {
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  'full': 'max-w-full',
};

const SUBTITLE_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-sm sm:text-base md:text-lg',
  md: 'text-base sm:text-lg md:text-xl',
  lg: 'text-lg sm:text-xl md:text-2xl',
};

export function HeroSection({
  hero,
  brand,
  officialChannels,
  user,
  registrationUrl,
  whatsAppUrl,
  onRegistrationClick,
  onWhatsAppClick,
}: HeroSectionProps) {
  if (!hero.enabled) return null;

  const displayName = user?.name || 'Consultor Oficial';
  const profileImageUrl = user?.settings?.profile_image_url;

  // Resolve heading typography and sizing
  const headingFont = FONT_FAMILY_MAP[hero.fontFamily || brand.headingFontFamily || brand.fontFamily || 'Inter'] || undefined;
  const titleSizeClass = TITLE_SIZE_CLASSES[hero.titleSize || 'md'] || TITLE_SIZE_CLASSES['md'];
  const titleMaxWidthClass = TITLE_MAX_WIDTH_CLASSES[hero.titleMaxWidth || '4xl'] || 'max-w-4xl';
  const subtitleSizeClass = SUBTITLE_SIZE_CLASSES[hero.subtitleSize || 'md'] || SUBTITLE_SIZE_CLASSES['md'];

  const customTitleStyle: React.CSSProperties = {
    ...(headingFont ? { fontFamily: headingFont } : {}),
    ...(hero.titleFontSizePx
      ? {
          fontSize: `clamp(${Math.max(20, Math.round(hero.titleFontSizePx * 0.62))}px, 4.5vw, ${hero.titleFontSizePx}px)`,
          lineHeight: 1.15,
        }
      : {}),
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background Decorative Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] md:w-[900px] md:h-[500px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: brand.primaryColor || '#2563eb' }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className={`text-center ${titleMaxWidthClass} mx-auto mb-10`}>
          {/* Badge */}
          {hero.badge && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 backdrop-blur-md mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{hero.badge}</span>
            </div>
          )}

          {/* Heading with configurable font size & font family */}
          <h1
            className={`${titleSizeClass} font-extrabold tracking-tight mb-6`}
            style={customTitleStyle}
          >
            <span>{hero.title} </span>
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400"
              style={{
                backgroundImage: `linear-gradient(to right, ${brand.primaryColor || '#3b82f6'}, ${brand.accentColor || '#10b981'})`,
              }}
            >
              {hero.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`${subtitleSizeClass} text-slate-300 leading-relaxed mb-8`}>
            {hero.subtitle}
          </p>

          {/* Dynamic Consultant Card (if enabled and user exists) */}
          {hero.showConsultantCard && (
            <div className="inline-flex items-center gap-3.5 p-2 pr-5 rounded-full bg-slate-800/90 border border-slate-700/90 backdrop-blur-md mb-8 shadow-lg">
              <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-700 border-2 border-emerald-500/80 flex items-center justify-center shrink-0">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={displayName}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                    {user ? 'Parceiro Credenciado' : 'Matriz Oficial'}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-sm font-bold text-white leading-tight">
                  {displayName}
                </p>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onRegistrationClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold text-white shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              style={{ backgroundColor: brand.primaryColor || '#2563eb' }}
            >
              <span>{hero.primaryCtaText}</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onWhatsAppClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl text-base font-semibold text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                <span>{hero.secondaryCtaText}</span>
              </a>
            )}
          </div>

          {/* Quick Channels Buttons: WhatsApp Group, Telegram & Google Meet */}
          {officialChannels?.enabled && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                Canais Oficiais:
              </span>
              {officialChannels.whatsappGroup?.enabled && officialChannels.whatsappGroup?.url && (
                <a
                  href={officialChannels.whatsappGroup.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-105"
                  title="Grupo Oficial no WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{officialChannels.whatsappGroup.buttonText || 'Grupo WhatsApp'}</span>
                </a>
              )}
              {officialChannels.telegramGroup?.enabled && officialChannels.telegramGroup?.url && (
                <a
                  href={officialChannels.telegramGroup.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-300 hover:text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-105"
                  title="Canal Oficial no Telegram"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>{officialChannels.telegramGroup.buttonText || 'Telegram'}</span>
                </a>
              )}
              {officialChannels.googleMeet?.enabled && officialChannels.googleMeet?.url && (
                <a
                  href={officialChannels.googleMeet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold transition-all duration-200 shadow-sm hover:scale-105"
                  title="Sala de Reunião Google Meet"
                >
                  <Video className="w-3.5 h-3.5 text-amber-400" />
                  <span>{officialChannels.googleMeet.buttonText || 'Google Meet'}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hero Video */}
        {hero.mainVideo && hero.mainVideo.url && (
          <div className="max-w-4xl mx-auto mt-6">
            <VideoPlayer
              url={hero.mainVideo.url}
              title={hero.mainVideo.title}
              aspectRatio={hero.mainVideo.aspectRatio}
              badge={hero.mainVideo.badge}
            />
          </div>
        )}
      </div>
    </section>
  );
}

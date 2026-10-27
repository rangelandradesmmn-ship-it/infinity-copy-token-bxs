'use client';

import React from 'react';
import Image from 'next/image';
import { UserWithSettings, LandingPageContent } from '@/types';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { Sparkles, ArrowRight, MessageCircle, ShieldCheck, User } from 'lucide-react';

interface HeroSectionProps {
  hero: LandingPageContent['hero'];
  brand: LandingPageContent['brand'];
  user?: UserWithSettings;
  registrationUrl: string;
  whatsAppUrl: string;
  onRegistrationClick: () => void;
  onWhatsAppClick: () => void;
}

export function HeroSection({
  hero,
  brand,
  user,
  registrationUrl,
  whatsAppUrl,
  onRegistrationClick,
  onWhatsAppClick,
}: HeroSectionProps) {
  if (!hero.enabled) return null;

  const displayName = user?.name || 'Consultor Oficial';
  const profileImageUrl = user?.settings?.profile_image_url;

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background Decorative Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] md:w-[900px] md:h-[500px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: brand.primaryColor || '#2563eb' }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          {/* Badge */}
          {hero.badge && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs sm:text-sm font-medium text-slate-200 backdrop-blur-md mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{hero.badge}</span>
            </div>
          )}

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6">
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
          <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed mb-8">
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

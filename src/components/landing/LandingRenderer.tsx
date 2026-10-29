'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { UserWithSettings, LandingPageContent } from '@/types';
import { initialLandingPageContent } from '@/data/defaultLandingPage';
import { buildWhatsAppUrl } from '@/lib/security';
import { recordLandingEvent } from '@/lib/dataService';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { OfficialChannelsSection } from './OfficialChannelsSection';
import { VideosSection } from './VideosSection';
import { BenefitsSection } from './BenefitsSection';
import { ConsultantSection } from './ConsultantSection';
import { TestimonialsSection } from './TestimonialsSection';
import { FaqSection } from './FaqSection';
import { TokenChartSection } from './TokenChartSection';
import { CtaBannerSection } from './CtaBannerSection';
import { FooterSection } from './FooterSection';

interface LandingRendererProps {
  content: LandingPageContent;
  user?: UserWithSettings;
  isPreview?: boolean;
}

export const FONT_FAMILY_MAP: Record<string, string> = {
  'Inter': "'Inter', sans-serif",
  'Montserrat': "'Montserrat', sans-serif",
  'Poppins': "'Poppins', sans-serif",
  'Plus Jakarta Sans': "'Plus Jakarta Sans', sans-serif",
  'Outfit': "'Outfit', sans-serif",
  'Oswald': "'Oswald', sans-serif",
  'Space Grotesk': "'Space Grotesk', sans-serif",
  'Roboto': "'Roboto', sans-serif",
  'System': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

export function LandingRenderer({
  content,
  user,
  isPreview = false,
}: LandingRendererProps) {
  const activeFont = FONT_FAMILY_MAP[content.brand?.fontFamily || 'Inter'] || FONT_FAMILY_MAP['Inter'];
  // 1. Resolve registration URL: user's personal link or master default
  const registrationUrl = useMemo(() => {
    if (user?.settings?.registration_url && user.settings.registration_url.trim()) {
      return user.settings.registration_url.trim();
    }
    return content.defaultSettings.registrationUrl || '#';
  }, [user, content]);

  // 2. Resolve WhatsApp URL: user's WhatsApp or master default
  const whatsAppUrl = useMemo(() => {
    if (user?.settings?.whatsapp_number && user.settings.whatsapp_number.trim()) {
      return buildWhatsAppUrl(
        user.settings.whatsapp_country_code || '+55',
        user.settings.whatsapp_number,
        user.settings.whatsapp_message || content.defaultSettings.whatsappMessage
      );
    }
    if (content.defaultSettings.whatsappNumber) {
      return buildWhatsAppUrl(
        content.defaultSettings.whatsappCountryCode || '+55',
        content.defaultSettings.whatsappNumber,
        content.defaultSettings.whatsappMessage
      );
    }
    return '';
  }, [user, content]);

  // 3. Resolve official channels: guaranteed fallback to initial default
  const officialChannels = useMemo(() => {
    return content.officialChannels || initialLandingPageContent.officialChannels;
  }, [content.officialChannels]);

  // Page path for telemetry
  const pagePath = user ? `/p/${user.slug}` : '/';

  // 3. Track page_view event on mount
  useEffect(() => {
    if (isPreview) return;

    recordLandingEvent({
      user_id: user?.id || null,
      event_type: 'page_view',
      page_path: pagePath,
      metadata: {
        slug: user?.slug || 'master',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      },
    });
  }, [user, isPreview, pagePath]);

  // 4. Track registration click
  const handleRegistrationClick = useCallback(() => {
    if (isPreview) return;
    recordLandingEvent({
      user_id: user?.id || null,
      event_type: 'registration_click',
      page_path: pagePath,
      metadata: {
        target_url: registrationUrl,
      },
    });
  }, [user, isPreview, pagePath, registrationUrl]);

  // 5. Track WhatsApp click
  const handleWhatsAppClick = useCallback(() => {
    if (isPreview) return;
    recordLandingEvent({
      user_id: user?.id || null,
      event_type: 'whatsapp_click',
      page_path: pagePath,
      metadata: {
        target_url: whatsAppUrl,
      },
    });
  }, [user, isPreview, pagePath, whatsAppUrl]);

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white"
      style={{ fontFamily: activeFont }}
    >
      {/* Navigation Header */}
      <LandingHeader
        brand={content.brand}
        user={user}
        whatsAppUrl={whatsAppUrl}
        onWhatsAppClick={handleWhatsAppClick}
        isPreview={isPreview}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          hero={content.hero}
          brand={content.brand}
          officialChannels={officialChannels}
          user={user}
          registrationUrl={registrationUrl}
          whatsAppUrl={whatsAppUrl}
          onRegistrationClick={handleRegistrationClick}
          onWhatsAppClick={handleWhatsAppClick}
        />

        {/* Videos Section */}
        <VideosSection videosSection={content.videosSection} />

        {/* Official Channels & Live Meeting Rooms */}
        <OfficialChannelsSection
          officialChannels={officialChannels}
          brand={content.brand}
        />

        {/* Benefits Grid */}
        <BenefitsSection
          benefitsSection={content.benefitsSection}
          primaryColor={content.brand.primaryColor}
        />

        {/* Dynamic Consultant Spotlight */}
        <ConsultantSection
          consultantSection={content.consultantSection}
          user={user}
          whatsAppUrl={whatsAppUrl}
          onWhatsAppClick={handleWhatsAppClick}
          accentColor={content.brand.accentColor}
        />

        {/* Testimonials */}
        <TestimonialsSection testimonialsSection={content.testimonialsSection} />

        {/* FAQ Accordion */}
        <FaqSection faqSection={content.faqSection} />

        {/* Real-time Token Chart Section & Copy Contract Button */}
        <TokenChartSection
          tokenSection={
            content.tokenSection || {
              enabled: true,
              badge: '🟢 Gráfico em Tempo Real',
              title: 'Acompanhe a Cotação do Token BXS',
              subtitle:
                'Monitoramento ao vivo de preço, liquidez e negociações descentralizadas na rede Binance Smart Chain (BSC).',
              tokenSymbol: 'BXS',
              tokenName: 'BXSignals Token',
              network: 'BNB Smart Chain (BEP-20)',
              contractAddress: '0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
              copyButtonText: 'copie o contrato da BXS',
              chartProvider: 'geckoterminal',
              embedUrl:
                'https://www.geckoterminal.com/bsc/pools/0xd4ad1ce50f942f2f036f1f759ff3eb785d77a7a2e71db52849a37ad28e4295ab?embed=1&info=0&swaps=0&grayscale=0&light_chart=0',
              coinMarketCapUrl:
                'https://dex.coinmarketcap.com/token/bsc/0xadcea94f46ce8a87b890d7da9a444b4a21811a76/',
              bscScanUrl:
                'https://bscscan.com/token/0xadcea94f46ce8a87b890d7da9a444b4a21811a76',
            }
          }
          primaryColor={content.brand.primaryColor}
        />

        {/* Final CTA Banner */}
        <CtaBannerSection
          ctaBanner={content.ctaBanner}
          brand={content.brand}
          registrationUrl={registrationUrl}
          whatsAppUrl={whatsAppUrl}
          onRegistrationClick={handleRegistrationClick}
          onWhatsAppClick={handleWhatsAppClick}
        />
      </main>

      {/* Footer */}
      <FooterSection footer={content.footer} brand={content.brand} user={user} />
    </div>
  );
}

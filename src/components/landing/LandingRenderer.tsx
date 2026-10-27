'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { UserWithSettings, LandingPageContent } from '@/types';
import { buildWhatsAppUrl } from '@/lib/security';
import { recordLandingEvent } from '@/lib/dataService';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { VideosSection } from './VideosSection';
import { BenefitsSection } from './BenefitsSection';
import { ConsultantSection } from './ConsultantSection';
import { TestimonialsSection } from './TestimonialsSection';
import { FaqSection } from './FaqSection';
import { CtaBannerSection } from './CtaBannerSection';
import { FooterSection } from './FooterSection';

interface LandingRendererProps {
  content: LandingPageContent;
  user?: UserWithSettings;
  isPreview?: boolean;
}

export function LandingRenderer({
  content,
  user,
  isPreview = false,
}: LandingRendererProps) {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
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
          user={user}
          registrationUrl={registrationUrl}
          whatsAppUrl={whatsAppUrl}
          onRegistrationClick={handleRegistrationClick}
          onWhatsAppClick={handleWhatsAppClick}
        />

        {/* Videos Section */}
        <VideosSection videosSection={content.videosSection} />

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

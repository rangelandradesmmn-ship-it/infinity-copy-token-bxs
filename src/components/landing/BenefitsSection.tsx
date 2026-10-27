'use client';

import React from 'react';
import { LandingPageContent } from '@/types';
import {
  Zap,
  ShieldCheck,
  TrendingUp,
  Users,
  Award,
  Headphones,
  CheckCircle,
  LucideIcon,
} from 'lucide-react';

interface BenefitsSectionProps {
  benefitsSection: LandingPageContent['benefitsSection'];
  primaryColor?: string;
}

const iconMap: Record<string, LucideIcon> = {
  Zap,
  ShieldCheck,
  TrendingUp,
  Users,
  Award,
  Headphones,
  CheckCircle,
};

export function BenefitsSection({ benefitsSection, primaryColor = '#2563eb' }: BenefitsSectionProps) {
  if (!benefitsSection.enabled || !benefitsSection.items.length) return null;

  return (
    <section className="py-16 md:py-24 bg-slate-950 text-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">
            {benefitsSection.title}
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            {benefitsSection.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefitsSection.items.map((item) => {
            const IconComponent = iconMap[item.icon] || CheckCircle;

            return (
              <div
                key={item.id}
                className="group relative p-6 sm:p-7 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                  }}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

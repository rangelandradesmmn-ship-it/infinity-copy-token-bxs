'use client';

import React from 'react';
import Image from 'next/image';
import { LandingPageContent } from '@/types';
import { Star, Quote } from 'lucide-react';

interface TestimonialsSectionProps {
  testimonialsSection: LandingPageContent['testimonialsSection'];
}

export function TestimonialsSection({ testimonialsSection }: TestimonialsSectionProps) {
  if (!testimonialsSection.enabled || !testimonialsSection.items.length) return null;

  return (
    <section className="py-16 md:py-24 bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">
            {testimonialsSection.title}
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            {testimonialsSection.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonialsSection.items.map((t) => (
            <div
              key={t.id}
              className="flex flex-col justify-between p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative"
            >
              <div>
                {/* Star rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-slate-700/60 mb-2" />
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* User info */}
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-800/80">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                  <Image
                    src={t.avatarUrl}
                    alt={t.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

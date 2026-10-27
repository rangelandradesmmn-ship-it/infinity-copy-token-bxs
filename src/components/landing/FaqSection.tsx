'use client';

import React, { useState } from 'react';
import { LandingPageContent } from '@/types';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqSectionProps {
  faqSection: LandingPageContent['faqSection'];
}

export function FaqSection({ faqSection }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqSection.enabled || !faqSection.items.length) return null;

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 md:py-24 bg-slate-900 border-t border-slate-800 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Tire Suas Dúvidas</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">
            {faqSection.title}
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            {faqSection.subtitle}
          </p>
        </div>

        <div className="space-y-4">
          {faqSection.items.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden transition-colors duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-white hover:text-blue-400 transition-colors"
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-slate-900 pt-4">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
